document.addEventListener("DOMContentLoaded", () => {
  const micButton = document.getElementById("micButton");
  const micStatus = document.getElementById("micStatus");
  const descriptionField = document.getElementById("description");
  const imageInput = document.getElementById("imageInput");
  const imagePreview = document.getElementById("imagePreview");
  const uploadForm = document.getElementById("uploadForm");

  // Image preview functionality
  imageInput.addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        imagePreview.src = e.target.result;
        imagePreview.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  });

  // Setup speech-to-text using the Web Speech API
  let recognition;
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    // Update mic status when speech recognition starts
    recognition.addEventListener("start", () => {
      micStatus.innerText = "Listening, please speak...";
    });

    // Clear status when speech recognition ends
    recognition.addEventListener("end", () => {
      micStatus.innerText = "";
    });
  } else {
    micButton.style.display = "none";
  }

  micButton.addEventListener("click", () => {
    if (recognition) {
      recognition.start();
    }
  });

  if (recognition) {
    recognition.addEventListener("result", (e) => {
      const transcript = e.results[0][0].transcript;
      descriptionField.value += transcript;
    });
  }

  // Handle form submission: upload image, description, and language, then analyze
  uploadForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(uploadForm);
    const analysisLoader = document.getElementById("analysis-loader");

    try {
      analysisLoader.style.display = "flex";

      // Upload image with auth
      document.querySelector(".loader-text").textContent =
        "Analyzing plant health...";

      // Upload + analyze in one step
      const response = await Auth.authFetch("/api/predict/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Analysis failed");

      const result = await response.json();

      window.location.href = `/diagnosis?id=${result.predictionId || result.data?.id}`;
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      analysisLoader.style.display = "none";
    }
  });

  // Loader
  setTimeout(() => {
    document.body.classList.add("loaded");
    const loader = document.getElementById("global-loader");
    if (loader) { loader.style.opacity = "0"; setTimeout(() => loader.remove(), 300); }
  }, 500);
});
