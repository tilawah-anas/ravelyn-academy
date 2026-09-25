import { api } from "./api.js";
import { requireAuth } from "./authorization.js";

if (!requireAuth()) {
    throw new Error("Not Authenticated");
}

const coursesContainer = document.getElementById("courses-container");
const emptyState = document.getElementById("empty-state");

const totalCoursesElement = document.getElementById("total-courses");
const activeCoursesElement = document.getElementById("active-courses");
const levelsCoveredElement = document.getElementById("levels-covered");
const averagePassMarkElement = document.getElementById("average-pass-mark");

const searchInput = document.getElementById("course-search");
const levelFilter = document.getElementById("level-filter");
const statusFilter = document.getElementById("status-filter");

const courseModal = document.getElementById("course-modal");
const deleteModal = document.getElementById("delete-modal");

const courseForm = document.getElementById("course-form");
const modalTitle = document.getElementById("modal-title");
const courseIdInput = document.getElementById("course-id");

const courseTitleInput = document.getElementById("course-title");
const courseCodeInput = document.getElementById("course-code");
const passMarkInput = document.getElementById("pass-mark");
const courseLevelsInput = document.getElementById("course-levels");
const courseStatusInput = document.getElementById("course-status");

const formError = document.getElementById("form-error");

const saveCourseButton = document.getElementById("save-course-button");
const saveButtonText = document.getElementById("save-button-text");
const saveButtonSpinner = document.getElementById("save-button-spinner");

const deleteCourseName = document.getElementById("delete-course-name");
const confirmDeleteButton = document.getElementById("confirm-delete");
const deleteSpinner = document.getElementById("delete-spinner");

let courses = [];
let levels = [];
let courseToDelete = null;


// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
    await loadLevels();
    await loadCourses();

    setupEventListeners();
});


// Event listeners
function setupEventListeners() {
    document.getElementById("open-course-modal").addEventListener("click", () => openCourseModal());
    document.getElementById("empty-add-course").addEventListener("click", () => openCourseModal());
    document.getElementById("close-course-modal").addEventListener("click", closeCourseModal);
    document.getElementById("cancel-course-modal").addEventListener("click", closeCourseModal);
    document.getElementById("cancel-delete").addEventListener("click", closeDeleteModal);
    confirmDeleteButton.addEventListener("click", deleteCourse);
    courseForm.addEventListener("submit", handleCourseSubmit);
    searchInput.addEventListener("input", applyFilters);
    levelFilter.addEventListener("change", applyFilters);
    statusFilter.addEventListener("change", applyFilters);

    courseModal.addEventListener("click", (event) => {
        if (event.target === courseModal) {
            closeCourseModal();
        }
    });

    deleteModal.addEventListener("click", (event) => {
        if (event.target === deleteModal) {
            closeDeleteModal();
        }
    });
}


// Load levels
async function loadLevels() {
    try {
        const response = await api("/levels");
        levels = response.data || [];

        populateLevelFilters();
        populateLevelSelect();

    } catch (error) {
        showToast(error.message || "Unable to load levels", "error");
    }
}


// Load courses
async function loadCourses() {
    coursesContainer.innerHTML = `
        <div class="loading-state">
            <i class="fa-solid fa-spinner fa-spin"></i>
            <p>Loading courses...</p>
        </div>
    `;
    emptyState.classList.add("hidden");
    try {
        const response = await api("/course");
        courses = response.data || [];

        updateStatistics();
        applyFilters();
    } catch (error) {
        coursesContainer.innerHTML = `
            <div class="loading-state">
                <i class="fa-solid fa-circle-exclamation"></i>
                <p>${escapeHtml(error.message || "Unable to load courses")}</p>
            </div>
        `;
    }
}


// Populate level filter
function populateLevelFilters() {
    levelFilter.innerHTML = `<option value="">All Levels</option>`;
    levels.forEach((level) => {
        const option = document.createElement("option");
        option.value = level._id;
        option.textContent = level.name;
        levelFilter.appendChild(option);
    });
}


// Populate multiple level select
function populateLevelSelect(selectedLevelIds = []) {
    courseLevelsInput.innerHTML = "";

    levels.forEach((level) => {
        const option = document.createElement("option");

        option.value = level._id;
        option.textContent = level.code ? `${level.name} (${level.code})` : level.name;
        if (selectedLevelIds.includes(level._id)) {
            option.selected = true;
        }
        courseLevelsInput.appendChild(option);
    });
}


