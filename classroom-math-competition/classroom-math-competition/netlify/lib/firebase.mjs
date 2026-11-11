import admin from "firebase-admin";

if (!admin.apps.length) {
  let privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").trim();

  if (privateKey && !privateKey.startsWith("-----BEGIN")) {
    privateKey = Buffer.from(privateKey, "base64").toString("utf8");
  }

  privateKey = privateKey.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n");

  if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
    throw new Error("Firebase Admin environment variables are missing.");
  }

  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID.trim(),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL.trim(),
      privateKey
    })
  });
}

export const db = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;

export function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify(body)
  };
}

export function readBody(event) {
  try { return JSON.parse(event.body || "{}"); }
  catch { return null; }
}
