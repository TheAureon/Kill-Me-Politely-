// The hub village: roster, recruiting, crafting, buildings, retirement home.

const BUILDINGS = {
  hospital: { name: 'Hospital Wing', icon: '🏥', cost: { bogiron: 2, mossthread: 2 }, desc: 'Heal champions (costs 🍄1). Never fully. Injuries leave marks.' },
  academy:  { name: 'Academy',       icon: '🎓', cost: { bogiron: 3, bonedust: 2 },  desc: 'New recruits +5 durability. Instructors teach twice as well.' },
};
const MAX_ROSTER = 3;
let hubTab = 'recruit';

function goHub(line) {
  showScreen('hub');
  renderHub();
  narrate(line || pick(HUB_LINES));
}

function renderHub() {
  renderResources();
  renderRoster();
  renderTab();
  $('stage-btn').disabled = S.roster.length === 0;
}

function renderRoster() {
  const cards = S.roster.map(ch => {
    const a = ARCHETYPES[ch.arch];
    const worst = topInjuries(ch, 3).map(i => `<span class="inj">${esc(i.name)}</span>`).join('');
    const gifts = ch.gifts.map(g => `<span class="gift" title="${esc(GIFTS[g].name)}">${GIFTS[g].icon} ${esc(GIFTS[g].name)}</span>`).join('') || '<span class="muted">No gifts yet</span>';
    const canHeal = S.buildings.hospital && ch.dur < ch.cap;
    return `<div class="card champ">
      <div class="champfig">${figureSVG(ch, 110)}</div>
      <div class="champinfo">
        <div class="cname">${esc(ch.name)} ${ch.grudge ? '<span class="tag red">grudge</span>' : ''}</div>
        <div class="muted">${a.title} · from ${a.origin}</div>
        ${durabilityBar(ch)}
        <div class="stats">💪 ${ch.power} · 🤸 ${ch.agility} · 🫁 ${ch.stamina} ${a.ranged ? '· 🏹 ranged' : ''}</div>
        <div class="injrow">${worst}</div>
        <div class="gifts">${gifts}</div>
        <div class="btnrow">
          <button class="btn sm" onclick="openGiveGift(${ch.id})" ${ch.gifts.length >= 2 ? 'disabled' : ''}>🎁 Give gift (${ch.gifts.length}/2)</button>
          <button class="btn sm" onclick="showInjuries(${ch.id})">🩹 Injuries (${ch.injuries.length})</button>
          ${S.buildings.hospital ? `<button class="btn sm" onclick="heal(${ch.id})" ${canHeal ? '' : 'disabled'}>🏥 Heal (🍄1)</button>` : ''}
        </div>
      </div></div>`;
  }).join('');
  $('roster').innerHTML = `<h3>Your Champions (${S.roster.length}/${MAX_ROSTER})</h3>` +
    (cards || '<p class="muted">Nobody. Visit the Recruit Board. Someone out there is foolish enough.</p>');
}

function setTab(t) { hubTab = t; renderTab(); }

function renderTab() {
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.tab === hubTab));
  const el = $('tabbody');
  if (hubTab === 'recruit') el.innerHTML = recruitHTML();
  if (hubTab === 'craft') el.innerHTML = craftHTML();
  if (hubTab === 'build') el.innerHTML = buildHTML();
  if (hubTab === 'home') el.innerHTML = homeHTML();
}

function giftName(id) { return GIFTS[id].icon + ' ' + GIFTS[id].name; }

function recruitHTML() {
  const full = S.roster.length >= MAX_ROSTER;
  return `<p class="muted">New faces arrive after every bog trip. ${full ? '<b>Your roster is full.</b>' : ''}</p>` +
    S.board.map(r => {
      const a = ARCHETYPES[r.arch];
      return `<div class="card recruit">
        ${figureSVG(r, 80)}
        <div>
          <div class="cname">${esc(r.name)} ${r.grudge ? '<span class="tag red">grudge</span>' : ''}</div>
          <div class="muted">${a.title} · ${a.origin}</div>
          <div>${esc(a.personality)}</div>
          <div class="stats">❤️ ${r.maxDur} · 💪 ${r.power} · 🤸 ${r.agility} · 🫁 ${r.stamina}</div>
          <div class="small">Likes: ${a.likes.map(giftName).join(', ')}</div>
          <div class="small fear">Fear: ${esc(a.fearText)}</div>
          <button class="btn sm" onclick="recruit(${r.id})" ${full ? 'disabled' : ''}>Recruit</button>
        </div></div>`;
    }).join('') || '<p class="muted">The board is empty. Go to the bog and come back.</p>';
}

function craftHTML() {
  return '<p class="muted">Turn bog materials into gifts. Gifts are permanent (except tonics). Two per champion.</p>' +
    Object.keys(GIFTS).map(id => {
      const g = GIFTS[id];
      const ok = canAfford(g.cost);
      return `<div class="card craft">
        <div class="gicon">${g.icon}</div>
        <div><div class="cname">${g.name} ${S.gifts[id] ? `<span class="tag">have ${S.gifts[id]}</span>` : ''}</div>
        <div class="small">${g.desc}</div>
        <button class="btn sm" onclick="craft('${id}')" ${ok ? '' : 'disabled'}>Craft (${costText(g.cost)})</button></div>
      </div>`;
    }).join('');
}

