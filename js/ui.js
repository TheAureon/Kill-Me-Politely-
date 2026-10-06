// ============================================================
// SCREENS — draws the game and handles button clicks.
// ============================================================

const UI = { tab: 'hub', arenaChamp: null, recruitList: null, recruitRegion: null };
const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

const TABS = [
  ['hub', '🏘️ Hub'], ['world', '🗺️ World'], ['forge', '⚒️ Forge'], ['champs', '🛡️ Champions'],
  ['arena', '🏟️ Arena'], ['journal', '📓 Knockout Journal'], ['home', '🏡 Retirement Home'],
];

function render() {
  if (!S) return;
  renderTop();
  $('tabs').innerHTML = TABS.map(([id, label]) =>
    `<button class="${UI.tab === id ? 'active' : ''}" onclick="A.tab('${id}')">${label}</button>`).join('');
  const screens = { hub: screenHub, world: screenWorld, forge: screenForge, champs: screenChamps, arena: screenArena, journal: screenJournal, home: screenHome };
  $('main').innerHTML = screens[UI.tab]();
  $('feed').innerHTML = `<h3 style="margin-top:0">Narrator</h3>` + S.feed.map(e =>
    `<div class="entry ${e.cls}"><span class="d">Day ${e.day}</span>${esc(e.text)}</div>`).join('');
}

function renderTop() {
  const mats = Object.entries(MATERIALS).filter(([k, m]) => !m.rare || S.mats[k] > 0).map(([k, m]) =>
    `<span class="mat ${S.mats[k] ? '' : 'zero'}" title="${m.name}">${m.icon} ${S.mats[k]}</span>`).join('');
  $('top').innerHTML = `<span class="title">Please Kill Me (Politely)</span>
    <span>📅 Day ${S.day}</span>
    <span class="mats">${mats}</span>
    <span class="you">You: ❤️ ${YOU.maxHp}/${YOU.maxHp} <span class="dim">(always)</span></span>`;
}

// ---------- reusable bits ----------
function costHtml(cost) {
  return Object.entries(cost).map(([m, n]) => {
    const ok = (S.mats[m] || 0) >= n;
    return `<span class="cost ${ok ? 'ok' : ''}" title="${MATERIALS[m].name}">${n}${MATERIALS[m].icon}</span>`;
  }).join(' ');
}
function itemChip(it, extra = '') {
  const d = ITEMS[it.key];
  return `<span class="chip" title="${esc(d.desc)}">${d.icon} ${esc(d.name)}${extra}</span>`;
}
function durBar(c) {
  const pc = v => (100 * Math.max(0, v) / c.maxDur).toFixed(1);
  return `<div class="bar" title="Durability ${c.dur}/${c.cap} (started at ${c.maxDur}). Grey stripes = permanent damage.">
    <div class="cur" style="width:${pc(c.dur)}%"></div><div class="cap" style="width:${pc(c.cap - c.dur)}%"></div>
    <div class="scar" style="width:${pc(c.maxDur - c.cap)}%"></div></div>
    <div class="dim" style="font-size:12px">Durability ${Math.max(0, c.dur)}/${c.cap} <span title="permanent loss">(max was ${c.maxDur})</span></div>`;
}
function statsHtml(c) {
  return `<div class="stats">${STATS.map(s => {
    const v = stat(c, s), b = c.base[s];
    const cls = v < b ? 'hurt' : v > b ? 'buff' : '';
    return `<span class="${cls}" title="${STAT_NAMES[s]}">${s} <b>${v}</b></span>`;
  }).join('')}</div>`;
}
function portrait(c) {
  return `<div class="portrait">${RACES[c.race].icon}<span class="inj">${worstInjuries(c).map(i => i.icon).join('')}</span></div>`;
}
function champHeader(c) {
  const P = PERSONALITIES[c.personality];
  const m = morale(c);
  return `<div class="name">${esc(c.name)} ${c.grudge ? '<span class="warn" title="Came back for revenge">😤</span>' : ''}</div>
    <div class="dim" style="font-size:13px">${RACES[c.race].name} ${champClass(c)} from ${REGIONS[c.home].name}</div>
    <div><span class="tag" title="${esc(P.desc)}">${c.personality}</span><span class="tag fear">Fears ${FEARS[c.fear]}</span><span class="tag like">Likes ${c.likes}</span><span class="tag dislike">Hates ${c.dislikes}</span>
    <span class="tag">${m > 0 ? '🙂' : m < 0 ? '😠' : '😐'} Morale ${m >= 0 ? '+' : ''}${m}</span></div>`;
}
function gearHtml(c, canTakeBack) {
  const g = c.gear;
  const slot = (it, label) => it ? itemChip(it) : `<span class="chip empty">${label}</span>`;
  const cons = g.consumables.map(it => canTakeBack
    ? `<button class="chip" title="Click to take it back" onclick="A.takeBack(${c.id},${it.uid})">${ITEMS[it.key].icon} ${esc(ITEMS[it.key].name)} ↩</button>`
    : itemChip(it));
  for (let i = g.consumables.length; i < 3; i++) cons.push(`<span class="chip empty">consumable</span>`);
  const trinkets = g.trinkets.map(it => itemChip(it));
  for (let i = g.trinkets.length; i < 2; i++) trinkets.push(`<span class="chip empty">trinket</span>`);
  return `<div class="gear">${slot(g.weapon, 'no weapon (fists)')}${slot(g.armor, 'no armor')}${trinkets.join('')}</div><div class="gear">${cons.join('')}</div>`;
}

