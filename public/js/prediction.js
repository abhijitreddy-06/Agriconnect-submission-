document.addEventListener("DOMContentLoaded", async () => {
  const loadingOverlay = document.getElementById("global-loader");
  const analysisResults = document.getElementById("analysisResults");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    try {
      loadingOverlay.style.display = "flex";

      const res = await fetch(`/prediction/${id}`);
      const result = await res.json();

      if (result.success) {
        const rawContent =
          result.data.gemini_details || "No analysis available";

        // Convert markdown to HTML
        const formattedHtml = DOMPurify.sanitize(marked.parse(rawContent));

        // Create structured HTML
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
            <h3>⚠️ Error Loading Analysis</h3>
            <p>${error.message}</p>
          </div>
        `;
    } finally {
      loadingOverlay.style.display = "none";
    }
  }

  document.getElementById("newPrediction").addEventListener("click", () => {
    window.location.href = "/upload";
  });
});

const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});
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
