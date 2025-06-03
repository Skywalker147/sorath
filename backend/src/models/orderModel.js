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
        o.total_amount, o.transport_status, o.payment_status,
        o.order_date, o.dispatch_date, o.delivery_date, o.created_at, o.updated_at,
        w.name as warehouse_name, w.address as warehouse_address,
        d.name as dealer_name, d.agency_name as dealer_agency, d.mobile_number as dealer_mobile,
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
    }

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

  // Get order by ID with items
  static async getOrderById(id, userRole = null, userId = null) {
    // Get order details
    let orderQuery = `
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
      orderQuery += ` AND o.warehouse_id = ?`;
    }

    const orderParams = userRole === 'warehouse' ? [id, userId] : [id];
    const [orderRows] = await db.execute(orderQuery, orderParams);
    
    if (orderRows.length === 0) {
      return null;
    }

    const order = orderRows[0];

    // Get order items
    const [itemRows] = await db.execute(
      `SELECT 
        oi.*, 
        i.name as item_name, 
        i.status as item_status
       FROM order_items oi
       JOIN items i ON oi.item_id = i.id
       WHERE oi.order_id = ?
       ORDER BY i.name`,
      [id]
    );

    order.items = itemRows;
    return order;
  }

  // Create order
  static async createOrder(orderData) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { warehouseId, dealerId, salesmanId, items } = orderData;
      
      // Generate order number
      const orderNumber = OrderModel.generateOrderNumber();
      
      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.price_per_item;
      }

      // Create order
      const [orderResult] = await connection.execute(
        `INSERT INTO orders (order_number, warehouse_id, dealer_id, salesman_id, total_amount) 
         VALUES (?, ?, ?, ?, ?)`,
        [orderNumber, warehouseId, dealerId || null, salesmanId || null, totalAmount]
      );

      const orderId = orderResult.insertId;

      // Create order items and update inventory
      for (const item of items) {
        // Add order item
        await connection.execute(
          `INSERT INTO order_items (order_id, item_id, quantity, price_per_item, total_price) 
           VALUES (?, ?, ?, ?, ?)`,
          [orderId, item.item_id, item.quantity, item.price_per_item, item.quantity * item.price_per_item]
        );

        // Check and update inventory
        const [inventoryCheck] = await connection.execute(
          `SELECT quantity FROM inventory WHERE warehouse_id = ? AND item_id = ?`,
          [warehouseId, item.item_id]
        );

        if (inventoryCheck.length === 0 || inventoryCheck[0].quantity < item.quantity) {
          throw new Error(`Insufficient inventory for item ID ${item.item_id}`);
        }

        // Reduce inventory
        await connection.execute(
          `UPDATE inventory SET quantity = quantity - ? WHERE warehouse_id = ? AND item_id = ?`,
          [item.quantity, warehouseId, item.item_id]
        );
      }

      await connection.commit();
      return { orderId, orderNumber };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update order
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

      const { dealerId, salesmanId, items } = orderData;

      if (items && items.length > 0) {
        // Restore original inventory
        const [originalItems] = await connection.execute(
          `SELECT item_id, quantity FROM order_items WHERE order_id = ?`,
          [id]
        );

        for (const originalItem of originalItems) {
          await connection.execute(
            `UPDATE inventory SET quantity = quantity + ? WHERE warehouse_id = ? AND item_id = ?`,
            [originalItem.quantity, order.warehouse_id, originalItem.item_id]
          );
        }

        // Delete existing order items
        await connection.execute(`DELETE FROM order_items WHERE order_id = ?`, [id]);

        // Calculate new total amount
        let totalAmount = 0;
        for (const item of items) {
          totalAmount += item.quantity * item.price_per_item;
        }

        // Update order
        await connection.execute(
          `UPDATE orders SET dealer_id = ?, salesman_id = ?, total_amount = ? WHERE id = ?`,
          [dealerId || null, salesmanId || null, totalAmount, id]
        );

        // Add new order items and update inventory
        for (const item of items) {
          await connection.execute(
            `INSERT INTO order_items (order_id, item_id, quantity, price_per_item, total_price) 
             VALUES (?, ?, ?, ?, ?)`,
            [id, item.item_id, item.quantity, item.price_per_item, item.quantity * item.price_per_item]
          );

          // Check and update inventory
          const [inventoryCheck] = await connection.execute(
            `SELECT quantity FROM inventory WHERE warehouse_id = ? AND item_id = ?`,
            [order.warehouse_id, item.item_id]
          );

          if (inventoryCheck.length === 0 || inventoryCheck[0].quantity < item.quantity) {
            throw new Error(`Insufficient inventory for item ID ${item.item_id}`);
          }

          await connection.execute(
            `UPDATE inventory SET quantity = quantity - ? WHERE warehouse_id = ? AND item_id = ?`,
            [item.quantity, order.warehouse_id, item.item_id]
          );
        }
      } else {
        // Update only order details
        await connection.execute(
          `UPDATE orders SET dealer_id = ?, salesman_id = ? WHERE id = ?`,
          [dealerId || null, salesmanId || null, id]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update order status
  static async updateOrderStatus(id, statusData, userRole = null, userId = null) {
    let query = `UPDATE orders SET `;
    let params = [];
    let updates = [];

    if (statusData.transportStatus) {
      updates.push('transport_status = ?');
      params.push(statusData.transportStatus);
      
      if (statusData.transportStatus === 'dispatched') {
        updates.push('dispatch_date = NOW()');
      } else if (statusData.transportStatus === 'delivered') {
        updates.push('delivery_date = NOW()');
      }
    }

    if (statusData.paymentStatus) {
      updates.push('payment_status = ?');
      params.push(statusData.paymentStatus);
    }

    query += updates.join(', ') + ' WHERE id = ?';
    params.push(id);

    if (userRole === 'warehouse') {
      query += ' AND warehouse_id = ?';
      params.push(userId);
    }

    const [result] = await db.execute(query, params);
    return result.affectedRows;
  }

  // Delete order
  static async deleteOrder(id, userRole = null, userId = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if order exists and user has permission
      let checkQuery = `SELECT * FROM orders WHERE id = ?`;
      let checkParams = [id];
      
      if (userRole === 'warehouse') {
        checkQuery += ` AND warehouse_id = ?`;
        checkParams.push(userId);
      }

      const [existingOrder] = await connection.execute(checkQuery, checkParams);
      
      if (existingOrder.length === 0) {
        throw new Error('Order not found or access denied');
      }

      const order = existingOrder[0];

      // Check if order can be deleted
      if (order.transport_status === 'dispatched' || order.transport_status === 'delivered') {
        throw new Error('Cannot delete dispatched or delivered orders');
      }

      // Restore inventory
      const [orderItems] = await connection.execute(
        `SELECT item_id, quantity FROM order_items WHERE order_id = ?`,
        [id]
      );

      for (const item of orderItems) {
        await connection.execute(
          `UPDATE inventory SET quantity = quantity + ? WHERE warehouse_id = ? AND item_id = ?`,
          [item.quantity, order.warehouse_id, item.item_id]
        );
      }

      // Delete order items first (foreign key constraint)
      await connection.execute(`DELETE FROM order_items WHERE order_id = ?`, [id]);
      
      // Delete order
      await connection.execute(`DELETE FROM orders WHERE id = ?`, [id]);

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
  static async getOrderStats(warehouseId = null) {
    let warehouseCondition = '';
    let params = [];
    
    if (warehouseId) {
      warehouseCondition = 'WHERE warehouse_id = ?';
      params.push(warehouseId);
    }

    const [orderStats] = await db.execute(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_order_value,
        SUM(CASE WHEN transport_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN transport_status = 'dispatched' THEN 1 ELSE 0 END) as dispatched_orders,
        SUM(CASE WHEN transport_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN transport_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN payment_status = 'partial' THEN 1 ELSE 0 END) as partial_payments,
        SUM(CASE WHEN payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders
       FROM orders ${warehouseCondition}`,
      params
    );

    const [recentOrders] = await db.execute(
      `SELECT COUNT(*) as recent_orders 
       FROM orders 
       ${warehouseCondition} 
       ${warehouseCondition ? 'AND' : 'WHERE'} order_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      params
    );

    const [topItems] = await db.execute(
      `SELECT 
        i.name as item_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue
       FROM order_items oi
       JOIN items i ON oi.item_id = i.id
       JOIN orders o ON oi.order_id = o.id
       ${warehouseCondition}
       GROUP BY oi.item_id, i.name
       ORDER BY total_quantity DESC
       LIMIT 5`,
      params
    );

    return {
      ...orderStats[0],
      recentOrders: recentOrders[0].recent_orders,
      topItems: topItems
    };
  }

  // Get monthly sales data
  static async getMonthlySales(warehouseId = null, year = new Date().getFullYear()) {
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
        SUM(total_amount) as revenue,
        SUM(CASE WHEN transport_status = 'delivered' THEN total_amount ELSE 0 END) as delivered_revenue
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
      revenue: 0,
      delivered_revenue: 0
    }));

    rows.forEach(row => {
      monthlyData[row.month - 1] = row;
    });

    return monthlyData;
  }

  // Get pending orders (for dashboard)
  static async getPendingOrders(warehouseId = null, limit = 10) {
    let warehouseCondition = '';
    let params = [limit];
    
    if (warehouseId) {
      warehouseCondition = 'AND o.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [rows] = await db.execute(
      `SELECT 
        o.id, o.order_number, o.total_amount, o.order_date,
        d.name as dealer_name, d.agency_name,
        s.name as salesman_name,
        w.name as warehouse_name
       FROM orders o
       JOIN warehouses w ON o.warehouse_id = w.id
       LEFT JOIN dealers d ON o.dealer_id = d.id
       LEFT JOIN salesmen s ON o.salesman_id = s.id
       WHERE o.transport_status = 'pending' ${warehouseCondition}
       ORDER BY o.order_date DESC
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