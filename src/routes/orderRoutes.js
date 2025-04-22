const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Paystack = require('paystack')(process.env.PAYSTACK_SECRET_KEY);
const { sendOrderConfirmation } = require('../services/emailService');
const { generateReceipt } = require('../services/pdfService');

// Get order history for current session
router.get('/history', async (req, res) => {
    try {
        const orders = await Order.find({ sessionId: req.session.id })
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching order history' });
    }
});

// Get current active order
router.get('/current', async (req, res) => {
    try {
        const order = await Order.findOne({
            sessionId: req.session.id,
            status: 'pending'
        });
        res.json(order || { items: [], total: 0 });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching current order' });
    }
});

// Create new order
router.post('/', async (req, res) => {
    try {
        // Check for existing pending order
        let order = await Order.findOne({
            sessionId: req.session.id,
            status: 'pending'
        });

        if (order) {
            // Update existing order
            order.items = req.body.items;
            order.totalAmount = req.body.totalAmount;
            if (req.body.scheduledFor) {
                order.scheduledFor = new Date(req.body.scheduledFor);
            }
            await order.save();
        } else {
            // Create new order with temporary values for required fields
            order = new Order({
                sessionId: req.session.id,
                items: req.body.items,
                totalAmount: req.body.totalAmount,
                scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : null,
                // Add temporary values that will be updated during checkout
                customerName: 'Pending',
                email: 'pending@example.com',
                tableNumber: 0
            });
            await order.save();
        }
        res.json(order);
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(400).json({ message: 'Error creating order' });
    }
});

// Cancel order
router.post('/cancel', async (req, res) => {
    try {
        const order = await Order.findOneAndUpdate(
            {
                sessionId: req.session.id,
                status: 'pending'
            },
            { status: 'cancelled' },
            { new: true }
        );
        
        if (!order) {
            return res.status(404).json({ message: 'No active order found' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: 'Error cancelling order' });
    }
});

// Initialize payment
router.post('/checkout', async (req, res) => {
    try {
        const { name, email, tableNumber, scheduledFor } = req.body;

        const order = await Order.findOne({
            sessionId: req.session.id,
            status: 'pending'
        });

        if (!order) {
            return res.status(404).json({ message: 'No active order found' });
        }

        // Update order with customer details
        order.customerName = name;
        order.email = email;
        order.tableNumber = tableNumber;
        if (scheduledFor) {
            order.scheduledFor = new Date(scheduledFor);
        }
        await order.save();

        // Initialize Paystack transaction
        const paymentData = {
            amount: Math.round(order.totalAmount * 100), // Convert to kobo
            email: email,
            reference: `ORDER_${order._id}_${Date.now()}`,
            callback_url: `${process.env.BASE_URL}/api/orders/verify-payment?orderId=${order._id}`,
            metadata: {
                order_id: order._id,
                custom_fields: [
                    {
                        display_name: "Order ID",
                        variable_name: "order_id",
                        value: order._id
                    },
                    {
                        display_name: "Customer Name",
                        variable_name: "customer_name",
                        value: name
                    },
                    {
                        display_name: "Table Number",
                        variable_name: "table_number",
                        value: tableNumber
                    }
                ]
            }
        };

        const payment = await Paystack.transaction.initialize(paymentData);
        res.json({
            authorization_url: payment.data.authorization_url,
            reference: payment.data.reference,
            orderId: order._id
        });
    } catch (error) {
        console.error('Error initializing payment:', error);
        res.status(500).json({ message: 'Error initializing payment' });
    }
});

// Verify payment
router.get('/verify-payment', async (req, res) => {
    try {
        const reference = req.query.reference;
        console.log('Payment verification started for reference:', reference);
        
        const payment = await Paystack.transaction.verify(reference);
        console.log('Payment status:', payment.data.status);

        if (payment.data.status === 'success') {
            // Extract order ID from reference
            const orderId = reference.split('_')[1];
            console.log('Order ID extracted:', orderId);
            
            // Update order status
            const order = await Order.findByIdAndUpdate(
                orderId,
                { status: 'paid' },
                { new: true }
            );

            if (!order) {
                console.error('Order not found:', orderId);
                return res.status(404).send('Order not found');
            }

            console.log('Order found and updated:', order._id);

            // Send order confirmation email
            try {
                await sendOrderConfirmation(order);
                console.log('Order confirmation email sent');
            } catch (emailError) {
                console.error('Error sending confirmation email:', emailError);
                // Continue even if email fails
            }

            // Redirect to success page with order ID
            return res.redirect(`/payment-success.html?orderId=${order._id}`);
        } else {
            console.log('Payment failed or invalid');
            res.redirect('/payment-failed.html');
        }
    } catch (error) {
        console.error('Error in verify-payment:', error);
        res.status(500).json({ 
            message: 'Error verifying payment',
            error: error.message 
        });
    }
});

// Add a new route to manually download receipt
router.get('/download-receipt/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        
        if (!order) {
            return res.status(404).send('Order not found');
        }

        const pdfBuffer = await generateReceipt(order);
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=order-${order._id}.pdf`);
        res.send(pdfBuffer);
    } catch (error) {
        console.error('Error downloading receipt:', error);
        res.status(500).send('Error generating receipt');
    }
});

module.exports = router; 