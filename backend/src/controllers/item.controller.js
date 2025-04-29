// src/controllers/item.controller.js
const itemService = require('../services/item.service');

async function getAllItems(req, res) {
  try {
    const items = await itemService.getAllItems();
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getItemById(req, res) {
  try {
    const itemId = req.params.id;
    const item = await itemService.getItemById(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function createItem(req, res) {
  try {
    const { name, description, pricePerGatha, packsPerGatha, initialStock } = req.body;
    
    const itemId = await itemService.createItem({
      name,
      description,
      pricePerGatha,
      packsPerGatha,
      initialStock
    });
    
    return res.status(201).json({ 
      id: itemId,
      message: 'Item created successfully' 
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function updateItem(req, res) {
  try {
    const itemId = req.params.id;
    const { name, description, pricePerGatha, packsPerGatha } = req.body;
    
    const updated = await itemService.updateItem(itemId, {
      name,
      description,
      pricePerGatha,
      packsPerGatha
    });
    
    if (!updated) {
      return res.status(404).json({ error: 'Item not found or not updated' });
    }
    
    return res.json({ message: 'Item updated successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function deleteItem(req, res) {
  try {
    const itemId = req.params.id;
    const deleted = await itemService.deleteItem(itemId);
    
    if (!deleted) {
      return res.status(404).json({ error: 'Item not found or not deleted' });
    }
    
    return res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function getAllItemsWithInventory(req, res) {
  try {
    const items = await itemService.getAllItemsWithInventory();
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

async function getItemWithInventory(req, res) {
  try {
    const itemId = req.params.id;
    const item = await itemService.getItemWithInventory(itemId);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getAllItemsWithInventory,
  getItemWithInventory
};