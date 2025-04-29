// src/services/inventory.service.js
const inventoryModel = require('../models/inventory.model');
const inventoryHistoryModel = require('../models/inventoryHistory.model');
const itemModel = require('../models/item.model');

async function getAllInventory() {
  return inventoryModel.getAllInventory();
}

async function getInventoryForItem(itemId) {
  // Check if item exists
  const item = await itemModel.getItemById(itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  
  const inventory = await inventoryModel.getInventoryForItem(itemId);
  return {
    item,
    inventory: inventory || { item_id: itemId, quantity: 0 }
  };
}

async function updateInventory(itemId, quantity, reason, adminId) {
  // Check if item exists
  const item = await itemModel.getItemById(itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  
  // Get current inventory
  const currentInventory = await inventoryModel.getInventoryForItem(itemId);
  const currentQuantity = currentInventory ? currentInventory.quantity : 0;
  
  // Calculate change
  const quantityChange = quantity - currentQuantity;
  
  // Update inventory
  await inventoryModel.updateInventoryQuantity(itemId, quantity);
  
  // Record history
  await inventoryHistoryModel.addInventoryHistoryEntry({
    itemId,
    quantityChange,
    reason,
    adminId
  });
  
  return {
    previousQuantity: currentQuantity,
    newQuantity: quantity,
    change: quantityChange
  };
}

async function adjustInventory(itemId, adjustment, reason, adminId) {
  // Check if item exists
  const item = await itemModel.getItemById(itemId);
  if (!item) {
    throw new Error('Item not found');
  }
  
  // Adjust inventory
  await inventoryModel.adjustInventoryQuantity(itemId, adjustment);
  
  // Record history
  await inventoryHistoryModel.addInventoryHistoryEntry({
    itemId,
    quantityChange: adjustment,
    reason,
    adminId
  });
  
  // Get updated inventory
  const updatedInventory = await inventoryModel.getInventoryForItem(itemId);
  
  return {
    previousQuantity: updatedInventory.quantity - adjustment,
    newQuantity: updatedInventory.quantity,
    change: adjustment
  };
}

async function getInventoryHistory(itemId = null, limit = 50) {
  if (itemId) {
    // Check if item exists
    const item = await itemModel.getItemById(itemId);
    if (!item) {
      throw new Error('Item not found');
    }
    
    return inventoryHistoryModel.getInventoryHistoryForItem(itemId, limit);
  }
  
  return inventoryHistoryModel.getAllInventoryHistory(limit);
}

module.exports = {
  getAllInventory,
  getInventoryForItem,
  updateInventory,
  adjustInventory,
  getInventoryHistory
};