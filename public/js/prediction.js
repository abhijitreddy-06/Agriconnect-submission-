// ─── Prediction Results Page (uses Auth) ────────────────────────
document.addEventListener("DOMContentLoaded", async () => {
  const loadingOverlay = document.getElementById("global-loader");
  const analysisResults = document.getElementById("analysisResults");
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (id) {
    try {
      document.body.classList.remove("loaded");
      if (loadingOverlay) loadingOverlay.style.display = "flex";

      const res = await Auth.authFetch(`/api/predict/${id}`);
      const result = await res.json();

      if (result.success) {
        const data = result.data;

        // Try to render as structured diagnosis (new HF format)
        let diagnosis = data.diagnosis;
        let confidence = data.confidence;
        let html = "";

        if (diagnosis && diagnosis !== "Unknown") {
          const pct = confidence != null ? `${(confidence * 100).toFixed(1)}%` : null;
          html = `
            <div class="formatted-content">
              <h2>Diagnosis Results</h2>
              <h3>${diagnosis}</h3>
              ${pct ? `<p class="confidence">Confidence: <strong>${pct}</strong></p>` : ""}
            </div>
          `;
        } else {
          // Fallback: render as markdown (old records)
          const raw = data.details || data.prediction_result || "No analysis available";
          let rendered = "";
          if (typeof marked !== "undefined" && typeof DOMPurify !== "undefined") {
            rendered = DOMPurify.sanitize(marked.parse(raw));
          } else {
            // Fallback: plain text if libraries not loaded
            const div = document.createElement("div");
            div.textContent = raw;
            rendered = div.innerHTML;
          }
          html = `
            <div class="formatted-content">
              <h2>Analysis Results</h2>
              ${rendered}
            </div>
          `;
        }

        analysisResults.innerHTML = html;
      }
    } catch (error) {
      const errorDiv = document.createElement("div");
      errorDiv.className = "error-message";
      const h3 = document.createElement("h3");
      h3.textContent = "Error Loading Analysis";
      const p = document.createElement("p");
      p.textContent = error.message;
      errorDiv.appendChild(h3);
      errorDiv.appendChild(p);
      analysisResults.innerHTML = "";
      analysisResults.appendChild(errorDiv);
    } finally {
      if (loadingOverlay) loadingOverlay.style.display = "none";
      document.body.classList.add("loaded");
    }
  }

  const newPredBtn = document.getElementById("newPrediction");
  if (newPredBtn) {
    newPredBtn.addEventListener("click", () => {
      window.location.href = "/plant-health";
    });
  }
});
