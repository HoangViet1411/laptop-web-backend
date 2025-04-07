// backend/app.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const categoriesRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const cartRoutes = require('./routes/carts');

const app = express();

// Cho phép CORS từ frontend Vercel
app.use(cors({
  origin: ['http://localhost:3000', 'https://laptop-web-frontend.vercel.app'], // Thay bằng domain frontend sau khi deploy
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/carts', cartRoutes);

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:123@cluster0.xo2tj.mongodb.net/laptop_web';
mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB đã kết nối thành công.'))
  .catch(err => console.error('Lỗi kết nối MongoDB:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});