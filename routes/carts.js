// backend/routes/carts.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Cart = require('../models/cart');

router.use(express.json());

// Lấy giỏ hàng của người dùng
router.get('/:userId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) return res.json({ products: [] }); // Trả về giỏ hàng rỗng nếu không tồn tại
    res.json(cart);
  } catch (err) {
    console.error('Lỗi khi lấy giỏ hàng:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Thêm sản phẩm vào giỏ hàng
router.post('/:userId', async (req, res) => {
  const { productId, name, price, quantity, image } = req.body;

  if (!productId || !name || !price || !quantity) {
    return res.status(400).json({ message: 'Thiếu thông tin sản phẩm' });
  }

  try {
    let cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) {
      cart = new Cart({
        userId: req.params.userId,
        products: [{ productId, name, price, quantity, image }],
      });
    } else {
      const existingProduct = cart.products.find((p) => p.productId.toString() === productId);
      if (existingProduct) {
        existingProduct.quantity += quantity;
      } else {
        cart.products.push({ productId, name, price, quantity, image });
      }
    }
    cart.updatedAt = Date.now();
    const savedCart = await cart.save();
    res.status(201).json(savedCart);
  } catch (err) {
    console.error('Lỗi khi thêm vào giỏ hàng:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Cập nhật số lượng sản phẩm trong giỏ hàng
router.put('/:userId', async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({ message: 'Thiếu thông tin cập nhật' });
  }

  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });

    const product = cart.products.find((p) => p.productId.toString() === productId);
    if (!product) return res.status(404).json({ message: 'Sản phẩm không có trong giỏ hàng' });

    product.quantity = quantity;
    cart.updatedAt = Date.now();
    const updatedCart = await cart.save();
    res.json(updatedCart);
  } catch (err) {
    console.error('Lỗi khi cập nhật giỏ hàng:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa sản phẩm khỏi giỏ hàng
router.delete('/:userId/:productId', async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.params.userId });
    if (!cart) return res.status(404).json({ message: 'Giỏ hàng không tồn tại' });

    cart.products = cart.products.filter((p) => p.productId.toString() !== req.params.productId);
    cart.updatedAt = Date.now();
    const updatedCart = await cart.save();
    res.json({ message: 'Đã xóa sản phẩm khỏi giỏ hàng', cart: updatedCart });
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm khỏi giỏ hàng:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

// Xóa toàn bộ giỏ hàng (khi thanh toán xong)
router.delete('/:userId', async (req, res) => {
  try {
    await Cart.deleteOne({ userId: req.params.userId });
    res.json({ message: 'Đã xóa toàn bộ giỏ hàng' });
  } catch (err) {
    console.error('Lỗi khi xóa giỏ hàng:', err);
    res.status(500).json({ message: 'Lỗi server' });
  }
});

module.exports = router;