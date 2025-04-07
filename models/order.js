// backend/models/order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Thêm trường userId
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    orderDate: { type: Date, default: Date.now },
    totalAmount: { type: Number, required: true },
    products: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
        },
    ],
});

module.exports = mongoose.model("Order", orderSchema);