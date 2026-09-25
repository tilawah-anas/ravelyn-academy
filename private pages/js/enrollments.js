// import { api } from "./api.js";
// import { requireAuth } from "./authorization.js";

// if (!requireAuth()) {
//     throw new Error("Not Authenticated");
// }


// const state = {
//     enrollments: [],
//     students: [],
//     sessions: [],
//     levels: [],
//     classes: [],
//     editingId: null,
//     deletingId: null,
// };


// // DOM
// const tableBody = document.getElementById("enrollmentTableBody");
// const emptyState = document.getElementById("emptyState");

// const searchInput = document.getElementById("searchInput");
// const sessionFilter = document.getElementById("sessionFilter");
// const levelFilter = document.getElementById("levelFilter");
// const classFilter = document.getElementById("classFilter");
// const statusFilter = document.getElementById("statusFilter");

// const enrollmentModal = document.getElementById("enrollmentModal");
// const deleteModal = document.getElementById("deleteModal");

// const enrollmentForm = document.getElementById("enrollmentForm");

// const enrollmentId = document.getElementById("enrollmentId");
// const studentSelect = document.getElementById("student");
// const sessionSelect = document.getElementById("academicSession");
// const levelSelect = document.getElementById("level");
// const classSelect = document.getElementById("class");
// const statusSelect = document.getElementById("status");

// const modalTitle = document.getElementById("modalTitle");
// const submitButton = document.getElementById("submitEnrollment");


// // Helpers

// function showModal(modal) {
//     modal.classList.remove("hidden");
//     document.body.style.overflow = "hidden";
// }


// function hideModal(modal) {
//     modal.classList.add("hidden");
//     document.body.style.overflow = "";
// }


// function getStudentName(student) {
//     if (!student) return "Unknown Student";

//     return [
//         student.firstName,
//         student.middleName,
//         student.lastName
//     ]
//         .filter(Boolean)
//         .join(" ");
// }


// function formatStatus(status) {
//     if (!status) return "";

//     return status.charAt(0).toUpperCase() + status.slice(1);
// }


// function getStatusClass(status) {
//     return `status-${status}`;
// }


// // function showError(message) {
// //     console.error(message);
// //     alert(message);
// // }


// // API loaders
// async function loadStudents() {
//     const response = await api("/student");
//     state.students = response.data || [];
//     populateStudentSelect();
// }

// async function loadSessions() {
//     const response = await api("/session");
//     state.sessions = response.data || [];
//     populateSessionSelect();
//     populateSessionFilter();
// }


// async function loadLevels() {
//     const response = await api("/levels");

//     state.levels = response.data || [];

//     populateLevelSelect();
//     populateLevelFilter();
// }


// async function loadClasses(levelId = "") {

//     const endpoint = levelId
//         ? `/class?level=${encodeURIComponent(levelId)}`
//         : "/class";

//     const response = await api(endpoint);

//     state.classes = response.data || [];

//     populateClassSelect();
//     populateClassFilter();
// }


// // Select population

// function populateStudentSelect(selectedId = "") {

//     studentSelect.innerHTML = `
//         <option value="">Select student</option>
//     `;

//     state.students.forEach(student => {

//         const option = document.createElement("option");

//         option.value = student._id;
//         option.textContent = getStudentName(student);

//         if (student._id === selectedId) {
//             option.selected = true;
//         }

//         studentSelect.appendChild(option);
//     });
// }


// function populateSessionSelect(selectedId = "") {

//     sessionSelect.innerHTML = `
//         <option value="">Select session</option>
//     `;

//     state.sessions.forEach(session => {

//         const option = document.createElement("option");

//         option.value = session._id;
//         option.textContent = session.name;

//         if (session._id === selectedId) {
//             option.selected = true;
//         }

//         sessionSelect.appendChild(option);
//     });
// }


// function populateSessionFilter() {

//     sessionFilter.innerHTML = `
//         <option value="">All Sessions</option>
//     `;

//     state.sessions.forEach(session => {

//         const option = document.createElement("option");

//         option.value = session._id;
//         option.textContent = session.name;

//         sessionFilter.appendChild(option);
//     });
// }


// function populateLevelSelect(selectedId = "") {

//     levelSelect.innerHTML = `
//         <option value="">Select level</option>
//     `;

//     state.levels.forEach(level => {

//         const option = document.createElement("option");

//         option.value = level._id;
//         option.textContent = level.name;

