const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Middleware kiểm tra quyền admin
const isAdmin = async (req, res, next) => {
    const { username } = req.query; // Lấy username từ query (có thể thay bằng token trong tương lai)
    try {
        const user = await User.findOne({ username });
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admin only.' });
        }
        next();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Đăng ký user thường
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });
        await user.save();
        res.status(201).json({ message: 'User registered successfully', username: user.username });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Đăng nhập
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        res.json({ username: user.username, role: user.role });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Kiểm tra quyền admin
router.get('/check-admin', async (req, res) => {
    const { username } = req.query;
    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ isAdmin: user.role === 'admin' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Thêm admin
router.post('/register-admin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role: 'admin' });
        await user.save();
        res.status(201).json({ message: 'Admin registered successfully', username: user.username });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Lấy danh sách users (chỉ admin)
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password'); // Không trả về password
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error });
    }
});

// Thêm user mới (chỉ admin)
router.post('/users', isAdmin, async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword, role });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: 'Error adding user', error });
    }
});

// Xóa user (chỉ admin)
router.delete('/users/:id', isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error });
    }
});

// Chỉnh sửa user (chỉ admin)
router.put('/users/:id', isAdmin, async (req, res) => {
    const { username, password, role } = req.body;
    try {
        const updateData = {};
        if (username) updateData.username = username;
        if (password) updateData.password = await bcrypt.hash(password, 10);
        if (role) updateData.role = role;

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No data provided to update' });
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User updated successfully', user });
    } catch (error) {
        console.log('Error in PUT /users/:id:', error);
        res.status(400).json({ error: error.message });
    }
});

module.exports = router;