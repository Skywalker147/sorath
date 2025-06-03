const express = require('express');
const router = express.Router();
const {
  getAllReturns,
  getReturnById,
  createReturn,
  updateReturn,
  updateReturnStatus,
  deleteReturn,
  getReturnStats,
  getReturnsByOrderId,
  getPendingReturns,
  getMonthlyReturns,
  getReturnableItems,
  bulkUpdateReturnStatus,
  generateReturnReport,
  exportReturns
} = require('../controllers/returnController');

const { verifyToken, isOwner, isOwnerOrWarehouse } = require('../middlewares/authMiddleware');

// General return routes (accessible by owner and warehouse)
router.get('/', verifyToken, isOwnerOrWarehouse, getAllReturns);
router.get('/stats', verifyToken, isOwnerOrWarehouse, getReturnStats);
router.get('/monthly-returns', verifyToken, isOwnerOrWarehouse, getMonthlyReturns);
router.get('/pending', verifyToken, isOwnerOrWarehouse, getPendingReturns);
router.get('/:id', verifyToken, isOwnerOrWarehouse, getReturnById);

// Return management routes (accessible by owner and warehouse)
router.post('/', verifyToken, isOwnerOrWarehouse, createReturn);
router.put('/:id', verifyToken, isOwnerOrWarehouse, updateReturn);
router.patch('/:id/status', verifyToken, isOwnerOrWarehouse, updateReturnStatus);
router.delete('/:id', verifyToken, isOwnerOrWarehouse, deleteReturn);

// Order-related routes
router.get('/order/:orderId', verifyToken, isOwnerOrWarehouse, getReturnsByOrderId);
router.get('/order/:orderId/returnable-items', verifyToken, isOwnerOrWarehouse, getReturnableItems);

// Bulk operations
router.patch('/bulk/status', verifyToken, isOwnerOrWarehouse, bulkUpdateReturnStatus);

// Report and export routes
router.get('/reports/generate', verifyToken, isOwnerOrWarehouse, generateReturnReport);
router.get('/export/:format', verifyToken, isOwnerOrWarehouse, exportReturns);

module.exports = router;