const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateTransportStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats,
  getMonthlyOrders,
  getTopCustomers,
  getPendingOrders,
  getDispatchedOrders,
  bulkUpdateTransportStatus,
  generateOrderReport,
  exportOrders
} = require('../controllers/orderController');

const { 
  verifyToken, 
  isOwner, 
  isWarehouse, 
  isOwnerOrWarehouse,
  isDealer,
  isSalesman,
  isSalesmanOrDealer,
  hasRole
} = require('../middlewares/authMiddleware');

// ========================================
// GENERAL ORDER ROUTES (All authenticated users can view with role-based filtering)
// ========================================

// Get all orders (filtered by user role automatically)
router.get('/', verifyToken, getAllOrders);

// Get order by ID (with role-based access control)
router.get('/:id', verifyToken, getOrderById);

// Get order statistics (role-based filtering)
router.get('/stats/summary', verifyToken, getOrderStats);

// Get monthly order data
router.get('/stats/monthly', verifyToken, getMonthlyOrders);

// Get top customers
router.get('/stats/top-customers', verifyToken, getTopCustomers);

// Get pending orders (for dashboard)
router.get('/status/pending', verifyToken, getPendingOrders);

// ========================================
// ORDER CREATION ROUTES (Warehouse, Dealer, Salesman can create)
// ========================================

// Create order - Warehouse, Dealer, and Salesman can create orders
router.post('/', verifyToken, hasRole(['warehouse', 'dealer', 'salesman']), createOrder);

// ========================================
// ORDER MODIFICATION ROUTES (Role-based permissions)
// ========================================

// Update order - Only before dispatch, by creator or warehouse
router.put('/:id', verifyToken, hasRole(['warehouse', 'dealer', 'salesman']), updateOrder);

// Delete order - Only before dispatch, by creator or warehouse
router.delete('/:id', verifyToken, hasRole(['warehouse', 'dealer', 'salesman']), deleteOrder);

// ========================================
// STATUS UPDATE ROUTES (Different permissions for different roles)
// ========================================

// Update transport status
// - Warehouse: Can set any status (pending, dispatched, delivered, cancelled)
// - Dealer: Can only mark as delivered (when they receive the order)
// - Salesman: Cannot update transport status
// - Owner: Can set any status
router.patch('/:id/transport-status', verifyToken, hasRole(['owner', 'warehouse', 'dealer']), updateTransportStatus);

// Update payment status - Only warehouse and owner
router.patch('/:id/payment-status', verifyToken, isOwnerOrWarehouse, updatePaymentStatus);

// Bulk update transport status
router.patch('/bulk/transport-status', verifyToken, hasRole(['owner', 'warehouse', 'dealer']), bulkUpdateTransportStatus);

// ========================================
// DEALER-SPECIFIC ROUTES (Mobile App)
// ========================================

// Get dispatched orders for dealer (so they can mark as received)
router.get('/dealer/dispatched', verifyToken, isDealer, getDispatchedOrders);

// ========================================
// OWNER/WAREHOUSE REPORTING ROUTES
// ========================================

// Generate order reports (Owner and Warehouse only)
router.get('/reports/generate', verifyToken, isOwnerOrWarehouse, generateOrderReport);

// Export orders (Owner and Warehouse only)
router.get('/export/:format', verifyToken, isOwnerOrWarehouse, exportOrders);

module.exports = router;
