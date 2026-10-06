// ============================================================
// GAME STATE + ACTIONS (no drawing code here; see ui.js)
// ============================================================

let S = null; // the whole save file lives in this one object
const SAVE_KEY = 'pleaseKillMePolitely.save.v1';

// ---------- small helpers ----------
const rnd = () => Math.random();
const randInt = (a, b) => a + Math.floor(rnd() * (b - a + 1));
const pick = arr => arr[Math.floor(rnd() * arr.length)];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function uid() { return S.nextUid++; }

function say(text, cls = '') {
  S.feed.unshift({ day: S.day, text, cls });
  if (S.feed.length > 60) S.feed.length = 60;
}

// ---------- new game / save / load ----------
function newGame() {
  S = {
    version: 1,
    day: 1,
    nextUid: 1,
    mats: Object.fromEntries(Object.keys(MATERIALS).map(k => [k, 0])),
    inventory: [],
    champions: [],
    retirees: [],
    journal: [],
    feed: [],
    consequences: [],
    pendingReturns: [],
    regions: Object.fromEntries(Object.keys(REGIONS).map(k => [k, {
      unlocked: START_REGIONS.includes(k), bossLast: -99, bossWins: 0, warlord: null, rebellionUntil: 0, buffed: 0,
    }])),
    buildings: Object.fromEntries(Object.entries(BUILDINGS).map(([k, b]) => [k, b.start])),
    bossesBeaten: {},
    arenaToday: 'courtyard',
    stats: { attempts: 0, bestDamage: 0, bestBy: null, gifts: 0, crafted: 0 },
    ended: false,
    killer: null,
  };
  S.mats.wood = 4; S.mats.hide = 2; S.mats.herbs = 2;
  // A first, very unlucky volunteer.
  const gerald = makeChampion('woods', 'human');
  gerald.name = 'Gerald'; gerald.personality = 'Reckless'; gerald.fear = 'loud';
  S.champions.push(gerald);
  NARRATOR.intro.slice().reverse().forEach(t => say(t, 'intro'));
  say('Gerald, a farmer from Mossbottom, has volunteered. He thinks this is a job interview.', 'good');
  return S;
}

function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* storage blocked: game still works this session */ }
}
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || data.version !== 1) return false;
    S = data;
    return true;
  } catch (e) { return false; }
}
function wipeSave() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }

// ---------- materials ----------
function canAfford(cost) { return Object.entries(cost).every(([m, n]) => (S.mats[m] || 0) >= n); }
function pay(cost) { Object.entries(cost).forEach(([m, n]) => { S.mats[m] -= n; }); }
function costText(cost) { return Object.entries(cost).map(([m, n]) => `${n} ${MATERIALS[m].icon} ${MATERIALS[m].name}`).join(', '); }
function gain(loot) {
  const parts = [];
  for (const [m, n] of Object.entries(loot)) {
    if (n <= 0) continue;
    S.mats[m] = (S.mats[m] || 0) + n;
    parts.push(`+${n} ${MATERIALS[m].icon} ${MATERIALS[m].name}`);
  }
  return parts.join(', ') || 'nothing';
}
function rollLoot(table, regionId, bonus = 0) {
  const r = regionId ? S.regions[regionId] : null;
  const tax = r && r.warlord ? 0.6 : 1;
  const out = {};
  for (const [m, [a, b]] of Object.entries(table)) out[m] = Math.round(randInt(a, b) * tax);
  if (bonus > 0) { const keys = Object.keys(table); for (let i = 0; i < bonus; i++) { const k = pick(keys); out[k] = (out[k] || 0) + 1; } }
  return out;
}

// ---------- roles of retirees ----------
function housedRetirees() {
  const cap = BUILDINGS.home.capacity[S.buildings.home];
  return S.retirees.filter(r => r.role !== 'vengeful').slice(0, cap);
}
function roleCount(role) { return housedRetirees().filter(r => r.role === role).length; }
function homeCapacity() { return BUILDINGS.home.capacity[S.buildings.home]; }

