// backend/routes/products.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Product = require('../models/product');

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

router.use(express.json());
router.use(express.urlencoded({ extended: true }));

router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    console.log('Query received:', req.query);
    let query = {};

    if (search) {
      query.name = { $regex: search, $options: 'i' }; // Tìm kiếm không phân biệt hoa thường
    }

    if (category) {
      if (!mongoose.Types.ObjectId.isValid(category)) {
        console.log('Invalid category ID:', category);
        return res.status(400).json({ message: 'Category ID không hợp lệ' });
      }
      query.category = category; // Không cần ép kiểu ObjectId nữa vì đã kiểm tra
    }

    console.log('MongoDB Query:', query);
    const products = await Product.find(query).populate('category', 'name');
    console.log('Products found:', products);
    res.json(products);
  } catch (err) {
    console.error('Lỗi server khi tải danh sách sản phẩm:', err);
    res.status(500).json({ message: 'Lỗi server khi tải danh sách sản phẩm', error: err.message });
  }
});

// Các route khác giữ nguyên
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name');
    if (!product) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(product);
  } catch (err) {
    console.error('Lỗi khi lấy sản phẩm:', err);
    res.status(500).json({ message: 'Lỗi khi lấy sản phẩm' });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    console.log('Dữ liệu nhận được:', req.body);
    const { name, price, category, description } = req.body;
    if (!name || !price || !category || !description) {
      return res.status(400).json({ message: 'Thiếu thông tin sản phẩm' });
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';
    const newProduct = new Product({ name, price, category, description, image: imageUrl });
    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    console.error('Lỗi khi tạo sản phẩm:', err);
    res.status(400).json({ message: 'Lỗi khi tạo sản phẩm', error: err.message });
  }
});

router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    console.log('Dữ liệu cập nhật:', req.body);
    const { name, price, category, description } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    const updateData = { name, price, category, description };
    if (imageUrl) updateData.image = imageUrl;

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json(updatedProduct);
  } catch (err) {
    console.error('Lỗi khi cập nhật sản phẩm:', err);
    res.status(400).json({ message: 'Lỗi khi cập nhật sản phẩm' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    res.json({ message: 'Xóa thành công' });
  } catch (err) {
    console.error('Lỗi khi xóa sản phẩm:', err);
    res.status(500).json({ message: 'Lỗi khi xóa sản phẩm' });
  }
});

module.exports = router;