const express = require('express');
const router = express.Router();
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  updateItemStatus,
  deleteItem,
  getItemStats,
  getItemsWithInventory,
  bulkUpdatePrices,
  searchItems,
  getPriceHistory,
  getLowStockItems,
  getItemsByWarehouse,
  importItems,
  exportItems
} = require('../controllers/itemController');

const { verifyToken, isOwner, isOwnerOrWarehouse } = require('../middlewares/authMiddleware');

// Public/Basic routes (accessible by owner and warehouse)
router.get('/', verifyToken, isOwnerOrWarehouse, getAllItems);
router.get('/search', verifyToken, isOwnerOrWarehouse, searchItems);
router.get('/stats', verifyToken, isOwnerOrWarehouse, getItemStats);
router.get('/with-inventory', verifyToken, isOwnerOrWarehouse, getItemsWithInventory);
router.get('/low-stock', verifyToken, isOwnerOrWarehouse, getLowStockItems);
router.get('/warehouse/:warehouseId', verifyToken, isOwnerOrWarehouse, getItemsByWarehouse);
router.get('/:id', verifyToken, isOwnerOrWarehouse, getItemById);
router.get('/:id/price-history', verifyToken, isOwnerOrWarehouse, getPriceHistory);

// Owner-only routes (item management)
router.post('/', verifyToken, isOwner, createItem);
router.put('/:id', verifyToken, isOwner, updateItem);
router.patch('/:id/status', verifyToken, isOwner, updateItemStatus);
router.delete('/:id', verifyToken, isOwner, deleteItem);
router.patch('/bulk/prices', verifyToken, isOwner, bulkUpdatePrices);

// Import/Export routes (future implementation)
router.post('/import', verifyToken, isOwner, importItems);
router.get('/export/csv', verifyToken, isOwner, exportItems);

module.exports = router;