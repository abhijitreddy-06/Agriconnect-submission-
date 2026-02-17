// ─── Customer Login (AJAX) ─────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const phone = form.querySelector('[name="phone"]').value.trim();
    const password = form.querySelector('[name="password"]').value;

    if (!phone || !password) {
      showError("Please fill in all fields.");
      return;
    }

    if (!/^\d{10}$/.test(phone)) {
      showError("Phone number must be exactly 10 digits.");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const result = await Auth.login(phone, password, "customer");
      if (!result.success) {
        showError(result.error || "Login failed. Please try again.");
      }
    } catch (err) {
      showError("Network error. Please try again.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
});

function showError(message) {
  let errorEl = document.querySelector(".auth-error");
  if (!errorEl) {
    errorEl = document.createElement("div");
    errorEl.className = "auth-error";
    errorEl.style.cssText = "color:#e74c3c;background:#fdf0ef;padding:10px 14px;border-radius:8px;margin-bottom:12px;font-size:14px;text-align:center;";
    const form = document.querySelector(".login-form");
    form.insertBefore(errorEl, form.firstChild);
  }
  errorEl.textContent = message;
  errorEl.style.display = "block";
  setTimeout(() => { errorEl.style.display = "none"; }, 5000);
}

// ─── UI Helpers ────────────────────────────────────────────────
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
if (hamburger) hamburger.addEventListener("click", () => navLinks.classList.toggle("active"));

function toggleDropdown(button) {
  const dc = button.parentElement.querySelector(".dropdown-content");
  dc.style.display = dc.style.display === "block" ? "none" : "block";
}

window.onclick = function (event) {
  if (!event.target.matches(".dropbtn")) {
    document.querySelectorAll(".dropdown-content").forEach((d) => { if (d.style.display === "block") d.style.display = "none"; });
  }
};

document.addEventListener("readystatechange", () => {
  if (document.readyState === "complete") {
    document.body.classList.add("loaded");
    const loader = document.getElementById("global-loader");
    if (loader) { loader.style.opacity = "0"; setTimeout(() => loader.remove(), 300); }
  }
});
