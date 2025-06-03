const ItemModel = require('../models/itemModel');

// Get all items
const getAllItems = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    
    const filters = {};
    if (status && ['active', 'inactive'].includes(status)) {
      filters.status = status;
    }
    if (search) {
      filters.search = search.trim();
    }

    const items = await ItemModel.getAllItems(filters);
    
    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: items.length
      }
    });
  } catch (error) {
    console.error('Get items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get item by ID
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ItemModel.getItemById(id);
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    console.error('Get item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create item
const createItem = async (req, res) => {
  try {
    const { name, price } = req.body;

    // Validation
    if (!name || !price) {
      return res.status(400).json({ 
        error: 'Name and price are required' 
      });
    }

    if (isNaN(price) || parseFloat(price) < 0) {
      return res.status(400).json({ 
        error: 'Price must be a valid positive number' 
      });
    }

    // Check if item name already exists
    const nameExists = await ItemModel.checkItemName(name.trim());
    if (nameExists) {
      return res.status(400).json({ error: 'Item name already exists' });
    }

    // Create item
    const itemId = await ItemModel.createItem({
      name: name.trim(),
      price: parseFloat(price)
    });

    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: { id: itemId }
    });
  } catch (error) {
    console.error('Create item error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Item name already exists' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Update item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price } = req.body;

    // Validation
    if (!name || !price) {
      return res.status(400).json({ 
        error: 'Name and price are required' 
      });
    }

    if (isNaN(price) || parseFloat(price) < 0) {
      return res.status(400).json({ 
        error: 'Price must be a valid positive number' 
      });
    }

    // Check if item exists
    const item = await ItemModel.getItemById(id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Check if item name already exists (excluding current item)
    const nameExists = await ItemModel.checkItemName(name.trim(), id);
    if (nameExists) {
      return res.status(400).json({ error: 'Item name already exists' });
    }

    // Update item
    await ItemModel.updateItem(id, {
      name: name.trim(),
      price: parseFloat(price)
    });

    res.json({
      success: true,
      message: 'Item updated successfully'
    });
  } catch (error) {
    console.error('Update item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update item status
const updateItemStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Status must be active or inactive' });
    }

    const affected = await ItemModel.updateItemStatus(id, status);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      success: true,
      message: `Item ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Update item status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;

    const affected = await ItemModel.deleteItem(id);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({
      success: true,
      message: 'Item deleted successfully'
    });
  } catch (error) {
    console.error('Delete item error:', error);
    if (error.message.includes('Cannot delete item')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Get item statistics
const getItemStats = async (req, res) => {
  try {
    const stats = await ItemModel.getItemStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get item stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get items with inventory
const getItemsWithInventory = async (req, res) => {
  try {
    const items = await ItemModel.getItemsWithInventory();
    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get items with inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk update prices
const bulkUpdatePrices = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required' });
    }

    // Validate updates
    for (const update of updates) {
      if (!update.id || !update.price) {
        return res.status(400).json({ error: 'Each update must have id and price' });
      }
      if (isNaN(update.price) || parseFloat(update.price) < 0) {
        return res.status(400).json({ error: 'All prices must be valid positive numbers' });
      }
    }

    await ItemModel.bulkUpdatePrices(updates);

    res.json({
      success: true,
      message: `${updates.length} items updated successfully`
    });
  } catch (error) {
    console.error('Bulk update prices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Search items
const searchItems = async (req, res) => {
  try {
    const { q: searchTerm, page = 1, limit = 10 } = req.query;

    if (!searchTerm) {
      return res.status(400).json({ error: 'Search term is required' });
    }

    const result = await ItemModel.searchItems(
      searchTerm.trim(), 
      parseInt(page), 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Search items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get price history
const getPriceHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { days = 30 } = req.query;

    const history = await ItemModel.getPriceHistory(id, parseInt(days));

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const { threshold = 10 } = req.query;
    const items = await ItemModel.getLowStockItems(parseInt(threshold));

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get items by warehouse
const getItemsByWarehouse = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const items = await ItemModel.getItemsByWarehouse(warehouseId);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get items by warehouse error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Import items from CSV (placeholder for future implementation)
const importItems = async (req, res) => {
  try {
    // This would handle CSV file upload and processing
    res.status(501).json({ 
      error: 'Import functionality not yet implemented' 
    });
  } catch (error) {
    console.error('Import items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export items to CSV (placeholder for future implementation)
const exportItems = async (req, res) => {
  try {
    // This would generate and return CSV file
    res.status(501).json({ 
      error: 'Export functionality not yet implemented' 
    });
  } catch (error) {
    console.error('Export items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
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
};