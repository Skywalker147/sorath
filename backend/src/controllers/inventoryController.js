const InventoryModel = require('../models/inventoryModel');
const db = require('../config/db');

// Get inventory
const getInventory = async (req, res) => {
  try {
    const { 
      warehouseId, 
      search, 
      lowStock, 
      warehouseStatus = 'active', 
      itemStatus = 'active' 
    } = req.query;
    
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their inventory
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const filters = {
      search: search?.trim(),
      lowStock: lowStock ? parseInt(lowStock) : null,
      warehouseStatus,
      itemStatus
    };

    const inventory = await InventoryModel.getInventory(targetWarehouseId, filters);

    res.json({
      success: true,
      data: inventory,
      meta: {
        userRole: role,
        canModify: role === 'warehouse', // Only warehouse can modify
        canTransfer: role === 'owner'     // Only owner can transfer
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get inventory for specific item
const getItemInventory = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { role, id: userId } = req.user;
    
    let inventory = await InventoryModel.getItemInventory(itemId);
    
    // If user is warehouse, filter to only their warehouse
    if (role === 'warehouse') {
      inventory = inventory.filter(item => item.warehouse_id === userId);
    }

    res.json({
      success: true,
      data: inventory,
      meta: {
        userRole: role,
        canModify: role === 'warehouse',
        canTransfer: role === 'owner'
      }
    });
  } catch (error) {
    console.error('Get item inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get specific inventory
const getSpecificInventory = async (req, res) => {
  try {
    const { warehouseId, itemId } = req.params;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only allow their warehouse
    if (role === 'warehouse' && parseInt(warehouseId) !== userId) {
      return res.status(403).json({ error: 'Access denied to this warehouse inventory' });
    }

    const inventory = await InventoryModel.getSpecificInventory(warehouseId, itemId);

    if (!inventory) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    res.json({
      success: true,
      data: inventory,
      meta: {
        userRole: role,
        canModify: role === 'warehouse',
        canTransfer: role === 'owner'
      }
    });
  } catch (error) {
    console.error('Get specific inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add new inventory item to warehouse - ONLY for warehouse users
const addInventoryItem = async (req, res) => {
  try {
    const { warehouseId, itemId } = req.params;
    const { quantity } = req.body;
    const { role, id: userId } = req.user;

    // CRITICAL: Only warehouse users can add inventory
    if (role !== 'warehouse') {
      return res.status(403).json({ 
        error: 'Only warehouse users can add inventory items' 
      });
    }

    // Validation
    if (quantity === undefined || quantity === null || isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Valid quantity greater than 0 is required' });
    }

    // Warehouse can only add to their own inventory
    if (parseInt(warehouseId) !== userId) {
      return res.status(403).json({ error: 'Access denied to this warehouse inventory' });
    }

    // Check if item exists
    const [itemCheck] = await db.execute(
      'SELECT id, name, status FROM items WHERE id = ?',
      [itemId]
    );

    if (itemCheck.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (itemCheck[0].status !== 'active') {
      return res.status(400).json({ error: 'Cannot add inactive item to inventory' });
    }

    // Check if inventory already exists
    const [existingInventory] = await db.execute(
      'SELECT id, quantity FROM inventory WHERE warehouse_id = ? AND item_id = ?',
      [warehouseId, itemId]
    );

    if (existingInventory.length > 0) {
      return res.status(400).json({ 
        error: 'Item already exists in inventory. Use update instead.',
        currentQuantity: existingInventory[0].quantity
      });
    }

    // Add new inventory item
    const [result] = await db.execute(
      'INSERT INTO inventory (warehouse_id, item_id, quantity) VALUES (?, ?, ?)',
      [warehouseId, itemId, parseInt(quantity)]
    );

    res.json({
      success: true,
      message: 'Inventory item added successfully',
      data: { 
        inventoryId: result.insertId,
        warehouseId: parseInt(warehouseId),
        itemId: parseInt(itemId),
        quantity: parseInt(quantity),
        addedBy: 'warehouse'
      }
    });
  } catch (error) {
    console.error('Add inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update inventory - ONLY for warehouse users
const updateInventory = async (req, res) => {
  try {
    const { warehouseId, itemId } = req.params;
    const { quantity, type = 'set' } = req.body;
    const { role, id: userId } = req.user;

    // CRITICAL: Only warehouse users can modify inventory
    if (role !== 'warehouse') {
      return res.status(403).json({ 
        error: 'Only warehouse users can modify inventory. Owners can only view inventory data.' 
      });
    }

    // Validation
    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    if (isNaN(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'Quantity must be a valid non-negative number' });
    }

    if (!['set', 'add', 'subtract'].includes(type)) {
      return res.status(400).json({ error: 'Type must be set, add, or subtract' });
    }

    // Warehouse can only modify their own inventory
    if (parseInt(warehouseId) !== userId) {
      return res.status(403).json({ error: 'Access denied to this warehouse inventory' });
    }

    const newQuantity = await InventoryModel.updateInventory(
      warehouseId, 
      itemId, 
      parseInt(quantity), 
      type
    );

    res.json({
      success: true,
      message: 'Inventory updated successfully',
      data: { 
        newQuantity,
        updatedBy: 'warehouse',
        warehouseId: userId
      }
    });
  } catch (error) {
    console.error('Update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk update inventory - ONLY for warehouse users
const bulkUpdateInventory = async (req, res) => {
  try {
    const { updates } = req.body;
    const { role, id: userId } = req.user;

    // CRITICAL: Only warehouse users can modify inventory
    if (role !== 'warehouse') {
      return res.status(403).json({ 
        error: 'Only warehouse users can modify inventory. Owners can only view inventory data.' 
      });
    }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }

    // Validate updates
    for (const update of updates) {
      if (!update.warehouseId || !update.itemId || update.quantity === undefined) {
        return res.status(400).json({ 
          error: 'Each update must have warehouseId, itemId, and quantity' 
        });
      }

      if (isNaN(update.quantity) || update.quantity < 0) {
        return res.status(400).json({ 
          error: 'All quantities must be valid non-negative numbers' 
        });
      }

      // Warehouse can only modify their own inventory
      if (parseInt(update.warehouseId) !== userId) {
        return res.status(403).json({ 
          error: 'Access denied to update inventory for other warehouses' 
        });
      }
    }

    await InventoryModel.bulkUpdateInventory(updates);

    res.json({
      success: true,
      message: `${updates.length} inventory records updated successfully`,
      data: {
        updatedBy: 'warehouse',
        warehouseId: userId,
        updatedCount: updates.length
      }
    });
  } catch (error) {
    console.error('Bulk update inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Transfer inventory - ONLY for owner
const transferInventory = async (req, res) => {
  try {
    const { fromWarehouseId, toWarehouseId, itemId, quantity } = req.body;
    const { role } = req.user;

    // CRITICAL: Only owner can transfer between warehouses
    if (role !== 'owner') {
      return res.status(403).json({ 
        error: 'Only owner can transfer inventory between warehouses' 
      });
    }

    // Validation
    if (!fromWarehouseId || !toWarehouseId || !itemId || !quantity) {
      return res.status(400).json({ 
        error: 'All fields are required: fromWarehouseId, toWarehouseId, itemId, quantity' 
      });
    }

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be a positive number' });
    }

    if (fromWarehouseId === toWarehouseId) {
      return res.status(400).json({ error: 'Source and destination warehouses must be different' });
    }

    await InventoryModel.transferInventory(
      fromWarehouseId, 
      toWarehouseId, 
      itemId, 
      parseInt(quantity)
    );

    res.json({
      success: true,
      message: 'Inventory transferred successfully',
      data: {
        transferredBy: 'owner',
        fromWarehouseId,
        toWarehouseId,
        itemId,
        quantity: parseInt(quantity)
      }
    });
  } catch (error) {
    console.error('Transfer inventory error:', error);
    if (error.message.includes('Insufficient quantity')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Get inventory statistics
const getInventoryStats = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their stats
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const stats = await InventoryModel.getInventoryStats(targetWarehouseId);

    res.json({
      success: true,
      data: stats,
      meta: {
        userRole: role,
        warehouseScope: role === 'warehouse' ? 'single' : 'all',
        canModify: role === 'warehouse',
        canTransfer: role === 'owner'
      }
    });
  } catch (error) {
    console.error('Get inventory stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get warehouse summary - ONLY for owner
const getWarehouseSummary = async (req, res) => {
  try {
    const { role } = req.user;
    
    // CRITICAL: Only owner can see all warehouse summary
    if (role !== 'owner') {
      return res.status(403).json({ 
        error: 'Only owner can view warehouse summary across all warehouses' 
      });
    }

    const summary = await InventoryModel.getWarehouseSummary();

    res.json({
      success: true,
      data: summary,
      meta: {
        userRole: role,
        scope: 'all_warehouses'
      }
    });
  } catch (error) {
    console.error('Get warehouse summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const { threshold = 10, warehouseId } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their low stock items
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const items = await InventoryModel.getLowStockItems(
      parseInt(threshold), 
      targetWarehouseId
    );

    res.json({
      success: true,
      data: items,
      meta: {
        userRole: role,
        threshold: parseInt(threshold),
        warehouseScope: role === 'warehouse' ? 'single' : 'all',
        canModify: role === 'warehouse'
      }
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get items without inventory
const getItemsWithoutInventory = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only allow their warehouse
    if (role === 'warehouse' && parseInt(warehouseId) !== userId) {
      return res.status(403).json({ error: 'Access denied to this warehouse inventory' });
    }

    const items = await InventoryModel.getItemsWithoutInventory(warehouseId);

    res.json({
      success: true,
      data: items,
      meta: {
        userRole: role,
        warehouseId: parseInt(warehouseId),
        canModify: role === 'warehouse'
      }
    });
  } catch (error) {
    console.error('Get items without inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete inventory - ONLY for warehouse users
const deleteInventory = async (req, res) => {
  try {
    const { warehouseId, itemId } = req.params;
    const { role, id: userId } = req.user;

    // CRITICAL: Only warehouse users can modify inventory
    if (role !== 'warehouse') {
      return res.status(403).json({ 
        error: 'Only warehouse users can modify inventory. Owners can only view inventory data.' 
      });
    }

    // Warehouse can only modify their own inventory
    if (parseInt(warehouseId) !== userId) {
      return res.status(403).json({ error: 'Access denied to this warehouse inventory' });
    }

    const affected = await InventoryModel.deleteInventory(warehouseId, itemId);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Inventory record not found' });
    }

    res.json({
      success: true,
      message: 'Inventory record deleted successfully',
      data: {
        deletedBy: 'warehouse',
        warehouseId: userId
      }
    });
  } catch (error) {
    console.error('Delete inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get inventory history
const getInventoryHistory = async (req, res) => {
  try {
    const { warehouseId, itemId } = req.params;
    const { days = 30 } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only allow their warehouse
    if (role === 'warehouse' && parseInt(warehouseId) !== userId) {
      return res.status(403).json({ error: 'Access denied to this warehouse inventory' });
    }

    const history = await InventoryModel.getInventoryHistory(
      warehouseId, 
      itemId, 
      parseInt(days)
    );

    res.json({
      success: true,
      data: history,
      meta: {
        userRole: role,
        days: parseInt(days),
        canModify: role === 'warehouse'
      }
    });
  } catch (error) {
    console.error('Get inventory history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Check availability
const checkAvailability = async (req, res) => {
  try {
    const { warehouseId, itemId } = req.params;
    const { quantity } = req.query;
    const { role, id: userId } = req.user;

    if (!quantity) {
      return res.status(400).json({ error: 'Quantity parameter is required' });
    }

    // If user is warehouse, only allow their warehouse
    if (role === 'warehouse' && parseInt(warehouseId) !== userId) {
      return res.status(403).json({ error: 'Access denied to this warehouse inventory' });
    }

    const availability = await InventoryModel.checkAvailability(
      warehouseId, 
      itemId, 
      parseInt(quantity)
    );

    res.json({
      success: true,
      data: availability,
      meta: {
        userRole: role,
        requestedQuantity: parseInt(quantity),
        canModify: role === 'warehouse'
      }
    });
  } catch (error) {
    console.error('Check availability error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
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
};