// ---------- HUB ----------
function screenHub() {
  const best = S.stats.bestDamage;
  const cap = homeCapacity(), housed = housedRetirees().length;
  const goal = BUILDINGS.home.capacity[BUILDINGS.home.max];
  return `
  <div class="card you-card">
    <div class="big">🛡️</div>
    <div>
      <h2 style="margin:0">You</h2>
      <div>❤️ ${YOU.maxHp} HP · ✨ Regenerates ${YOU.regen} per round · 🌵 Thorns reflect ${YOU.thorns * 100}% of every melee hit</div>
      <div>🦺 Best armor in the game (only ${YOU.armorCursed * 100}% of a hit gets through) · 🩹 Curse of Duct Tape: nothing comes off. Ever.</div>
      <div class="dim">You never attack. You never upgrade. You just want to save and exit.</div>
    </div>
  </div>
  <div class="hint">Goal: arm champions until one can kill you. Loop: <b>World</b> (gather, recruit) → <b>Forge</b> (craft) → <b>Champions</b> (gift) → <b>Arena</b> (attempt) → read the <b>Knockout Journal</b> and adapt.</div>
  <h3>Closest anyone has come</h3>
  <div class="meter"><div style="width:${(100 * best / YOU.maxHp).toFixed(1)}%"></div></div>
  <div class="dim">${best} / ${YOU.maxHp} damage in one fight${S.stats.bestBy ? ` (by ${esc(S.stats.bestBy)})` : ''}. Your regen fixed it immediately.</div>

  <h3>How could anyone kill you? (your notes)</h3>
  <div class="card" style="font-size:14px">
    Your armor eats direct hits, your thorns punish them, and your regen undoes whatever is left. The rumors say only rare things work:
    <ul style="margin:6px 0 0 0;padding-left:20px">
      <li><b>Indirect damage</b> that ignores armor and thorns: traps, poison (Wyrmbane, from the Elder Wyrm), falling rocks.</li>
      <li><b>The environment</b>: the Collapsing Quarry plus Rigging Charges drops a cliff on you.</li>
      <li><b>Out-sustaining your regen</b>: a tough champion who lasts all ${YOU.maxRounds} rounds. The Insomnia Hex weakens your regen.</li>
      <li><b>Breaking the curse</b>: Curse Solvent (needs the Undying Abbot's seal) lets hits through your armor.</li>
      <li><b>A buffed ally</b> who hits from range: a monster you made strong, called with a Monster Whistle.</li>
    </ul>
    <div class="dim" style="margin-top:6px">No single trick is enough. Stack several in one fight. The Arena's fight sheet shows your net damage per round.</div>
  </div>

  <h3>The Village</h3>
  <div class="grid">${Object.entries(BUILDINGS).map(([id, b]) => {
    const lvl = S.buildings[id], cost = upgradeCost(id);
    return `<div class="card"><b>${b.icon} ${b.name}</b> <span class="dim">level ${lvl}/${b.max}</span>
      <div style="font-size:14px">${b.desc[lvl]}</div>
      ${cost ? `<div class="actions"><button onclick="A.upgrade('${id}')" ${canAfford(cost) ? '' : 'disabled'}>Upgrade: ${costHtml(cost)}</button></div>
      <div class="dim" style="font-size:13px">Next: ${b.desc[lvl + 1]}</div>` : '<div class="good" style="font-size:13px">Fully upgraded.</div>'}
    </div>`;
  }).join('')}</div>

  <h3>Retirement Home (long-term progress)</h3>
  <div class="meter"><div style="width:${(100 * housed / goal).toFixed(1)}%;background:linear-gradient(90deg,#2f5a2f,var(--good))"></div></div>
  <div class="dim">${housed} housed / ${cap} rooms (a full village is ${goal}). ${S.retirees.length - housed - S.pendingReturns.length > 0 ? `${S.retirees.length - housed - S.pendingReturns.length} wandering without a room.` : ''}</div>

  <h3>What your gifts did to the world</h3>
  ${S.consequences.length ? S.consequences.slice().reverse().map(c => `<div class="world" style="color:var(--world)">Day ${c.day}: ${esc(c.text)}</div>`).join('') : '<div class="dim">Nothing yet. Give it time.</div>'}
  <div style="margin-top:24px"><button class="small" onclick="A.reset()">Start a new game</button></div>`;
}

