// ─── Plant Health Upload Page ────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  const uploadForm = document.getElementById("uploadForm");
  const imageInput = document.getElementById("imageInput");
  const dropZone = document.getElementById("dropZone");
  const previewSection = document.getElementById("previewSection");
  const imagePreview = document.getElementById("imagePreview");
  const removePreview = document.getElementById("removePreview");
  const submitBtn = document.getElementById("submitBtn");
  const analysisLoader = document.getElementById("analysis-loader");

  // Image preview on file select
  imageInput.addEventListener("change", () => {
    if (imageInput.files && imageInput.files[0]) {
      showPreview(imageInput.files[0]);
    }
  });

  // Drag & drop support
  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("drag-over");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("drag-over");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      // Create a new DataTransfer to set files on input
      const dt = new DataTransfer();
      dt.items.add(file);
      imageInput.files = dt.files;
      showPreview(file);
    }
  });

  // Remove preview
  removePreview.addEventListener("click", () => {
    imageInput.value = "";
    previewSection.style.display = "none";
    dropZone.style.display = "flex";
    submitBtn.disabled = true;
  });

  function showPreview(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      imagePreview.src = e.target.result;
      previewSection.style.display = "block";
      dropZone.style.display = "none";
      submitBtn.disabled = false;
    };
    reader.readAsDataURL(file);
  }

  // Form submission
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!imageInput.files || !imageInput.files[0]) {
      alert("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("imageInput", imageInput.files[0]);

    try {
      analysisLoader.style.display = "flex";
      submitBtn.disabled = true;

      const response = await Auth.authFetch("/api/predict/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Analysis failed");
      }

      const result = await response.json();
      window.location.href = `/diagnosis?id=${result.predictionId || result.data?.id}`;
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
      submitBtn.disabled = false;
    } finally {
      analysisLoader.style.display = "none";
    }
  });

  // Page loader
  setTimeout(() => {
    document.body.classList.add("loaded");
    const loader = document.getElementById("global-loader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 300);
    }
  }, 500);
});
