// src/services/admin.service.js
const adminModel = require('../models/admin.model');
const jwtUtil = require('../utils/jwt.util');

async function loginAdmin(username, password) {
  const admin = await adminModel.findAdminByUsername(username);
  
  if (!admin) {
    throw new Error('Invalid credentials');
  }
  
  const isValid = await adminModel.validatePassword(admin, password);
  
  if (!isValid) {
    throw new Error('Invalid credentials');
  }
  
  // Generate JWT token
  const token = jwtUtil.signToken({ 
    adminId: admin.id, 
    role: admin.role,
    username: admin.username
  });
  
  return {
    admin: {
      id: admin.id,
      username: admin.username,
      name: admin.name,
      role: admin.role
    },
    token
  };
}

module.exports = {
  loginAdmin
};