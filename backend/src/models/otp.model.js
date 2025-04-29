// src/models/otp.model.js
const pool = require('../config/db');

async function insertOtp({ phoneNumber, code, expiresAt }) {
  const sql = `
    INSERT INTO otps (phone_number, code, expires_at)
    VALUES (?, ?, ?)
  `;
  await pool.execute(sql, [phoneNumber, code, expiresAt]);
}

async function findValidOtp(phoneNumber, code) {
  const sql = `
    SELECT * FROM otps
    WHERE phone_number = ? AND code = ? AND used = FALSE AND expires_at > NOW()
    ORDER BY id DESC LIMIT 1
  `;
  const [rows] = await pool.execute(sql, [phoneNumber, code]);
  return rows[0] || null;
}

async function markOtpUsed(id) {
  const sql = `UPDATE otps SET used = TRUE WHERE id = ?`;
  await pool.execute(sql, [id]);
}

module.exports = {
  insertOtp,
  findValidOtp,
  markOtpUsed,
};
