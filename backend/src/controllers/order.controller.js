const orderModel = require('../models/order.model');
const itemModel = require('../models/item.model');

async function createOrder(req, res) {
  try {
    const { userId, items } = req.body;

    // Calculate total amount and validate items
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const dbItem = await itemModel.getItemById(item.itemId);
      if (!dbItem) {
        return res.status(400).json({ error: `Item with ID ${item.itemId} not found` });
      }

      const pricePerUnit = dbItem.price_per_gatha;
      const totalPrice = pricePerUnit * item.quantity;
      totalAmount += totalPrice;

      orderItems.push({
        itemId: item.itemId,
        quantity: item.quantity,
        pricePerUnit,
        totalPrice
      });
    }

    const orderId = await orderModel.createOrder({
      userId,
      totalAmount,
      items: orderItems
    });

    const order = await orderModel.getOrderById(orderId);
    return res.status(201).json(order);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function getOrder(req, res) {
  try {
    const { orderId } = req.params;
    const order = await orderModel.getOrderById(orderId);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    return res.json(order);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function getAllOrders(req, res) {
  try {
    const orders = await orderModel.getAllOrders();
    return res.json(orders);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    if (!['pending', 'confirmed', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const success = await orderModel.updateOrderStatus(orderId, status);
    if (!success) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = await orderModel.getOrderById(orderId);
    return res.json(order);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
}

module.exports = {
  createOrder,
  getOrder,
  getAllOrders,
  updateOrderStatus
}; 