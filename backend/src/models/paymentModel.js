const db = require('../config/db');

class PaymentModel {
  // Get all payments with filters
  static async getAllPayments(filters = {}, userRole = null, userId = null) {
    let query = `
      SELECT 
        p.id, p.order_id, p.amount, p.payment_method, p.payment_status,
        p.transaction_id, p.payment_date, p.due_date, p.notes, p.created_at,
        o.order_number, o.total_amount as order_total,
        d.name as dealer_name, d.agency_name as dealer_agency, d.mobile_number as dealer_mobile,
        s.name as salesman_name, s.mobile_number as salesman_mobile,
        w.name as warehouse_name
      FROM payments p
      JOIN orders o ON p.order_id = o.id
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

    if (filters.orderId) {
      conditions.push('p.order_id = ?');
      params.push(filters.orderId);
    }

    if (filters.paymentStatus) {
      conditions.push('p.payment_status = ?');
      params.push(filters.paymentStatus);
    }

    if (filters.paymentMethod) {
      conditions.push('p.payment_method = ?');
      params.push(filters.paymentMethod);
    }

    if (filters.search) {
      conditions.push('(o.order_number LIKE ? OR p.transaction_id LIKE ? OR d.name LIKE ? OR d.agency_name LIKE ?)');
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.startDate) {
      conditions.push('DATE(p.payment_date) >= ?');
      params.push(filters.startDate);
    }

    if (filters.endDate) {
      conditions.push('DATE(p.payment_date) <= ?');
      params.push(filters.endDate);
    }

    if (filters.overdue) {
      conditions.push('p.due_date < CURDATE() AND p.payment_status != "paid"');
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY p.created_at DESC`;

    const [rows] = await db.execute(query, params);
    return rows;
  }

  // Get payment by ID
  static async getPaymentById(id, userRole = null, userId = null) {
    let query = `
      SELECT 
        p.*, 
        o.order_number, o.total_amount as order_total, o.order_date,
        d.name as dealer_name, d.agency_name as dealer_agency, 
        d.address as dealer_address, d.mobile_number as dealer_mobile,
        s.name as salesman_name, s.mobile_number as salesman_mobile,
        w.name as warehouse_name, w.address as warehouse_address
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN warehouses w ON o.warehouse_id = w.id
      LEFT JOIN dealers d ON o.dealer_id = d.id
      LEFT JOIN salesmen s ON o.salesman_id = s.id
      WHERE p.id = ?
    `;

    // Role-based access control
    if (userRole === 'warehouse') {
      query += ` AND o.warehouse_id = ?`;
    }

    const params = userRole === 'warehouse' ? [id, userId] : [id];
    const [rows] = await db.execute(query, params);
    
    return rows[0] || null;
  }

  // Create payment
  static async createPayment(paymentData) {
    const { 
      orderId, 
      amount, 
      paymentMethod, 
      transactionId, 
      paymentDate, 
      dueDate, 
      notes 
    } = paymentData;

    const [result] = await db.execute(
      `INSERT INTO payments 
       (order_id, amount, payment_method, transaction_id, payment_date, due_date, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [orderId, amount, paymentMethod, transactionId || null, paymentDate, dueDate || null, notes || null]
    );

    // Update order payment status based on total payments
    await PaymentModel.updateOrderPaymentStatus(orderId);

    return result.insertId;
  }

  // Update payment
  static async updatePayment(id, paymentData, userRole = null, userId = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if payment exists and user has permission
      let checkQuery = `
        SELECT p.*, o.warehouse_id 
        FROM payments p 
        JOIN orders o ON p.order_id = o.id 
        WHERE p.id = ?
      `;
      let checkParams = [id];
      
      if (userRole === 'warehouse') {
        checkQuery += ` AND o.warehouse_id = ?`;
        checkParams.push(userId);
      }

      const [existingPayment] = await connection.execute(checkQuery, checkParams);
      
      if (existingPayment.length === 0) {
        throw new Error('Payment not found or access denied');
      }

      const { 
        amount, 
        paymentMethod, 
        transactionId, 
        paymentDate, 
        dueDate, 
        notes,
        paymentStatus
      } = paymentData;

      // Update payment
      await connection.execute(
        `UPDATE payments 
         SET amount = ?, payment_method = ?, transaction_id = ?, 
             payment_date = ?, due_date = ?, notes = ?, payment_status = ?
         WHERE id = ?`,
        [amount, paymentMethod, transactionId || null, paymentDate, dueDate || null, notes || null, paymentStatus, id]
      );

      // Update order payment status
      await PaymentModel.updateOrderPaymentStatus(existingPayment[0].order_id, connection);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Delete payment
  static async deletePayment(id, userRole = null, userId = null) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Check if payment exists and user has permission
      let checkQuery = `
        SELECT p.*, o.warehouse_id 
        FROM payments p 
        JOIN orders o ON p.order_id = o.id 
        WHERE p.id = ?
      `;
      let checkParams = [id];
      
      if (userRole === 'warehouse') {
        checkQuery += ` AND o.warehouse_id = ?`;
        checkParams.push(userId);
      }

      const [existingPayment] = await connection.execute(checkQuery, checkParams);
      
      if (existingPayment.length === 0) {
        throw new Error('Payment not found or access denied');
      }

      // Delete payment
      await connection.execute(`DELETE FROM payments WHERE id = ?`, [id]);

      // Update order payment status
      await PaymentModel.updateOrderPaymentStatus(existingPayment[0].order_id, connection);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Update order payment status based on total payments
  static async updateOrderPaymentStatus(orderId, connection = null) {
    const conn = connection || db;

    // Get order total
    const [orderData] = await conn.execute(
      `SELECT total_amount FROM orders WHERE id = ?`,
      [orderId]
    );

    if (orderData.length === 0) return;

    const orderTotal = orderData[0].total_amount;

    // Get total payments for this order
    const [paymentData] = await conn.execute(
      `SELECT COALESCE(SUM(amount), 0) as total_paid FROM payments WHERE order_id = ? AND payment_status = 'paid'`,
      [orderId]
    );

    const totalPaid = paymentData[0].total_paid;

    // Determine payment status
    let paymentStatus;
    if (totalPaid === 0) {
      paymentStatus = 'pending';
    } else if (totalPaid >= orderTotal) {
      paymentStatus = 'paid';
    } else {
      paymentStatus = 'partial';
    }

    // Update order payment status
    await conn.execute(
      `UPDATE orders SET payment_status = ? WHERE id = ?`,
      [paymentStatus, orderId]
    );
  }

  // Get payment statistics
  static async getPaymentStats(warehouseId = null) {
    let warehouseCondition = '';
    let params = [];
    
    if (warehouseId) {
      warehouseCondition = 'WHERE o.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [paymentStats] = await db.execute(
      `SELECT 
        COUNT(*) as total_payments,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as avg_payment,
        SUM(CASE WHEN p.payment_status = 'pending' THEN 1 ELSE 0 END) as pending_payments,
        SUM(CASE WHEN p.payment_status = 'paid' THEN 1 ELSE 0 END) as completed_payments,
        SUM(CASE WHEN p.payment_status = 'failed' THEN 1 ELSE 0 END) as failed_payments,
        SUM(CASE WHEN p.payment_status = 'pending' THEN p.amount ELSE 0 END) as pending_amount,
        SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END) as received_amount,
        SUM(CASE WHEN p.due_date < CURDATE() AND p.payment_status != 'paid' THEN 1 ELSE 0 END) as overdue_payments,
        SUM(CASE WHEN p.due_date < CURDATE() AND p.payment_status != 'paid' THEN p.amount ELSE 0 END) as overdue_amount
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       ${warehouseCondition}`,
      params
    );

    const [methodStats] = await db.execute(
      `SELECT 
        p.payment_method,
        COUNT(*) as count,
        SUM(p.amount) as total_amount
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       ${warehouseCondition}
       GROUP BY p.payment_method
       ORDER BY total_amount DESC`,
      params
    );

    const [recentPayments] = await db.execute(
      `SELECT COUNT(*) as recent_payments 
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       ${warehouseCondition}
       ${warehouseCondition ? 'AND' : 'WHERE'} p.payment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      params
    );

