import { api } from "./api.js";
import { requireAuth } from "./authorization.js";

if (!requireAuth()) {
  throw new Error("Not Authenticated");
}

let levels = [];
let classes = [];

let selectedLevel = null;

// Views
const levelsView = document.getElementById("levelsView");
const classesView = document.getElementById("classesView");

// Level elements
const levelsGrid = document.getElementById("levelsGrid");
const levelSearch = document.getElementById("levelSearch");
const totalLevels = document.getElementById("totalLevels");
const totalClasses = document.getElementById("totalClasses");
const graduatingLevels = document.getElementById("graduatingLevels");
const levelsMessage = document.getElementById("levelsMessage");

// Class elements
const classesGrid = document.getElementById("classesGrid");
const classesMessage = document.getElementById("classesMessage");
const selectedLevelName = document.getElementById("selectedLevelName");
const selectedLevelDescription = document.getElementById(
  "selectedLevelDescription",
);
const summaryLevelName = document.getElementById("summaryLevelName");
const summaryLevelCode = document.getElementById("summaryLevelCode");
const summaryClassCount = document.getElementById("summaryClassCount");
const classModalLevelName = document.getElementById("classModalLevelName");

// Level modal
const levelModal = document.getElementById("levelModal");
const levelModalOverlay = document.getElementById("levelModalOverlay");
const levelForm = document.getElementById("levelForm");
const levelId = document.getElementById("levelId");
const levelName = document.getElementById("levelName");
const levelCode = document.getElementById("levelCode");
const levelDescription = document.getElementById("levelDescription");
const isGraduatingLevel = document.getElementById("isGraduatingLevel");
const levelModalTitle = document.getElementById("levelModalTitle");
const levelModalDescription = document.getElementById("levelModalDescription");
const saveLevelBtn = document.getElementById("saveLevelBtn");

// Class modal
const classModal = document.getElementById("classModal");
const classModalOverlay = document.getElementById("classModalOverlay");
const classForm = document.getElementById("classForm");
const classId = document.getElementById("classId");
const className = document.getElementById("className");
const classCapacity = document.getElementById("classCapacity");
const classModalTitle = document.getElementById("classModalTitle");
const saveClassBtn = document.getElementById("saveClassBtn");

document.addEventListener("DOMContentLoaded", async () => {
  setupEventListeners();
  await loadLevels();
});

// showmessage function
const showMessage = (element, message) => {
  element.textContent = message;
  element.classList.remove("hidden");
};

const hideMessage = (element) => {
  element.classList.add("hidden");
};

const getLevelId = (level) => {
  if (!level) return null;
  return typeof level === "object" ? level._id : level;
};

// load levels
const loadLevels = async () => {
  showMessage(levelsMessage, "Loading levels...");
  try {
    const response = await api("/levels");
    levels = response.data || [];
    await loadClasses();
    updateStatistics();
    renderLevels();
  } catch (error) {
    // console.error( "Failed to load levels:", error);
    showMessage(levelsMessage, error.message || "Failed to load levels.");
  }
};

// load classes
const loadClasses = async () => {
  try {
    const response = await api("/class");
    classes = response.data || [];
  } catch (error) {
    // console.error( "Failed to load classes:", error);
    classes = [];
  }
};

// stats
const updateStatistics = () => {
  totalLevels.textContent = levels.length;
  totalClasses.textContent = classes.length;
  graduatingLevels.textContent = levels.filter(
    (level) => level.isGraduatingLevel,
  ).length;
};

// rendre levels
const renderLevels = () => {
  const searchTerm = levelSearch.value.trim().toLowerCase();
  const filteredLevels = levels.filter((level) => {
    const name = level.name?.toLowerCase() || "";
    const code = level.code?.toLowerCase() || "";
    return name.includes(searchTerm) || code.includes(searchTerm);
  });
  if (!filteredLevels.length) {
    levelsGrid.innerHTML = "";
    showMessage(
      levelsMessage,
      searchTerm
        ? "No levels match your search."
        : "No levels have been created yet.",
    );
    return;
  }
  hideMessage(levelsMessage);

  levelsGrid.innerHTML = filteredLevels
    .map((level) => {
      const classCount = classes.filter(
        (item) => getLevelId(item.level) === level._id,
      ).length;
      return `
                <article class="level-card" data-level-id="${level._id}">
                    <div class="level-card-header">
                        <div class="level-card-icon">
                            <i class="fa-solid fa-layer-group"></i>
                        </div>
                        <div class="level-card-menu">
                            <button class="card-action" type="button" title="Edit level" data-action="edit-level" data-id="${level._id}" >
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button class="card-action danger" type="button" title="Delete level" data-action="delete-level" data-id="${level._id}">
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                    <h3> ${escapeHTML(level.name)} </h3>
                    ${
                      level.code
                        ? ` <div class="level-code"> ${escapeHTML(level.code)} </div>`
                        : ""
                    }

                    ${
                      level.description
                        ? ` <p class="level-description"> ${escapeHTML(level.description)} </p> `
                        : ` <p class="level-description"> No description provided. </p> `
                    }
                    
                    ${
                      level.isGraduatingLevel
                        ? `<span class="graduating-badge"> Graduating Level </span> `
                        : ""
                    }

                    <div class="level-card-footer">
                        <span class="level-meta">
                            <i class="fa-solid fa-chalkboard"></i>
                            ${classCount}
                            ${classCount === 1 ? "Class" : "Classes"}
                        </span>
                        <span class="level-arrow">
                            <i class="fa-solid fa-arrow-right"></i>
                        </span>
                    </div>
                </article>`;
    }).join("");
};

