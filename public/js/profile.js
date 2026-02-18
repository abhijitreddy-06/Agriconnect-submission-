/**
 * profile.js -- Profile dashboard page logic
 */
document.addEventListener('DOMContentLoaded', async () => {
    const role = Auth.getRole();
    const cachedUser = Auth.getUser();

    // Set emoji avatar based on role
    const emojiEl = document.getElementById('avatarEmoji');
    if (emojiEl) {
        emojiEl.textContent = role === 'farmer' ? '\u{1F33E}' : '\u{1F6D2}';
    }

    // Pre-fill from localStorage (instant display)
    if (cachedUser) {
        document.getElementById('profileNameDisplay').textContent = cachedUser.username || '--';
        document.getElementById('profileNameValue').textContent = cachedUser.username || '--';
        document.getElementById('profilePhone').textContent = cachedUser.phone || '--';
        document.getElementById('profileRoleText').textContent = capitalize(cachedUser.role || role || '--');
        const roleEl = document.getElementById('profileRole');
        roleEl.textContent = cachedUser.role || role || '--';
        roleEl.className = 'role-badge ' + (cachedUser.role || role);
    }

    // Render stats grid based on role
    renderStatsRow(role);

    // Load fresh profile data from API
    try {
        const res = await Auth.authFetch('/api/auth/verify');
        const result = await res.json();
        if (result.success && result.user) {
            const u = result.user;
            document.getElementById('profileNameDisplay').textContent = u.username || '--';
            document.getElementById('profileNameValue').textContent = u.username || '--';
            document.getElementById('profilePhone').textContent = u.phone || '--';
            document.getElementById('profileNameInput').value = u.username || '';
            document.getElementById('profileRoleText').textContent = capitalize(u.role);
            const roleEl = document.getElementById('profileRole');
            roleEl.textContent = u.role;
            roleEl.className = 'role-badge ' + u.role;

            // Update localStorage with fresh data
            Auth.setUser({
                id: u.id,
                username: u.username,
                role: u.role,
                phone: u.phone,
            });
        }
    } catch (err) {
        console.error('Failed to load profile:', err);
    }

    // Load stats and recent activity
    loadStats(role);
    loadRecentActivity(role);

    // Wire up logout button
    const logoutBtn = document.getElementById('profileLogoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            Auth.logout();
        });
    }
});

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

// -- Stats Row --
function renderStatsRow(role) {
    const row = document.getElementById('statsRow');
    if (!row) return;

    if (role === 'farmer') {
        row.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon accent-icon"><i class="fas fa-seedling"></i></div>
                <div class="stat-info">
                    <span class="stat-value" id="statProducts">&mdash;</span>
                    <span class="stat-label">Products</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon warm-icon"><i class="fas fa-box"></i></div>
                <div class="stat-info">
                    <span class="stat-value" id="statOrders">&mdash;</span>
                    <span class="stat-label">Orders</span>
                </div>
            </div>
        `;
    } else {
        row.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon primary-icon"><i class="fas fa-receipt"></i></div>
                <div class="stat-info">
                    <span class="stat-value" id="statOrders">&mdash;</span>
                    <span class="stat-label">Orders</span>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon secondary-icon"><i class="fas fa-shopping-cart"></i></div>
                <div class="stat-info">
                    <span class="stat-value" id="statCartItems">&mdash;</span>
                    <span class="stat-label">Cart Items</span>
                </div>
            </div>
        `;
    }
}

