# Princess Luxury Hotels Order Management System

A modern web application for managing food orders at Princess Luxury Hotels. This system allows customers to place orders, view their order history, and receive email confirmations, while staff can manage orders through an admin dashboard.

## Features

- **Customer Ordering**
  - Browse menu items with images and descriptions
  - Add items to cart with custom quantities
  - Specify table number and customer details
  - Schedule orders for future times
  - Receive email confirmations with order details
  - Download PDF receipts

- **Admin Dashboard**
  - Real-time order management
  - View and update order status
  - Track order history
  - Manage menu items
  - View customer details

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail account (for sending emails)
- Environment variables (see Configuration section)

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd order-app
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=your_mongodb_connection_string
GMAIL_USER=your_gmail_address
GMAIL_APP_PASSWORD=your_gmail_app_password
```

4. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## Configuration

### Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `GMAIL_USER`: Gmail address for sending emails
- `GMAIL_APP_PASSWORD`: Gmail app password (not your regular password)

### Gmail Setup

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password:
   - Go to Google Account > Security
   - Under "2-Step Verification", click on "App passwords"
   - Select "Mail" and your device
   - Use the generated password in your `.env` file

## Usage

### Customer Interface

1. **Placing an Order**
   - Visit the main page
   - Browse the menu
   - Click on items to add to cart
   - Adjust quantities as needed
   - Enter table number and customer details
   - Optionally schedule the order
   - Submit the order

2. **Order Confirmation**
   - Receive an email with order details
   - Download the PDF receipt
   - View order status

### Admin Interface

1. **Accessing the Dashboard**
   - Navigate to `/admin`
   - Log in with admin credentials

2. **Managing Orders**
   - View all orders in real-time
   - Update order status (Pending, Processing, Completed, Cancelled)
   - View customer details and order history

3. **Menu Management**
   - Add new menu items
   - Update existing items
   - Set prices and availability

## Project Structure

```
src/
├── public/          # Static files
├── routes/          # API routes
├── services/        # Business logic
├── models/          # Database models
└── views/           # HTML templates
```

## API Endpoints

- `POST /api/orders` - Create a new order
- `GET /api/orders` - Get all orders
- `GET /api/orders/:id` - Get order by ID
- `PUT /api/orders/:id` - Update order status
- `GET /api/menu` - Get menu items

## Security Features

- Input validation
- Error handling
- Secure email configuration
- Protected admin routes

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contact

For any questions or support, please contact:
- Email: [your-email]
- Project Link: [your-repository-url] 