// ---------- WORLD ----------
function screenWorld() {
  return `<h2>The World</h2>
  <div class="hint">Every trip takes one day. Nothing out here can hurt you, which is the problem. Recruiting someone from a region reveals the regions next to it.</div>
  <div class="grid">${Object.entries(REGIONS).map(([id, reg]) => {
    const r = S.regions[id];
    if (!r.unlocked) {
      const from = Object.entries(REGIONS).filter(([, x]) => x.neighbors.includes(id)).map(([, x]) => x.name).join(' or ');
      return `<div class="card locked"><b>${reg.icon} ???</b><div class="dim">Recruit someone from ${from} to learn the way.</div></div>`;
    }
    const boss = bossReady(id);
    const blocked = recruitBlocked(id);
    const status = [];
    if (r.warlord) status.push(`<span class="tag" style="background:#4a3a1a">👑 Warlord ${esc(r.warlord)} (-40% loot)</span>`);
    if (r.rebellionUntil > S.day) status.push(`<span class="tag dislike">🔥 Rebellion until day ${r.rebellionUntil}</span>`);
    if (r.buffed) status.push(`<span class="tag fear">👹 Buffed monsters lvl ${r.buffed}</span>`);
    const range = t => Object.entries(t).map(([m, [a, b]]) => `${MATERIALS[m].icon}${a === b ? a : a + '-' + b}`).join(' ');
    return `<div class="card">
      <b>${reg.icon} ${reg.name}</b>
      <div class="dim" style="font-size:13px">${reg.desc}</div>
      <div>${status.join('')}</div>
      <div class="actions">
        <button onclick="A.gather('${id}')" title="Resource nodes">🌾 Gather <span class="dim">${range(reg.gather)}</span></button>
        <button onclick="A.dungeon('${id}')">🕳️ ${reg.dungeon.name} <span class="dim">${range(reg.dungeon.loot)}</span></button>
        <button onclick="A.boss('${id}')" ${boss ? '' : 'disabled'} title="Boss respawns every ${BOSS_COOLDOWN} days">💀 ${reg.boss.name} ${boss ? `<span class="dim">${range(reg.boss.loot)}</span>` : `(back day ${r.bossLast + BOSS_COOLDOWN})`}</button>
        <button onclick="A.recruitTrip('${id}')" ${blocked ? 'disabled' : ''} title="${esc(blocked || '')}">🍺 Recruit at ${reg.recruit.place}</button>
      </div>
      ${blocked ? `<div class="dim" style="font-size:12px">${esc(blocked)}</div>` : ''}
    </div>`;
  }).join('')}</div>`;
}

// ---------- FORGE ----------
function screenForge() {
  const lvl = S.buildings.forge;
  const slots = [['weapon', 'Weapons'], ['armor', 'Armor'], ['trinket', 'Trinkets (2 per champion)'], ['consumable', 'Consumables (3 per champion, used up each fight)']];
  const inv = {};
  S.inventory.forEach(it => { inv[it.key] = (inv[it.key] || 0) + 1; });
  return `<h2>⚒️ Forge <span class="dim" style="font-size:14px">level ${lvl}</span></h2>
  <div class="hint">Crafting is free and instant. You can't use anything you make. Everything here is a gift for someone else.</div>
  <h3>Your stash</h3>
  <div class="gear">${S.inventory.length ? Object.entries(inv).map(([k, n]) => `<span class="chip" title="${esc(ITEMS[k].desc)}">${ITEMS[k].icon} ${ITEMS[k].name}${n > 1 ? ' ×' + n : ''}</span>`).join('') : '<span class="dim">Empty.</span>'}</div>
  ${slots.map(([slot, label]) => `<h3>${label}</h3><div class="grid">${Object.entries(ITEMS).filter(([, d]) => d.slot === slot).map(([k, d]) => {
    const locked = d.forge > lvl;
    return `<div class="card recipe ${locked ? 'locked' : ''}"><div class="ic">${d.icon}</div><div class="info">
      <b>${d.name}</b> ${d.tags.map(t => `<span class="tag">${t}</span>`).join('')}
      <div style="font-size:13px">${esc(d.desc)}</div>
      <div style="font-size:12px" class="dim">${itemNumbers(d)}</div>
      <div class="actions">${locked ? `<span class="dim">Needs Forge level ${d.forge}</span>` : `<button onclick="A.craft('${k}')" ${canCraft(k) ? '' : 'disabled'}>Craft: ${costHtml(d.cost)}</button>`}</div>
    </div></div>`;
  }).join('')}</div>`).join('')}`;
}
function itemNumbers(d) {
  const p = [];
  if (d.power) p.push(`+${d.power} power`);
  if (d.magicScale) p.push(`+${d.magicScale}×Magic`);
  if (d.guard) p.push(`+${d.guard} guard`);
  if (d.weight) p.push(`weight ${d.weight}`);
  if (d.ranged) p.push('ranged');
  return p.join(' · ');
}

