const express = require('express');
const router = express.Router();
const {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats,
  getOverduePayments,
  getMonthlyPayments,
  getPaymentsByOrderId,
  getTopPayingCustomers,
  updatePaymentStatus,
  generatePaymentReport
} = require('../controllers/paymentController');

const { verifyToken, isOwner, isOwnerOrWarehouse } = require('../middlewares/authMiddleware');

// General payment routes (accessible by owner and warehouse)
router.get('/', verifyToken, isOwnerOrWarehouse, getAllPayments);
router.get('/stats', verifyToken, isOwnerOrWarehouse, getPaymentStats);
router.get('/overdue', verifyToken, isOwnerOrWarehouse, getOverduePayments);
router.get('/monthly-payments', verifyToken, isOwnerOrWarehouse, getMonthlyPayments);
router.get('/top-customers', verifyToken, isOwnerOrWarehouse, getTopPayingCustomers);
router.get('/:id', verifyToken, isOwnerOrWarehouse, getPaymentById);

// Payment management routes (accessible by owner and warehouse)
router.post('/', verifyToken, isOwnerOrWarehouse, createPayment);
router.put('/:id', verifyToken, isOwnerOrWarehouse, updatePayment);
router.patch('/:id/status', verifyToken, isOwnerOrWarehouse, updatePaymentStatus);
router.delete('/:id', verifyToken, isOwnerOrWarehouse, deletePayment);

// Order-related routes
router.get('/order/:orderId', verifyToken, isOwnerOrWarehouse, getPaymentsByOrderId);

// Report routes
router.get('/reports/generate', verifyToken, isOwnerOrWarehouse, generatePaymentReport);

module.exports = router;