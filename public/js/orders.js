// ─── Orders Page JS ─────────────────────────────────────────────



function showToast(message, type = "success") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem; background: #1a2d40; color: white;
    padding: 1rem 1.5rem; border-radius: 8px; z-index: 3000;
    border-left: 4px solid ${type === "success" ? "#5da399" : "#e74c3c"};
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  `;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ─── Load Orders ────────────────────────────────────────────────
async function loadOrders() {
    const listEl = document.getElementById("ordersList");
    const emptyEl = document.getElementById("emptyOrders");
    const role = Auth.getRole();

    try {
        const res = await Auth.authFetch("/api/orders");
        const result = await res.json();

        if (!result.success) {
            showToast(result.error || "Failed to load orders", "error");
            return;
        }

        const orders = result.data || [];

        if (orders.length === 0) {
            emptyEl.style.display = "block";
            listEl.style.display = "none";
            if (role === "farmer") {
                document.getElementById("emptyMessage").textContent = "No orders received yet.";
            }
            return;
        }

        emptyEl.style.display = "none";
        listEl.style.display = "flex";

        listEl.innerHTML = orders
            .map((order) => {
                const statusClass = `status-${order.status}`;

                // Farmer: status dropdown (exclude cancelled/delivered from editing)
                let statusActions = "";
                if (role === "farmer" && !["cancelled", "delivered"].includes(order.status)) {
                    statusActions = `<select class="status-select" onchange="updateStatus(${order.id}, this.value)">
                <option value="pending" ${order.status === "pending" ? "selected" : ""}>Pending</option>
                <option value="accepted" ${order.status === "accepted" ? "selected" : ""}>Accepted</option>
                <option value="shipped" ${order.status === "shipped" ? "selected" : ""}>Shipped</option>
                <option value="delivered" ${order.status === "delivered" ? "selected" : ""}>Delivered</option>
              </select>`;
                }

                // Customer: cancel button (only for pending/accepted)
                let cancelAction = "";
                if (role === "customer" && ["pending", "accepted"].includes(order.status)) {
                    cancelAction = `<button class="btn-cancel" onclick="cancelOrder(${order.id}, this)">
                <i class="fas fa-times-circle"></i> Cancel
              </button>`;
                }

                return `
        <div class="order-card ${order.status === "cancelled" ? "order-cancelled" : ""}">
          <img class="order-image"
               src="${order.image || ""}"
               alt="${order.product_name}"
               onerror="this.style.display='none'" />
          <div class="order-details">
            <h3>${order.product_name}</h3>
            <p class="order-meta">
              ${role === "customer" ? "Seller" : "Buyer"}: ${order.username || "N/A"} &middot;
              Qty: ${order.quantity}
            </p>
            <p class="order-total">₹${parseFloat(order.total_price).toFixed(2)}</p>
          </div>
          <div class="order-status-section">
            <span class="status-badge ${statusClass}">${order.status}</span>
            ${statusActions}
            ${cancelAction}
          </div>
        </div>
      `;
            })
            .join("");
    } catch (err) {
        console.error("Error loading orders:", err);
        showToast("Failed to load orders", "error");
    }
}

// ─── Update Order Status (Farmer) ───────────────────────────────
async function updateStatus(orderId, newStatus) {
    try {
        const res = await Auth.authFetch(`/api/orders/${orderId}`, {
            method: "PUT",
            body: JSON.stringify({ status: newStatus }),
        });
        const data = await res.json();
        if (data.success) {
            showToast(`Order updated to "${newStatus}"`);
        } else {
            showToast(data.error || "Failed to update", "error");
            await loadOrders(); // Revert UI
        }
    } catch (err) {
        showToast("Failed to update order", "error");
        await loadOrders();
    }
}

// ─── Cancel Order (Customer) ────────────────────────────────────
async function cancelOrder(orderId, btnEl) {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cancelling...';

    try {
        const res = await Auth.authFetch(`/api/orders/${orderId}/cancel`, {
            method: "PUT",
        });
        const data = await res.json();
        if (data.success) {
            showToast("Order cancelled successfully");
            await loadOrders();
        } else {
            showToast(data.error || "Failed to cancel order", "error");
            btnEl.disabled = false;
            btnEl.innerHTML = '<i class="fas fa-times-circle"></i> Cancel';
        }
    } catch (err) {
        showToast("Failed to cancel order", "error");
        btnEl.disabled = false;
        btnEl.innerHTML = '<i class="fas fa-times-circle"></i> Cancel';
    }
}

// ─── Init ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadOrders();
});

// Loader