//         if (level._id === selectedId) {
//             option.selected = true;
//         }

//         levelSelect.appendChild(option);
//     });
// }


// function populateLevelFilter() {

//     levelFilter.innerHTML = `
//         <option value="">All Levels</option>
//     `;

//     state.levels.forEach(level => {

//         const option = document.createElement("option");

//         option.value = level._id;
//         option.textContent = level.name;

//         levelFilter.appendChild(option);
//     });
// }


// function populateClassSelect(selectedId = "") {

//     classSelect.innerHTML = `
//         <option value="">Select class</option>
//     `;

//     classSelect.disabled = !levelSelect.value;

//     state.classes.forEach(classItem => {

//         const option = document.createElement("option");

//         option.value = classItem._id;
//         option.textContent = classItem.name;

//         if (classItem._id === selectedId) {
//             option.selected = true;
//         }

//         classSelect.appendChild(option);
//     });
// }


// function populateClassFilter() {

//     classFilter.innerHTML = `
//         <option value="">All Classes</option>
//     `;

//     state.classes.forEach(classItem => {

//         const option = document.createElement("option");

//         option.value = classItem._id;
//         option.textContent = classItem.name;

//         classFilter.appendChild(option);
//     });
// }


// // Enrolments

// async function loadEnrollments() {

//     try {

//         tableBody.innerHTML = `
//             <tr>
//                 <td colspan="6" class="loading-cell">
//                     Loading enrolments...
//                 </td>
//             </tr>
//         `;

//         const response = await api("/enrollment");

//         state.enrollments = response.data || [];

//         updateStats();
//         renderEnrollments();

//     } catch (error) {

//         tableBody.innerHTML = `
//             <tr>
//                 <td colspan="6" class="loading-cell">
//                     Failed to load enrolments.
//                 </td>
//             </tr>
//         `;

//         showError(error.message || "Failed to load enrolments.");
//     }
// }


// function getFilteredEnrollments() {

//     const search = searchInput.value
//         .trim()
//         .toLowerCase();

//     const sessionId = sessionFilter.value;
//     const levelId = levelFilter.value;
//     const classId = classFilter.value;
//     const status = statusFilter.value;


//     return state.enrollments.filter(enrollment => {

//         const studentName = getStudentName(
//             enrollment.student
//         ).toLowerCase();

//         const matchesSearch =
//             !search ||
//             studentName.includes(search);


//         const matchesSession =
//             !sessionId ||
//             enrollment.academicSession?._id === sessionId;


//         const matchesLevel =
//             !levelId ||
//             enrollment.level?._id === levelId;


//         const matchesClass =
//             !classId ||
//             enrollment.class?._id === classId;


//         const matchesStatus =
//             !status ||
//             enrollment.status === status;


//         return (
//             matchesSearch &&
//             matchesSession &&
//             matchesLevel &&
//             matchesClass &&
//             matchesStatus
//         );
//     });
// }


// function renderEnrollments() {

//     const enrollments = getFilteredEnrollments();

//     if (!enrollments.length) {

//         tableBody.innerHTML = "";

//         emptyState.classList.remove("hidden");

//         return;
//     }

//     emptyState.classList.add("hidden");


//     tableBody.innerHTML = enrollments
//         .map(enrollment => {

//             const studentName =
//                 getStudentName(enrollment.student);


//             const sessionName =
//                 enrollment.academicSession?.name || "—";


//             const levelName =
//                 enrollment.class.level?.name || "—";


//             const className =
//                 enrollment.class?.name || "—";


//             const status =
//                 enrollment.status || "active";


//             return `
//                 <tr>

//                     <td>
//                         <div class="student-name">
//                             ${escapeHtml(studentName)}
//                         </div>
//                     </td>


//                     <td>
//                         ${escapeHtml(sessionName)}
//                     </td>


//                     <td>
//                         ${escapeHtml(levelName)}
//                     </td>


//                     <td>
//                         ${escapeHtml(className)}
//                     </td>


//                     <td>
//                         <span class="status-badge ${getStatusClass(status)}">
//                             ${formatStatus(status)}
//                         </span>
//                     </td>


//                     <td>

//                         <div class="actions">

//                             <button
//                                 class="action-btn"
//                                 title="Edit"
//                                 data-action="edit"
//                                 data-id="${enrollment._id}"
//                             >
//                                 <i class="fa-solid fa-pen"></i>
//                             </button>


