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
        o.order_type, o.placed_by_role, o.placed_by_id,
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
    } else if (userRole === 'dealer') {
      // Dealer can see orders where they are the dealer OR orders placed by them
      conditions.push('(o.dealer_id = ? OR (o.placed_by_role = "dealer" AND o.placed_by_id = ?))');
      params.push(userId, userId);
    } else if (userRole === 'salesman') {
      // Salesman can see orders where they are the salesman OR orders placed by them
      conditions.push('(o.salesman_id = ? OR (o.placed_by_role = "salesman" AND o.placed_by_id = ?))');
      params.push(userId, userId);
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

    if (filters.orderType) {
      conditions.push('o.order_type = ?');
      params.push(filters.orderType);
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

    let orderParams = [id];

    // Role-based access control
    if (userRole === 'warehouse') {
      orderQuery += ` AND o.warehouse_id = ?`;
      orderParams.push(userId);
    } else if (userRole === 'dealer') {
      orderQuery += ` AND (o.dealer_id = ? OR (o.placed_by_role = "dealer" AND o.placed_by_id = ?))`;
      orderParams.push(userId, userId);
    } else if (userRole === 'salesman') {
      orderQuery += ` AND (o.salesman_id = ? OR (o.placed_by_role = "salesman" AND o.placed_by_id = ?))`;
      orderParams.push(userId, userId);
    }

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

  // Create order with proper order type handling
  static async createOrder(orderData, placedByRole, placedById) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const { warehouseId, dealerId, salesmanId, items } = orderData;
      
      // Determine order type based on the scenario
      let orderType;
      if (placedByRole === 'dealer' && dealerId && !salesmanId) {
        orderType = 'direct_dealer';
      } else if (placedByRole === 'salesman' && dealerId && salesmanId) {
        orderType = 'salesman_for_dealer';
      } else if (placedByRole === 'warehouse' && dealerId) {
        orderType = 'warehouse_for_dealer';
      } else {
        throw new Error('Invalid order configuration');
      }

      // Generate order number
      const orderNumber = OrderModel.generateOrderNumber();
      
      // Calculate total amount
      let totalAmount = 0;
      for (const item of items) {
        totalAmount += item.quantity * item.price_per_item;
      }

      // Create order with new fields
      const [orderResult] = await connection.execute(
        `INSERT INTO orders 
         (order_number, warehouse_id, dealer_id, salesman_id, order_type, placed_by_role, placed_by_id, total_amount) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderNumber, 
          warehouseId, 
          dealerId || null, 
          salesmanId || null, 
          orderType,
          placedByRole,
          placedById,
          totalAmount
        ]
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
      return { orderId, orderNumber, orderType };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update order with role-based permissions
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
        checkQuery += ` AND (dealer_id = ? OR (placed_by_role = "dealer" AND placed_by_id = ?))`;
        checkParams.push(userId, userId);
      } else if (userRole === 'salesman') {
        checkQuery += ` AND (salesman_id = ? OR (placed_by_role = "salesman" AND placed_by_id = ?))`;
        checkParams.push(userId, userId);
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

  // Check if user can modify order
  static async canModifyOrder(orderId, userRole, userId) {
    let query = `
      SELECT id, transport_status, placed_by_role, placed_by_id, dealer_id, salesman_id, warehouse_id
      FROM orders WHERE id = ?
    `;
    
    const [orders] = await db.execute(query, [orderId]);
    
    if (orders.length === 0) {
      return { canModify: false, reason: 'Order not found' };
    }
    
    const order = orders[0];
    
    // Check if order is already dispatched
    if (order.transport_status === 'dispatched' || order.transport_status === 'delivered') {
      return { canModify: false, reason: 'Order already dispatched or delivered' };
    }
    
    // Check role-based permissions
    let hasPermission = false;
    
    if (userRole === 'owner') {
      hasPermission = true;
    } else if (userRole === 'warehouse' && order.warehouse_id === userId) {
      hasPermission = true;
    } else if (userRole === 'dealer') {
      // Dealer can modify if they are the dealer or if they placed the order
      hasPermission = (order.dealer_id === userId) || 
                     (order.placed_by_role === 'dealer' && order.placed_by_id === userId);
    } else if (userRole === 'salesman') {
      // Salesman can modify if they are the salesman or if they placed the order
      hasPermission = (order.salesman_id === userId) || 
                     (order.placed_by_role === 'salesman' && order.placed_by_id === userId);
    }
    
    return { 
      canModify: hasPermission, 
      reason: hasPermission ? null : 'Access denied'
    };
  }

  // Rest of the existing methods remain the same...
  // (updateOrderStatus, deleteOrder, getOrderStats, etc.)
  
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

    // Add role-based restrictions
    if (userRole === 'warehouse') {
      query += ' AND warehouse_id = ?';
      params.push(userId);
    } else if (userRole === 'dealer') {
      query += ' AND (dealer_id = ? OR (placed_by_role = "dealer" AND placed_by_id = ?))';
      params.push(userId, userId);
    } else if (userRole === 'salesman') {
      query += ' AND (salesman_id = ? OR (placed_by_role = "salesman" AND placed_by_id = ?))';
      params.push(userId, userId);
    }

    const [result] = await db.execute(query, params);
    return result.affectedRows;
  }

  // Delete order with role-based permissions
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
      } else if (userRole === 'dealer') {
        checkQuery += ` AND (dealer_id = ? OR (placed_by_role = "dealer" AND placed_by_id = ?))`;
        checkParams.push(userId, userId);
      } else if (userRole === 'salesman') {
        checkQuery += ` AND (salesman_id = ? OR (placed_by_role = "salesman" AND placed_by_id = ?))`;
        checkParams.push(userId, userId);
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
  static async getOrderStats(warehouseId = null, userRole = null, userId = null) {
    let warehouseCondition = '';
    let params = [];
    
    if (userRole === 'warehouse') {
      warehouseCondition = 'WHERE o.warehouse_id = ?';
      params.push(userId);
    } else if (userRole === 'dealer') {
      warehouseCondition = 'WHERE (o.dealer_id = ? OR (o.placed_by_role = "dealer" AND o.placed_by_id = ?))';
      params.push(userId, userId);
    } else if (userRole === 'salesman') {
      warehouseCondition = 'WHERE (o.salesman_id = ? OR (o.placed_by_role = "salesman" AND o.placed_by_id = ?))';
      params.push(userId, userId);
    } else if (warehouseId) {
      warehouseCondition = 'WHERE o.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [orderStats] = await db.execute(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(o.total_amount) as total_revenue,
        AVG(o.total_amount) as avg_order_value,
        SUM(CASE WHEN o.transport_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN o.transport_status = 'dispatched' THEN 1 ELSE 0 END) as dispatched_orders,
        SUM(CASE WHEN o.transport_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN o.transport_status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(CASE WHEN o.payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN o.payment_status = 'partial' THEN 1 ELSE 0 END) as partial_payments,
        SUM(CASE WHEN o.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_orders
       FROM orders o ${warehouseCondition}`,
      params
    );

    return orderStats[0];
  }

  // Get orders by type
  static async getOrdersByType(orderType, warehouseId = null) {
    let query = `
      SELECT 
        o.*, 
        w.name as warehouse_name,
        d.name as dealer_name, d.agency_name as dealer_agency,
        s.name as salesman_name
      FROM orders o
      JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN dealers d ON o.dealer_id = d.id
      LEFT JOIN salesmen s ON o.salesman_id = s.id
      WHERE o.order_type = ?
    `;
    
    let params = [orderType];
    
    if (warehouseId) {
      query += ` AND o.warehouse_id = ?`;
      params.push(warehouseId);
    }
    
    query += ` ORDER BY o.created_at DESC`;
    
    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Get monthly sales data with role filtering
  static async getMonthlySales(warehouseId = null, year = new Date().getFullYear(), userRole = null, userId = null) {
    let warehouseCondition = '';
    let params = [year];
    
    if (userRole === 'warehouse') {
      warehouseCondition = 'AND o.warehouse_id = ?';
      params.push(userId);
    } else if (userRole === 'dealer') {
      warehouseCondition = 'AND (o.dealer_id = ? OR (o.placed_by_role = "dealer" AND o.placed_by_id = ?))';
      params.push(userId, userId);
    } else if (userRole === 'salesman') {
      warehouseCondition = 'AND (o.salesman_id = ? OR (o.placed_by_role = "salesman" AND o.placed_by_id = ?))';
      params.push(userId, userId);
    } else if (warehouseId) {
      warehouseCondition = 'AND o.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [rows] = await db.execute(
      `SELECT 
        MONTH(o.order_date) as month,
        COUNT(*) as order_count,
        SUM(o.total_amount) as revenue,
        SUM(CASE WHEN o.transport_status = 'delivered' THEN o.total_amount ELSE 0 END) as delivered_revenue,
        COUNT(CASE WHEN o.order_type = 'direct_dealer' THEN 1 END) as direct_dealer_orders,
        COUNT(CASE WHEN o.order_type = 'salesman_for_dealer' THEN 1 END) as salesman_orders,
        COUNT(CASE WHEN o.order_type = 'warehouse_for_dealer' THEN 1 END) as warehouse_orders
       FROM orders o
       WHERE YEAR(o.order_date) = ? ${warehouseCondition}
       GROUP BY MONTH(o.order_date)
       ORDER BY month`,
      params
    );

    // Fill missing months with zero values
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      order_count: 0,
      revenue: 0,
      delivered_revenue: 0,
      direct_dealer_orders: 0,
      salesman_orders: 0,
      warehouse_orders: 0
    }));

    rows.forEach(row => {
      monthlyData[row.month - 1] = row;
    });

    return monthlyData;
  }

  // Get pending orders with role filtering
  static async getPendingOrders(warehouseId = null, limit = 10, userRole = null, userId = null) {
    let warehouseCondition = '';
    let params = [limit];
    
    if (userRole === 'warehouse') {
      warehouseCondition = 'AND o.warehouse_id = ?';
      params.push(userId);
    } else if (userRole === 'dealer') {
      warehouseCondition = 'AND (o.dealer_id = ? OR (o.placed_by_role = "dealer" AND o.placed_by_id = ?))';
      params.push(userId, userId);
    } else if (userRole === 'salesman') {
      warehouseCondition = 'AND (o.salesman_id = ? OR (o.placed_by_role = "salesman" AND o.placed_by_id = ?))';
      params.push(userId, userId);
    } else if (warehouseId) {
      warehouseCondition = 'AND o.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [rows] = await db.execute(
      `SELECT 
        o.id, o.order_number, o.total_amount, o.order_date, o.order_type,
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

  // Get orders summary by role
  static async getOrdersSummaryByRole(userRole, userId) {
    let roleCondition = '';
    let params = [userId];
    
    if (userRole === 'warehouse') {
      roleCondition = 'WHERE o.warehouse_id = ?';
    } else if (userRole === 'dealer') {
      roleCondition = 'WHERE (o.dealer_id = ? OR (o.placed_by_role = "dealer" AND o.placed_by_id = ?))';
      params.push(userId);
    } else if (userRole === 'salesman') {
      roleCondition = 'WHERE (o.salesman_id = ? OR (o.placed_by_role = "salesman" AND o.placed_by_id = ?))';
      params.push(userId);
    }

    const [summary] = await db.execute(
      `SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN o.transport_status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN o.transport_status = 'dispatched' THEN 1 ELSE 0 END) as dispatched_orders,
        SUM(CASE WHEN o.transport_status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN o.payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
        SUM(o.total_amount) as total_value,
        COUNT(CASE WHEN o.order_type = 'direct_dealer' THEN 1 END) as direct_orders,
        COUNT(CASE WHEN o.order_type = 'salesman_for_dealer' THEN 1 END) as via_salesman_orders,
        COUNT(CASE WHEN o.order_type = 'warehouse_for_dealer' THEN 1 END) as warehouse_created_orders
       FROM orders o ${roleCondition}`,
      params
    );

    return summary[0];
  }
}

module.exports = OrderModel;