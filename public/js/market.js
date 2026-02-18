// ─── Marketplace (shared — detects role from Auth / DOM elements) ───
let allProducts = [];
let currentModalProduct = null;
let currentCategory = "";
let currentPage = 1;
const PAGE_LIMIT = window.innerWidth <= 768 ? 6 : 20;

function getUserRole() {
  const user = typeof Auth !== "undefined" ? Auth.getUser() : null;
  return user?.role || (window.location.pathname.includes("/customer") ? "customer" : "farmer");
}

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function showToast(message, type = "success") {
  const existing = document.querySelector(".toast, .toast-notification");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.cssText =
    "position:fixed;bottom:2rem;right:2rem;background:#1a2d40;color:white;" +
    "padding:0.85rem 1.25rem;border-radius:8px;z-index:3000;" +
    "border-left:4px solid " + (type === "success" ? "#5da399" : "#e74c3c") + ";" +
    "box-shadow:0 4px 12px rgba(0,0,0,0.2);font-family:Nunito,sans-serif;font-size:0.9rem;" +
    "animation:slideUp 0.3s ease;max-width:320px;";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── Fetch & Render ─────────────────────────────────────────────

async function fetchProducts(category, page, search) {
  try {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    params.set("page", page || 1);
    params.set("limit", PAGE_LIMIT);

    const res = await fetch("/api/products?" + params.toString());
    const result = await res.json();
    allProducts = result.data || [];
    renderProducts(allProducts);
    renderPagination(result);
  } catch (error) {
    console.error("Error fetching products:", error);
    const marketplace = document.getElementById("marketplace");
    if (marketplace) marketplace.innerHTML = '<p class="empty-state">Failed to load products.</p>';
  }
}

function renderProducts(products) {
  const marketplace = document.getElementById("marketplace");
  marketplace.innerHTML = "";
  if (!products || products.length === 0) {
    marketplace.innerHTML = '<p class="empty-state">No products available.</p>';
    return;
  }

  const currentUser = typeof Auth !== "undefined" ? Auth.getUser() : null;
  const currentUserId = currentUser?.id;
  const role = getUserRole();

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.onclick = () => openModal(product);

    const isOwner = currentUserId && product.farmer_id === currentUserId;
    const categoryBadge = product.category ? `<span class="category-badge">${escapeHtml(product.category)}</span>` : "";

    let actionBtn = "";
    if (role === "farmer" && isOwner) {
      actionBtn = '<button class="delete-product-btn" onclick="event.stopPropagation(); deleteProduct(' + product.id + ', this)"><i class="fas fa-trash-alt"></i> Delete</button>';
    } else if (role === "customer") {
      actionBtn = '<button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart(' + product.id + ', 1, this)"><i class="fas fa-cart-plus"></i> Add to Cart</button>';
    }

    card.innerHTML = `
      ${categoryBadge}
      <img src="${product.image || ""}" alt="${escapeHtml(product.product_name)}" onerror="this.src='/images/placeholder.svg'; this.onerror=null;">
      <h3>${escapeHtml(product.product_name)}</h3>
      <div class="price">${product.currency ?? "\u20b9"}${product.price}</div>
      <div class="reviews">Quality: ${product.quality || "N/A"}</div>
      ${actionBtn}
    `;
    marketplace.appendChild(card);
  });
}

// ─── Pagination ─────────────────────────────────────────────────

