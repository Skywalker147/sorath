// src/models/inventoryHistory.model.js
const pool = require('../config/db');

async function addInventoryHistoryEntry({ itemId, quantityChange, reason, adminId }) {
  const sql = `
    INSERT INTO inventory_history (
      item_id, 
      quantity_change, 
      reason, 
      admin_id, 
      timestamp
    )
    VALUES (?, ?, ?, ?, NOW())
  `;
  
  const [result] = await pool.execute(sql, [
    itemId, 
    quantityChange, 
    reason, 
    adminId
  ]);
  
  return result.insertId;
}

async function getInventoryHistoryForItem(itemId, limit = 50) {
  const sql = `
    SELECT 
      ih.*,
      a.username as admin_username,
      a.name as admin_name,
      i.name as item_name
    FROM inventory_history ih
    JOIN admins a ON ih.admin_id = a.id
    JOIN items i ON ih.item_id = i.id
    WHERE ih.item_id = ?
    ORDER BY ih.timestamp DESC
    LIMIT ?
  `;
  
  const [rows] = await pool.execute(sql, [itemId, limit]);
  return rows;
}

async function getAllInventoryHistory(limit = 100) {
  const sql = `
    SELECT 
      ih.*,
      a.username as admin_username,
      a.name as admin_name,
      i.name as item_name
    FROM inventory_history ih
    JOIN admins a ON ih.admin_id = a.id
    JOIN items i ON ih.item_id = i.id
    ORDER BY ih.timestamp DESC
    LIMIT ?
  `;
  
  const [rows] = await pool.execute(sql, [limit]);
  return rows;
}

module.exports = {
  addInventoryHistoryEntry,
  getInventoryHistoryForItem,
  getAllInventoryHistory
};