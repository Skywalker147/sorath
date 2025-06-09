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

// Dealer Login
const dealerLogin = async (req, res) => {
  try {
    const { mobile_number, password } = req.body;

    if (!mobile_number || !password) {
      return res.status(400).json({ error: 'Mobile number and password are required' });
    }

    // Check if dealer exists and is active
    const [rows] = await db.execute(
      'SELECT * FROM dealers WHERE mobile_number = ? AND status = "active"',
      [mobile_number]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or dealer inactive' });
    }

    const dealer = rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, dealer.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      id: dealer.id,
      mobile_number: dealer.mobile_number,
      role: 'dealer'
    });

    // Remove password from response
    const { password: _, ...dealerData } = dealer;

    res.json({
      success: true,
      token,
      dealer: dealerData,
      role: 'dealer'
    });

  } catch (error) {
    console.error('Dealer login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Salesman Login
const salesmanLogin = async (req, res) => {
  try {
    const { mobile_number, password } = req.body;

    if (!mobile_number || !password) {
      return res.status(400).json({ error: 'Mobile number and password are required' });
    }

    // Check if salesman exists and is active
    const [rows] = await db.execute(
      'SELECT * FROM salesmen WHERE mobile_number = ? AND status = "active"',
      [mobile_number]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials or salesman inactive' });
    }

    const salesman = rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, salesman.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken({
      id: salesman.id,
      mobile_number: salesman.mobile_number,
      role: 'salesman'
    });

    // Remove password from response
    const { password: _, ...salesmanData } = salesman;

    res.json({
      success: true,
      token,
      salesman: salesmanData,
      role: 'salesman'
    });

  } catch (error) {
    console.error('Salesman login error:', error);
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

// Verify Code for Password Reset
const verifyResetCode = async (req, res) => {
  try {
    const { code, mobile_number, role } = req.body;

    if (!code || !mobile_number || !role) {
      return res.status(400).json({ error: 'Code, mobile number and role are required' });
    }

    if (!['dealer', 'salesman'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be dealer or salesman' });
    }

    // Check if code exists, is not used, and not expired
    const [codeRows] = await db.execute(
      'SELECT * FROM registration_codes WHERE code = ? AND role = ? AND is_used = FALSE AND expires_at > NOW()',
      [code.toUpperCase(), role]
    );

    if (codeRows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired registration code' });
    }

    // Check if user exists with the mobile number
    const table = role === 'dealer' ? 'dealers' : 'salesmen';
    const [userRows] = await db.execute(
      `SELECT id FROM ${table} WHERE mobile_number = ? AND status = 'active'`,
      [mobile_number]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    res.json({
      success: true,
      message: 'Code verified successfully',
      code: code.toUpperCase(),
      role,
      mobile_number
    });

  } catch (error) {
    console.error('Verify reset code error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  try {
    const { code, mobile_number, role, new_password } = req.body;

    if (!code || !mobile_number || !role || !new_password) {
      return res.status(400).json({ 
        error: 'Code, mobile number, role and new password are required' 
      });
    }

    if (!['dealer', 'salesman'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be dealer or salesman' });
    }

    // Verify code again
    const [codeRows] = await db.execute(
      'SELECT * FROM registration_codes WHERE code = ? AND role = ? AND is_used = FALSE AND expires_at > NOW()',
      [code.toUpperCase(), role]
    );

    if (codeRows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired registration code' });
    }

    // Check if user exists
    const table = role === 'dealer' ? 'dealers' : 'salesmen';
    const [userRows] = await db.execute(
      `SELECT id FROM ${table} WHERE mobile_number = ? AND status = 'active'`,
      [mobile_number]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await db.execute(
      `UPDATE ${table} SET password = ? WHERE mobile_number = ?`,
      [hashedPassword, mobile_number]
    );

    // Mark registration code as used
    await db.execute(
      'UPDATE registration_codes SET is_used = TRUE WHERE code = ?',
      [code.toUpperCase()]
    );

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
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
      const { name, agency_name, address, pincode, mobile_number, password } = userData;
      
      // Validate required fields
      if (!name || !agency_name || !address || !pincode || !mobile_number || !password) {
        return res.status(400).json({ 
          error: 'All fields are required: name, agency_name, address, pincode, mobile_number, password' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      insertQuery = 'INSERT INTO dealers (name, agency_name, address, pincode, mobile_number, password, warehouse_id) VALUES (?, ?, ?, ?, ?, ?, ?)';
      insertValues = [name, agency_name, address, pincode, mobile_number, hashedPassword, regCode.warehouse_id];
    } else if (role === 'salesman') {
      const { name, aadhar_number, pan_number, mobile_number, password } = userData;
      
      // Validate required fields
      if (!name || !aadhar_number || !pan_number || !mobile_number || !password) {
        return res.status(400).json({ 
          error: 'All fields are required: name, aadhar_number, pan_number, mobile_number, password' 
        });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      insertQuery = 'INSERT INTO salesmen (name, aadhar_number, pan_number, mobile_number, password, warehouse_id) VALUES (?, ?, ?, ?, ?, ?)';
      insertValues = [name, aadhar_number, pan_number, mobile_number, hashedPassword, regCode.warehouse_id];
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
  dealerLogin,
  salesmanLogin,
  generateRegistrationCode,
  verifyRegistrationCode,
  verifyResetCode,
  resetPassword,
  registerUser,
  getProfile
};