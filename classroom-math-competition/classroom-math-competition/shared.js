import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getFirestore, collection, onSnapshot } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-firestore.js";
import { firebaseConfig } from "./firebase-config.js";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

export const TEAMS = [
  { id: "red", name: "Red", color: "#ef4444" },
  { id: "blue", name: "Blue", color: "#3b82f6" },
  { id: "green", name: "Green", color: "#22c55e" },
  { id: "yellow", name: "Yellow", color: "#eab308" }
];

export function listenToScores(callback, onError = console.error) {
  return onSnapshot(collection(db, "publicScores"), (snapshot) => {
    const scores = {};
    snapshot.forEach((doc) => { scores[doc.id] = doc.data(); });
    callback(scores);
  }, onError);
}

export async function callFunction(name, payload) {
  const response = await fetch(`/.netlify/functions/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(result.error || `Request failed (${response.status})`);
  }
  return result;
}

export function showMessage(element, message, type = "info") {
  element.textContent = message;
  element.className = `message ${type}`;
}