// ---------- time ----------
function healPerDay() { return 2 + [0, 3, 6, 9][S.buildings.hospital] + roleCount('healer') * 2; }

function unlockedArenas() {
  return Object.keys(ARENAS).filter(id => arenaUnlocked(id));
}
function arenaUnlocked(id) {
  const a = ARENAS[id];
  if (a.start) return true;
  if (a.needs === 'academy') return S.buildings.academy >= 1;
  if (a.needs.startsWith('region:')) return S.regions[a.needs.slice(7)].unlocked;
  if (a.needs.startsWith('boss:')) return !!S.bossesBeaten[a.needs.slice(5)];
  return false;
}

function endDay() {
  S.day++;
  const heal = healPerDay();
  for (const c of S.champions) c.dur = Math.min(c.cap, c.dur + heal);
  // arena rotates
  S.arenaToday = pick(unlockedArenas());
  // rebellions calm down
  for (const [id, r] of Object.entries(S.regions)) {
    if (r.rebellionUntil && r.rebellionUntil === S.day) say(`The rebellion in ${REGIONS[id].name} has calmed down. They will talk to you again.`, 'good');
  }
  // vengeful survivors return
  for (const p of S.pendingReturns.slice()) {
    if (p.day <= S.day) {
      S.pendingReturns.splice(S.pendingReturns.indexOf(p), 1);
      const r = S.retirees.find(x => x.id === p.id);
      if (!r) continue;
      if (S.champions.length >= MAX_ACTIVE_CHAMPIONS) { p.day = S.day + 1; S.pendingReturns.push(p); continue; }
      S.retirees.splice(S.retirees.indexOf(r), 1);
      const c = r.champ;
      c.grudge = true; c.returned = true; c.personality = 'Reckless';
      c.maxDur = Math.max(20, Math.round(c.maxDur * 0.5)); c.cap = c.maxDur; c.dur = c.maxDur;
      c.gear = { weapon: null, armor: null, trinkets: [], consumables: [] };
      S.champions.push(c);
      say(`${c.name} is back. They have been training. Mostly glaring. (+2 Power, +1 Endurance, now Reckless.)`, 'warn');
    }
  }
  if (rnd() < 0.35) say(pick(NARRATOR.idle), 'idle');
}

// ---------- champions ----------
function makeChampion(regionId, raceId) {
  const race = RACES[raceId];
  const base = {};
  STATS.forEach((s, i) => { base[s] = clamp(race.base[i] + randInt(-2, 2), 1, 10); });
  // academy instructors teach new recruits
  const teach = Math.min(roleCount('instructor'), [0, 2, 4][S.buildings.academy] || 0);
  for (let i = 0; i < teach; i++) { const s = pick(STATS); base[s] = Math.min(12, base[s] + 1); }
  const personality = pick(Object.keys(PERSONALITIES));
  const likes = PERSONALITIES[personality].likes || pick(ITEM_TAGS.filter(t => t !== 'cursed'));
  let dislikes = pick(ITEM_TAGS.filter(t => t !== likes));
  const tough = clamp(race.tough + randInt(-1, 1), 2, 11);
  const usedNames = new Set([...S.champions, ...S.retirees.map(r => r.champ)].map(c => c.name));
  const free = race.names.filter(n => !usedNames.has(n));
  let name = free.length ? pick(free) : `${pick(race.names)} the ${['Second', 'Third', 'Younger', 'Spare', 'Backup'][randInt(0, 4)]}`;
  return {
    id: uid(), name, race: raceId, home: regionId, personality, fear: pick(Object.keys(FEARS)),
    likes, dislikes, base, tough, maxDur: tough * 10, cap: tough * 10, dur: tough * 10,
    injuries: [], gear: { weapon: null, armor: null, trinkets: [], consumables: [] },
    attempts: 0, joined: S.day, grudge: false, returned: false, teach,
  };
}

