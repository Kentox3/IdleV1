// ════════════════════════════════════════════
//  ui.js  —  Rendering & DOM-Manipulation
// ════════════════════════════════════════════

var _lastEncId = null; // verhindert unnötiges DOM-Rebuilding

// ── Haupt-Render ──────────────────────────────────────────────
function renderAll() {
  updateHeader();
  var active = document.querySelector(".view.active");
  if (!active) return;
  var id = active.id;
  if      (id === "viewRoute") renderRoute();
  else if (id === "viewTeam")  renderTeam();
  else if (id === "viewBox")   renderBox();
  else if (id === "viewShop")  renderShop();
}

// Leichtes Per-Sekunde-Update (keine DOM-Rebuilds)
function updateUI() {
  if (!STATE) return;
  updateHeader();
  var active = document.querySelector(".view.active");
  if (!active) return;
  var id = active.id;
  if (id === "viewRoute") updateEncTimer();
  if (id === "viewTeam")  updateTeamLive();
  if (id === "viewShop")  updateRebirthBtn();
}

// ── Header ────────────────────────────────────────────────────
function updateHeader() {
  if (!STATE) return;
  document.getElementById("hCoins").textContent = fmt(STATE.coins);
  var inc = computeIncomeSec(STATE);
  document.getElementById("hIncome").textContent = "+" + (inc < 10 ? inc.toFixed(1) : fmt(inc)) + "/s";
}

// ── Route-View ────────────────────────────────────────────────
function renderRoute() {
  if (!STATE) return;
  var route = ROUTES.find(function(r) { return r.id === STATE.activeRoute; }) || ROUTES[0];

  document.getElementById("rName").textContent = route.name;
  document.getElementById("rDesc").textContent = route.desc;
  document.getElementById("rTrainerName").textContent = STATE.name;
  // Route-Farbe für Encounter-Zone
  document.getElementById("encZone").style.background = route.bg;

  // ── Route-Karten ──
  var grid = document.getElementById("routeGrid");
  grid.innerHTML = "";
  ROUTES.forEach(function(r) {
    var unlocked = STATE.unlockedRoutes.includes(r.id);
    var isActive = r.id === STATE.activeRoute;
    var div = document.createElement("div");
    div.className = "route-card" + (isActive ? " route-active" : "") + (!unlocked ? " route-locked" : "");
    div.style.background = unlocked ? r.bg : "#d5d5d5";

    // Preview: erste 3 verschiedene Pokémon
    var preview = [];
    r.pool.forEach(function(id) { if (!preview.includes(id)) preview.push(id); });
    preview = preview.slice(0, 3);
    var sprites = preview.map(function(id) {
      return '<img src="' + SPRITE_URL(id) + '" class="route-sprite" loading="lazy" alt="' + (POKEMON[id] ? POKEMON[id].name : "") + '">';
    }).join("");

    div.innerHTML =
      '<div class="rc-title">' + r.name + '</div>' +
      '<div class="rc-desc">' + r.desc + '</div>' +
      '<div class="rc-sprites">' + sprites + '</div>' +
      (isActive  ? '<div class="rc-badge rc-active">✅ Aktiv</div>' : '') +
      (!unlocked ? '<div class="rc-badge rc-lock">🔒 ' + fmt(r.cost) + ' ₽</div>' : '');

    if (unlocked && !isActive) {
      div.onclick = (function(rid) { return function() { doSelectRoute(rid); }; })(r.id);
    } else if (!unlocked) {
      div.onclick = (function(rid) { return function() { doUnlockRoute(rid); }; })(r.id);
    }
    grid.appendChild(div);
  });

  updateEncTimer();
}

// ─ Encounter-Timer & Encounter-Anzeige (1×/Sekunde)
function updateEncTimer() {
  if (ENC_SHOW > 0) {
    document.getElementById("encWait").hidden = true;
    document.getElementById("encShow").hidden = false;
    refreshEncDisplay();
  } else {
    document.getElementById("encWait").hidden = false;
    document.getElementById("encShow").hidden = true;
    var pct = CATCH_LIMIT > 0 ? ((CATCH_LIMIT - CATCH_TIMER) / CATCH_LIMIT) * 100 : 0;
    document.getElementById("encFill").style.width = Math.max(0, pct) + "%";
    document.getElementById("encTime").textContent = Math.max(0, CATCH_TIMER) + "s";
  }
}

