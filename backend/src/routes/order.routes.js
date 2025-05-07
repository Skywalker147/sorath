// src/routes/order.routes.js
const express = require('express');
const router = express.Router();
const orderCtrl = require('../controllers/order.controller');
const authMiddleware = require('../middleware/auth.middleware');

// Public routes (for Flutter app)
router.post('/', authMiddleware.authenticate, orderCtrl.createOrder);
router.get('/:orderId', authMiddleware.authenticate, orderCtrl.getOrder);

// Admin routes
router.get('/', authMiddleware.authenticate, authMiddleware.requireAdmin, orderCtrl.getAllOrders);
router.patch('/:orderId/status', authMiddleware.authenticate, authMiddleware.requireAdmin, orderCtrl.updateOrderStatus);

module.exports = router; 