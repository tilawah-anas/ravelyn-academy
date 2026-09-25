import { api } from "../api.js";
import { requireAuth } from "../authorization.js";

if (!requireAuth()) {
  throw new Error("Noot Authenticated");
}

const rulesTableBody = document.getElementById("rulesTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const ruleModal = document.getElementById("ruleModal");
const ruleForm = document.getElementById("ruleForm");
const ruleId = document.getElementById("ruleId");
const academicSession = document.getElementById("academicSession");
const fromLevel = document.getElementById("fromLevel");
const toLevel = document.getElementById("toLevel");
const defaultPassMark = document.getElementById("defaultPassMark");
const minimumAverage = document.getElementById("minimumAverage");
const maximumFailedCourses = document.getElementById("maximumFailedCourses");
const minimumAttendance = document.getElementById("minimumAttendance");
const requiresApproval = document.getElementById("requiresApproval");
const active = document.getElementById("active");

let rules = [];
let sessions = [];
let levels = [];

const formatNumber = (value) => {
  return value === null || value === undefined || value === "" ? "—" : value;
};

const loadData = async () => {
  loadingState.classList.remove("hidden");
  try {
    const [rulesResponse, sessionsResponse, levelsResponse] = await Promise.all(
      [api("/promotion-rule"), api("/session"), api("/levels")],
    );

    rules = rulesResponse.data || [];
    sessions = sessionsResponse.data || [];
    levels = levelsResponse.data || [];

    populateSelects();
    updateStats();
    renderRules();
  } catch (error) {
    console.error(error);
    alert(error.message || "Failed to load promotion rules.");
  } finally {
    loadingState.classList.add("hidden");
  }
};

const populateSelects = () => {
  academicSession.innerHTML = `<option value="">Select session</option>`;
  sessions.forEach((session) => {
    const option = document.createElement("option");
    option.value = session._id;
    option.textContent = session.name;
    academicSession.appendChild(option);
  });

  fromLevel.innerHTML = `<option value="">Select level</option>`;
  toLevel.innerHTML = `<option value="">Select destination level</option>`;
  levels.forEach((level) => {
    const option = document.createElement("option");
    option.value = level._id;
    option.textContent = `${level.name}${level.code ? ` (${level.code})` : ""}`;
    fromLevel.appendChild(option);
    const destinationOption = option.cloneNode(true);
    toLevel.appendChild(destinationOption);
  });
};

const updateStats = () => {
  document.getElementById("totalRules").textContent = rules.length;
  document.getElementById("activeRules").textContent = rules.filter(
    (rule) => rule.active,
  ).length;
  document.getElementById("inactiveRules").textContent = rules.filter(
    (rule) => !rule.active,
  ).length;
  const transitions = new Set(
    rules.map((rule) => `${rule.fromLevel?._id}-${rule.toLevel?._id}`),
  );

  document.getElementById("levelTransitions").textContent = transitions.size;
};

const renderRules = () => {
  const search = searchInput.value.trim().toLowerCase();
  const status = statusFilter.value;
  const filtered = rules.filter((rule) => {
    const from = rule.fromLevel?.name?.toLowerCase() || "";
    const to = rule.toLevel?.name?.toLowerCase() || "";
    const session = rule.academicSession?.name?.toLowerCase() || "";
    const matchesSearch =
      !search ||
      from.includes(search) ||
      to.includes(search) ||
      session.includes(search);
    const matchesStatus = !status || String(rule.active) === status;
    return matchesSearch && matchesStatus;
  });

  rulesTableBody.innerHTML = "";

  if (!filtered.length) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  filtered.forEach((rule) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td> ${rule.academicSession?.name || "—"} </td>
            <td>
                <strong> ${rule.fromLevel?.name || "—"}</strong>
            </td>
            <td> ${rule.toLevel?.name || "Graduation"}</td>
            <td> ${formatNumber(rule.defaultPassMark)}</td>
            <td> ${formatNumber(rule.minimumAverage)}</td>
            <td> ${formatNumber(rule.maximumFailedCourses)} </td>

            <td>
                <span class="approval-badge">
                    ${rule.requiresApproval ? "Required" : "Automatic"}
                </span>
            </td>
            <td>
                <span class="status-badge ${rule.active ? "active" : "inactive"}">
                    ${rule.active ? "Active" : "Inactive"}
                </span>
            </td>
            <td>
                <div class="actions">
                    <button class="action-btn" title="Edit rule" data-action="edit" data-id="${rule._id}">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="action-btn danger" title="Delete rule" data-action="delete" data-id="${rule._id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    rulesTableBody.appendChild(row);
  });
};

const openModal = (rule) => {
  ruleForm.reset();
  ruleId.value = "";
  document.getElementById("modalTitle").textContent = "Create Promotion Rule";
  active.checked = true;
  if (rule) {
    ruleId.value = rule._id;
    document.getElementById("modalTitle").textContent = "Edit Promotion Rule";
    academicSession.value = rule.academicSession?._id || rule.academicSession || "";
    fromLevel.value = rule.fromLevel?._id || rule.fromLevel || "";
    toLevel.value = rule.toLevel?._id || rule.toLevel || "";
    defaultPassMark.value = rule.defaultPassMark ?? 50;
    minimumAverage.value = rule.minimumAverage ?? "";
    maximumFailedCourses.value = rule.maximumFailedCourses ?? "";
    minimumAttendance.value = rule.minimumAttendance ?? "";
    requiresApproval.checked = rule.requiresApproval === true;
    active.checked = rule.active !== false;
  }
  ruleModal.classList.remove("hidden");
};

const closeModal = () => {
  ruleModal.classList.add("hidden");
  ruleForm.reset();
};

ruleForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    academicSession: academicSession.value,
    fromLevel: fromLevel.value,
    toLevel: toLevel.value || null,
    defaultPassMark: Number(defaultPassMark.value),
    minimumAverage:
      minimumAverage.value === "" ? null : Number(minimumAverage.value),
    maximumFailedCourses:
      maximumFailedCourses.value === ""
        ? null
        : Number(maximumFailedCourses.value),
    minimumAttendance:
      minimumAttendance.value === "" ? null : Number(minimumAttendance.value),
    requiresApproval: requiresApproval.checked,
    active: active.checked,
  };

  try {
    if (ruleId.value) {
      await api(`/promotion-rule/${ruleId.value}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await api("/promotion-rule", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    closeModal();
    await loadData();
  } catch (error) {
    alert(error.message || "Failed to save promotion rule.");
  }
});

rulesTableBody.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const id = button.dataset.id;
  const rule = rules.find((item) => item._id === id);
  if (!rule) return;
  if (button.dataset.action === "edit") {
    openModal(rule);
    return;
  }

  if (button.dataset.action === "delete") {
    const confirmed = confirm(
      `Delete the promotion rule from ${rule.fromLevel?.name || "this level"}?`,
    );
    if (!confirmed) return;
    try {
      await api(`/promotion-rule/${id}`, {
        method: "DELETE",
      });
      await loadData();
    } catch (error) {
      alert(error.message || "Failed to delete promotion rule.");
    }
  }
});

document
  .getElementById("openRuleModal")
  .addEventListener("click", () => openModal());
document.getElementById("closeRuleModal").addEventListener("click", closeModal);
document.getElementById("cancelRule").addEventListener("click", closeModal);
searchInput.addEventListener("input", renderRules);
statusFilter.addEventListener("change", renderRules);
ruleModal.addEventListener("click", (event) => {
  if (event.target === ruleModal) {
    closeModal();
  }
});
loadData();
