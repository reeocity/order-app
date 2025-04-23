const express = require('express');
const cors = require('cors');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/database');
const MongoStore = require('connect-mongo');
require('dotenv').config();

// Import routes
const menuRoutes = require('./routes/menuRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://order-app-ashy-delta.vercel.app', 'https://restaurant-bot-ibrahimola.vercel.app']
        : 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(bodyParser.json());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for Vercel
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        httpOnly: true
    },
    store: process.env.MONGODB_URI ? new MongoStore({
        mongoUrl: process.env.MONGODB_URI,
        collection: 'sessions',
        autoRemove: 'interval',
        autoRemoveInterval: 10, // In minutes
        touchAfter: 24 * 3600 // Only update session once per 24 hours unless data changes
    }) : null
}));

// Add session debugging middleware
app.use((req, res, next) => {
    console.log('Session ID:', req.session.id);
    console.log('Session Data:', req.session);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin routes
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

app.get('/admin/menu.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'menu.html'));
});

app.get('/admin/orders.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin', 'orders.html'));
});

// Chat bot initial options
app.get('/api/chat/options', (req, res) => {
    const options = [
        { key: '1', text: 'Place an order' },
        { key: '99', text: 'Checkout order' },
        { key: '98', text: 'See order history' },
        { key: '97', text: 'See current order' },
        { key: '0', text: 'Cancel order' }
    ];
    res.json(options);
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;

// Initialize menu items
async function initializeMenu() {
    try {
        const MenuItem = require('./models/MenuItem');
        
        // Check if there are any existing items
        const existingItems = await MenuItem.countDocuments();
        
        // Only create default items if the database is empty
        if (existingItems === 0) {
            const defaultItems = [
                {
                    name: 'Jollof Rice with Chicken',
                    price: 3500,
                    description: 'Spicy Nigerian jollof rice served with grilled chicken and plantains',
                    category: 'Main Course',
                    options: [
                        {
                            name: 'Portion',
                            choices: ['Regular', 'Large'],
                            required: true
                        },
                        {
                            name: 'Extras',
                            choices: ['Extra Chicken', 'Plantain', 'Coleslaw'],
                            required: false
                        }
                    ]
                },
                {
                    name: 'Egusi Soup with Pounded Yam',
                    price: 4000,
                    description: 'Traditional Nigerian soup made with ground melon seeds, served with pounded yam',
                    category: 'Main Course',
                    options: [
                        {
                            name: 'Meat Choice',
                            choices: ['Goat', 'Beef', 'Fish', 'Chicken'],
                            required: true
                        },
                        {
                            name: 'Swallow Type',
                            choices: ['Pounded Yam', 'Eba', 'Amala'],
                            required: true
                        }
                    ]
                },
                {
                    name: 'Suya',
                    price: 2500,
                    description: 'Spicy grilled meat skewers with yaji spice',
                    category: 'Starters',
                    options: [
                        {
                            name: 'Meat Type',
                            choices: ['Beef', 'Chicken', 'Ram'],
                            required: true
                        },
                        {
                            name: 'Spice Level',
                            choices: ['Mild', 'Medium', 'Hot'],
                            required: true
                        }
                    ]
                },
                {
                    name: 'Pepper Soup',
                    price: 3000,
                    description: 'Spicy Nigerian soup with aromatic spices',
                    category: 'Starters',
                    options: [
                        {
                            name: 'Type',
                            choices: ['Goat', 'Catfish', 'Chicken'],
                            required: true
                        }
                    ]
                },
                {
                    name: 'Moi Moi',
                    price: 1500,
                    description: 'Steamed bean pudding with eggs and fish',
                    category: 'Sides',
                    options: [
                        {
                            name: 'Extras',
                            choices: ['Boiled Egg', 'Fish', 'Both'],
                            required: false
                        }
                    ]
                },
                {
                    name: 'Chapman',
                    price: 1200,
                    description: 'Nigerian special cocktail drink',
                    category: 'Beverages',
                    options: [
                        {
                            name: 'Size',
                            choices: ['Regular', 'Large'],
                            required: true
                        },
                        {
                            name: 'Ice',
                            choices: ['No Ice', 'Regular Ice', 'Extra Ice'],
                            required: true
                        }
                    ]
                },
                {
                    name: 'Puff Puff',
                    price: 1000,
                    description: 'Sweet Nigerian doughnuts',
                    category: 'Desserts',
                    options: [
                        {
                            name: 'Quantity',
                            choices: ['5 pieces', '10 pieces', '15 pieces'],
                            required: true
                        },
                        {
                            name: 'Topping',
                            choices: ['Sugar', 'Powdered Sugar', 'None'],
                            required: false
                        }
                    ]
                },
                {
                    name: 'Chicken Shawarma',
                    price: 2500,
                    description: 'Grilled chicken wrap with veggies and special sauce',
                    category: 'Fast Food',
                    options: [
                        {
                            name: 'Size',
                            choices: ['Regular', 'Large'],
                            required: true
                        },
                        {
                            name: 'Extras',
                            choices: ['Extra Chicken', 'Extra Cheese', 'Extra Sauce'],
                            required: false
                        }
                    ]
                }
            ];

            await MenuItem.insertMany(defaultItems);
            console.log('Default menu items created');
        } else {
            console.log('Menu items already exist, skipping initialization');
        }
    } catch (error) {
        console.error('Error initializing menu:', error);
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`Server running on http://localhost:${PORT}`);
    await initializeMenu();
}); 