const db = require('../config/db');

class OrderModel {
  // Generate unique order number
  static generateOrderNumber() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return `ORD-${timestamp}${random}`;
  }

  // Get all orders with filters
  static async getAllOrders(filters = {}, userRole = null, userId = null) {
    let query = `
      SELECT 
        o.id, o.order_number, o.warehouse_id, o.dealer_id, o.salesman_id,
        o.total_amount, o.transport_status, o.payment_status, o.order_date,
        o.dispatch_date, o.delivery_date, o.created_at, o.updated_at,
        w.name as warehouse_name, w.address as warehouse_address,
        d.name as dealer_name, d.agency_name as dealer_agency, 
        d.address as dealer_address, d.mobile_number as dealer_mobile,
        s.name as salesman_name, s.mobile_number as salesman_mobile
      FROM orders o
      JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN dealers d ON o.dealer_id = d.id
      LEFT JOIN salesmen s ON o.salesman_id = s.id
    `;
    
    let params = [];
    let conditions = [];

    // Role-based filtering
    if (userRole === 'warehouse') {
      conditions.push('o.warehouse_id = ?');
      params.push(userId);
    } else if (userRole === 'dealer') {
      conditions.push('o.dealer_id = ?');
      params.push(userId);
    } else if (userRole === 'salesman') {
      conditions.push('o.salesman_id = ?');
      params.push(userId);
    }

    // Additional filters
    if (filters.warehouseId) {
      conditions.push('o.warehouse_id = ?');
      params.push(filters.warehouseId);
    }

    if (filters.dealerId) {
      conditions.push('o.dealer_id = ?');
      params.push(filters.dealerId);
    }

    if (filters.salesmanId) {
      conditions.push('o.salesman_id = ?');
      params.push(filters.salesmanId);
    }

    if (filters.transportStatus) {
      conditions.push('o.transport_status = ?');
      params.push(filters.transportStatus);
    }

    if (filters.paymentStatus) {
      conditions.push('o.payment_status = ?');
      params.push(filters.paymentStatus);
    }

    if (filters.search) {
      conditions.push('(o.order_number LIKE ? OR d.name LIKE ? OR d.agency_name LIKE ? OR s.name LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.startDate) {
      conditions.push('DATE(o.order_date) >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('DATE(o.order_date) <= ?');
      params.push(filters.endDate);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY o.created_at DESC`;

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Get order by ID with role-based access control
  static async getOrderById(id, userRole = null, userId = null) {
    let query = `
      SELECT 
        o.*, 
        w.name as warehouse_name, w.address as warehouse_address,
        d.name as dealer_name, d.agency_name as dealer_agency, 
        d.address as dealer_address, d.mobile_number as dealer_mobile,
        s.name as salesman_name, s.mobile_number as salesman_mobile
      FROM orders o
      JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN dealers d ON o.dealer_id = d.id
      LEFT JOIN salesmen s ON o.salesman_id = s.id
      WHERE o.id = ?
    `;

    // Role-based access control
    if (userRole === 'warehouse') {
      query += ` AND o.warehouse_id = ?`;
    } else if (userRole === 'dealer') {
      query += ` AND o.dealer_id = ?`;
    } else if (userRole === 'salesman') {
      query += ` AND o.salesman_id = ?`;
    }

    const params = userRole && userRole !== 'owner' ? [id, userId] : [id];
    const [rows] = await db.execute(query, params);
    
    if (rows.length === 0) return null;

    // Get order items
    const [orderItems] = await db.execute(
      `SELECT 
        oi.*, i.name as item_name, i.status as item_status
       FROM order_items oi
       JOIN items i ON oi.item_id = i.id
       WHERE oi.order_id = ?
       ORDER BY oi.id`,
      [id]
    );

    return {
      ...rows[0],
      items: orderItems
    };
  }

  // Create order
  static async createOrder(orderData, userRole = null, userId = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { warehouseId, dealerId, salesmanId, items, notes } = orderData;
      
      // Generate order number
      const orderNumber = OrderModel.generateOrderNumber();

      // Validate based on user role
      if (userRole === 'warehouse') {
        if (!dealerId) {
          throw new Error('Warehouse orders must specify a dealer');
        }
        if (parseInt(warehouseId) !== userId) {
          throw new Error('Warehouse can only create orders for their own warehouse');
        }
      } else if (userRole === 'dealer') {
        if (parseInt(dealerId) !== userId) {
          throw new Error('Dealer can only create orders for themselves');
        }
      } else if (userRole === 'salesman') {
        if (!dealerId) {
          throw new Error('Salesman orders must specify a dealer');
        }
        if (parseInt(salesmanId) !== userId) {
          throw new Error('Salesman ID mismatch');
        }
      }

      // Calculate total amount and validate items
      let totalAmount = 0;
      const validatedItems = [];

      for (const item of items) {
        const [itemData] = await connection.execute(
          'SELECT id, name, price, status FROM items WHERE id = ?',
          [item.itemId]
        );

        if (itemData.length === 0) {
          throw new Error(`Item with ID ${item.itemId} not found`);
        }

        if (itemData[0].status !== 'active') {
          throw new Error(`Item ${itemData[0].name} is not active`);
        }

        const quantity = parseInt(item.quantity);
        const pricePerItem = parseFloat(itemData[0].price);
        const totalPrice = quantity * pricePerItem;

        validatedItems.push({
          itemId: item.itemId,
          itemName: itemData[0].name,
          quantity,
          pricePerItem,
          totalPrice
        });

        totalAmount += totalPrice;
      }

      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders 
         (order_number, warehouse_id, dealer_id, salesman_id, total_amount) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderNumber, warehouseId, dealerId || null, salesmanId || null, totalAmount]
      );

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of validatedItems) {
        await connection.execute(
          `INSERT INTO order_items 
           (order_id, item_id, quantity, price_per_item, total_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.itemId, item.quantity, item.pricePerItem, item.totalPrice]
        );
      }

      await connection.commit();
      return { orderId, orderNumber, totalAmount };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update order (only before dispatch)
  static async updateOrder(id, orderData, userRole = null, userId = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if order exists and user has permission
      let checkQuery = `SELECT * FROM orders WHERE id = ?`;
      let checkParams = [id];
      
      if (userRole === 'warehouse') {
        checkQuery += ` AND warehouse_id = ?`;
        checkParams.push(userId);
      } else if (userRole === 'dealer') {
        checkQuery += ` AND dealer_id = ?`;
        checkParams.push(userId);
      } else if (userRole === 'salesman') {
        checkQuery += ` AND salesman_id = ?`;
        checkParams.push(userId);
      }

      const [existingOrder] = await connection.execute(checkQuery, checkParams);
      
      if (existingOrder.length === 0) {
        throw new Error('Order not found or access denied');
      }

      const order = existingOrder[0];

      // Check if order can be modified
      if (order.transport_status === 'dispatched' || order.transport_status === 'delivered') {
        throw new Error('Cannot modify dispatched or delivered orders');
      }

      const { items } = orderData;

      // Delete existing order items
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [id]);

      // Calculate new total and add items
      let totalAmount = 0;
      for (const item of items) {
        const [itemData] = await connection.execute(
          'SELECT price FROM items WHERE id = ? AND status = "active"',
          [item.itemId]
        );

        if (itemData.length === 0) {
          throw new Error(`Invalid item ID: ${item.itemId}`);
        }

        const quantity = parseInt(item.quantity);
        const pricePerItem = parseFloat(itemData[0].price);
        const totalPrice = quantity * pricePerItem;

        await connection.execute(
          `INSERT INTO order_items 
           (order_id, item_id, quantity, price_per_item, total_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [id, item.itemId, quantity, pricePerItem, totalPrice]
        );

        totalAmount += totalPrice;
      }

      // Update order total
      await connection.execute(
        'UPDATE orders SET total_amount = ? WHERE id = ?',
        [totalAmount, id]
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

  // Update order transport status
  static async updateTransportStatus(id, status, userRole = null, userId = null) {
    // Validate status
    const validStatuses = ['pending', 'dispatched', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid transport status');
    }

    let query = `UPDATE orders SET transport_status = ?`;
    let params = [status, id];
    let whereClause = ` WHERE id = ?`;

    // Add timestamp for status changes
    if (status === 'dispatched') {
      query += ', dispatch_date = NOW()';
    } else if (status === 'delivered') {
      query += ', delivery_date = NOW()';
    }

    // Role-based access control
    if (userRole === 'warehouse') {
      whereClause += ` AND warehouse_id = ?`;
      params.push(userId);
    } else if (userRole === 'dealer') {
      whereClause += ` AND dealer_id = ?`;
      params.push(userId);
      // Dealers can only update from dispatched to delivered
      if (status !== 'delivered') {
        throw new Error('Dealers can only mark orders as delivered');
      }
    } else if (userRole === 'salesman') {
      throw new Error('Salesmen cannot update transport status');
    }

    query += whereClause;
    const [result] = await db.execute(query, params);
    
    return result.affectedRows;
  }

  // Update payment status (only warehouse and owner)
  static async updatePaymentStatus(id, status, userRole = null, userId = null) {
    // Only warehouse and owner can update payment status
    if (userRole !== 'warehouse' && userRole !== 'owner') {
      throw new Error('Only warehouse users can update payment status');
    }

    const validStatuses = ['pending', 'partial', 'paid'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid payment status');
    }

    let query = `UPDATE orders SET payment_status = ? WHERE id = ?`;
    let params = [status, id];

    if (userRole === 'warehouse') {
      query += ` AND warehouse_id = ?`;
      params.push(userId);
    }

    const [result] = await db.execute(query, params);
    return result.affectedRows;
  }

  // Delete order (only before dispatch)
  static async deleteOrder(id, userRole = null, userId = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if order exists and user has permission
      let checkQuery = `SELECT transport_status FROM orders WHERE id = ?`;
      let checkParams = [id];
      
      if (userRole === 'warehouse') {
        checkQuery += ` AND warehouse_id = ?`;
        checkParams.push(userId);
      } else if (userRole === 'dealer') {
        checkQuery += ` AND dealer_id = ?`;
        checkParams.push(userId);
      } else if (userRole === 'salesman') {
        checkQuery += ` AND salesman_id = ?`;
        checkParams.push(userId);
      }

      const [existingOrder] = await connection.execute(checkQuery, checkParams);
      
      if (existingOrder.length === 0) {
        throw new Error('Order not found or access denied');
      }

      // Check if order can be deleted
      if (existingOrder[0].transport_status === 'dispatched' || existingOrder[0].transport_status === 'delivered') {
        throw new Error('Cannot delete dispatched or delivered orders');
      }

      // Delete order items first (foreign key constraint)
      await connection.execute('DELETE FROM order_items WHERE order_id = ?', [id]);
      
      // Delete order
      await connection.execute('DELETE FROM orders WHERE id = ?', [id]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Get order statistics
  static async getOrderStats(warehouseId = null, dealerId = null, salesmanId = null) {
    let warehouseCondition = '';
    let params = [];
    
    if (warehouseId) {
      warehouseCondition = 'WHERE warehouse_id = ?';
      params.push(warehouseId);
    } else if (dealerId) {
      warehouseCondition = 'WHERE dealer_id = ?';
      params.push(dealerId);
    } else if (salesmanId) {
      warehouseCondition = 'WHERE salesman_id = ?';
      params.push(salesmanId);
    }

    const [orderStats] = await db.execute(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_amount,
        AVG(total_amount) as avg_order_value,
        SUM(CASE WHEN transport_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN transport_status = 'dispatched' THEN 1 ELSE 0 END) as dispatched_orders,
        SUM(CASE WHEN transport_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN transport_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders,
        SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) as partial_payments
       FROM orders ${warehouseCondition}`,
      params
    );

    const [recentOrders] = await db.execute(
      `SELECT COUNT(*) as recent_orders 
       FROM orders ${warehouseCondition}
       ${warehouseCondition ? 'AND' : 'WHERE'} order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      params
    );

    return {
      ...orderStats[0],
      recentOrders: recentOrders[0].recent_orders
    };
  }

  // Get monthly order data
  static async getMonthlyOrders(warehouseId = null, year = new Date().getFullYear()) {
    let warehouseCondition = '';
    let params = [year];
    
    if (warehouseId) {
      warehouseCondition = 'AND warehouse_id = ?';
      params.push(warehouseId);
    }

    const [rows] = await db.execute(
      `SELECT 
        MONTH(order_date) as month,
        COUNT(*) as order_count,
        SUM(total_amount) as total_amount,
        SUM(CASE WHEN transport_status = 'delivered' THEN total_amount ELSE 0 END) as delivered_amount
       FROM orders
       WHERE YEAR(order_date) = ? ${warehouseCondition}
       GROUP BY MONTH(order_date)
       ORDER BY month`,
      params
    );

    // Fill missing months with zero values
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      order_count: 0,
      total_amount: 0,
      delivered_amount: 0
    }));

    rows.forEach(row => {
      monthlyData[row.month - 1] = row;
    });

    return monthlyData;
  }

  // Get top customers
  static async getTopCustomers(warehouseId = null, limit = 10) {
    let warehouseCondition = '';
    let params = [limit];
    
    if (warehouseId) {
      warehouseCondition = 'AND o.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [rows] = await db.execute(
      `SELECT 
        COALESCE(d.name, s.name) as customer_name,
        COALESCE(d.agency_name, 'Salesman') as customer_type,
        COALESCE(d.mobile_number, s.mobile_number) as mobile_number,
        COUNT(o.id) as total_orders,
        SUM(o.total_amount) as total_amount,
        AVG(o.total_amount) as avg_order_value
       FROM orders o
       LEFT JOIN dealers d ON o.dealer_id = d.id
       LEFT JOIN salesmen s ON o.salesman_id = s.id
       WHERE 1=1 ${warehouseCondition}
       GROUP BY COALESCE(d.id, s.id), customer_name, customer_type, mobile_number
       ORDER BY total_amount DESC
       LIMIT ?`,
      params
    );

    return rows;
  }

  // Check if order number exists
  static async checkOrderNumber(orderNumber, excludeId = null) {
    let query = `SELECT id FROM orders WHERE order_number = ?`;
    let params = [orderNumber];
    
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    
    const [rows] = await db.execute(query, params);
    return rows.length > 0;
  }
}

module.exports = OrderModel;
