const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: function() {
            return this.status === 'paid';
        }
    },
    email: {
        type: String,
        required: function() {
            return this.status === 'paid';
        }
    },
    tableNumber: {
        type: Number,
        required: function() {
            return this.status === 'paid';
        }
    },
    items: [{
        itemId: String,
        name: String,
        quantity: Number,
        price: Number,
        options: Object
    }],
    status: {
        type: String,
        enum: ['pending', 'paid', 'cancelled'],
        default: 'pending'
    },
    totalAmount: {
        type: Number,
        required: true
    },
    scheduledFor: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Order', orderSchema); 