// ---------- CHAMPIONS ----------
function screenChamps() {
  return `<h2>🛡️ Champions <span class="dim" style="font-size:14px">${S.champions.length}/${MAX_ACTIVE_CHAMPIONS} beds</span></h2>
  <div class="hint">Match gifts to each champion: what they <b>like</b> raises morale (more power and stamina), what they <b>hate</b> lowers it, and some personalities refuse certain things. Weapons and armor are swapped; old ones come back to your stash.</div>
  ${S.champions.length ? '' : '<div class="dim">Nobody. Go recruit someone in the World tab.</div>'}
  <div class="grid">${S.champions.map(c => `<div class="card">
    <div class="champ">${portrait(c)}<div style="flex:1">${champHeader(c)}${statsHtml(c)}${durBar(c)}</div></div>
    ${gearHtml(c, true)}
    <div class="actions">
      <button onclick="A.giftMenu(${c.id})">🎁 Gift</button>
      <button onclick="A.medical(${c.id})">🩺 Medical file (${c.injuries.length})</button>
      <button onclick="A.toArena(${c.id})">🏟️ Send to arena</button>
      <button class="small" onclick="A.retireMenu(${c.id})" title="Send them to the retirement home now">Retire</button>
    </div>
  </div>`).join('')}</div>`;
}

// ---------- ARENA ----------
function screenArena() {
  const today = S.arenaToday;
  const A_ = ARENAS[today];
  if (!S.champions.length) return `<h2>🏟️ Arena</h2><div class="dim">You need a champion first. Recruit one in the World tab.</div>`;
  if (!UI.arenaChamp || !S.champions.find(c => c.id === UI.arenaChamp)) UI.arenaChamp = S.champions[0].id;
  const c = S.champions.find(x => x.id === UI.arenaChamp);
  const vets = roleCount('veteran');
  const fc = forecast(c, today);
  const F = fc.F;
  const others = unlockedArenas().filter(id => id !== today);
  return `<h2>🏟️ Arena</h2>
  <div class="card"><b>Today's venue: ${A_.icon} ${A_.name}</b><div>${A_.desc}</div>
    <div class="actions">${others.map(id => `<button class="small" onclick="A.rebook('${id}')" ${S.mats.goldleaf >= 1 ? '' : 'disabled'}>Rebook ${ARENAS[id].icon} ${ARENAS[id].name} (1✨)</button>`).join('')}</div>
    <div class="dim" style="font-size:12px">The venue changes every day. Rebooking costs 1 Gold Leaf.</div>
  </div>
  <h3>Who fights today?</h3>
  <div class="row">${S.champions.map(x => `<button class="${x.id === c.id ? 'primary' : ''}" onclick="A.toArena(${x.id})">${RACES[x.race].icon} ${esc(x.name)}</button>`).join('')}</div>
  <div class="card" style="margin-top:10px">
    <div class="champ">${portrait(c)}<div style="flex:1">${champHeader(c)}${statsHtml(c)}${durBar(c)}</div></div>
    ${gearHtml(c, false)}
    <h3>Fight sheet</h3>
    <div style="font-size:14px">
      ⚔️ Power <b>${F.power}</b> → ${F.directDmg} damage to you per hit ${F.cursed ? '<span class="dim">(your armor eats the rest)</span>' : '<span class="good">(curse dissolved!)</span>'}<br>
      🌵 ${F.melee ? `Thorns reflect <b class="${F.reflect > F.guard ? 'bad' : ''}">${F.reflect}</b> per hit vs their guard <b>${F.guard}</b>` : `Ranged: no thorns on contact (guard ${F.guard})`}<br>
      😮‍💨 Stamina ${F.stamina}, burns ~${F.drain}/round → lasts about <b>${fc.rounds}</b> of ${YOU.maxRounds} rounds<br>
      ✨ Your regen: ${F.regen}/round. ${F.poison ? `☠️ Poison ${F.poison}/round. ` : ''}${F.trap ? `🪤 Trap ${F.trap}. ` : ''}${F.rigging ? `🧨 Cliff ${F.rigging}. ` : ''}${F.ally ? `📯 Monster ally ${F.ally.dmg}/round. ` : ''}${F.summonDmg ? `Summon ${F.summonDmg}/round. ` : ''}<br>
      📈 Net damage per round after your regen: <b class="${fc.perRound > 0 ? 'good' : 'bad'}">${fc.perRound}</b>. You have ${YOU.maxHp} HP.
    </div>
    <h3>🧓 Bitter Veteran's forecast</h3>
    ${vets ? (fc.risks.length ? fc.risks.map(r => `<div class="risk"><span class="pct ${r.p > 0.5 ? 'bad' : r.p > 0.2 ? 'warn' : ''}">${Math.round(r.p * 100)}%</span><span>${esc(r.text)}</span></div>`).join('') : '<div class="dim">"No obvious ways to embarrass themselves. Yet."</div>')
      : '<div class="dim">Retire someone as a Bitter Veteran and they will tell you the odds of each failure. Loudly.</div>'}
    <div class="actions" style="margin-top:12px">
      <button class="primary" onclick="A.fight(${c.id})" ${c.dur <= 0 ? 'disabled' : ''}>⚔️ Stage the attempt (ends the day)</button>
      <button onclick="A.giftMenu(${c.id})">🎁 Gift something first</button>
    </div>
    ${c.dur < c.cap * 0.3 ? '<div class="warn" style="font-size:13px">They are badly worn out. Injuries will be worse. Resting (doing other things) heals them.</div>' : ''}
  </div>`;
}

