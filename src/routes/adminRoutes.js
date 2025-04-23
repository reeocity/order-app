const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');

// Get all menu items (including unavailable ones)
router.get('/menu', async (req, res) => {
    try {
        const menuItems = await MenuItem.find({});
        res.json(menuItems);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu items' });
    }
});

// Get single menu item by ID
router.get('/menu/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching menu item' });
    }
});

// Add new menu item
router.post('/menu', async (req, res) => {
    try {
        const {
            name,
            price,
            description,
            category,
            options
        } = req.body;

        // Validate required fields
        if (!name || !price || !category) {
            return res.status(400).json({ message: 'Name, price, and category are required' });
        }

        const menuItem = new MenuItem({
            name,
            price,
            description,
            category,
            options,
            available: true
        });

        await menuItem.save();
        res.status(201).json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Error creating menu item' });
    }
});

// Update menu item
router.put('/menu/:id', async (req, res) => {
    try {
        const {
            name,
            price,
            description,
            category,
            options,
            available
        } = req.body;

        const menuItem = await MenuItem.findByIdAndUpdate(
            req.params.id,
            {
                name,
                price,
                description,
                category,
                options,
                available
            },
            { new: true }
        );

        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Error updating menu item' });
    }
});

// Delete menu item
router.delete('/menu/:id', async (req, res) => {
    try {
        const menuItem = await MenuItem.findByIdAndDelete(req.params.id);
        
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        res.json({ message: 'Menu item deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting menu item' });
    }
});

// Toggle menu item availability
router.patch('/menu/:id/toggle-availability', async (req, res) => {
    try {
        const menuItem = await MenuItem.findById(req.params.id);
        
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }

        menuItem.available = !menuItem.available;
        await menuItem.save();

        res.json(menuItem);
    } catch (error) {
        res.status(500).json({ message: 'Error toggling menu item availability' });
    }
});

module.exports = router; 