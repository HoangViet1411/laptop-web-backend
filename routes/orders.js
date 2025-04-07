// backend/routes/orders.js
const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/order');

const router = express.Router();

// Lấy tất cả đơn hàng (dành cho admin)
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ orderDate: -1 });
    res.json(orders);
  } catch (err) {
    console.error('Lỗi khi lấy danh sách đơn hàng:', err);
    res.status(500).json({ message: 'Không thể lấy danh sách đơn hàng!' });
  }
});

// Lấy đơn hàng theo userId (dành cho khách hàng)
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ orderDate: -1 });
    if (!orders || orders.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đơn hàng nào cho userId này!' });
    }
    res.json(orders);
  } catch (err) {
    console.error('Lỗi khi lấy đơn hàng theo userId:', err);
    res.status(500).json({ message: 'Không thể lấy danh sách đơn hàng!' });
  }
});

// Tạo đơn hàng
router.post('/', async (req, res) => {
  const { userId, customerName, phone, address, paymentMethod, products, totalAmount } = req.body;

  console.log('Dữ liệu nhận được từ frontend:', req.body);

  if (!userId || !customerName || !phone || !address || !paymentMethod || !Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin!' });
  }

  if (!products.every((p) => p.name && p.price && p.quantity)) {
    return res.status(400).json({ message: 'Mỗi sản phẩm phải có name, price, quantity!' });
  }

  const calculatedTotal = products.reduce((total, product) => total + product.price * product.quantity, 0);
  if (calculatedTotal !== totalAmount) {
    return res.status(400).json({ message: 'Tổng tiền không khớp!' });
  }

  try {
    const newOrder = new Order({
      userId,
      customerName,
      phone,
      address,
      paymentMethod,
      totalAmount,
      products,
    });
    const savedOrder = await newOrder.save();
    res.status(201).json(savedOrder);
  } catch (err) {
    console.error('Lỗi khi tạo đơn hàng:', err);
    res.status(500).json({ message: 'Không thể tạo đơn hàng!' });
  }
});

// Xóa đơn hàng
router.delete('/:id', async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ message: 'ID không hợp lệ!' });
  }

  try {
    const deletedOrder = await Order.findByIdAndDelete(req.params.id);
    if (!deletedOrder) return res.status(404).json({ message: 'Không tìm thấy đơn hàng!' });
    res.json({ message: 'Đã xóa đơn hàng thành công!' });
  } catch (err) {
    console.error('Lỗi khi xóa đơn hàng:', err);
    res.status(500).json({ message: 'Không thể xóa đơn hàng!' });
  }
});

module.exports = router;