// ============================================================
//  auth.js — sign up, sign in, sign out, profile bootstrap
// ============================================================

import { auth, db, googleProvider } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Make sure every signed-in user has a profile document.
// This is the ONLY place email/profile gets written on first login.
async function ensureProfile(user) {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      email: user.email || null,
      displayName: user.displayName || null,
      createdAt: serverTimestamp()
    });
  }
}

export async function signUpEmail(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  if (name) await updateProfile(cred.user, { displayName: name });
  await ensureProfile(cred.user);
  return cred.user;
}

export async function signInEmail(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  await ensureProfile(cred.user);
  return cred.user;
}

export async function signInGoogle() {
  const cred = await signInWithPopup(auth, googleProvider);
  await ensureProfile(cred.user);
  return cred.user;
}

export function logOut() {
  return signOut(auth);
}

export function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

// Friendly, plain-language error messages (5th-grade level)
export function friendlyError(code) {
  const map = {
    "auth/email-already-in-use": "That email already has an account. Try signing in instead.",
    "auth/invalid-email": "That doesn't look like a real email. Check it and try again.",
    "auth/weak-password": "Your password needs at least 6 letters or numbers.",
    "auth/wrong-password": "That password isn't right. Try again.",
    "auth/user-not-found": "We couldn't find an account with that email.",
    "auth/invalid-credential": "That email or password isn't right. Try again.",
    "auth/popup-closed-by-user": "The sign-in window closed. Give it another go.",
    "auth/too-many-requests": "Too many tries. Wait a minute, then try again."
  };
  return map[code] || "Something went wrong. Please try again.";
}
