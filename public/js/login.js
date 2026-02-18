// ─── Login (shared — auto-detects role from URL) ─────────────────
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".login-form");
  if (!form) return;

  // Password visibility toggle
  const togglePassword = document.getElementById("togglePassword");
  const passwordInput = document.getElementById("password");
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      togglePassword.classList.toggle("fa-eye-slash", !isPassword);
      togglePassword.classList.toggle("fa-eye", isPassword);
    });
  }

  const role = window.location.pathname.includes("/customer") ? "customer" : "farmer";

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
      const result = await Auth.login(phone, password, role);
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
