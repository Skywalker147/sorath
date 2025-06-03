const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  getMonthlySales,
  getPendingOrders,
  bulkUpdateStatus,
  generateInvoice,
  exportOrders
} = require('../controllers/orderController');

const { verifyToken, isOwner, isOwnerOrWarehouse } = require('../middlewares/authMiddleware');

// General order routes (accessible by owner and warehouse)
router.get('/', verifyToken, isOwnerOrWarehouse, getAllOrders);
router.get('/stats', verifyToken, isOwnerOrWarehouse, getOrderStats);
router.get('/monthly-sales', verifyToken, isOwnerOrWarehouse, getMonthlySales);
router.get('/pending', verifyToken, isOwnerOrWarehouse, getPendingOrders);
router.get('/:id', verifyToken, isOwnerOrWarehouse, getOrderById);

// Order management routes (accessible by owner and warehouse)
router.post('/', verifyToken, isOwnerOrWarehouse, createOrder);
router.put('/:id', verifyToken, isOwnerOrWarehouse, updateOrder);
router.patch('/:id/status', verifyToken, isOwnerOrWarehouse, updateOrderStatus);
router.delete('/:id', verifyToken, isOwnerOrWarehouse, deleteOrder);

// Bulk operations
router.patch('/bulk/status', verifyToken, isOwnerOrWarehouse, bulkUpdateStatus);

// Invoice and export routes
router.get('/:id/invoice', verifyToken, isOwnerOrWarehouse, generateInvoice);
router.get('/export/:format', verifyToken, isOwnerOrWarehouse, exportOrders);

module.exports = router;