// -- Load Stats Data --
async function loadStats(role) {
    try {
        const orderRes = await Auth.authFetch('/api/orders');
        const orderData = await orderRes.json();
        const orderCount = orderData.data?.length || 0;
        const el = document.getElementById('statOrders');
        if (el) el.textContent = orderCount;

        if (role === 'farmer') {
            const user = Auth.getUser();
            const prodRes = await Auth.authFetch('/api/products?farmer_id=' + user.id);
            const prodData = await prodRes.json();
            const prodEl = document.getElementById('statProducts');
            if (prodEl) prodEl.textContent = prodData.data?.length || 0;
        } else {
            const cartRes = await Auth.authFetch('/api/cart');
            const cartData = await cartRes.json();
            const cartEl = document.getElementById('statCartItems');
            if (cartEl) cartEl.textContent = cartData.data?.itemCount || 0;
        }
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

// -- Load Recent Activity (last 5 orders) --
async function loadRecentActivity(role) {
    const container = document.getElementById('recentActivity');
    if (!container) return;

    try {
        const res = await Auth.authFetch('/api/orders');
        const result = await res.json();

        if (!result.success || !result.data || result.data.length === 0) {
            container.innerHTML = `
                <div class="activity-empty">
                    <i class="fas fa-inbox"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }

        const orders = result.data.slice(0, 5);

        const itemsHtml = orders.map(order => {
            const statusClass = 'status-' + order.status;
            const total = parseFloat(order.total_price).toFixed(2);

            return `
                <div class="activity-item">
                    <div class="activity-icon">
                        <i class="fas fa-box"></i>
                    </div>
                    <div class="activity-details">
                        <div class="activity-name">${escapeHtml(order.product_name)}</div>
                        <div class="activity-meta">Qty: ${order.quantity} &middot; &#8377;${total}</div>
                    </div>
                    <div class="activity-status">
                        <span class="status-badge ${statusClass}">${order.status}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = `
            <div class="activity-list">${itemsHtml}</div>
            <a href="/orders" class="activity-view-all">View all orders <i class="fas fa-arrow-right"></i></a>
        `;
    } catch (err) {
        console.error('Failed to load recent activity:', err);
        container.innerHTML = `
            <div class="activity-empty">
                <i class="fas fa-exclamation-circle"></i>
                <p>Could not load recent activity</p>
            </div>
        `;
    }
}

// -- Escape HTML to prevent XSS --
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// -- Edit / Save / Cancel Name --
function toggleEdit() {
    const display = document.getElementById('nameDisplay');
    const editRow = document.getElementById('nameEditRow');
    const input = document.getElementById('profileNameInput');

    const currentName = document.getElementById('profileNameValue').textContent;
    if (!input.value || input.value === '') {
        input.value = currentName !== '--' ? currentName : '';
    }

    display.style.display = 'none';
    editRow.style.display = 'block';
    input.focus();
}

function cancelEdit() {
    document.getElementById('nameDisplay').style.display = '';
    document.getElementById('nameEditRow').style.display = 'none';
}

async function saveProfile() {
    const input = document.getElementById('profileNameInput');
    const btn = document.getElementById('saveBtn');

    if (!input || !input.value.trim()) {
        showToast('Name cannot be empty', 'error');
        return;
    }

    const newName = input.value.trim();

    if (newName.length < 2) {
        showToast('Name must be at least 2 characters', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

    try {
        const res = await Auth.authFetch('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ username: newName }),
        });
        const data = await res.json();

        if (data.success) {
            // Update localStorage
            const user = Auth.getUser();
            user.username = newName;
            Auth.setUser(user);

            // Update all display elements
            document.getElementById('profileNameDisplay').textContent = newName;
            document.getElementById('profileNameValue').textContent = newName;
            cancelEdit();
            showToast('Profile updated!');

            // Refresh navbar username
            const nameEl = document.querySelector('.profile-name');
            if (nameEl) nameEl.textContent = newName;
        } else {
            showToast(data.error || 'Failed to update profile', 'error');
        }
    } catch (err) {
        showToast('Failed to update profile', 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-check"></i> Save';
    }
}

// -- Toast --
function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
        position:fixed;bottom:2rem;right:2rem;background:var(--color-primary);color:white;
        padding:1rem 1.5rem;border-radius:8px;z-index:3000;
        border-left:4px solid ${type === 'success' ? 'var(--color-accent)' : 'var(--color-danger)'};
        box-shadow:0 4px 12px rgba(0,0,0,0.2);font-family:Nunito,sans-serif;
        animation:slideUp 0.3s ease;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
