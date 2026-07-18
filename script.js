// ============================================================
//  Creator Compass — production script (ES module)
//  Quiz engine + Firebase auth + save/load blueprints.
// ============================================================

import {
  signUpEmail, signInEmail, signInGoogle,
  logOut, watchAuth, friendlyError
} from "./auth.js";
import { saveBlueprint, listBlueprints, removeBlueprint } from "./blueprints.js";

// ============================================================
//  ⚙️  SETTINGS — EDIT THESE
//  ------------------------------------------------------------
//  When your Starter Kit is live on Gumroad, paste its URL here.
//  Until then, leave it as "" and the upgrade box stays hidden.
// ============================================================
var GUMROAD_KIT_URL = "";   // e.g. "https://charlespalmer.gumroad.com/l/starter-kit"

// ---------- quiz state ----------
var state = { type: null, goal: null, pain: null };
var current = 1;
var TOTAL = 3;
var lastPlan = null;      // plan object for the current results view
var currentUser = null;

// ---------- refs ----------
var steps = document.querySelectorAll(".step");
var fill = document.getElementById("progressFill");
var stepNum = document.getElementById("stepNum");
var btnNext = document.getElementById("btnNext");
var btnBack = document.getElementById("btnBack");
var btnRestart = document.getElementById("btnRestart");
var btnSave = document.getElementById("btnSave");
var quiz = document.getElementById("quiz");
var results = document.getElementById("results");
var accountActions = document.getElementById("accountActions");
var savedPanel = document.getElementById("savedPanel");
var savedList = document.getElementById("savedList");
var toastEl = document.getElementById("toast");

// modal refs
var authModal = document.getElementById("authModal");
var modalTitle = document.getElementById("modalTitle");
var modalSub = document.getElementById("modalSub");
var modalError = document.getElementById("modalError");
var nameField = document.getElementById("nameField");
var inpName = document.getElementById("inpName");
var inpEmail = document.getElementById("inpEmail");
var inpPass = document.getElementById("inpPass");
var btnAuthSubmit = document.getElementById("btnAuthSubmit");
var btnGoogle = document.getElementById("btnGoogle");
var modalSwitch = document.getElementById("modalSwitch");
var switchMode = document.getElementById("switchMode");
var modalClose = document.getElementById("modalClose");

var authMode = "signin"; // or "signup"

// ============================================================
//  QUIZ (same heuristics as prototype)
// ============================================================
document.querySelectorAll(".option").forEach(function (opt) {
  opt.addEventListener("click", function () {
    var group = opt.getAttribute("data-group");
    state[group] = opt.getAttribute("data-value");
    document.querySelectorAll('.option[data-group="' + group + '"]').forEach(function (o) {
      o.classList.remove("is-selected"); o.removeAttribute("aria-pressed");
    });
    opt.classList.add("is-selected");
    opt.setAttribute("aria-pressed", "true");
    refreshNav();
  });
});

btnNext.addEventListener("click", function () {
  if (current < TOTAL) goTo(current + 1); else buildBlueprint();
});
btnBack.addEventListener("click", function () { if (current > 1) goTo(current - 1); });
btnRestart.addEventListener("click", function () {
  state = { type: null, goal: null, pain: null };
  document.querySelectorAll(".option").forEach(function (o) {
    o.classList.remove("is-selected"); o.removeAttribute("aria-pressed");
  });
  results.hidden = true; quiz.style.display = "";
  goTo(1);
  quiz.scrollIntoView({ behavior: "smooth", block: "start" });
});

function goTo(n) {
  current = n;
  steps.forEach(function (s) {
    s.classList.toggle("is-active", Number(s.getAttribute("data-step")) === n);
  });
  fill.style.width = Math.round((n / TOTAL) * 100) + "%";
  stepNum.textContent = n;
  btnBack.hidden = n === 1;
  refreshNav();
}

function refreshNav() {
  var key = current === 1 ? "type" : current === 2 ? "goal" : "pain";
  btnNext.disabled = !state[key];
  if (current === TOTAL) {
    btnNext.textContent = "See my blueprint ✨"; btnNext.classList.add("is-final");
  } else {
    btnNext.textContent = "Next →"; btnNext.classList.remove("is-final");
  }
}

var TYPE_LABEL = {
  video: "video", writing: "writing", audio: "audio",
  visual: "visual work", digital: "digital products", unsure: "your idea"
};

