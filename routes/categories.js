// backend/routes/categories.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Category = require('../models/category');
const User = require('../models/User');

async function checkAdminManual(username) {
  if (!username) return { isAdmin: false, error: 'Thiếu username', status: 400 };

  try {
    const user = await User.findOne({ username });
    if (!user) return { isAdmin: false, error: 'Người dùng không tồn tại', status: 404 };
    if (user.role !== 'admin') return { isAdmin: false, error: 'Không có quyền admin', status: 403 };
    return { isAdmin: true, user };
  } catch (error) {
    console.error('Lỗi kiểm tra admin:', error);
    return { isAdmin: false, error: 'Lỗi server khi kiểm tra quyền', status: 500 };
  }
}

router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    console.log('Categories sent:', categories);
    res.json(categories);
  } catch (error) {
    console.error('Lỗi lấy danh sách categories:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID danh mục không hợp lệ' });
  }

  try {
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }
    res.json(category);
  } catch (error) {
    console.error('Lỗi lấy category:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.post('/', async (req, res) => {
  const { username } = req.query;
  const check = await checkAdminManual(username);
  if (!check.isAdmin) {
    return res.status(check.status).json({ message: check.error });
  }

  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
  }

  try {
    const existing = await Category.findOne({ name: { $regex: `^${name}$`, $options: 'i' } });
    if (existing) {
      return res.status(409).json({ message: 'Tên danh mục đã tồn tại' });
    }

    const category = new Category({
      name: name.trim(),
      description: description?.trim() || '',
    });

    const saved = await category.save();
    res.status(201).json(saved);
  } catch (error) {
    console.error('Lỗi thêm category:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.put('/:id', async (req, res) => {
  const { username } = req.query;
  const check = await checkAdminManual(username);
  if (!check.isAdmin) {
    return res.status(check.status).json({ message: check.error });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID danh mục không hợp lệ' });
  }

  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Tên danh mục là bắt buộc' });
  }

  try {
    const exists = await Category.findOne({
      name: { $regex: `^${name}$`, $options: 'i' },
      _id: { $ne: id },
    });
    if (exists) {
      return res.status(409).json({ message: 'Tên danh mục đã được dùng' });
    }

    const updated = await Category.findByIdAndUpdate(
      id,
      { name: name.trim(), description: description?.trim() || '' },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục' });
    }

    res.json(updated);
  } catch (error) {
    console.error('Lỗi cập nhật category:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { username } = req.query;
  const check = await checkAdminManual(username);
  if (!check.isAdmin) {
    return res.status(check.status).json({ message: check.error });
  }

  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID danh mục không hợp lệ' });
  }

  try {
    const deleted = await Category.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Không tìm thấy danh mục để xóa' });
    }

    res.json({ message: 'Đã xóa danh mục thành công', id });
  } catch (error) {
    console.error('Lỗi xóa category:', error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
});

module.exports = router;