// ---------- JOURNAL ----------
function screenJournal() {
  const counts = {};
  S.journal.forEach(j => { counts[j.category] = (counts[j.category] || 0) + 1; });
  return `<h2>📓 Knockout Journal</h2>
  <div class="hint">Every failed attempt, and what it teaches. Read the last column.</div>
  <div class="row" style="margin-bottom:8px">${Object.entries(counts).map(([k, n]) => `<span class="tag">${k}: ${n}</span>`).join('') || '<span class="dim">No attempts yet.</span>'}</div>
  ${S.journal.length ? `<table><tr><th>#</th><th>Who / where</th><th>What happened</th><th>Lesson</th></tr>
  ${S.journal.slice().reverse().map(j => `<tr>
    <td>${j.n}<div class="dim" style="font-size:12px">day ${j.day}</div></td>
    <td>${j.icon} ${esc(j.champ)}<div class="dim" style="font-size:12px">${esc(j.arena)}, round ${j.round}</div></td>
    <td><span class="tag">${esc(j.category)}</span> ${esc(j.text)}${j.injury ? `<div class="bad" style="font-size:13px">${esc(j.injury)}</div>` : ''}<div class="dim" style="font-size:12px">Damage to you: ${j.damage}</div></td>
    <td class="good" style="font-size:13px">${esc(j.lesson)}</td></tr>`).join('')}</table>` : ''}`;
}

// ---------- RETIREMENT HOME ----------
function screenHome() {
  const housed = new Set(housedRetirees().map(r => r.id));
  const away = new Set(S.pendingReturns.map(p => p.id));
  return `<h2>🏡 Retirement Home <span class="dim" style="font-size:14px">${housed.size}/${homeCapacity()} rooms</span></h2>
  <div class="hint">Retired champions never leave the world. Each role gives the hub a bonus, but only while they have a room.</div>
  <div class="grid">${Object.entries(ROLES).map(([k, r]) => `<div class="card" style="padding:6px 10px"><b>${r.icon} ${r.name}</b> × ${k === 'vengeful' ? S.pendingReturns.length : roleCount(k)}<div class="dim" style="font-size:13px">${r.desc}</div></div>`).join('')}</div>
  <h3>Residents</h3>
  ${S.retirees.length ? `<div class="grid">${S.retirees.map(r => {
    const c = r.champ;
    const where = away.has(r.id) ? '<span class="warn">Away training. Will return.</span>' : housed.has(r.id) ? '<span class="good">Has a room.</span>' : '<span class="dim">Wandering (no room).</span>';
    return `<div class="card"><div class="champ">${portrait(c)}<div>
      <div class="name">${esc(c.name)}</div><div>${ROLES[r.role].icon} ${ROLES[r.role].name} · ${where}</div>
      <div class="dim" style="font-size:13px">Retired day ${r.day} after ${c.attempts} attempt${c.attempts === 1 ? '' : 's'}.</div>
      <div style="font-size:13px">${c.injuries.map(i => `${i.icon} ${esc(i.name)}`).join(', ') || 'Miraculously unhurt.'}</div>
    </div></div></div>`;
  }).join('')}</div>` : '<div class="dim">Empty. It will not stay that way.</div>'}`;
}

