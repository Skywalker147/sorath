const PaymentModel = require('../models/paymentModel');

// Get all payments
const getAllPayments = async (req, res) => {
  try {
    const { 
      warehouseId, 
      dealerId, 
      orderId, 
      paymentStatus, 
      paymentMethod, 
      search, 
      startDate, 
      endDate,
      overdue,
      page = 1, 
      limit = 50 
    } = req.query;
    
    const { role, id: userId } = req.user;

    const filters = {
      warehouseId: warehouseId ? parseInt(warehouseId) : null,
      dealerId: dealerId ? parseInt(dealerId) : null,
      orderId: orderId ? parseInt(orderId) : null,
      paymentStatus,
      paymentMethod,
      search: search?.trim(),
      startDate,
      endDate,
      overdue: overdue === 'true'
    };

    const payments = await PaymentModel.getAllPayments(filters, role, userId);

    res.json({
      success: true,
      data: payments,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: payments.length
      }
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const payment = await PaymentModel.getPaymentById(id, role, userId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create payment
const createPayment = async (req, res) => {
  try {
    const { 
      orderId, 
      amount, 
      paymentMethod, 
      transactionId, 
      paymentDate, 
      dueDate, 
      notes 
    } = req.body;
    const { role, id: userId } = req.user;

    // Validation
    if (!orderId || !amount || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Order ID, amount, and payment method are required' 
      });
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }

    const validMethods = ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        error: 'Invalid payment method' 
      });
    }

    // Verify user has access to the order
    if (role === 'warehouse') {
      const [orderCheck] = await db.execute(
        'SELECT id FROM orders WHERE id = ? AND warehouse_id = ?',
        [orderId, userId]
      );
      
      if (orderCheck.length === 0) {
        return res.status(403).json({ 
          error: 'Access denied to this order' 
        });
      }
    }

    const paymentId = await PaymentModel.createPayment({
      orderId: parseInt(orderId),
      amount: parseFloat(amount),
      paymentMethod,
      transactionId: transactionId?.trim() || null,
      paymentDate: paymentDate || new Date().toISOString().split('T')[0],
      dueDate: dueDate || null,
      notes: notes?.trim() || null
    });

    res.status(201).json({
      success: true,
      message: 'Payment recorded successfully',
      data: { id: paymentId }
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update payment
const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      amount, 
      paymentMethod, 
      transactionId, 
      paymentDate, 
      dueDate, 
      notes,
      paymentStatus
    } = req.body;
    const { role, id: userId } = req.user;

    // Validation
    if (!amount || !paymentMethod) {
      return res.status(400).json({ 
        error: 'Amount and payment method are required' 
      });
    }

    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ 
        error: 'Amount must be a positive number' 
      });
    }

    const validMethods = ['cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other'];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ 
        error: 'Invalid payment method' 
      });
    }

    const validStatuses = ['pending', 'paid', 'failed'];
    if (paymentStatus && !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({ 
        error: 'Invalid payment status' 
      });
    }

    await PaymentModel.updatePayment(id, {
      amount: parseFloat(amount),
      paymentMethod,
      transactionId: transactionId?.trim() || null,
      paymentDate,
      dueDate: dueDate || null,
      notes: notes?.trim() || null,
      paymentStatus: paymentStatus || 'pending'
    }, role, userId);

    res.json({
      success: true,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    console.error('Update payment error:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Delete payment
const deletePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    await PaymentModel.deletePayment(id, role, userId);

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Get payment statistics
const getPaymentStats = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their stats
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const stats = await PaymentModel.getPaymentStats(
      targetWarehouseId ? parseInt(targetWarehouseId) : null
    );

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get overdue payments
const getOverduePayments = async (req, res) => {
  try {
    const { warehouseId } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their overdue payments
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const overduePayments = await PaymentModel.getOverduePayments(
      targetWarehouseId ? parseInt(targetWarehouseId) : null
    );

    res.json({
      success: true,
      data: overduePayments
    });
  } catch (error) {
    console.error('Get overdue payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get monthly payment data
const getMonthlyPayments = async (req, res) => {
  try {
    const { warehouseId, year = new Date().getFullYear() } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their data
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const paymentData = await PaymentModel.getMonthlyPayments(
      targetWarehouseId ? parseInt(targetWarehouseId) : null,
      parseInt(year)
    );

    res.json({
      success: true,
      data: paymentData
    });
  } catch (error) {
    console.error('Get monthly payments error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get payments by order ID
const getPaymentsByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payments = await PaymentModel.getPaymentsByOrderId(orderId);

    res.json({
      success: true,
      data: payments
    });
  } catch (error) {
    console.error('Get payments by order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get top paying customers
const getTopPayingCustomers = async (req, res) => {
  try {
    const { warehouseId, limit = 10 } = req.query;
    const { role, id: userId } = req.user;
    
    // If user is warehouse, only show their customers
    let targetWarehouseId = warehouseId;
    if (role === 'warehouse') {
      targetWarehouseId = userId;
    }

    const customers = await PaymentModel.getTopPayingCustomers(
      targetWarehouseId ? parseInt(targetWarehouseId) : null,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: customers
    });
  } catch (error) {
    console.error('Get top paying customers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update payment status
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role, id: userId } = req.user;

    const validStatuses = ['pending', 'paid', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid payment status. Must be pending, paid, or failed' 
      });
    }

    await PaymentModel.updatePayment(id, {
      paymentStatus: status
    }, role, userId);

    res.json({
      success: true,
      message: 'Payment status updated successfully'
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    if (error.message.includes('not found') || error.message.includes('access denied')) {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

// Generate payment report (placeholder for future implementation)
const generatePaymentReport = async (req, res) => {
  try {
    const { startDate, endDate, format = 'pdf' } = req.query;
    
    // This would generate PDF/Excel report
    res.status(501).json({ 
      error: 'Payment report generation not yet implemented' 
    });
  } catch (error) {
    console.error('Generate payment report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllPayments,
  getPaymentById,
  createPayment,
  updatePayment,
  deletePayment,
  getPaymentStats,
  getOverduePayments,
  getMonthlyPayments,
  getPaymentsByOrderId,
  getTopPayingCustomers,
  updatePaymentStatus,
  generatePaymentReport
};