function allGear(c) {
  return [c.gear.weapon, c.gear.armor, ...c.gear.trinkets, ...c.gear.consumables].filter(Boolean);
}
function morale(c) {
  let m = 0;
  for (const it of allGear(c)) {
    const tags = ITEMS[it.key].tags;
    if (tags.includes(c.likes)) m++;
    if (tags.includes(c.dislikes)) m--;
  }
  return m;
}
function stat(c, s) {
  let v = c.base[s];
  for (const inj of c.injuries) if (inj.stat === s && inj.sev >= 2) v -= inj.sev >= 4 ? 2 : 1;
  for (const it of allGear(c)) { const b = ITEMS[it.key].bonus; if (b && b[s]) v += b[s]; }
  if (c.grudge && s === 'POW') v += 2;
  if (c.grudge && s === 'END') v += 1;
  return clamp(v, 1, 14);
}
function worstInjuries(c, n = 3) { return c.injuries.slice().sort((a, b) => b.sev - a.sev).slice(0, n); }
function champClass(c) {
  const best = STATS.slice().sort((a, b) => c.base[b] - c.base[a])[0];
  return { POW: 'Brute', AGI: 'Duelist', MAG: 'Mage', END: 'Juggernaut', WIT: 'Trickster' }[best];
}

// ---------- world actions (each costs one day) ----------
function actGather(regionId) {
  const reg = REGIONS[regionId];
  const loot = rollLoot(reg.gather, regionId, roleCount('shopkeeper'));
  say(`You gather in ${reg.name}. ${gain(loot)}.${S.regions[regionId].warlord ? ' (The warlord took a cut.)' : ''}`);
  endDay();
}
function actDungeon(regionId) {
  const reg = REGIONS[regionId];
  const loot = rollLoot(reg.dungeon.loot, regionId, roleCount('shopkeeper'));
  const r = S.regions[regionId];
  let extra = '';
  if (r.buffed > 0) { loot.ore = (loot.ore || 0) + r.buffed; extra = ` The monsters here are wearing your old gear. You take some of it back. It is still sticky.`; }
  say(`You clear the ${reg.dungeon.name}. Nothing in it could hurt you. ${gain(loot)}.${extra}`);
  endDay();
}
function bossReady(regionId) { return S.day - S.regions[regionId].bossLast >= BOSS_COOLDOWN; }
function actBoss(regionId) {
  const reg = REGIONS[regionId];
  const r = S.regions[regionId];
  if (!bossReady(regionId)) return;
  r.bossLast = S.day; r.bossWins++;
  const loot = rollLoot(reg.boss.loot, null);
  say(`${reg.boss.text} ${gain(loot)}.`, 'good');
  if (!S.bossesBeaten[regionId]) {
    S.bossesBeaten[regionId] = true;
    if (reg.boss.unlocksArena) say(`New arena unlocked: ${ARENAS[reg.boss.unlocksArena].name}.`, 'good');
  }
  endDay();
}
function recruitBlocked(regionId) {
  const r = S.regions[regionId];
  if (r.rebellionUntil > S.day) return `Rebellion! Nobody here will talk to you until day ${r.rebellionUntil}.`;
  if (S.champions.length >= MAX_ACTIVE_CHAMPIONS) return `The barracks only has ${MAX_ACTIVE_CHAMPIONS} beds. Someone has to retire first.`;
  return null;
}
function recruitCandidates(regionId) {
  const reg = REGIONS[regionId];
  const n = Math.min(5, 3 + roleCount('bartender'));
  const list = [];
  for (let i = 0; i < n; i++) list.push(makeChampion(regionId, pick(reg.recruit.races)));
  return list;
}
function actRecruit(regionId, champ) {
  const reg = REGIONS[regionId];
  if (champ) {
    S.champions.push(champ);
    say(`${champ.name} the ${RACES[champ.race].name} joins you from ${reg.recruit.place}. They believe they are here to slay a great evil. Technically, yes.`, 'good');
    const newly = reg.neighbors.filter(n => !S.regions[n].unlocked);
    newly.forEach(n => { S.regions[n].unlocked = true; });
    if (newly.length) say(`${champ.name} knows the way to: ${newly.map(n => REGIONS[n].name).join(', ')}. New region${newly.length > 1 ? 's' : ''} unlocked.`, 'good');
    if (newly.includes('desert')) say('New arena unlocked: Desert Pit.', 'good');
  } else {
    say(`You visit ${reg.recruit.place}, look at the candidates, and leave. They are relieved.`);
  }
  endDay();
}

