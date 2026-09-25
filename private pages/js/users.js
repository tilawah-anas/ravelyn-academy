import { api } from "./api.js";
import { requireAuth } from "./authorization.js";

if (!requireAuth()) {
  throw new Error("Not authenticated");
}

const userTableBody = document.getElementById("userTableBody");
const loadingState = document.getElementById("loadingState");
const emptyState = document.getElementById("emptyState");

const totalUsers = document.getElementById("totalUsers");
const teacherUsers = document.getElementById("teacherUsers");
const studentUsers = document.getElementById("studentUsers");
const activeUsers = document.getElementById("activeUsers");

const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const statusFilter = document.getElementById("statusFilter");

const userModal = document.getElementById("userModal");
const detailsModal = document.getElementById("detailsModal");
const deactivateModal = document.getElementById("deactivateModal");

const userForm = document.getElementById("userForm");
const userType = document.getElementById("userType");

const teacherFields = document.getElementById("teacherFields");
const studentFields = document.getElementById("studentFields");

const studentSelect = document.getElementById("studentSelect");

const openUserModal = document.getElementById("openUserModal");
const closeUserModal = document.getElementById("closeUserModal");
const cancelUser = document.getElementById("cancelUser");

const closeDetailsModal = document.getElementById("closeDetailsModal");

const closeDeactivateModal = document.getElementById("closeDeactivateModal");

const cancelDeactivate = document.getElementById("cancelDeactivate");

const confirmDeactivate = document.getElementById("confirmDeactivate");

let users = [];
let students = [];
let selectedUserId = null;

/* =========================
   Helpers
========================= */

const getInitials = (firstName = "", lastName = "") => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const formatDate = (date) => {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const escapeHTML = (value = "") => {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
};

/* =========================
   Load Users
========================= */

const loadUsers = async () => {
  loadingState.classList.remove("hidden");
  emptyState.classList.add("hidden");

  try {
    const response = await api("/user");

    users = response.data || [];

    updateStats();
    renderUsers();
  } catch (error) {
    console.error("Failed to load users:", error);

    userTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="error-cell">
                    Failed to load users.
                </td>
            </tr>
        `;
  } finally {
    loadingState.classList.add("hidden");
  }
};

/* =========================
   Stats
========================= */

const updateStats = () => {
  totalUsers.textContent = users.length;

  teacherUsers.textContent = users.filter(
    (user) => user.role === "teacher",
  ).length;

  studentUsers.textContent = users.filter(
    (user) => user.role === "student",
  ).length;

  activeUsers.textContent = users.filter(
    (user) => user.isActive !== false,
  ).length;
};

/* =========================
   Filter
========================= */

const getFilteredUsers = () => {
  const search = searchInput.value.trim().toLowerCase();

  const role = roleFilter.value;
  const status = statusFilter.value;

  return users.filter((user) => {
    const fullName =
      `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();

    const email = (user.email || "").toLowerCase();

    const matchesSearch =
      !search || fullName.includes(search) || email.includes(search);

    const matchesRole = !role || user.role === role;

    const userStatus = user.isActive === false ? "inactive" : "active";

    const matchesStatus = !status || userStatus === status;

    return matchesSearch && matchesRole && matchesStatus;
  });
};

/* =========================
   Render Users
========================= */

const renderUsers = () => {
  const filteredUsers = getFilteredUsers();

  userTableBody.innerHTML = "";

  if (!filteredUsers.length) {
    emptyState.classList.remove("hidden");

    return;
  }

  emptyState.classList.add("hidden");

  filteredUsers.forEach((user) => {
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

    const isActive = user.isActive !== false;

    const row = document.createElement("tr");

    row.innerHTML = `
            <td>
                <div class="user-cell">

                    <div class="user-avatar">
                        ${getInitials(user.firstName, user.lastName)}
                    </div>

                    <div>
                        <div class="user-name">
                            ${escapeHTML(fullName)}
                        </div>
                    </div>

                </div>
            </td>

            <td>
                ${escapeHTML(user.email || "—")}
            </td>

            <td>
                <span class="role-badge role-${user.role}">
                    ${escapeHTML(user.role)}
                </span>
            </td>

            <td>
                <span class="status-badge ${
                  isActive ? "status-active" : "status-inactive"
                }">
                    ${isActive ? "Active" : "Inactive"}
                </span>
            </td>

            <td>
                ${formatDate(user.createdAt)}
            </td>

            <td>
                <div class="actions">

                    <button
                        class="action-btn"
                        title="View user"
                        data-action="view"
                        data-id="${user._id}"
                    >
                        <i class="fa-regular fa-eye"></i>
                    </button>

                    ${
                      isActive
                        ? `
                                <button
                                    class="action-btn danger"
                                    title="Deactivate user"
                                    data-action="deactivate"
                                    data-id="${user._id}"
                                >
                                    <i class="fa-solid fa-user-slash"></i>
                                </button>
                            `
                        : ""
                    }

                </div>
            </td>
        `;

    userTableBody.appendChild(row);
  });
};

/* =========================
   Load Students
========================= */

const loadStudents = async () => {
  try {
    const response = await api("/student");

    students = response.data || [];

    populateStudentSelect();
  } catch (error) {
    console.error("Failed to load students:", error);
  }
};

const populateStudentSelect = () => {
  studentSelect.innerHTML = `
        <option value="">Select student</option>
    `;

  students
    .filter((student) => !student.user)
    .forEach((student) => {
      const option = document.createElement("option");

      option.value = student._id;

      option.textContent = `${student.firstName} ${student.lastName}`;

      studentSelect.appendChild(option);
    });
};

