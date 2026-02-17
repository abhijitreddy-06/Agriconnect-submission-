// ─── Farmer Market Page ─────────────────────────────────────────
let allProducts = [];

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
    `;
    marketplace.appendChild(card);
  });
}

function openModal(product) {
  document.getElementById("modalImage").src = product.image;
  document.getElementById("modalName").textContent = product.product_name;
  document.getElementById("modalPrice").textContent = "Price: " + (product.currency ?? "₹") + product.price;
  document.getElementById("modalQuantity").textContent = "Quantity: " + product.quantity + " (" + (product.quantity_unit || "") + ")";
  document.getElementById("modalQuality").textContent = "Quality: " + product.quality;
  document.getElementById("modalDescription").textContent = "Description: " + product.description;
  document.getElementById("modalContact").textContent = "Contact: " + (product.contact_number || "N/A");
  document.getElementById("productModal").style.display = "block";
}

function closeModal() {
  document.getElementById("productModal").style.display = "none";
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
