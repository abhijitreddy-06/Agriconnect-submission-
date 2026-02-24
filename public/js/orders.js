// ─── Orders Page JS ─────────────────────────────────────────────

let currentOrderPage = 1;
const ORDER_LIMIT = 15;

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

function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

// ─── Load Orders ────────────────────────────────────────────────
async function loadOrders(page) {
    const listEl = document.getElementById("ordersList");
    const emptyEl = document.getElementById("emptyOrders");
    const role = Auth.getRole();

    try {
        const params = new URLSearchParams();
        params.set("page", page || 1);
        params.set("limit", ORDER_LIMIT);

        const res = await Auth.authFetch("/api/orders?" + params.toString());
        const result = await res.json();

        if (!result.success) {
            showToast(result.error || "Failed to load orders", "error");
            return;
        }

        const orders = result.data || [];

        if (orders.length === 0 && page === 1) {
            emptyEl.style.display = "block";
            listEl.style.display = "none";
            renderOrderPagination({ page: 1, totalPages: 0 });
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

                // Farmer: status dropdown — only show valid forward transitions
                const validTransitions = {
                    pending: ["pending", "accepted"],
                    accepted: ["accepted", "shipped"],
                    shipped: ["shipped", "delivered"],
                };
                let statusActions = "";
                if (role === "farmer" && !["cancelled", "delivered"].includes(order.status)) {
                    const options = (validTransitions[order.status] || [])
                        .map(s => `<option value="${s}" ${s === order.status ? "selected" : ""}>${s.charAt(0).toUpperCase() + s.slice(1)}</option>`)
                        .join("");
                    statusActions = `<select class="status-select" onchange="updateStatus(${order.id}, this.value)">${options}</select>`;
                }

                // Customer: cancel button (only for pending/accepted)
                let cancelAction = "";
                if (role === "customer" && ["pending", "accepted"].includes(order.status)) {
                    cancelAction = `<button class="btn-cancel" onclick="cancelOrder(${order.id}, this)">
                <i class="fas fa-times-circle"></i> Cancel
              </button>`;
                }

                // Chat button — only for pending orders
                let chatAction = "";
                if (order.status === "pending") {
                    chatAction = `<a href="/chat?orderId=${order.id}" class="btn-chat">
                <i class="fas fa-comments"></i> Chat
              </a>`;
                }

                // Review button — only for customers with delivered orders
                let reviewAction = "";
                if (role === "customer" && order.status === "delivered") {
                    reviewAction = `<button class="btn-review" onclick="openReviewModal(${order.id}, ${order.product_id}, '${escapeHtml(order.product_name).replace(/'/g, "\\'")}')">
                <i class="fas fa-star"></i> Review
              </button>`;
                }

                // Delivery address display
                const addressHtml = order.delivery_address
                    ? `<p class="order-address"><i class="fas fa-map-marker-alt"></i> ${escapeHtml(order.delivery_address)}</p>`
                    : "";

                return `
        <div class="order-card ${order.status === "cancelled" ? "order-cancelled" : ""}">
          <img class="order-image"
               src="${order.image || ""}"
               alt="${escapeHtml(order.product_name)}"
               onerror="this.style.display='none'" />
          <div class="order-details">
            <h3>${escapeHtml(order.product_name)}</h3>
            <p class="order-meta">
              ${role === "customer" ? "Seller" : "Buyer"}: ${escapeHtml(order.username) || "N/A"} &middot;
              Qty: ${order.quantity}
            </p>
            <p class="order-total">₹${parseFloat(order.total_price).toFixed(2)}</p>
            ${addressHtml}
          </div>
          <div class="order-status-section">
            <span class="status-badge ${statusClass}">${order.status}</span>
            ${statusActions}
            ${chatAction}
            ${cancelAction}
            ${reviewAction}
          </div>
        </div>
      `;
            })
            .join("");

        renderOrderPagination(result);
    } catch (err) {
        console.error("Error loading orders:", err);
        showToast("Failed to load orders", "error");
    }
}

