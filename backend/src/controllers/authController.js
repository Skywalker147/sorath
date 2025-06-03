const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// Admin/Owner Login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if admin exists
    const [rows] = await db.execute(
      'SELECT * FROM owners WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const admin = rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      id: admin.id,
      username: admin.username,
      role: 'owner'
    });

    // Remove password from response
    const { password: _, ...adminData } = admin;

    res.json({
      success: true,
      token,
      admin: adminData,
      role: 'owner'
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Warehouse Login
const warehouseLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Check if warehouse exists and is active
    const [rows] = await db.execute(
      'SELECT * FROM warehouses WHERE username = ? AND status = "active"',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or warehouse inactive' });
    }

    const warehouse = rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, warehouse.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      id: warehouse.id,
      username: warehouse.username,
      role: 'warehouse'
    });

    // Remove password from response
    const { password: _, ...warehouseData } = warehouse;

    res.json({
      success: true,
      token,
      warehouse: warehouseData,
      role: 'warehouse'
    });

  } catch (error) {
    console.error('Warehouse login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate Registration Code
const generateRegistrationCode = async (req, res) => {
  try {
    const { role, warehouse_id } = req.body;

    if (!role || !['warehouse', 'salesman', 'dealer'].includes(role)) {
      return res.status(400).json({ error: 'Valid role is required' });
    }

    // Generate 8-character code
    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    // Set expiry to 24 hours from now
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Insert registration code
    await db.execute(
      'INSERT INTO registration_codes (code, role, warehouse_id, expires_at) VALUES (?, ?, ?, ?)',
      [code, role, warehouse_id || null, expiresAt]
    );

    res.json({
      success: true,
      code,
      role,
      expires_at: expiresAt
    });

  } catch (error) {
    console.error('Generate registration code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify Registration Code
const verifyRegistrationCode = async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Registration code is required' });
    }

    // Check if code exists, is not used, and not expired
    const [rows] = await db.execute(
      'SELECT * FROM registration_codes WHERE code = ? AND is_used = FALSE AND expires_at > NOW()',
      [code.toUpperCase()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired registration code' });
    }

    const regCode = rows[0];

    res.json({
      success: true,
      role: regCode.role,
      warehouse_id: regCode.warehouse_id,
      code: regCode.code
    });

  } catch (error) {
    console.error('Verify registration code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Register User (after OTP verification)
const registerUser = async (req, res) => {
  try {
    const { code, userData, role } = req.body;

    // Verify code again
    const [codeRows] = await db.execute(
      'SELECT * FROM registration_codes WHERE code = ? AND is_used = FALSE AND expires_at > NOW()',
      [code.toUpperCase()]
    );

    if (codeRows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired registration code' });
    }

    const regCode = codeRows[0];

    if (regCode.role !== role) {
      return res.status(400).json({ error: 'Role mismatch' });
    }

    let insertQuery = '';
    let insertValues = [];

    if (role === 'dealer') {
      const { name, agency_name, address, pincode, mobile_number } = userData;
      insertQuery = 'INSERT INTO dealers (name, agency_name, address, pincode, mobile_number, warehouse_id) VALUES (?, ?, ?, ?, ?, ?)';
      insertValues = [name, agency_name, address, pincode, mobile_number, regCode.warehouse_id];
    } else if (role === 'salesman') {
      const { name, aadhar_number, pan_number, mobile_number } = userData;
      insertQuery = 'INSERT INTO salesmen (name, aadhar_number, pan_number, mobile_number, warehouse_id) VALUES (?, ?, ?, ?, ?)';
      insertValues = [name, aadhar_number, pan_number, mobile_number, regCode.warehouse_id];
    } else if (role === 'warehouse') {
      const { name, address, pincode, username, password } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);
      insertQuery = 'INSERT INTO warehouses (name, address, pincode, username, password) VALUES (?, ?, ?, ?, ?)';
      insertValues = [name, address, pincode, username, hashedPassword];
    }

    // Insert user
    const [result] = await db.execute(insertQuery, insertValues);

    // Mark registration code as used
    await db.execute(
      'UPDATE registration_codes SET is_used = TRUE WHERE code = ?',
      [code.toUpperCase()]
    );

    res.json({
      success: true,
      message: `${role} registered successfully`,
      userId: result.insertId
    });

  } catch (error) {
    console.error('Register user error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'User already exists with this information' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = '';
    let table = '';

    switch (role) {
      case 'owner':
        table = 'owners';
        break;
      case 'warehouse':
        table = 'warehouses';
        break;
      case 'dealer':
        table = 'dealers';
        break;
      case 'salesman':
        table = 'salesmen';
        break;
      default:
        return res.status(400).json({ error: 'Invalid role' });
    }

    const [rows] = await db.execute(
      `SELECT * FROM ${table} WHERE id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password, ...userData } = rows[0];

    res.json({
      success: true,
      user: userData,
      role
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  adminLogin,
  warehouseLogin,
  generateRegistrationCode,
  verifyRegistrationCode,
  registerUser,
  getProfile
};