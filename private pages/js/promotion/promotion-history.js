import { api } from "../api.js";
import { requireAuth } from "../authorization.js";

if (!requireAuth()) {
  throw new Error("Not Authenticated");
}

let histories = [];
let sessions = [];

const tableBody = document.getElementById("historyTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const sessionFilter = document.getElementById("sessionFilter");
const statusFilter = document.getElementById("statusFilter");
const historyModal = document.getElementById("historyModal");

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getStudentName = (history) => {
  const student = history.student;
  if (!student) return "Unknown Student";
  return `${student.firstName || ""} ${student.lastName || ""}`.trim();
};

const getInitials = (history) => {
  const student = history.student;
  if (!student) return "S";
  return `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();
};

const loadHistory = async () => {
  loadingState.classList.remove("hidden");
  try {
    const [historyResponse, sessionsResponse] = await Promise.all([
      api("/promotion-history"),
      api("/session"),
    ]);
    histories = historyResponse.data || [];
    sessions = sessionsResponse.data || [];

    populateSessions();
    updateStats();
    renderHistory();
  } catch (error) {
    console.error(error);
    alert(error.message || "Failed to load promotion history.");
  } finally {
    loadingState.classList.add("hidden");
  }
};

const populateSessions = () => {
  sessionFilter.innerHTML = `<option value="">All Sessions</option>`;
  sessions.forEach((session) => {
    const option = document.createElement("option");

    option.value = session._id;
    option.textContent = session.name;

    sessionFilter.appendChild(option);
  });
};

const updateStats = () => {
  document.getElementById("totalHistory").textContent = histories.length;
  document.getElementById("promotedHistory").textContent = histories.filter(
    (item) => item.status === "promoted",
  ).length;
  document.getElementById("repeatedHistory").textContent = histories.filter(
    (item) => item.status === "repeated",
  ).length;
  document.getElementById("graduatedHistory").textContent = histories.filter(
    (item) => item.status === "graduated",
  ).length;
};

// displays history table
const renderHistory = () => {
  const search = searchInput.value.trim().toLowerCase();
  const session = sessionFilter.value;
  const status = statusFilter.value;

  const filtered = histories.filter((history) => {
    const studentName = getStudentName(history).toLowerCase();
    const matchesSearch = !search || studentName.includes(search);
    const matchesSession = !session || history.academicSession?._id === session;
    const matchesStatus = !status || history.status === status;
    return matchesSearch && matchesSession && matchesStatus;
  });
  tableBody.innerHTML = "";
  if (!filtered.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filtered.forEach((history) => {
    const studentName = getStudentName(history);
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>
                <div class="user-cell">
                    <strong> ${studentName} </strong>
                </div>
            </td>
            <td> ${history.academicSession?.name || "—"} </td>
            <td> ${history.fromLevel?.name || "—"} </td>
            <td> ${history.toLevel?.name || "Graduated"} </td>
            <td>
                ${history.average !== undefined && history.average !== null ? Number(history.average).toFixed(2) : "—"}
            </td>
            <td> ${history.failedCourses ?? 0} </td>
            <td><span class="status-badge status-${history.status}"> ${history.status} </span></td>
            <td> ${formatDate(history.promotedAt)} </td>
            <td>
                <button class="action-btn" title="View details" data-id="${history._id}" >
                    <i class="fa-regular fa-eye"></i>
                </button>
            </td>
        `;
    tableBody.appendChild(row);
  });
};

// details of promotion history
const openDetails = (history) => {
  document.getElementById("historyAvatar").textContent = getInitials(history);
  document.getElementById("historyStudent").textContent = getStudentName(history);
  document.getElementById("historyStatus").textContent = history.status;
  document.getElementById("historyStatus").className = `status-badge status-${history.status}`;
  document.getElementById("historySession").textContent = history.academicSession?.name || "—";
  document.getElementById("historyFromLevel").textContent = history.fromLevel?.name || "—";
  document.getElementById("historyToLevel").textContent = history.toLevel?.name || "Graduated";
  document.getElementById("historyAverage").textContent =
    history.average !== undefined && history.average !== null
      ? Number(history.average).toFixed(2)
      : "—";
  document.getElementById("historyFailed").textContent = history.failedCourses ?? 0;
  document.getElementById("historyDate").textContent = formatDate(
    history.promotedAt,
  );
  document.getElementById("historyReason").textContent =
    history.reason || "No reason provided.";
  historyModal.classList.remove("hidden");
};

tableBody.addEventListener("click", (e) => {
  const button = e.target.closest("[data-id]");
  if (!button) return;
  const history = histories.find((item) => item._id === button.dataset.id);
  if (history) {
    openDetails(history);
  }
});

document
  .getElementById("closeHistoryModal")
  .addEventListener("click", () => historyModal.classList.add("hidden"));

historyModal.addEventListener("click", (e) => {
  if (e.target === historyModal) {
    historyModal.classList.add("hidden");
  }
});

searchInput.addEventListener("input", renderHistory);
sessionFilter.addEventListener("change", renderHistory);
statusFilter.addEventListener("change", renderHistory);

loadHistory();
