const SIDEBAR_URL = new URL("./sidebar.html", import.meta.url);
import { logout } from "../authorization.js";

async function initSidebar() {
    const placeholder = document.getElementById("sidebar");
    if (!placeholder) return;

    // Base path from placeholder → where the sidebar links live
    const base = placeholder.dataset.base || "./pages";

    let html;
    try {
        const res = await fetch(SIDEBAR_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        html = await res.text();
    } catch (err) {
        console.error("[sidebar] failed to load sidebar.html:", err);
        return;
    }

    // Replace the placeholder with the real markup
    placeholder.insertAdjacentHTML("beforebegin", html);
    placeholder.remove();

    document.body.classList.add("has-sidebar");
    const sidebar = document.getElementById("sidebar");
    const toggle = document.getElementById("sidebarToggle");
    const overlay = document.getElementById("sidebarOverlay");
    const closeBtn = sidebar.querySelector("[data-sidebar-close]");

    // Resolve all data-href links using the base
    sidebar.querySelectorAll("[data-href]").forEach((el) => {
        el.setAttribute("href", base + el.getAttribute("data-href"));
    });

    // Mark the active link by comparing paths
    const currentPath = normalize(window.location.pathname);

    sidebar.querySelectorAll("a.sidebar-link").forEach((link) => {
        const linkPath = normalize(
            new URL(link.getAttribute("href"), window.location.origin).pathname
        );

        if (linkPath === currentPath) {
            link.classList.add("active");
            link.setAttribute("aria-current", "page");
        }
    });

    // Mobile open / close
    const open = () => {
        sidebar.classList.add("open");
        overlay.classList.add("show");
        document.body.classList.add("sidebar-open");
    };

    const close = () => {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
        document.body.classList.remove("sidebar-open");
    };

    toggle?.addEventListener("click", open);
    overlay?.addEventListener("click", close);
    closeBtn?.addEventListener("click", close);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") close();
    });

    sidebar.querySelectorAll("a.sidebar-link").forEach((link) => {
        link.addEventListener("click", () => {
            if (window.matchMedia("(max-width: 900px)").matches) close();
        });
    });

    // Auto-close when resizing back to desktop
    window
        .matchMedia("(min-width: 901px)")
        .addEventListener("change", (e) => {
            if (e.matches) close();
        });

    // Logout
    document.getElementById("sidebarLogout")?.addEventListener("click", () => {
        if (!confirm("Log out of your account?")) return;
        logout()
    });
}

function normalize(path) {
    if (path.length > 1 && path.endsWith("/")) return path.slice(0, -1);
    return path;
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSidebar);
} else {
    initSidebar();
}