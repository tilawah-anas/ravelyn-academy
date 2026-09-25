import { api } from "../api.js  ";
import { requireAuth } from "../authorization.js";

if (!requireAuth()) {
  throw new Error("Not Authenticated");
}

const sessionSelect = document.getElementById("sessionSelect");
const sessionSummary = document.getElementById("sessionSummary");
const runPromotionButton = document.getElementById("runPromotion");
const ruleWarning = document.getElementById("ruleWarning");
const confirmationModal = document.getElementById("confirmationModal");
const confirmationSession = document.getElementById("confirmationSession");
const resultCard = document.getElementById("resultCard");

let sessions = [];
let rules = [];
let selectedSession = null;

const formatDate = (date) => {
  if (!date) return "—";
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status) => {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const loadData = async () => {
  try {
    const [sessionsResponse, rulesResponse] = await Promise.all([
      api("/session"),
      api("/promotion-rule"),
    ]);

    sessions = sessionsResponse.data || [];
    rules = rulesResponse.data || [];
    populateSessions();
  } catch (error) {
    console.error(error);
    alert(error.message || "Failed to load promotion data.");
  }
};

const populateSessions = () => {
  sessionSelect.innerHTML = `<option value=""> Select academic session</option>`;
  sessions.forEach((session) => {
    const option = document.createElement("option");
    option.value = session._id;

    option.textContent = session.name;
    sessionSelect.appendChild(option);
  });
};

const getRulesForSession = (sessionId) => {
  return rules.filter((rule) => {
    const ruleSession = rule.academicSession?._id || rule.academicSession;
    return String(ruleSession) === String(sessionId) && rule.active !== false;
  });
};

const updateSession = () => {
  const sessionId = sessionSelect.value;
  selectedSession = sessions.find((session) => session._id === sessionId);

  if (!selectedSession) {
    sessionSummary.classList.add("hidden");
    ruleWarning.classList.add("hidden");
    runPromotionButton.disabled = true;
    return;
  }

  sessionSummary.classList.remove("hidden");
  document.getElementById("summaryName").textContent = selectedSession.name;
  document.getElementById("summaryStatus").textContent = formatStatus(
    selectedSession.status,
  );
  document.getElementById("summaryPromotionStatus").textContent = formatStatus(
    selectedSession.promotionStatus,
  );
  document.getElementById("summaryEndDate").textContent = formatDate(
    selectedSession.endDate,
  );

  const sessionRules = getRulesForSession(sessionId);
  const noRules = sessionRules.length === 0;

  ruleWarning.classList.toggle("hidden", !noRules);

  const sessionCompleted = selectedSession.status === "completed";
  const promotionAlreadyCompleted =
    selectedSession.promotionStatus === "completed";

  runPromotionButton.disabled =
    !sessionCompleted || noRules || promotionAlreadyCompleted;
};

sessionSelect.addEventListener("change", updateSession);
runPromotionButton.addEventListener("click", () => {
  if (!selectedSession) return;
  confirmationSession.textContent = selectedSession.name;
  confirmationModal.classList.remove("hidden");
});

const closeConfirmation = () => {
  confirmationModal.classList.add("hidden");
};

document
  .getElementById("closeConfirmation")
  .addEventListener("click", closeConfirmation);
document
  .getElementById("cancelPromotion")
  .addEventListener("click", closeConfirmation);
document
  .getElementById("confirmPromotion")
  .addEventListener("click", async () => {
    if (!selectedSession) return;
    const button = document.getElementById("confirmPromotion");
    button.disabled = true;
    button.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Processing...`;

    try {
      const response = await api(`/promotions/${selectedSession._id}`, {
        method: "POST",
      });

      closeConfirmation();
      displayResult(response.data || {});
      await loadData();

      updateSession();
    } catch (error) {
      console.error(error);
      alert(error.message || "Promotion failed.");
    } finally {
      button.disabled = false;
      button.innerHTML = `Run Promotion`;
    }
  });

const displayResult = (result) => { resultCard.classList.remove("hidden");

  const promoted = result.promoted ?? result.promotedCount ?? result.results?.promoted ?? 0;
  const repeated = result.repeated ?? result.repeatedCount ?? result.results?.repeated ?? 0;
  const graduated = result.graduated ?? result.graduatedCount ?? result.results?.graduated ?? 0;

  const pending = result.pending ?? result.pendingCount ?? result.results?.pending ?? 0;
  document.getElementById("resultPromoted").textContent = promoted;
  document.getElementById("resultRepeated").textContent = repeated;
  document.getElementById("resultGraduated").textContent = graduated;
  document.getElementById("resultPending").textContent = pending;
};

confirmationModal.addEventListener("click", (event) => {
  if (event.target === confirmationModal) {
    closeConfirmation();
  }
});

loadData();
