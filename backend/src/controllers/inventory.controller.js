// src/controllers/inventory.controller.js
const inventoryService = require('../services/inventory.service');

async function getAllInventory(req, res) {
  try {
    const inventory = await inventoryService.getAllInventory();
    return res.json(inventory);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getInventoryForItem(req, res) {
  try {
    const itemId = req.params.itemId;
    const inventory = await inventoryService.getInventoryForItem(itemId);
    return res.json(inventory);
  } catch (err) {
    if (err.message === 'Item not found') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

async function updateInventory(req, res) {
  try {
    const itemId = req.params.itemId;
    const { quantity, reason } = req.body;
    
    if (quantity === undefined) {
      return res.status(400).json({ error: 'Quantity is required' });
    }
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Reason is required for inventory changes' });
    }
    
    const result = await inventoryService.updateInventory(
      itemId,
      quantity,
      reason,
      req.user.adminId
    );
    
    return res.json({
      message: 'Inventory updated successfully',
      result
    });
  } catch (err) {
    if (err.message === 'Item not found') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
}

async function adjustInventory(req, res) {
  try {
    const itemId = req.params.itemId;
    const { adjustment, reason } = req.body;
    
    if (adjustment === undefined) {
      return res.status(400).json({ error: 'Adjustment value is required' });
    }
    
    if (!reason || reason.trim() === '') {
      return res.status(400).json({ error: 'Reason is required for inventory changes' });
    }
    
    const result = await inventoryService.adjustInventory(
      itemId,
      adjustment,
      reason,
      req.user.adminId
    );
    
    return res.json({
      message: 'Inventory adjusted successfully',
      result
    });
  } catch (err) {
    if (err.message === 'Item not found') {
      return res.status(404).json({ error: err.message });
    }
    if (err.message === 'Insufficient inventory') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(400).json({ error: err.message });
  }
}

async function getInventoryHistory(req, res) {
  try {
    const itemId = req.params.itemId || null;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    
    const history = await inventoryService.getInventoryHistory(itemId, limit);
    return res.json(history);
  } catch (err) {
    if (err.message === 'Item not found') {
      return res.status(404).json({ error: err.message });
    }
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllInventory,
  getInventoryForItem,
  updateInventory,
  adjustInventory,
  getInventoryHistory
};