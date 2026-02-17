// --- Farmer Market Page ---
let allProducts = [];

async function fetchProducts() {
  try {
    const res = await fetch("/api/products");
    const result = await res.json();
    allProducts = result.data || result;
    renderProducts(allProducts);
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

  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";
    card.onclick = () => openModal(product);

    const isOwner = currentUserId && product.farmer_id === currentUserId;

    card.innerHTML = `
      <img src="${product.image || ""}" alt="${product.product_name}" onerror="this.style.display='none'">
      <h3>${product.product_name}</h3>
      <div class="price">${product.currency ?? "\u20b9"}${product.price}</div>
      <div class="reviews">Quality: ${product.quality || "N/A"}</div>
      ${isOwner ? '<button class="delete-product-btn" onclick="event.stopPropagation(); deleteProduct(' + product.id + ', this)"><i class="fas fa-trash-alt"></i> Delete</button>' : ""}
    `;
    marketplace.appendChild(card);
  });
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
      fetchProducts();
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

// Search filter
document.addEventListener("DOMContentLoaded", () => {
  fetchProducts();
  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase().trim();
      const filtered = allProducts.filter((p) => p.product_name.toLowerCase().includes(query));
      renderProducts(filtered);
    });
  }
});
