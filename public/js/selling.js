// ─── Sell Product Form (AJAX with Auth) ─────────────────────────






// Unit toggle buttons
document.querySelectorAll(".unit-toggle").forEach((group) => {
  group.querySelectorAll(".toggle-btn").forEach((button) => {
    button.addEventListener("click", () => {
      group.querySelectorAll(".toggle-btn").forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      const formGroup = button.closest(".form-group");
      if (formGroup.querySelector("#productPrice")) {
        document.getElementById("priceCurrency").value = button.dataset.unit;
      } else if (formGroup.querySelector("#productQuantity")) {
        document.getElementById("quantityUnit").value = button.dataset.unit;
      }
    });
  });
});

// Form submission with Auth
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("productForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("product_name", form.querySelector("#productName")?.value || form.querySelector('[name="productName"]')?.value || "");
    formData.append("price", form.querySelector("#productPrice")?.value || form.querySelector('[name="productPrice"]')?.value || "");
    formData.append("quantity", form.querySelector("#productQuantity")?.value || form.querySelector('[name="productQuantity"]')?.value || "");
    formData.append("quality", form.querySelector("#productQuality")?.value || form.querySelector('[name="productQuality"]')?.value || "");
    formData.append("description", form.querySelector("#productDescription")?.value || form.querySelector('[name="productDescription"]')?.value || "");
    formData.append("quantity_unit", document.getElementById("quantityUnit")?.value || "kilogram");
    formData.append("category", form.querySelector("#productCategory")?.value || "");

    const imageInput = form.querySelector("#productImage") || form.querySelector('[name="productImage"]');
    if (imageInput && imageInput.files[0]) {
      formData.append("productImage", imageInput.files[0]);
    }

    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Uploading...";
    }

    try {
      const res = await Auth.authFetch("/api/products", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        alert("Product listed successfully!");
        window.location.href = "/marketplace/farmer";
      } else {
        alert(data.error || "Failed to list product.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "List Product";
      }
    }
  });
});

// Loader
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    document.body.classList.add("loaded");
    const loader = document.getElementById("global-loader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 300);
    }
  }, 500);
});
