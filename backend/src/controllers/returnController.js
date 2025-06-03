const ReturnModel = require('../models/returnModel');

// Get all return orders
const getAllReturns = async (req, res) => {
  try {
    const { 
      warehouseId, 
      dealerId, 
      salesmanId, 
      status, 
      itemId, 
      search, 
      startDate, 
      endDate,
      page = 1, 
      limit = 50 
    } = req.query;
    
    const { role, id: userId } = req.user;

    const filters = {
      warehouseId: warehouseId ? parseInt(warehouseId) : null,
      dealerId: dealerId ? parseInt(dealerId) : null,
      salesmanId: salesmanId ? parseInt(salesmanId) : null,
      status,
      itemId: itemId ? parseInt(itemId) : null,
      search: search?.trim(),
      startDate,
      endDate
    };

    const returns = await ReturnModel.getAllReturns(filters, role, userId);

    res.json({
      success: true,
      data: returns,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: returns.length
      }
    });
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get return order by ID
const getReturnById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const returnOrder = await ReturnModel.getReturnById(id, role, userId);
    
    if (!returnOrder) {
      return res.status(404).json({ error: 'Return order not found' });
    }
    
    res.json({
      success: true,
      data: returnOrder
    });
  } catch (error) {
    console.error('Get return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create return order
const createReturn = async (req, res) => {
  try {
    const { 
      originalOrderId, 
      warehouseId, 
      dealerId, 
      salesmanId, 
      itemId, 
      quantity, 
      reason 
    } = req.body;
    const { role, id: userId } = req.user;

    // Validation
    if (!warehouseId || !itemId || !quantity) {
      return res.status(400).json({ 
        error: 'Warehouse ID, item ID, and quantity are required' 
      });
    }

    // If user is warehouse, only allow creating returns for their warehouse
    if (role === 'warehouse' && parseInt(warehouseId) !== userId) {
      return res.status(403).json({ 
        error: 'Access denied to create returns for other warehouses' 
      });
    }

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ 
        error: 'Quantity must be a positive number' 
      });
    }

    // At least one of dealer or salesman must be specified
    if (!dealerId && !salesmanId) {
      return res.status(400).json({ 
        error: 'Either dealer or salesman must be specified' 
      });
    }

    const result = await ReturnModel.createReturn({
      originalOrderId: originalOrderId ? parseInt(originalOrderId) : null,
      warehouseId: parseInt(warehouseId),
      dealerId: dealerId ? parseInt(dealerId) : null,
      salesmanId: salesmanId ? parseInt(salesmanId) : null,
      itemId: parseInt(itemId),
      quantity: parseInt(quantity),
      reason: reason?.trim() || null
    });

    res.status(201).json({
      success: true,
      message: 'Return order created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create return error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update return order
const updateReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      originalOrderId, 
      dealerId, 
      salesmanId, 
      itemId, 
      quantity, 
      reason 
    } = req.body;
    const { role, id: userId } = req.user;

    // Validation
    if (!itemId || !quantity) {
      return res.status(400).json({ 
        error: 'Item ID and quantity are required' 
      });
    }

    if (isNaN(quantity) || quantity <= 0) {
      return res.status(400).json({ 
        error: 'Quantity must be a positive number' 
      });
    }

    await ReturnModel.updateReturn(id, {
      originalOrderId: originalOrderId ? parseInt(originalOrderId) : null,
      dealerId: dealerId ? parseInt(dealerId) : null,
      salesmanId: salesmanId ? parseInt(salesmanId) : null,
      itemId: parseInt(itemId),
      quantity: parseInt(quantity),
      reason: reason?.trim() || null
    }, role, userId);

    res.json({
      success: true,
      message: 'Return order updated successfully'
    });
  } catch (error) {
    console.error('Update return error:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('Cannot modify')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Update return status
const updateReturnStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, id: userId } = req.user;

    // Validate status values
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be pending, approved, or rejected' 
      });
    }

    const affected = await ReturnModel.updateReturnStatus(id, status, role, userId);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Return order not found or access denied' });
    }

    res.json({
      success: true,
      message: 'Return status updated successfully'
    });
  } catch (error) {
    console.error('Update return status error:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Delete return order
const deleteReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    await ReturnModel.deleteReturn(id, role, userId);

    res.json({
      success: true,
      message: 'Return order deleted successfully'
    });
  } catch (error) {
    console.error('Delete return error:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('Cannot delete')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Get return statistics
const getReturnStats = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their stats
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const stats = await ReturnModel.getReturnStats(
      targetWarehouseId ? parseInt(targetWarehouseId) : null
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get return stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get returns by order ID
const getReturnsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const returns = await ReturnModel.getReturnsByOrderId(orderId);

    res.json({
      success: true,
      data: returns
    });
  } catch (error) {
    console.error('Get returns by order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pending returns
const getPendingReturns = async (req, res) => {
  try {
    const { warehouseId, limit = 10 } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their returns
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const returns = await ReturnModel.getPendingReturns(
      targetWarehouseId ? parseInt(targetWarehouseId) : null,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: returns
    });
  } catch (error) {
    console.error('Get pending returns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get monthly return data
const getMonthlyReturns = async (req, res) => {
  try {
    const { warehouseId, year = new Date().getFullYear() } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their data
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const returnData = await ReturnModel.getMonthlyReturns(
      targetWarehouseId ? parseInt(targetWarehouseId) : null,
      parseInt(year)
    );

    res.json({
      success: true,
      data: returnData
    });
  } catch (error) {
    console.error('Get monthly returns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get returnable items from an order
const getReturnableItems = async (req, res) => {
  try {
    const { orderId } = req.params;
    const items = await ReturnModel.getReturnableItems(orderId);

    res.json({
      success: true,
      data: items
    });
  } catch (error) {
    console.error('Get returnable items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk update return status
const bulkUpdateReturnStatus = async (req, res) => {
  try {
    const { returnIds, status } = req.body;
    const { role, id: userId } = req.user;

    if (!Array.isArray(returnIds) || returnIds.length === 0) {
      return res.status(400).json({ error: 'Return IDs array is required' });
    }

    // Validate status values
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be pending, approved, or rejected' 
      });
    }

    let successCount = 0;
    const errors = [];

    for (const returnId of returnIds) {
      try {
        const affected = await ReturnModel.updateReturnStatus(returnId, status, role, userId);
        
        if (affected > 0) {
          successCount++;
        } else {
          errors.push(`Return ${returnId}: Not found or access denied`);
        }
      } catch (error) {
        errors.push(`Return ${returnId}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `${successCount} returns updated successfully`,
      updated: successCount,
      errors: errors
    });
  } catch (error) {
    console.error('Bulk update return status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate return report (placeholder for future implementation)
const generateReturnReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'pdf' } = req.query;
    
    // This would generate PDF/Excel report
    res.status(501).json({ 
      error: 'Return report generation not yet implemented' 
    });
  } catch (error) {
    console.error('Generate return report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export returns (placeholder for future implementation)
const exportReturns = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    // This would generate CSV/Excel export
    res.status(501).json({ 
      error: 'Export functionality not yet implemented' 
    });
  } catch (error) {
    console.error('Export returns error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllReturns,
  getReturnById,
  createReturn,
  updateReturn,
  updateReturnStatus,
  deleteReturn,
  getReturnStats,
  getReturnsByOrderId,
  getPendingReturns,
  getMonthlyReturns,
  getReturnableItems,
  bulkUpdateReturnStatus,
  generateReturnReport,
  exportReturns
};