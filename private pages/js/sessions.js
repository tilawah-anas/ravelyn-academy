// import { api } from "./api";
import { api } from "./api.js";
import { requireAuth } from "./authorization.js";

if (!requireAuth()) {
    throw new Error("Not Authenticated");
}

const sessionsGrid = document.getElementById("sessionsGrid");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const errorState = document.getElementById("errorState");
const errorMessage = document.getElementById("errorMessage");
const totalSessions = document.getElementById("totalSessions");
const currentSession = document.getElementById("currentSession");
const upcomingSessions = document.getElementById("upcomingSessions");
const completedSessions = document.getElementById("completedSessions");
const searchInput = document.getElementById("sessionSearch");
const statusFilter = document.getElementById("statusFilter");
const sessionModal = document.getElementById("sessionModal");
const deleteModal = document.getElementById("deleteModal");
const completeModal = document.getElementById("completeModal");
const sessionForm = document.getElementById("sessionForm");
const sessionIdInput = document.getElementById("sessionId");
const sessionNameInput = document.getElementById("sessionName");
const startDateInput = document.getElementById("startDate");
const endDateInput = document.getElementById("endDate");
const isCurrentInput = document.getElementById("isCurrent");
const modalTitle = document.getElementById("modalTitle");
const formError = document.getElementById("formError");
const deleteSessionName = document.getElementById("deleteSessionName");
const deleteError = document.getElementById("deleteError");
const completeSessionName = document.getElementById("completeSessionName");
const completeError = document.getElementById("completeError");

let sessions = [];
let editingSessionId = null;
let deletingSessionId = null;
let completingSessionId = null;

// formatting
function replaceSession(updatedSession) {
    const index = sessions.findIndex(
        (session) => session._id === updatedSession._id,
    );
    if (index !== -1) {
        sessions[index] = updatedSession;
    }
}

function calculateProgress(start, end) {
    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    const now = Date.now();
    if (now <= startTime) return 0;
    if (now >= endTime) return 100;
    const progress = ((now - startTime) / (endTime - startTime)) * 100;
    return Math.round(progress);
}

function formatDate(date) {
    return new Intl.DateTimeFormat("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function toInputDate(date) {
    const value = new Date(date);
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function capitalize(value) {
    if (!value) return "";
    return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPromotionStatus(status) {
    if (!status) return "Pending";
    return capitalize(status);
}

function escapeHTML(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

document.addEventListener("DOMContentLoaded", () => {
    loadSessions();
    document.getElementById("openCreateSessionBtn").addEventListener("click", openCreateModal);
    document.getElementById("emptyCreateBtn").addEventListener("click", openCreateModal);
    document.getElementById("closeSessionModal").addEventListener("click", closeSessionModal);
    document.getElementById("cancelSessionBtn").addEventListener("click", closeSessionModal);
    document.getElementById("cancelDeleteBtn").addEventListener("click", closeDeleteModal);
    document.getElementById("cancelCompleteBtn").addEventListener("click", closeCompleteModal);
    document.getElementById("confirmDeleteBtn").addEventListener("click", deleteSession);
    document.getElementById("confirmCompleteBtn").addEventListener("click", completeSession);
    document.getElementById("retryBtn").addEventListener("click", loadSessions);
    sessionForm.addEventListener("submit", handleSessionSubmit);
    searchInput.addEventListener("input", renderSessions);
    statusFilter.addEventListener("change", renderSessions);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeSessionModal();
            closeDeleteModal();
            closeCompleteModal();
        }
    });
});

async function loadSessions() {
    showLoading();
    try {
        const response = await api("/session");
        sessions = response.data || [];
        updateStats();
        renderSessions();
    } catch (error) {
        showError(error.message || "Unable to load academic sessions.");
    }
}

function updateStats() {
    totalSessions.textContent = sessions.length;
    const current = sessions.find((session) => session.isCurrent);
    currentSession.textContent = current ? current.name : "—";
    upcomingSessions.textContent = sessions.filter(
        (session) => session.status === "upcoming",
    ).length;
    completedSessions.textContent = sessions.filter(
        (session) => session.status === "completed",
    ).length;
}


function renderSessions() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedStatus = statusFilter.value;
    const filteredSessions = sessions.filter((session) => {
        const matchesSearch = session.name?.toLowerCase().includes(searchTerm);
        const matchesStatus = selectedStatus === "all" || session.status === selectedStatus;
        return matchesSearch && matchesStatus;
    });

    sessionsGrid.innerHTML = "";

    if (filteredSessions.length === 0) {
        if (sessions.length === 0) {
            showEmpty();
        } else {
            showFilteredEmpty();
        }
        return;
    }

    hideStates();

    filteredSessions.forEach((session) => {
        sessionsGrid.insertAdjacentHTML("beforeend", createSessionCard(session));
    });
}

