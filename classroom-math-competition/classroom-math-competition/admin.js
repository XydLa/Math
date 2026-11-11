import { doc, setDoc, deleteDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { db, TEAMS, showMessage } from "./shared.js";

const TEACHER_PASSWORD = "math2026"; // Change this to whatever teacher password you want!

const keyList = document.querySelector("#key-list");
const passwordInput = document.querySelector("#admin-password");
const saveButton = document.querySelector("#save-btn");
const message = document.querySelector("#message");
const maxScoreLabel = document.querySelector("#max-score");

for (let question = 1; question <= 10; question++) {
  const row = document.createElement("div");
  row.className = "key-row";
  row.innerHTML = `
    <div class="key-question">Q${question}</div>
    <label class="sr-only" for="answer-${question}">Correct answer for question ${question}</label>
    <select id="answer-${question}" class="key-select">
      <option value="">Correct answer</option>
      ${["A", "B", "C", "D"].map(letter => `<option value="${letter}">${letter}</option>`).join("")}
    </select>
    <label class="sr-only" for="points-${question}">Points for question ${question}</label>
    <input id="points-${question}" class="points-input" type="number" min="0" max="100" step="1" value="1">
    <span class="points-label">pts</span>`;
  keyList.append(row);
}

function updateMaximum() {
  const total = [...document.querySelectorAll(".points-input")]
    .reduce((sum, input) => sum + Math.max(0, Number(input.value) || 0), 0);
  maxScoreLabel.textContent = `${total} points`;
}

keyList.addEventListener("input", updateMaximum);

saveButton.addEventListener("click", async () => {
  const password = passwordInput.value;
  if (!password) {
    showMessage(message, "Enter the teacher password first.", "error");
    return;
  }
  if (password !== TEACHER_PASSWORD) {
    showMessage(message, "Incorrect teacher password.", "error");
    return;
  }

  const answers = [];
  const points = [];
  for (let question = 1; question <= 10; question++) {
    const answer = document.querySelector(`#answer-${question}`).value;
    const pointValue = Number(document.querySelector(`#points-${question}`).value);
    if (!answer) {
      showMessage(message, `Choose the correct answer for question ${question}.`, "error");
      return;
    }
    if (!Number.isInteger(pointValue) || pointValue < 0 || pointValue > 100) {
      showMessage(message, `Points for question ${question} must be a whole number from 0 to 100.`, "error");
      return;
    }
    answers.push(answer);
    points.push(pointValue);
  }

  const maxScore = points.reduce((sum, value) => sum + value, 0);

  saveButton.disabled = true;
  saveButton.textContent = "Saving…";
  try {
    await setDoc(doc(db, "private", "config"), {
      answers,
      points,
      maxScore,
      updatedAt: serverTimestamp()
    });

    for (const team of TEAMS) {
      await deleteDoc(doc(db, "submissions", team.id));
      await setDoc(doc(db, "publicScores", team.id), {
        teamId: team.id,
        teamName: team.name,
        score: 0,
        maxScore,
        submitted: false,
        updatedAt: serverTimestamp()
      });
    }

    showMessage(message, `Answer key saved. All teams have been reset. Maximum score: ${maxScore} points.`, "success");
    passwordInput.value = "";
  } catch (error) {
    showMessage(message, `Save failed: ${error.message}`, "error");
  } finally {
    saveButton.disabled = false;
    saveButton.textContent = "Save answer key & reset teams";
  }
});

updateMaximum();
