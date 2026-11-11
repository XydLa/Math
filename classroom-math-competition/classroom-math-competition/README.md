# Classroom Math Competition

A small four-team math competition app using HTML, CSS, JavaScript, Firebase Firestore, and Netlify Functions.

## Routes

- `/play` — students choose a team and submit 10 answers.
- `/tv` — live leaderboard with a reveal toggle and animated ranking.
- `/admin` — teacher sets the answer key and points per question.

## Why the scoring runs on the server

The answer key is stored in a private Firestore document. Students' browsers never download it. Netlify Functions validate and score submissions using Firebase Admin SDK. Firestore rules let browser clients read only `publicScores`; they cannot write scores or read submissions.

## 1. Create Firebase project

1. Create a project at https://console.firebase.google.com/
2. Add a **Web app** in Project settings.
3. Copy its Firebase config values.
4. Open **Firestore Database** and create a database.
5. In Firestore Rules, paste the contents of `firestore.rules` and publish.

The web app config is public by design. The Firestore rules and server-side password protect the data.

## 2. Configure the app

Open `firebase-config.js` and replace the placeholder values with your Firebase Web App config.

Example:

```js
export const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};
```

## 3. Create a Firebase service account

1. In Firebase Console, open Project settings → Service accounts.
2. Generate a new private key.
3. Keep the downloaded JSON private. Never put it in the website files or commit it to Git.
4. In the JSON file, copy the `project_id`, `client_email`, and `private_key` values.

## 4. Deploy to Netlify

1. Put this project in a GitHub repository.
2. Import the repository in Netlify.
3. Build command: leave blank.
4. Publish directory: `.` (the repository root).
5. Add these environment variables in Netlify → Site configuration → Environment variables:

| Variable | Value |
|---|---|
| `FIREBASE_PROJECT_ID` | Service account `project_id` |
| `FIREBASE_CLIENT_EMAIL` | Service account `client_email` |
| `FIREBASE_PRIVATE_KEY` | Service account `private_key` including its line breaks |
| `ADMIN_PASSWORD` | A long, unique teacher password |

6. Deploy the site. Netlify installs `firebase-admin` from `package.json`.
7. If you change environment variables, trigger a new deploy.

You can also test locally with the Netlify CLI after setting the same environment variables:
`npx netlify dev`

## 5. Run the competition

1. Visit `/admin`, enter the teacher password, set all 10 correct answers and point values, then click **Save answer key & reset teams**.
2. Open `/tv` on the classroom screen. Scores remain hidden until **Reveal scores** is clicked.
3. Students visit `/play`, choose a team, fill in answers from their paper test, and submit.
4. Each team can submit once. The server rejects a second submission for that team.
5. To run another round, save the answer key again from `/admin`. This resets all four team submissions and scores.

## Firestore data layout

- `private/config` — answer key and points (server only)
- `submissions/{teamId}` — submitted answers and timestamp (server only)
- `publicScores/{teamId}` — team name, score, max score, and submitted status (read-only to browsers)

## Important classroom notes

- Use a strong, non-shared admin password and do not put it in JavaScript or HTML.
- The four team slots are global for this competition. A team can submit once, not once per student/device.
- This starter project has no student identity verification. Anyone who knows a team name can attempt that team's one submission, so supervise team submission or add a teacher-issued team PIN if needed.
- Netlify Functions and Firestore have free-tier limits that can change. Check the current Firebase and Netlify pricing/quotas before a large event.