// Update statistics
function updateStatistics() {
    const activeCourses = courses.filter((course) => course.isActive !== false);
    const coveredLevelIds = new Set();

    courses.forEach((course) => {
        const courseLevels = Array.isArray(course.level) ? course.level : [];

        courseLevels.forEach((level) => {
            const levelId = typeof level === "object" ? level._id : level;
            if (levelId) {
                coveredLevelIds.add(levelId);
            }
        });
    });
    const passMarks = courses.map((course) => Number(course.passMark)).filter((mark) => !Number.isNaN(mark) && mark >= 0);
    const averagePassMark = passMarks.length ? Math.round( passMarks.reduce((total, mark) => total + mark, 0) / passMarks.length ) : 0;

    totalCoursesElement.textContent = courses.length;
    activeCoursesElement.textContent = activeCourses.length;
    levelsCoveredElement.textContent = coveredLevelIds.size;
    averagePassMarkElement.textContent = `${averagePassMark}%`;
}


// Apply search and filters
function applyFilters() {
    const searchTerm = searchInput.value.trim().toLowerCase();
    const selectedLevelId = levelFilter.value;
    const selectedStatus = statusFilter.value;

    const filteredCourses = courses.filter((course) => {
        const title = course.courseTitle?.toLowerCase() || "";
        const code = course.courseCode?.toLowerCase() || "";

        const matchesSearch = title.includes(searchTerm) || code.includes(searchTerm);
        const courseIsActive = course.isActive !== false;
        const matchesStatus = !selectedStatus || (selectedStatus === "active" && courseIsActive) || (selectedStatus === "inactive" && !courseIsActive);
        const courseLevelIds = getCourseLevelIds(course);
        const matchesLevel = !selectedLevelId || courseLevelIds.includes(selectedLevelId);

        return matchesSearch && matchesStatus && matchesLevel;
    });
    renderCourses(filteredCourses);
}


// Render courses
function renderCourses(filteredCourses) {
    if (filteredCourses.length === 0) {
        coursesContainer.innerHTML = "";
        emptyState.classList.remove("hidden");
        return;
    }

    emptyState.classList.add("hidden");
    coursesContainer.innerHTML = filteredCourses.map((course) => createCourseCard(course)).join("");
    document.querySelectorAll("[data-edit-course]").forEach((button) => {
        button.addEventListener("click", () => {
            const course = courses.find((item) => item._id === button.dataset.editCourse);
            if (course) {
                openCourseModal(course);
            }
        });
    });

    document.querySelectorAll("[data-delete-course]").forEach((button) => {
        button.addEventListener("click", () => {
            const course = courses.find((item) => item._id === button.dataset.deleteCourse);
            if (course) {
                openDeleteModal(course);
            }
        });
    });
}


// Create course card
function createCourseCard(course) {
    const isActive = course.isActive !== false;
    const levelsMarkup = getCourseLevels(course).map((level) => {
            const levelName = typeof level === "object" ? level.name : getLevelName(level);
            return ` <span class="level-tag">${escapeHtml(levelName)} </span> `;
        }).join("");
    return `
        <article class="course-card">
            <div class="course-card-header">
                <div>
                    <h3 class="course-title"> ${escapeHtml(course.courseTitle || "Untitled Course")} </h3>
                    <span class="course-code"> ${escapeHtml(course.courseCode || "No code")} </span>
                </div>
                <span class="status-badge ${isActive ? "active" : "inactive"}"> ${isActive ? "Active" : "Inactive"} </span>
            </div>
            <div class="course-details">
                <div class="course-detail">
                    <i class="fa-solid fa-layer-group"></i>
                    <div class="course-detail-content">
                        <span class="course-detail-label">Academic Levels</span>
                        <div class="level-tags">${levelsMarkup || "<span class='course-detail-value'>No levels assigned</span>"}</div>
                    </div>
                </div>
                <div class="course-detail">
                    <i class="fa-solid fa-percent"></i>
                    <div class="course-detail-content">
                        <span class="course-detail-label">Pass Mark</span>
                        <span class="course-detail-value"> ${course.passMark ?? "Not set"}${course.passMark !== null && course.passMark !== undefined ? "%" : ""} </span>
                    </div>
                </div>
            </div>
            <div class="course-card-footer">
                <button class='icon-button' title="Edit course" data-edit-course="${course._id}" >
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="icon-button delete" title="Delete course" data-delete-course="${course._id}" >
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        </article>`;
}


