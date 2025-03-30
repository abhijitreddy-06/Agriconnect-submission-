// Function to fetch products from the API
async function fetchProducts() {
  try {
    const res = await fetch("/api/products");
    const products = await res.json();
    renderProducts(products);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

// Function to render products in the marketplace container
function renderProducts(products) {
  const marketplace = document.getElementById("marketplace");
  marketplace.innerHTML = "";
  if (!products || products.length === 0) {
    marketplace.innerHTML = "<p>No products available.</p>";
    return;
  }

  // Loop through each product and create a product card
  products.forEach((product) => {
    const card = document.createElement("div");
    card.className = "product-card";

    // Clicking the card opens a modal with full product details.
    card.onclick = () => openModal(product);

    // Some DB fields might be named differently, ensure you match them exactly
    card.innerHTML = `
          <img src="${product.image}" alt="${product.product_name}">
          <h3>${product.product_name}</h3>
          <div class="price">${product.currency ?? "₹"}${product.price}</div>
          <div class="reviews">Quality: ${product.quality}</div>
          <button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${
            product.product_name
          }')">Add to Cart</button>
        `;
    marketplace.appendChild(card);
  });
}

// Function to open the modal and populate it with product details
function openModal(product) {
  document.getElementById("modalImage").src = product.image;
  document.getElementById("modalName").textContent = product.product_name;
  document.getElementById("modalPrice").textContent =
    "Price: " + (product.currency ?? "₹") + product.price;
  document.getElementById("modalQuantity").textContent =
    "Quantity: " +
    product.quantity +
    " (" +
    (product.quantity_unit || "") +
    ")";
  document.getElementById("modalQuality").textContent =
    "Quality: " + product.quality;
  document.getElementById("modalDescription").textContent =
    "Description: " + product.description;
  document.getElementById("modalContact").textContent =
    "Contact: " + product.contact_number;
  document.getElementById("productModal").style.display = "block";
}

// Function to close the modal
function closeModal() {
  document.getElementById("productModal").style.display = "none";
}

// Function to add a product to the cart
function addToCart(productName) {
  alert(`Added ${productName} to cart!`);
  // Here, add actual cart logic if needed.
}

// Fetch products once the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", fetchProducts);

// Show loader immediately
document.addEventListener("readystatechange", () => {
  if (document.readyState === "complete") {
    document.body.classList.add("loaded");
    document.getElementById("global-loader").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("global-loader").remove();
    }, 300);
  }
});

// Handle page transitions
document.addEventListener("DOMContentLoaded", () => {
  // Show loader before unload
  window.addEventListener("beforeunload", () => {
    document.body.classList.remove("loaded");
    document.getElementById("global-loader").style.opacity = "1";
  });

  // Fade in content after load
  setTimeout(() => {
    document.body.classList.add("loaded");
    document.getElementById("global-loader").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("global-loader").remove();
    }, 300);
  }, 300);
});

// Fallback for slow connections
window.onload = function () {
  document.body.classList.add("loaded");
  document.getElementById("global-loader").style.opacity = "0";
  setTimeout(() => {
    document.getElementById("global-loader").remove();
  }, 300);
};

// Navbar hamburger menu toggle
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// Function to toggle dropdown menus
function toggleDropdown(button) {
  const dropdownContent =
    button.parentElement.querySelector(".dropdown-content");
  dropdownContent.style.display =
    dropdownContent.style.display === "block" ? "none" : "block";
}

// Close the dropdown if the user clicks outside
window.onclick = function (event) {
  if (!event.target.matches(".dropbtn")) {
    const dropdowns = document.querySelectorAll(".dropdown-content");
    dropdowns.forEach((dropdown) => {
      if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
      }
    });
  }
};

let allProducts = [];

// Fetch all products when the page loads
async function fetchProducts() {
  try {
    const res = await fetch("/api/products");
    allProducts = await res.json();
    renderProducts(allProducts);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

// Function to render products into the marketplace container
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
    card.onclick = () => openModal(product); // Assume you have this function defined
    card.innerHTML = `
<img src="${product.image}" alt="${product.product_name}">
<h3>${product.product_name}</h3>
<div class="price">${product.currency ?? "₹"}${product.price}</div>
<div class="reviews">Quality: ${product.quality}</div>
<button class="add-to-cart-btn" onclick="event.stopPropagation(); addToCart('${
      product.product_name
    }')">Add to Cart</button>
`;
    marketplace.appendChild(card);
  });
}

// Listen for input in the search bar to filter products
document.getElementById("searchInput").addEventListener("input", (e) => {
  const query = e.target.value.toLowerCase().trim();
  const filteredProducts = allProducts.filter((product) =>
    product.product_name.toLowerCase().includes(query)
  );
  renderProducts(filteredProducts);
});

// Call fetchProducts on DOM content load
document.addEventListener("DOMContentLoaded", fetchProducts);