//                             <button
//                                 class="action-btn delete"
//                                 title="Delete"
//                                 data-action="delete"
//                                 data-id="${enrollment._id}"
//                             >
//                                 <i class="fa-solid fa-trash"></i>
//                             </button>

//                         </div>

//                     </td>

//                 </tr>
//             `;

//         })
//         .join("");
// }


// // Stats

// function updateStats() {

//     const total =
//         state.enrollments.length;


//     const active =
//         state.enrollments.filter(
//             item => item.status === "active"
//         ).length;


//     const completed =
//         state.enrollments.filter(
//             item => item.status === "completed"
//         ).length;


//     const currentSession =
//         state.sessions.find(
//             session => session.isCurrent
//         );


//     const currentCount =
//         currentSession
//             ? state.enrollments.filter(
//                 enrollment =>
//                     enrollment.academicSession?._id === currentSession._id
//             ).length
//             : 0;


//     document.getElementById("totalEnrollments").textContent =
//         total;

//     document.getElementById("activeEnrollments").textContent =
//         active;

//     document.getElementById("completedEnrollments").textContent =
//         completed;

//     document.getElementById("currentSessionEnrollments").textContent =
//         currentCount;
// }


// // Modal

// function openCreateModal() {

//     state.editingId = null;

//     enrollmentForm.reset();

//     enrollmentId.value = "";

//     modalTitle.textContent = "Add Enrolment";

//     submitButton.textContent = "Save Enrolment";

//     statusSelect.value = "active";

//     classSelect.innerHTML = `
//         <option value="">Select level first</option>
//     `;

//     classSelect.disabled = true;

//     showModal(enrollmentModal);
// }


// async function openEditModal(id) {

//     try {

//         const response =
//             await api(`/enrollment/${id}`);

//         const enrollment =
//             response.data;


//         if (!enrollment) {
//             throw new Error("Enrollment not found.");
//         }


//         state.editingId = id;

//         enrollmentId.value = id;

//         modalTitle.textContent = "Edit Enrolment";

//         submitButton.textContent = "Update Enrolment";


//         populateStudentSelect(
//             enrollment.student?._id
//         );


//         populateSessionSelect(
//             enrollment.academicSession?._id
//         );


//         populateLevelSelect(
//             enrollment.level?._id
//         );


//         await loadClasses(
//             enrollment.level?._id
//         );


//         populateClassSelect(
//             enrollment.class?._id
//         );


//         statusSelect.value =
//             enrollment.status || "active";


//         showModal(enrollmentModal);

//     } catch (error) {

//         // showError(
//         //     error.message || "Failed to load enrollment."
//         // );
//     }
// }


// async function submitEnrollmentForm(event) {

//     event.preventDefault();


//     const payload = {

//         student: studentSelect.value,

//         academicSession:
//             sessionSelect.value,

//         // level: levelSelect.value,

//         class:
//             classSelect.value,

//         status:
//             statusSelect.value,

//     };


//     if (
//         !payload.student ||
//         !payload.academicSession ||
//         // !payload.level ||
//         !payload.class
//     ) {
//         showError("Please complete all required fields.");
//         return;
//     }


//     try {

//         submitButton.disabled = true;

//         submitButton.textContent =
//             state.editingId
//                 ? "Updating..."
//                 : "Saving...";


//         if (state.editingId) {

//             await api(
//                 `/enrollment/${state.editingId}`,
//                 {
//                     method: "PATCH",
//                     body: JSON.stringify(payload),
//                 }
//             );

//         } else {

//             await api(
//                 "/enrollment",
//                 {
//                     method: "POST",
//                     body: JSON.stringify(payload),
//                 }
//             );
//         }


//         hideModal(enrollmentModal);

//         await loadEnrollments();

//     } catch (error) {

//         showError(
//             error.message ||
//             "Failed to save enrolment."
//         );

//     } finally {

//         submitButton.disabled = false;

//         submitButton.textContent =
//             state.editingId
//                 ? "Update Enrolment"
//                 : "Save Enrolment";
//     }
// }


// // Delete

// function openDeleteModal(id) {

//     state.deletingId = id;

//     showModal(deleteModal);
// }


// async function deleteEnrollment() {

//     if (!state.deletingId) return;


//     const button =
//         document.getElementById("confirmDelete");


//     try {

//         button.disabled = true;

//         button.textContent = "Deleting...";


