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
      const response = await Auth.authFetch("/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();

      document.querySelector(".loader-text").textContent =
        "Analyzing with Gemini AI...";

      // Analyze image with auth
      const analysisResponse = await Auth.authFetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictionId: result.predictionId }),
      });

      if (!analysisResponse.ok) throw new Error("Analysis failed");

      window.location.href = `/predict?id=${result.predictionId}`;
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
