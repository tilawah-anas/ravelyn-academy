import { api } from "./api.js";
import { requireAuth } from "./authorization.js";

if (!requireAuth()) {
  throw new Error("Not Authenticated");
}

const studentsTableBody = document.getElementById("studentsTableBody");
const studentSearch = document.getElementById("studentSearch");
const statusFilter = document.getElementById("statusFilter");
const totalStudents = document.getElementById("totalStudents");
const activeStudents = document.getElementById("activeStudents");
const graduatedStudents = document.getElementById("graduatedStudents");
const inactiveStudents = document.getElementById("inactiveStudents");
const studentModal = document.getElementById("studentModal");
const detailsModal = document.getElementById("detailsModal");
const studentForm = document.getElementById("studentForm");
const openAddStudentBtn = document.getElementById("openAddStudentBtn");
const closeStudentModal = document.getElementById("closeStudentModal");
const cancelStudentBtn = document.getElementById("cancelStudentBtn");
const closeDetailsModal = document.getElementById("closeDetailsModal");
const modalOverlay = document.getElementById("modalOverlay");
const detailsOverlay = document.getElementById("detailsOverlay");
const modalTitle = document.getElementById("modalTitle");
const modalDescription = document.getElementById("modalDescription");
const saveStudentBtn = document.getElementById("saveStudentBtn");
const studentId = document.getElementById("studentId");
const levelSelect = document.getElementById("level");
const studentDetails = document.getElementById("studentDetails");

let students = [];
let levels = [];

// formattings
const formatDate = (date) => {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
};

const formatDateForInput = (date) => {
  if (!date) return "";
  return new Date(date).toISOString().split("T")[0];
};

const capitalize = (value = "") => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const escapeHTML = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};



document.addEventListener("DOMContentLoaded", async () => {
  await loadStudents();
  await loadLevels();

  setupEventListeners();
});

// api call for all levels
const loadStudents = async () => {
  showTableMessage("Loading students...");

  try {
    const response = await api("/student");

    students = response.data || [];

    updateStatistics();
    renderStudents();
  } catch (error) {
    console.error("Failed to load students:", error);

    showTableMessage(error.message || "Unable to load students.");
  }
};

const loadLevels = async () => {
  try {
    const response = await api("/levels");

    levels = response.data || [];

    populateLevels();
  } catch (error) {
    console.error("Failed to load levels:", error);
  }
};


