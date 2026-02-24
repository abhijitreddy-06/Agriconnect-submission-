// ─── Cart Page JS ───────────────────────────────────────────────

function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
}

function showToast(message, type = "success") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i> ${escapeHtml(message)}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// ─── Cart State ─────────────────────────────────────────────────
let cartData = { items: [], cartTotal: 0, itemCount: 0 };

async function loadCart() {
    try {
        const res = await Auth.authFetch("/api/cart");
        const result = await res.json();

        if (result.success) {
            cartData = result.data;
            renderCart();
        } else {
            showToast(result.error || "Failed to load cart", "error");
        }
    } catch (err) {
        console.error("Error loading cart:", err);
        showToast("Failed to load cart", "error");
    }
}

function renderCart() {
    const emptyEl = document.getElementById("emptyCart");
    const containerEl = document.getElementById("cartContainer");
    const countEl = document.getElementById("cartCount");
    const itemsEl = document.getElementById("cartItems");
    const subtotalEl = document.getElementById("subtotal");
    const totalEl = document.getElementById("cartTotal");

    countEl.textContent = `${cartData.itemCount} item${cartData.itemCount !== 1 ? "s" : ""}`;

    if (!cartData.items || cartData.items.length === 0) {
        emptyEl.style.display = "block";
        containerEl.style.display = "none";
        return;
    }

    emptyEl.style.display = "none";
    containerEl.style.display = "grid";

    itemsEl.innerHTML = cartData.items
        .map(
            (item) => `
    <div class="cart-item" data-id="${item.id}">
      <img
        class="cart-item-image"
        src="${item.image || ""}"
        alt="${item.product_name}"
        onerror="this.style.display='none'"
      />
      <div class="cart-item-details">
        <h3>${escapeHtml(item.product_name)}</h3>
        <p class="farmer-name">Sold by: ${escapeHtml(item.farmer_name || "Farmer")}</p>
        <p class="item-price">₹${parseFloat(item.price).toFixed(2)} / ${escapeHtml(item.quantity_unit || "unit")}</p>
        <p class="item-subtotal">Subtotal: ₹${item.subtotal.toFixed(2)}</p>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-controls">
          <button onclick="changeQuantity(${item.id}, ${parseFloat(item.quantity) - 1})" aria-label="Decrease quantity">−</button>
          <span class="qty-value">${parseFloat(item.quantity)}</span>
          <button onclick="changeQuantity(${item.id}, ${parseFloat(item.quantity) + 1})" aria-label="Increase quantity">+</button>
        </div>
        <button class="remove-btn" onclick="removeItem(${item.id})">
          <i class="fas fa-trash-alt"></i> Remove
        </button>
      </div>
    </div>
  `
        )
        .join("");

    subtotalEl.textContent = `₹${cartData.cartTotal.toFixed(2)}`;
    totalEl.textContent = `₹${cartData.cartTotal.toFixed(2)}`;
}

// ─── Cart Actions ───────────────────────────────────────────────

async function changeQuantity(cartItemId, newQty) {
    if (newQty <= 0) {
        removeItem(cartItemId);
        return;
    }

    try {
        const res = await Auth.authFetch(`/api/cart/${cartItemId}`, {
            method: "PUT",
            body: JSON.stringify({ quantity: newQty }),
        });
        const data = await res.json();
        if (data.success) {
            await loadCart();
        } else {
            showToast(data.error || "Failed to update quantity", "error");
        }
    } catch (err) {
        showToast("Failed to update quantity", "error");
    }
}

