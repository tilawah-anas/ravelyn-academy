import { api } from "./api.js";
import { requireAuth } from "./authorization.js";

if (!requireAuth()) {
  throw new Error("Not Authenticated");
}

const params = new URLSearchParams(window.location.search);
const sessionId = params.get("id");

let session = null;
let terms = [];
let completingTermId = null;


// formattings
function replaceTerm(updatedTerm) {
  if (!updatedTerm) return;
  const index = terms.findIndex((term) => term._id === updatedTerm._id);
  if (index !== -1) terms[index] = updatedTerm;
}

function getTermOrder(name) {
  const order = { First: 1, Second: 2, Third: 3 };
  return order[name] || 99;
}

function getTermNumber(name) {
  const numbers = { First: "01", Second: "02", Third: "03" };
  return numbers[name] || "—";
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function capitalize(value) {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatPromotionStatus(status) {
  return status ? capitalize(status) : "Pending";
}

function escapeHTML(value) {
  const div = document.createElement("div");
  div.textContent = value ?? "";
  return div.innerHTML;
}


// all ids for dom manipulation
const sessionName = document.getElementById("sessionName");
const sessionStatus = document.getElementById("sessionStatus");
const sessionDates = document.getElementById("sessionDates");

const summaryStartDate = document.getElementById("summaryStartDate");
const summaryEndDate = document.getElementById("summaryEndDate");
const promotionStatus = document.getElementById("promotionStatus");
const currentStatus = document.getElementById("currentStatus");

const termsGrid = document.getElementById("termsGrid");
const termsLoading = document.getElementById("termsLoading");
const noTerms = document.getElementById("noTerms");
const termsError = document.getElementById("termsError");
const termsErrorMessage = document.getElementById("termsErrorMessage");

const createTermsBtn = document.getElementById("createTermsBtn");
const createTermsEmptyBtn = document.getElementById("createTermsEmptyBtn");

const termsModal = document.getElementById("termsModal");
const termsForm = document.getElementById("termsForm");
const termsFormError = document.getElementById("termsFormError");
const saveTermsBtn = document.getElementById("saveTermsBtn");

const completeTermModal = document.getElementById("completeTermModal");
const completeTermName = document.getElementById("completeTermName");
const completeTermError = document.getElementById("completeTermError");
const confirmCompleteTermBtn = document.getElementById(
  "confirmCompleteTermBtn",
);

const activateSessionBtn = document.getElementById("activateSessionBtn");
const activateSessionModal = document.getElementById("activateSessionModal");
const activateSessionName = document.getElementById("activateSessionName");
const activateSessionError = document.getElementById("activateSessionError");
const confirmActivateSessionBtn = document.getElementById(
  "confirmActivateSessionBtn",
);


document.addEventListener("DOMContentLoaded", init);

async function init() {
  if (!sessionId) {
    window.location.href = "./sessions.html";
    return;
  }

  bindEvents();
  await loadSession();
  await loadTerms();
}

function bindEvents() {
  createTermsBtn.addEventListener("click", openTermsModal);
  createTermsEmptyBtn.addEventListener("click", openTermsModal);

  document
    .getElementById("closeTermsModal")
    .addEventListener("click", closeTermsModal);

  document
    .getElementById("cancelTermsBtn")
    .addEventListener("click", closeTermsModal);

  document
    .getElementById("retryTermsBtn")
    .addEventListener("click", () => loadTerms());

  document
    .getElementById("cancelCompleteTermBtn")
    .addEventListener("click", closeCompleteTermModal);

  confirmCompleteTermBtn.addEventListener("click", concludeTerm);

  termsForm.addEventListener("submit", createTerms);

//   document.getElementById("editSessionBtn").addEventListener("click", openEditModal);

  termsGrid.addEventListener("click", handleTermAction);

  activateSessionBtn.addEventListener("click", openActivateSessionModal);

  document
    .getElementById("cancelActivateSessionBtn")
    .addEventListener("click", closeActivateSessionModal);

  confirmActivateSessionBtn.addEventListener("click", activateSession);
}

async function loadSession() {
  try {
    const response = await api(`/session/${sessionId}`);

    session = response.data;

    renderSession();
  } catch (error) {
    console.error(error);

    sessionName.textContent = "Session not found";
    sessionStatus.textContent = "—";
    sessionStatus.className = "status-badge";
  }
}

function renderSession() {
  sessionName.textContent = session.name;

  sessionStatus.textContent = capitalize(session.status);
  sessionStatus.className = `status-badge ${session.status}`;

  sessionDates.textContent = `${formatDate(session.startDate)} — ${formatDate(session.endDate)}`;

  summaryStartDate.textContent = formatDate(session.startDate);
  summaryEndDate.textContent = formatDate(session.endDate);

  promotionStatus.textContent = formatPromotionStatus(session.promotionStatus);

  currentStatus.textContent = session.isCurrent ? "Yes" : "No";

  updateCreateTermsVisibility();
  updateActivateSessionVisibility();
}

// terms
async function loadTerms() {
  showTermsLoading();

  try {
    const response = await api(`/term?sessionId=${sessionId}`);
    terms = response.data || [];
    renderTerms();
  } catch (error) {
    terms = [];

    showTermsError(error.message || "Unable to load terms.");
  }
}

function renderTerms() {
  termsGrid.innerHTML = "";

  termsLoading.classList.add("hidden");
  termsError.classList.add("hidden");

  if (terms.length === 0) {
    noTerms.classList.remove("hidden");

    updateCreateTermsVisibility();

    return;
  }

  noTerms.classList.add("hidden");

  updateCreateTermsVisibility();

  const orderedTerms = [...terms].sort(
    (a, b) => getTermOrder(a.name) - getTermOrder(b.name),
  );

  termsGrid.innerHTML = orderedTerms.map(createTermCard).join("");
}

function updateCreateTermsVisibility() {
  const canCreate = Boolean(session) && terms.length === 0;

  createTermsBtn.classList.toggle("hidden", !canCreate);
  createTermsEmptyBtn.classList.toggle("hidden", !canCreate);
}

function updateActivateSessionVisibility() {
  const canActivate = session?.status === "upcoming";

  activateSessionBtn.classList.toggle("hidden", !canActivate);
}

function createTermCard(term) {
  const isUpcoming = term.status === "upcoming";
  const isActive = term.status === "active";
  const isCompleted = term.status === "completed";

  let action = "";

  if (isUpcoming) {
    action =
      session?.status === "active"
        ? `
                <button
                    type="button"
                    class="term-action"
                    data-action="activate"
                    data-term-id="${term._id}"
                >
                    <i class="fa-solid fa-play"></i>
                    Start Term
                </button>
            `
        : `
                <button type="button" class="term-action" disabled>
                    Session Not Active
                </button>
            `;
  }

  if (isActive) {
    action = `
            <button
                type="button"
                class="term-action conclude"
                data-action="complete"
                data-term-id="${term._id}"
            >
                <i class="fa-solid fa-check"></i>
                Conclude Term
            </button>
        `;
  }

  if (isCompleted) {
    action = `
            <button type="button" class="term-action" disabled>
                <i class="fa-solid fa-circle-check"></i>
                Term Completed
            </button>
        `;
  }

  return `
        <article class="term-card ${isActive ? "active-term" : ""}">
            <div class="term-card-header">
                <div class="term-title-wrapper">
                    <div class="term-number-display">
                        ${getTermNumber(term.name)}
                    </div>
                    <h3 class="term-title">
                        ${escapeHTML(term.name)} Term
                    </h3>
                </div>
                <span class="term-status ${term.status}">
                    ${capitalize(term.status)}
                </span>
            </div>
            <div class="term-card-body">
                <div class="term-dates">
                    <div class="term-date">
                        <span>Start Date</span>
                        <strong>${formatDate(term.startDate)}</strong>
                    </div>
                    <div class="term-date">
                        <span>End Date</span>
                        <strong>${formatDate(term.endDate)}</strong>
                    </div>
                </div>
            </div>
            <div class="term-card-footer">
                ${action}
            </div>
        </article>
    `;
}

function handleTermAction(event) {
  const button = event.target.closest("button[data-action]");
  if (!button || button.disabled) return;
  const { action, termId } = button.dataset;
  if (action === "activate") activateTerm(termId);
  if (action === "complete") openCompleteTermModal(termId);
}

// CRUD
async function createTerms(event) {
  event.preventDefault();
  clearTermsFormError();

  const firstStart = document.getElementById("firstStartDate").value;
  const firstEnd = document.getElementById("firstEndDate").value;
  const secondStart = document.getElementById("secondStartDate").value;
  const secondEnd = document.getElementById("secondEndDate").value;
  const thirdStart = document.getElementById("thirdStartDate").value;
  const thirdEnd = document.getElementById("thirdEndDate").value;

  const ranges = [
    { name: "First", start: firstStart, end: firstEnd },
    { name: "Second", start: secondStart, end: secondEnd },
    { name: "Third", start: thirdStart, end: thirdEnd },
  ];

  for (const term of ranges) {
    if (!term.start || !term.end) {
      showTermsFormError(`Please provide dates for ${term.name} Term.`);
      return;
    }

    if (new Date(term.start) >= new Date(term.end)) {
      showTermsFormError(
        `${term.name} Term end date must be after its start date.`,
      );
      return;
    }
  }

  if (new Date(firstEnd) >= new Date(secondStart)) {
    showTermsFormError("Second Term must begin after First Term ends.");
    return;
  }

  if (new Date(secondEnd) >= new Date(thirdStart)) {
    showTermsFormError("Third Term must begin after Second Term ends.");
    return;
  }

  if (session) {
    const sessionStart = new Date(session.startDate);
    const sessionEnd = new Date(session.endDate);

    if (
      new Date(firstStart) < sessionStart ||
      new Date(thirdEnd) > sessionEnd
    ) {
      showTermsFormError(
        "Term dates must fall within the academic session dates.",
      );
      return;
    }
  }

  const payload = {
    terms: ranges.map((term) => ({
      name: term.name,
      startDate: term.start,
      endDate: term.end,
    })),
  };

  const originalText = saveTermsBtn.innerHTML;

  saveTermsBtn.disabled = true;
  saveTermsBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Creating...
    `;

  try {
    const response = await api(`/term/${sessionId}/create`, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    terms = response.data || [];

    closeTermsModal();

    renderTerms();
  } catch (error) {
    showTermsFormError(error.message || "Unable to create terms.");
  } finally {
    saveTermsBtn.disabled = false;
    saveTermsBtn.innerHTML = originalText;
  }
}

// start
async function activateTerm(termId) {
  if (!termId) return;

  try {
    const response = await api(`/term/${termId}/start`, {
      method: "PATCH",
    });

    replaceTerm(response.data);

    renderTerms();
  } catch (error) {
    alert(error.message || "Unable to activate term.");
  }
}

// end
function openCompleteTermModal(termId) {
  const term = terms.find((item) => item._id === termId);

  if (!term) return;

  completingTermId = termId;

  completeTermName.textContent = `${term.name} Term`;

  completeTermError.textContent = "";
  completeTermError.classList.add("hidden");

  openModal(completeTermModal);
}

async function concludeTerm() {
  if (!completingTermId) return;

  const originalText = confirmCompleteTermBtn.innerHTML;

  confirmCompleteTermBtn.disabled = true;
  confirmCompleteTermBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Concluding...
    `;

  try {
    const response = await api(`/term/${completingTermId}/end`, {
      method: "PATCH",
    });

    replaceTerm(response.data);

    renderTerms();

    closeCompleteTermModal();
  } catch (error) {
    completeTermError.textContent = error.message || "Unable to conclude term.";

    completeTermError.classList.remove("hidden");
  } finally {
    confirmCompleteTermBtn.disabled = false;
    confirmCompleteTermBtn.innerHTML = originalText;
  }
}

// active session
function openActivateSessionModal() {
  if (!session) return;

  activateSessionName.textContent = session.name;

  activateSessionError.textContent = "";
  activateSessionError.classList.add("hidden");

  openModal(activateSessionModal);
}

function closeActivateSessionModal() {
  closeModal(activateSessionModal);
}

async function activateSession() {
  if (!session) return;

  const originalText = confirmActivateSessionBtn.innerHTML;

  confirmActivateSessionBtn.disabled = true;
  confirmActivateSessionBtn.innerHTML = `
        <i class="fa-solid fa-spinner fa-spin"></i>
        Activating...
    `;

  try {
    const response = await api(`/session/${session._id}/activate`, {
      method: "PATCH",
    });
    session = response.data;

    renderSession();

    closeActivateSessionModal();
  } catch (error) {
    activateSessionError.textContent =
      error.message || "Unable to activate session.";

    activateSessionError.classList.remove("hidden");
  } finally {
    confirmActivateSessionBtn.disabled = false;
    confirmActivateSessionBtn.innerHTML = originalText;
  }
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

function openTermsModal() {
  clearTermsFormError();
  termsForm.reset();
  openModal(termsModal);
}

function closeTermsModal() {
  closeModal(termsModal);
}

function closeCompleteTermModal() {
  completingTermId = null;
  closeModal(completeTermModal);
}

function openModal(modal) {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal(modal) {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}


function showTermsLoading() {
  termsLoading.classList.remove("hidden");
  noTerms.classList.add("hidden");
  termsError.classList.add("hidden");
  termsGrid.innerHTML = "";
}

function showTermsError(message) {
  termsLoading.classList.add("hidden");
  noTerms.classList.add("hidden");
  termsError.classList.remove("hidden");
  termsErrorMessage.textContent = message;
  termsGrid.innerHTML = "";

  updateCreateTermsVisibility();
}

function showTermsFormError(message) {
  termsFormError.textContent = message;

  termsFormError.classList.remove("hidden");
}

function clearTermsFormError() {
  termsFormError.textContent = "";

  termsFormError.classList.add("hidden");
}
