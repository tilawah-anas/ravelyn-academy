import { api } from "./api.js";
import { requireAuth, getUser, getDisplayName } from "./authorization.js";

const user = getUser()

if (!requireAuth()) {
    throw new Error("Not authenticated");
}

document.addEventListener("DOMContentLoaded", init);
async function init() {
    renderUser(user);
    await Promise.all([
        loadCounts(),
        loadCurrentSession()
    ]);
}

function renderUser(user) {
    if (!user) return;
    const name = getDisplayName(user);
    const role = user.role ?? "";

    document.getElementById("userName").textContent = name;
    document.getElementById("userRole").textContent = capitalize(role);

    document.querySelector(".user-avatar").textContent = name.charAt(0).toUpperCase();
    document.getElementById("welcomeName").textContent = `Welcome ${name}`;
}

async function loadCounts() {
    const [students, classes, courses] = await Promise.allSettled([
        api("/student"),
        api("/class"),
        api("/course")
    ]);

    setCount("studentCount", students);
    setCount("classCount", classes);
    setCount("courseCount", courses);
}

function setCount(elementId, result) {
    const element = document.getElementById(elementId);
    if (!element) return;
    if (result.status === "rejected") {
        console.warn(`Failed to load ${elementId}:`, result.reason);
        element.textContent = "—";
        return;
    }
    element.textContent = getCount(result.value);
}


function getCount(response) {
    if (Array.isArray(response)) return response.length;
    if (Array.isArray(response?.data)) return response.data.length;
    if (Array.isArray(response?.items)) return response.items.length;
    if (typeof response?.total === "number") return response.total;
    if (typeof response?.count === "number") return response.count;
    return 0;

}

async function loadCurrentSession() {

    const nameEl = document.getElementById("sessionName");
    const statusEl = document.getElementById("sessionStatus");
    const detailsEl = document.getElementById("sessionDetails");

    try {
        const response = await api("/session");
        const sessions = response?.data || [];
        const current = sessions.find(s => s.isCurrent) || sessions.find(s => s.status === "active");
        if (!current) {

            nameEl.textContent = "No active session";
            statusEl.textContent = "Activate a session to begin";
            statusEl.className = "stat-description";

            detailsEl.innerHTML = `
                <p class="empty-text">
                    No active session. Activate one from the
                    sessions page.
                </p>
            `;
            return;
        }
        nameEl.textContent = current.name;
        statusEl.textContent = capitalize(current.status);
        statusEl.className = `stat-description session-status-${current.status}`;
        renderSessionDetails(current, detailsEl);
    } catch (error) {
        console.error("Session loading error:", error);
        nameEl.textContent = "—";
        statusEl.textContent = "Unable to load session";
        statusEl.className = "stat-description";
        detailsEl.innerHTML = `<p class="empty-text">Unable to load session.</p>`;
    }
}

function renderSessionDetails(session, container) {
    container.innerHTML = `
        <div class="session-info-row">
            <span>Status</span>
            <strong class="status-badge ${session.status}">
                ${capitalize(session.status)}
            </strong>
        </div>

        <div class="session-info-row">
            <span>Start Date</span>
            <strong>${formatDate(session.startDate)}</strong>
        </div>

        <div class="session-info-row">
            <span>End Date</span>
            <strong>${formatDate(session.endDate)}</strong>
        </div>

        <a href="./session-details.html?id=${session._id}" class="session-link">
            View session details
            <i class="fa-solid fa-arrow-right"></i>
        </a>

    `;

}

function capitalize(value) {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(date) {
    if (!date) return "—";
    return new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric"
    }).format(new Date(date));

}