document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const menuItemsList = document.getElementById('menuItemsList');
    const addItemForm = document.getElementById('addItemForm');
    const editItemForm = document.getElementById('editItemForm');
    const editModal = document.getElementById('editModal');
    const closeModal = document.querySelector('.close');
    const addOptionBtn = document.getElementById('addOption');
    const addEditOptionBtn = document.getElementById('addEditOption');

    // Load menu items on page load
    loadMenuItems();

    // Add new menu item
    addItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            price: parseFloat(document.getElementById('price').value),
            category: document.getElementById('category').value,
            description: document.getElementById('description').value,
            options: getOptionsFromForm('optionsContainer'),
            available: true
        };

        try {
            const response = await fetch('/api/admin/menu', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                addItemForm.reset();
                loadMenuItems();
                alert('Menu item added successfully!');
            } else {
                throw new Error('Failed to add menu item');
            }
        } catch (error) {
            alert('Error adding menu item: ' + error.message);
        }
    });

    // Edit menu item
    editItemForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const itemId = document.getElementById('editItemId').value;
        const formData = {
            name: document.getElementById('editName').value,
            price: parseFloat(document.getElementById('editPrice').value),
            category: document.getElementById('editCategory').value,
            description: document.getElementById('editDescription').value,
            options: getOptionsFromForm('editOptionsContainer'),
            available: document.getElementById('editAvailable').checked
        };

        try {
            const response = await fetch(`/api/admin/menu/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                editModal.style.display = 'none';
                loadMenuItems();
                alert('Menu item updated successfully!');
            } else {
                throw new Error('Failed to update menu item');
            }
        } catch (error) {
            alert('Error updating menu item: ' + error.message);
        }
    });

    // Add option to new item form
    addOptionBtn.addEventListener('click', () => {
        addOptionToContainer('optionsContainer');
    });

    // Add option to edit form
    addEditOptionBtn.addEventListener('click', () => {
        addOptionToContainer('editOptionsContainer');
    });

    // Close modal
    closeModal.addEventListener('click', () => {
        editModal.style.display = 'none';
    });

    // Load menu items
    async function loadMenuItems() {
        try {
            const response = await fetch('/api/admin/menu');
            const items = await response.json();
            
            menuItemsList.innerHTML = items.map(item => `
                <div class="menu-item-card" data-id="${item._id}">
                    <div class="menu-item-info">
                        <h3>${item.name}</h3>
                        <p>₦${item.price.toLocaleString()}</p>
                        <p>${item.category}</p>
                        <p>${item.description}</p>
                        ${item.options ? `
                            <div class="menu-item-options">
                                ${item.options.map(opt => `
                                    <div>${opt.name}: ${opt.choices.join(', ')} ${opt.required ? '(Required)' : ''}</div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                    <div class="menu-item-actions">
                        <button class="edit-btn" onclick="openEditModal('${item._id}')">Edit</button>
                        <button class="delete-btn" onclick="deleteMenuItem('${item._id}')">Delete</button>
                        <button class="toggle-btn" onclick="toggleAvailability('${item._id}', ${!item.available})">
                            ${item.available ? 'Make Unavailable' : 'Make Available'}
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            alert('Error loading menu items: ' + error.message);
        }
    }

    // Helper function to get options from form
    function getOptionsFromForm(containerId) {
        const container = document.getElementById(containerId);
        const optionItems = container.querySelectorAll('.option-item');
        
        return Array.from(optionItems).map(item => ({
            name: item.querySelector('.option-name').value,
            choices: item.querySelector('.option-choices').value.split(',').map(c => c.trim()),
            required: item.querySelector('.option-required').checked
        }));
    }

    // Helper function to add option to container
    function addOptionToContainer(containerId) {
        const container = document.getElementById(containerId);
        const optionItem = document.createElement('div');
        optionItem.className = 'option-item';
        optionItem.innerHTML = `
            <input type="text" placeholder="Option Name" class="option-name">
            <input type="text" placeholder="Choices (comma separated)" class="option-choices">
            <input type="checkbox" class="option-required"> Required
            <button type="button" class="remove-option">Remove</button>
        `;
        container.appendChild(optionItem);

        // Add event listener to remove button
        optionItem.querySelector('.remove-option').addEventListener('click', () => {
            optionItem.remove();
        });
    }
});

// Open edit modal
async function openEditModal(itemId) {
    try {
        const response = await fetch(`/api/admin/menu/${itemId}`);
        const item = await response.json();

        document.getElementById('editItemId').value = item._id;
        document.getElementById('editName').value = item.name;
        document.getElementById('editPrice').value = item.price;
        document.getElementById('editCategory').value = item.category;
        document.getElementById('editDescription').value = item.description;
        document.getElementById('editAvailable').checked = item.available;

        // Clear and populate options
        const optionsContainer = document.getElementById('editOptionsContainer');
        optionsContainer.innerHTML = '';
        
        if (item.options && item.options.length > 0) {
            item.options.forEach(option => {
                const optionItem = document.createElement('div');
                optionItem.className = 'option-item';
                optionItem.innerHTML = `
                    <input type="text" placeholder="Option Name" class="option-name" value="${option.name}">
                    <input type="text" placeholder="Choices (comma separated)" class="option-choices" value="${option.choices.join(', ')}">
                    <input type="checkbox" class="option-required" ${option.required ? 'checked' : ''}> Required
                    <button type="button" class="remove-option">Remove</button>
                `;
                optionsContainer.appendChild(optionItem);

                // Add event listener to remove button
                optionItem.querySelector('.remove-option').addEventListener('click', () => {
                    optionItem.remove();
                });
            });
        }

        document.getElementById('editModal').style.display = 'block';
    } catch (error) {
        alert('Error loading menu item: ' + error.message);
    }
}

// Delete menu item
async function deleteMenuItem(itemId) {
    if (confirm('Are you sure you want to delete this menu item?')) {
        try {
            const response = await fetch(`/api/admin/menu/${itemId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                document.querySelector(`.menu-item-card[data-id="${itemId}"]`).remove();
                alert('Menu item deleted successfully!');
            } else {
                throw new Error('Failed to delete menu item');
            }
        } catch (error) {
            alert('Error deleting menu item: ' + error.message);
        }
    }
}

// Toggle menu item availability
async function toggleAvailability(itemId, available) {
    try {
        const response = await fetch(`/api/admin/menu/${itemId}/toggle-availability`, {
            method: 'PATCH'
        });

        if (response.ok) {
            const item = await response.json();
            const toggleBtn = document.querySelector(`.menu-item-card[data-id="${itemId}"] .toggle-btn`);
            toggleBtn.textContent = item.available ? 'Make Unavailable' : 'Make Available';
            alert(`Menu item ${item.available ? 'made available' : 'made unavailable'} successfully!`);
        } else {
            throw new Error('Failed to toggle menu item availability');
        }
    } catch (error) {
        alert('Error toggling menu item availability: ' + error.message);
    }
} 