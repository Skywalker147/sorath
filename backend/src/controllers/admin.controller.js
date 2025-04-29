// src/controllers/admin.controller.js
const adminService = require('../services/admin.service');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    const result = await adminService.loginAdmin(username, password);
    
    return res.json(result);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }
}

module.exports = {
  login
};