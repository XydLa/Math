import { db, FieldValue, json, readBody } from "../lib/firebase.mjs";

const TEAM_NAMES = { red: "Red", blue: "Blue", green: "Green", yellow: "Yellow" };

export async function handler(event) {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed." });
  const body = readBody(event);
  if (!body) return json(400, { error: "Invalid JSON body." });

  const { teamId, answers } = body;
  if (!Object.hasOwn(TEAM_NAMES, teamId)) return json(400, { error: "Choose a valid team." });
  if (!Array.isArray(answers) || answers.length !== 10 || !answers.every(value => ["A", "B", "C", "D"].includes(value))) {
    return json(400, { error: "Submit exactly 10 answers using A, B, C, or D." });
  }

  const configRef = db.collection("private").doc("config");
  const submissionRef = db.collection("submissions").doc(teamId);
  const scoreRef = db.collection("publicScores").doc(teamId);

  try {
    const result = await db.runTransaction(async (transaction) => {
      const configSnap = await transaction.get(configRef);
      const submissionSnap = await transaction.get(submissionRef);

      if (!configSnap.exists) throw new Error("SETUP_REQUIRED");
      if (submissionSnap.exists) throw new Error("ALREADY_SUBMITTED");

      const config = configSnap.data();
      const score = answers.reduce((total, answer, index) => {
        return total + (answer === config.answers[index] ? config.points[index] : 0);
      }, 0);

      transaction.create(submissionRef, {
        teamId,
        answers,
        score,
        submittedAt: FieldValue.serverTimestamp()
      });

      transaction.set(scoreRef, {
        teamId,
        teamName: TEAM_NAMES[teamId],
        score,
        maxScore: config.maxScore,
        submitted: true,
        updatedAt: FieldValue.serverTimestamp()
      });

      return { score, maxScore: config.maxScore };
    });

    return json(200, { ok: true, ...result });
  } catch (error) {
    if (error.message === "SETUP_REQUIRED") return json(409, { error: "The teacher has not set up this round yet." });
    if (error.message === "ALREADY_SUBMITTED") return json(409, { error: "This team has already submitted. Ask the teacher to reset the round if needed." });
    console.error("Submission failed:", error);
    return json(500, { error: "Submission failed. Please ask the teacher to check the setup." });
  }
}