function refreshEncDisplay() {
  if (!ENC_PKID) return;
  if (_lastEncId === ENC_PKID) return; // bereits gerendert
  _lastEncId = ENC_PKID;

  var def = POKEMON[ENC_PKID];
  var rar = RARITIES[def.rarity];

  document.getElementById("encText").textContent = "Ein wildes " + def.name + " taucht auf!";
  var rarEl = document.getElementById("encRarity");
  rarEl.textContent = rar.label;
  rarEl.style.color = rar.color;

  var sp = document.getElementById("encSprite");
  sp.src = ARTWORK_URL(ENC_PKID);
  sp.className = "enc-sprite enc-pop";
  sp.addEventListener("animationend", function() { sp.className = "enc-sprite"; }, { once:true });

  var resEl = document.getElementById("encResult");
  if (ENC_RESULT === "caught") {
    resEl.textContent = "✅ " + def.name + " wurde gefangen!";
    resEl.className   = "enc-result enc-caught";
  } else if (ENC_RESULT === "full") {
    resEl.textContent = "📦 Box voll! " + def.name + " entkommen.";
    resEl.className   = "enc-result enc-full";
  } else {
    resEl.textContent = "💨 " + def.name + " ist entkommen!";
    resEl.className   = "enc-result enc-fled";
  }
}

// ── Team-View ─────────────────────────────────────────────────
function renderTeam() {
  if (!STATE) return;
  var pMax = getPartyMax(STATE.upgrades);
  var grid = document.getElementById("partyGrid");
  grid.innerHTML = "";

  for (var i = 0; i < pMax; i++) {
    var p    = STATE.party[String(i)];
    var slot = document.createElement("div");
    var si   = i; // closure

    if (p) {
      var def  = POKEMON[p.dexId];
      var rar  = RARITIES[def.rarity];
      var inc  = INCOME_SCALE(def.income, p.level) * getIncMult(STATE.upgrades, STATE.rebirthCount);
      var xpPct = Math.round((p.xp / XP_PER_LEVEL(p.level)) * 100);
      var canEv = canEvolve(p);

      slot.className = "party-slot";
      slot.style.borderColor = rar.color;
      slot.innerHTML =
        '<div class="ps-rar" style="color:' + rar.color + '">' + rar.label + '</div>' +
        '<img src="' + SPRITE_URL(def.id) + '" class="ps-sprite" loading="lazy" alt="' + def.name + '">' +
        '<div class="ps-name">' + def.name + '</div>' +
        '<div class="ps-lvl">Lv. ' + p.level + '</div>' +
        '<div class="ps-inc">+' + fmt(inc) + '/s</div>' +
        '<div class="xp-bar"><div class="xp-fill" style="width:' + xpPct + '%"></div></div>' +
        (canEv ? '<div class="ps-evo">✨ Entwickeln!</div>' : '') +
        '<button class="ps-del" title="In Box legen">📦</button>';

      (function(pkmn, slotIdx) {
        slot.querySelector(".ps-sprite").onclick = function() { openPokeModal(pkmn.iid); };
        slot.querySelector(".ps-del").onclick    = function() { doMoveToBox(slotIdx); };
        if (canEv) slot.querySelector(".ps-evo").onclick = function() { doEvolveItem(pkmn.iid); };
      })(p, si);

    } else {
      slot.className = "party-slot party-empty";
      slot.innerHTML = '<div class="ps-empty-ico">➕</div><div class="ps-empty-txt">Leer</div>';
    }
    grid.appendChild(slot);
  }

  document.getElementById("teamIncome").textContent = "+" + fmt(computeIncomeSec(STATE)) + "/s";
  renderMiniBox();
}