//level details page sjhos onclick
const openLevel = async (id) => {
  const level = levels.find((item) => item._id === id);
  if (!level) return;
  selectedLevel = level;
  selectedLevelName.textContent = level.name;
  selectedLevelDescription.textContent =
    level.description || "Manage classes for this level.";
  summaryLevelName.textContent = level.name;
  summaryLevelCode.textContent = level.code || "—";
  classModalLevelName.textContent = level.name;
  levelsView.classList.add("hidden");
  classesView.classList.remove("hidden");
  await loadClassesForLevel(id);
};

//get all current clases in a level
const loadClassesForLevel = async (levelId) => {
  showMessage(classesMessage, "Loading classes...");
  try {
    const response = await api(`/class?level=${encodeURIComponent(levelId)}`);
    const levelClasses = response.data || [];
    renderClasses(levelClasses);
  } catch (error) {
    // console.error( "Failed to load classes:", error);
    showMessage(classesMessage, error.message || "Failed to load classes.");
  }
};

//render found classes for a level
const renderClasses = (levelClasses) => {
  summaryClassCount.textContent = levelClasses.length;
  if (!levelClasses.length) {
    classesGrid.innerHTML = "";
    showMessage(
      classesMessage,
      "No classes have been created for this level yet.",
    );
    return;
  }
  hideMessage(classesMessage);
  classesGrid.innerHTML = levelClasses
    .map((classData) => {
      return `
                <article class="class-card" data-class-id="${classData._id}" >
                    <div class="class-card-header">
                        <div>
                            <div class="class-card-icon">
                                <i class="fa-solid fa-chalkboard"></i>
                            </div>
                        </div>
                        <div>
                            <button class="card-action" type="button" title="Edit class" data-action="edit-class" data-id="${classData._id}" >
                                <i class="fa-regular fa-pen-to-square"></i>
                            </button>
                            <button class="card-action danger" type="button" title="Delete class" data-action="delete-class" data-id="${classData._id}" >
                                <i class="fa-regular fa-trash-can"></i>
                            </button>
                        </div>
                    </div>
                    <h3> ${escapeHTML(classData.name)} </h3>
                    <p>${escapeHTML(classData.level?.name || selectedLevel?.name || "")}</p>
                    <div class="class-card-info">
                        <span class="capacity">
                            <i class="fa-solid fa-users"></i>
                            Capacity: ${classData.capacity ?? 30}
                        </span>
                        ${classData.isActive ? ` <span class="active-indicator"> Active </span>` : ` <span> Inactive </span>`}
                    </div>
                </article>`;
    }).join("");
};

// crud operations on a level
// add a levle modal
const openAddLevelModal = () => {
  levelForm.reset();
  levelId.value = "";
  levelModalTitle.textContent = "Add Level";
  levelModalDescription.textContent = "Create a new academic level.";
  saveLevelBtn.textContent = "Save Level";
  levelModal.classList.remove("hidden");
};

//edit level modal
const openEditLevelModal = (id) => {
  const level = levels.find((item) => item._id === id);
  if (!level) return;
  levelId.value = level._id;
  levelName.value = level.name || "";
  levelCode.value = level.code || "";
  levelDescription.value = level.description || "";
  isGraduatingLevel.checked = Boolean(level.isGraduatingLevel);
  levelModalTitle.textContent = "Edit Level";
  levelModalDescription.textContent = "Update this academic level.";
  saveLevelBtn.textContent = "Update Level";
  levelModal.classList.remove("hidden");
};

