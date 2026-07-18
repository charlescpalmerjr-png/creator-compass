# Creator Compass

A beginner-friendly diagnostic quiz that turns three answers into a simple
"Workflow Blueprint." Users can create an account, save their blueprints, and
come back to them. Built with vanilla HTML/CSS/JS + Firebase (Auth + Firestore).

No build step. No framework. Deploys as a static site to Vercel.

---

## What's in here

| File | Job |
|------|-----|
| `index.html` | Markup: account bar, quiz, results, saved panel, auth modal |
| `style.css` | All styling, mobile-first |
| `script.js` | Quiz engine + auth UI + save/load wiring |
| `firebase-config.js` | Your Firebase web config (public — safe to commit) |
| `auth.js` | Sign up / in / out, profile creation |
| `blueprints.js` | Save & load a user's blueprints |
| `firestore.rules` | **The security layer.** Locks data to its owner |
| `firebase.json` | Lets the Firebase CLI deploy the rules |
| `vercel.json` | Static hosting + security headers |

---

## Setup — do this once

### 1. Create the Firebase project
1. Go to https://console.firebase.google.com → **Add project**.
2. In the project, open **Build → Authentication → Get started**.
   - Enable **Email/Password**.
   - Enable **Google** (pick a support email).
3. Open **Build → Firestore Database → Create database** → start in
   **production mode** (rules below will secure it).

### 2. Get your web config
1. Project settings (gear icon) → **Your apps** → **Web** (`</>`).
2. Register the app, copy the `firebaseConfig` values.
3. Paste them into `firebase-config.js`, replacing every `REPLACE_...`.

> These values are **not secrets**. Firebase web config is meant to be public.
> Your data is protected by `firestore.rules`, not by hiding the config.

### 3. Push the security rules
```bash
npm install -g firebase-tools
firebase login
firebase use --add        # pick your project, alias it "default"
firebase deploy --only firestore:rules
```
Confirm in the console that Firestore → Rules shows the owner-only rules.

### 4. Authorize your domains
Firebase Console → Authentication → **Settings → Authorized domains**.
Add your Vercel domain (e.g. `creator-compass.vercel.app`) and any custom
domain. `localhost` is there by default for local testing.

---

## Deploy to Vercel

### Option A — from the dashboard
1. Push this folder to a GitHub repo (see below).
2. vercel.com → **New Project** → import the repo.
3. Framework preset: **Other**. Root: `/`. No build command. Output: `/`.
4. Deploy.

### Option B — from the terminal
```bash
npm install -g vercel
vercel            # first run links + deploys a preview
vercel --prod     # promote to production
```

---

## Put it on GitHub

```bash
cd creator-compass-prod
git init
git add .
git commit -m "Initial commit: Creator Compass"
git branch -M main
git remote add origin https://github.com/charlescpalmerjr-png/creator-compass.git
git push -u origin main
```
Then connect the repo in Vercel (Option A) so every push to `main` auto-deploys.

---

## Test it locally
Because it uses ES modules, open it through a tiny server, not `file://`:
```bash
python3 -m http.server 5173
# then visit http://localhost:5173
```

---

## Before you go live — checklist
- [ ] `firebase-config.js` filled in with real values
- [ ] Firestore rules deployed and verified (owner-only)
- [ ] Vercel + custom domain added to Firebase authorized domains
- [ ] Affiliate links swapped in (`TOOLS` object in `script.js`, and the
      hero/alley-oop CTAs) — they're `#` placeholders right now
- [ ] A privacy note added if you collect emails (you are)

---

## How data is protected (plain version)
- A user can only read or write documents under their **own** user ID.
- Those rules run on Google's servers — the browser can't get around them.
- The public config file can't be used to reach anyone else's data.
- Passwords are handled by Firebase Auth; you never see or store them.
