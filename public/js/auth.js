/**
 * AgriConnect Auth Utility
 * -----------------------
 * Include this script BEFORE any page-specific JS.
 * It handles: token storage, auto-refresh, auth fetch wrapper,
 * page guards, role-based access, and block-after-login.
 *
 * Usage in HTML: <script src="/js/auth.js" data-guard="farmer"></script>
 *   data-guard values: "farmer" | "customer" | "any" | "guest" | (omit for public)
 */

const Auth = (() => {
    // ─── Token Storage ───────────────────────────────────────────────
    const TOKEN_KEY = "agriconnect_token";
    const REFRESH_KEY = "agriconnect_refresh_token";
    const USER_KEY = "agriconnect_user";

    const getToken = () => localStorage.getItem(TOKEN_KEY);
    const getRefreshToken = () => localStorage.getItem(REFRESH_KEY);
    const getUser = () => {
        try {
            return JSON.parse(localStorage.getItem(USER_KEY));
        } catch {
            return null;
        }
    };

    const setTokens = (accessToken, refreshToken) => {
        localStorage.setItem(TOKEN_KEY, accessToken);
        localStorage.setItem(REFRESH_KEY, refreshToken);
    };

    const setUser = (user) => {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
    };

    const clearAuth = () => {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(REFRESH_KEY);
        localStorage.removeItem(USER_KEY);
    };

    const isLoggedIn = () => !!getToken();
    const getRole = () => getUser()?.role || null;

    // ─── Token Refresh ───────────────────────────────────────────────
    let isRefreshing = false;
    let refreshPromise = null;

    const refreshTokens = async () => {
        if (isRefreshing) return refreshPromise;

        isRefreshing = true;
        refreshPromise = (async () => {
            try {
                const refreshToken = getRefreshToken();
                if (!refreshToken) throw new Error("No refresh token");

                const res = await fetch("/api/auth/refresh", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ refreshToken }),
                });

                if (!res.ok) throw new Error("Refresh failed");

                const data = await res.json();
                if (data.success && data.token) {
                    setTokens(data.token, data.refreshToken);
                    return data.token;
                }
                throw new Error("Invalid refresh response");
            } catch (err) {
                clearAuth();
                return null;
            } finally {
                isRefreshing = false;
                refreshPromise = null;
            }
        })();

        return refreshPromise;
    };

    // ─── Authenticated Fetch Wrapper ─────────────────────────────────
    /**
     * Fetch with automatic Bearer token and auto-refresh on 401.
     * Use this instead of fetch() for all authenticated API calls.
     */
    const authFetch = async (url, options = {}) => {
        const token = getToken();
        const headers = {
            ...options.headers,
        };

        // Don't set Content-Type for FormData (let browser set boundary)
        if (!(options.body instanceof FormData)) {
            headers["Content-Type"] = headers["Content-Type"] || "application/json";
        }

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        let res = await fetch(url, { ...options, headers });

        // If 401 with token expired, try refresh
        if (res.status === 401) {
            const newToken = await refreshTokens();
            if (newToken) {
                headers["Authorization"] = `Bearer ${newToken}`;
                res = await fetch(url, { ...options, headers });
            } else {
                // Refresh failed — force logout
                handleForceLogout();
                throw new Error("Session expired. Please log in again.");
            }
        }

        return res;
    };

    // ─── Login / Signup / Logout ─────────────────────────────────────
    const login = async (phone, password, role) => {
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ phone, password, role }),
        });

        const data = await res.json();

        if (data.success) {
            setTokens(data.token, data.refreshToken);
            setUser({ id: data.userId, username: data.username, role: data.role });

            // Replace current history entry so user can't go back to login
            const homeUrl = data.role === "farmer" ? "/dashboard/farmer" : "/dashboard/customer";
            window.location.replace(homeUrl);
        }

        return data;
    };

    const signup = async (username, phone, password, role) => {
        const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, phone, password, role }),
        });

        const data = await res.json();

        if (data.success) {
            setTokens(data.token, data.refreshToken);
            setUser({ id: data.userId, username: data.username || username, role: data.role });

            // Replace current history entry so user can't go back to signup
            const homeUrl = data.role === "farmer" ? "/dashboard/farmer" : "/dashboard/customer";
            window.location.replace(homeUrl);
        }

        return data;
    };

    const logout = async () => {
        try {
            const refreshToken = getRefreshToken();
            await fetch("/api/auth/logout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ refreshToken }),
            });
        } catch {
            // Logout API fail is non-critical
        }
        clearAuth();
        window.location.replace("/");
    };

    const handleForceLogout = () => {
        clearAuth();
        window.location.replace("/get-started");
    };

    // ─── Page Guards ─────────────────────────────────────────────────
    // Role-to-homepage mapping
    const HOME_ROUTES = {
        farmer: "/dashboard/farmer",
        customer: "/dashboard/customer",
    };

    // Which guard type each page path requires
    const PAGE_GUARDS = {
        // Guest-only pages (redirect to home if logged in)
        "/": "guest",
        "/login/farmer": "guest",
        "/signup/farmer": "guest",
        "/login/customer": "guest",
        "/signup/customer": "guest",
        "/get-started": "guest",
        // Farmer-only pages
        "/dashboard/farmer": "farmer",
        "/sell": "farmer",
        "/my-products": "farmer",
        "/marketplace/farmer": "farmer",
        "/plant-health": "farmer",
        "/diagnosis": "farmer",
        // Customer-only pages
        "/dashboard/customer": "customer",
        "/marketplace/customer": "customer",
        "/cart": "customer",
        // Any authenticated role
        "/orders": "any",
        "/profile": "any",
    };

    /**
     * Apply page guard based on current URL path.
     * Call this at the top of every page's JS (or auto-detect from script tag).
     */
    const applyPageGuard = (guardType) => {
        const loggedIn = isLoggedIn();
        const role = getRole();

        if (guardType === "guest") {
            // Block logged-in users from going back to login/landing pages
            if (loggedIn && role) {
                window.location.replace(HOME_ROUTES[role] || "/");
                return false;
            }
            return true;
        }

        if (guardType === "farmer") {
            if (!loggedIn) {
                window.location.replace("/get-started");
                return false;
            }
            if (role !== "farmer") {
                window.location.replace(HOME_ROUTES[role] || "/");
                return false;
            }
            return true;
        }

        if (guardType === "customer") {
            if (!loggedIn) {
                window.location.replace("/login/customer");
                return false;
            }
            if (role !== "customer") {
                window.location.replace(HOME_ROUTES[role] || "/");
                return false;
            }
            return true;
        }

        if (guardType === "any") {
            if (!loggedIn) {
                window.location.replace("/get-started");
                return false;
            }
            return true;
        }

        return true; // No guard = public page
    };

    /**
     * Auto-detect guard from current path and apply.
     * Also prevents back-navigation to auth pages after login.
     */
    const autoGuard = () => {
        const path = window.location.pathname;
        const guard = PAGE_GUARDS[path];

        if (guard) {
            return applyPageGuard(guard);
        }
        return true;
    };

    // ─── History Management (block back to login) ────────────────────
    /**
     * Replace history state to prevent going back to login/signup pages.
     * Call after successful login/signup.
     */
    const blockBackNavigation = () => {
        if (isLoggedIn()) {
            // Push a new state to prevent back button from going to login
            window.history.pushState(null, "", window.location.href);
            window.addEventListener("popstate", () => {
                const loggedIn = isLoggedIn();
                const currentPath = window.location.pathname;
                const guestPages = ["/", "/login/farmer", "/signup/farmer", "/login/customer", "/signup/customer", "/get-started"];

                if (loggedIn && guestPages.includes(currentPath)) {
                    const role = getRole();
                    window.location.replace(HOME_ROUTES[role] || "/dashboard/farmer");
                }
            });
        }
    };

    // ─── Auto-initialize ────────────────────────────────────────────
    // Run guard check immediately when script loads
    const guardPassed = autoGuard();

    // Set up back-navigation blocking on protected pages
    if (guardPassed && isLoggedIn()) {
        blockBackNavigation();
    }

    // ─── Setup Logout Buttons ───────────────────────────────────────
    document.addEventListener("DOMContentLoaded", () => {
        // Bind all logout links/buttons
        document.querySelectorAll('a[href="/"], .logout-btn, [data-logout]').forEach((el) => {
            // Only bind if it looks like a logout link (text contains "log" or "sign out")
            const text = (el.textContent || "").toLowerCase();
            if (text.includes("log") && (text.includes("out") || el.hasAttribute("data-logout"))) {
                el.addEventListener("click", (e) => {
                    e.preventDefault();
                    logout();
                });
                el.href = "#"; // prevent default navigation
            }
        });

        // Display username if element exists
        const usernameEl = document.getElementById("display-username") || document.querySelector(".username-display");
        if (usernameEl) {
            const user = getUser();
            if (user?.username) {
                usernameEl.textContent = user.username;
            }
        }
    });

    // ─── Public API ──────────────────────────────────────────────────
    return {
        getToken,
        getRefreshToken,
        getUser,
        getRole,
        isLoggedIn,
        setTokens,
        setUser,
        clearAuth,
        authFetch,
        login,
        signup,
        logout,
        applyPageGuard,
        autoGuard,
        refreshTokens,
    };
})();
