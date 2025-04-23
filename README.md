# Restaurant Bot Order Management System

A modern web application for managing food orders. This system allows customers to place orders, view their order history, and receive email confirmations, while staff can manage orders through an admin dashboard.

## Features

### Customer Features
- Browse menu items with images and descriptions
- Add items to cart with custom quantities
- Specify table number and customer details
- Schedule orders for future times
- Receive email confirmations with order details
- Download PDF receipts
- View order history
- Track order status

### Admin Features
- **Menu Management**
  - Add new menu items
  - Edit existing items
  - Delete items
  - Toggle item availability
  - Set prices and categories
  - Add custom options with choices
- **Order Management**
  - View all orders in real-time
  - Update order status
  - Track order history
  - View customer details
  - Manage scheduled orders

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- Gmail account (for sending emails)
- Environment variables (see Configuration section)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/reeocity/order-app.git
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
SESSION_SECRET=your_session_secret
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
- `SESSION_SECRET`: Secret key for session management (generate using `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

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

2. **Menu Management**
   - Navigate to `/admin/menu.html`
   - Add new items using the form
   - Edit existing items by clicking the edit button
   - Delete items using the delete button
   - Toggle item availability
   - Add custom options with choices

3. **Order Management**
   - View all orders in real-time
   - Update order status
   - View customer details and order history

## API Endpoints

### Menu Endpoints
- `GET /api/menu` - Get all available menu items
- `GET /api/admin/menu` - Get all menu items (including unavailable ones)
- `GET /api/admin/menu/:id` - Get single menu item by ID
- `POST /api/admin/menu` - Create new menu item
- `PUT /api/admin/menu/:id` - Update menu item
- `DELETE /api/admin/menu/:id` - Delete menu item
- `PATCH /api/admin/menu/:id/toggle-availability` - Toggle item availability

### Order Endpoints
- `GET /api/orders/history` - Get order history for current session
- `GET /api/orders/current` - Get current active order
- `POST /api/orders` - Create new order
- `POST /api/orders/cancel` - Cancel current order
- `POST /api/orders/checkout` - Process order payment

## Security Features

- Session management with secure secret
- Input validation
- Error handling
- Secure email configuration
- Protected admin routes
- Secure cookie settings in production

## Project Structure

```
src/
├── public/          # Static files
│   ├── admin/      # Admin interface files
│   └── styles.css  # Global styles
├── routes/         # API routes
│   ├── adminRoutes.js
│   ├── menuRoutes.js
│   └── orderRoutes.js
├── services/       # Business logic
│   ├── emailService.js
│   └── pdfService.js
├── models/         # Database models
│   ├── MenuItem.js
│   └── Order.js
└── app.js          # Main application file
```

## Session Management

The application uses `express-session` for session management. Sessions are used to:
- Track user sessions
- Manage order history
- Maintain the state of current orders
- Prevent session hijacking

The session secret should be:
- A long, random string
- Kept secret and never shared
- Different for each environment
- Changed periodically for security

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
- Project Link: [https://github.com/reeocity/order-app](https://github.com/reeocity/order-app) 