// ============================================================
//  blueprints.js — save & load a user's blueprints
//  Every doc lives under users/{uid}/blueprints/{id}
//  Security rules guarantee a user only touches their own.
// ============================================================

import { auth, db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

function userBlueprintsRef() {
  const uid = auth.currentUser && auth.currentUser.uid;
  if (!uid) throw new Error("not-signed-in");
  return collection(db, "users", uid, "blueprints");
}

export async function saveBlueprint(answers, plan) {
  const ref = userBlueprintsRef();
  const docRef = await addDoc(ref, {
    answers: answers,          // { type, goal, pain }
    planTitle: plan.title,
    summary: plan.summary,
    createdAt: serverTimestamp()
  });
  return docRef.id;
}

export async function listBlueprints() {
  const ref = userBlueprintsRef();
  const q = query(ref, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(function (d) {
    return Object.assign({ id: d.id }, d.data());
  });
}

export async function removeBlueprint(id) {
  const uid = auth.currentUser && auth.currentUser.uid;
  if (!uid) throw new Error("not-signed-in");
  await deleteDoc(doc(db, "users", uid, "blueprints", id));
}