function renderPagination(result) {
  const container = document.getElementById("pagination");
  if (!container) return;
  const { page, totalPages } = result;
  if (!totalPages || totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";
  html += `<button class="page-btn" ${page <= 1 ? "disabled" : ""} onclick="goToPage(${page - 1})"><i class="fas fa-chevron-left"></i></button>`;

  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);

  if (start > 1) {
    html += `<button class="page-btn" onclick="goToPage(1)">1</button>`;
    if (start > 2) html += `<span class="page-ellipsis">...</span>`;
  }

  for (let i = start; i <= end; i++) {
    html += `<button class="page-btn ${i === page ? "active" : ""}" onclick="goToPage(${i})">${i}</button>`;
  }

  if (end < totalPages) {
    if (end < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
    html += `<button class="page-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;
  }

  html += `<button class="page-btn" ${page >= totalPages ? "disabled" : ""} onclick="goToPage(${page + 1})"><i class="fas fa-chevron-right"></i></button>`;
  container.innerHTML = html;
}

function goToPage(page) {
  currentPage = page;
  fetchProducts(currentCategory, currentPage);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ─── Modal ──────────────────────────────────────────────────────

function openModal(product) {
  currentModalProduct = product;
  const currentUser = typeof Auth !== "undefined" ? Auth.getUser() : null;
  const isOwner = currentUser?.id && product.farmer_id === currentUser.id;

  document.getElementById("modalImage").src = product.image || "";
  document.getElementById("modalName").textContent = product.product_name;
  document.getElementById("modalPrice").textContent = "Price: " + (product.currency ?? "\u20b9") + product.price + (document.getElementById("modalQtyInput") ? " / " + (product.quantity_unit || "unit") : "");
  document.getElementById("modalQuantity").textContent = (document.getElementById("modalQtyInput") ? "Available: " : "Quantity: ") + product.quantity + " " + (product.quantity_unit || "");
  document.getElementById("modalQuality").textContent = "Quality: " + (product.quality || "N/A");
  document.getElementById("modalDescription").textContent = "Description: " + (product.description || "No description");

  // Farmer modal: contact info + delete button
  const modalContact = document.getElementById("modalContact");
  if (modalContact) modalContact.textContent = "Contact: " + (product.contact_number || "N/A");

  const modalDeleteBtn = document.getElementById("modalDeleteBtn");
  if (modalDeleteBtn) {
    if (isOwner) {
      modalDeleteBtn.style.display = "inline-flex";
      modalDeleteBtn.onclick = () => deleteProduct(product.id, modalDeleteBtn);
    } else {
      modalDeleteBtn.style.display = "none";
    }
  }

  // Customer modal: reset quantity input
  const qtyInput = document.getElementById("modalQtyInput");
  if (qtyInput) qtyInput.value = 1;

  document.getElementById("productModal").style.display = "block";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
  currentModalProduct = null;
}

// ─── Farmer: Delete Product ─────────────────────────────────────

async function deleteProduct(productId, btnEl) {
  if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;

  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
  }

  try {
    const res = await Auth.authFetch("/api/products/" + productId, {
      method: "DELETE",
    });
    const data = await res.json();

    if (data.success) {
      showToast("Product deleted successfully.");
      closeModal();
      fetchProducts(currentCategory, currentPage);
    } else {
      showToast(data.error || "Failed to delete product.", "error");
    }
  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    if (btnEl) {
      btnEl.disabled = false;
      btnEl.innerHTML = '<i class="fas fa-trash-alt"></i> Delete';
    }
  }
}

// ─── Customer: Add to Cart ──────────────────────────────────────

async function addToCart(productId, quantity, btnEl) {
  if (!Auth.isLoggedIn()) {
    window.location.href = "/login/customer";
    return;
  }

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
  const qty = Math.max(1, Math.min(9999, parseFloat(qtyInput?.value) || 1));
  const btn = document.getElementById("modalAddBtn");
  if (btn) await addToCart(currentModalProduct.id, qty, btn);
}

async function updateCartBadge() {
  try {
    const res = await Auth.authFetch("/api/cart");
    const result = await res.json();
    if (result.success) {
      const count = result.data.itemCount || 0;
      let badge = document.getElementById("cartBadge");
      if (!badge) {
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

// ─── Init ───────────────────────────────────────────────────────

let searchDebounceTimer = null;
document.addEventListener("DOMContentLoaded", () => {
  const filtersEl = document.getElementById("categoryFilters");
  if (filtersEl) {
    filtersEl.addEventListener("click", (e) => {
      const pill = e.target.closest(".category-pill");
      if (!pill) return;
      filtersEl.querySelectorAll(".category-pill").forEach((p) => p.classList.remove("active"));
      pill.classList.add("active");
      currentCategory = pill.dataset.category || "";
      currentPage = 1;
      fetchProducts(currentCategory, currentPage);
    });
  }

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => {
        currentPage = 1;
        fetchProducts(currentCategory, currentPage, e.target.value.trim());
      }, 300);
    });
  }

  fetchProducts(currentCategory, currentPage);
  if (getUserRole() === "customer" && typeof Auth !== "undefined" && Auth.isLoggedIn()) {
    updateCartBadge();
  }
});