// ─── Order Pagination ──────────────────────────────────────────
function renderOrderPagination(result) {
    const container = document.getElementById("ordersPagination");
    if (!container) return;
    const { page, totalPages } = result;
    if (!totalPages || totalPages <= 1) {
        container.innerHTML = "";
        return;
    }

    let html = "";
    html += `<button class="page-btn" ${page <= 1 ? "disabled" : ""} onclick="goToOrderPage(${page - 1})"><i class="fas fa-chevron-left"></i></button>`;

    const start = Math.max(1, page - 2);
    const end = Math.min(totalPages, page + 2);

    if (start > 1) {
        html += `<button class="page-btn" onclick="goToOrderPage(1)">1</button>`;
        if (start > 2) html += `<span class="page-ellipsis">...</span>`;
    }

    for (let i = start; i <= end; i++) {
        html += `<button class="page-btn ${i === page ? "active" : ""}" onclick="goToOrderPage(${i})">${i}</button>`;
    }

    if (end < totalPages) {
        if (end < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
        html += `<button class="page-btn" onclick="goToOrderPage(${totalPages})">${totalPages}</button>`;
    }

    html += `<button class="page-btn" ${page >= totalPages ? "disabled" : ""} onclick="goToOrderPage(${page + 1})"><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
}

function goToOrderPage(page) {
    currentOrderPage = page;
    loadOrders(currentOrderPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
            await loadOrders(currentOrderPage);
        } else {
            showToast(data.error || "Failed to update", "error");
            await loadOrders(currentOrderPage);
        }
    } catch (err) {
        showToast("Failed to update order", "error");
        await loadOrders(currentOrderPage);
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
            await loadOrders(currentOrderPage);
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

// ─── Review Modal ───────────────────────────────────────────────
let reviewOrderId = null;
let reviewProductId = null;
let selectedRating = 0;

function openReviewModal(orderId, productId, productName) {
    reviewOrderId = orderId;
    reviewProductId = productId;
    selectedRating = 0;

    // Check if already reviewed
    Auth.authFetch(`/api/reviews/check/${orderId}`).then(r => r.json()).then(data => {
        if (data.success && data.reviewed) {
            showToast("You have already reviewed this order.");
            return;
        }
        showModal(productName);
    }).catch(() => showModal(productName));
}

function showModal(productName) {
    // Remove existing modal
    const existing = document.getElementById("reviewModal");
    if (existing) existing.remove();

    const modal = document.createElement("div");
    modal.id = "reviewModal";
    modal.className = "review-modal-overlay";
    modal.innerHTML = `
        <div class="review-modal">
            <div class="review-modal-header">
                <h3><i class="fas fa-star"></i> Review: ${escapeHtml(productName)}</h3>
                <button class="review-modal-close" onclick="closeReviewModal()">&times;</button>
            </div>
            <div class="review-modal-body">
                <div class="star-rating" id="starRating">
                    <span class="star" data-rating="1"><i class="fas fa-star"></i></span>
                    <span class="star" data-rating="2"><i class="fas fa-star"></i></span>
                    <span class="star" data-rating="3"><i class="fas fa-star"></i></span>
                    <span class="star" data-rating="4"><i class="fas fa-star"></i></span>
                    <span class="star" data-rating="5"><i class="fas fa-star"></i></span>
                </div>
                <p class="rating-label" id="ratingLabel">Select a rating</p>
                <textarea id="reviewFeedback" placeholder="Write your feedback (optional, max 500 chars)" maxlength="500" rows="3"></textarea>
                <div class="review-char-count"><span id="reviewCharCount">0</span>/500</div>
            </div>
            <div class="review-modal-footer">
                <button class="btn-submit-review" id="submitReviewBtn" onclick="submitReview()" disabled>Submit Review</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeReviewModal();
    });

    // Star click handlers
    const stars = modal.querySelectorAll(".star");
    const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];
    stars.forEach((star) => {
        star.addEventListener("click", () => {
            selectedRating = parseInt(star.dataset.rating);
            updateStars(stars, selectedRating);
            document.getElementById("ratingLabel").textContent = ratingLabels[selectedRating];
            document.getElementById("submitReviewBtn").disabled = false;
        });
        star.addEventListener("mouseenter", () => {
            updateStars(stars, parseInt(star.dataset.rating));
        });
    });

    const starContainer = modal.querySelector(".star-rating");
    starContainer.addEventListener("mouseleave", () => {
        updateStars(stars, selectedRating);
    });

    // Feedback char count
    const feedbackEl = document.getElementById("reviewFeedback");
    feedbackEl.addEventListener("input", () => {
        document.getElementById("reviewCharCount").textContent = feedbackEl.value.length;
    });
}

function updateStars(stars, rating) {
    stars.forEach((s) => {
        const val = parseInt(s.dataset.rating);
        s.classList.toggle("active", val <= rating);
    });
}

function closeReviewModal() {
    const modal = document.getElementById("reviewModal");
    if (modal) modal.remove();
    reviewOrderId = null;
    reviewProductId = null;
    selectedRating = 0;
}

async function submitReview() {
    if (!selectedRating || !reviewOrderId) return;

    const feedback = document.getElementById("reviewFeedback").value.trim();
    const btn = document.getElementById("submitReviewBtn");
    btn.disabled = true;
    btn.textContent = "Submitting...";

    try {
        const res = await Auth.authFetch("/api/reviews", {
            method: "POST",
            body: JSON.stringify({
                order_id: reviewOrderId,
                rating: selectedRating,
                feedback: feedback || undefined,
            }),
        });
        const data = await res.json();

        if (data.success) {
            showToast("Review submitted successfully!");
            closeReviewModal();
            await loadOrders(currentOrderPage);
        } else {
            showToast(data.error || "Failed to submit review", "error");
            btn.disabled = false;
            btn.textContent = "Submit Review";
        }
    } catch {
        showToast("Failed to submit review", "error");
        btn.disabled = false;
        btn.textContent = "Submit Review";
    }
}

// ─── Init ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadOrders(currentOrderPage);
});
