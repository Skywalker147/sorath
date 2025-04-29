// src/models/user.model.js
const pool = require('../config/db');

async function createUser({ name, phoneNumber, location, role }) {
  const sql = `
    INSERT INTO users (name, phone_number, location, role)
    VALUES (?, ?, ?, ?)
  `;
  const [result] = await pool.execute(sql, [name, phoneNumber, location, role]);
  return result.insertId;
}

async function findUserByPhone(phoneNumber) {
  const sql = `SELECT * FROM users WHERE phone_number = ?`;
  const [rows] = await pool.execute(sql, [phoneNumber]);
  return rows[0] || null;
}

async function markUserVerified(phoneNumber) {
  const sql = `UPDATE users SET is_verified = TRUE WHERE phone_number = ?`;
  await pool.execute(sql, [phoneNumber]);
}

module.exports = {
  createUser,
  findUserByPhone,
  markUserVerified,
};
