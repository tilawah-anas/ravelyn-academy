import { api } from "./api.js";
import { requireAuth } from "./authorization.js";

if (!requireAuth()) throw new Error("Not authenticated");

const tableBody = document.getElementById("messagesTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const tableWrapper = document.getElementById("tableWrapper");

async function loadMessages() {
    try {
        const response = await api("/contact");
        const messages = response.data || [];

        loadingState.classList.add("hidden");

        if (!messages.length) {
            emptyState.classList.remove("hidden");
            return;
        }

        tableWrapper.classList.remove("hidden");

        tableBody.innerHTML = messages.map(msg => `
            <tr>
                <td>${escapeHTML(msg.fullName || "—")}</td>
                <td>${escapeHTML(msg.email || "—")}</td>
                <td>${escapeHTML(msg.subject || "No subject")}</td>
                <td>${escapeHTML(msg.message || "—")}</td>
                <td>${formatDate(msg.createdAt)}</td>
            </tr>
        `).join("");

    } catch (error) {

        loadingState.classList.add("hidden");
        tableBody.innerHTML = `<tr><td colspan="5">Failed to load messages.</td></tr>`;
    }

}

function formatDate(date) {
    if (!date) return "—";
    return new Date(date).toLocaleDateString("en-NG", {
        day: "numeric", month: "short", year: "numeric"
    });
}

function escapeHTML(value = "") {
    const div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
}

loadMessages();