// ---------- crafting & gifting (free, no day cost) ----------
function canCraft(key) { const it = ITEMS[key]; return S.buildings.forge >= it.forge && canAfford(it.cost); }
function craft(key) {
  if (!canCraft(key)) return;
  pay(ITEMS[key].cost);
  S.inventory.push({ uid: uid(), key });
  S.stats.crafted++;
  say(`You craft a ${ITEMS[key].name}. You cannot use it. It is not for you. Nothing is.`);
}

// Returns a message describing what happened.
function gift(champId, itemUid) {
  const c = S.champions.find(x => x.id === champId);
  const idx = S.inventory.findIndex(x => x.uid === itemUid);
  if (!c || idx < 0) return;
  const item = S.inventory[idx];
  const def = ITEMS[item.key];
  const p = PERSONALITIES[c.personality];
  if (p.refuses && def.tags.includes(p.refuses)) {
    say(`${c.name} looks at the ${def.name} like it insulted their mother. ${c.personality} people don't use ${p.refuses} things. They hand it back.`, 'warn');
    return;
  }
  if (def.slot === 'trinket' && c.gear.trinkets.length >= 2) { say(`${c.name} already has two trinkets. Their pockets are full.`, 'warn'); return; }
  if (def.slot === 'consumable' && c.gear.consumables.length >= 3) { say(`${c.name} can only carry three consumables.`, 'warn'); return; }
  S.inventory.splice(idx, 1);
  if (def.slot === 'weapon' || def.slot === 'armor') {
    const old = c.gear[def.slot];
    if (old) S.inventory.push(old);
    c.gear[def.slot] = item;
    if (old) say(`${c.name} hands back the ${ITEMS[old.key].name}. It is slightly sticky.`);
  } else if (def.slot === 'trinket') c.gear.trinkets.push(item);
  else c.gear.consumables.push(item);
  S.stats.gifts++;
  let reaction = 'They nod.';
  if (def.tags.includes(c.likes)) reaction = `They love it. (${c.likes}!) Morale up.`;
  else if (def.tags.includes(c.dislikes)) reaction = `They hate it. (${c.dislikes}.) Morale down, but they'll carry it.`;
  say(`You gift ${c.name} a ${def.icon} ${def.name}. ${reaction}`);
  // consequence: monsters armed with your gear make their kin stronger
  if (RACES[c.race].monster && (def.forge >= 2 || (def.power || 0) >= 90 || (def.guard || 0) >= 40)) {
    const r = S.regions[c.home];
    r.buffed++;
    addConsequence(`${REGIONS[c.home].name}: ${c.name}'s cousins borrowed the ${def.name} to copy it. The monsters there are stronger now (level ${r.buffed}).`);
  }
}
function takeBack(champId, itemUid) {
  // consumables only: you can take back unused potions.
  const c = S.champions.find(x => x.id === champId);
  const i = c.gear.consumables.findIndex(x => x.uid === itemUid);
  if (i < 0) return;
  S.inventory.push(c.gear.consumables.splice(i, 1)[0]);
  say(`You take back the ${ITEMS[S.inventory[S.inventory.length - 1].key].name}. ${c.name} pretends not to be hurt.`);
}

function addConsequence(text) {
  S.consequences.push({ day: S.day, text });
  say(`🌍 ${text}`, 'world');
}