// cards
function createSessionCard(session) {
    const startDate = new Date(session.startDate);
    const endDate = new Date(session.endDate);
    const progress = calculateProgress(session.startDate, session.endDate);
    const status = session.status || "upcoming";
    const isCompleted = status === "completed";
    const isActive = session.status === "active";
    const currentLabel = session.isCurrent
        ? `
            <div class="current-label">
                <i class="fa-solid fa-circle"></i>
                Current Session
            </div>
        `
        : "";
    return `
        <article class="session-card ${session.isCurrent ? "current-session" : ""}">
            <div class="session-card-header">
                <div>
                    <h3 class="session-name">${escapeHTML(session.name)}</h3>
                    ${currentLabel}
                </div>
                <span class="status-badge ${status}">${capitalize(status)} </span>
            </div>

            <div class="session-card-body">
                <div class="date-row">
                    <div class="date-item">
                        <span>Start Date</span>
                        <strong>${formatDate(startDate)} </strong>
                    </div>
                    <div class="date-item">
                        <span>End Date</span>
                        <strong>${formatDate(endDate)} </strong>
                    </div>
                </div>
                ${status === "active"
            ? `
                            <div class="session-progress">
                                <div class="progress-label">
                                    <span>Session Progress</span>
                                    <span>${progress}%</span>
                                </div>
                                <div class="progress-track">
                                    <div class="progress-bar" style="width: ${progress}%" ></div>
                                </div>
                            </div>
                        `
            : ""
        }
                <div class="promotion-status">
                    <span>Promotion</span>
                    <strong class="promotion-badge">
                        ${formatPromotionStatus(session.promotionStatus)}
                    </strong>
                </div>
            </div>
            <div class="session-card-footer">
                ${!isCompleted
            ? `
                    <button class="complete-btn" onclick="openCompleteModal('${session._id}')">
                        <i class="fa-solid fa-check"></i>
                        Complete
                    </button>
                `
                : `
                    <span class="completed-label">
                        <i class="fa-solid fa-circle-check"></i>
                        Completed
                    </span>
                `
        }
             ${
                !isActive && !isCompleted
                    ? `
                        <button class="icon-btn"
                            title="Edit session"
                            onclick="openEditModal('${session._id}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button class="icon-btn danger"
                            title="Delete session"
                            onclick="openDeleteModal('${session._id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    `
                    : ""
    }
                    <button class="complete-btn" onclick="openSession('${session._id}')" >
                        <i class="fa-solid fa-arrow-right"></i>
                        View Session
                    </button>
                </div>
            </div>
        </article>
    `;
}

// edit and create PATCH and POST
function openCreateModal() {
    editingSessionId = null;
    modalTitle.textContent = "Create Academic Session";
    sessionForm.reset();
    sessionIdInput.value = "";
    clearFormError();
    openModal(sessionModal);
}

function openSession(id) {
    window.location.href = `./session-details.html?id=${id}`;
}

function openEditModal(id) {
    const session = sessions.find((item) => item._id === id);
    if (!session) return;
    if (session.status === "completed") {
        alert("Completed sessions cannot be edited.");
        return;
    }

    editingSessionId = id;
    modalTitle.textContent = "Edit Academic Session";
    sessionIdInput.value = id;
    sessionNameInput.value = session.name || "";
    startDateInput.value = toInputDate(session.startDate);
    endDateInput.value = toInputDate(session.endDate);
    isCurrentInput.checked = Boolean(session.isCurrent);
    clearFormError();
    openModal(sessionModal);
}

async function handleSessionSubmit(event) {
    event.preventDefault();
    clearFormError();
    const name = sessionNameInput.value.trim();
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;
    const isCurrent = isCurrentInput.checked;

    if (!name || !startDate || !endDate) {
        showFormError("Please complete all required fields.");
        return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
        showFormError("The end date must be after the start date.");
        return;
    }

    const payload = {
        name,
        startDate,
        endDate,
        isCurrent,
    };

    const saveButton = document.getElementById("saveSessionBtn");
    const originalText = saveButton.innerHTML;
    saveButton.disabled = true;
    saveButton.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Saving... `;

    // if a seesionId is present saves as edit, else creates new session
    try {
        if (editingSessionId) {
            const response = await api(`/session/${editingSessionId}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });
            replaceSession(response.data);
        } else {
            const response = await api("/session", {
                method: "POST",
                body: JSON.stringify(payload),
            });
            sessions.unshift(response.data);
        }
        updateStats();
        renderSessions();
        closeSessionModal();
    } catch (error) {
        showFormError(error.message || "Unable to save academic session.");
    } finally {
        saveButton.disabled = false;
        saveButton.innerHTML = originalText;
    }
}

// delete
function openDeleteModal(id) {
    const session = sessions.find((item) => item._id === id);
    if (!session) return;
    if (session.status === "completed") {
        alert("Completed sessions cannot be deleted.");
        return;
    }
    deletingSessionId = id;
    deleteSessionName.textContent = session.name;
    deleteError.classList.add("hidden");
    openModal(deleteModal);
}

async function deleteSession() {
    if (!deletingSessionId) return;
    const button = document.getElementById("confirmDeleteBtn");
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = ` <i class="fa-solid fa-spinner fa-spin"></i> Deleting...`;
    try {
        await api(`/session/${deletingSessionId}`, {
            method: "DELETE",
        });

        sessions = sessions.filter((session) => session._id !== deletingSessionId);
        updateStats();
        renderSessions();
        closeDeleteModal();
    } catch (error) {
        deleteError.textContent = error.message || "Unable to delete session.";
        deleteError.classList.remove("hidden");
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// complete
function openCompleteModal(id) {
    const session = sessions.find((item) => item._id === id);
    if (!session) return;
    completingSessionId = id;
    completeSessionName.textContent = session.name;
    completeError.classList.add("hidden");
    openModal(completeModal);
}

async function completeSession() {
    if (!completingSessionId) return;
    const button = document.getElementById("confirmCompleteBtn");
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Completing...`;

    try {
        const response = await api(`/session/${completingSessionId}/complete`, {
            method: "PATCH",
        });
        replaceSession(response.data);
        updateStats();
        renderSessions();
        closeCompleteModal();
    } catch (error) {
        completeError.textContent = error.message || "Unable to complete session.";
        completeError.classList.remove("hidden");
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}


// modals
function openModal(modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function closeModal(modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
}

function closeSessionModal() {
    closeModal(sessionModal);
}

function closeDeleteModal() {
    deletingSessionId = null;
    closeModal(deleteModal);
}

function closeCompleteModal() {
    completingSessionId = null;
    closeModal(completeModal);
}

// error and loading
function showLoading() {
    sessionsGrid.innerHTML = "";
    loadingState.classList.remove("hidden");
    emptyState.classList.add("hidden");
    errorState.classList.add("hidden");
}

function hideStates() {
    loadingState.classList.add("hidden");
    emptyState.classList.add("hidden");
    errorState.classList.add("hidden");
}

function showEmpty() {
    sessionsGrid.innerHTML = "";
    loadingState.classList.add("hidden");
    emptyState.classList.remove("hidden");
    errorState.classList.add("hidden");
}

function showFilteredEmpty() {
    sessionsGrid.innerHTML = "";
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    emptyState.classList.remove("hidden");
    emptyState.querySelector("h3").textContent = "No matching sessions";
    emptyState.querySelector("p").textContent = "Try changing your search or status filter.";
    document.getElementById("emptyCreateBtn").classList.add("hidden");
}

function showError(message) {
    sessionsGrid.innerHTML = "";
    loadingState.classList.add("hidden");
    emptyState.classList.add("hidden");
    errorState.classList.remove("hidden");
    errorMessage.textContent = message;
}

function showFormError(message) {
    formError.textContent = message;
    formError.classList.remove("hidden");
}

function clearFormError() {
    formError.textContent = "";
    formError.classList.add("hidden");
}

window.openCompleteModal = openCompleteModal;
window.openEditModal = openEditModal;
window.openDeleteModal = openDeleteModal;
window.openSession = openSession;
