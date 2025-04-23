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
        console.log('[GET /current] Session ID:', req.session.id);
        console.log('[GET /current] Session:', req.session);

        const order = await Order.findOne({
            sessionId: req.session.id,
            status: 'pending'
        });

        console.log('[GET /current] Found order:', order);
        
        if (!order) {
            console.log('[GET /current] No pending order found for session');
            return res.json({ items: [], total: 0 });
        }

        res.json(order);
    } catch (error) {
        console.error('[GET /current] Error:', error);
        res.status(500).json({ message: 'Error fetching current order' });
    }
});

// Create new order
router.post('/', async (req, res) => {
    try {
        console.log('[POST /] Creating new order');
        console.log('[POST /] Session ID:', req.session.id);
        console.log('[POST /] Request body:', req.body);

        // Check for existing pending order
        let order = await Order.findOne({
            sessionId: req.session.id,
            status: 'pending'
        });

        console.log('[POST /] Existing order:', order);

        if (order) {
            // Update existing order
            console.log('[POST /] Updating existing order');
            order.items = req.body.items;
            order.totalAmount = req.body.totalAmount;
            if (req.body.scheduledFor) {
                order.scheduledFor = new Date(req.body.scheduledFor);
            }
            await order.save();
            console.log('[POST /] Updated order:', order);
        } else {
            // Create new order
            console.log('[POST /] Creating new order with session ID:', req.session.id);
            order = new Order({
                sessionId: req.session.id,
                items: req.body.items,
                totalAmount: req.body.totalAmount,
                scheduledFor: req.body.scheduledFor ? new Date(req.body.scheduledFor) : null,
                customerName: 'Pending',
                email: 'pending@example.com',
                tableNumber: 0
            });
            await order.save();
            console.log('[POST /] Created new order:', order);
        }

        // Double check the order was saved
        const savedOrder = await Order.findById(order._id);
        console.log('[POST /] Verified saved order:', savedOrder);

        res.json(order);
    } catch (error) {
        console.error('[POST /] Error creating order:', error);
        res.status(400).json({ message: 'Error creating order', error: error.message });
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
        console.log('Checkout request body:', req.body);
        const { name, email, tableNumber, items, totalAmount } = req.body;

        if (!items || !items.length || !totalAmount) {
            return res.status(400).json({ message: 'Invalid order data' });
        }

        // Create a new order or find existing one
        let order = await Order.findOne({
            sessionId: req.session.id,
            status: 'pending'
        });

        if (!order) {
            // Create new order with provided data
            order = new Order({
                sessionId: req.session.id,
                customerName: name,
                email: email,
                tableNumber: tableNumber,
                items: items,
                totalAmount: totalAmount,
                status: 'pending'
            });
        } else {
            // Update existing order
            order.customerName = name;
            order.email = email;
            order.tableNumber = tableNumber;
            order.items = items;
            order.totalAmount = totalAmount;
        }

        await order.save();
        console.log('Order saved:', order);

        // Initialize Paystack transaction
        const paymentData = {
            amount: Math.round(totalAmount * 100), // Convert to kobo
            email: email,
            reference: `ORDER_${order._id}_${Date.now()}`,
            callback_url: `${process.env.BASE_URL || 'http://localhost:3000'}/api/orders/verify-payment?orderId=${order._id}`,
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

        console.log('Initializing payment with data:', paymentData);
        const payment = await Paystack.transaction.initialize(paymentData);
        console.log('Payment initialized:', payment);

        res.json({
            authorization_url: payment.data.authorization_url,
            reference: payment.data.reference,
            orderId: order._id
        });
    } catch (error) {
        console.error('Error in checkout:', error);
        res.status(500).json({ 
            message: 'Error initializing payment. Please try again.',
            error: error.message 
        });
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