//         await api(
//             `/enrollment/${state.deletingId}`,
//             {
//                 method: "DELETE",
//             }
//         );


//         hideModal(deleteModal);

//         state.deletingId = null;

//         await loadEnrollments();

//     } catch (error) {

//         showError(
//             error.message ||
//             "Failed to delete enrolment."
//         );

//     } finally {

//         button.disabled = false;

//         button.textContent = "Delete";
//     }
// }


// // Escape HTML

// function escapeHtml(value) {

//     if (value === null || value === undefined) {
//         return "";
//     }

//     return String(value)
//         .replaceAll("&", "&amp;")
//         .replaceAll("<", "&lt;")
//         .replaceAll(">", "&gt;")
//         .replaceAll('"', "&quot;")
//         .replaceAll("'", "&#039;");
// }


// // Events

// document
//     .getElementById("openEnrollmentModal")
//     .addEventListener(
//         "click",
//         openCreateModal
//     );


// document
//     .getElementById("closeEnrollmentModal")
//     .addEventListener(
//         "click",
//         () => hideModal(enrollmentModal)
//     );


// document
//     .getElementById("cancelEnrollment")
//     .addEventListener(
//         "click",
//         () => hideModal(enrollmentModal)
//     );


// document
//     .getElementById("cancelDelete")
//     .addEventListener(
//         "click",
//         () => hideModal(deleteModal)
//     );


// document
//     .getElementById("confirmDelete")
//     .addEventListener(
//         "click",
//         deleteEnrollment
//     );


// enrollmentForm.addEventListener(
//     "submit",
//     submitEnrollmentForm
// );


// levelSelect.addEventListener(
//     "change",
//     async () => {

//         if (!levelSelect.value) {

//             classSelect.innerHTML = `
//                 <option value="">Select level first</option>
//             `;

//             classSelect.disabled = true;

//             return;
//         }


//         try {

//             await loadClasses(
//                 levelSelect.value
//             );

//         } catch (error) {

//             showError(
//                 error.message ||
//                 "Failed to load classes."
//             );
//         }
//     }
// );


// searchInput.addEventListener(
//     "input",
//     renderEnrollments
// );


// sessionFilter.addEventListener(
//     "change",
//     renderEnrollments
// );


// levelFilter.addEventListener(
//     "change",
//     async () => {

//         if (levelFilter.value) {

//             try {

//                 await loadClasses(
//                     levelFilter.value
//                 );

//             } catch (error) {

//                 showError(
//                     error.message ||
//                     "Failed to load classes."
//                 );
//             }

//         } else {

//             await loadClasses();
//         }

//         renderEnrollments();
//     }
// );


// classFilter.addEventListener(
//     "change",
//     renderEnrollments
// );


// statusFilter.addEventListener(
//     "change",
//     renderEnrollments
// );


// tableBody.addEventListener(
//     "click",
//     event => {

//         const button =
//             event.target.closest("[data-action]");

//         if (!button) return;


//         const action =
//             button.dataset.action;

//         const id =
//             button.dataset.id;


//         if (action === "edit") {
//             openEditModal(id);
//         }


//         if (action === "delete") {
//             openDeleteModal(id);
//         }
//     }
// );


// // Close modal when clicking outside

// enrollmentModal.addEventListener(
//     "click",
//     event => {

//         if (event.target === enrollmentModal) {
//             hideModal(enrollmentModal);
//         }
//     }
// );


// deleteModal.addEventListener(
//     "click",
//     event => {

//         if (event.target === deleteModal) {
//             hideModal(deleteModal);
//         }
//     }
// );


// // Init

// async function init() {

//     try {

//         await Promise.all([
//             loadStudents(),
//             loadSessions(),
//             loadLevels(),
//         ]);

//         await loadClasses();

//         await loadEnrollments();

//     } catch (error) {

//         // showError(
//         //     error.message ||
//         //     "Failed to initialize enrolments."
//         // );
//     }
// }


// init();

import { api } from "./api.js";
import { requireAuth } from "./authorization.js";

if (!requireAuth()) {
    throw new Error("Not Authenticated");
}


const state = {
    enrollments: [],
    students: [],
    sessions: [],
    levels: [],
    classes: [],
    activeSession: null,
    editingId: null,
    deletingId: null,
};


// DOM

const tableBody = document.getElementById("enrollmentTableBody");
const emptyState = document.getElementById("emptyState");

