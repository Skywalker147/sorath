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
    const { warehouseId, dealerId, salesmanId, items } = req.body;
    const { role, id: userId } = req.user;

    // Validation
    if (!warehouseId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Warehouse ID and items array are required' 
      });
    }

    // If user is warehouse, only allow creating orders for their warehouse
    if (role === 'warehouse' && parseInt(warehouseId) !== userId) {
      return res.status(403).json({ 
        error: 'Access denied to create orders for other warehouses' 
      });
    }

    // Validate items
    for (const item of items) {
      if (!item.item_id || !item.quantity || !item.price_per_item) {
        return res.status(400).json({ 
          error: 'Each item must have item_id, quantity, and price_per_item' 
        });
      }

      if (isNaN(item.quantity) || item.quantity <= 0) {
        return res.status(400).json({ 
          error: 'Item quantities must be positive numbers' 
        });
      }

      if (isNaN(item.price_per_item) || item.price_per_item <= 0) {
        return res.status(400).json({ 
          error: 'Item prices must be positive numbers' 
        });
      }
    }

    // At least one of dealer or salesman must be specified
    if (!dealerId && !salesmanId) {
      return res.status(400).json({ 
        error: 'Either dealer or salesman must be specified' 
      });
    }

    const result = await OrderModel.createOrder({
      warehouseId: parseInt(warehouseId),
      dealerId: dealerId ? parseInt(dealerId) : null,
      salesmanId: salesmanId ? parseInt(salesmanId) : null,
      items: items.map(item => ({
        item_id: parseInt(item.item_id),
        quantity: parseInt(item.quantity),
        price_per_item: parseFloat(item.price_per_item)
      }))
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create order error:', error);
    if (error.message.includes('Insufficient inventory')) {
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
    const { dealerId, salesmanId, items } = req.body;
    const { role, id: userId } = req.user;

    // Validate items if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        if (!item.item_id || !item.quantity || !item.price_per_item) {
          return res.status(400).json({ 
            error: 'Each item must have item_id, quantity, and price_per_item' 
          });
        }

        if (isNaN(item.quantity) || item.quantity <= 0) {
          return res.status(400).json({ 
            error: 'Item quantities must be positive numbers' 
          });
        }

        if (isNaN(item.price_per_item) || item.price_per_item <= 0) {
          return res.status(400).json({ 
            error: 'Item prices must be positive numbers' 
          });
        }
      }
    }

    await OrderModel.updateOrder(id, {
      dealerId: dealerId ? parseInt(dealerId) : null,
      salesmanId: salesmanId ? parseInt(salesmanId) : null,
      items: items ? items.map(item => ({
        item_id: parseInt(item.item_id),
        quantity: parseInt(item.quantity),
        price_per_item: parseFloat(item.price_per_item)
      })) : null
    }, role, userId);

    res.json({
      success: true,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Update order error:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: error.message });
    } else if (error.message.includes('Cannot modify') || error.message.includes('Insufficient inventory')) {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { transportStatus, paymentStatus } = req.body;
    const { role, id: userId } = req.user;

    // Validate status values
    if (transportStatus && !['pending', 'dispatched', 'delivered', 'cancelled'].includes(transportStatus)) {
      return res.status(400).json({ 
        error: 'Invalid transport status. Must be pending, dispatched, delivered, or cancelled' 
      });
    }

    if (paymentStatus && !['pending', 'partial', 'paid'].includes(paymentStatus)) {
      return res.status(400).json({ 
        error: 'Invalid payment status. Must be pending, partial, or paid' 
      });
    }

    const affected = await OrderModel.updateOrderStatus(id, {
      transportStatus,
      paymentStatus
    }, role, userId);
    
    if (affected === 0) {
      return res.status(404).json({ error: 'Order not found or access denied' });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully'
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
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
    const { warehouseId } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their stats
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const stats = await OrderModel.getOrderStats(
      targetWarehouseId ? parseInt(targetWarehouseId) : null
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

// Get monthly sales data
const getMonthlySales = async (req, res) => {
  try {
    const { warehouseId, year = new Date().getFullYear() } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their data
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const salesData = await OrderModel.getMonthlySales(
      targetWarehouseId ? parseInt(targetWarehouseId) : null,
      parseInt(year)
    );

    res.json({
      success: true,
      data: salesData
    });
  } catch (error) {
    console.error('Get monthly sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get pending orders
const getPendingOrders = async (req, res) => {
  try {
    const { warehouseId, limit = 10 } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their orders
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const orders = await OrderModel.getPendingOrders(
      targetWarehouseId ? parseInt(targetWarehouseId) : null,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: orders
    });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Bulk update order status
const bulkUpdateStatus = async (req, res) => {
  try {
    const { orderIds, transportStatus, paymentStatus } = req.body;
    const { role, id: userId } = req.user;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({ error: 'Order IDs array is required' });
    }

    // Validate status values
    if (transportStatus && !['pending', 'dispatched', 'delivered', 'cancelled'].includes(transportStatus)) {
      return res.status(400).json({ 
        error: 'Invalid transport status' 
      });
    }

    if (paymentStatus && !['pending', 'partial', 'paid'].includes(paymentStatus)) {
      return res.status(400).json({ 
        error: 'Invalid payment status' 
      });
    }

    let successCount = 0;
    const errors = [];

    for (const orderId of orderIds) {
      try {
        const affected = await OrderModel.updateOrderStatus(orderId, {
          transportStatus,
          paymentStatus
        }, role, userId);
        
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
    console.error('Bulk update status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Generate invoice (placeholder for future implementation)
const generateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const order = await OrderModel.getOrderById(id, role, userId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // This would generate PDF invoice
    res.status(501).json({ 
      error: 'Invoice generation not yet implemented',
      data: order 
    });
  } catch (error) {
    console.error('Generate invoice error:', error);
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
  updateOrderStatus,
  deleteOrder,
  getOrderStats,
  getMonthlySales,
  getPendingOrders,
  bulkUpdateStatus,
  generateInvoice,
  exportOrders
};