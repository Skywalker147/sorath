const db = require('../config/db');

class ReturnModel {
  // Generate unique return number
  static generateReturnNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `RET-${timestamp}${random}`;
  }

  // Get all return orders with filters
  static async getAllReturns(filters = {}, userRole = null, userId = null) {
    let query = `
      SELECT 
        ro.id, ro.return_number, ro.original_order_id, ro.warehouse_id, 
        ro.dealer_id, ro.salesman_id, ro.item_id, ro.quantity, ro.reason,
        ro.return_date, ro.status, ro.created_at,
        w.name as warehouse_name, w.address as warehouse_address,
        d.name as dealer_name, d.agency_name as dealer_agency, d.mobile_number as dealer_mobile,
        s.name as salesman_name, s.mobile_number as salesman_mobile,
        i.name as item_name, i.price as item_price,
        o.order_number as original_order_number
      FROM return_orders ro
      JOIN warehouses w ON ro.warehouse_id = w.id
      LEFT JOIN dealers d ON ro.dealer_id = d.id
      LEFT JOIN salesmen s ON ro.salesman_id = s.id
      JOIN items i ON ro.item_id = i.id
      LEFT JOIN orders o ON ro.original_order_id = o.id
    `;
    
    let params = [];
    let conditions = [];

    // Role-based filtering
    if (userRole === 'warehouse') {
      conditions.push('ro.warehouse_id = ?');
      params.push(userId);
    }

    if (filters.warehouseId) {
      conditions.push('ro.warehouse_id = ?');
      params.push(filters.warehouseId);
    }

    if (filters.dealerId) {
      conditions.push('ro.dealer_id = ?');
      params.push(filters.dealerId);
    }

    if (filters.salesmanId) {
      conditions.push('ro.salesman_id = ?');
      params.push(filters.salesmanId);
    }

    if (filters.status) {
      conditions.push('ro.status = ?');
      params.push(filters.status);
    }

    if (filters.itemId) {
      conditions.push('ro.item_id = ?');
      params.push(filters.itemId);
    }

    if (filters.search) {
      conditions.push('(ro.return_number LIKE ? OR d.name LIKE ? OR d.agency_name LIKE ? OR s.name LIKE ? OR i.name LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.startDate) {
      conditions.push('DATE(ro.return_date) >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('DATE(ro.return_date) <= ?');
      params.push(filters.endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY ro.created_at DESC`;

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Get return order by ID
  static async getReturnById(id, userRole = null, userId = null) {
    let query = `
      SELECT 
        ro.*, 
        w.name as warehouse_name, w.address as warehouse_address,
        d.name as dealer_name, d.agency_name as dealer_agency, 
        d.address as dealer_address, d.mobile_number as dealer_mobile,
        s.name as salesman_name, s.mobile_number as salesman_mobile,
        i.name as item_name, i.price as item_price,
        o.order_number as original_order_number
      FROM return_orders ro
      JOIN warehouses w ON ro.warehouse_id = w.id
      LEFT JOIN dealers d ON ro.dealer_id = d.id
      LEFT JOIN salesmen s ON ro.salesman_id = s.id
      JOIN items i ON ro.item_id = i.id
      LEFT JOIN orders o ON ro.original_order_id = o.id
      WHERE ro.id = ?
    `;

    // Role-based access control
    if (userRole === 'warehouse') {
      query += ` AND ro.warehouse_id = ?`;
    }

    const params = userRole === 'warehouse' ? [id, userId] : [id];
    const [rows] = await db.execute(query, params);
    
    return rows[0] || null;
  }

  // Create return order
  static async createReturn(returnData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { 
        originalOrderId, 
        warehouseId, 
        dealerId, 
        salesmanId, 
        itemId, 
        quantity, 
        reason 
      } = returnData;
      
      // Generate return number
      const returnNumber = ReturnModel.generateReturnNumber();

      // Create return order
      const [result] = await connection.execute(
        `INSERT INTO return_orders 
         (return_number, original_order_id, warehouse_id, dealer_id, salesman_id, item_id, quantity, reason) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          returnNumber, 
          originalOrderId || null, 
          warehouseId, 
          dealerId || null, 
          salesmanId || null, 
          itemId, 
          quantity, 
          reason || null
        ]
      );

      await connection.commit();
      return { returnId: result.insertId, returnNumber };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update return order
  static async updateReturn(id, returnData, userRole = null, userId = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if return exists and user has permission
      let checkQuery = `SELECT * FROM return_orders WHERE id = ?`;
      let checkParams = [id];
      
      if (userRole === 'warehouse') {
        checkQuery += ` AND warehouse_id = ?`;
        checkParams.push(userId);
      }

      const [existingReturn] = await connection.execute(checkQuery, checkParams);
      
      if (existingReturn.length === 0) {
        throw new Error('Return order not found or access denied');
      }

      const returnOrder = existingReturn[0];

      // Check if return can be modified
      if (returnOrder.status === 'approved') {
        throw new Error('Cannot modify approved return orders');
      }

      const { originalOrderId, dealerId, salesmanId, itemId, quantity, reason } = returnData;

      // Update return order
      await connection.execute(
        `UPDATE return_orders 
         SET original_order_id = ?, dealer_id = ?, salesman_id = ?, 
             item_id = ?, quantity = ?, reason = ? 
         WHERE id = ?`,
        [
          originalOrderId || null, 
          dealerId || null, 
          salesmanId || null, 
          itemId, 
          quantity, 
          reason || null, 
          id
        ]
      );

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update return status
  static async updateReturnStatus(id, status, userRole = null, userId = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if return exists and user has permission
      let checkQuery = `SELECT ro.*, i.price FROM return_orders ro JOIN items i ON ro.item_id = i.id WHERE ro.id = ?`;
      let checkParams = [id];
      
      if (userRole === 'warehouse') {
        checkQuery += ` AND ro.warehouse_id = ?`;
        checkParams.push(userId);
      }

      const [existingReturn] = await connection.execute(checkQuery, checkParams);
      
      if (existingReturn.length === 0) {
        throw new Error('Return order not found or access denied');
      }

      const returnOrder = existingReturn[0];

      // Update return status
      const [result] = await connection.execute(
        `UPDATE return_orders SET status = ? WHERE id = ?`,
        [status, id]
      );

      // If approved, add inventory back
      if (status === 'approved' && returnOrder.status !== 'approved') {
        // Check if inventory record exists
        const [inventoryCheck] = await connection.execute(
          `SELECT quantity FROM inventory WHERE warehouse_id = ? AND item_id = ?`,
          [returnOrder.warehouse_id, returnOrder.item_id]
        );

        if (inventoryCheck.length > 0) {
          // Update existing inventory
          await connection.execute(
            `UPDATE inventory SET quantity = quantity + ? WHERE warehouse_id = ? AND item_id = ?`,
            [returnOrder.quantity, returnOrder.warehouse_id, returnOrder.item_id]
          );
        } else {
          // Create new inventory record
          await connection.execute(
            `INSERT INTO inventory (warehouse_id, item_id, quantity) VALUES (?, ?, ?)`,
            [returnOrder.warehouse_id, returnOrder.item_id, returnOrder.quantity]
          );
        }
      }

      // If status changed from approved to rejected, remove inventory
      if (status === 'rejected' && returnOrder.status === 'approved') {
        await connection.execute(
          `UPDATE inventory SET quantity = quantity - ? WHERE warehouse_id = ? AND item_id = ? AND quantity >= ?`,
          [returnOrder.quantity, returnOrder.warehouse_id, returnOrder.item_id, returnOrder.quantity]
        );
      }

      await connection.commit();
      return result.affectedRows;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Delete return order
  static async deleteReturn(id, userRole = null, userId = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if return exists and user has permission
      let checkQuery = `SELECT * FROM return_orders WHERE id = ?`;
      let checkParams = [id];
      
      if (userRole === 'warehouse') {
        checkQuery += ` AND warehouse_id = ?`;
        checkParams.push(userId);
      }

      const [existingReturn] = await connection.execute(checkQuery, checkParams);
      
      if (existingReturn.length === 0) {
        throw new Error('Return order not found or access denied');
      }

      const returnOrder = existingReturn[0];

      // Check if return can be deleted
      if (returnOrder.status === 'approved') {
        throw new Error('Cannot delete approved return orders');
      }

      // Delete return order
      await connection.execute(`DELETE FROM return_orders WHERE id = ?`, [id]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get return statistics
  static async getReturnStats(warehouseId = null) {
    let warehouseCondition = '';
    let params = [];
    
    if (warehouseId) {
      warehouseCondition = 'WHERE warehouse_id = ?';
      params.push(warehouseId);
    }

    const [returnStats] = await db.execute(
      `SELECT 
        COUNT(*) as total_returns,
        SUM(ro.quantity * i.price) as total_return_value,
        AVG(ro.quantity * i.price) as avg_return_value,
        SUM(CASE WHEN ro.status = 'pending' THEN 1 ELSE 0 END) as pending_returns,
        SUM(CASE WHEN ro.status = 'approved' THEN 1 ELSE 0 END) as approved_returns,
        SUM(CASE WHEN ro.status = 'rejected' THEN 1 ELSE 0 END) as rejected_returns,
        SUM(CASE WHEN ro.status = 'approved' THEN ro.quantity * i.price ELSE 0 END) as approved_value,
        SUM(CASE WHEN ro.return_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as recent_returns
       FROM return_orders ro
       JOIN items i ON ro.item_id = i.id
       ${warehouseCondition}`,
      params
    );

    const [topReturnedItems] = await db.execute(
      `SELECT 
        i.name as item_name,
        SUM(ro.quantity) as total_quantity,
        SUM(ro.quantity * i.price) as total_value,
        COUNT(*) as return_count
       FROM return_orders ro
       JOIN items i ON ro.item_id = i.id
       ${warehouseCondition}
       GROUP BY ro.item_id, i.name
       ORDER BY total_quantity DESC
       LIMIT 5`,
      params
    );

    const [returnReasons] = await db.execute(
      `SELECT 
        COALESCE(reason, 'No reason specified') as reason,
        COUNT(*) as count
       FROM return_orders ro
       ${warehouseCondition}
       GROUP BY reason
       ORDER BY count DESC
       LIMIT 10`,
      params
    );

    return {
      ...returnStats[0],
      topReturnedItems: topReturnedItems,
      returnReasons: returnReasons
    };
  }

  // Get returns by original order
  static async getReturnsByOrderId(orderId) {
    const [rows] = await db.execute(
      `SELECT 
        ro.*, 
        i.name as item_name, 
        i.price as item_price
       FROM return_orders ro
       JOIN items i ON ro.item_id = i.id
       WHERE ro.original_order_id = ?
       ORDER BY ro.created_at DESC`,
      [orderId]
    );
    return rows;
  }

  // Get pending returns (for dashboard)
  static async getPendingReturns(warehouseId = null, limit = 10) {
    let warehouseCondition = '';
    let params = [limit];
    
    if (warehouseId) {
      warehouseCondition = 'AND ro.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [rows] = await db.execute(
      `SELECT 
        ro.id, ro.return_number, ro.quantity, ro.return_date, ro.reason,
        d.name as dealer_name, d.agency_name,
        s.name as salesman_name,
        i.name as item_name, i.price as item_price,
        w.name as warehouse_name
       FROM return_orders ro
       JOIN warehouses w ON ro.warehouse_id = w.id
       LEFT JOIN dealers d ON ro.dealer_id = d.id
       LEFT JOIN salesmen s ON ro.salesman_id = s.id
       JOIN items i ON ro.item_id = i.id
       WHERE ro.status = 'pending' ${warehouseCondition}
       ORDER BY ro.return_date DESC
       LIMIT ?`,
      params
    );

    return rows;
  }

  // Get monthly return data
  static async getMonthlyReturns(warehouseId = null, year = new Date().getFullYear()) {
    let warehouseCondition = '';
    let params = [year];
    
    if (warehouseId) {
      warehouseCondition = 'AND warehouse_id = ?';
      params.push(warehouseId);
    }

    const [rows] = await db.execute(
      `SELECT 
        MONTH(return_date) as month,
        COUNT(*) as return_count,
        SUM(ro.quantity * i.price) as return_value,
        SUM(CASE WHEN status = 'approved' THEN ro.quantity * i.price ELSE 0 END) as approved_value
       FROM return_orders ro
       JOIN items i ON ro.item_id = i.id
       WHERE YEAR(return_date) = ? ${warehouseCondition}
       GROUP BY MONTH(return_date)
       ORDER BY month`,
      params
    );

    // Fill missing months with zero values
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      return_count: 0,
      return_value: 0,
      approved_value: 0
    }));

    rows.forEach(row => {
      monthlyData[row.month - 1] = row;
    });

    return monthlyData;
  }

  // Check if return number exists
  static async checkReturnNumber(returnNumber, excludeId = null) {
    let query = `SELECT id FROM return_orders WHERE return_number = ?`;
    let params = [returnNumber];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }

  // Get returnable items from an order
  static async getReturnableItems(orderId) {
    const [rows] = await db.execute(
      `SELECT 
        oi.item_id,
        i.name as item_name,
        oi.quantity as ordered_quantity,
        oi.price_per_item,
        COALESCE(SUM(ro.quantity), 0) as returned_quantity,
        (oi.quantity - COALESCE(SUM(ro.quantity), 0)) as returnable_quantity
       FROM order_items oi
       JOIN items i ON oi.item_id = i.id
       LEFT JOIN return_orders ro ON oi.order_id = ro.original_order_id AND oi.item_id = ro.item_id
       WHERE oi.order_id = ?
       GROUP BY oi.item_id, i.name, oi.quantity, oi.price_per_item
       HAVING returnable_quantity > 0`,
      [orderId]
    );
    return rows;
  }
}

module.exports = ReturnModel;