function buildHTML() {
  return Object.keys(BUILDINGS).map(id => {
    const b = BUILDINGS[id];
    const built = S.buildings[id];
    return `<div class="card craft"><div class="gicon">${b.icon}</div><div>
      <div class="cname">${b.name} ${built ? '<span class="tag green">built</span>' : ''}</div>
      <div class="small">${b.desc}</div>
      ${built ? '' : `<button class="btn sm" onclick="build('${id}')" ${canAfford(b.cost) ? '' : 'disabled'}>Build (${costText(b.cost)})</button>`}
    </div></div>`;
  }).join('') + `<div class="card craft"><div class="gicon">🏚️</div><div><div class="cname">Retirement Home <span class="tag green">always open</span></div>
    <div class="small">Where champions go when their bodies say no. See the Retirement Home tab.</div></div></div>`;
}

function homeHTML() {
  const goal = 8;
  const pct = Math.min(100, S.retirees.length / goal * 100);
  const list = S.retirees.map((r, i) => `<div class="card recruit">
      ${figureSVG(r, 70)}
      <div><div class="cname">${esc(r.name)}</div>
      <div><span class="tag">${ROLES[r.role].name}</span> <span class="small">${ROLES[r.role].effect}</span></div>
      <div class="small muted">${r.attempts} attempt(s). ${r.injuries.length} injuries. Kept: ${r.gifts.map(giftName).join(', ') || 'nothing'}.</div>
      <button class="btn sm" onclick="showInjuries(${100000 + i})">Medical chart</button></div></div>`).join('');
  return `<div class="small">Residents: ${S.retirees.length}. The home grows with every broken champion.</div>
    <div class="dbar home"><div class="dfill" style="width:${pct}%;background:#9a7bd0"></div></div>
    ${list || '<p class="muted">Empty. Clean sheets. Fresh flowers. It will not last.</p>'}`;
}

// ---------- Actions ----------
function recruit(id) {
  if (S.roster.length >= MAX_ROSTER) return;
  const r = S.board.find(x => x.id === id);
  S.board = S.board.filter(x => x.id !== id);
  S.roster.push(r);
  S.recruitedTotal++;
  save(); renderHub();
  narrate(`${r.name} joins you. They have been told what the job is. They signed anyway.`);
}

function craft(id) {
  const g = GIFTS[id];
  if (!canAfford(g.cost)) return;
  pay(g.cost);
  S.gifts[id] = (S.gifts[id] || 0) + 1;
  S.crafted[id] = (S.crafted[id] || 0) + 1;
  save(); renderHub();
  narrate(`You craft a ${g.name}. You cannot use it. Nothing you make is for you.`);
}

function build(id) {
  const b = BUILDINGS[id];
  if (!canAfford(b.cost)) return;
  pay(b.cost);
  S.buildings[id] = true;
  save(); renderHub();
  narrate(`The ${b.name} is built. The village is thriving. On your behalf. Because of you. For your death.`);
}

function heal(id) {
  const ch = S.roster.find(c => c.id === id);
  if (!S.buildings.hospital || ch.dur >= ch.cap) return;
  if (S.res.glowcap < 1) { narrate('The healers want a Glowcap. They are very clear: no Glowcap, no healing.'); return; }
  S.res.glowcap--;
  const amount = 25 + roleCount('healer') * 10;
  ch.dur = Math.min(ch.cap, ch.dur + amount);
  save(); renderHub();
  narrate(`${ch.name} is patched up. Not all the way. Never all the way.`);
}

function openGiveGift(id) {
  const ch = S.roster.find(c => c.id === id);
  const a = ARCHETYPES[ch.arch];
  const owned = Object.keys(S.gifts).filter(g => S.gifts[g] > 0);
  const rows = owned.map(g => {
    const liked = a.likes.includes(g), feared = a.fears.includes(g), has = ch.gifts.includes(g);
    const note = feared ? '<span class="tag red">refuses</span>' : liked ? '<span class="tag green">loves it</span>' : '<span class="tag">neutral</span>';
    return `<div class="card craft"><div class="gicon">${GIFTS[g].icon}</div><div>
      <div class="cname">${GIFTS[g].name} ×${S.gifts[g]} ${note}</div><div class="small">${GIFTS[g].desc}</div>
      <button class="btn sm" onclick="giveGift(${id},'${g}')" ${feared || has ? 'disabled' : ''}>Give</button></div></div>`;
  }).join('');
  openModal(`<h2>🎁 Gift for ${esc(ch.name)}</h2>
    <p class="small">Likes: ${a.likes.map(giftName).join(', ')}<br><span class="fear">${esc(a.fearText)}</span></p>
    ${rows || '<p class="muted">You have no crafted gifts. Visit the Craft Bench.</p>'}
    <button class="btn" onclick="closeModal()">Close</button>`);
}

function giveGift(id, g) {
  const ch = S.roster.find(c => c.id === id);
  if (ch.gifts.length >= 2 || !S.gifts[g]) return;
  S.gifts[g]--;
  ch.gifts.push(g);
  save(); closeModal(); renderHub();
  const liked = ARCHETYPES[ch.arch].likes.includes(g);
  narrate(liked ? `${ch.name} loves the ${GIFTS[g].name}. Morale is up. Your odds of dying are up. Everyone wins.`
                : `${ch.name} accepts the ${GIFTS[g].name} politely.`);
}

function confirmReset() {
  openModal(`<h2>Reset everything?</h2><p>This wipes your save. Champions, retirees, journal, all of it.</p>
    <button class="btn danger" onclick="resetGame();closeModal();goHub('A new life begins. The escape key is still broken.');showIntro()">Yes, wipe it</button>
    <button class="btn" onclick="closeModal()">Cancel</button>`);
}
