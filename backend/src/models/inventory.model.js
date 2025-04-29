// src/models/inventory.model.js
const pool = require('../config/db');

async function getInventoryForItem(itemId) {
  const sql = `SELECT * FROM inventory WHERE item_id = ?`;
  const [rows] = await pool.execute(sql, [itemId]);
  return rows[0] || null;
}

async function getAllInventory() {
  const sql = `
    SELECT i.*, it.name as item_name, it.price_per_gatha, it.packs_per_gatha 
    FROM inventory i
    JOIN items it ON i.item_id = it.id
  `;
  const [rows] = await pool.execute(sql);
  return rows;
}

async function createInventoryEntry(itemId, quantity) {
  const sql = `
    INSERT INTO inventory (item_id, quantity)
    VALUES (?, ?)
  `;
  
  const [result] = await pool.execute(sql, [itemId, quantity]);
  return result.insertId;
}

async function updateInventoryQuantity(itemId, quantity) {
  // First check if inventory entry exists
  const existingInventory = await getInventoryForItem(itemId);
  
  if (existingInventory) {
    // Update existing inventory
    const sql = `UPDATE inventory SET quantity = ? WHERE item_id = ?`;
    const [result] = await pool.execute(sql, [quantity, itemId]);
    return result.affectedRows > 0;
  } else {
    // Create new inventory entry
    await createInventoryEntry(itemId, quantity);
    return true;
  }
}

async function adjustInventoryQuantity(itemId, adjustment) {
  const inventory = await getInventoryForItem(itemId);
  
  if (!inventory) {
    // Create with initial quantity if it doesn't exist
    if (adjustment < 0) {
      throw new Error('Cannot reduce inventory that does not exist');
    }
    await createInventoryEntry(itemId, adjustment);
    return true;
  }
  
  // Calculate new quantity
  const newQuantity = inventory.quantity + adjustment;
  
  // Prevent negative inventory
  if (newQuantity < 0) {
    throw new Error('Insufficient inventory');
  }
  
  // Update inventory
  const sql = `UPDATE inventory SET quantity = ? WHERE item_id = ?`;
  const [result] = await pool.execute(sql, [newQuantity, itemId]);
  
  return result.affectedRows > 0;
}

module.exports = {
  getInventoryForItem,
  getAllInventory,
  createInventoryEntry,
  updateInventoryQuantity,
  adjustInventoryQuantity
};