// ─── Customer Market Page ───────────────────────────────────────
let allProducts = [];
let currentModalProduct = null;

// Toast notification
function showToast(message, type = "success") {
  const existing = document.querySelector(".toast-notification");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast-notification";
  toast.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem; padding: 1rem 1.5rem;
    background: #1a2d40; color: white; border-radius: 8px; z-index: 3000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: Nunito, sans-serif;
    border-left: 4px solid ${type === "success" ? "#5da399" : "#e74c3c"};
    animation: slideUp 0.3s ease;
  `;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => { toast.style.opacity = "0"; setTimeout(() => toast.remove(), 300); }, 2500);
}

async function fetchProducts() {
  try {
    const res = await fetch("/api/products");
    const result = await res.json();
    allProducts = result.data || result;
    renderProducts(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

function renderProducts(products) {
  const marketplace = document.getElementById("marketplace");
  marketplace.innerHTML = "";
  if (!products || products.length === 0) {
    marketplace.innerHTML = "<p>No products available.</p>";
    return;
  }
  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.onclick = () => openModal(product);
    card.innerHTML = `
      <img src="${product.image}" alt="${product.product_name}" onerror="this.src='/images/indian-farmer.avif'">
      <h3>${product.product_name}</h3>
      <div class="price">${product.currency ?? "₹"}${product.price}</div>
      <div class="reviews">Quality: ${product.quality || "N/A"}</div>
      <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(${product.id}, 1, this)">
        <i class="fas fa-cart-plus"></i> Add to Cart
      </button>
    `;
    marketplace.appendChild(card);
  });
}

function openModal(product) {
  currentModalProduct = product;
  document.getElementById("modalImage").src = product.image;
  document.getElementById("modalName").textContent = product.product_name;
  document.getElementById("modalPrice").textContent = "Price: " + (product.currency ?? "₹") + product.price + " / " + (product.quantity_unit || "unit");
  document.getElementById("modalQuantity").textContent = "Available: " + product.quantity + " " + (product.quantity_unit || "");
  document.getElementById("modalQuality").textContent = "Quality: " + (product.quality || "N/A");
  document.getElementById("modalDescription").textContent = "Description: " + (product.description || "No description");

  // Reset quantity input
  const qtyInput = document.getElementById("modalQtyInput");
  if (qtyInput) qtyInput.value = 1;

  document.getElementById("productModal").style.display = "block";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
  currentModalProduct = null;
}

async function addToCart(productId, quantity, btnEl) {
  if (!Auth.isLoggedIn()) {
    window.location.href = "/login/customer";
    return;
  }

  // Disable button briefly
  if (btnEl) {
    btnEl.disabled = true;
    const origHTML = btnEl.innerHTML;
    btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';

    try {
      const res = await Auth.authFetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, quantity }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Added to cart!");
        updateCartBadge();
      } else {
        showToast(data.error || "Failed to add to cart", "error");
      }
    } catch (err) {
      showToast("Failed to add to cart", "error");
    } finally {
      btnEl.disabled = false;
      btnEl.innerHTML = origHTML;
    }
  }
}

async function addModalToCart() {
  if (!currentModalProduct) return;
  const qtyInput = document.getElementById("modalQtyInput");
  const qty = parseFloat(qtyInput?.value) || 1;
  const btn = document.getElementById("modalAddBtn");
  if (btn) await addToCart(currentModalProduct.id, qty, btn);
}

// Cart badge - show item count in nav
async function updateCartBadge() {
  try {
    const res = await Auth.authFetch("/api/cart");
    const result = await res.json();
    if (result.success) {
      const count = result.data.itemCount || 0;
      let badge = document.getElementById("cartBadge");
      if (!badge) {
        // Find the "My Cart" or cart link in nav
        const cartLink = document.querySelector('a[href="/cart"]');
        if (cartLink) {
          badge = document.createElement("span");
          badge.id = "cartBadge";
          badge.style.cssText = "background:#ff7e67;color:white;border-radius:50%;padding:0.1rem 0.45rem;font-size:0.75rem;margin-left:0.3rem;font-weight:700;";
          cartLink.appendChild(badge);
        }
      }
      if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? "inline" : "none";
      }
    }
  } catch {
    // Non-critical
  }
}

// Search filter
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  if (Auth.isLoggedIn()) updateCartBadge();
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = allProducts.filter((p) => p.product_name.toLowerCase().includes(query));
      renderProducts(filtered);
    });
  }
});
