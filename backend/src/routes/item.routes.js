// src/routes/item.routes.js
const express = require('express');
const router = express.Router();
const itemCtrl = require('../controllers/item.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Apply authentication middleware to all routes
router.use(authMiddleware.authenticate);
router.use(authMiddleware.requireAdmin);

// Item routes
router.get('/', itemCtrl.getAllItems);
router.get('/with-inventory', itemCtrl.getAllItemsWithInventory);
router.get('/:id', itemCtrl.getItemById);
router.get('/:id/with-inventory', itemCtrl.getItemWithInventory);
router.post('/', itemCtrl.createItem);
router.put('/:id', itemCtrl.updateItem);
router.delete('/:id', itemCtrl.deleteItem);

module.exports = router;