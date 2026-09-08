// Fill this in with YOUR Firebase project's config.
// Find it in: Firebase Console → Project Settings → General → Your apps → SDK setup and configuration
// This file is safe to make public — these are not secret keys, they just identify your project.
// Access is actually controlled by the Firestore security rules (see firestore.rules).

export const firebaseConfig = {
  apiKey: "AIzaSyBBPyvm5Lm_zGMziK9thWEQQFMWxPt37iY",
  authDomain: "household-todo-21493.firebaseapp.com",
  projectId: "household-todo-21493",
  storageBucket: "household-todo-21493.firebasestorage.app",
  messagingSenderId: "374490020105",
  appId: "1:374490020105:web:2e1cdfad7b39e732623bd8"
};

// The only two people allowed to read/write this list.
// This must match EXACTLY what's in firestore.rules (that's the real gatekeeper —
// this list is just used to show a friendly error if someone else signs in).
export const ALLOWED_EMAILS = [
  "you@gmail.com",
  "husband@gmail.com"
];
