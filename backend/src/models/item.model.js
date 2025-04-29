// src/models/item.model.js
const pool = require('../config/db');

async function getAllItems() {
  const sql = `SELECT * FROM items ORDER BY name ASC`;
  const [rows] = await pool.execute(sql);
  return rows;
}

async function getItemById(id) {
  const sql = `SELECT * FROM items WHERE id = ?`;
  const [rows] = await pool.execute(sql, [id]);
  return rows[0] || null;
}

async function createItem({ name, description, pricePerGatha, packsPerGatha = 30 }) {
  const sql = `
    INSERT INTO items (name, description, price_per_gatha, packs_per_gatha)
    VALUES (?, ?, ?, ?)
  `;
  
  const [result] = await pool.execute(sql, [name, description, pricePerGatha, packsPerGatha]);
  return result.insertId;
}

async function updateItem(id, { name, description, pricePerGatha, packsPerGatha }) {
  const sql = `
    UPDATE items 
    SET name = ?, description = ?, price_per_gatha = ?, packs_per_gatha = ?
    WHERE id = ?
  `;
  
  const [result] = await pool.execute(sql, [name, description, pricePerGatha, packsPerGatha, id]);
  return result.affectedRows > 0;
}

async function deleteItem(id) {
  const sql = `DELETE FROM items WHERE id = ?`;
  const [result] = await pool.execute(sql, [id]);
  return result.affectedRows > 0;
}

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem
};