// src/routes/inventory.routes.js
const express = require('express');
const router = express.Router();
const inventoryCtrl = require('../controllers/inventory.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireAdmin);

// Inventory routes
router.get('/', inventoryCtrl.getAllInventory);
router.get('/history', inventoryCtrl.getInventoryHistory);
router.get('/:itemId', inventoryCtrl.getInventoryForItem);
router.get('/:itemId/history', inventoryCtrl.getInventoryHistory);
router.put('/:itemId', inventoryCtrl.updateInventory);
router.post('/:itemId/adjust', inventoryCtrl.adjustInventory);

module.exports = router;