// Open course modal
function openCourseModal(course = null) {
    courseForm.reset();
    formError.classList.add("hidden");
    formError.textContent = "";

    if (course) {
        modalTitle.textContent = "Edit Course";
        saveButtonText.textContent = "Update Course";

        courseIdInput.value = course._id;
        courseTitleInput.value = course.courseTitle || "";
        courseCodeInput.value = course.courseCode || "";
        passMarkInput.value = course.passMark ?? "";
        courseStatusInput.value = String(course.isActive !== false);

        populateLevelSelect(getCourseLevelIds(course));
    } else {
        modalTitle.textContent = "Add Course";
        saveButtonText.textContent = "Save Course";

        courseIdInput.value = "";
        courseStatusInput.value = "true";

        populateLevelSelect();
    }

    courseModal.classList.remove("hidden");
    document.body.classList.add("modal-open");

    setTimeout(() => {
        courseTitleInput.focus();
    }, 100);
}


// Close course modal
function closeCourseModal() {
    courseModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
}


// Open delete modal
function openDeleteModal(course) {
    courseToDelete = course;
    deleteCourseName.textContent = course.courseTitle || "this course";
    deleteModal.classList.remove("hidden");
    document.body.classList.add("modal-open");
}


// Close delete modal
function closeDeleteModal() {
    courseToDelete = null;
    deleteModal.classList.add("hidden");
    document.body.classList.remove("modal-open");
}


// Submit course form
async function handleCourseSubmit(event) {
    event.preventDefault();
    formError.classList.add("hidden");
    formError.textContent = "";

    const courseId = courseIdInput.value;
    const selectedLevels = Array.from(courseLevelsInput.selectedOptions).map((option) => option.value);

    if (selectedLevels.length === 0) {
        showFormError("Please select at least one academic level.");
        return;
    }
    const passMarkValue = passMarkInput.value.trim();

    if (
        passMarkValue !== "" && (Number(passMarkValue) < 0 || Number(passMarkValue) > 100)
    ) {
        showFormError("Pass mark must be between 0 and 100.");
        return;
    }

    const payload = {
        courseTitle: courseTitleInput.value.trim(),
        courseCode: courseCodeInput.value.trim().toUpperCase(),
        passMark: passMarkValue === "" ? null : Number(passMarkValue),
        level: selectedLevels,
        isActive: courseStatusInput.value === "true",
    };

    setSaveLoading(true);
    try {
        const endpoint = courseId ? `/course/${courseId}` : "/course";
        const method = courseId ? "PATCH" : "POST";
        await api(endpoint, {
            method,
            body: JSON.stringify(payload),
        });

        closeCourseModal();
        await loadCourses();

        showToast(
            courseId ? "Course updated successfully" : "Course created successfully",  "success"
        );
    } catch (error) {
        showFormError(error.message || "Unable to save course.");
    } finally {
        setSaveLoading(false);
    }
}

// Delete course
async function deleteCourse() {
    if (!courseToDelete) {
        return;
    }

    deleteSpinner.classList.remove("hidden");
    confirmDeleteButton.disabled = true;

    try {
        await api(`/course/${courseToDelete._id}`, { method: "DELETE", });
        closeDeleteModal();
        await loadCourses();
        showToast("Course deleted successfully", "success");

    } catch (error) {
        showToast(error.message || "Unable to delete course", "error");
    } finally {
        deleteSpinner.classList.add("hidden");
        confirmDeleteButton.disabled = false;
    }
}

// Get course levels
function getCourseLevels(course) {
    return Array.isArray(course.level)  ? course.level : [];
}

// Get level IDs
function getCourseLevelIds(course) {
    return getCourseLevels(course).map((level) => {
            return typeof level === "object" ? level._id : level;
        }).filter(Boolean);
}

// Get level name
function getLevelName(levelId) {
    const level = levels.find((item) => item._id === levelId);
    return level?.name || "Unknown level";
}

// Show form error
function showFormError(message) {
    formError.textContent = message;
    formError.classList.remove("hidden");
}

// Set save button loading
function setSaveLoading(isLoading) {
    saveCourseButton.disabled = isLoading;
    saveButtonSpinner.classList.toggle("hidden", !isLoading);
    saveButtonText.classList.toggle("hidden", isLoading);
}

// Basic HTML escaping
function escapeHtml(value) {
    return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

// Toast fallback
function showToast(message, type = "success") {
    if (typeof window.showToast === "function") {
        window.showToast(message, type);
        return;
    }

    // alert(message);
}