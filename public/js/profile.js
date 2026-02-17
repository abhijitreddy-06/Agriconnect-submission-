/**
 * profile.js — Profile page logic
 */
document.addEventListener('DOMContentLoaded', async () => {
    const role = Auth.getRole();

    // Pre-fill from localStorage immediately (instant display)
    const cachedUser = Auth.getUser();
    if (cachedUser) {
        document.getElementById('profileNameDisplay').textContent = cachedUser.username || '--';
        document.getElementById('profilePhone').textContent = cachedUser.phone || '--';
        const roleEl = document.getElementById('profileRole');
        roleEl.textContent = cachedUser.role || role || '--';
        roleEl.className = 'role-badge ' + (cachedUser.role || role);
    }

    // Render stats grid based on role
    renderStatsGrid(role);

    // Load fresh profile data from API
    try {
        const res = await Auth.authFetch('/api/auth/verify');
        const result = await res.json();
        if (result.success && result.user) {
            document.getElementById('profileNameDisplay').textContent = result.user.username || '--';
            document.getElementById('profileNameValue').textContent = result.user.username || '--';
            document.getElementById('profilePhone').textContent = result.user.phone || '--';
            document.getElementById('profileName').value = result.user.username || '';
            const roleEl = document.getElementById('profileRole');
            roleEl.textContent = result.user.role;
            roleEl.className = 'role-badge ' + result.user.role;

            // Update localStorage with fresh data including phone
            Auth.setUser({
                id: result.user.id,
                username: result.user.username,
                role: result.user.role,
                phone: result.user.phone,
            });
        }
    } catch (err) {
        console.error('Failed to load profile:', err);
    }

    // Load stats
    loadStats(role);
});

function toggleEdit() {
    const display = document.getElementById('profileNameValue');
    const editRow = document.getElementById('editNameRow');
    const editBtn = document.getElementById('editBtn');
    const nameInput = document.getElementById('profileName');

    // Pre-fill input with current display value
    if (!nameInput.value) {
        nameInput.value = display.textContent !== '--' ? display.textContent : '';
    }

    display.style.display = 'none';
    editRow.style.display = 'block';
    editBtn.style.display = 'none';
    nameInput.focus();
}

function cancelEdit() {
    document.getElementById('profileNameValue').style.display = '';
    document.getElementById('editNameRow').style.display = 'none';
    document.getElementById('editBtn').style.display = '';
}

function renderStatsGrid(role) {
    const grid = document.getElementById('statsGrid');
    if (!grid) return;

    if (role === 'farmer') {
        grid.innerHTML = `
      <div class="stat-card"><div class="stat-value" id="statProducts">&mdash;</div><div class="stat-label">Products Listed</div></div>
      <div class="stat-card"><div class="stat-value" id="statOrders">&mdash;</div><div class="stat-label">Orders Received</div></div>
    `;
    } else {
        grid.innerHTML = `
      <div class="stat-card"><div class="stat-value" id="statOrders">&mdash;</div><div class="stat-label">Total Orders</div></div>
      <div class="stat-card"><div class="stat-value" id="statCartItems">&mdash;</div><div class="stat-label">Cart Items</div></div>
    `;
    }
}

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

async function saveProfile() {
    const nameInput = document.getElementById('profileName');
    const btn = document.querySelector('.btn-save');

    if (!nameInput || !nameInput.value.trim()) {
        showToast('Name cannot be empty', 'error');
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Saving...';

    try {
        const res = await Auth.authFetch('/api/auth/profile', {
            method: 'PUT',
            body: JSON.stringify({ username: nameInput.value.trim() }),
        });
        const data = await res.json();

        if (data.success) {
            const user = Auth.getUser();
            user.username = nameInput.value.trim();
            Auth.setUser(user);

            // Update display
            document.getElementById('profileNameDisplay').textContent = user.username;
            document.getElementById('profileNameValue').textContent = user.username;
            cancelEdit();
            showToast('Profile updated!');

            // Refresh navbar username
            const nameEl = document.querySelector('.profile-name');
            if (nameEl) nameEl.textContent = user.username;
        } else {
            showToast(data.error || 'Failed to update profile', 'error');
        }
    } catch (err) {
        showToast('Failed to update profile', 'error');
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save';
    }
}

function showToast(message, type = 'success') {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.style.cssText = `
    position:fixed;bottom:2rem;right:2rem;background:#1a2d40;color:white;
    padding:1rem 1.5rem;border-radius:8px;z-index:3000;
    border-left:4px solid ${type === 'success' ? '#5da399' : '#e74c3c'};
    box-shadow:0 4px 12px rgba(0,0,0,0.2);font-family:Nunito,sans-serif;
    animation:slideUp 0.3s ease;
  `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
