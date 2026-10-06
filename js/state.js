// The save file: everything that changes while you play. Saved in the browser automatically.

const SAVE_KEY = 'please-kill-me-politely-v1';
let S = null;

function rand(n) { return Math.floor(Math.random() * n); }
function pick(arr) { return arr[rand(arr.length)]; }
function randInt(a, b) { return a + rand(b - a + 1); }
function shuffle(arr) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = rand(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function newState() {
  return {
    res: { bogiron: 3, mossthread: 3, glowcap: 2, bonedust: 1, glasseye: 0 },
    gifts: {},            // crafted, not yet given: { giftId: count }
    roster: [],           // active champions
    board: [],            // recruits waiting on the board
    retirees: [],
    journal: [],
    buildings: { hospital: false, academy: false },
    toad: 0,
    trips: 0,
    attempts: 0,
    crafted: {},
    injuriesDealt: 0,
    recruitedTotal: 0,
    vengefulQueue: [],
    won: false,
    winInfo: null,
    nextId: 1,
    seenIntro: false,
  };
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* no storage: game still works */ }
}

function loadGame() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) { S = JSON.parse(raw); return; }
  } catch (e) { /* fall through to a new game */ }
  S = newState();
  refreshBoard();
}

function resetGame() {
  try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
  S = newState();
  refreshBoard();
  save();
}

// ---------- Retiree bonuses ----------
function roleCount(role) { return S.retirees.filter(r => r.role === role).length; }

// ---------- Recruits ----------
function makeRecruit(archId, opts) {
  opts = opts || {};
  const a = ARCHETYPES[archId];
  let maxDur = randInt(a.durability[0], a.durability[1]) + roleCount('bartender') * 8 + (S.buildings.academy ? 5 : 0);
  let power = a.power + roleCount('instructor') * (S.buildings.academy ? 2 : 1);
  let name = opts.name || (pick(a.first) + ' ' + pick(a.last));
  if (opts.grudge) { maxDur = 35; power += 3; }
  return {
    id: S.nextId++, name, arch: archId,
    maxDur, cap: maxDur, dur: maxDur,
    power, agility: a.agility, stamina: a.stamina,
    injuries: [], gifts: [], attempts: 0, grudge: !!opts.grudge,
  };
}

function refreshBoard() {
  const archs = shuffle(Object.keys(ARCHETYPES)).slice(0, 3);
  S.board = archs.map(a => makeRecruit(a));
  // A vengeful retiree comes back for another go
  if (S.vengefulQueue.length) {
    const v = S.vengefulQueue.shift();
    S.board.unshift(makeRecruit(v.arch, { name: v.name + ', Returned', grudge: true }));
  }
}

// ---------- Champion helpers ----------
function topInjuries(ch, n) {
  return ch.injuries.slice().sort((a, b) => b.sev - a.sev).slice(0, n);
}

function retireChampion(ch) {
  S.roster = S.roster.filter(c => c.id !== ch.id);
  // Pick a role: prefer one nobody has yet
  const all = Object.keys(ROLES);
  const unused = all.filter(r => roleCount(r) === 0);
  const role = pick(unused.length ? unused : all);
  const retiree = {
    name: ch.name, arch: ch.arch, role, attempts: ch.attempts,
    injuries: ch.injuries.slice(), gifts: ch.gifts.slice(),
  };
  S.retirees.push(retiree);
  if (role === 'vengeful' && !ch.grudge) S.vengefulQueue.push({ name: ch.name, arch: ch.arch });
  return retiree;
}

function canAfford(cost) {
  return Object.keys(cost).every(k => (S.res[k] || 0) >= cost[k]);
}
function pay(cost) {
  Object.keys(cost).forEach(k => { S.res[k] -= cost[k]; });
}
