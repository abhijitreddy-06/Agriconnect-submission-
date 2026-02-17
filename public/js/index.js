// ─── Landing Page ───────────────────────────────────────────────
// Auth guard in auth.js handles redirect if logged in

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