// ---------- hub upgrades ----------
function upgradeCost(b) { const lvl = S.buildings[b]; return lvl < BUILDINGS[b].max ? BUILDINGS[b].cost[lvl] : null; }
function upgrade(b) {
  const cost = upgradeCost(b);
  if (!cost || !canAfford(cost)) return;
  pay(cost);
  S.buildings[b]++;
  say(`${BUILDINGS[b].icon} ${BUILDINGS[b].name} upgraded to level ${S.buildings[b]}. ${BUILDINGS[b].desc[S.buildings[b]]}`, 'good');
  if (b === 'academy' && S.buildings.academy === 1) say('New arena unlocked: Dusty Library.', 'good');
}
function rebookArena(id) {
  if (S.mats.goldleaf < 1 || !arenaUnlocked(id) || S.arenaToday === id) return;
  S.mats.goldleaf--;
  S.arenaToday = id;
  say(`You bribe the arena guild with Gold Leaf. Today's venue: ${ARENAS[id].name}.`);
}

// ---------- injuries & retirement ----------
function applyInjury(c, cause, sev) {
  const list = INJURIES[cause] || INJURIES.trip;
  const tmpl = pick(list);
  if (c.dur < c.cap * 0.3) sev++; // already worn out: hurts more
  sev = clamp(sev, 1, 4);
  const inj = { name: tmpl.name, icon: tmpl.icon, stat: tmpl.stat, sev, day: S.day, cause };
  c.injuries.push(inj);
  const cost = sev * 10 + (sev >= 3 ? 5 : 0);
  c.dur -= cost;
  c.cap = Math.max(0, c.cap - sev * 3);
  if (c.dur > c.cap) c.dur = c.cap;
  return inj;
}
function needsRetirement(c) {
  return c.dur <= 0 || c.cap < 12 || c.injuries.some(i => i.sev >= 4);
}

// Called by the UI once the player picks a role.
function retire(champId, role) {
  const i = S.champions.findIndex(x => x.id === champId);
  if (i < 0) return;
  const c = S.champions[i];
  S.champions.splice(i, 1);
  if (c.returned && role === 'vengeful') role = 'veteran';
  const rec = { id: c.id, role, champ: c, day: S.day };
  S.retirees.push(rec);
  const reg = REGIONS[c.home];
  const r = S.regions[c.home];
  const weapon = c.gear.weapon ? ITEMS[c.gear.weapon.key] : null;
  // consequences of your gifts
  if ((c.personality === 'Greedy' || c.personality === 'Proud') && weapon && weapon.forge >= 2 && !r.warlord) {
    r.warlord = c.name;
    addConsequence(`${c.name} limped home to ${reg.name} with your ${weapon.name} and declared themselves Warlord. They now tax all gathering there (-40%).`);
  } else if (morale(c) <= -2 && reg.recruit) {
    r.rebellionUntil = S.day + 6;
    addConsequence(`${c.name} told everyone in ${reg.recruit.place} about the gifts they hated. A rebellion breaks out. No recruiting there until day ${r.rebellionUntil}.`);
  } else if (RACES[c.race].monster && allGear(c).length >= 2) {
    r.buffed++;
    addConsequence(`${c.name} went home to ${reg.name} and shared all your gear with the family. The monsters there are stronger (level ${r.buffed}).`);
  }
  if (role === 'vengeful') {
    S.pendingReturns.push({ id: c.id, day: S.day + randInt(4, 7) });
    say(`${c.name} storms off to train. "I'll be back," they say, through a neck brace.`, 'warn');
  } else {
    const housed = housedRetirees().some(x => x.id === c.id);
    say(housed
      ? `${c.name} moves into the Retirement Home as a ${ROLES[role].name}. ${ROLES[role].desc}`
      : `${c.name} wanted to be a ${ROLES[role].name}, but the Retirement Home is full. They wander off and sulk. (Upgrade the home to give them a room.)`, housed ? 'good' : 'warn');
  }
}
