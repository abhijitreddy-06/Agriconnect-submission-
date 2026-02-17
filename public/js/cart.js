// ─── Cart Page JS ───────────────────────────────────────────────

// ─── UI Helpers ─────────────────────────────────────────────────
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
if (hamburger) hamburger.addEventListener("click", () => navLinks.classList.toggle("active"));

function showToast(message, type = "success") {
    const existing = document.querySelector(".toast");
    if (existing) existing.remove();

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === "success" ? "fa-check-circle" : "fa-exclamation-circle"}"></i> ${message}`;
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
        src="${item.image || "/images/placeholder.png"}"
        alt="${item.product_name}"
        onerror="this.src='/images/indian-farmer.avif'"
      />
      <div class="cart-item-details">
        <h3>${item.product_name}</h3>
        <p class="farmer-name">Sold by: ${item.farmer_name || "Farmer"}</p>
        <p class="item-price">₹${parseFloat(item.price).toFixed(2)} / ${item.quantity_unit || "unit"}</p>
        <p class="item-subtotal">Subtotal: ₹${item.subtotal.toFixed(2)}</p>
      </div>
      <div class="cart-item-actions">
        <div class="quantity-controls">
          <button onclick="changeQuantity(${item.id}, ${parseFloat(item.quantity) - 1})">−</button>
          <span class="qty-value">${parseFloat(item.quantity)}</span>
          <button onclick="changeQuantity(${item.id}, ${parseFloat(item.quantity) + 1})">+</button>
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

async function handleCheckout() {
    const btn = document.getElementById("checkoutBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        const res = await Auth.authFetch("/api/cart/checkout", {
            method: "POST",
        });
        const data = await res.json();

        if (data.success) {
            // Show success modal
            const modal = document.getElementById("checkoutModal");
            const msg = document.getElementById("checkoutMessage");
            msg.textContent = data.message + (data.warnings ? " Note: " + data.warnings.join(" ") : "");
            modal.style.display = "flex";

            // Reload cart (should be empty now)
            await loadCart();
        } else {
            showToast(data.error || "Checkout failed", "error");
        }
    } catch (err) {
        showToast("Checkout failed: " + err.message, "error");
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-lock"></i> Proceed to Checkout';
    }
}

// ─── Init ───────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    loadCart();
});

// Loader
document.addEventListener("readystatechange", () => {
    if (document.readyState === "complete") {
        document.body.classList.add("loaded");
        const loader = document.getElementById("global-loader");
        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => loader.remove(), 300);
        }
    }
});