// Leichtes Update (XP-Balken, Level, Income) ohne vollständigen Rebuild
function updateTeamLive() {
  if (!STATE) return;
  var pMax  = getPartyMax(STATE.upgrades);
  var slots = document.querySelectorAll(".party-slot");
  var needRebuild = false;

  for (var i = 0; i < Math.min(slots.length, pMax); i++) {
    var p = STATE.party[String(i)];
    if (!p) continue;
    var def = POKEMON[p.dexId];
    var xpEl  = slots[i].querySelector(".xp-fill");
    var lvlEl = slots[i].querySelector(".ps-lvl");
    var incEl = slots[i].querySelector(".ps-inc");
    var evoEl = slots[i].querySelector(".ps-evo");

    if (xpEl)  xpEl.style.width = Math.round((p.xp / XP_PER_LEVEL(p.level)) * 100) + "%";
    if (lvlEl) lvlEl.textContent = "Lv. " + p.level;
    if (incEl) {
      var inc = INCOME_SCALE(def.income, p.level) * getIncMult(STATE.upgrades, STATE.rebirthCount);
      incEl.textContent = "+" + fmt(inc) + "/s";
    }
    // Hat dieses Pokémon gerade die Evolve-Schwelle erreicht?
    if (!evoEl && canEvolve(p)) needRebuild = true;
  }

  if (needRebuild) renderTeam();
  else {
    var incEl2 = document.getElementById("teamIncome");
    if (incEl2) incEl2.textContent = "+" + fmt(computeIncomeSec(STATE)) + "/s";
  }
}

function renderMiniBox() {
  var mb = document.getElementById("miniBox");
  mb.innerHTML = "";
  if (!STATE.box.length) {
    mb.innerHTML = '<div class="empty-msg">Box leer – Pokémon werden automatisch gefangen</div>';
    return;
  }
  var show = STATE.box.slice(-12).reverse();
  show.forEach(function(p) {
    var def = POKEMON[p.dexId];
    if (!def) return;
    var rar = RARITIES[def.rarity];
    var mini = document.createElement("div");
    mini.className = "mini-card";
    mini.style.borderColor = rar.color;
    mini.innerHTML =
      '<img src="' + SPRITE_URL(def.id) + '" class="mini-sp" loading="lazy" alt="' + def.name + '">' +
      '<div class="mini-name">' + def.name + '</div>' +
      '<div class="mini-lvl">Lv.' + p.level + '</div>';
    mini.onclick = (function(iid) { return function() { openPokeModal(iid); }; })(p.iid);
    mb.appendChild(mini);
  });
  if (STATE.box.length > 12) {
    var more = document.createElement("div");
    more.className = "mini-more";
    more.textContent = "+" + (STATE.box.length - 12) + " mehr";
    more.onclick = function() {
      switchView("Box", document.querySelectorAll(".tab")[2]);
    };
    mb.appendChild(more);
  }
}

// ── Box-View ──────────────────────────────────────────────────
function renderBox() {
  if (!STATE) return;
  var cap = getBoxCap(STATE.upgrades);
  document.getElementById("boxCount").textContent = STATE.box.length + "/" + cap;
  var grid = document.getElementById("boxGrid");
  grid.innerHTML = "";

  if (!STATE.box.length) {
    grid.innerHTML = '<div class="empty-msg" style="grid-column:1/-1">Box leer!<br>Pokémon werden automatisch auf Routen gefangen.</div>';
    return;
  }

  // Nach Seltenheit absteigend sortieren
  var ORDER = { Common:1, Uncommon:2, Rare:3, Epic:4, Legendary:5 };
  var sorted = STATE.box.slice().sort(function(a, b) {
    var da = POKEMON[a.dexId], db = POKEMON[b.dexId];
    var ra = da ? (ORDER[da.rarity] || 0) : 0;
    var rb = db ? (ORDER[db.rarity] || 0) : 0;
    return rb !== ra ? rb - ra : (da ? da.id : 0) - (db ? db.id : 0);
  });

  sorted.forEach(function(p) {
    var def = POKEMON[p.dexId];
    if (!def) return;
    var rar  = RARITIES[def.rarity];
    var xpPct = Math.round((p.xp / XP_PER_LEVEL(p.level)) * 100);
    var canEv = canEvolve(p);

    var card = document.createElement("div");
    card.className = "box-card";
    card.style.borderColor = rar.color;
    card.innerHTML =
      '<div class="bc-top" style="background:' + rar.bg + '">' +
        '<img src="' + SPRITE_URL(def.id) + '" class="bc-sp" loading="lazy" alt="' + def.name + '">' +
        (canEv ? '<div class="bc-evo">✨</div>' : '') +
      '</div>' +
      '<div class="bc-body">' +
        '<div class="bc-name">' + def.name + '</div>' +
        '<div class="bc-sub">Lv. ' + p.level + ' · <span style="color:' + rar.color + '">' + rar.label + '</span></div>' +
        '<div class="xp-bar"><div class="xp-fill" style="width:' + xpPct + '%"></div></div>' +
        '<div class="bc-inc">+' + fmt(INCOME_SCALE(def.income, p.level)) + '/s</div>' +
      '</div>' +
      '<div class="bc-btns">' +
        '<button class="bc-btn bc-g">+Team</button>' +
        '<button class="bc-btn bc-b">Info</button>' +
      '</div>';

    (function(pkmn) {
      card.querySelectorAll(".bc-btn")[0].onclick = function() { doMoveToParty(pkmn.iid); };
      card.querySelectorAll(".bc-btn")[1].onclick = function() { openPokeModal(pkmn.iid); };
    })(p);

    grid.appendChild(card);
  });
}

