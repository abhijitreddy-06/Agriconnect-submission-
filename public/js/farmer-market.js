// --- Farmer Market Page ---
let allProducts = [];
let currentCategory = "";
let currentPage = 1;
const PAGE_LIMIT = 20;

async function fetchProducts(category, page) {
  try {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
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

function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
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

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.onclick = () => openModal(product);

    const isOwner = currentUserId && product.farmer_id === currentUserId;
    const categoryBadge = product.category ? `<span class="category-badge">${escapeHtml(product.category)}</span>` : "";

    card.innerHTML = `
      ${categoryBadge}
      <img src="${product.image || ""}" alt="${escapeHtml(product.product_name)}" onerror="this.style.display='none'">
      <h3>${escapeHtml(product.product_name)}</h3>
      <div class="price">${product.currency ?? "\u20b9"}${product.price}</div>
      <div class="reviews">Quality: ${product.quality || "N/A"}</div>
      ${isOwner ? '<button class="delete-product-btn" onclick="event.stopPropagation(); deleteProduct(' + product.id + ', this)"><i class="fas fa-trash-alt"></i> Delete</button>' : ""}
    `;
    marketplace.appendChild(card);
  });
}

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

function openModal(product) {
  const currentUser = typeof Auth !== "undefined" ? Auth.getUser() : null;
  const isOwner = currentUser?.id && product.farmer_id === currentUser.id;

  document.getElementById("modalImage").src = product.image || "";
  document.getElementById("modalName").textContent = product.product_name;
  document.getElementById("modalPrice").textContent = "Price: " + (product.currency ?? "\u20b9") + product.price;
  document.getElementById("modalQuantity").textContent = "Quantity: " + product.quantity + " (" + (product.quantity_unit || "") + ")";
  document.getElementById("modalQuality").textContent = "Quality: " + product.quality;
  document.getElementById("modalDescription").textContent = "Description: " + product.description;
  document.getElementById("modalContact").textContent = "Contact: " + (product.contact_number || "N/A");

  // Show/hide modal delete button
  const modalDeleteBtn = document.getElementById("modalDeleteBtn");
  if (modalDeleteBtn) {
    if (isOwner) {
      modalDeleteBtn.style.display = "inline-flex";
      modalDeleteBtn.onclick = () => deleteProduct(product.id, modalDeleteBtn);
    } else {
      modalDeleteBtn.style.display = "none";
    }
  }

  document.getElementById("productModal").style.display = "block";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

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

function showToast(message, type = "success") {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.style.cssText =
    "position:fixed;bottom:2rem;right:2rem;background:var(--color-primary);color:white;" +
    "padding:0.85rem 1.25rem;border-radius:var(--radius-sm);z-index:3000;" +
    "border-left:4px solid " + (type === "success" ? "var(--color-accent)" : "var(--color-danger)") + ";" +
    "box-shadow:var(--shadow-lg);font-family:Nunito,sans-serif;font-size:0.9rem;" +
    "animation:slideUp 0.3s ease;max-width:320px;";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transition = "opacity 0.3s";
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Category pills + search + init
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
      const query = e.target.value.toLowerCase().trim();
      if (!query) {
        renderProducts(allProducts);
        return;
      }
      const filtered = allProducts.filter((p) => p.product_name.toLowerCase().includes(query));
      renderProducts(filtered);
    });
  }

  fetchProducts(currentCategory, currentPage);
});
