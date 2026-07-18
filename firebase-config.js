// ============================================================
//  Firebase setup
//  ------------------------------------------------------------
//  These values are NOT secrets — Firebase web config is meant
//  to be public. Your data is protected by Firestore Security
//  Rules (see firestore.rules), NOT by hiding this config.
//
//  Replace the placeholders below with YOUR project's values
//  from: Firebase Console → Project settings → Your apps → Web app
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAG7h2mXuy2orWdOmokXUvarSe-zuEinnY",
  authDomain: "productivity-site-b3dad.firebaseapp.com",
  projectId: "productivity-site-b3dad",
  storageBucket: "productivity-site-b3dad.firebasestorage.app",
  messagingSenderId: "269514401800",
  appId: "1:269514401800:web:bfe3841e46306639c089bd"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
