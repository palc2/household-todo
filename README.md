# Our List

A shared checklist for household stuff — travel expenses, groceries, and the
social calendar — that syncs live between you and your husband, with typing
or voice input. Runs entirely as static files on GitHub Pages; Firebase
provides the free login + database behind it.

Setup takes about 15 minutes, once, and you won't need to touch Firebase again after that.

## 1. Create a Firebase project (free)

1. Go to https://console.firebase.google.com and click **Add project**.
2. Name it anything (e.g. "our-list"). You can skip Google Analytics.
3. Once created, click the **</>** (web) icon to register a web app. Give it any nickname. You do **not** need Firebase Hosting — you're using GitHub Pages instead.
4. Firebase will show you a `firebaseConfig` object with keys like `apiKey`, `authDomain`, etc. Keep this tab open — you'll paste these into `firebase-config.js` in step 4.

## 2. Turn on Google Sign-In

1. In the left sidebar: **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Google**, pick a support email, and save.

## 3. Turn on Firestore (the database)

1. In the left sidebar: **Build → Firestore Database → Create database**.
2. Choose **Start in production mode** (the rules file below locks it down properly).
3. Pick any region close to you.
4. Once created, go to the **Rules** tab, delete what's there, and paste in the contents of `firestore.rules` from this project — but first replace the two placeholder emails with your real Google account emails.
5. Click **Publish**.

This is what actually keeps the list private to just the two of you — anyone
else who signs in will be rejected even though the app's code is public.

## 4. Fill in your config

Open `firebase-config.js` in this project and:

- Paste in the real values from step 1 (`apiKey`, `authDomain`, etc.)
- Replace the two placeholder emails in `ALLOWED_EMAILS` with your real Google account emails — **these must match exactly what you put in `firestore.rules`.**

This file becomes public once deployed, which is fine — Firebase web config
isn't a secret; the Firestore rules are the actual lock.

## 5. Put it on GitHub Pages

```bash
# from inside this folder
git init
git add .
git commit -m "Our List app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/our-list.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source → Deploy from branch → main → / (root)**.
Your app will be live at `https://YOUR_USERNAME.github.io/our-list/` within a minute or two.

## 6. Authorize that domain in Firebase

Google Sign-In only works from domains you've explicitly allowed:

1. Firebase Console → **Authentication → Settings → Authorized domains**.
2. Click **Add domain** and add `YOUR_USERNAME.github.io`.

## Using it

- Sign in with Google once per device — it stays signed in after that.
- Three tabs: **Travel**, **Groceries**, **Social** — each is its own checklist.
- Type in the box and hit Add, or tap the mic and speak (Chrome/Edge only —
  Safari doesn't support browser voice input, so it'll be greyed out there).
- Checking, unchecking, adding, and deleting all save instantly and appear on
  the other person's screen in real time — there's no save button.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure |
| `style.css` | Visual design |
| `app.js` | Auth, Firestore sync, voice input, rendering |
| `firebase-config.js` | Your project keys + the two allowed emails |
| `firestore.rules` | Server-side lock so only you two can read/write |

## One-time index prompt

The first time you open a tab (e.g. Travel), Firestore may show an error in
the browser console with a link saying "The query requires an index." This
is normal — click the link, click **Create index** on the Firebase page it
opens, wait about a minute, then reload the app. You'll only see this once
per category, the first time each is used.

## Free tier notes

Firebase's free (Spark) plan comfortably covers a two-person household list —
you'd need roughly tens of thousands of reads/writes a day to approach the
limit, which this app won't come close to.

## Extending it later

- Add a fourth tab by adding an entry to `CATEGORY_META` in `app.js` and a
  matching `<button class="tab" data-cat="...">` in `index.html`.
- To split "who owes whom" out of travel items into real running totals,
  that'd need a bit more data modeling — worth a separate follow-up.
