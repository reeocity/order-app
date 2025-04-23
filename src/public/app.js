document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');
    let currentOrder = {
        items: [],
        total: 0
    };
    let menuItems = [];
    let isSelectingFromOptions = false;

    // Initial bot message
    addMessage('👋 Welcome to our restaurant! How can I help you today?', 'bot');
    showOptions();

    function addMessage(content, sender, isHTML = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        if (isHTML) {
            messageDiv.innerHTML = content;
        } else {
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.textContent = content;
            messageDiv.appendChild(messageContent);
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showOptions() {
        isSelectingFromOptions = true;
        addMessage('Please select from these options:', 'bot');
        const options = [
            { key: '1', text: '📋 Place an order', description: 'Browse our menu and add items to your order' },
            { key: '2', text: '🛒 Checkout order', description: 'Proceed to payment for your current order' },
            { key: '3', text: '📜 See order history', description: 'View your previous orders' },
            { key: '4', text: '🔍 See current order', description: 'Check items in your current order' },
            { key: '0', text: '❌ Cancel order', description: 'Cancel your current order' }
        ];
        
        const optionsHTML = `
            <div class="options-grid">
                ${options.map(opt => `
                    <div class="option-block">
                        <div class="option-header">
                            <span class="option-key">${opt.key}</span>
                            <span class="option-text">${opt.text}</span>
                        </div>
                        <div class="option-description">${opt.description}</div>
                    </div>
                `).join('')}
            </div>
        `;
        
        addMessage(optionsHTML, 'bot', true);
    }

    function showOrderOptions() {
        isSelectingFromOptions = true;
        const orderOptionsHTML = `
            <div class="options-list">
                <div class="option-item">1. Continue ordering</div>
                <div class="option-item">2. Checkout</div>
                <div class="option-item">3. View current order</div>
            </div>
        `;
        addMessage('What would you like to do next?', 'bot');
        addMessage(orderOptionsHTML, 'bot', true);
    }

    chatInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            const input = chatInput.value.trim();
            if (input) {
                addMessage(input, 'user');
                chatInput.value = '';

                // Handle menu item selection if menu is shown
                if (menuItems.length > 0 && !isSelectingFromOptions) {
                    const itemNumber = parseInt(input);
                    if (!isNaN(itemNumber) && itemNumber >= 1 && itemNumber <= menuItems.length) {
                        await selectMenuItem(menuItems[itemNumber - 1]);
                        return;
                    }
                }

                // Handle main options and order options
                switch(input) {
                    case '1':
                        if (isSelectingFromOptions && menuItems.length > 0) {
                            await showMenu();
                        } else {
                            await showMenu();
                        }
                        break;
                    case '2':
                        if (isSelectingFromOptions) {
                            handleCheckout();
                        } else {
                            handleCheckout();
                        }
                        break;
                    case '3':
                        if (isSelectingFromOptions && menuItems.length > 0) {
                            showCurrentOrder();
                            showOrderOptions();
                        } else {
                            await showOrderHistory();
                        }
                        break;
                    case '4':
                        showCurrentOrder();
                        break;
                    case '0':
                        cancelOrder();
                        break;
                    default:
                        addMessage('⚠️ Please select a valid option (1-4, or 0 to cancel)', 'bot');
                        if (menuItems.length > 0 && !isSelectingFromOptions) {
                            addMessage('📝 Or type the number of the menu item you want to order', 'bot');
                        }
                        showOptions();
                }
            }
        }
    });

    async function showMenu() {
        try {
            const response = await fetch('/api/menu', {
                credentials: 'include'
            });
            menuItems = await response.json();
            isSelectingFromOptions = false;
            
            addMessage('🍽️ Here\'s our menu:', 'bot');
            menuItems.forEach((item, index) => {
                const menuItemHTML = `
                    <div class="menu-item">
                        <div class="menu-item-header">
                            <span class="menu-item-number">${index + 1}</span>
                            <span class="menu-item-name">${item.name}</span>
                            <span class="menu-item-price">₦${item.price.toLocaleString()}</span>
                        </div>
                        <div class="menu-item-description">${item.description}</div>
                        ${item.options ? `
                            <div class="menu-item-options">
                                ${item.options.map(opt => 
                                    `<div class="option-detail">${opt.name}: ${opt.choices.join(', ')}</div>`
                                ).join('')}
                            </div>
                        ` : ''}
                    </div>
                `;
                addMessage(menuItemHTML, 'bot', true);
            });
            
            addMessage('📝 To order, type the number of the item you want (1-8)', 'bot');
        } catch (error) {
            addMessage('❌ Sorry, I couldn\'t fetch the menu right now. Please try again later.', 'bot');
        }
    }

    async function selectMenuItem(item) {
        // Check if item already exists in order
        const existingItem = currentOrder.items.find(orderItem => 
            orderItem._id === item._id && 
            JSON.stringify(orderItem.options) === JSON.stringify({}));

        if (existingItem) {
            // Increment quantity if item exists
            existingItem.quantity = (existingItem.quantity || 1) + 1;
            currentOrder.total += item.price;
            addMessage(`✅ Added another ${item.name} (Quantity: ${existingItem.quantity})`, 'bot');
        } else {
            // Add new item with quantity 1
            currentOrder.items.push({
                _id: item._id,
                name: item.name,
                price: item.price,
                quantity: 1,
                options: {}
            });
            currentOrder.total += item.price;
            addMessage(`✅ Added ${item.name} to your order.`, 'bot');
        }
        
        showCurrentOrder();
        showOrderOptions();
    }

    async function handleCheckout() {
        if (currentOrder.items.length === 0) {
            addMessage('🛒 Your cart is empty. Please add some items first!', 'bot');
            return;
        }
        
        try {
            // Create the order in the database first
            const createOrderResponse = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    items: currentOrder.items,
                    totalAmount: currentOrder.total
                })
            });

            if (!createOrderResponse.ok) {
                throw new Error('Failed to create order');
            }

            addMessage(`💳 Total amount: ₦${currentOrder.total.toLocaleString()}`, 'bot');
            addMessage('🔄 Redirecting to checkout...', 'bot');
            window.location.href = '/checkout.html';
        } catch (error) {
            addMessage('❌ Sorry, there was an error processing your order. Please try again.', 'bot');
            console.error('Error creating order:', error);
        }
    }

    async function showOrderHistory() {
        try {
            const response = await fetch('/api/orders/history', {
                credentials: 'include'
            });
            const orders = await response.json();
            
            if (orders.length === 0) {
                addMessage('📝 You haven\'t placed any orders yet.', 'bot');
                return;
            }

            addMessage('📜 Your Order History:', 'bot');
            orders.forEach(order => {
                const scheduledText = order.scheduledFor ? 
                    ` (🕒 Scheduled for: ${new Date(order.scheduledFor).toLocaleString()})` : '';
                const orderHTML = `
                    <div class="current-order">
                        <div class="current-order-title">Order #${order._id}</div>
                        <div class="current-order-items">Status: ${order.status}${scheduledText}</div>
                        <div class="current-order-total">Total: ₦${order.totalAmount.toLocaleString()}</div>
                    </div>
                `;
                addMessage(orderHTML, 'bot', true);
            });
        } catch (error) {
            addMessage('❌ Sorry, I couldn\'t fetch your order history right now.', 'bot');
        }
    }

    function showCurrentOrder() {
        if (currentOrder.items.length === 0) {
            addMessage('🛒 You don\'t have any items in your current order.', 'bot');
            return;
        }

        const orderHTML = `
            <div class="current-order">
                <div class="current-order-title">Current Order</div>
                <div class="current-order-items">
                    ${currentOrder.items.map(item => `
                        <div class="order-item">
                            <span class="item-name">${item.name}</span>
                            <span class="item-quantity">x${item.quantity || 1}</span>
                            <span class="item-price">₦${(item.price * (item.quantity || 1)).toLocaleString()}</span>
                        </div>
                        ${Object.entries(item.options)
                            .filter(([_, value]) => value)
                            .map(([key, value]) => `
                                <div class="menu-item-options">- ${key}: ${value}</div>
                            `).join('')}
                    `).join('')}
                </div>
                <div class="current-order-total">Total: ₦${currentOrder.total.toLocaleString()}</div>
            </div>
        `;
        
        addMessage(orderHTML, 'bot', true);
    }

    async function cancelOrder() {
        if (currentOrder.items.length === 0) {
            addMessage('❌ There is no active order to cancel.', 'bot');
            return;
        }

        try {
            const response = await fetch('/api/orders/cancel', {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                currentOrder = {
                    items: [],
                    total: 0
                };
                addMessage('✅ Your order has been cancelled.', 'bot');
                showOptions();
            } else {
                addMessage('❌ Sorry, there was an error cancelling your order.', 'bot');
            }
        } catch (error) {
            addMessage('❌ Sorry, there was an error cancelling your order.', 'bot');
        }
    }

    // Expose necessary functions to window for HTML onclick handlers
    window.updateItemOption = function(itemId, optionName, value) {
        const item = currentOrder.items.find(item => item._id === itemId);
        if (item) {
            item.options[optionName] = value;
            showCurrentOrder();
        }
    };
}); 