// save a level
const saveLevel = async (e) => {
  e.preventDefault();
  const id = levelId.value;
  const payload = {
    name: levelName.value.trim(),
    code: levelCode.value.trim(),
    description: levelDescription.value.trim(),
    isGraduatingLevel: isGraduatingLevel.checked,
  };
  saveLevelBtn.disabled = true;
  try {
    id
      ? await api(`/levels/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : await api("/levels", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    closeLevelModal();
    await loadLevels();
  } catch (error) {
    // console.error( "Failed to save level:", error);
    alert(error.message || "Failed to save level.");
  } finally {
    saveLevelBtn.disabled = false;
  }
};

// delete a level
const deleteLevel = async (id) => {
  const level = levels.find((item) => item._id === id);
  if (!level) return;
  const classCount = classes.filter(
    (item) => getLevelId(item.level) === id,
  ).length;

  let message = `Are you sure you want to delete "${level.name}"?`;
  if (classCount > 0) {
    message += ` This level currently has ${classCount} ${classCount === 1 ? "class" : "classes"}.`;
  }

  const confirmed = confirm(message);
  if (!confirmed) return;
  try {
    await api(`/levels/${id}`, {
      method: "DELETE",
    });
    await loadLevels();
  } catch (error) {
    console.error("Failed to delete level:", error);
    alert(error.message || "Failed to delete level.");
  }
};

// CCRUD operations for classes in leveels
// adding classes
const openAddClassModal = () => {
  if (!selectedLevel) return;
  classForm.reset();
  classId.value = "";
  classCapacity.value = 30;
  classModalTitle.textContent = "Add Class";
  saveClassBtn.textContent = "Save Class";
  classModalLevelName.textContent = selectedLevel.name;
  classModal.classList.remove("hidden");
};

// editing classes
const openEditClassModal = (id) => {
  const classData = classes.find((item) => item._id === id);
  if (!classData) return;

  classId.value = classData._id;
  className.value = classData.name || "";
  classCapacity.value = classData.capacity || 30;
  classModalTitle.textContent = "Edit Class";
  saveClassBtn.textContent = "Update Class";
  classModal.classList.remove("hidden");
};

// function for ythe save button
const saveClass = async (e) => {
  e.preventDefault();
  if (!selectedLevel) return;

  const id = classId.value;
  const payload = {
    level: selectedLevel._id,
    name: className.value.trim(),
    code: selectedLevel.code,
    capacity: Number(classCapacity.value),
  };

  saveClassBtn.disabled = true;

  try {
    id
      ? await api(`/class/${id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : await api("/class", {
          method: "POST",
          body: JSON.stringify(payload),
        });
    closeClassModal();
    await loadClasses();
    await loadClassesForLevel(selectedLevel._id);
  } catch (error) {
    // console.error( "Failed to save class:", error);
    alert(error.message || "Failed to save class.");
  } finally {
    saveClassBtn.disabled = false;
  }
};

// to delete a class from level
const deleteClass = async (id) => {
  const classData = classes.find((item) => item._id === id);
  if (!classData) return;

  // classData.enrollment > 0 ?

  const confirmed = confirm(
    `Are you sure you want to delete "${classData.name}"?`,
  );
  if (!confirmed) return;

  try {
    await api(`/classes/${id}`, {
      method: "DELETE",
    });
    await loadClasses();
    await loadClassesForLevel(selectedLevel._id);
  } catch (error) {
    // console.error( "Failed to delete class:", error);
    alert(error.message || "Failed to delete class.");
  }
};

// all modal event lsiteners
const setupEventListeners = () => {
  // Level
  document
    .getElementById("openAddLevelBtn")
    .addEventListener("click", openAddLevelModal);
  document
    .getElementById("closeLevelModal")
    .addEventListener("click", closeLevelModal);
  document
    .getElementById("cancelLevelBtn")
    .addEventListener("click", closeLevelModal);
  levelModalOverlay.addEventListener("click", closeLevelModal);
  levelForm.addEventListener("submit", saveLevel);
  levelSearch.addEventListener("input", renderLevels);
  levelsGrid.addEventListener("click", handleLevelAction);

  // Classes
  document
    .getElementById("openAddClassBtn")
    .addEventListener("click", openAddClassModal);
  document
    .getElementById("closeClassModal")
    .addEventListener("click", closeClassModal);
  document
    .getElementById("cancelClassBtn")
    .addEventListener("click", closeClassModal);
  classModalOverlay.addEventListener("click", closeClassModal);
  classForm.addEventListener("submit", saveClass);
  classesGrid.addEventListener("click", handleClassAction);
  document
    .getElementById("backToLevelsBtn")
    .addEventListener("click", showLevelsView);
};

// level actions
const handleLevelAction = (e) => {
  const actionButton = e.target.closest("[data-action]");

  if (actionButton) {
    const action = actionButton.dataset.action;
    const id = actionButton.dataset.id;

    if (action === "edit-level") {
      e.stopPropagation();
      openEditLevelModal(id);
      return;
    }

    if (action === "delete-level") {
      e.stopPropagation();
      deleteLevel(id);
      return;
    }
  }
  const card = e.target.closest(".level-card");
  if (!card) return;

  const id = card.dataset.levelId;
  openLevel(id);
};

// classs actions
const handleClassAction = (e) => {
  const actionButton = e.target.closest("[data-action]");
  if (!actionButton) return;

  const action = actionButton.dataset.action;
  const id = actionButton.dataset.id;

  if (action === "edit-class") {
    openEditClassModal(id);
  } else if (action === "delete-class") {
    deleteClass(id);
  }
  // action === 'edit-class' ? openEditClassModal(id) :
};

// pages level and class nav
const showLevelsView = () => {
  classesView.classList.add("hidden");
  levelsView.classList.remove("hidden");
  selectedLevel = null;
};

//modals
const closeLevelModal = () => {
  levelModal.classList.add("hidden");
  levelForm.reset();
  levelId.value = "";
};

const closeClassModal = () => {
  classModal.classList.add("hidden");
  classForm.reset();
  classId.value = "";
};

const escapeHTML = (value = "") => {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
};
