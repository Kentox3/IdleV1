// ════════════════════════════════════════
//  game.js  —  Kernlogik (kein Klicken!)
// ════════════════════════════════════════

// ── Neuen Spieler anlegen ──────────────────────────────────────
function createNewPlayer(uid, name) {
  return {
    uid: uid, name: name,
    coins: 0, totalCoins: 0,
    lastSeen: Date.now(),
    activeRoute: "route1",
    unlockedRoutes: ["route1"],
    party:   { "0":null,"1":null,"2":null,"3":null,"4":null,"5":null },
    box:     [],
    upgrades:{},
    totalCaught: 0,
    rebirthCount: 0,
  };
}

// ── Upgrade-Helfer ─────────────────────────────────────────────
function getIncMult(upgs, rebirths) {
  var m = 1;
  UPGRADES.forEach(function(u) { if (u.effect === "income" && upgs[u.id]) m *= (1 + u.val); });
  return m * (1 + (rebirths || 0) * 0.1);
}
function getSpeedMult(upgs) {
  var r = 0;
  UPGRADES.forEach(function(u) { if (u.effect === "speed" && upgs[u.id]) r += u.val; });
  return Math.max(0.25, 1 - r);
}
function getBoxCap(upgs) {
  var c = BOX_BASE;
  UPGRADES.forEach(function(u) { if (u.effect === "box" && upgs[u.id]) c += u.val; });
  return c;
}
function getPartyMax(upgs) {
  var s = PARTY_BASE;
  UPGRADES.forEach(function(u) { if (u.effect === "partySize" && upgs[u.id]) s += u.val; });
  return s;
}
function getCatchBonus(upgs) {
  var b = 0;
  if (upgs["ball1"]) b += 0.15;
  if (upgs["ball2"]) b += 0.30;
  return b;
}

// ── Einnahmen pro Sekunde ──────────────────────────────────────
function computeIncomeSec(state) {
  var mult  = getIncMult(state.upgrades, state.rebirthCount);
  var pMax  = getPartyMax(state.upgrades);
  var total = 0;
  for (var i = 0; i < pMax; i++) {
    var p = state.party[String(i)];
    if (!p) continue;
    var def = POKEMON[p.dexId];
    if (def) total += INCOME_SCALE(def.income, p.level) * mult;
  }
  return total;
}

// ── XP & Level ────────────────────────────────────────────────
function tickXP(state, secs) {
  var pMax = getPartyMax(state.upgrades);
  for (var i = 0; i < pMax; i++) {
    var p = state.party[String(i)];
    if (!p || p.level >= 100) continue;
    p.xp += secs;
    while (p.level < 100 && p.xp >= XP_PER_LEVEL(p.level)) {
      p.xp -= XP_PER_LEVEL(p.level);
      p.level++;
    }
    if (p.level >= 100) p.xp = 0;
  }
}

// ── Fangen ────────────────────────────────────────────────────
function willCatch(upgs, dexId) {
  if (upgs["ball3"]) return true;  // Meisterball = immer
  var def   = POKEMON[dexId];
  var base  = RARITIES[def.rarity].catchChance;
  var bonus = getCatchBonus(upgs);
  return Math.random() < Math.min(1, base + bonus);
}

function addToBox(state, dexId) {
  var cap = getBoxCap(state.upgrades);
  if (state.box.length >= cap) return "full";
  var pkmn = { iid: genId(), dexId: dexId, level: 1, xp: 0 };
  state.box.push(pkmn);
  state.totalCaught = (state.totalCaught || 0) + 1;
  return pkmn;
}