// ── Shop-View ─────────────────────────────────────────────────
function renderShop() {
  if (!STATE) return;
  var list = document.getElementById("upgradeList");
  list.innerHTML = "";

  // Reihenfolge der Sektionen erhalten
  var secOrder = [], secMap = {};
  UPGRADES.forEach(function(u) {
    if (!secMap[u.section]) { secMap[u.section] = []; secOrder.push(u.section); }
    secMap[u.section].push(u);
  });

  secOrder.forEach(function(sec) {
    var wrap = document.createElement("div");
    wrap.className = "upg-section";
    var html = '<div class="upg-sec-title">' + sec + '</div>';

    secMap[sec].forEach(function(u) {
      var bought = !!STATE.upgrades[u.id];
      var canBuy = !bought && STATE.coins >= u.cost;
      html +=
        '<div class="upg-card' + (bought ? ' upg-bought' : (!canBuy ? ' upg-dim' : '')) + '">' +
          '<div class="upg-ico">' + u.emoji + '</div>' +
          '<div class="upg-info">' +
            '<div class="upg-name">' + u.name + '</div>' +
            '<div class="upg-desc">' + u.desc + '</div>' +
          '</div>' +
          '<div class="upg-right">' +
            (bought
              ? '<div class="upg-ok">✅</div>'
              : '<div class="upg-cost">' + fmt(u.cost) + ' ₽</div>' +
                '<button class="upg-btn' + (canBuy ? '' : ' upg-nodough') + '" data-uid="' + u.id + '">Kaufen</button>') +
          '</div>' +
        '</div>';
    });

    wrap.innerHTML = html;
    wrap.querySelectorAll(".upg-btn:not(.upg-nodough)").forEach(function(btn) {
      btn.onclick = function() { doBuyUpgrade(btn.dataset.uid); };
    });
    list.appendChild(wrap);
  });

  updateRebirthBtn();
}

function updateRebirthBtn() {
  if (!STATE) return;
  var can = (STATE.totalCoins || 0) >= REBIRTH_REQ;
  var btn = document.getElementById("rebirthBtn");
  if (btn) btn.disabled = !can;
  var req = document.getElementById("rebirthReq");
  if (req) req.textContent = "Benötigt: " + fmt(REBIRTH_REQ) + " ₽ gesamt (" + fmt(STATE.totalCoins || 0) + " erzielt)";
  var desc = document.getElementById("rebirthDesc");
  if (desc && STATE.rebirthCount > 0)
    desc.textContent = "Reisen: " + STATE.rebirthCount + " (+" + (STATE.rebirthCount * 10) + "% dauerhafter Bonus aktiv)";
}

