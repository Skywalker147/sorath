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
  getOrdersByType,
  getUserOrderSummary,
  bulkUpdateStatus,
  generateInvoice,
  exportOrders
} = require('../controllers/orderController');

const { verifyToken, isOwner, isOwnerOrWarehouse, hasRole } = require('../middlewares/authMiddleware');

// ========================================
// GENERAL ORDER ROUTES (All authenticated users can access based on their data)
// ========================================

// Get orders - Everyone can see their own orders
router.get('/', verifyToken, getAllOrders);

// Get order by ID - Everyone can see orders they have access to
router.get('/:id', verifyToken, getOrderById);

// Get order statistics - Everyone can see their own stats
router.get('/stats', verifyToken, getOrderStats);

// Get monthly sales - Everyone can see their own data
router.get('/monthly-sales', verifyToken, getMonthlySales);

// Get pending orders - Everyone can see their own pending orders
router.get('/pending', verifyToken, getPendingOrders);

// ========================================
// ORDER CREATION ROUTES (Role-based access)
// ========================================

// Create order - Owner, Warehouse, Dealer, and Salesman can create orders
router.post('/', verifyToken, hasRole(['owner', 'warehouse', 'dealer', 'salesman']), createOrder);

// ========================================
// ORDER MODIFICATION ROUTES (Role-based access with business logic)
// ========================================

// Update order - All roles can update their own orders (before dispatch)
router.put('/:id', verifyToken, hasRole(['owner', 'warehouse', 'dealer', 'salesman']), updateOrder);

// Update order status - Different permissions for different statuses
router.patch('/:id/status', verifyToken, hasRole(['owner', 'warehouse', 'dealer', 'salesman']), updateOrderStatus);

// Delete order - All roles can delete their own orders (before dispatch)
router.delete('/:id', verifyToken, hasRole(['owner', 'warehouse', 'dealer', 'salesman']), deleteOrder);

// ========================================
// ADVANCED ORDER ROUTES
// ========================================

// Get orders by type - Owner and Warehouse can filter by order type
router.get('/type/:type', verifyToken, isOwnerOrWarehouse, getOrdersByType);

// Get user's order summary - Warehouse, Dealer, and Salesman can see their summary
router.get('/summary/user', verifyToken, hasRole(['warehouse', 'dealer', 'salesman']), getUserOrderSummary);

// ========================================
// BULK OPERATIONS (Role-based permissions)
// ========================================

// Bulk update order status - All roles can bulk update their accessible orders
router.patch('/bulk/status', verifyToken, hasRole(['owner', 'warehouse', 'dealer', 'salesman']), bulkUpdateStatus);

// ========================================
// DOCUMENT GENERATION AND EXPORT
// ========================================

// Generate invoice - All roles can generate invoices for their accessible orders
router.get('/:id/invoice', verifyToken, hasRole(['owner', 'warehouse', 'dealer', 'salesman']), generateInvoice);

// Export orders - Owner and Warehouse can export order data
router.get('/export/:format', verifyToken, isOwnerOrWarehouse, exportOrders);

module.exports = router;