/* =========================
   Modal
========================= */

const openModal = () => {
  userModal.classList.remove("hidden");

  userForm.reset();

  teacherFields.classList.add("hidden");
  studentFields.classList.add("hidden");

  loadStudents();
};

const closeModal = () => {
  userModal.classList.add("hidden");

  userForm.reset();

  teacherFields.classList.add("hidden");
  studentFields.classList.add("hidden");
};

const openDetails = (user) => {
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  document.getElementById("detailsAvatar").textContent = getInitials(
    user.firstName,
    user.lastName,
  );

  document.getElementById("detailsName").textContent = fullName;

  document.getElementById("detailsRole").textContent = user.role;

  document.getElementById("detailsEmail").textContent = user.email || "—";

  document.getElementById("detailsStatus").textContent =
    user.isActive === false ? "Inactive" : "Active";

  document.getElementById("detailsCreated").textContent = formatDate(
    user.createdAt,
  );

  detailsModal.classList.remove("hidden");
};

const closeDetails = () => {
  detailsModal.classList.add("hidden");
};

/* =========================
   Account Type
========================= */

userType.addEventListener("change", () => {
  teacherFields.classList.add("hidden");
  studentFields.classList.add("hidden");

  if (userType.value === "teacher") {
    teacherFields.classList.remove("hidden");
  }

  if (userType.value === "student") {
    studentFields.classList.remove("hidden");
  }
});

/* =========================
   Create User
========================= */

userForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const type = userType.value;

  if (!type) {
    alert("Select an account type.");
    return;
  }

  const submitButton = document.getElementById("submitUser");

  submitButton.disabled = true;

  try {
    let response;

    if (type === "teacher") {
      const firstName = document.getElementById("firstName").value.trim();

      const lastName = document.getElementById("lastName").value.trim();

      const email = document.getElementById("teacherEmail").value.trim();

      const password = document.getElementById("teacherPassword").value;

      if (!firstName || !lastName || !email || !password) {
        throw new Error("Please complete all teacher fields.");
      }

      response = await api("/user/teachers", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
        }),
      });
    } else {
      const studentId = studentSelect.value;

      const email = document.getElementById("studentEmail").value.trim();

      const password = document.getElementById("studentPassword").value;

      if (!studentId || !email || !password) {
        throw new Error("Please complete all student fields.");
      }

      response = await api("/user/students", {
        method: "POST",
        body: JSON.stringify({
          studentId,
          email,
          password,
        }),
      });
    }

    if (response.success === false) {
      throw new Error(response.message || "Failed to create user.");
    }

    closeModal();

    await loadUsers();
  } catch (error) {
    console.error("Create user failed:", error);

    alert(error.message || "Failed to create user.");
  } finally {
    submitButton.disabled = false;
  }
});

/* =========================
   Deactivate
========================= */

const openDeactivate = (user) => {
  selectedUserId = user._id;

  const name = `${user.firstName || ""} ${user.lastName || ""}`.trim();

  document.getElementById("deactivateUserName").textContent = name;

  deactivateModal.classList.remove("hidden");
};

const closeDeactivate = () => {
  selectedUserId = null;

  deactivateModal.classList.add("hidden");
};

const deactivateUser = async () => {
  if (!selectedUserId) return;

  confirmDeactivate.disabled = true;

  try {
    const response = await api(`/user/${selectedUserId}/deactivate`, {
      method: "PATCH",
    });

    if (response.success === false) {
      throw new Error(response.message || "Failed to deactivate user.");
    }

    closeDeactivate();

    await loadUsers();
  } catch (error) {
    console.error("Deactivate user failed:", error);

    alert(error.message || "Failed to deactivate user.");
  } finally {
    confirmDeactivate.disabled = false;
  }
};

/* =========================
   Table Actions
========================= */

userTableBody.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");

  if (!button) return;

  const userId = button.dataset.id;

  const user = users.find((item) => item._id === userId);

  if (!user) return;

  if (button.dataset.action === "view") {
    openDetails(user);
  }

  if (button.dataset.action === "deactivate") {
    openDeactivate(user);
  }
});

/* =========================
   Password Toggle
========================= */

document.querySelectorAll(".password-toggle").forEach((button) => {
  button.addEventListener("click", () => {
    const target = document.getElementById(button.dataset.target);

    const icon = button.querySelector("i");

    if (target.type === "password") {
      target.type = "text";

      icon.classList.remove("fa-eye");

      icon.classList.add("fa-eye-slash");
    } else {
      target.type = "password";

      icon.classList.remove("fa-eye-slash");

      icon.classList.add("fa-eye");
    }
  });
});

/* =========================
   Events
========================= */

openUserModal.addEventListener("click", openModal);

closeUserModal.addEventListener("click", closeModal);

cancelUser.addEventListener("click", closeModal);

closeDetailsModal.addEventListener("click", closeDetails);

closeDeactivateModal.addEventListener("click", closeDeactivate);

cancelDeactivate.addEventListener("click", closeDeactivate);

confirmDeactivate.addEventListener("click", deactivateUser);

searchInput.addEventListener("input", renderUsers);

roleFilter.addEventListener("change", renderUsers);

statusFilter.addEventListener("change", renderUsers);

/* =========================
   Close on overlay click
========================= */

[userModal, detailsModal, deactivateModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });
});

/* =========================
   Initial Load
========================= */

loadUsers();