// ---------- MODALS ----------
function openModal(html) { $('modal').innerHTML = `<div class="box">${html}</div>`; $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); $('modal').innerHTML = ''; }

function giftModal(champId) {
  const c = S.champions.find(x => x.id === champId);
  const groups = {};
  S.inventory.forEach(it => { (groups[it.key] = groups[it.key] || []).push(it); });
  openModal(`<h2>🎁 Gift to ${esc(c.name)}</h2>
    <div>${champHeader(c)}</div>${gearHtml(c, false)}
    <h3>Your stash</h3>
    ${Object.keys(groups).length ? `<div class="grid">${Object.entries(groups).map(([k, list]) => {
      const d = ITEMS[k];
      const liked = d.tags.includes(c.likes), hated = d.tags.includes(c.dislikes);
      const refused = PERSONALITIES[c.personality].refuses && d.tags.includes(PERSONALITIES[c.personality].refuses);
      const full = (d.slot === 'trinket' && c.gear.trinkets.length >= 2) || (d.slot === 'consumable' && c.gear.consumables.length >= 3);
      return `<div class="card recipe"><div class="ic">${d.icon}</div><div class="info"><b>${d.name}</b>${list.length > 1 ? ' ×' + list.length : ''}
        ${liked ? '<span class="tag like">they like this</span>' : ''}${hated ? '<span class="tag dislike">they hate this</span>' : ''}${refused ? '<span class="tag dislike">will refuse</span>' : ''}
        <div style="font-size:13px">${esc(d.desc)}</div>
        <div class="actions"><button onclick="A.gift(${c.id},${list[0].uid})" ${full ? 'disabled' : ''}>${full ? `No free ${d.slot} slot` : 'Give'}</button>${d.slot === 'weapon' || d.slot === 'armor' ? `<span class="dim" style="font-size:12px">${d.slot}${c.gear[d.slot] ? ' (swaps out the old one)' : ''}</span>` : ''}</div></div></div>`;
    }).join('')}</div>` : '<div class="dim">Nothing to give. Craft something in the Forge.</div>'}
    <div class="actions" style="margin-top:12px"><button onclick="A.close()">Done</button></div>`);
}

function medicalModal(champId) {
  const c = S.champions.find(x => x.id === champId) || (S.retirees.find(r => r.id === champId) || {}).champ;
  openModal(`<h2>🩺 Medical file: ${esc(c.name)}</h2>
    <div class="champ">${portrait(c)}<div style="flex:1">${durBar(c)}
    <div style="font-size:13px">Heals ${healPerDay()} durability per day (Hospital + Healers), but never above the current maximum. Each injury lowers the maximum forever.</div></div></div>
    ${c.injuries.length ? `<table><tr><th>Injury</th><th>Severity</th><th>Effect</th><th>Day</th></tr>${c.injuries.map(i =>
      `<tr><td>${i.icon} ${esc(i.name)}</td><td>${['', 'minor', 'serious', 'severe', '<b class="bad">crippling</b>'][i.sev]}</td>
      <td>${i.sev >= 2 ? `-${i.sev >= 4 ? 2 : 1} ${STAT_NAMES[i.stat]}` : '<span class="dim">pride only</span>'}</td><td>${i.day}</td></tr>`).join('')}</table>`
      : '<div class="dim">No injuries yet. Enjoy it.</div>'}
    <div class="actions" style="margin-top:12px"><button onclick="A.close()">Close</button></div>`);
}

