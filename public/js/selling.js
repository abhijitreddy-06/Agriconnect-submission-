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

document.querySelectorAll(".unit-toggle").forEach((group) => {
  group.querySelectorAll(".toggle-btn").forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from siblings and add to clicked button
      group
        .querySelectorAll(".toggle-btn")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Update corresponding hidden input based on the group context
      const formGroup = button.closest(".form-group");
      if (formGroup.querySelector("#productPrice")) {
        // Price unit toggle
        document.getElementById("priceCurrency").value = button.dataset.unit;
      } else if (formGroup.querySelector("#productQuantity")) {
        // Quantity unit toggle
        document.getElementById("quantityUnit").value = button.dataset.unit;
      }
    });
  });
});

document.querySelectorAll(".source-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove active from all source buttons and add to clicked one
    document
      .querySelectorAll(".source-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Update file input capture attribute based on source selection
    const fileInput = document.getElementById("productImage");
    if (btn.dataset.source === "camera") {
      fileInput.setAttribute("capture", "environment");
    } else {
      fileInput.removeAttribute("capture");
    }
  });
});

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
