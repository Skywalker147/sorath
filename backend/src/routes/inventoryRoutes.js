const express = require('express');
const router = express.Router();
const {
  getInventory,
  getItemInventory,
  getSpecificInventory,
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

const { verifyToken, isOwner, isOwnerOrWarehouse } = require('../middlewares/authMiddleware');

// General inventory routes (accessible by owner and warehouse)
router.get('/', verifyToken, isOwnerOrWarehouse, getInventory);
router.get('/stats', verifyToken, isOwnerOrWarehouse, getInventoryStats);
router.get('/low-stock', verifyToken, isOwnerOrWarehouse, getLowStockItems);

// Owner-only routes
router.get('/warehouse-summary', verifyToken, isOwner, getWarehouseSummary);
router.post('/transfer', verifyToken, isOwner, transferInventory);

// Item-specific routes
router.get('/item/:itemId', verifyToken, isOwnerOrWarehouse, getItemInventory);

// Warehouse-specific routes
router.get('/warehouse/:warehouseId/items-without-inventory', verifyToken, isOwnerOrWarehouse, getItemsWithoutInventory);
router.get('/warehouse/:warehouseId/item/:itemId', verifyToken, isOwnerOrWarehouse, getSpecificInventory);
router.put('/warehouse/:warehouseId/item/:itemId', verifyToken, isOwnerOrWarehouse, updateInventory);
router.delete('/warehouse/:warehouseId/item/:itemId', verifyToken, isOwnerOrWarehouse, deleteInventory);
router.get('/warehouse/:warehouseId/item/:itemId/history', verifyToken, isOwnerOrWarehouse, getInventoryHistory);
router.get('/warehouse/:warehouseId/item/:itemId/availability', verifyToken, isOwnerOrWarehouse, checkAvailability);

// Bulk operations (accessible by owner and warehouse)
router.patch('/bulk', verifyToken, isOwnerOrWarehouse, bulkUpdateInventory);

module.exports = router;