const searchInput = document.getElementById("searchInput");
const sessionFilter = document.getElementById("sessionFilter");
const levelFilter = document.getElementById("levelFilter");
const classFilter = document.getElementById("classFilter");
const statusFilter = document.getElementById("statusFilter");

const enrollmentModal = document.getElementById("enrollmentModal");
const deleteModal = document.getElementById("deleteModal");

const enrollmentForm = document.getElementById("enrollmentForm");

const enrollmentId = document.getElementById("enrollmentId");
const studentSelect = document.getElementById("student");
const classSelect = document.getElementById("class");
const statusSelect = document.getElementById("status");
const academicSessionDisplay = document.getElementById("academicSessionDisplay");
const levelDisplay = document.getElementById("levelDisplay");

const modalTitle = document.getElementById("modalTitle");
const submitButton = document.getElementById("submitEnrollment");


// Helpers

function showModal(modal) {
    modal.classList.remove("hidden");
    document.body.style.overflow = "hidden";
}

function hideModal(modal) {
    modal.classList.add("hidden");
    document.body.style.overflow = "";
}

function showError(message) {
    console.error(message);
    alert(message);
}

function getStudentName(student) {
    if (!student) return "Unknown Student";
    return [student.firstName, student.middleName, student.lastName]
        .filter(Boolean)
        .join(" ");
}

function formatStatus(status) {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1);
}

