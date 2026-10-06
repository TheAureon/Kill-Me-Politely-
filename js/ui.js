// Shared UI: screens, popups, narrator, and the drawings of people.

function $(id) { return document.getElementById(id); }
function esc(s) { return String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function showScreen(name) {
  document.querySelectorAll('.screen').forEach(el => el.classList.toggle('active', el.id === 'screen-' + name));
  renderResources();
}

function narrate(text) {
  const el = $('narrator');
  el.textContent = text;
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}

function renderResources() {
  $('resources').innerHTML = Object.keys(RESOURCES)
    .filter(k => !RESOURCES[k].rare || S.res[k] > 0)
    .map(k => `<span class="chip" title="${RESOURCES[k].name}">${RESOURCES[k].icon} ${RESOURCES[k].name}: <b>${S.res[k] || 0}</b></span>`)
    .join('');
}

function costText(cost) {
  return Object.keys(cost).map(k => `${RESOURCES[k].icon}${cost[k]}`).join(' ');
}

// ---------- Popups ----------
function openModal(html) {
  $('modal-body').innerHTML = html;
  $('modal').classList.add('open');
}
function closeModal() { $('modal').classList.remove('open'); }

function showIntro() {
  openModal(`
    <h2>Please Kill Me (Politely)</h2>
    <p>You are the most powerful character in this game. Best armor. Endless health. Regeneration that never stops. Thorns that hurt anyone who hits you.</p>
    <p>Your escape button is broken. The only way to save and exit is to <b>die</b>.</p>
    <p>Nothing can kill you. So you will gather materials, craft gifts, and hand them to champions until one of them finally can.</p>
    <p class="muted">You never attack. You just stand there. It is very awkward for everyone.</p>
    <p><b>Try this first:</b> recruit someone from the Recruit Board, craft a gift, give it to them, then press <b>Stage an Attempt</b>.</p>
    <button class="btn big" onclick="closeModal()">Fine. Let's go.</button>`);
}

function showJournal() {
  const rows = S.journal.slice().reverse().map(j => `
    <div class="jentry ${j.win ? 'win' : ''}">
      <div class="jhead"><b>#${j.n} ${esc(j.champ)}</b> <span class="tag">${j.cat}</span> <span class="muted">${esc(j.arena)}</span></div>
      <div><b>${esc(j.failure)}.</b> ${esc(j.text)}</div>
      ${j.injury ? `<div class="muted">Injury: ${esc(j.injury)} · Durability lost: ${j.dmg}</div>` : ''}
      ${j.gifts ? `<div class="muted">Kit: ${esc(j.gifts)}</div>` : ''}
      <div class="lesson">📝 ${esc(j.lesson)}</div>
    </div>`).join('');
  const cats = {};
  S.journal.forEach(j => { if (!j.win) cats[j.failure] = (cats[j.failure] || 0) + 1; });
  const summary = Object.keys(cats).map(k => `${k} ×${cats[k]}`).join(' · ');
  openModal(`<h2>📖 Knockout Journal</h2>
    <p class="muted">${S.journal.length ? 'Failure types seen: ' + Object.keys(cats).length + ' of ' + Object.keys(FAILURES).length + '. ' + summary : 'No attempts yet. The pages are hopeful.'}</p>
    <div class="journal">${rows}</div>
    <button class="btn" onclick="closeModal()">Close</button>`);
}

function showInjuries(id) {
  const ch = S.roster.find(c => c.id === id) || S.retirees[id - 100000];
  const list = ch.injuries.length
    ? ch.injuries.map(i => `<li><b>${esc(i.name)}</b> <span class="sev s${Math.min(i.sev, 3)}">severity ${i.sev}</span><br><span class="muted">${esc(i.detail)}</span></li>`).join('')
    : '<li class="muted">No injuries. Yet.</li>';
  openModal(`<h2>🩹 ${esc(ch.name)}: Medical Chart</h2>
    <div class="row">${figureSVG(ch, 120)}<ul class="injlist">${list}</ul></div>
    <p class="muted">Each injury permanently lowers how far healers can restore durability.</p>
    <button class="btn" onclick="closeModal()">Close</button>`);
}

// ---------- Drawings ----------
// A champion with their worst 2-3 injuries drawn on.
function figureSVG(ch, height) {
  const a = ARCHETYPES[ch.arch];
  const inj = new Set(topInjuries(ch, 3).map(i => i.id));
  const skin = '#e8c39e';
  let hat = '';
  if (ch.arch === 'barbarian') hat = `<path d="M20 12 L14 2 L22 9 Z M40 12 L46 2 L38 9 Z" fill="#eee"/><rect x="20" y="8" width="20" height="5" fill="#6b4a2b"/>`;
  if (ch.arch === 'archer') hat = `<path d="M19 16 Q30 -2 41 16 Z" fill="#2f5a2c"/>`;
  if (ch.arch === 'paladin') hat = `<rect x="19" y="7" width="22" height="9" rx="3" fill="#b9bdd0"/><rect x="28" y="2" width="4" height="7" fill="#d4af37"/>`;
  if (ch.arch === 'summoner') hat = `<path d="M18 13 L30 -6 L42 13 Z" fill="#5e2d80"/><circle cx="31" cy="2" r="1.6" fill="#ffd84d"/>`;

  const leftEye = inj.has('eyepatch')
    ? `<circle cx="26" cy="18" r="3.3" fill="#111"/><line x1="19" y1="14" x2="41" y2="21" stroke="#111" stroke-width="1"/>`
    : inj.has('blackEye') ? `<circle cx="26" cy="18" r="3" fill="#6a3d8f"/><circle cx="26" cy="18" r="1" fill="#111"/>`
    : `<circle cx="26" cy="18" r="1.2" fill="#111"/>`;

  let over = '';
  if (inj.has('headBandage')) over += `<rect x="19" y="11" width="22" height="5" fill="#fafafa" stroke="#ccc" stroke-width=".5"/><circle cx="36" cy="13.5" r="1.3" fill="#c33"/>`;
  if (inj.has('singed')) over += `<path d="M20 10 l3 -4 l2 4 l3 -5 l2 5 l3 -4 l2 4 l3 -3" stroke="#222" fill="none" stroke-width="1.5"/><circle cx="33" cy="22" r="1.3" fill="#555"/><circle cx="23" cy="45" r="2" fill="#333" opacity=".5"/>`;
  if (inj.has('neckBrace')) over += `<rect x="23" y="27" width="14" height="6" rx="2" fill="#f2f2f2" stroke="#bbb" stroke-width=".5"/>`;
  if (inj.has('armCast')) over += `<rect x="40" y="42" width="8" height="15" rx="2" fill="#fafafa" stroke="#bbb" stroke-width=".5"/>`;
  if (inj.has('sling')) over += `<path d="M24 32 L14 52 L22 52 Z" fill="#fafafa" stroke="#bbb" stroke-width=".5"/>`;
  if (inj.has('legCast')) over += `<rect x="20" y="70" width="10" height="23" rx="2" fill="#fafafa" stroke="#bbb" stroke-width=".5"/>`;
  if (inj.has('cane')) over += `<path d="M52 58 Q52 54 48 54" stroke="#6b4a2b" stroke-width="2" fill="none"/><line x1="52" y1="58" x2="52" y2="96" stroke="#6b4a2b" stroke-width="2"/>`;

  let held = '';
  if (ch.gifts.includes('greatsword')) held += `<rect x="47" y="22" width="3" height="40" fill="#ccd" transform="rotate(15 48 50)"/>`;
  else if (ch.gifts.includes('bow') || ch.arch === 'archer') held += `<path d="M10 30 Q2 48 10 66" stroke="#7a5230" stroke-width="2" fill="none"/>`;
  if (ch.gifts.includes('monocle')) held += `<circle cx="34" cy="18" r="3" fill="none" stroke="#d4af37" stroke-width="1"/>`;
  if (ch.gifts.includes('boots')) held += `<rect x="20" y="88" width="9" height="6" fill="#e6e6ff"/><rect x="31" y="88" width="9" height="6" fill="#e6e6ff"/>`;

  const limp = inj.has('legCast') || inj.has('cane') ? 'rotate(-4 30 90)' : '';
  return `<svg class="fig" viewBox="-4 -8 64 106" height="${height}" aria-label="${esc(ch.name)}">
    <g transform="${limp}">
    <rect x="21" y="62" width="8" height="30" fill="#3d3328"/><rect x="31" y="62" width="8" height="30" fill="#3d3328"/>
    <rect x="13" y="31" width="7" height="26" rx="3" fill="${a.color}"/><rect x="40" y="31" width="7" height="26" rx="3" fill="${a.color}"/>
    <rect x="20" y="30" width="20" height="33" rx="3" fill="${a.color}"/>
    ${ch.arch === 'paladin' ? '<rect x="18" y="30" width="24" height="12" rx="3" fill="#b9bdd0"/>' : ''}
    <circle cx="30" cy="18" r="10" fill="${skin}"/>
    ${leftEye}<circle cx="34" cy="18" r="1.2" fill="#111"/>
    <path d="M26 24 Q30 ${inj.size ? 22 : 26} 34 24" stroke="#5a3a2a" fill="none" stroke-width="1"/>
    ${hat}${over}${held}
    </g></svg>`;
}

// You. The unkillable one.
function heroSVG(height) {
  let thorns = '';
  for (let i = 0; i < 12; i++) {
    const y = 40 + i * 7;
    thorns += `<path d="M22 ${y} l-6 3 l6 3 Z" fill="#5a5f6a"/><path d="M78 ${y} l6 3 l-6 3 Z" fill="#5a5f6a"/>`;
  }
  return `<svg class="fig hero" viewBox="0 0 100 150" height="${height}" aria-label="You">
    <path d="M24 38 L10 140 L90 140 L76 38 Z" fill="#8c1d1d"/>
    <path d="M18 70 L82 110 M82 70 L18 110 M14 125 L86 125" stroke="#c9c9c9" stroke-width="6" opacity=".9"/>
    ${thorns}
    <rect x="30" y="100" width="16" height="40" fill="#70757f"/><rect x="54" y="100" width="16" height="40" fill="#70757f"/>
    <rect x="24" y="38" width="52" height="66" rx="6" fill="#8f96a3" stroke="#5a5f6a" stroke-width="2"/>
    <rect x="44" y="50" width="12" height="40" fill="#d4af37" opacity=".6"/>
    <rect x="80" y="40" width="6" height="80" fill="#dfe4ee"/><rect x="74" y="40" width="18" height="5" fill="#d4af37"/>
    <path d="M76 60 L92 64 M76 70 L92 74" stroke="#c9c9c9" stroke-width="4"/>
    <rect x="30" y="4" width="40" height="36" rx="10" fill="#8f96a3" stroke="#5a5f6a" stroke-width="2"/>
    <rect x="36" y="18" width="28" height="5" fill="#222"/>
    <circle class="regen" cx="20" cy="30" r="3" fill="#7cff8a"/><circle class="regen d2" cx="84" cy="22" r="2.5" fill="#7cff8a"/><circle class="regen d3" cx="50" cy="0" r="2" fill="#7cff8a"/>
    </svg>`;
}

function durabilityBar(ch) {
  const pct = Math.max(0, ch.dur) / ch.maxDur * 100;
  const capPct = ch.cap / ch.maxDur * 100;
  const color = pct > 60 ? '#5bbf5b' : pct > 30 ? '#e0b43c' : '#d9534f';
  return `<div class="dbar" title="Durability ${ch.dur} / ${ch.maxDur} (can heal up to ${ch.cap})">
    <div class="dfill" style="width:${pct}%;background:${color}"></div>
    <div class="dcap" style="left:${capPct}%"></div>
    <div class="dlost" style="left:${capPct}%;width:${100 - capPct}%"></div>
  </div><div class="dlabel">Durability ${Math.max(0, ch.dur)} / ${ch.maxDur}${ch.cap < ch.maxDur ? ` · heal limit ${ch.cap}` : ''}</div>`;
}
