// src/services/item.service.js
const itemModel = require('../models/item.model');
const inventoryModel = require('../models/inventory.model');

async function getAllItems() {
  return itemModel.getAllItems();
}

async function getItemById(id) {
  return itemModel.getItemById(id);
}

async function createItem(itemData) {
  // Validate item data
  if (!itemData.name || !itemData.pricePerGatha) {
    throw new Error('Item name and price per gatha are required');
  }
  
  // Set default pack count if not provided
  if (!itemData.packsPerGatha) {
    itemData.packsPerGatha = 30; // Default as specified
  }
  
  // Create the item
  const itemId = await itemModel.createItem(itemData);
  
  // Initialize inventory to 0 if not specified
  if (itemData.initialStock !== undefined) {
    await inventoryModel.createInventoryEntry(itemId, itemData.initialStock);
  } else {
    await inventoryModel.createInventoryEntry(itemId, 0);
  }
  
  return itemId;
}

async function updateItem(id, itemData) {
  // Check if item exists
  const existingItem = await itemModel.getItemById(id);
  if (!existingItem) {
    throw new Error('Item not found');
  }
  
  // Update the item
  return itemModel.updateItem(id, itemData);
}

async function deleteItem(id) {
  // Check if item exists
  const existingItem = await itemModel.getItemById(id);
  if (!existingItem) {
    throw new Error('Item not found');
  }
  
  // Check if there's inventory
  const inventory = await inventoryModel.getInventoryForItem(id);
  if (inventory && inventory.quantity > 0) {
    throw new Error('Cannot delete item with existing inventory');
  }
  
  // Delete the item
  return itemModel.deleteItem(id);
}

async function getItemWithInventory(id) {
  const item = await itemModel.getItemById(id);
  
  if (!item) {
    return null;
  }
  
  const inventory = await inventoryModel.getInventoryForItem(id);
  
  return {
    ...item,
    currentStock: inventory ? inventory.quantity : 0
  };
}

async function getAllItemsWithInventory() {
  const items = await itemModel.getAllItems();
  const itemsWithInventory = [];
  
  for (const item of items) {
    const inventory = await inventoryModel.getInventoryForItem(item.id);
    
    itemsWithInventory.push({
      ...item,
      currentStock: inventory ? inventory.quantity : 0
    });
  }
  
  return itemsWithInventory;
}

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getItemWithInventory,
  getAllItemsWithInventory
};