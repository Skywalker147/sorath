const OrderModel = require('../models/orderModel');

// Get all orders
const getAllOrders = async (req, res) => {
  try {
    const { 
      warehouseId, 
      dealerId, 
      salesmanId, 
      orderType,
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
      orderType,
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
      },
      meta: {
        userRole: role,
        canCreateOrder: ['owner', 'warehouse', 'dealer', 'salesman'].includes(role),
        canModifyOrder: ['owner', 'warehouse', 'dealer', 'salesman'].includes(role),
        canDeleteOrder: ['owner', 'warehouse', 'dealer', 'salesman'].includes(role)
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
      return res.status(404).json({ error: 'Order not found or access denied' });
    }
    
    // Check if user can modify this order
    const { canModify, reason } = await OrderModel.canModifyOrder(id, role, userId);
    
    res.json({
      success: true,
      data: order,
      meta: {
        userRole: role,
        canModify,
        modifyReason: reason
      }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create order with proper role handling
const createOrder = async (req, res) => {
  try {
    const { warehouseId, dealerId, salesmanId, items } = req.body;
    const { role, id: userId } = req.user;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ 
        error: 'Items array is required' 
      });
    }

    let targetWarehouseId = warehouseId;

    // Role-specific validations and warehouse ID handling
    if (role === 'warehouse') {
      // Warehouse users: use their own warehouse ID
      targetWarehouseId = userId;
      
      // Warehouse must specify a dealer
      if (!dealerId) {
        return res.status(400).json({ 
          error: 'Dealer must be specified when warehouse creates order' 
        });
      }
    } else if (role === 'dealer') {
      // Dealer creates direct order - dealerId should be their own ID
      if (dealerId && parseInt(dealerId) !== userId) {
        return res.status(403).json({ 
          error: 'Dealer can only create orders for themselves' 
        });
      }
      
      // Set dealerId to current user if not provided
      req.body.dealerId = userId;
      
      // Dealer cannot specify salesman for direct orders
      if (salesmanId) {
        return res.status(400).json({ 
          error: 'Dealer cannot specify salesman for direct orders' 
        });
      }
      
      // Dealer must specify warehouse
      if (!warehouseId) {
        return res.status(400).json({ 
          error: 'Warehouse must be specified' 
        });
      }
      targetWarehouseId = warehouseId;
      
    } else if (role === 'salesman') {
      // Salesman must specify dealer and warehouse
      if (!dealerId) {
        return res.status(400).json({ 
          error: 'Salesman must specify dealer when creating order' 
        });
      }
      if (!warehouseId) {
        return res.status(400).json({ 
          error: 'Warehouse must be specified' 
        });
      }
      
      if (salesmanId && parseInt(salesmanId) !== userId) {
        return res.status(403).json({ 
          error: 'Salesman can only create orders as themselves' 
        });
      }
      
      // Set salesmanId to current user if not provided
      req.body.salesmanId = userId;
      targetWarehouseId = warehouseId;
      
    } else if (role === 'owner') {
      // Owner needs warehouse and either dealer or salesman
      if (!warehouseId || (!dealerId && !salesmanId)) {
        return res.status(400).json({ 
          error: 'Owner must specify warehouse and either dealer or salesman' 
        });
      }
      targetWarehouseId = warehouseId;
    }

    // Final validation for warehouseId
    if (!targetWarehouseId) {
      return res.status(400).json({ 
        error: 'Warehouse ID is required' 
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

    const result = await OrderModel.createOrder({
      warehouseId: parseInt(targetWarehouseId),
      dealerId: req.body.dealerId ? parseInt(req.body.dealerId) : null,
      salesmanId: req.body.salesmanId ? parseInt(req.body.salesmanId) : null,
      items: items.map(item => ({
        item_id: parseInt(item.item_id),
        quantity: parseInt(item.quantity),
        price_per_item: parseFloat(item.price_per_item)
      }))
    }, role, userId);

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create order error:', error);
    if (error.message.includes('Insufficient inventory')) {
      res.status(400).json({ error: error.message });
    } else if (error.message.includes('Invalid order configuration')) {
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

    // Check if user can modify this order
    const { canModify, reason } = await OrderModel.canModifyOrder(id, role, userId);
    
    if (!canModify) {
      return res.status(403).json({ error: reason });
    }

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

    // Role-based restrictions for status updates
    if (role === 'dealer' || role === 'salesman') {
      // Dealers and salesmen can only update payment status, not transport status
      if (transportStatus) {
        return res.status(403).json({ 
          error: 'Only warehouse and owner can update transport status' 
        });
      }
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

    // Check if user can modify this order
    const { canModify, reason } = await OrderModel.canModifyOrder(id, role, userId);
    
    if (!canModify) {
      return res.status(403).json({ error: reason });
    }

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

    const stats = await OrderModel.getOrderStats(
      warehouseId ? parseInt(warehouseId) : null,
      role,
      userId
    );

    res.json({
      success: true,
      data: stats,
      meta: {
        userRole: role,
        scope: role === 'owner' ? 'all' : 'filtered'
      }
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

    const salesData = await OrderModel.getMonthlySales(
      warehouseId ? parseInt(warehouseId) : null,
      parseInt(year),
      role,
      userId
    );

    res.json({
      success: true,
      data: salesData,
      meta: {
        userRole: role,
        year: parseInt(year)
      }
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

    const orders = await OrderModel.getPendingOrders(
      warehouseId ? parseInt(warehouseId) : null,
      parseInt(limit),
      role,
      userId
    );

    res.json({
      success: true,
      data: orders,
      meta: {
        userRole: role,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get orders by type
const getOrdersByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { warehouseId } = req.query;
    const { role, id: userId } = req.user;

    if (!['direct_dealer', 'salesman_for_dealer', 'warehouse_for_dealer'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid order type. Must be direct_dealer, salesman_for_dealer, or warehouse_for_dealer' 
      });
    }

    // Role-based warehouse filtering
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const orders = await OrderModel.getOrdersByType(
      type, 
      targetWarehouseId ? parseInt(targetWarehouseId) : null
    );

    res.json({
      success: true,
      data: orders,
      meta: {
        orderType: type,
        userRole: role
      }
    });
  } catch (error) {
    console.error('Get orders by type error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's order summary
const getUserOrderSummary = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    if (!['warehouse', 'dealer', 'salesman'].includes(role)) {
      return res.status(403).json({ 
        error: 'Only warehouse, dealer, and salesman can access order summary' 
      });
    }

    const summary = await OrderModel.getOrdersSummaryByRole(role, userId);

    res.json({
      success: true,
      data: summary,
      meta: {
        userRole: role,
        userId
      }
    });
  } catch (error) {
    console.error('Get user order summary error:', error);
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

    // Role-based restrictions for status updates
    if ((role === 'dealer' || role === 'salesman') && transportStatus) {
      return res.status(403).json({ 
        error: 'Only warehouse and owner can update transport status' 
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
  getOrdersByType,
  getUserOrderSummary,
  bulkUpdateStatus,
  generateInvoice,
  exportOrders
};