const renderStudents = () => {
  const searchTerm = studentSearch.value.trim().toLowerCase();
  const selectedStatus = statusFilter.value;

  const filteredStudents = students.filter((student) => {
    const fullName = [student.firstName, student.middleName, student.lastName]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = fullName.includes(searchTerm);

    const matchesStatus = selectedStatus === "all" || student.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  if (!filteredStudents.length) {
    studentsTableBody.innerHTML = "";
    showTableMessage("No students found.");

    return;
  }

  hideTableMessage();

  studentsTableBody.innerHTML = filteredStudents
    .map((student) => {
      const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
      const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();
      const studentId = `${student.studentId}`
      const levelName = student.level?.name ?? "—";

      return `
                <tr>
                    <td>
                        <div class="student-cell">
                            <div class="student-avatar"> ${initials} </div>
                            <div><strong>${escapeHTML(fullName)}</strong></div>
                        </div>
                    </td>
                    <td> ${studentId || '-'} </td>
                    <td> ${student.gender || "—"} </td>
                    <td> ${formatDate(student.dateOfBirth)} </td>
                    <td> ${escapeHTML(levelName || "—")} </td>
                    <td> <span class="status status-${student.status}"> ${capitalize(student.status)} </span> </td>
                    <td> ${formatDate(student.admissionDate)} </td>
                    <td>
                        <div class="table-actions">
                            <button class="icon-btn" title="View student" data-action="view" data-id="${student._id}" >
                                <i class="fa-regular fa-eye"></i>
                            </button>
                            <button class="icon-btn" title="Edit student" data-action="edit" data-id="${student._id}">
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button class="icon-btn danger" title="Delete student" data-action="delete" data-id="${student._id}" >
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
    }).join("");
};


const updateStatistics = () => {
  const total = students.length;

  const active = students.filter(
    (student) => student.status === "active",
  ).length;

  const graduated = students.filter(
    (student) => student.status === "graduated",
  ).length;

  const inactive = students.filter((student) =>
    ["withdrawn", "expelled"].includes(student.status),
  ).length;

  totalStudents.textContent = total;
  activeStudents.textContent = active;
  graduatedStudents.textContent = graduated;
  inactiveStudents.textContent = inactive;
};


const populateLevels = () => {
  levelSelect.innerHTML = `<option value="">Select level</option> `;
  levels.forEach((level) => {
    const option = document.createElement("option");

    option.value = level._id;
    option.textContent = level.name;

    levelSelect.appendChild(option);
  });
};

const openAddModal = () => {
  studentForm.reset();
  studentId.value = "";
  modalTitle.textContent = "Add Student";
  modalDescription.textContent = "Add a new student to the academy.";
  saveStudentBtn.textContent = "Save Student";
  studentModal.classList.remove("hidden");
};

const openEditModal = (student) => {
  studentId.value = student._id;
  document.getElementById("firstName").value = student.firstName || "";
  document.getElementById("lastName").value = student.lastName || "";
  document.getElementById("middleName").value = student.middleName || "";
  document.getElementById("gender").value = student.gender || "";
  document.getElementById("dateOfBirth").value = formatDateForInput(
    student.dateOfBirth,
  );
  document.getElementById("admissionDate").value = formatDateForInput(
    student.admissionDate,
  );

  document.getElementById("address").value = student.address || "";
  const levelId = typeof student.level === "object" ? student.level?._id : student.level;
  levelSelect.value = levelId || "";
  modalTitle.textContent = "Edit Student";
  modalDescription.textContent = "Update the student's information.";
  saveStudentBtn.textContent = "Update Student";
  studentModal.classList.remove("hidden");
};

// adding or editing, PATCH or POST
const saveStudent = async (event) => {
  event.preventDefault();
  const id = studentId.value;
  const payload = {
    firstName: document.getElementById("firstName").value.trim(),
    lastName: document.getElementById("lastName").value.trim(),
    middleName: document.getElementById("middleName").value.trim(),
    gender: document.getElementById("gender").value || undefined,
    dateOfBirth: document.getElementById("dateOfBirth").value,
    admissionDate: document.getElementById("admissionDate").value || undefined,
    level: levelSelect.value,
    address: document.getElementById("address").value.trim(),
  };

  saveStudentBtn.disabled = true;
  try {
    if (id) {
      await api(`/student/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
    } else {
      await api("/student", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }

    closeStudentModalHandler();

    await loadStudents();
  } catch (error) {
    console.error("Failed to save student:", error);

    alert(error.message || "Failed to save student.");
  } finally {
    saveStudentBtn.disabled = false;
  }
};

// student details
const viewStudent = async (id) => {
  try {
    const response = await api(`/student/${id}`);
    const student = response.data;
    renderStudentDetails(student);
    detailsModal.classList.remove("hidden");
  } catch (error) {
    console.error(error)
    alert(error.message || "Unable to load student details.");
  }
};

const renderStudentDetails = (student) => {
    console.log(student.level);
  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
  const levelName = student.level?.name ?? "—";
  studentDetails.innerHTML = `
        <div class="details-profile">
            <div class="details-avatar">
                ${student.firstName?.[0] || ""}
                ${student.lastName?.[0] || ""}
            </div>
            <div>
                <h3>${escapeHTML(fullName)}</h3>
                <span class="status status-${student.status}">
                    ${capitalize(student.status)}
                </span>
            </div>
        </div>
        <div class="details-grid">
            <div class="detail-item">
                <span>First Name</span>
                <strong>${escapeHTML(student.firstName)}</strong>
            </div>
            <div class="detail-item">
                <span>Last Name</span>
                <strong>${escapeHTML(student.lastName)}</strong>
            </div>
            <div class="detail-item">
                <span>Middle Name</span>
                <strong>${escapeHTML(student.middleName || "—")}</strong>
            </div>
            <div class="detail-item">
                <span>Gender</span>
                <strong>${student.gender || "—"}</strong>
            </div>
            <div class="detail-item">
                <span>Date of Birth</span>
                <strong>${formatDate(student.dateOfBirth)}</strong>
            </div>
            <div class="detail-item">
                <span>Admission Date</span>
                <strong>${formatDate(student.admissionDate)}</strong>
            </div>
            <div class="detail-item">
                <span>Level</span>
                <strong>${escapeHTML(levelName || "—")}</strong>
            </div>
            <div class="detail-item">
                <span>Address</span>
                <strong>${escapeHTML(student.address || "—")}</strong>
            </div>
        </div>
    `;
};

// dekete
const deleteStudent = async (id) => {
  const student = students.find((student) => student._id === id);
  if (!student) return;
  const fullName = [student.firstName, student.lastName].join(" ");
  const confirmed = confirm(`Are you sure you want to delete ${fullName}?`);
  if (!confirmed) return;
  try {
    await api(`/student/${id}`, {
      method: "DELETE",
    });

    await loadStudents();
  } catch (error) {
    console.error(error);

    alert(error.message || "Failed to delete student.");
  }
};

// listeners
const setupEventListeners = () => {
  openAddStudentBtn.addEventListener("click", openAddModal);
  closeStudentModal.addEventListener("click", closeStudentModalHandler);
  cancelStudentBtn.addEventListener("click", closeStudentModalHandler);
  modalOverlay.addEventListener("click", closeStudentModalHandler);
  closeDetailsModal.addEventListener("click", closeDetailsModalHandler);
  detailsOverlay.addEventListener("click", closeDetailsModalHandler);
  studentForm.addEventListener("submit", saveStudent);
  studentSearch.addEventListener("input", renderStudents);
  statusFilter.addEventListener("change", renderStudents);
  studentsTableBody.addEventListener("click", handleTableAction);
};

const handleTableAction = (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  const action = button.dataset.action;
  const id = button.dataset.id;
  if (action === "view") {
    viewStudent(id);
  } else if (action === "edit") {
    const student = students.find((student) => student._id === id);
    if (student) {
      openEditModal(student);
    }
  } else if (action === "delete") {
    deleteStudent(id);
  }
};


const closeStudentModalHandler = () => {
  studentModal.classList.add("hidden");
  studentForm.reset();
  studentId.value = "";
};


const closeDetailsModalHandler = () => {
  detailsModal.classList.add("hidden");
};


const showTableMessage = (message) => {
  const tableMessage = document.getElementById("tableMessage");
  tableMessage.textContent = message;
  tableMessage.classList.remove("hidden");
};

const hideTableMessage = () => {
  const tableMessage = document.getElementById("tableMessage");
  tableMessage.classList.add("hidden");
};

