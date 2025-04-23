const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a transporter using Gmail
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// Function to format the order items into a readable HTML table
function formatOrderItems(items) {
    return `
        <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
                <tr style="background-color: #1a237e;">
                    <th style="padding: 12px; text-align: left; border: 1px solid #dee2e6; color: white;">Item</th>
                    <th style="padding: 12px; text-align: center; border: 1px solid #dee2e6; color: white;">Quantity</th>
                    <th style="padding: 12px; text-align: right; border: 1px solid #dee2e6; color: white;">Unit Price</th>
                    <th style="padding: 12px; text-align: right; border: 1px solid #dee2e6; color: white;">Total</th>
                </tr>
            </thead>
            <tbody>
                ${items.map(item => {
                    const quantity = item.quantity || 1;
                    const price = item.price || 0;
                    const total = quantity * price;
                    return `
                        <tr>
                            <td style="padding: 12px; border: 1px solid #dee2e6;">
                                ${item.name}
                                ${Object.entries(item.options || {})
                                    .map(([key, value]) => `<br><small>${key}: ${value}</small>`)
                                    .join('')}
                            </td>
                            <td style="padding: 12px; text-align: center; border: 1px solid #dee2e6;">
                                ${quantity}
                            </td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">
                                ₦${price.toLocaleString()}
                            </td>
                            <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6;">
                                ₦${total.toLocaleString()}
                            </td>
                        </tr>
                    `;
                }).join('')}
            </tbody>
            <tfoot>
                <tr style="background-color: #f8f9fa;">
                    <td colspan="3" style="padding: 12px; border: 1px solid #dee2e6; font-weight: bold;">Total Amount</td>
                    <td style="padding: 12px; text-align: right; border: 1px solid #dee2e6; font-weight: bold;">
                        ₦${items.reduce((total, item) => total + ((item.quantity || 1) * (item.price || 0)), 0).toLocaleString()}
                    </td>
                </tr>
            </tfoot>
        </table>
    `;
}

async function sendOrderConfirmation(order) {
    const scheduledText = order.scheduledFor 
        ? `<p>Scheduled for: ${new Date(order.scheduledFor).toLocaleString()}</p>`
        : '';

    const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #1a237e; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Order Confirmation</h1>
            </div>
            
            <div style="padding: 20px;">
                <p>Dear ${order.customerName},</p>
                <p>Thank you for choosing Restaurant Bot!</p>
                <p>Your order has been confirmed and is being processed.</p>
                
                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Table Number:</strong> ${order.tableNumber}</p>
                    ${scheduledText}
                </div>

                <h3 style="color: #1a237e;">Order Items:</h3>
                ${formatOrderItems(order.items)}

                <p style="color: #666;">If you have any questions about your order, please contact us.</p>
                
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; text-align: center;">
                    <p><strong>Restaurant Bot Team</strong></p>
                    <p>Plot 31, Pipeline Road, ilorin</p>
                    <small>This is an automated email, please do not reply.</small>
                </div>
            </div>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"Restaurant Bot" <${process.env.GMAIL_USER}>`,
            to: order.email,
            subject: 'Order Confirmation - Restaurant Bot',
            html: emailContent
        });
        console.log('Order confirmation email sent successfully');
    } catch (error) {
        console.error('Error sending order confirmation email:', error);
        // Don't throw the error - we don't want to break the order process if email fails
    }
}

module.exports = {
    sendOrderConfirmation
}; 