    return {
      ...paymentStats[0],
      paymentMethods: methodStats,
      recentPayments: recentPayments[0].recent_payments
    };
  }

  // Get overdue payments
  static async getOverduePayments(warehouseId = null) {
    let warehouseCondition = '';
    let params = [];
    
    if (warehouseId) {
      warehouseCondition = 'AND o.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [rows] = await db.execute(
      `SELECT 
        p.id, p.order_id, p.amount, p.payment_method, p.due_date,
        p.payment_date, p.transaction_id, p.notes,
        o.order_number, o.total_amount as order_total,
        d.name as dealer_name, d.agency_name as dealer_agency, d.mobile_number as dealer_mobile,
        s.name as salesman_name,
        w.name as warehouse_name,
        DATEDIFF(CURDATE(), p.due_date) as days_overdue
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       JOIN warehouses w ON o.warehouse_id = w.id
       LEFT JOIN dealers d ON o.dealer_id = d.id
       LEFT JOIN salesmen s ON o.salesman_id = s.id
       WHERE p.due_date < CURDATE() AND p.payment_status != 'paid' ${warehouseCondition}
       ORDER BY p.due_date ASC`,
      params
    );

    return rows;
  }

  // Get monthly payment data
  static async getMonthlyPayments(warehouseId = null, year = new Date().getFullYear()) {
    let warehouseCondition = '';
    let params = [year];
    
    if (warehouseId) {
      warehouseCondition = 'AND o.warehouse_id = ?';
      params.push(warehouseId);
    }

    const [rows] = await db.execute(
      `SELECT 
        MONTH(p.payment_date) as month,
        COUNT(*) as payment_count,
        SUM(p.amount) as total_amount,
        SUM(CASE WHEN p.payment_status = 'paid' THEN p.amount ELSE 0 END) as received_amount
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       WHERE YEAR(p.payment_date) = ? ${warehouseCondition}
       GROUP BY MONTH(p.payment_date)
       ORDER BY month`,
      params
    );

    // Fill missing months with zero values
    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      payment_count: 0,
      total_amount: 0,
      received_amount: 0
    }));

    rows.forEach(row => {
      monthlyData[row.month - 1] = row;
    });

    return monthlyData;
  }

  // Get payments by order ID
  static async getPaymentsByOrderId(orderId) {
    const [rows] = await db.execute(
      `SELECT * FROM payments WHERE order_id = ? ORDER BY payment_date DESC`,
      [orderId]
    );
    return rows;
  }

  // Get top paying customers
  static async getTopPayingCustomers(warehouseId = null, limit = 10) {
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
        COUNT(DISTINCT p.order_id) as total_orders,
        SUM(p.amount) as total_paid,
        AVG(p.amount) as avg_payment
       FROM payments p
       JOIN orders o ON p.order_id = o.id
       LEFT JOIN dealers d ON o.dealer_id = d.id
       LEFT JOIN salesmen s ON o.salesman_id = s.id
       WHERE p.payment_status = 'paid' ${warehouseCondition}
       GROUP BY COALESCE(d.id, s.id), customer_name, customer_type, mobile_number
       ORDER BY total_paid DESC
       LIMIT ?`,
      params
    );

    return rows;
  }
}

module.exports = PaymentModel;