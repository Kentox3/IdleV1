// ═══════════════════════════════════════════════════
//  app.js  —  Spiel-Controller & Game-Loop
// ═══════════════════════════════════════════════════

// ── Geteilte Spielvariablen (global via var) ───────────────────
var STATE       = null;   // Spielerdaten
var CATCH_TIMER = 30;     // Sekunden bis zur nächsten Begegnung
var CATCH_LIMIT = 30;     // Gesamtdauer des aktuellen Timers
var ENC_PKID    = null;   // Dex-ID des aktuell angezeigten Pokémon
var ENC_RESULT  = null;   // 'caught' | 'fled' | 'full'
var ENC_SHOW    = 0;      // Sekunden, die die Encounter-Anzeige noch läuft
var SAVE_TICK   = 0;

// ── Game Ready ────────────────────────────────────────────────
document.addEventListener("gameReady", async function (e) {
  var uid  = e.detail.uid;
  var name = e.detail.name;
  var ls   = document.getElementById("loadScreen");
  ls.hidden = false;
  document.getElementById("loadStatus").textContent = "Lade Spielstand...";

  try {
    var data = await dbGet(playerPath(uid));
    if (!data) {
      data = createNewPlayer(uid, name);
      await dbSet(playerPath(uid), data);
    }

    // State normalisieren (Firebase wandelt leere Arrays manchmal um)
    STATE = data;
    if (!Array.isArray(STATE.box)) STATE.box = Object.values(STATE.box || {}).filter(Boolean);
    STATE.party          = STATE.party          || { "0":null,"1":null,"2":null,"3":null,"4":null,"5":null };
    STATE.upgrades       = STATE.upgrades       || {};
    STATE.unlockedRoutes = STATE.unlockedRoutes || ["route1"];
    STATE.activeRoute    = STATE.activeRoute    || "route1";
    STATE.totalCoins     = STATE.totalCoins     || 0;
    STATE.rebirthCount   = STATE.rebirthCount   || 0;

    // Offline-Fortschritt berechnen
    var offline = applyOffline(STATE);

    // Catch-Timer initialisieren
    resetCatchTimer();

    // Spiel anzeigen
    ls.hidden = true;
    document.getElementById("hMid").textContent = STATE.name;
    document.getElementById("gameScreen").hidden = false;
    renderAll();

    // Game-Loop starten
    setInterval(gameTick, 1000);

    // Speichern beim Schließen
    window.addEventListener("beforeunload", saveGame);

    // Offline-Modal
    if (offline && offline.secs > 60) {
      showOfflineModal(offline);
    }

  } catch (err) {
    document.getElementById("loadStatus").textContent = "Ladefehler: " + err.message;
    console.error(err);
  }
});

// ── Game-Loop (jede Sekunde) ──────────────────────────────────
function gameTick() {
  if (!STATE) return;

  // Einnahmen
  var inc = computeIncomeSec(STATE);
  STATE.coins      += inc;
  STATE.totalCoins  = (STATE.totalCoins || 0) + inc;

  // XP
  tickXP(STATE, 1);

  // Encounter-Timer
  if (ENC_SHOW > 0) {
    ENC_SHOW--;
    if (ENC_SHOW === 0) {
      // Encounter-Anzeige ausblenden, Timer zurücksetzen
      ENC_PKID   = null;
      ENC_RESULT = null;
      _lastEncId = null;
      resetCatchTimer();
    }
  } else {
    CATCH_TIMER--;
    if (CATCH_TIMER <= 0) triggerEncounter();
  }

  // Auto-Speichern alle 30 Sekunden
  SAVE_TICK++;
  if (SAVE_TICK >= 30) { SAVE_TICK = 0; saveGame(); }

  updateUI();
}

// ── Encounter auslösen ────────────────────────────────────────
function triggerEncounter() {
  var route = ROUTES.find(function(r) { return r.id === STATE.activeRoute; }) || ROUTES[0];
  var dexId = route.pool[Math.floor(Math.random() * route.pool.length)];

  if (willCatch(STATE.upgrades, dexId)) {
    var res = addToBox(STATE, dexId);
    ENC_RESULT = (res === "full") ? "full" : "caught";
  } else {
    ENC_RESULT = "fled";
  }

  ENC_PKID   = dexId;
  ENC_SHOW   = 3;     // 3 Sekunden lang anzeigen
  _lastEncId = null;  // UI-Refresh erzwingen
  updateHeader();     // Münzen sofort updaten
}

