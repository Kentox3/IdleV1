// ═══════════════════════════════════════════════════════
//  config.js  —  Idle Pokémon  (Konfiguration & Daten)
// ═══════════════════════════════════════════════════════

var SPRITE_URL  = function(id) { return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/" + id + ".png"; };
var ARTWORK_URL = function(id) { return "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/" + id + ".png"; };

var RARITIES = {
  Common:    { label:"Häufig",      color:"#52a050", bg:"#eafaea", catchChance:0.90 },
  Uncommon:  { label:"Ungewöhnl.", color:"#3070d0", bg:"#eaf0ff", catchChance:0.65 },
  Rare:      { label:"Selten",      color:"#8040c8", bg:"#f5eaff", catchChance:0.40 },
  Epic:      { label:"Episch",      color:"#c07020", bg:"#fff5e0", catchChance:0.18 },
  Legendary: { label:"Legendär",    color:"#cc2020", bg:"#ffeaea", catchChance:0.05 },
};

// evCost = Münzen um zu entwickeln, evolveLevel = Mindest-Level
var POKEMON = {
  // ── Route 1 ──────────────────────────────────────────────────
  16:  { id:16,  name:"Taubsi",     rarity:"Common",    income:2,     evolveLevel:18,   evolvesTo:17,  evCost:200    },
  17:  { id:17,  name:"Tauboga",    rarity:"Uncommon",  income:14,    evolveLevel:36,   evolvesTo:18,  evCost:1400   },
  18:  { id:18,  name:"Tauboss",    rarity:"Rare",      income:60,    evolveLevel:null, evolvesTo:null,evCost:null   },
  19:  { id:19,  name:"Rattfratz",  rarity:"Common",    income:2,     evolveLevel:20,   evolvesTo:20,  evCost:200    },
  20:  { id:20,  name:"Rattikarl",  rarity:"Uncommon",  income:16,    evolveLevel:null, evolvesTo:null,evCost:null   },
  // ── Route 2 ──────────────────────────────────────────────────
  10:  { id:10,  name:"Raupy",      rarity:"Common",    income:3,     evolveLevel:7,    evolvesTo:11,  evCost:300    },
  11:  { id:11,  name:"Safcon",     rarity:"Common",    income:6,     evolveLevel:10,   evolvesTo:12,  evCost:600    },
  12:  { id:12,  name:"Butterfree", rarity:"Uncommon",  income:28,    evolveLevel:null, evolvesTo:null,evCost:null   },
  13:  { id:13,  name:"Hornliu",    rarity:"Common",    income:3,     evolveLevel:7,    evolvesTo:14,  evCost:300    },
  14:  { id:14,  name:"Kokuna",     rarity:"Common",    income:7,     evolveLevel:10,   evolvesTo:15,  evCost:700    },
  15:  { id:15,  name:"Bibor",      rarity:"Uncommon",  income:30,    evolveLevel:null, evolvesTo:null,evCost:null   },
  // ── Route 3 ──────────────────────────────────────────────────
  39:  { id:39,  name:"Pummeluff",  rarity:"Common",    income:12,    evolveLevel:null, evolvesTo:40,  evCost:1200   },
  40:  { id:40,  name:"Knuddeluff", rarity:"Uncommon",  income:55,    evolveLevel:null, evolvesTo:null,evCost:null   },
  35:  { id:35,  name:"Piepi",      rarity:"Uncommon",  income:18,    evolveLevel:null, evolvesTo:36,  evCost:1800   },
  36:  { id:36,  name:"Pixi",       rarity:"Rare",      income:80,    evolveLevel:null, evolvesTo:null,evCost:null   },
  25:  { id:25,  name:"Pikachu",    rarity:"Uncommon",  income:22,    evolveLevel:null, evolvesTo:26,  evCost:2200   },
  26:  { id:26,  name:"Raichu",     rarity:"Rare",      income:100,   evolveLevel:null, evolvesTo:null,evCost:null   },
  // ── Route 4 ──────────────────────────────────────────────────
  41:  { id:41,  name:"Zubat",      rarity:"Common",    income:18,    evolveLevel:22,   evolvesTo:42,  evCost:1800   },
  42:  { id:42,  name:"Golbat",     rarity:"Uncommon",  income:80,    evolveLevel:null, evolvesTo:null,evCost:null   },
  74:  { id:74,  name:"Kleinstein", rarity:"Common",    income:20,    evolveLevel:25,   evolvesTo:75,  evCost:2000   },
  75:  { id:75,  name:"Georok",     rarity:"Uncommon",  income:90,    evolveLevel:36,   evolvesTo:76,  evCost:9000   },
  76:  { id:76,  name:"Geowaz",     rarity:"Rare",      income:350,   evolveLevel:null, evolvesTo:null,evCost:null   },
  95:  { id:95,  name:"Orix",       rarity:"Rare",      income:140,   evolveLevel:null, evolvesTo:null,evCost:null   },
  // ── Route 5 ──────────────────────────────────────────────────
  52:  { id:52,  name:"Mauzi",      rarity:"Common",    income:40,    evolveLevel:28,   evolvesTo:53,  evCost:4000   },
  53:  { id:53,  name:"Snobilikat", rarity:"Uncommon",  income:160,   evolveLevel:null, evolvesTo:null,evCost:null   },
  37:  { id:37,  name:"Vulpix",     rarity:"Uncommon",  income:55,    evolveLevel:null, evolvesTo:38,  evCost:5500   },
  38:  { id:38,  name:"Vulnona",    rarity:"Rare",      income:260,   evolveLevel:null, evolvesTo:null,evCost:null   },
  58:  { id:58,  name:"Fukano",     rarity:"Uncommon",  income:65,    evolveLevel:50,   evolvesTo:59,  evCost:6500   },
  59:  { id:59,  name:"Arkani",     rarity:"Rare",      income:400,   evolveLevel:null, evolvesTo:null,evCost:null   },
  // ── Route 6 ──────────────────────────────────────────────────
  72:  { id:72,  name:"Tentacha",   rarity:"Common",    income:100,   evolveLevel:30,   evolvesTo:73,  evCost:10000  },
  73:  { id:73,  name:"Tentoxa",    rarity:"Uncommon",  income:450,   evolveLevel:null, evolvesTo:null,evCost:null   },
  118: { id:118, name:"Goldini",    rarity:"Common",    income:110,   evolveLevel:33,   evolvesTo:119, evCost:11000  },
  119: { id:119, name:"Golking",    rarity:"Uncommon",  income:500,   evolveLevel:null, evolvesTo:null,evCost:null   },
  120: { id:120, name:"Sterndu",    rarity:"Uncommon",  income:150,   evolveLevel:null, evolvesTo:121, evCost:15000  },
  121: { id:121, name:"Starmie",    rarity:"Rare",      income:700,   evolveLevel:null, evolvesTo:null,evCost:null   },
  // ── Route 7 ──────────────────────────────────────────────────
  123: { id:123, name:"Scyther",    rarity:"Rare",      income:1000,  evolveLevel:null, evolvesTo:null,evCost:null   },
  125: { id:125, name:"Elektek",    rarity:"Rare",      income:1100,  evolveLevel:null, evolvesTo:null,evCost:null   },
  127: { id:127, name:"Pinsir",     rarity:"Rare",      income:950,   evolveLevel:null, evolvesTo:null,evCost:null   },
  // ── Victory Road ─────────────────────────────────────────────
  147: { id:147, name:"Dratini",    rarity:"Rare",      income:3000,  evolveLevel:30,   evolvesTo:148, evCost:300000 },
  148: { id:148, name:"Dragonir",   rarity:"Epic",      income:12000, evolveLevel:55,   evolvesTo:149, evCost:1200000},
  149: { id:149, name:"Dragonit",   rarity:"Legendary", income:60000, evolveLevel:null, evolvesTo:null,evCost:null   },
  131: { id:131, name:"Lapras",     rarity:"Epic",      income:8000,  evolveLevel:null, evolvesTo:null,evCost:null   },
  143: { id:143, name:"Relaxo",     rarity:"Epic",      income:7000,  evolveLevel:null, evolvesTo:null,evCost:null   },
};

// pool: gewichtetes Array (häufigere Einträge = häufiger gefangen)
var ROUTES = [
  { id:"route1",  name:"Route 1",             cost:0,         interval:30,  bg:"#c8f0a0",
    pool:[16,16,16,19,19,19],           desc:"Der erste Schritt deiner Reise" },
  { id:"route2",  name:"Route 2 – Wald",      cost:500,       interval:40,  bg:"#90d060",
    pool:[10,10,13,13,11,14],           desc:"Raupy & Hornliu im Wald" },
  { id:"route3",  name:"Route 3 – Hügel",     cost:5000,      interval:50,  bg:"#f8c8e0",
    pool:[39,39,35,25,25,39],           desc:"Pikachu lebt hier im hohen Gras!" },
  { id:"route4",  name:"Route 4 – Höhle",     cost:50000,     interval:60,  bg:"#a0a0b8",
    pool:[41,41,74,74,95,42],           desc:"Dunkle Höhlen mit mächtigen Pokémon" },
  { id:"route5",  name:"Route 5 – Savanne",   cost:500000,    interval:70,  bg:"#f0b070",
    pool:[52,52,37,58,37,53],           desc:"Feuer-Pokémon beherrschen die Savanne" },
  { id:"route6",  name:"Route 6 – Meer",      cost:5000000,   interval:90,  bg:"#70c8f0",
    pool:[72,72,118,118,120,73],        desc:"Weite Ozeane und verborgene Tiefen" },
  { id:"route7",  name:"Route 7 – Dschungel", cost:50000000,  interval:120, bg:"#408040",
    pool:[123,127,125,123,127,123],     desc:"Scyther & Pinsir herrschen hier" },
  { id:"victory", name:"Victory Road",         cost:500000000, interval:180, bg:"#d0a8f0",
    pool:[147,147,131,143,148,147],     desc:"Nur die Stärksten bestehen hier!" },
];

var UPGRADES = [
  // Fangen
  { id:"ball1",  name:"Superball",          emoji:"🔵", desc:"Fangrate +15%",               cost:1000,       effect:"catchRate",  val:0.15, section:"⚽ Fangen" },
  { id:"ball2",  name:"Hyperball",          emoji:"⚪", desc:"Fangrate +30%",               cost:100000,     effect:"catchRate",  val:0.30, section:"⚽ Fangen" },
  { id:"ball3",  name:"Meisterball",        emoji:"🟣", desc:"Garantierter Fang!",          cost:10000000,   effect:"masterball", val:1,    section:"⚽ Fangen" },
  // Einkommen
  { id:"inc1",   name:"Basis-Training",     emoji:"💪", desc:"Einnahmen ×1.25",            cost:2000,       effect:"income",     val:0.25, section:"💰 Einkommen" },
  { id:"inc2",   name:"Arena-Training",     emoji:"🏋️", desc:"Einnahmen ×1.5",             cost:200000,     effect:"income",     val:0.50, section:"💰 Einkommen" },
  { id:"inc3",   name:"Elitevier-Training", emoji:"⚡", desc:"Einnahmen ×2",               cost:20000000,   effect:"income",     val:1.00, section:"💰 Einkommen" },
  { id:"inc4",   name:"Champion-Training",  emoji:"🏆", desc:"Einnahmen ×3",               cost:1000000000, effect:"income",     val:2.00, section:"💰 Einkommen" },
  // Tempo
  { id:"spd1",   name:"Schnell-Fuß",        emoji:"👟", desc:"25% schnellere Begegnungen", cost:5000,       effect:"speed",      val:0.25, section:"⚡ Tempo" },
  { id:"spd2",   name:"Fahrrad",            emoji:"🚲", desc:"40% schnellere Begegnungen", cost:1000000,    effect:"speed",      val:0.40, section:"⚡ Tempo" },
  // Lager
  { id:"box1",   name:"Pokébox +15",        emoji:"📦", desc:"15 mehr Box-Plätze",         cost:3000,       effect:"box",        val:15,   section:"🗃️ Lager" },
  { id:"box2",   name:"Pokébox +30",        emoji:"🗃️", desc:"30 weitere Box-Plätze",      cost:1000000,    effect:"box",        val:30,   section:"🗃️ Lager" },
  // Team
  { id:"party1", name:"7. Teammitglied",    emoji:"✨", desc:"Partygröße auf 7",           cost:100000000,  effect:"partySize",  val:1,    section:"👜 Team" },
];

var BOX_BASE    = 30;
var PARTY_BASE  = 6;
var REBIRTH_REQ = 100000000; // 100 Mio

function XP_PER_LEVEL(lvl)       { return lvl * 50; }
function INCOME_SCALE(base, lvl) { return base * (1 + 0.15 * (lvl - 1)); }

var UNITS = ["","K","M","B","T","Qa","Qi","Sx","Sp","Oc"];
function fmt(n) {
  n = Math.floor(n);
  if (n < 1000) return "" + n;
  var t = Math.floor(Math.log10(n) / 3);
  if (t >= UNITS.length) t = UNITS.length - 1;
  var v = n / Math.pow(1000, t);
  return (v < 10 ? v.toFixed(2) : v < 100 ? v.toFixed(1) : Math.floor(v)) + UNITS[t];
}
function genId() {
  return (typeof crypto !== "undefined" && crypto.randomUUID)
    ? crypto.randomUUID()
    : "p" + Date.now() + Math.random().toString(36).slice(2);
}