async function removeItem(cartItemId) {
    try {
        const res = await Auth.authFetch(`/api/cart/${cartItemId}`, {
            method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
            showToast("Item removed");
            await loadCart();
        } else {
            showToast(data.error || "Failed to remove item", "error");
        }
    } catch (err) {
        showToast("Failed to remove item", "error");
    }
}

async function handleClearCart() {
    if (!confirm("Remove all items from your cart?")) return;

    try {
        const res = await Auth.authFetch("/api/cart", {
            method: "DELETE",
        });
        const data = await res.json();
        if (data.success) {
            showToast("Cart cleared");
            await loadCart();
        } else {
            showToast(data.error || "Failed to clear cart", "error");
        }
    } catch (err) {
        showToast("Failed to clear cart", "error");
    }
}

// ─── Razorpay Payment Flow ─────────────────────────────────────

async function handleCheckout() {
    const btn = document.getElementById("checkoutBtn");
    const addressEl = document.getElementById("deliveryAddress");
    const address = addressEl ? addressEl.value.trim() : "";

    if (!address) {
        showToast("Please enter a delivery address", "error");
        if (addressEl) addressEl.focus();
        return;
    }

    if (address.length < 10) {
        showToast("Delivery address must be at least 10 characters", "error");
        if (addressEl) addressEl.focus();
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating order...';

    try {
        // Step 1: Create Razorpay order on backend
        const res = await Auth.authFetch("/api/payment/create-order", {
            method: "POST",
            body: JSON.stringify({ delivery_address: address }),
        });
        const result = await res.json();

        if (!result.success) {
            showToast(result.error || "Failed to create payment order", "error");
            resetCheckoutBtn();
            return;
        }

        const orderData = result.data;

        // Show test mode banner if applicable
        if (orderData.test_mode) {
            const banner = document.getElementById("testModeBanner");
            if (banner) banner.style.display = "flex";
        }

        // Step 2: Open Razorpay checkout
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Opening payment...';
        openRazorpayCheckout(orderData, address);
    } catch (err) {
        console.error("Checkout error:", err);
        showToast("Failed to initiate payment: " + err.message, "error");
        resetCheckoutBtn();
    }
}

function openRazorpayCheckout(orderData, deliveryAddress) {
    const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "AgriConnect",
        description: `Payment for ${orderData.item_count} item(s) - ₹${orderData.total.toFixed(2)}`,
        order_id: orderData.razorpay_order_id,
        handler: function (response) {
            // Payment successful on Razorpay side — verify on backend
            verifyPayment(response, deliveryAddress);
        },
        prefill: {
            name: Auth.getUser ? Auth.getUser() : "",
        },
        theme: {
            color: "#5da399",
        },
        modal: {
            ondismiss: function () {
                showToast("Payment cancelled. You can try again anytime.", "error");
                resetCheckoutBtn();
            },
        },
    };

    try {
        const rzp = new Razorpay(options);

        rzp.on("payment.failed", function (response) {
            // Show failure modal with details
            showFailureModal(response.error);
            resetCheckoutBtn();
        });

        rzp.open();
    } catch (err) {
        console.error("Razorpay open error:", err);
        showToast("Failed to open payment window. Please try again.", "error");
        resetCheckoutBtn();
    }
}

// ─── Payment Verification ──────────────────────────────────────

async function verifyPayment(razorpayResponse, deliveryAddress) {
    const btn = document.getElementById("checkoutBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying payment...';

    try {
        const res = await Auth.authFetch("/api/payment/verify", {
            method: "POST",
            body: JSON.stringify({
                razorpay_order_id: razorpayResponse.razorpay_order_id,
                razorpay_payment_id: razorpayResponse.razorpay_payment_id,
                razorpay_signature: razorpayResponse.razorpay_signature,
                delivery_address: deliveryAddress,
            }),
        });
        const data = await res.json();

        if (data.success) {
            showSuccessModal(data);
            await loadCart();
        } else {
            showFailureModal({
                description: data.error || "Payment verification failed on server.",
                reason: "verification_failed",
            });
        }
    } catch (err) {
        console.error("Verify error:", err);
        showFailureModal({
            description: "Could not verify payment with server. If money was deducted, it will be refunded automatically.",
            reason: "network_error",
        });
    } finally {
        resetCheckoutBtn();
    }
}

// ─── Success Modal ─────────────────────────────────────────────

function showSuccessModal(data) {
    const modal = document.getElementById("checkoutModal");
    const detailsEl = document.getElementById("paymentDetails");
    const msgEl = document.getElementById("checkoutMessage");

    // Build payment details
    const payment = data.payment || {};
    const orderCount = data.orderIds ? data.orderIds.length : 0;
    const methodLabel = formatPaymentMethod(payment.method);

    let detailsHtml = `
        <p style="margin:0.3rem 0;"><strong>Amount Paid:</strong> ₹${payment.amount ? payment.amount.toFixed(2) : "N/A"}</p>
        <p style="margin:0.3rem 0;"><strong>Payment Method:</strong> ${escapeHtml(methodLabel)}</p>
        <p style="margin:0.3rem 0;"><strong>Payment ID:</strong> <code style="font-size:0.8rem;background:#e8f5e9;padding:2px 6px;border-radius:4px;">${escapeHtml(payment.id || "N/A")}</code></p>
        <p style="margin:0.3rem 0;"><strong>Orders Created:</strong> ${orderCount}</p>
        <p style="margin:0.3rem 0;"><strong>Status:</strong> <span style="color:#5da399;font-weight:600;">${escapeHtml(payment.status || "paid")}</span></p>
    `;
    detailsEl.innerHTML = detailsHtml;

    // Message
    let message = data.message || `${orderCount} order(s) placed successfully.`;
    if (data.warnings && data.warnings.length > 0) {
        message += " Note: " + data.warnings.join(" ");
    }
    msgEl.textContent = message;

    modal.style.display = "flex";
}

// ─── Failure Modal ─────────────────────────────────────────────

function showFailureModal(error) {
    const modal = document.getElementById("failModal");
    const detailsEl = document.getElementById("failDetails");

    const description = error?.description || "An unknown error occurred during payment.";
    const code = error?.code || error?.reason || "UNKNOWN";
    const source = error?.source || "";
    const step = error?.step || "";

    let detailsHtml = `
        <p style="margin:0.3rem 0;"><strong>Reason:</strong> ${escapeHtml(description)}</p>
        <p style="margin:0.3rem 0;"><strong>Error Code:</strong> <code style="font-size:0.8rem;background:#fce4e4;padding:2px 6px;border-radius:4px;">${escapeHtml(String(code))}</code></p>
    `;
    if (source) {
        detailsHtml += `<p style="margin:0.3rem 0;"><strong>Source:</strong> ${escapeHtml(source)}</p>`;
    }
    if (step) {
        detailsHtml += `<p style="margin:0.3rem 0;"><strong>Failed At:</strong> ${escapeHtml(step)}</p>`;
    }

    detailsEl.innerHTML = detailsHtml;
    modal.style.display = "flex";
}

function closeFailModal() {
    const modal = document.getElementById("failModal");
    if (modal) modal.style.display = "none";
}

// ─── Helpers ───────────────────────────────────────────────────

function formatPaymentMethod(method) {
    if (!method) return "N/A";
    const map = {
        card: "Credit/Debit Card",
        upi: "UPI",
        netbanking: "Net Banking",
        wallet: "Wallet",
        emi: "EMI",
        bank_transfer: "Bank Transfer",
    };
    return map[method] || method.charAt(0).toUpperCase() + method.slice(1);
}

function resetCheckoutBtn() {
    const btn = document.getElementById("checkoutBtn");
    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i> Pay & Place Order';
    }
}

// ─── Init ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadCart();
});
