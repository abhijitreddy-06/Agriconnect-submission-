// ─── My Products (Farmer product management) ─────────────────────
let myProducts = [];
let editingProductId = null;

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

// ─── Fetch & Render ──────────────────────────────────────────────

async function fetchMyProducts() {
  const container = document.getElementById("productsContainer");
  const countEl = document.getElementById("productCount");

  try {
    const user = Auth.getUser();
    if (!user) {
      window.location.href = "/login/farmer";
      return;
    }

    const res = await Auth.authFetch("/api/products?farmer_id=" + user.id + "&limit=100");
    const result = await res.json();

    if (!result.success) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i>Failed to load products.</div>';
      return;
    }

    myProducts = result.data || [];
    countEl.textContent = myProducts.length + " product" + (myProducts.length !== 1 ? "s" : "");

    if (myProducts.length === 0) {
      container.innerHTML = '<div class="empty-state"><i class="fas fa-seedling"></i>You haven\'t listed any products yet.<br><a href="/sell">List your first product</a></div>';
      return;
    }

    container.innerHTML = myProducts.map((p) => `
      <div class="product-row" data-id="${p.id}">
        <img class="product-row-img" src="${p.image || ""}" alt="${escapeHtml(p.product_name)}" onerror="this.src='/images/placeholder.svg';this.onerror=null;">
        <div class="product-row-body">
          <div class="product-row-header">
            <span class="product-row-name">${escapeHtml(p.product_name)}</span>
            ${p.category ? '<span class="product-row-badge">' + escapeHtml(p.category) + '</span>' : ''}
          </div>
          <div class="product-row-meta">
            <span class="price-tag">\u20b9${p.price}</span>
            <span><i class="fas fa-cubes"></i> ${p.quantity} ${p.quantity_unit || ""}</span>
            <span><i class="fas fa-star"></i> ${p.quality || "N/A"}</span>
          </div>
          ${p.description ? '<div class="product-row-desc">' + escapeHtml(p.description) + '</div>' : ''}
          <div class="product-row-actions">
            <button class="btn-edit" onclick="openEditModal(${p.id})"><i class="fas fa-pen"></i> Edit</button>
            <button class="btn-delete" onclick="deleteProduct(${p.id}, this)"><i class="fas fa-trash-alt"></i> Delete</button>
          </div>
        </div>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i>Error loading products.</div>';
    console.error("Fetch error:", err);
  }
}

// ─── Delete ──────────────────────────────────────────────────────

async function deleteProduct(productId, btnEl) {
  if (!confirm("Are you sure you want to delete this product? This cannot be undone.")) return;

  if (btnEl) {
    btnEl.disabled = true;
    btnEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Deleting...';
  }

  try {
    const res = await Auth.authFetch("/api/products/" + productId, { method: "DELETE" });
    const data = await res.json();

    if (data.success) {
      showToast("Product deleted.");
      fetchMyProducts();
    } else {
      showToast(data.error || "Failed to delete.", "error");
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

// ─── Edit Modal ──────────────────────────────────────────────────

function openEditModal(productId) {
  const product = myProducts.find((p) => p.id === productId);
  if (!product) return;

  editingProductId = productId;

  document.getElementById("editName").value = product.product_name || "";
  document.getElementById("editCategory").value = product.category || "Vegetables";
  document.getElementById("editPrice").value = product.price || "";
  document.getElementById("editQuantity").value = product.quantity || "";
  document.getElementById("editQuality").value = product.quality || "Standard";
  document.getElementById("editUnit").value = product.quantity_unit || "kilogram";
  document.getElementById("editDescription").value = product.description || "";
  document.getElementById("editImage").value = "";

  document.getElementById("editModal").classList.add("show");
}

function closeEditModal() {
  document.getElementById("editModal").classList.remove("show");
  editingProductId = null;
}

async function saveEdit() {
  if (!editingProductId) return;

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving...";

  try {
    const formData = new FormData();
    formData.append("product_name", document.getElementById("editName").value.trim());
    formData.append("category", document.getElementById("editCategory").value);
    formData.append("price", document.getElementById("editPrice").value);
    formData.append("quantity", document.getElementById("editQuantity").value);
    formData.append("quality", document.getElementById("editQuality").value);
    formData.append("quantity_unit", document.getElementById("editUnit").value);
    formData.append("description", document.getElementById("editDescription").value.trim());

    const imageFile = document.getElementById("editImage").files[0];
    if (imageFile) {
      formData.append("productImage", imageFile);
    }

    const res = await Auth.authFetch("/api/products/" + editingProductId, {
      method: "PUT",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      showToast("Product updated.");
      closeEditModal();
      fetchMyProducts();
    } else {
      showToast(data.error || "Failed to update.", "error");
    }
  } catch (err) {
    showToast("Error: " + err.message, "error");
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Changes";
  }
}

// ─── Init ────────────────────────────────────────────────────────

document.addEventListener("DOMContentLoaded", () => {
  if (!Auth.isLoggedIn() || Auth.getRole() !== "farmer") {
    window.location.href = "/login/farmer";
    return;
  }

  fetchMyProducts();

  document.getElementById("editForm").addEventListener("submit", (e) => {
    e.preventDefault();
    saveEdit();
  });

  // Close modal on overlay click
  document.getElementById("editModal").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) closeEditModal();
  });
});