// Replace href:"#" with your real affiliate links.
var TOOLS = {
  tools:     { name: "an all-in-one creator toolkit", why: "One login handles your writing, scheduling, and simple edits — so you stop juggling ten apps.", link: "#" },
  time:      { name: "a batch + scheduling tool", why: "Make a week of content in one sitting, then let it post itself while you rest.", link: "#" },
  ideas:     { name: "an idea + outline helper", why: "Turn one topic into a month of hooks so the blank page never wins.", link: "#" },
  overwhelm: { name: "a simple all-in-one workspace", why: "Everything lives in one clean place, so 'where do I start?' has one obvious answer.", link: "#" },
  messy:     { name: "a content organizer", why: "Give every file, draft, and idea a home you can actually find later.", link: "#" }
};

function goalPlan(goal, typeWord) {
  switch (goal) {
    case "start": return { title: "Ship your first piece", steps: [
      "Pick ONE " + typeWord + " idea you already know well.",
      "Make the roughest version and finish it — done beats perfect.",
      "Post it in one place. That's it. You're a creator now."] };
    case "consistent": return { title: "Show up without burning out", steps: [
      "Choose a schedule you can keep on a bad week, not a good one.",
      "Batch a few pieces at once so future-you can coast.",
      "Track it on a simple calendar — seeing the streak keeps it alive."] };
    case "grow": return { title: "Reach more of the right people", steps: [
      "Pick the ONE platform where your people already hang out.",
      "Study your 3 best pieces and make more like them.",
      "End every piece by telling people exactly what to do next."] };
    case "money": return { title: "Earn your first dollar", steps: [
      "Offer one small, simple thing people already ask you for.",
      "Name a fair price and make it easy to buy in two clicks.",
      "Tell your existing audience first — warm beats cold every time."] };
    default: return { title: "Your next steps", steps: ["Pick one goal.", "Take one step.", "Repeat."] };
  }
}

var PAIN_INSIGHT = {
  tools: "You don't have a tool problem — you have a too-many-tools problem. The fix is fewer, not more.",
  time: "You're not slow. You're doing everything live. Batching turns hours into minutes.",
  ideas: "Ideas don't run out — capture does. A place to catch sparks means you never start from zero.",
  overwhelm: "Overwhelm is just too many open loops. Close everything but the next one small step.",
  messy: "Messy files quietly steal your time. A little structure now saves hours every week."
};

var TYPE_TIP = {
  video: "Keep a running notes file of hooks — your first 3 seconds matter more than the rest.",
  writing: "Write ugly first drafts fast, then edit. Editing while writing is what stalls you.",
  audio: "Record in short takes. It's easier to string good pieces together than to nail one long take.",
  visual: "Save a swipe folder of work you love. Reference beats a blank canvas every time.",
  digital: "Make the smallest useful version first. You can always add more after people buy.",
  unsure: "Try one of each for a week. Pick the one you'd do even if nobody watched."
};

// Compute the full plan from a set of answers ({type, goal, pain}).
// Deterministic, so a saved blueprint can be fully rebuilt later.
function computePlan(answers) {
  var typeWord = TYPE_LABEL[answers.type] || "your work";
  var plan = goalPlan(answers.goal, typeWord);
  var tool = TOOLS[answers.pain] || TOOLS.overwhelm;
  var summary = "A simple plan for " + typeWord + " — built around your #1 struggle. Do these in order and don't skip ahead.";
  return {
    typeWord: typeWord,
    title: plan.title,
    summary: summary,
    insight: PAIN_INSIGHT[answers.pain] || "Small, steady steps beat big, rare ones.",
    steps: plan.steps,
    tip: TYPE_TIP[answers.type] || "Start before you feel ready. Ready comes from doing.",
    tool: tool
  };
}

