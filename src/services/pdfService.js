const PDFDocument = require('pdfkit');

function formatNairaAmount(amount) {
    return `₦${amount.toLocaleString('en-NG')}`;
}

function generateReceipt(order) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 50
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            // Modern color scheme
            const colors = {
                primary: '#1a237e',      // Deep blue
                secondary: '#311b92',    // Deep purple
                accent: '#00796b',       // Teal
                text: '#263238',         // Dark blue-grey
                lightGray: '#f5f5f5',
                borderColor: '#e0e0e0'
            };

            // Header with gradient-like effect
            doc.rect(0, 0, 612, 120)
               .fill(colors.primary);
            doc.rect(0, 100, 612, 20)
               .fill(colors.secondary);

            // Company information
            doc.font('Helvetica-Bold')
               .fontSize(32)
               .fillColor('#FFFFFF')
               .text('PRINCESS LUXURY HOTELS', 50, 40)
               .fontSize(12)
               .font('Helvetica')
               .text('Plot 31, Pipeline Road, ilorin', 50, 80);

            // Receipt title with modern styling
            doc.rect(50, 150, 512, 40)
               .lineWidth(1)
               .stroke(colors.borderColor);
            
            doc.font('Helvetica-Bold')
               .fontSize(20)
               .fillColor(colors.text)
               .text('ORDER RECEIPT', 230, 162);

            // Order information boxes with better spacing
            const infoBoxY = 220;
            const boxPadding = 15;

            // Order details box
            doc.rect(50, infoBoxY, 240, 120)
               .lineWidth(1)
               .stroke(colors.borderColor);
            
            doc.font('Helvetica-Bold')
               .fontSize(14)
               .fillColor(colors.accent)
               .text('ORDER DETAILS', 50 + boxPadding, infoBoxY + boxPadding);
            
            doc.font('Helvetica')
               .fontSize(11)
               .fillColor(colors.text)
               .text(`Order ID: ${order._id}`, 50 + boxPadding, infoBoxY + boxPadding + 25)
               .text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 50 + boxPadding, infoBoxY + boxPadding + 45)
               .text(`Table Number: ${order.tableNumber}`, 50 + boxPadding, infoBoxY + boxPadding + 65);

            // Customer details box
            doc.rect(322, infoBoxY, 240, 120)
               .lineWidth(1)
               .stroke(colors.borderColor);
            
            doc.font('Helvetica-Bold')
               .fontSize(14)
               .fillColor(colors.accent)
               .text('CUSTOMER DETAILS', 322 + boxPadding, infoBoxY + boxPadding);
            
            doc.font('Helvetica')
               .fontSize(11)
               .fillColor(colors.text)
               .text(`Name: ${order.customerName || 'N/A'}`, 322 + boxPadding, infoBoxY + boxPadding + 25)
               .text(`Email: ${order.email || 'N/A'}`, 322 + boxPadding, infoBoxY + boxPadding + 45);

            // Items table header with modern styling
            const tableY = infoBoxY + 150;
            doc.rect(50, tableY, 512, 30)
               .fill(colors.secondary);

            doc.font('Helvetica-Bold')
               .fontSize(12)
               .fillColor('#FFFFFF')
               .text('Item', 65, tableY + 8)
               .text('Quantity', 300, tableY + 8)
               .text('Unit Price', 380, tableY + 8)
               .text('Total', 480, tableY + 8);

            // Items table with alternating row colors
            let currentY = tableY + 40;
            doc.font('Helvetica')
               .fontSize(11);

            if (!order.items || order.items.length === 0) {
                doc.fillColor(colors.text)
                   .text('No items in order', 65, currentY);
            } else {
                order.items.forEach((item, index) => {
                    // Alternate row background
                    if (index % 2 === 0) {
                        doc.rect(50, currentY - 5, 512, 25)
                           .fill(colors.lightGray);
                    }

                    const itemName = item.name || 'Unnamed Item';
                    const quantity = item.quantity || 1;
                    const price = item.price || 0;
                    const total = quantity * price;

                    doc.fillColor(colors.text)
                       .text(itemName, 65, currentY)
                       .text(quantity.toString(), 300, currentY)
                       .text(formatNairaAmount(price), 380, currentY)
                       .text(formatNairaAmount(total), 480, currentY);

                    currentY += 30;
                });
            }

            // Total amount with modern styling
            const totalY = currentY + 20;
            doc.rect(50, totalY, 512, 40)
               .fill(colors.primary);

            doc.font('Helvetica-Bold')
               .fontSize(16)
               .fillColor('#FFFFFF')
               .text('Total Amount:', 65, totalY + 10)
               .text(formatNairaAmount(order.totalAmount || 0), 480, totalY + 10);

            // Footer with proper spacing and alignment
            const footerY = totalY + 80;
            doc.rect(50, footerY, 512, 80)
               .lineWidth(1)
               .stroke(colors.borderColor);

            doc.font('Helvetica')
               .fontSize(11)
               .fillColor(colors.text)
               .text('Thank you for choosing Princess Luxury Hotels!', 50, footerY + 15, { align: 'center' })
               .text('Please keep this receipt for your records.', 50, footerY + 35, { align: 'center' })
               .text(`Generated on: ${new Date().toLocaleString()}`, 50, footerY + 55, { align: 'center' });

            doc.end();
        } catch (error) {
            console.error('Error in PDF generation:', error);
            reject(error);
        }
    });
}

module.exports = {
    generateReceipt
}; 