function retireModal(champId, forced) {
  const c = S.champions.find(x => x.id === champId);
  const full = housedRetirees().length >= homeCapacity();
  openModal(`<h2>${forced ? '🦽 Forced retirement' : '🏡 Retirement'}: ${esc(c.name)}</h2>
    <div class="champ">${portrait(c)}<div>${forced ? `<p>${esc(c.name)} cannot fight any more. ${c.injuries.length ? `The ${esc(worstInjuries(c, 1)[0].name.toLowerCase())} saw to that.` : ''}</p>` : ''}
    <p>They keep all their gear. What will they do with the rest of their life?</p>
    ${full ? '<p class="warn">The Retirement Home is full. They will wander instead of helping (Vengeful Survivors don\'t need a room).</p>' : ''}</div></div>
    <div class="grid">${Object.entries(ROLES).filter(([k]) => !(k === 'vengeful' && c.returned)).map(([k, r]) =>
      `<button style="text-align:left" onclick="A.retire(${c.id},'${k}')"><b>${r.icon} ${r.name}</b><div class="dim" style="font-size:13px">${r.desc}</div></button>`).join('')}</div>
    ${forced ? '' : '<div class="actions" style="margin-top:12px"><button onclick="A.close()">Never mind</button></div>'}`);
}

function recruitModal() {
  const reg = REGIONS[UI.recruitRegion];
  openModal(`<h2>🍺 Recruiting at ${reg.recruit.place}</h2>
    <div class="dim">This trip takes the day whether you hire anyone or not.</div>
    <div class="grid" style="margin-top:8px">${UI.recruitList.map((c, i) => `<div class="card">
      <div class="champ">${portrait(c)}<div>${champHeader(c)}${statsHtml(c)}
      <div style="font-size:13px">Toughness ${c.tough} (durability ${c.maxDur})${c.teach ? ` · <span class="good">trained by your instructors (+${c.teach})</span>` : ''}</div></div></div>
      <div class="actions"><button class="primary" onclick="A.hire(${i})">Hire ${esc(c.name)}</button></div></div>`).join('')}</div>
    <div class="actions" style="margin-top:12px"><button onclick="A.hire(-1)">Hire nobody</button></div>`);
}

// ---------- the fight playback ----------
let fightTimer = null;
function playFight(c, res, after) {
  openModal(`<h2>⚔️ ${esc(c.name)} vs You</h2><div class="fightlog" id="flog"></div>
    <div class="actions"><button id="fskip" onclick="A.skipFight()">Skip ⏩</button><button id="fdone" class="primary hidden">Continue</button></div>`);
  let i = 0;
  const lines = res.lines.slice();
  const done = () => {
    clearInterval(fightTimer); fightTimer = null;
    $('fskip').classList.add('hidden');
    const btn = $('fdone');
    btn.classList.remove('hidden');
    btn.onclick = after;
    const box = $('flog');
    if (res.outcome !== 'kill') {
      box.insertAdjacentHTML('beforeend', `<div class="hint"><b>Knockout journal:</b> ${esc(res.lesson)}${res.injury ? `<br><span class="bad">Injury: ${res.injury.icon} ${esc(res.injury.name)}${res.injury.sev >= 4 ? ' (crippling)' : ''}</span>` : ''}<br><span class="dim">Damage dealt to you: ${res.damage}. You are back to ${YOU.maxHp}.</span></div>`);
    } else box.insertAdjacentHTML('beforeend', `<p class="ko" style="font-size:20px">Your health bar does something it has never done before. It reaches zero.</p>`);
  };
  const step = () => {
    if (i >= lines.length) return done();
    const l = lines[i++];
    $('flog').insertAdjacentHTML('beforeend', `<p class="${l.cls}">${esc(l.text)}</p>`);
  };
  UI.skip = () => { while (i < lines.length) step(); done(); };
  step();
  fightTimer = setInterval(step, 700);
}