function getStatusClass(status) {
    return `status-${status}`;
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


// API loaders

async function loadStudents() {
    const response = await api("/student");
    state.students = response.data || [];
    populateStudentSelect();
}

async function loadSessions() {
    const response = await api("/session");
    state.sessions = response.data || [];
    state.activeSession = state.sessions.find(s => s.status === "active") || null;
    populateSessionFilter();
}

async function loadLevels() {
    const response = await api("/levels");
    state.levels = response.data || [];
    populateLevelFilter();
}

async function fetchClasses(levelId = "") {
    const endpoint = levelId
        ? `/class?level=${encodeURIComponent(levelId)}`
        : "/class";
    const response = await api(endpoint);
    return response.data || [];
}


// Select population

function populateStudentSelect(selectedId = "") {
    studentSelect.innerHTML = `<option value="">Select student</option>`;
    state.students.forEach(student => {
        const option = document.createElement("option");
        option.value = student._id;
        option.textContent = getStudentName(student);
        if (student._id === selectedId) option.selected = true;
        studentSelect.appendChild(option);
    });
}

function populateSessionFilter() {
    sessionFilter.innerHTML = `<option value="">All Sessions</option>`;
    state.sessions.forEach(session => {
        const option = document.createElement("option");
        option.value = session._id;
        option.textContent = session.name;
        sessionFilter.appendChild(option);
    });
}

function populateLevelFilter() {
    levelFilter.innerHTML = `<option value="">All Levels</option>`;
    state.levels.forEach(level => {
        const option = document.createElement("option");
        option.value = level._id;
        option.textContent = level.name;
        levelFilter.appendChild(option);
    });
}

function populateClassFilter(classes) {
    classFilter.innerHTML = `<option value="">All Classes</option>`;
    classes.forEach(classItem => {
        const option = document.createElement("option");
        option.value = classItem._id;
        option.textContent = classItem.name;
        classFilter.appendChild(option);
    });
}

function populateClassSelect(classes, selectedId = "") {
    if (!classes.length) {
        classSelect.innerHTML = `<option value="">No classes available</option>`;
        classSelect.disabled = true;
        return;
    }

    classSelect.innerHTML = `<option value="">Select class</option>`;

    classes.forEach(classItem => {
        const option = document.createElement("option");
        option.value = classItem._id;
        option.textContent = classItem.name;
        if (classItem._id === selectedId) option.selected = true;
        classSelect.appendChild(option);
    });

    classSelect.disabled = false;
}


// Enrolments

async function loadEnrollments() {
    try {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    Loading enrolments...
                </td>
            </tr>
        `;

        const response = await api("/enrollment");
        state.enrollments = response.data || [];

        updateStats();
        renderEnrollments();

    } catch (error) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="loading-cell">
                    Failed to load enrolments.
                </td>
            </tr>
        `;
        showError(error.message || "Failed to load enrolments.");
    }
}

function getFilteredEnrollments() {
    const search = searchInput.value.trim().toLowerCase();
    const sessionId = sessionFilter.value;
    const levelId = levelFilter.value;
    const classId = classFilter.value;
    const status = statusFilter.value;

    return state.enrollments.filter(enrollment => {
        const studentName = getStudentName(enrollment.student).toLowerCase();

        const matchesSearch = !search || studentName.includes(search);
        const matchesSession = !sessionId || enrollment.academicSession?._id === sessionId;
        const matchesLevel = !levelId || enrollment.level?._id === levelId;
        const matchesClass = !classId || enrollment.class?._id === classId;
        const matchesStatus = !status || enrollment.status === status;

        return (
            matchesSearch &&
            matchesSession &&
            matchesLevel &&
            matchesClass &&
            matchesStatus
        );
    });
}

function renderEnrollments() {
    const enrollments = getFilteredEnrollments();

    if (!enrollments.length) {
        tableBody.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");

    tableBody.innerHTML = enrollments.map(enrollment => {
        const studentName = getStudentName(enrollment.student);
        const sessionName = enrollment.academicSession?.name || "—";
        const levelName = enrollment.level?.name || enrollment.class?.level?.name || "—";
        const className = enrollment.class?.name || "—";
        const status = enrollment.status || "active";

        return `
            <tr>
                <td>
                    <div class="student-name">
                        ${escapeHtml(studentName)}
                    </div>
                </td>

                <td>${escapeHtml(sessionName)}</td>
                <td>${escapeHtml(levelName)}</td>
                <td>${escapeHtml(className)}</td>

                <td>
                    <span class="status-badge ${getStatusClass(status)}">
                        ${formatStatus(status)}
                    </span>
                </td>

                <td>
                    <div class="actions">
                        <button
                            class="action-btn"
                            title="Edit"
                            data-action="edit"
                            data-id="${enrollment._id}"
                        >
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button
                            class="action-btn delete"
                            title="Delete"
                            data-action="delete"
                            data-id="${enrollment._id}"
                        >
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}


// Stats

function updateStats() {
    const total = state.enrollments.length;
    const active = state.enrollments.filter(item => item.status === "active").length;
    const completed = state.enrollments.filter(item => item.status === "completed").length;

    const currentSession = state.sessions.find(session => session.isCurrent);

    const currentCount = currentSession
        ? state.enrollments.filter(
            enrollment => enrollment.academicSession?._id === currentSession._id
        ).length
        : 0;

    document.getElementById("totalEnrollments").textContent = total;
    document.getElementById("activeEnrollments").textContent = active;
    document.getElementById("completedEnrollments").textContent = completed;
    document.getElementById("currentSessionEnrollments").textContent = currentCount;
}


// Modal — Create

async function openCreateModal() {
    // Always refetch — session may have changed in another tab
    try {
        await loadSessions();
    } catch {
        // fall through — will use whatever state we have
    }

    if (!state.activeSession) {
        alert("No active session. Activate one before enrolling students.");
        return;
    }

    state.editingId = null;

    enrollmentForm.reset();
    enrollmentId.value = "";

    modalTitle.textContent = "Add Enrolment";
    submitButton.textContent = "Save Enrolment";

    academicSessionDisplay.value = state.activeSession.name;
    levelDisplay.value = "";

    classSelect.innerHTML = `<option value="">Select a student first</option>`;
    classSelect.disabled = true;

    statusSelect.value = "active";

    showModal(enrollmentModal);
}


// Modal — Edit

async function openEditModal(id) {
    try {
        const response = await api(`/enrollment/${id}`);
        const enrollment = response.data;

        if (!enrollment) throw new Error("Enrollment not found.");

        state.editingId = id;
        enrollmentId.value = id;

        modalTitle.textContent = "Edit Enrolment";
        submitButton.textContent = "Update Enrolment";

        // Student
        populateStudentSelect(enrollment.student?._id ?? enrollment.student);

        // Session — from the enrollment, not the active session
        academicSessionDisplay.value = enrollment.academicSession?.name ?? "—";

        // Level — from the enrollment
        levelDisplay.value = enrollment.level?.name ?? "—";

        // Classes for the enrollment's level, then select its class
        const levelId = enrollment.level?._id ?? enrollment.level;
        const classId = enrollment.class?._id ?? enrollment.class;

        if (levelId) {
            const classes = await fetchClasses(levelId);
            populateClassSelect(classes, classId);
        } else {
            classSelect.innerHTML = `<option value="">No classes available</option>`;
            classSelect.disabled = true;
        }

        statusSelect.value = enrollment.status || "active";

        showModal(enrollmentModal);

    } catch (error) {
        showError(error.message || "Failed to load enrollment.");
    }
}


// Submit

async function submitEnrollmentForm(event) {
    event.preventDefault();

    const payload = {
        student: studentSelect.value,
        class: classSelect.value,
        status: statusSelect.value,
        // academicSession and level are intentionally omitted —
        // the backend derives them from the active session and the student.
    };

    if (!payload.student || !payload.class) {
        showError("Please select a student and a class.");
        return;
    }

    try {
        submitButton.disabled = true;
        submitButton.textContent = state.editingId ? "Updating..." : "Saving...";

        if (state.editingId) {
            await api(`/enrollment/${state.editingId}`, {
                method: "PATCH",
                body: JSON.stringify(payload),
            });
        } else {
            await api("/enrollment", {
                method: "POST",
                body: JSON.stringify(payload),
            });
        }

        hideModal(enrollmentModal);
        await loadEnrollments();

    } catch (error) {
        showError(error.message || "Failed to save enrolment.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = state.editingId
            ? "Update Enrolment"
            : "Save Enrolment";
    }
}


// Delete

function openDeleteModal(id) {
    state.deletingId = id;
    showModal(deleteModal);
}

async function deleteEnrollment() {
    if (!state.deletingId) return;

    const button = document.getElementById("confirmDelete");

    try {
        button.disabled = true;
        button.textContent = "Deleting...";

        await api(`/enrollment/${state.deletingId}`, {
            method: "DELETE",
        });

        hideModal(deleteModal);
        state.deletingId = null;

        await loadEnrollments();

    } catch (error) {
        showError(error.message || "Failed to delete enrolment.");
    } finally {
        button.disabled = false;
        button.textContent = "Delete";
    }
}


// Events

document.getElementById("openEnrollmentModal").addEventListener("click", openCreateModal);

document.getElementById("closeEnrollmentModal").addEventListener("click", () => hideModal(enrollmentModal));
document.getElementById("cancelEnrollment").addEventListener("click", () => hideModal(enrollmentModal));
document.getElementById("cancelDelete").addEventListener("click", () => hideModal(deleteModal));
document.getElementById("confirmDelete").addEventListener("click", deleteEnrollment);

enrollmentForm.addEventListener("submit", submitEnrollmentForm);

// Student change — fills level display and loads the matching classes
studentSelect.addEventListener("change", async () => {
    const studentId = studentSelect.value;

    levelDisplay.value = "";
    classSelect.innerHTML = `<option value="">Select a student first</option>`;
    classSelect.disabled = true;

    if (!studentId) return;

    const student = state.students.find(s => s._id === studentId);

    if (!student) {
        levelDisplay.value = "—";
        return;
    }

    const level = student.level;

    const levelId = typeof level === "object" && level !== null
        ? level._id
        : level;

    const levelName = typeof level === "object" && level !== null
        ? level.name
        : "—";

    levelDisplay.value = levelName;

    if (!levelId) return;

    try {
        const classes = await fetchClasses(levelId);
        populateClassSelect(classes);
    } catch (error) {
        showError(error.message || "Failed to load classes.");
    }
});

searchInput.addEventListener("input", renderEnrollments);
sessionFilter.addEventListener("change", renderEnrollments);

levelFilter.addEventListener("change", async () => {
    try {
        const classes = await fetchClasses(levelFilter.value);
        populateClassFilter(classes);
    } catch (error) {
        showError(error.message || "Failed to load classes.");
    }
    renderEnrollments();
});

classFilter.addEventListener("change", renderEnrollments);
statusFilter.addEventListener("change", renderEnrollments);

tableBody.addEventListener("click", event => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    const id = button.dataset.id;

    if (action === "edit") openEditModal(id);
    if (action === "delete") openDeleteModal(id);
});

// Close modal when clicking outside
enrollmentModal.addEventListener("click", event => {
    if (event.target === enrollmentModal) hideModal(enrollmentModal);
});

deleteModal.addEventListener("click", event => {
    if (event.target === deleteModal) hideModal(deleteModal);
});


// Init

async function init() {
    try {
        await Promise.all([
            loadStudents(),
            loadSessions(),
            loadLevels(),
        ]);

        const classes = await fetchClasses();
        populateClassFilter(classes);

        await loadEnrollments();

    } catch (error) {
        showError(error.message || "Failed to initialize enrolments.");
    }
}

init();