// ── Offline-Fortschritt ───────────────────────────────────────
function applyOffline(state) {
  var now     = Date.now();
  var elapsed = Math.min(now - (state.lastSeen || now), 8 * 3600 * 1000); // max 8h
  if (elapsed < 5000) { state.lastSeen = now; return null; }
  var secs = elapsed / 1000;

  // Einnahmen
  var earned = computeIncomeSec(state) * secs;
  state.coins      += earned;
  state.totalCoins  = (state.totalCoins || 0) + earned;

  // XP
  tickXP(state, secs);

  // Catches
  var route    = ROUTES.find(function(r) { return r.id === state.activeRoute; }) || ROUTES[0];
  var interval = route.interval * getSpeedMult(state.upgrades);
  var maxC     = Math.min(25, Math.floor(secs / interval));
  var caught   = [];
  for (var i = 0; i < maxC; i++) {
    var dexId = route.pool[Math.floor(Math.random() * route.pool.length)];
    if (willCatch(state.upgrades, dexId)) {
      var res = addToBox(state, dexId);
      if (res === "full") break;
      if (res) caught.push(dexId);
    }
  }

  state.lastSeen = now;
  return { earned: earned, secs: secs, caught: caught };
}

// ── Team-Management ───────────────────────────────────────────
function moveToParty(state, iid) {
  var pMax = getPartyMax(state.upgrades);
  for (var i = 0; i < pMax; i++) {
    if (!state.party[String(i)]) {
      var idx = state.box.findIndex(function(p) { return p.iid === iid; });
      if (idx < 0) return false;
      state.party[String(i)] = state.box.splice(idx, 1)[0];
      return true;
    }
  }
  return false;
}

function moveToBox(state, slot) {
  var p = state.party[String(slot)];
  if (!p) return false;
  if (state.box.length >= getBoxCap(state.upgrades)) return false;
  state.box.push(p);
  state.party[String(slot)] = null;
  return true;
}

// ── Evolution ─────────────────────────────────────────────────
function canEvolve(pkmn) {
  var def = POKEMON[pkmn.dexId];
  if (!def || !def.evolvesTo) return false;
  if (def.evolveLevel && pkmn.level < def.evolveLevel) return false;
  return true;
}

function tryEvolve(state, iid) {
  var pkmn = null;
  var pMax = getPartyMax(state.upgrades);
  for (var i = 0; i < pMax; i++) {
    if (state.party[String(i)] && state.party[String(i)].iid === iid) {
      pkmn = state.party[String(i)]; break;
    }
  }
  if (!pkmn) pkmn = state.box.find(function(p) { return p.iid === iid; });
  if (!pkmn) return { ok:false, reason:"not_found" };

  var def = POKEMON[pkmn.dexId];
  if (!def.evolvesTo)                                   return { ok:false, reason:"no_evo" };
  if (def.evolveLevel && pkmn.level < def.evolveLevel)  return { ok:false, reason:"level", needed:def.evolveLevel };
  var cost = def.evCost || 0;
  if (state.coins < cost)                               return { ok:false, reason:"coins", cost:cost };

  state.coins -= cost;
  var oldName = def.name;
  pkmn.dexId  = def.evolvesTo;
  pkmn.xp     = 0;
  return { ok:true, oldName:oldName, newName:POKEMON[def.evolvesTo].name };
}

// ── Routen freischalten ───────────────────────────────────────
function unlockRoute(state, routeId) {
  var route = ROUTES.find(function(r) { return r.id === routeId; });
  if (!route || state.unlockedRoutes.includes(routeId)) return false;
  if (state.coins < route.cost) return false;
  state.coins -= route.cost;
  state.unlockedRoutes.push(routeId);
  return true;
}

// ── Upgrades ──────────────────────────────────────────────────
function buyUpgrade(state, uid) {
  var upg = UPGRADES.find(function(u) { return u.id === uid; });
  if (!upg || state.upgrades[uid]) return false;
  if (state.coins < upg.cost) return false;
  state.coins -= upg.cost;
  state.upgrades[uid] = true;
  return true;
}

// ── Prestige / Neue Reise ─────────────────────────────────────
function doRebirthLogic(state) {
  if (state.totalCoins < REBIRTH_REQ) return false;
  state.coins          = 0;
  state.totalCoins     = 0;
  state.party          = { "0":null,"1":null,"2":null,"3":null,"4":null,"5":null };
  state.box            = [];
  state.upgrades       = {};
  state.unlockedRoutes = ["route1"];
  state.activeRoute    = "route1";
  state.totalCaught    = 0;
  state.rebirthCount   = (state.rebirthCount || 0) + 1;
  return true;
}
