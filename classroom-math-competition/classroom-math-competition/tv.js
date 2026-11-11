import { TEAMS, listenToScores } from "./shared.js";

const leaderboard = document.querySelector("#leaderboard");
const revealButton = document.querySelector("#reveal-btn");
const liveStatus = document.querySelector("#live-status");
const submissionCount = document.querySelector("#submission-count");

let scores = {};
let revealed = false;
let previousDisplayed = {};
const animationFrames = new WeakMap();

function animateNumber(element, from, to, duration = 900) {
  const previousFrame = animationFrames.get(element);
  if (previousFrame) cancelAnimationFrame(previousFrame);
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    element.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) animationFrames.set(element, requestAnimationFrame(step));
    else animationFrames.delete(element);
  };
  animationFrames.set(element, requestAnimationFrame(step));
}

function orderedTeams() {
  const rows = TEAMS.map(team => ({
    ...team,
    score: Number(scores[team.id]?.score || 0),
    maxScore: Number(scores[team.id]?.maxScore || 0),
    submitted: Boolean(scores[team.id]?.submitted)
  }));
  if (revealed) rows.sort((a, b) => b.score - a.score);
  return rows;
}

function createCard(team, index) {
  const card = document.createElement("article");
  card.className = `leader-card team-${team.id}`;
  card.dataset.team = team.id;
  card.innerHTML = `
    <div class="rank-badge">${index + 1}</div>
    <div class="leader-main">
      <div class="leader-name">${team.name}</div>
      <div class="leader-state">${team.submitted ? "SUBMITTED" : "WAITING FOR SUBMISSION"}</div>
      <div class="score-track"><div class="score-fill"></div></div>
    </div>
    <div class="leader-score"><span class="score-value">0</span><small>POINTS</small></div>`;
  return card;
}

function render() {
  const teams = orderedTeams();
  submissionCount.textContent = `${teams.filter(team => team.submitted).length} / 4 TEAMS SUBMITTED`;
  liveStatus.textContent = revealed ? "Scores revealed · live updates enabled" : "Teams are competing · scores hidden";

  const existing = new Map([...leaderboard.children].map(card => [card.dataset.team, card]));
  const before = new Map([...leaderboard.children].map(card => [card.dataset.team, card.getBoundingClientRect()]));

  teams.forEach((team, index) => {
    let card = existing.get(team.id);
    if (!card) {
      card = createCard(team, index);
      leaderboard.append(card);
    }
    card.querySelector(".rank-badge").textContent = index + 1;
    card.querySelector(".leader-state").textContent = team.submitted ? "SUBMITTED" : "WAITING FOR SUBMISSION";

    const scoreValue = card.querySelector(".score-value");
    const score = revealed ? team.score : null;
    if (revealed) {
      const oldValue = Number(previousDisplayed[team.id] ?? 0);
      if (oldValue !== team.score) animateNumber(scoreValue, oldValue, team.score);
      else scoreValue.textContent = team.score;
    } else {
      scoreValue.textContent = "—";
    }

    const fill = card.querySelector(".score-fill");
    const percent = revealed && team.maxScore > 0 ? (team.score / team.maxScore) * 100 : 0;
    fill.style.width = `${percent}%`;
    card.classList.toggle("is-revealed", revealed);
    card.style.setProperty("--team-color", team.color);
    leaderboard.append(card);
  });

  // FLIP animation: measure old positions, reorder, then animate to new positions.
  teams.forEach(team => {
    const card = leaderboard.querySelector(`[data-team="${team.id}"]`);
    const oldRect = before.get(team.id);
    if (!oldRect) return;
    const newRect = card.getBoundingClientRect();
    const deltaY = oldRect.top - newRect.top;
    if (deltaY) {
      card.style.transition = "none";
      card.style.transform = `translateY(${deltaY}px)`;
      requestAnimationFrame(() => {
        card.style.transition = "transform 650ms cubic-bezier(.2,.8,.2,1)";
        card.style.transform = "";
      });
    }
  });

  previousDisplayed = Object.fromEntries(teams.map(team => [team.id, team.score]));
}

revealButton.addEventListener("click", () => {
  revealed = !revealed;
  revealButton.setAttribute("aria-pressed", String(revealed));
  revealButton.innerHTML = revealed ? "◎ Hide scores" : "◉ Reveal scores";
  render();
});

listenToScores((latest) => {
  scores = latest;
  render();
}, () => {
  liveStatus.textContent = "Connection lost. Refresh to reconnect.";
});