function resetCatchTimer() {
  var route = ROUTES.find(function(r) { return r.id === STATE.activeRoute; }) || ROUTES[0];
  CATCH_LIMIT = Math.round(route.interval * getSpeedMult(STATE.upgrades));
  CATCH_TIMER = CATCH_LIMIT;
}

// ── Speichern ─────────────────────────────────────────────────
function saveGame() {
  if (!STATE) return;
  STATE.lastSeen = Date.now();
  dbSet(playerPath(STATE.uid), STATE).catch(function(e) {
    console.warn("Speichern fehlgeschlagen:", e);
  });
}

// ── View-Wechsel ──────────────────────────────────────────────
function switchView(name, btn) {
  document.querySelectorAll(".view").forEach(function(v) { v.classList.remove("active"); });
  document.getElementById("view" + name).classList.add("active");
  document.querySelectorAll(".tab").forEach(function(t) { t.classList.remove("active"); });
  if (btn) btn.classList.add("active");
  renderAll();
}

// ── Spielaktionen ─────────────────────────────────────────────
function doSelectRoute(routeId) {
  STATE.activeRoute = routeId;
  ENC_PKID = null; ENC_RESULT = null; ENC_SHOW = 0; _lastEncId = null;
  resetCatchTimer();
  renderRoute();
  saveGame();
}

function doUnlockRoute(routeId) {
  var route = ROUTES.find(function(r) { return r.id === routeId; });
  if (!route) return;
  if (STATE.coins < route.cost) {
    showToast("Nicht genug ₽! (" + fmt(route.cost) + " benötigt)", false); return;
  }
  if (!unlockRoute(STATE, routeId)) { showToast("Freischalten fehlgeschlagen.", false); return; }
  STATE.activeRoute = routeId;
  resetCatchTimer();
  showToast("🗺️ " + route.name + " freigeschaltet!", true);
  renderRoute();
  saveGame();
}

function doMoveToParty(iid) {
  if (!moveToParty(STATE, iid)) {
    showToast("Team ist voll! (max. " + getPartyMax(STATE.upgrades) + " Pokémon)", false); return;
  }
  showToast("Pokémon ins Team aufgenommen! 👜", true);
  renderAll(); saveGame();
}

function doMoveToBox(slot) {
  if (!moveToBox(STATE, slot)) {
    showToast("Box ist voll! (" + getBoxCap(STATE.upgrades) + " Plätze)", false); return;
  }
  renderAll(); saveGame();
}

function doEvolveItem(iid) {
  var res = tryEvolve(STATE, iid);
  if (!res.ok) {
    if (res.reason === "level") showToast("Level " + res.needed + " erforderlich!", false);
    else if (res.reason === "coins") showToast(fmt(res.cost) + " ₽ benötigt!", false);
    else showToast("Entwicklung nicht möglich.", false);
    return;
  }
  showToast("✨ " + res.oldName + " → " + res.newName + "!", true);
  renderAll(); saveGame();
}

function doBuyUpgrade(uid) {
  if (!buyUpgrade(STATE, uid)) {
    var upg = UPGRADES.find(function(u) { return u.id === uid; });
    if (STATE.upgrades[uid]) showToast("Bereits gekauft!", false);
    else showToast(fmt(upg ? upg.cost : 0) + " ₽ benötigt!", false);
    return;
  }
  showToast("Upgrade gekauft! 🎉", true);
  resetCatchTimer(); // Tempo-Upgrade könnte Timer geändert haben
  renderAll(); saveGame();
}

function doRebirth() {
  if (!confirm("Wirklich neu starten?\nAlle Pokémon, Münzen und Upgrades werden zurückgesetzt.\nDafür erhältst du einen dauerhaften Einnahmen-Bonus.")) return;
  if (!doRebirthLogic(STATE)) {
    showToast("Noch " + fmt(REBIRTH_REQ - (STATE.totalCoins || 0)) + " ₽ insgesamt nötig!", false); return;
  }
  ENC_PKID = null; ENC_RESULT = null; ENC_SHOW = 0; _lastEncId = null;
  resetCatchTimer();
  showToast("🔁 Neue Reise! +" + (STATE.rebirthCount * 10) + "% dauerhafter Bonus!", true);
  renderAll(); saveGame();
}
