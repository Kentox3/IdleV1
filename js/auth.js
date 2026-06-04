// ═══════════════════════════════════════════════
//  auth.js  —  Login / Registrierung
// ═══════════════════════════════════════════════

document.addEventListener("firebaseReady", async function () {
  document.getElementById("loadStatus").textContent = "Prüfe Session...";
  var uid  = localStorage.getItem("idle_uid");
  var name = localStorage.getItem("idle_name");

  if (uid && name) {
    try {
      var player = await dbGet(playerPath(uid));
      if (player) {
        document.dispatchEvent(new CustomEvent("gameReady", { detail: { uid: uid, name: player.name || name } }));
        return;
      }
    } catch (e) { /* Session ungültig */ }
    localStorage.removeItem("idle_uid");
    localStorage.removeItem("idle_name");
  }

  // Kein gültiger Login → Auth-Screen zeigen
  document.getElementById("loadScreen").hidden = true;
  document.getElementById("authScreen").hidden = false;
});

// ── Tab-Wechsel im Auth-Screen ────────────────────────────────
function showAuthTab(tab) {
  document.getElementById("loginForm").hidden    = (tab !== "login");
  document.getElementById("registerForm").hidden = (tab !== "register");
  document.getElementById("tabLogin").classList.toggle("active",    tab === "login");
  document.getElementById("tabRegister").classList.toggle("active", tab === "register");
  document.getElementById("authMsg").textContent = "";
}

function setMsg(txt, ok) {
  var el = document.getElementById("authMsg");
  el.textContent = txt;
  el.style.color = ok ? "#22c55e" : "#ef4444";
}

// ── Login ─────────────────────────────────────────────────────
async function doLogin() {
  var email = document.getElementById("loginEmail").value.trim();
  var pw    = document.getElementById("loginPassword").value;
  if (!email || !pw) { setMsg("Bitte alle Felder ausfüllen."); return; }
  setMsg("Anmelden...", true);
  try {
    var key  = await emailToKey(email);
    var acct = await dbGet(acctPath(key));
    if (!acct) { setMsg("E-Mail nicht registriert."); return; }
    var res  = await hashPassword(pw, acct.salt);
    if (res.hash !== acct.hash) { setMsg("Falsches Passwort."); return; }

    var player = await dbGet(playerPath(acct.uid));
    var pname  = (player && player.name) ? player.name : "Trainer";
    localStorage.setItem("idle_uid",  acct.uid);
    localStorage.setItem("idle_name", pname);
    document.getElementById("authScreen").hidden = true;
    document.dispatchEvent(new CustomEvent("gameReady", { detail: { uid: acct.uid, name: pname } }));
  } catch (e) { setMsg("Fehler: " + e.message); }
}

// ── Registrierung ─────────────────────────────────────────────
async function doRegister() {
  var name  = document.getElementById("regName").value.trim();
  var email = document.getElementById("regEmail").value.trim();
  var pw    = document.getElementById("regPassword").value;

  if (!name || !email || !pw) { setMsg("Bitte alle Felder ausfüllen."); return; }
  if (name.length < 2 || name.length > 20) { setMsg("Name: 2–20 Zeichen."); return; }
  if (pw.length < 6) { setMsg("Passwort: mindestens 6 Zeichen."); return; }

  setMsg("Registrieren...", true);
  try {
    var key = await emailToKey(email);
    if (await dbGet(acctPath(key))) { setMsg("E-Mail bereits registriert."); return; }

    var uid    = genId();
    var hashed = await hashPassword(pw);
    await dbSet(acctPath(key), { uid: uid, salt: hashed.salt, hash: hashed.hash, created: Date.now() });

    var newPlayer = createNewPlayer(uid, name);
    await dbSet(playerPath(uid), newPlayer);

    localStorage.setItem("idle_uid",  uid);
    localStorage.setItem("idle_name", name);
    document.getElementById("authScreen").hidden = true;
    document.dispatchEvent(new CustomEvent("gameReady", { detail: { uid: uid, name: name } }));
  } catch (e) { setMsg("Fehler: " + e.message); }
}

// ── Logout ────────────────────────────────────────────────────
function doLogout() {
  localStorage.removeItem("idle_uid");
  localStorage.removeItem("idle_name");
  window.location.reload();
}
