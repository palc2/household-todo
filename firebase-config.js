// Fill this in with YOUR Firebase project's config.
// Find it in: Firebase Console → Project Settings → General → Your apps → SDK setup and configuration
// This file is safe to make public — these are not secret keys, they just identify your project.
// Access is actually controlled by the Firestore security rules (see firestore.rules).

export const firebaseConfig = {
  apiKey: "PASTE_YOUR_API_KEY",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  storageBucket: "PASTE_YOUR_PROJECT.appspot.com",
  messagingSenderId: "PASTE_YOUR_SENDER_ID",
  appId: "PASTE_YOUR_APP_ID"
};

// The only two people allowed to read/write this list.
// This must match EXACTLY what's in firestore.rules (that's the real gatekeeper —
// this list is just used to show a friendly error if someone else signs in).
export const ALLOWED_EMAILS = [
  "you@gmail.com",
  "husband@gmail.com"
];
