const order = await Order.create({
    customerName: req.body.customerName,
    email: req.body.email,
    phone: req.body.phone,
    items: req.body.items,
    totalAmount: req.body.totalAmount,
    status: 'pending',
    restaurant: 'Restaurant Bot'
}); 