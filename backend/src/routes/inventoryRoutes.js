const express = require('express');
const router = express.Router();
const {
  getInventory,
  getItemInventory,
  getSpecificInventory,
  addInventoryItem,
  updateInventory,
  bulkUpdateInventory,
  transferInventory,
  getInventoryStats,
  getWarehouseSummary,
  getLowStockItems,
  getItemsWithoutInventory,
  deleteInventory,
  getInventoryHistory,
  checkAvailability
} = require('../controllers/inventoryController');

const { verifyToken, isOwner, isOwnerOrWarehouse, isWarehouse } = require('../middlewares/authMiddleware');

// ========================================
// READ-ONLY ROUTES (Owner and Warehouse can view)
// ========================================

// General inventory viewing routes
router.get('/', verifyToken, isOwnerOrWarehouse, getInventory);
router.get('/stats', verifyToken, isOwnerOrWarehouse, getInventoryStats);
router.get('/low-stock', verifyToken, isOwnerOrWarehouse, getLowStockItems);

// Item-specific viewing routes
router.get('/item/:itemId', verifyToken, isOwnerOrWarehouse, getItemInventory);

// Warehouse-specific viewing routes
router.get('/warehouse/:warehouseId/items-without-inventory', verifyToken, isOwnerOrWarehouse, getItemsWithoutInventory);
router.get('/warehouse/:warehouseId/item/:itemId', verifyToken, isOwnerOrWarehouse, getSpecificInventory);
router.get('/warehouse/:warehouseId/item/:itemId/history', verifyToken, isOwnerOrWarehouse, getInventoryHistory);
router.get('/warehouse/:warehouseId/item/:itemId/availability', verifyToken, isOwnerOrWarehouse, checkAvailability);

// ========================================
// OWNER-ONLY ROUTES (View-only for owner, but special permissions)
// ========================================

// Warehouse summary - Only owner can see all warehouses summary
router.get('/warehouse-summary', verifyToken, isOwner, getWarehouseSummary);

// Transfer inventory - Only owner can transfer between warehouses
router.post('/transfer', verifyToken, isOwner, transferInventory);

// ========================================
// WAREHOUSE-ONLY ROUTES (CRUD operations)
// ========================================

// Add new inventory item - ONLY warehouse users can add new items
router.post('/warehouse/:warehouseId/item/:itemId', verifyToken, isWarehouse, addInventoryItem);

// Inventory modification routes - ONLY warehouse users can modify
router.put('/warehouse/:warehouseId/item/:itemId', verifyToken, isWarehouse, updateInventory);
router.delete('/warehouse/:warehouseId/item/:itemId', verifyToken, isWarehouse, deleteInventory);

// Bulk operations - ONLY warehouse users can perform bulk updates
router.patch('/bulk', verifyToken, isWarehouse, bulkUpdateInventory);

module.exports = router;