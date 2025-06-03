const express = require('express');
const router = express.Router();
const {
  adminLogin,
  warehouseLogin,
  generateRegistrationCode,
  verifyRegistrationCode,
  registerUser,
  getProfile
} = require('../controllers/authController');
const { verifyToken, isOwnerOrWarehouse } = require('../middlewares/authMiddleware');

// Public routes
router.post('/admin/login', adminLogin);
router.post('/warehouse/login', warehouseLogin);
router.post('/verify-code', verifyRegistrationCode);
router.post('/register', registerUser);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.post('/generate-code', verifyToken, isOwnerOrWarehouse, generateRegistrationCode);

module.exports = router;