// ═══════════════════════════════════════════════
//  db.js  —  Firebase (ES-Modul, IdleV1-Prefix)
// ═══════════════════════════════════════════════

import { initializeApp, getApps, getApp }              from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getDatabase, ref, get, set, update }           from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey:            "AIzaSyCse7ZqdinNvdIE81aLlrM-T9mhmLQbfNM",
  authDomain:        "kinderpunkte.firebaseapp.com",
  databaseURL:       "https://kinderpunkte-default-rtdb.europe-west1.firebasedatabase.app",
  projectId:         "kinderpunkte",
  storageBucket:     "kinderpunkte.firebasestorage.app",
  messagingSenderId: "692809846345",
  appId:             "1:692809846345:web:7f768feca0a0a5f7ee3998"
};

// "idle" als App-Name verhindert Konflikte mit dem Klicker-Game
const _app = getApps().find(a => a.name === "idle") || initializeApp(firebaseConfig, "idle");
const _db  = getDatabase(_app);

const DB_PREFIX = "IdleV1";
const _players  = DB_PREFIX + "/players";
const _accounts = DB_PREFIX + "/accounts";

const playerPath = id  => _players  + "/" + id;
const acctPath   = key => _accounts + "/" + key;

async function dbGet(p)    { const s = await get(ref(_db, p)); return s.val(); }
async function dbSet(p, v) { await set(ref(_db, p), v); }
async function dbUpd(p, v) { await update(ref(_db, p), v); }

// ── Passwort-Hashing (PBKDF2, 120k Iterationen) ──
function buf2hex(buf) { return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2,"0")).join(""); }
function hex2buf(hex) { const a = new Uint8Array(hex.length/2); for (let i=0;i<a.length;i++) a[i]=parseInt(hex.substr(i*2,2),16); return a; }

async function hashPassword(pw, saltHex) {
  const enc  = new TextEncoder();
  const salt = saltHex ? hex2buf(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const km   = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name:"PBKDF2", salt, iterations:120000, hash:"SHA-256" }, km, 256);
  return { salt: buf2hex(salt), hash: buf2hex(bits) };
}

async function emailToKey(email) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(email.toLowerCase().trim()));
  return buf2hex(buf).slice(0, 32);
}

// ── Globals für andere Skripte freigeben ──
window.dbGet        = dbGet;
window.dbSet        = dbSet;
window.dbUpd        = dbUpd;
window.hashPassword = hashPassword;
window.emailToKey   = emailToKey;
window.playerPath   = playerPath;
window.acctPath     = acctPath;
window._firebaseReady = true;
document.dispatchEvent(new Event("firebaseReady"));