// Render a computed plan into the results view.
function renderPlan(full) {
  document.getElementById("resultsTitle").textContent = full.title;
  document.getElementById("resultsSummary").textContent = full.summary;

  var grid = document.getElementById("cardsGrid");
  grid.innerHTML = "";
  grid.appendChild(card("🧠", "The insight", "insight", null, full.insight));
  grid.appendChild(card("✅", "Your action steps", "do", full.steps, null));
  grid.appendChild(card("💬", "One tip for " + full.typeWord, "tip", null, full.tip));

  document.getElementById("alleyTitle").textContent = "Set up " + full.tool.name;
  document.getElementById("alleyBody").textContent = full.tool.why;
  var cta = document.getElementById("alleyCta");
  cta.href = full.tool.link;
  cta.textContent = "Get " + full.tool.name.replace(/^an? /, "") + " →";

  // Upgrade box — only show if a Gumroad URL is set
  var upgradeBox = document.getElementById("upgradeBox");
  var upgradeCta = document.getElementById("upgradeCta");
  if (GUMROAD_KIT_URL) {
    upgradeCta.href = GUMROAD_KIT_URL;
    upgradeBox.style.display = "";
  } else {
    upgradeBox.style.display = "none";
  }

  results.hidden = false;
}

function buildBlueprint() {
  var full = computePlan(state);
  lastPlan = { title: full.title, summary: full.summary };
  renderPlan(full);

  btnSave.disabled = false;
  btnSave.textContent = "💾 Save this blueprint";

  quiz.style.display = "none";
  results.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Build a plain-text version of a blueprint for download.
function blueprintToText(answers) {
  var f = computePlan(answers);
  var L = [];
  L.push("CREATOR COMPASS — YOUR WORKFLOW BLUEPRINT");
  L.push("==========================================");
  L.push("");
  L.push(f.title.toUpperCase());
  L.push(f.summary);
  L.push("");
  L.push("WHY YOU'RE STUCK");
  L.push("- " + f.insight);
  L.push("");
  L.push("DO THIS NEXT");
  f.steps.forEach(function (s, i) { L.push((i + 1) + ". " + s); });
  L.push("");
  L.push("QUICK WIN (for " + f.typeWord + ")");
  L.push("- " + f.tip);
  L.push("");
  L.push("WHAT TO DO NEXT");
  L.push("Set up " + f.tool.name + ".");
  L.push(f.tool.why);
  L.push("");
  L.push("------------------------------------------");
  L.push("Made with Creator Compass");
  return L.join("\n");
}

// Trigger a client-side download of a text file.
function downloadText(filename, text) {
  var blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
}

function card(icon, kicker, kind, listItems, bodyText) {
  var el = document.createElement("article");
  el.className = "card";
  var titleMap = { insight: "Why you're stuck", do: "Do this next", tip: "Quick win" };
  var html = '<div class="card-icon">' + icon + "</div>";
  html += '<p class="card-kicker">' + kicker + "</p>";
  html += '<h3 class="card-title">' + (titleMap[kind] || kicker) + "</h3>";
  if (listItems) {
    html += '<ul class="card-list">';
    listItems.forEach(function (s) { html += "<li>" + esc(s) + "</li>"; });
    html += "</ul>";
  } else {
    html += '<p class="card-body">' + esc(bodyText) + "</p>";
  }
  el.innerHTML = html;
  return el;
}

function esc(str) {
  return String(str).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

// ============================================================
//  AUTH UI
// ============================================================
function openModal(mode) {
  authMode = mode || "signin";
  modalError.hidden = true;
  if (authMode === "signup") {
    modalTitle.textContent = "Create your account";
    modalSub.textContent = "Save your blueprints and come back anytime.";
    nameField.hidden = false;
    btnAuthSubmit.textContent = "Create account";
    modalSwitch.innerHTML = 'Already have an account? <button id="switchMode" type="button">Sign in</button>';
  } else {
    modalTitle.textContent = "Welcome back";
    modalSub.textContent = "Sign in to save your blueprints.";
    nameField.hidden = true;
    btnAuthSubmit.textContent = "Sign in";
    modalSwitch.innerHTML = 'New here? <button id="switchMode" type="button">Create an account</button>';
  }
  document.getElementById("switchMode").addEventListener("click", function () {
    openModal(authMode === "signup" ? "signin" : "signup");
  });
  authModal.hidden = false;
  inpEmail.focus();
}
function closeModal() { authModal.hidden = true; }

modalClose.addEventListener("click", closeModal);
authModal.addEventListener("click", function (e) { if (e.target === authModal) closeModal(); });
document.addEventListener("keydown", function (e) {
  if (e.key === "Escape" && !authModal.hidden) closeModal();
});

btnAuthSubmit.addEventListener("click", async function () {
  modalError.hidden = true;
  var email = inpEmail.value.trim();
  var pass = inpPass.value;
  if (!email || !pass) { showModalError("Please fill in your email and password."); return; }
  btnAuthSubmit.disabled = true;
  try {
    if (authMode === "signup") {
      await signUpEmail(inpName.value.trim(), email, pass);
    } else {
      await signInEmail(email, pass);
    }
    closeModal();
  } catch (err) {
    showModalError(friendlyError(err.code));
  } finally {
    btnAuthSubmit.disabled = false;
  }
});

btnGoogle.addEventListener("click", async function () {
  modalError.hidden = true;
  try { await signInGoogle(); closeModal(); }
  catch (err) { showModalError(friendlyError(err.code)); }
});

function showModalError(msg) { modalError.textContent = msg; modalError.hidden = false; }

// ============================================================
//  SAVE / LOAD
// ============================================================
btnSave.addEventListener("click", async function () {
  if (!currentUser) { openModal("signin"); return; }
  if (!lastPlan) return;
  btnSave.disabled = true;
  btnSave.textContent = "Saving…";
  try {
    await saveBlueprint(state, lastPlan);
    btnSave.textContent = "✓ Saved";
    toast("Blueprint saved to your account.");
    renderSaved();
  } catch (err) {
    btnSave.disabled = false;
    btnSave.textContent = "💾 Save this blueprint";
    toast("Couldn't save. Try again.");
  }
});

async function renderSaved() {
  if (!currentUser) { savedPanel.hidden = true; return; }
  try {
    var items = await listBlueprints();
    savedPanel.hidden = false;
    if (!items.length) {
      savedList.innerHTML = '<p class="saved-empty">No saved blueprints yet. Finish the quiz and hit Save.</p>';
      return;
    }
    savedList.innerHTML = "";
    items.forEach(function (it) {
      var when = it.createdAt && it.createdAt.toDate
        ? it.createdAt.toDate().toLocaleDateString()
        : "just now";
      var answers = it.answers || {};
      var row = document.createElement("div");
      row.className = "saved-item";
      row.innerHTML =
        '<div class="saved-item-main">' +
          '<div class="saved-item-title">' + esc(it.planTitle || "Blueprint") + '</div>' +
          '<div class="saved-item-meta">' + esc(when) + '</div>' +
        '</div>' +
        '<div class="saved-item-actions">' +
          '<button class="saved-open">Open</button>' +
          '<button class="saved-dl">Download</button>' +
          '<button class="saved-del">Delete</button>' +
        '</div>';

      // Open — rebuild and show the full plan
      row.querySelector(".saved-open").addEventListener("click", function () {
        var full = computePlan(answers);
        quiz.style.display = "none";
        renderPlan(full);
        btnSave.disabled = true;
        btnSave.textContent = "✓ Saved";
        results.scrollIntoView({ behavior: "smooth", block: "start" });
      });

      // Download — save a .txt copy locally
      row.querySelector(".saved-dl").addEventListener("click", function () {
        var safe = (it.planTitle || "blueprint").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        downloadText("creator-compass-" + safe + ".txt", blueprintToText(answers));
        toast("Downloaded to your device.");
      });

      // Delete
      row.querySelector(".saved-del").addEventListener("click", async function () {
        try { await removeBlueprint(it.id); toast("Deleted."); renderSaved(); }
        catch (e) { toast("Couldn't delete."); }
      });

      savedList.appendChild(row);
    });
  } catch (err) {
    savedPanel.hidden = true;
  }
}

// ============================================================
//  AUTH STATE → UI
// ============================================================
watchAuth(function (user) {
  currentUser = user;
  if (user) {
    var label = user.displayName || user.email || "your account";
    accountActions.innerHTML =
      '<span class="account-email" title="' + esc(user.email || "") + '">' + esc(label) + '</span>' +
      '<button class="btn-ghost" id="btnSignOut">Sign out</button>';
    document.getElementById("btnSignOut").addEventListener("click", function () { logOut(); });
    renderSaved();
  } else {
    accountActions.innerHTML = '<button class="btn-ghost" id="btnSignIn">Sign in</button>';
    document.getElementById("btnSignIn").addEventListener("click", function () { openModal("signin"); });
    savedPanel.hidden = true;
  }
});

// ============================================================
//  TOAST
// ============================================================
var toastTimer = null;
function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { toastEl.classList.remove("is-shown"); }, 2600);
}

// init
goTo(1);
