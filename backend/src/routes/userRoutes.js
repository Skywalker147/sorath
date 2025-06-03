const express = require('express');
const router = express.Router();
const {
  // Warehouse
  getAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  updateWarehouseStatus,
  deleteWarehouse,
  
  // Dealer
  getAllDealers,
  getDealerById,
  updateDealer,
  updateDealerStatus,
  deleteDealer,
  
  // Salesman
  getAllSalesmen,
  getSalesmanById,
  updateSalesman,
  updateSalesmanStatus,
  deleteSalesman,
  
  // Registration Codes
  getRegistrationCodes,
  cleanupExpiredCodes,
  
  // Statistics
  getUserStats
} = require('../controllers/userController');

const { verifyToken, isOwner, isOwnerOrWarehouse } = require('../middlewares/authMiddleware');

// Warehouse Routes (Owner only)
router.get('/warehouses', verifyToken, isOwner, getAllWarehouses);
router.get('/warehouses/:id', verifyToken, isOwner, getWarehouseById);
router.post('/warehouses', verifyToken, isOwner, createWarehouse);
router.put('/warehouses/:id', verifyToken, isOwner, updateWarehouse);
router.patch('/warehouses/:id/status', verifyToken, isOwner, updateWarehouseStatus);
router.delete('/warehouses/:id', verifyToken, isOwner, deleteWarehouse);

// Dealer Routes (Owner and Warehouse can view, Owner can manage)
router.get('/dealers', verifyToken, isOwnerOrWarehouse, getAllDealers);
router.get('/dealers/:id', verifyToken, isOwnerOrWarehouse, getDealerById);
router.put('/dealers/:id', verifyToken, isOwner, updateDealer);
router.patch('/dealers/:id/status', verifyToken, isOwner, updateDealerStatus);
router.delete('/dealers/:id', verifyToken, isOwner, deleteDealer);

// Salesman Routes (Owner and Warehouse can view, Owner can manage)
router.get('/salesmen', verifyToken, isOwnerOrWarehouse, getAllSalesmen);
router.get('/salesmen/:id', verifyToken, isOwnerOrWarehouse, getSalesmanById);
router.put('/salesmen/:id', verifyToken, isOwner, updateSalesman);
router.patch('/salesmen/:id/status', verifyToken, isOwner, updateSalesmanStatus);
router.delete('/salesmen/:id', verifyToken, isOwner, deleteSalesman);

// Registration Code Routes (Owner and Warehouse can view, Owner can manage)
router.get('/registration-codes', verifyToken, isOwnerOrWarehouse, getRegistrationCodes);
router.delete('/registration-codes/cleanup', verifyToken, isOwner, cleanupExpiredCodes);

// Statistics Routes (Owner only)
router.get('/stats', verifyToken, isOwner, getUserStats);

module.exports = router;