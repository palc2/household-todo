import { firebaseConfig, ALLOWED_EMAILS } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getAuth, GoogleAuthProvider, signInWithPopup, signOut,
  onAuthStateChanged, setPersistence, browserLocalPersistence
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, onSnapshot, doc, updateDoc,
  deleteDoc, query, serverTimestamp, where
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// Elements
const signedOutEl = document.getElementById("signed-out");
const signedInEl = document.getElementById("signed-in");
const signinBtn = document.getElementById("google-signin-btn");
const signinError = document.getElementById("signin-error");
const signoutBtn = document.getElementById("signout-btn");
const userEmailEl = document.getElementById("user-email");
const tabs = document.querySelectorAll(".tab");
const itemList = document.getElementById("item-list");
const emptyState = document.getElementById("empty-state");
const syncStatus = document.getElementById("sync-status");
const addForm = document.getElementById("add-form");
const itemInput = document.getElementById("item-input");
const micBtn = document.getElementById("mic-btn");

const CATEGORY_META = {
  childcare:  { label: "Childcare",  placeholder: "e.g., Pack extra socks for daycare" },
  groceries:  { label: "Groceries",  placeholder: "e.g., Milk, eggs, bread" },
  social:     { label: "Social",     placeholder: "e.g., RSVP to Maria's birthday, Sept 12" },
  other:      { label: "Other",      placeholder: "e.g., Renew car registration" },
  docappt:    { label: "Doc Appt",   placeholder: "e.g., Schedule pediatrician follow-up" },
  travel:     { label: "Travel",     placeholder: "e.g., Reimburse Sam $40 for the taxi" },
};

let currentCategory = "childcare";
let unsubscribeItems = null;

// ---------- Auth ----------
setPersistence(auth, browserLocalPersistence);

signinBtn.addEventListener("click", async () => {
  signinError.hidden = true;
  try {
    await signInWithPopup(auth, provider);
  } catch (err) {
    signinError.textContent = "Sign-in failed: " + err.message;
    signinError.hidden = false;
  }
});

signoutBtn.addEventListener("click", () => signOut(auth));

onAuthStateChanged(auth, (user) => {
  if (user) {
    const email = (user.email || "").toLowerCase();
    const allowed = ALLOWED_EMAILS.map(e => e.toLowerCase()).includes(email);
    if (!allowed) {
      signinError.textContent = `${user.email} isn't on the allowed list for this household. Sign out and try the right Google account.`;
      signinError.hidden = false;
      signOut(auth);
      return;
    }
    signedOutEl.hidden = true;
    signedInEl.hidden = false;
    userEmailEl.textContent = user.email;
    subscribeToCategory(currentCategory);
  } else {
    signedOutEl.hidden = false;
    signedInEl.hidden = true;
    if (unsubscribeItems) unsubscribeItems();
  }
});

// ---------- Tabs ----------
tabs.forEach(tab => {
  tab.addEventListener("click", () => {
    tabs.forEach(t => t.setAttribute("aria-selected", "false"));
    tab.setAttribute("aria-selected", "true");
    currentCategory = tab.dataset.cat;
    document.documentElement.style.setProperty("--accent", `var(--${currentCategory})`);
    document.documentElement.style.setProperty("--accent-bg", `var(--${currentCategory}-bg)`);
    itemInput.placeholder = CATEGORY_META[currentCategory].placeholder + "…";
    subscribeToCategory(currentCategory);
  });
});
itemInput.placeholder = CATEGORY_META[currentCategory].placeholder + "…";

// ---------- Firestore sync ----------
function subscribeToCategory(category) {
  if (unsubscribeItems) unsubscribeItems();
  syncStatus.textContent = "Syncing…";

  // Note: filtering by category without an orderBy on a different field
  // avoids Firestore's composite-index requirement. We sort client-side
  // instead, by createdAt descending.
  const q = query(
    collection(db, "items"),
    where("category", "==", category)
  );

  unsubscribeItems = onSnapshot(q, (snapshot) => {
    const docs = [...snapshot.docs].sort((a, b) => {
      const aTime = a.data().createdAt?.toMillis?.() ?? 0;
      const bTime = b.data().createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
    renderItems(docs);
    syncStatus.textContent = "Synced";
  }, (err) => {
    syncStatus.textContent = "Sync error — " + err.message;
  });
}

function renderItems(docs) {
  itemList.innerHTML = "";
  emptyState.hidden = docs.length > 0;
  emptyState.textContent = `Nothing here yet. Add your first ${CATEGORY_META[currentCategory].label.toLowerCase()} item below.`;

  docs.forEach((docSnap) => {
    const item = docSnap.data();
    const li = document.createElement("li");
    li.className = "item-row" + (item.done ? " done" : "");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "item-checkbox";
    checkbox.checked = !!item.done;
    checkbox.addEventListener("change", () => {
      updateDoc(doc(db, "items", docSnap.id), { done: checkbox.checked });
    });

    const textWrap = document.createElement("div");
    textWrap.className = "item-text";
    textWrap.textContent = item.text || "";

    if (item.createdByEmail) {
      const meta = document.createElement("span");
      meta.className = "item-meta";
      meta.textContent = "added by " + item.createdByEmail.split("@")[0];
      textWrap.appendChild(meta);
    }

    const del = document.createElement("button");
    del.className = "item-delete";
    del.setAttribute("aria-label", "Delete item");
    del.textContent = "✕";
    del.addEventListener("click", () => deleteDoc(doc(db, "items", docSnap.id)));

    li.appendChild(checkbox);
    li.appendChild(textWrap);
    li.appendChild(del);
    itemList.appendChild(li);
  });
}

// ---------- Add item ----------
addForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = itemInput.value.trim();
  if (!text) return;
  itemInput.value = "";
  await addDoc(collection(db, "items"), {
    text,
    category: currentCategory,
    done: false,
    createdAt: serverTimestamp(),
    createdByEmail: auth.currentUser ? auth.currentUser.email : null,
  });
});

// ---------- Voice to text ----------
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let listening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  recognition.onstart = () => {
    listening = true;
    micBtn.classList.add("listening");
  };

  recognition.onresult = (event) => {
    let transcript = "";
    for (let i = 0; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    itemInput.value = transcript;
  };

  recognition.onend = () => {
    listening = false;
    micBtn.classList.remove("listening");
  };

  recognition.onerror = () => {
    listening = false;
    micBtn.classList.remove("listening");
  };

  micBtn.addEventListener("click", () => {
    if (listening) {
      recognition.stop();
    } else {
      itemInput.focus();
      recognition.start();
    }
  });
} else {
  micBtn.disabled = true;
  micBtn.title = "Voice input isn't supported in this browser — try Chrome or Edge";
  micBtn.style.opacity = "0.4";
}

