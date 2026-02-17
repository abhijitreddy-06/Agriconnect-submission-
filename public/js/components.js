/**
 * components.js — Renders consistent navbar & footer across all pages.
 * Load AFTER auth.js so the Auth object is available.
 */
(() => {
    const currentPath = window.location.pathname;
    const isLoggedIn = typeof Auth !== 'undefined' && Auth.isLoggedIn();
    const role = isLoggedIn ? Auth.getRole() : null;
    const user = isLoggedIn ? Auth.getUser() : null;
    const userName = user?.username || 'User';

    // ── Nav links by role ─────────────────────────────
    const guestLinks = [
        { href: '/', label: '🏠 Home' },
        { href: '/get-started', label: '🌾 Get Started' },
    ];

    const farmerLinks = [
        { href: '/dashboard/farmer', label: '🏠 Home' },
        { href: '/plant-health', label: '🌿 Plant Health' },
        { href: '/marketplace/farmer', label: '🛒 Market' },
        { href: '/sell', label: '🛍️ Sell' },
        { href: '/orders', label: '📦 Orders' },
    ];

    const customerLinks = [
        { href: '/dashboard/customer', label: '🏠 Home' },
        { href: '/marketplace/customer', label: '🛒 Market' },
        { href: '/cart', label: '🛍️ Cart' },
        { href: '/orders', label: '📦 Orders' },
    ];

    function getNavLinks() {
        if (isLoggedIn && role === 'farmer') return farmerLinks;
        if (isLoggedIn && role === 'customer') return customerLinks;
        return guestLinks;
    }

    function getHomeUrl() {
        if (role === 'farmer') return '/dashboard/farmer';
        if (role === 'customer') return '/dashboard/customer';
        return '/';
    }

    // ── Build Navbar HTML ─────────────────────────────
    function buildNavbar() {
        const links = getNavLinks();
        const linksHtml = links
            .map((link) => {
                const isActive = currentPath === link.href;
                return `<li><a href="${link.href}"${isActive ? ' class="active"' : ''}>${link.label}</a></li>`;
            })
            .join('');

        let actionsHtml;

        if (isLoggedIn) {
            actionsHtml = `
        <div class="nav-actions">
          <div class="profile-dropdown">
            <button class="profile-toggle" id="profileToggle">
              <i class="fas fa-user-circle"></i>
              <span class="profile-name">${userName}</span>
              <i class="fas fa-chevron-down" style="font-size:0.7rem;opacity:0.7"></i>
            </button>
            <div class="profile-menu" id="profileMenu">
              <a href="/profile"><i class="fas fa-user"></i> My Profile</a>
              ${role === 'customer' ? '<a href="/cart"><i class="fas fa-shopping-cart"></i> My Cart</a>' : ''}
              <a href="/orders"><i class="fas fa-box"></i> My Orders</a>
              <div class="divider"></div>
              <a href="#" class="logout-link" id="navLogoutBtn"><i class="fas fa-sign-out-alt"></i> Log out</a>
            </div>
          </div>
        </div>`;
        } else {
            actionsHtml = `
        <div class="nav-actions">
          <button class="nav-btn" onclick="window.location.href='/get-started'">Sign Up</button>
        </div>`;
        }

        return `
      <nav class="navbar">
        <a href="${getHomeUrl()}" class="logo">AgriConnect</a>
        <ul class="nav-links" id="navLinks">${linksHtml}</ul>
        ${actionsHtml}
        <div class="hamburger" id="hamburgerBtn">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </div>
      </nav>`;
    }

    // ── Build Footer HTML ─────────────────────────────
    function buildFooter() {
        return `
      <div class="footer-content">
        <p>&copy; ${new Date().getFullYear()} AgriConnect. All rights reserved.</p>
        <p>Built by <a href="https://abhijitreddy-portfolio.netlify.app/" target="_blank">Abhijit Reddy</a></p>
        <div class="social-links">
          <a href="https://www.linkedin.com/in/abhijitreddy75" target="_blank" title="LinkedIn"><i class="fab fa-linkedin"></i></a>
          <a href="https://github.com/abhijitreddy-06" target="_blank" title="GitHub"><i class="fab fa-github"></i></a>
          <a href="https://leetcode.com/u/MWMznGTyFG/" target="_blank" title="LeetCode"><i class="fas fa-code"></i></a>
        </div>
      </div>`;
    }

    // ── Inject & wire up ──────────────────────────────
    function init() {
        // Inject navbar
        const header = document.querySelector('header');
        if (header && !header.querySelector('.navbar')) {
            header.innerHTML = buildNavbar();
        }

        // Inject footer
        const footer = document.querySelector('footer.footer');
        if (footer && !footer.querySelector('.footer-content')) {
            footer.innerHTML = buildFooter();
        }

        // Hamburger toggle
        const hamburger = document.getElementById('hamburgerBtn');
        const navLinks = document.getElementById('navLinks');
        if (hamburger && navLinks) {
            hamburger.addEventListener('click', () => {
                navLinks.classList.toggle('active');
                hamburger.classList.toggle('active');
            });

            // Close mobile menu when a nav link is clicked
            navLinks.querySelectorAll('a').forEach((link) => {
                link.addEventListener('click', () => {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('active');
                });
            });
        }

        // Profile dropdown toggle
        const profileToggle = document.getElementById('profileToggle');
        const profileMenu = document.getElementById('profileMenu');
        if (profileToggle && profileMenu) {
            profileToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                profileMenu.classList.toggle('show');
            });
        }

        // Close dropdown on outside click
        document.addEventListener('click', (e) => {
            const pm = document.getElementById('profileMenu');
            if (pm && !e.target.closest('.profile-dropdown')) {
                pm.classList.remove('show');
            }
        });

        // Logout handler
        const logoutBtn = document.getElementById('navLogoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof Auth !== 'undefined') Auth.logout();
                else window.location.href = '/';
            });
        }

        // Dismiss loader
        const loader = document.getElementById('global-loader');
        if (loader) {
            if (document.readyState === 'complete') {
                dismissLoader(loader);
            } else {
                window.addEventListener('load', () => dismissLoader(loader));
                setTimeout(() => dismissLoader(loader), 3000);
            }
        }
    }

    function dismissLoader(el) {
        document.body.classList.add('loaded');
        el.style.opacity = '0';
        setTimeout(() => {
            if (el.parentNode) el.remove();
        }, 300);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
