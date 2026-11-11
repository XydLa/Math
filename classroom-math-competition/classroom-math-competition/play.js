import { TEAMS, listenToScores, callFunction, showMessage } from "./shared.js";

const teamPicker = document.querySelector("#team-picker");
const answerGrid = document.querySelector("#answer-grid");
const submitButton = document.querySelector("#submit-btn");
const message = document.querySelector("#message");
const teamStatus = document.querySelector("#team-status");

let selectedTeam = null;
let scores = {};
let submitting = false;

for (let question = 1; question <= 10; question++) {
  const card = document.createElement("div");
  card.className = "answer-card";
  card.innerHTML = `
    <div class="answer-number">QUESTION ${question}</div>
    <div class="answer-options" role="group" aria-label="Question ${question}">
      ${["A", "B", "C", "D"].map(letter => `
        <button type="button" class="answer-option" data-question="${question}" data-answer="${letter}" aria-pressed="false">${letter}</button>
      `).join("")}
    </div>`;
  answerGrid.append(card);
}

answerGrid.addEventListener("click", (event) => {
  const button = event.target.closest(".answer-option");
  if (!button || button.disabled) return;

  const group = button.parentElement;
  group.querySelectorAll(".answer-option").forEach(option => {
    const active = option === button;
    option.classList.toggle("selected", active);
    option.setAttribute("aria-pressed", String(active));
  });
  updateSubmitState();
});

teamPicker.addEventListener("click", (event) => {
  const button = event.target.closest("[data-team]");
  if (!button || button.disabled) return;
  selectedTeam = button.dataset.team;
  teamPicker.querySelectorAll(".team-choice").forEach(item => {
    item.classList.toggle("selected", item === button);
  });
  const team = TEAMS.find(item => item.id === selectedTeam);
  teamStatus.textContent = `${team.name} team selected.`;
  updateSubmitState();
});

function getAnswers() {
  return Array.from({ length: 10 }, (_, index) => {
    const question = index + 1;
    const selected = answerGrid.querySelector(`.answer-option.selected[data-question="${question}"]`);
    return selected?.dataset.answer || null;
  });
}

function updateSubmitState() {
  const teamIsLocked = selectedTeam && scores[selectedTeam]?.submitted;
  submitButton.disabled = submitting || !selectedTeam || getAnswers().some(answer => !answer) || teamIsLocked;
  if (teamIsLocked) teamStatus.textContent = "This team has already submitted.";
}

function updateTeamLocks() {
  teamPicker.querySelectorAll(".team-choice").forEach(button => {
    const locked = Boolean(scores[button.dataset.team]?.submitted);
    button.disabled = locked;
    button.classList.toggle("locked", locked);
    button.setAttribute("aria-label", `${button.textContent}${locked ? ", already submitted" : ""}`);
  });

  if (selectedTeam && scores[selectedTeam]?.submitted) {
    selectedTeam = null;
    teamPicker.querySelectorAll(".team-choice").forEach(button => button.classList.remove("selected"));
    teamStatus.textContent = "That team has already submitted. Choose another available team.";
  }
  updateSubmitState();
}

listenToScores((latestScores) => {
  scores = latestScores;
  updateTeamLocks();
}, () => {
  showMessage(message, "Could not connect to the live scoreboard. Refresh and try again.", "error");
});

submitButton.addEventListener("click", async () => {
  if (!selectedTeam || submitting) return;
  const answers = getAnswers();
  if (answers.some(answer => !answer)) {
    showMessage(message, "Please answer all 10 questions.", "error");
    return;
  }

  submitting = true;
  updateSubmitState();
  submitButton.textContent = "Submitting…";
  try {
    await callFunction("submit", { teamId: selectedTeam, answers });
    showMessage(message, "Submission received! Your team's answers are locked.", "success");
    teamStatus.textContent = "Submission complete.";
    answerGrid.querySelectorAll("button").forEach(button => button.disabled = true);
    teamPicker.querySelectorAll("button").forEach(button => button.disabled = true);
  } catch (error) {
    showMessage(message, error.message, "error");
  } finally {
    submitting = false;
    submitButton.textContent = "Submit answers";
    updateSubmitState();
  }
});