// ── Pokémon-Modal ─────────────────────────────────────────────
function openPokeModal(iid) {
  if (!STATE) return;
  var pkmn = null, inPartySlot = -1;
  var pMax = getPartyMax(STATE.upgrades);
  for (var i = 0; i < pMax; i++) {
    if (STATE.party[String(i)] && STATE.party[String(i)].iid === iid) {
      pkmn = STATE.party[String(i)]; inPartySlot = i; break;
    }
  }
  if (!pkmn) pkmn = STATE.box.find(function(p) { return p.iid === iid; });
  if (!pkmn) return;

  var def  = POKEMON[pkmn.dexId];
  var rar  = RARITIES[def.rarity];
  var xpPct = Math.round((pkmn.xp / XP_PER_LEVEL(pkmn.level)) * 100);
  var canEv = canEvolve(pkmn);
  var inc  = INCOME_SCALE(def.income, pkmn.level) * getIncMult(STATE.upgrades, STATE.rebirthCount);

  var evoHtml = "";
  if (def.evolvesTo) {
    var nxt = POKEMON[def.evolvesTo];
    evoHtml =
      '<div class="pm-evo">' +
        '<div class="pm-evo-title">→ ' + nxt.name + '</div>' +
        (def.evolveLevel ? '<div class="pm-evo-info">Level ' + def.evolveLevel + ' nötig (aktuell: ' + pkmn.level + ')</div>' : '') +
        '<div class="pm-evo-info">Kosten: ' + fmt(def.evCost || 0) + ' ₽</div>' +
        '<button class="pm-evo-btn' + (canEv ? '' : ' pm-evo-dim') + '" id="pmEvoBtn">' +
          (canEv ? '✨ Jetzt entwickeln!' : 'Noch nicht bereit') +
        '</button>' +
      '</div>';
  } else {
    evoHtml = '<div class="pm-stat"><span>Form</span><span>🏆 Endform</span></div>';
  }

  var card = document.getElementById("pokeModalCard");
  card.innerHTML =
    '<div class="pm-head" style="background:' + rar.color + '">' +
      '<button class="pm-close" onclick="closeModal(\'pokeModal\')">✕</button>' +
      '<img src="' + ARTWORK_URL(def.id) + '" class="pm-art" alt="' + def.name + '">' +
      '<div class="pm-name">' + def.name + '</div>' +
      '<div class="pm-sub">Lv. ' + pkmn.level + ' · ' + rar.label + '</div>' +
    '</div>' +
    '<div class="pm-body">' +
      '<div class="pm-stat"><span>💰 Einnahmen</span><span>' + fmt(inc) + '/s</span></div>' +
      '<div class="pm-stat"><span>⭐ XP</span><span>' + Math.floor(pkmn.xp) + ' / ' + XP_PER_LEVEL(pkmn.level) + '</span></div>' +
      '<div class="xp-bar" style="margin:4px 0 10px"><div class="xp-fill" style="width:' + xpPct + '%"></div></div>' +
      evoHtml +
      '<div class="pm-acts">' +
        (inPartySlot >= 0
          ? '<button class="pm-act red" onclick="doMoveToBox(' + inPartySlot + ');closeModal(\'pokeModal\')">📦 In Box</button>'
          : '<button class="pm-act green" onclick="doMoveToParty(\'' + iid + '\');closeModal(\'pokeModal\')">👜 Ins Team</button>') +
      '</div>' +
    '</div>';

  if (canEv) {
    var evBtn = card.querySelector("#pmEvoBtn");
    if (evBtn) evBtn.onclick = (function(i) { return function() { doEvolveItem(i); closeModal("pokeModal"); }; })(iid);
  }

  document.getElementById("pokeModal").hidden = false;
}

// ── Offline-Modal ─────────────────────────────────────────────
function showOfflineModal(result) {
  var h = Math.floor(result.secs / 3600);
  var m = Math.floor((result.secs % 3600) / 60);
  var timeStr = (h > 0 ? h + "h " : "") + m + "m";

  var counts = {};
  result.caught.forEach(function(id) { counts[id] = (counts[id] || 0) + 1; });
  var caughtStr = Object.keys(counts).map(function(id) {
    var n = POKEMON[id] ? POKEMON[id].name : ("Pokémon #" + id);
    return counts[id] > 1 ? n + " ×" + counts[id] : n;
  }).join(", ") || "Keines";

  document.getElementById("offlineBody").innerHTML =
    '<div class="off-row">⏰ Abwesend: <strong>' + timeStr + '</strong></div>' +
    '<div class="off-row">💰 Verdient: <strong>+' + fmt(result.earned) + ' ₽</strong></div>' +
    '<div class="off-row">📦 Gefangen: <strong>' + caughtStr + '</strong></div>';

  document.getElementById("offlineModal").hidden = false;
}

// ── Toast ─────────────────────────────────────────────────────
function showToast(msg, ok) {
  var t = document.createElement("div");
  t.className = "toast " + (ok !== false ? "t-ok" : "t-err");
  t.textContent = msg;
  document.getElementById("toastZone").appendChild(t);
  setTimeout(function() { t.classList.add("t-fade"); }, 2200);
  setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 2700);
}

// ── Hilfsfunktionen ───────────────────────────────────────────
function closeModal(id) { document.getElementById(id).hidden = true; }
