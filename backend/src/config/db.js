const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host:     process.env.DB_HOST,
  user:     process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection once when server starts
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully');
    connection.release(); // Important to release the connection back to the pool
  } catch (error) {
    console.error('❌ Error connecting to the database:', error.message);
    process.exit(1); // Exit the server if DB connection fails
  }
})();

module.exports = pool;
