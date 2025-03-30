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
      // Show loader
      analysisLoader.style.display = "flex";

      // Upload image
      const response = await fetch("/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const result = await response.json();

      // Show analyzing status
      document.querySelector(".loader-text").textContent =
        "Analyzing with Gemini AI...";

      // Analyze image
      const analysisResponse = await fetch("/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictionId: result.predictionId }),
      });

      if (!analysisResponse.ok) throw new Error("Analysis failed");

      // Redirect to results
      window.location.href = `/predict?id=${result.predictionId}`;
    } catch (error) {
      console.error("Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      // Hide loader
      analysisLoader.style.display = "none";
    }
  });
  // In your existing loader script
  setTimeout(() => {
    document.body.classList.add("loaded");
    document.getElementById("global-loader").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("global-loader").remove();
    }, 300);
  }, 500); // Add 500ms delay here
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
