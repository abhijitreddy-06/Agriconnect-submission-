// ─── Prediction Results Page (uses Auth) ────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const loadingOverlay = document.getElementById("global-loader");
  const analysisResults = document.getElementById("analysisResults");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    try {
      if (loadingOverlay) loadingOverlay.style.display = "flex";

      const res = await Auth.authFetch(`/prediction/${id}`);
      const result = await res.json();

      if (result.success) {
        const rawContent = result.data.gemini_details || "No analysis available";
        const formattedHtml = DOMPurify.sanitize(marked.parse(rawContent));
        analysisResults.innerHTML = `
          <div class="formatted-content">
            <h2>${result.data.gemini_title || "Analysis Results"}</h2>
            ${formattedHtml}
          </div>
        `;
      }
    } catch (error) {
      analysisResults.innerHTML = `
        <div class="error-message">
          <h3>Error Loading Analysis</h3>
          <p>${error.message}</p>
        </div>
      `;
    } finally {
      if (loadingOverlay) loadingOverlay.style.display = "none";
    }
  }

  const newPredBtn = document.getElementById("newPrediction");
  if (newPredBtn) {
    newPredBtn.addEventListener("click", () => {
      window.location.href = "/upload";
    });
  }
});

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
