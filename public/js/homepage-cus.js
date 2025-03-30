// Toggle mobile hamburger menu
const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");
hamburger.addEventListener("click", () => {
  navLinks.classList.toggle("active");
});

// Function to toggle dropdown menus
function toggleDropdown(button) {
  const dropdownContent =
    button.parentElement.querySelector(".dropdown-content");
  dropdownContent.style.display =
    dropdownContent.style.display === "block" ? "none" : "block";
}

// Close dropdown menus if click occurs outside of a dropdown button
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

// Show loader immediately when document is fully loaded
document.addEventListener("readystatechange", () => {
  if (document.readyState === "complete") {
    document.body.classList.add("loaded");
    document.getElementById("global-loader").style.opacity = "0";
    setTimeout(() => {
      document.getElementById("global-loader").remove();
    }, 300);
  }
});

// Handle page transitions on unload and load events
document.addEventListener("DOMContentLoaded", () => {
  // Show loader before page unload
  window.addEventListener("beforeunload", () => {
    document.body.classList.remove("loaded");
    document.getElementById("global-loader").style.opacity = "1";
  });
  // Fade in content after page load
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
