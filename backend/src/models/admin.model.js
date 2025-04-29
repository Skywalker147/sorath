// src/models/admin.model.js
const pool = require('../config/db');
const bcrypt = require('bcrypt');

async function findAdminByUsername(username) {
  const sql = `SELECT * FROM admins WHERE username = ?`;
  const [rows] = await pool.execute(sql, [username]);
  return rows[0] || null;
}

async function createAdmin({ username, password, name, role = 'admin' }) {
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const sql = `
    INSERT INTO admins (username, password, name, role)
    VALUES (?, ?, ?, ?)
  `;
  
  const [result] = await pool.execute(sql, [username, hashedPassword, name, role]);
  return result.insertId;
}

async function validatePassword(admin, password) {
  return bcrypt.compare(password, admin.password);
}

module.exports = {
  findAdminByUsername,
  createAdmin,
  validatePassword
};