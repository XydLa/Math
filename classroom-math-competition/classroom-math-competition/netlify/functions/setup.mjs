import { db, FieldValue, json, readBody } from "../lib/firebase.mjs";

const TEAM_IDS = ["red", "blue", "green", "yellow"];
const TEAM_NAMES = { red: "Red", blue: "Blue", green: "Green", yellow: "Yellow" };

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });
  const body = readBody(event);
  if (!body) return json(400, { error: "Invalid JSON body." });

  const configuredPassword = process.env.ADMIN_PASSWORD;
  if (!configuredPassword || typeof body.password !== "string" || body.password !== configuredPassword) {
    return json(401, { error: "Incorrect teacher password." });
  }

  const { answers, points } = body;
  if (!Array.isArray(answers) || !Array.isArray(points) || answers.length !== 10 || points.length !== 10) {
    return json(400, { error: "Provide exactly 10 answers and 10 point values." });
  }
  if (!answers.every(value => ["A", "B", "C", "D"].includes(value))) {
    return json(400, { error: "Every correct answer must be A, B, C, or D." });
  }
  if (!points.every(value => Number.isInteger(value) && value >= 0 && value <= 100)) {
    return json(400, { error: "Points must be whole numbers from 0 to 100." });
  }

  const maxScore = points.reduce((sum, value) => sum + value, 0);
  const configRef = db.collection("private").doc("config");
  const batch = db.batch();

  batch.set(configRef, {
    answers,
    points,
    maxScore,
    updatedAt: FieldValue.serverTimestamp()
  });

  for (const teamId of TEAM_IDS) {
    batch.delete(db.collection("submissions").doc(teamId));
    batch.set(db.collection("publicScores").doc(teamId), {
      teamId,
      teamName: TEAM_NAMES[teamId],
      score: 0,
      maxScore,
      submitted: false,
      updatedAt: FieldValue.serverTimestamp()
    });
  }

  try {
    await batch.commit();
    return json(200, { ok: true, maxScore });
  } catch (error) {
    console.error("Setup failed:", error);
    return json(500, { error: "Could not save the answer key. Check server configuration." });
  }
}
