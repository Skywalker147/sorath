const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/authController');
const { verifyToken, isOwnerOrWarehouse } = require('../middlewares/authMiddleware');

// Public routes
router.post('/admin/login', adminLogin);
router.post('/warehouse/login', warehouseLogin);
router.post('/dealer/login', dealerLogin);
router.post('/salesman/login', salesmanLogin);
router.post('/verify-code', verifyRegistrationCode);
router.post('/register', registerUser);

// Forgot Password routes
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', verifyToken, getProfile);
router.post('/generate-code', verifyToken, isOwnerOrWarehouse, generateRegistrationCode);

module.exports = router;