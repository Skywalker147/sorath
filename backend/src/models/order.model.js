const pool = require('../config/db');

async function createOrder({ userId, totalAmount, items }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Create order
    const orderSql = `
      INSERT INTO orders (user_id, total_amount)
      VALUES (?, ?)
    `;
    const [orderResult] = await connection.execute(orderSql, [userId, totalAmount]);
    const orderId = orderResult.insertId;

    // Create order items
    const itemSql = `
      INSERT INTO order_items (order_id, item_id, quantity, price_per_unit, total_price)
      VALUES (?, ?, ?, ?, ?)
    `;

    for (const item of items) {
      await connection.execute(itemSql, [
        orderId,
        item.itemId,
        item.quantity,
        item.pricePerUnit,
        item.totalPrice
      ]);
    }

    await connection.commit();
    return orderId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function getOrderById(orderId) {
  const orderSql = `
    SELECT o.*, u.name as user_name, u.phone_number
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.id = ?
  `;
  const [orders] = await pool.execute(orderSql, [orderId]);
  
  if (orders.length === 0) {
    return null;
  }

  const order = orders[0];

  // Get order items
  const itemsSql = `
    SELECT oi.*, i.name as item_name
    FROM order_items oi
    JOIN items i ON oi.item_id = i.id
    WHERE oi.order_id = ?
  `;
  const [items] = await pool.execute(itemsSql, [orderId]);
  
  return {
    ...order,
    items
  };
}

async function getAllOrders() {
  const sql = `
    SELECT o.*, u.name as user_name, u.phone_number
    FROM orders o
    JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC
  `;
  const [orders] = await pool.execute(sql);
  return orders;
}

async function updateOrderStatus(orderId, status) {
  const sql = `
    UPDATE orders
    SET status = ?
    WHERE id = ?
  `;
  const [result] = await pool.execute(sql, [status, orderId]);
  return result.affectedRows > 0;
}

module.exports = {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus
}; 