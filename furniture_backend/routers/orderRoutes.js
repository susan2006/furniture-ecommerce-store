const express = require('express');
const router = express.Router();
const Order = require('../models/order');
const Cart = require('../models/cart');
const requireAuth = require('../middleware/auth');

router.use(requireAuth);

// POST /api/orders - create an order from the current cart
router.post('/', async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.userId }).populate('items.product');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const items = cart.items.map(item => ({
      product: item.product._id,
      quantity: item.quantity,
      priceAtPurchase: item.product.price,
    }));

    const totalAmount = items.reduce((sum, item) => sum + item.priceAtPurchase * item.quantity, 0);

    const order = await Order.create({ user: req.userId, items, totalAmount });

    // clear the cart after order is placed
    cart.items = [];
    await cart.save();

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/orders - get logged-in user's order history
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({ user: req.userId }).populate('items.product').sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;