// ---------- THE ENDING ----------
function playEnding() {
  const el = $('ending');
  el.classList.remove('hidden');
  const k = S.killer;
  const seq = [
    'The blow lands.',
    'For the first time, nothing regenerates.',
    'You fall over. Your duct-taped cape, loyal to the end, falls with you.',
    'SAVING...',
    'EXITING...',
    '',
  ];
  let i = 0;
  el.innerHTML = '';
  const next = () => {
    if (i < seq.length) {
      el.innerHTML = `<div><div class="line ${seq[i].endsWith('...') ? 'mono' : ''}">${esc(seq[i])}</div></div>`;
      i++;
      setTimeout(next, seq[i - 1] === '' ? 2500 : 2200);
    } else showCredits();
  };
  next();
}
function showCredits() {
  const k = S.killer;
  const el = $('ending');
  const roles = {};
  S.retirees.forEach(r => { (roles[r.role] = roles[r.role] || []).push(r.champ.name); });
  const warlords = Object.entries(S.regions).filter(([, r]) => r.warlord).map(([id, r]) => `${r.warlord}, Warlord of ${REGIONS[id].name}`);
  const buffed = Object.entries(S.regions).filter(([, r]) => r.buffed).map(([id, r]) => `${REGIONS[id].name} (level ${r.buffed})`);
  el.innerHTML = `<div class="credits">
    <h1>Please Kill Me (Politely)</h1>
    <p style="text-align:center" class="mono">Game saved. Thank you for playing.</p>
    <p style="text-align:center">The screen is quiet. It is very nice.</p>
    <h3>Your killer</h3>
    <p>${RACES[k.race].icon} <b>${esc(k.name)}</b> the ${RACES[k.race].name}, on day ${k.day}, attempt #${k.attempts}, round ${k.round}.<br>Cause of death: ${esc(k.method)}.</p>
    <h3>What it took</h3>
    <p>${k.day} days. ${S.stats.attempts} attempts. ${S.stats.crafted} items crafted. ${S.stats.gifts} gifts given.<br>
    ${S.journal.filter(j => j.injury).length} injuries suffered on your behalf. You caused none of them directly. Legally.</p>
    <h3>The Retirement Home</h3>
    ${Object.keys(roles).length ? Object.entries(roles).map(([r, names]) => `<p>${ROLES[r].icon} ${ROLES[r].name}${names.length > 1 ? 's' : ''}: ${names.map(esc).join(', ')}</p>`).join('') : '<p>Nobody retired. Impressive, or lucky.</p>'}
    <h3>What your gifts built</h3>
    ${S.consequences.length ? S.consequences.map(c => `<p>Day ${c.day}: ${esc(c.text)}</p>`).join('') : '<p>Nothing. The world barely noticed you. Respect.</p>'}
    ${warlords.length ? `<p>👑 Still ruling: ${warlords.map(esc).join('; ')}.</p>` : ''}
    ${buffed.length ? `<p>👹 Monsters still wearing your hand-me-downs: ${buffed.join(', ')}.</p>` : ''}
    <h3>In memory of</h3>
    <p>Your regen spells, who never took a day off.</p>
    <p class="dim">You could have turned the computer off at any time. You did not think of it.</p>
    <p style="text-align:center;margin-top:30px"><button class="primary" onclick="A.newAfterEnd()">Start a new game</button></p>
  </div>`;
}

// ---------- ACTIONS (button clicks) ----------
function commit() { save(); render(); }
const A = {
  tab(t) { UI.tab = t; render(); window.scrollTo(0, 0); },
  close() { closeModal(); render(); },
  gather(id) { actGather(id); commit(); },
  dungeon(id) { actDungeon(id); commit(); },
  boss(id) { actBoss(id); commit(); },
  recruitTrip(id) {
    if (recruitBlocked(id)) return;
    UI.recruitRegion = id; UI.recruitList = recruitCandidates(id); recruitModal();
  },
  hire(i) {
    const c = i >= 0 ? UI.recruitList[i] : null;
    actRecruit(UI.recruitRegion, c);
    UI.recruitList = null; closeModal(); commit();
  },
  craft(k) { craft(k); commit(); },
  upgrade(b) { upgrade(b); commit(); },
  giftMenu(id) { giftModal(id); },
  gift(cid, uidv) { gift(cid, uidv); save(); render(); giftModal(cid); },
  takeBack(cid, uidv) { takeBack(cid, uidv); commit(); },
  medical(id) { medicalModal(id); },
  toArena(id) { UI.arenaChamp = id; UI.tab = 'arena'; render(); },
  rebook(id) { rebookArena(id); commit(); },
  retireMenu(id) { retireModal(id, false); },
  retire(id, role) { retire(id, role); closeModal(); commit(); },
  skipFight() { if (UI.skip) UI.skip(); },
  fight(id) {
    const c = S.champions.find(x => x.id === id);
    if (!c) return;
    const res = simulateAttempt(c, S.arenaToday);
    const out = resolveAttempt(c, res);
    res.injury = out.injury;
    save();
    playFight(c, res, () => {
      closeModal();
      if (S.ended) { save(); playEnding(); return; }
      UI.tab = 'journal';
      render();
      if (out.retire) retireModal(c.id, true);
    });
  },
  reset() { if (confirm('Start over? Your current save will be deleted.')) { wipeSave(); newGame(); UI.tab = 'hub'; commit(); } },
  newAfterEnd() { wipeSave(); newGame(); $('ending').classList.add('hidden'); UI.tab = 'hub'; commit(); },
};

// ---------- start ----------
if (!load()) newGame();
render();
if (S.ended) { $('ending').classList.remove('hidden'); showCredits(); }
else { const hurt = S.champions.find(needsRetirement); if (hurt) retireModal(hurt.id, true); }
