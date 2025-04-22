const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    description: String,
    options: [{
        name: String,
        choices: [String],
        required: Boolean
    }],
    category: {
        type: String,
        required: true
    },
    available: {
        type: Boolean,
        default: true
    }
});

module.exports = mongoose.model('MenuItem', menuItemSchema); 