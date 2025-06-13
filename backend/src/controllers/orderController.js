const OrderModel = require('../models/orderModel');

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const { 
      warehouseId, 
      dealerId, 
      salesmanId, 
      transportStatus, 
      paymentStatus, 
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
      transportStatus,
      paymentStatus,
      search: search?.trim(),
      startDate,
      endDate
    };

    const orders = await OrderModel.getAllOrders(filters, role, userId);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: orders.length
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const order = await OrderModel.getOrderById(id, role, userId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create order
const createOrder = async (req, res) => {
  try {
    const { warehouseId, dealerId, salesmanId, items, notes } = req.body;
    const { role, id: userId } = req.user;

    // Validation
    if (!warehouseId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Warehouse ID and items array are required' 
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.itemId || !item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Each item must have valid itemId and quantity' 
        });
      }
    }

    // Role-specific validations
    if (role === 'dealer' && (!dealerId || parseInt(dealerId) !== userId)) {
      return res.status(400).json({ error: 'Dealer ID mismatch' });
    }

    if (role === 'salesman') {
      if (!salesmanId || parseInt(salesmanId) !== userId) {
        return res.status(400).json({ error: 'Salesman ID mismatch' });
      }
      if (!dealerId) {
        return res.status(400).json({ error: 'Salesman orders must specify a dealer' });
      }
    }

    if (role === 'warehouse') {
      if (!dealerId) {
        return res.status(400).json({ error: 'Warehouse orders must specify a dealer' });
      }
      if (parseInt(warehouseId) !== userId) {
        return res.status(400).json({ error: 'Warehouse ID mismatch' });
      }
    }

    const result = await OrderModel.createOrder({
      warehouseId: parseInt(warehouseId),
      dealerId: dealerId ? parseInt(dealerId) : null,
      salesmanId: salesmanId ? parseInt(salesmanId) : null,
      items,
      notes: notes?.trim() || null
    }, role, userId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create order error:', error);
    if (error.message.includes('not found') || error.message.includes('not active')) {
      res.status(400).json({ error: error.message });
    } else if (error.message.includes('mismatch') || error.message.includes('must specify')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Update order
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { items } = req.body;
    const { role, id: userId } = req.user;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Items array is required' 
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.itemId || !item.quantity || isNaN(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Each item must have valid itemId and quantity' 
        });
      }
    }

    await OrderModel.updateOrder(id, { items }, role, userId);

    res.json({
      success: true,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Update order error:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('Cannot modify')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Update transport status
const updateTransportStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, id: userId } = req.user;

    // Validate status
    const validStatuses = ['pending', 'dispatched', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: pending, dispatched, delivered, or cancelled' 
      });
    }

    // Role-specific validation
    if (role === 'dealer' && status !== 'delivered') {
      return res.status(400).json({ 
        error: 'Dealers can only mark orders as delivered' 
      });
    }

    if (role === 'salesman') {
      return res.status(403).json({ 
        error: 'Salesmen cannot update transport status' 
      });
    }

    const affected = await OrderModel.updateTransportStatus(id, status, role, userId);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    res.json({
      success: true,
      message: 'Transport status updated successfully'
    });
  } catch (error) {
    console.error('Update transport status error:', error);
    if (error.message.includes('Dealers can only')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Update payment status (warehouse and owner only)
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, id: userId } = req.user;

    // Validate status
    const validStatuses = ['pending', 'partial', 'paid'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: pending, partial, or paid' 
      });
    }

    const affected = await OrderModel.updatePaymentStatus(id, status, role, userId);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    if (error.message.includes('Only warehouse users')) {
      res.status(403).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Delete order
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    await OrderModel.deleteOrder(id, role, userId);

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('Cannot delete')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Get order statistics
const getOrderStats = async (req, res) => {
  try {
    const { warehouseId, dealerId, salesmanId } = req.query;
    const { role, id: userId } = req.user;
    
    let targetWarehouseId = warehouseId;
    let targetDealerId = dealerId;
    let targetSalesmanId = salesmanId;

    // Role-based filtering
    if (role === 'warehouse') {
      targetWarehouseId = userId;
      targetDealerId = null;
      targetSalesmanId = null;
    } else if (role === 'dealer') {
      targetWarehouseId = null;
      targetDealerId = userId;
      targetSalesmanId = null;
    } else if (role === 'salesman') {
      targetWarehouseId = null;
      targetDealerId = null;
      targetSalesmanId = userId;
    }

    const stats = await OrderModel.getOrderStats(
      targetWarehouseId ? parseInt(targetWarehouseId) : null,
      targetDealerId ? parseInt(targetDealerId) : null,
      targetSalesmanId ? parseInt(targetSalesmanId) : null
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get monthly order data
const getMonthlyOrders = async (req, res) => {
  try {
    const { warehouseId, year = new Date().getFullYear() } = req.query;
    const { role, id: userId } = req.user;
    
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const orderData = await OrderModel.getMonthlyOrders(
      targetWarehouseId ? parseInt(targetWarehouseId) : null,
      parseInt(year)
    );

    res.json({
      success: true,
      data: orderData
    });
  } catch (error) {
    console.error('Get monthly orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get top customers
const getTopCustomers = async (req, res) => {
  try {
    const { warehouseId, limit = 10 } = req.query;
    const { role, id: userId } = req.user;
    
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const customers = await OrderModel.getTopCustomers(
      targetWarehouseId ? parseInt(targetWarehouseId) : null,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get top customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pending orders (for dashboard)
const getPendingOrders = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const { role, id: userId } = req.user;

    const filters = {
      transportStatus: 'pending'
    };

    const orders = await OrderModel.getAllOrders(filters, role, userId);

    res.json({
      success: true,
      data: orders.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get dispatched orders (for mobile app - dealer can mark as received)
const getDispatchedOrders = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    if (role !== 'dealer') {
      return res.status(403).json({ 
        error: 'Only dealers can view dispatched orders' 
      });
    }

    const filters = {
      transportStatus: 'dispatched',
      dealerId: userId
    };

    const orders = await OrderModel.getAllOrders(filters, role, userId);

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get dispatched orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk update transport status
const bulkUpdateTransportStatus = async (req, res) => {
  try {
    const { orderIds, status } = req.body;
    const { role, id: userId } = req.user;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Order IDs array is required' });
    }

    const validStatuses = ['pending', 'dispatched', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be: pending, dispatched, delivered, or cancelled' 
      });
    }

    let successCount = 0;
    const errors = [];

    for (const orderId of orderIds) {
      try {
        const affected = await OrderModel.updateTransportStatus(orderId, status, role, userId);
        
        if (affected > 0) {
          successCount++;
        } else {
          errors.push(`Order ${orderId}: Not found or access denied`);
        }
      } catch (error) {
        errors.push(`Order ${orderId}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      message: `${successCount} orders updated successfully`,
      updated: successCount,
      errors: errors
    });
  } catch (error) {
    console.error('Bulk update transport status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate order report (placeholder for future implementation)
const generateOrderReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'pdf' } = req.query;
    
    // This would generate PDF/Excel report
    res.status(501).json({ 
      error: 'Order report generation not yet implemented' 
    });
  } catch (error) {
    console.error('Generate order report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Export orders (placeholder for future implementation)
const exportOrders = async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    // This would generate CSV/Excel export
    res.status(501).json({ 
      error: 'Export functionality not yet implemented' 
    });
  } catch (error) {
    console.error('Export orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  updateTransportStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats,
  getMonthlyOrders,
  getTopCustomers,
  getPendingOrders,
  getDispatchedOrders,
  bulkUpdateTransportStatus,
  generateOrderReport,
  exportOrders
};
