import { api } from "./api.js";
import { requireAuth } from "./authorization.js";

if (!requireAuth()) {
  throw new Error("Not Authenticated");
}

const state = {
  results: [],
  students: [],
  courses: [],
  sessions: [],
  levels: [],
  currentEnrollment: null,
  deletingId: null,
};

// DOM
const tableBody = document.getElementById("resultTableBody");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const sessionFilter = document.getElementById("sessionFilter");
const levelFilter = document.getElementById("levelFilter");
const termFilter = document.getElementById("termFilter");
const resultModal = document.getElementById("resultModal");
const deleteModal = document.getElementById("deleteModal");
const resultForm = document.getElementById("resultForm");
const studentSelect = document.getElementById("student");
const enrollmentDisplay = document.getElementById("enrollmentDisplay");
const courseSelect = document.getElementById("course");
const scoreInput = document.getElementById("score");
const remarksInput = document.getElementById("remarks");
const submitButton = document.getElementById("submitResult");

// Helpers
function showModal(modal) {
  modal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function hideModal(modal) {
  modal.classList.add("hidden");
  document.body.style.overflow = "";
}

function getStudentName(student) {
  if (!student) return "Unknown Student";
  return [student.firstName, student.middleName, student.lastName]
    .filter(Boolean)
    .join(" ");
}

function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showError(message) {
  // console.error(message);
  // alert(message);
}

// Load data
async function loadStudents() {
  const response = await api("/student");
  state.students = response.data || [];
  populateStudentSelect();
}

async function loadSessions() {
  const response = await api("/session");
  state.sessions = response.data || [];
  populateSessionFilter();
}

async function loadLevels() {
  const response = await api("/levels");
  state.levels = response.data || [];
  populateLevelFilter();
}

async function loadResults() {
  try {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">
          Loading results...
        </td>
      </tr>`;

    const response = await api("/result");
    state.results = response.data || [];
    updateStats();
    renderResults();
  } catch (error) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="7" class="loading-cell">
          Failed to load results.
        </td>
      </tr>
    `;
    showError(error.message || "Failed to load results.");
  }
}

// Populate selects
function populateStudentSelect() {
  studentSelect.innerHTML = `<option value="">Select student</option>`;

  state.students.forEach((student) => {
    const option = document.createElement("option");
    option.value = student._id;
    option.textContent = getStudentName(student);
    studentSelect.appendChild(option);
  });
}

function populateSessionFilter() {
  sessionFilter.innerHTML = `<option value="">All Sessions</option>`;

  state.sessions.forEach((session) => {
    const option = document.createElement("option");
    option.value = session._id;
    option.textContent = session.name;
    sessionFilter.appendChild(option);
  });
}

function populateLevelFilter() {
  levelFilter.innerHTML = `<option value="">All Levels</option>`;

  state.levels.forEach((level) => {
    const option = document.createElement("option");
    option.value = level._id;
    option.textContent = level.name;
    levelFilter.appendChild(option);
  });
}

// Enrollment — derived from student
async function loadStudentEnrollment(studentId) {
  // Reset downstream fields
  state.currentEnrollment = null;
  enrollmentDisplay.value = "";
  courseSelect.innerHTML = `<option value="">Select student first</option>`;
  courseSelect.disabled = true;

  if (!studentId) return;

  enrollmentDisplay.value = "Loading...";

  try {
    const response = await api(
      `/enrollment?student=${encodeURIComponent(studentId)}`,
    );
    const enrollments = response.data || [];

    if (!enrollments.length) {
      enrollmentDisplay.value = "No enrolment found";
      return;
    }

    // Prefer active enrollment, fallback to first
    const enrollment =
      enrollments.find((e) => e.status === "active") || enrollments[0];

    state.currentEnrollment = enrollment;

    const session = enrollment.academicSession?.name || "—";
    const level = enrollment.level?.name || "—";
    const className = enrollment.class?.name || "—";

    enrollmentDisplay.value = `${session} — ${level} — ${className}`;

    // Load courses for the enrollment's level
    const levelId = enrollment.level?._id || enrollment.level;

    if (levelId) {
      await loadCoursesForLevel(levelId);
    }
  } catch (error) {
    enrollmentDisplay.value = "Failed to load enrolment";
    showError(error.message || "Failed to load student enrolment.");
  }
}

// Courses — filtered by level
async function loadCoursesForLevel(levelId) {
  courseSelect.disabled = true;
  courseSelect.innerHTML = `<option value="">Loading courses...</option>`;

  try {
    const response = await api(
      `/course?level=${encodeURIComponent(levelId)}&isActive=true`,
    );
    state.courses = response.data || [];

    if (!state.courses.length) {
      courseSelect.innerHTML = `<option value="">No courses found for this level</option>`;
      return;
    }

    courseSelect.innerHTML = `<option value="">Select course</option>`;

    state.courses.forEach((course) => {
      const option = document.createElement("option");
      option.value = course._id;
      option.textContent = `${course.courseCode} — ${course.courseTitle}`;
      courseSelect.appendChild(option);
    });

    courseSelect.disabled = false;
  } catch (error) {
    courseSelect.innerHTML = `<option value="">Failed to load courses</option>`;
    showError(error.message || "Failed to load courses.");
  }
}

// Results rendering
function getFilteredResults() {
  const search = searchInput.value.trim().toLowerCase();
  const sessionId = sessionFilter.value;
  const levelId = levelFilter.value;
  const termId = termFilter.value;

  return state.results.filter((result) => {
    const studentName = getStudentName(result.student).toLowerCase();
    const courseTitle = result.course?.courseTitle?.toLowerCase() || "";
    const courseCode = result.course?.courseCode?.toLowerCase() || "";

    const matchesSearch =
      !search ||
      studentName.includes(search) ||
      courseTitle.includes(search) ||
      courseCode.includes(search);

    const session = result.enrollment?.academicSession;
    const level = result.enrollment?.level;

    const matchesSession = !sessionId || session?._id === sessionId;
    const matchesLevel = !levelId || level?._id === levelId;
    const matchesTerm = !termId || result.term?._id === termId;

    return matchesSearch && matchesSession && matchesLevel && matchesTerm;
  });
}

function renderResults() {
  const results = getFilteredResults();

  if (!results.length) {
    tableBody.innerHTML = "";
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  tableBody.innerHTML = results
    .map((result) => {
      const studentName =
        [
          result.student?.firstName,
          result.student?.middleName,
          result.student?.lastName,
        ]
          .filter(Boolean)
          .join(" ") || "Unknown student";

      const courseTitle = result.course?.courseTitle || "—";
      const courseCode = result.course?.courseCode || "";
      const sessionName = result.enrollment?.academicSession?.name || "—";
      const termName = result.term?.name || "—";
      const score = Number(result.score);
      const passMark = result.course?.passMark ?? 40;
      const passed = score >= passMark;

      return `
        <tr>
          <td>
            <div class="student-name">
              ${escapeHtml(studentName)}
            </div>
          </td>

          <td>
            <div class="course-name">
              ${escapeHtml(courseTitle)}
            </div>
            <div class="course-code">
              ${escapeHtml(courseCode)}
            </div>
          </td>

          <td>${escapeHtml(sessionName)}</td>
          <td>${escapeHtml(termName)}</td>

          <td>
            <span class="score ${passed ? "score-pass" : "score-fail"}">
              ${score}%
            </span>
          </td>

          <td>
            <span class="remark">
              ${escapeHtml(result.remarks || (passed ? "Passed" : "Failed"))}
            </span>
          </td>

          <td>
            <div class="actions">
              <button
                class="action-btn delete"
                title="Delete"
                data-action="delete"
                data-id="${result._id}"
              >
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </td>
        </tr>
      `;
    })
    .join("");
}

// Statistics
function updateStats() {
  document.getElementById("totalResults").textContent = state.results.length;

  document.getElementById("firstTermResults").textContent =
    state.results.filter((result) => result.term?.name === "First").length;

  document.getElementById("secondTermResults").textContent =
    state.results.filter((result) => result.term?.name === "Second").length;

  document.getElementById("thirdTermResults").textContent =
    state.results.filter((result) => result.term?.name === "Third").length;

  populateTermFilter();
}

function populateTermFilter() {
  const uniqueTerms = new Map();

  state.results.forEach((result) => {
    if (result.term?._id) {
      uniqueTerms.set(result.term._id, result.term.name);
    }
  });

  termFilter.innerHTML = `<option value="">All Terms</option>`;

  uniqueTerms.forEach((name, id) => {
    const option = document.createElement("option");
    option.value = id;
    option.textContent = `${name} Term`;
    termFilter.appendChild(option);
  });
}

// Modal
function openCreateModal() {
  resetResultForm();
  showModal(resultModal);
}

function resetResultForm() {
  resultForm.reset();

  state.currentEnrollment = null;

  enrollmentDisplay.value = "";

  courseSelect.innerHTML = `<option value="">Select student first</option>`;
  courseSelect.disabled = true;
}

// Submit
async function submitResult(event) {
  event.preventDefault();

  const student = studentSelect.value;
  const enrollment = state.currentEnrollment?._id;
  const course = courseSelect.value;
  const score = Number(scoreInput.value);
  const remarks = remarksInput.value.trim();

  if (!student || !enrollment || !course) {
    showError("Please complete all required fields.");
    return;
  }

  if (Number.isNaN(score) || score < 0 || score > 100) {
    showError("Score must be between 0 and 100.");
    return;
  }

  try {
    submitButton.disabled = true;
    submitButton.textContent = "Saving...";

    await api("/result", {
      method: "POST",
      body: JSON.stringify({
        student,
        enrollment,
        course,
        score,
        remarks,
      }),
    });

    hideModal(resultModal);
    resetResultForm();
    await loadResults();
  } catch (error) {
    showError(error.message || "Failed to save result.");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Save Result";
  }
}

// Delete
function openDeleteModal(id) {
  state.deletingId = id;
  showModal(deleteModal);
}

async function deleteResult() {
  if (!state.deletingId) return;

  const button = document.getElementById("confirmDelete");

  try {
    button.disabled = true;
    button.textContent = "Deleting...";

    await api(`/result/${state.deletingId}`, { method: "DELETE" });

    hideModal(deleteModal);
    state.deletingId = null;
    await loadResults();
  } catch (error) {
    showError(error.message || "Failed to delete result.");
  } finally {
    button.disabled = false;
    button.textContent = "Delete";
  }
}

// Events
document
  .getElementById("openResultModal")
  .addEventListener("click", openCreateModal);

document
  .getElementById("closeResultModal")
  .addEventListener("click", () => hideModal(resultModal));

document
  .getElementById("cancelResult")
  .addEventListener("click", () => hideModal(resultModal));

document
  .getElementById("cancelDelete")
  .addEventListener("click", () => hideModal(deleteModal));

document
  .getElementById("confirmDelete")
  .addEventListener("click", deleteResult);

// Student change → derive enrollment → load courses
studentSelect.addEventListener("change", async () => {
  await loadStudentEnrollment(studentSelect.value);
});

resultForm.addEventListener("submit", submitResult);

searchInput.addEventListener("input", renderResults);
sessionFilter.addEventListener("change", renderResults);
levelFilter.addEventListener("change", renderResults);
termFilter.addEventListener("change", renderResults);

tableBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  if (button.dataset.action === "delete") {
    openDeleteModal(button.dataset.id);
  }
});

// Close modals when clicking backdrop
resultModal.addEventListener("click", (event) => {
  if (event.target === resultModal) hideModal(resultModal);
});

deleteModal.addEventListener("click", (event) => {
  if (event.target === deleteModal) hideModal(deleteModal);
});

// Initialize
async function init() {
  try {
    await Promise.all([loadStudents(), loadSessions(), loadLevels()]);
    await loadResults();
  } catch (error) {
    showError(error.message || "Failed to initialize results.");
  }
}

init();