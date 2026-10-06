// The arena: set up an attempt, play it out beat by beat, log the failure, apply injuries.

let setup = { champ: null, arena: 'pit' };
let fight = null;

function goArenaSetup() {
  if (!S.roster.length) return;
  if (!setup.champ || !S.roster.find(c => c.id === setup.champ)) setup.champ = S.roster[0].id;
  showScreen('setup');
  renderSetup();
  narrate('Choose who will try to kill you today, and where. You will be there. You are always there.');
}

function renderSetup() {
  $('setup-champs').innerHTML = S.roster.map(ch => `
    <button class="pick ${setup.champ === ch.id ? 'on' : ''}" onclick="setup.champ=${ch.id};renderSetup()">
      ${figureSVG(ch, 80)}<div><b>${esc(ch.name)}</b><br><span class="small">${ch.gifts.map(g => GIFTS[g].icon).join(' ') || 'no gifts'}</span>
      <div class="dbar mini"><div class="dfill" style="width:${Math.max(0, ch.dur) / ch.maxDur * 100}%"></div></div></div>
    </button>`).join('');
  $('setup-arenas').innerHTML = Object.keys(ARENAS).map(id => `
    <button class="pick arena-${id} ${setup.arena === id ? 'on' : ''}" onclick="setup.arena='${id}';renderSetup()">
      <b>${ARENAS[id].name}</b><br><span class="small">${ARENAS[id].desc}</span></button>`).join('');
}

// ---------- The simulation ----------
function effectiveStats(ch, arenaId) {
  const a = ARCHETYPES[ch.arch];
  const has = id => ch.gifts.includes(id);
  const injured = id => ch.injuries.some(i => i.id === id);
  const s = {
    power: ch.power, agility: ch.agility, stamina: ch.stamina + roleCount('veteran'),
    ranged: !!a.ranged || has('bow'), heavy: !!a.heavy, summoner: !!a.summoner,
    angles: has('monocle'), tear: 0, drain: 1,
    morale: ch.gifts.filter(g => a.likes.includes(g)).length,
  };
  if (has('greatsword')) { s.power += 4; s.drain += 1; if (ch.power < 6) s.tear += 1; }
  if (has('boots')) s.agility += 4;
  if (has('tonic')) { s.stamina += 6; s.tear += ch.arch === 'paladin' ? 0.5 : 1.2; }
  if (s.heavy) s.drain += 1;
  if (arenaId === 'dunes') s.drain += s.heavy ? 2 : 1;
  if (injured('legCast')) s.agility -= 2;
  if (injured('cane')) s.agility -= 1;
  if (injured('armCast')) s.power -= 2;
  s.agility = Math.max(1, s.agility);
  s.power = Math.max(1, s.power);
  s.aimPenalty = injured('eyepatch') ? 0.2 : 0;
  return s;
}

// Weighted table of what happens in one beat. "flavor" means the fight goes on.
function eventTable(s, arenaId) {
  const t = [];
  const add = (id, w) => { if (w > 0) t.push({ id, w: id === 'flavor' || id === 'win' ? w : w * (1 - 0.12 * s.morale) }); };
  add('flavor', 3);
  if (s.ranged) {
    add('ricochet', 1.6 + s.aimPenalty * 5);
  } else {
    add('thorns', s.power * 0.25);
    add('grab', s.heavy ? 0.9 : 0.4);
    add('swordSlip', Math.max(0, 8 - s.agility) * 0.18 + (arenaId === 'pit' ? 1.2 : 0));
    add('capeTrip', Math.max(0, 8 - s.agility) * 0.2);
    add('armorBounce', s.agility >= 7 ? 1.8 : 0.2);
  }
  if (arenaId === 'library') {
    add('shelf', 0.7);
    if (s.ranged && !s.angles) add('chandelier', 1.4);
    if (s.ranged && s.angles) add('win', 2 + s.morale);
  }
  if (s.summoner) add('summonBetrayal', 1.6);
  if (s.tear) add('tornMuscle', s.tear);
  if (S.toad >= 2) add('toad', (S.toad - 1) * 0.35);
  return t;
}

function rollEvent(table) {
  let total = table.reduce((a, e) => a + e.w, 0), r = Math.random() * total;
  for (const e of table) { if ((r -= e.w) <= 0) return e.id; }
  return 'flavor';
}

function flavorLine(ch, s, arenaId) {
  const n = ch.name;
  const lines = s.ranged
    ? [`${n} fires an arrow. It bounces off harmlessly and lands in the stands. A spectator keeps it.`,
       `${n} lines up a shot, apologises to you, and fires. Your regen fixes the scratch before the apology ends.`]
    : [`${n} lands a clean hit. Your regen undoes it before the sound arrives.`,
       `${n} swings again. Your health bar flickers, briefly, out of politeness.`,
       `${n} circles you, looking for a weak spot. You helpfully stand still. There is no weak spot.`];
  if (s.angles && arenaId !== 'library') lines.push(`${n} peers through the monocle and sees many clever angles. None of them lead to anything heavy above your head. This arena is too sensible.`);
  if (s.angles && arenaId === 'library' && !s.ranged) lines.push(`${n} spots the perfect angle: the chandelier chain above you. It is twenty feet up. ${n} has nothing that reaches.`);
  if (s.summoner) lines.push(`${n} summons a small imp, which bows to the crowd. The crowd is mostly retirees. They do not clap.`);
  if (arenaId === 'dunes') lines.push(`The sun beats down. ${n} sweats. You do not. Your regen covers sunburn too.`);
  if (S.retirees.some(r => r.role === 'heckler') && Math.random() < 0.5) return pick(HECKLES);
  return pick(lines);
}

function simulate(ch, arenaId) {
  const s = effectiveStats(ch, arenaId);
  const beats = [];
  let stamina = s.stamina;
  for (let i = 0; i < 10; i++) {
    stamina -= s.drain;
    if (stamina < 0) {
      const id = arenaId === 'dunes' && (s.heavy || ch.gifts.includes('greatsword')) ? 'overheat' : 'exhaustion';
      return { s, beats, end: id };
    }
    let ev = rollEvent(eventTable(s, arenaId));
    if (ev === 'win') {
      if (Math.random() < 0.5 + 0.1 * s.morale - s.aimPenalty) return { s, beats, end: 'win' };
      beats.push(`${ch.name} aims at the chain above you... and misses by an inch. Everyone in the stands gasps. You gasp hardest.`);
      continue;
    }
    if (ev === 'flavor') { beats.push(flavorLine(ch, s, arenaId)); continue; }
    return { s, beats, end: ev };
  }
  return { s, beats, end: 'exhaustion' };
}

// ---------- Playback ----------
function startAttempt() {
  const ch = S.roster.find(c => c.id === setup.champ);
  if (!ch) return;
  const result = simulate(ch, setup.arena);
  fight = { ch, arena: setup.arena, result, step: 0, timer: null };
  showScreen('arena');
  const stage = $('stage');
  stage.className = 'stage arena-' + setup.arena;
  const props = setup.arena === 'library'
    ? `<div class="shelf s1"></div><div class="shelf s2"></div><div class="chand" id="chand-a" style="left:28%">🕯️💡🕯️</div><div class="chand" id="chand-b" style="left:68%">🕯️💡🕯️</div>`
    : setup.arena === 'pit' ? '<div class="puddle p1"></div><div class="puddle p2"></div>' : '<div class="sun">☀️</div>';
  const crowd = S.retirees.slice(-6).map(r => `<span title="${esc(r.name)}">${figureSVG(r, 34)}</span>`).join('');
  stage.innerHTML = `${props}<div class="stands">${crowd}</div>
    <div id="f-champ" class="actor champ-actor">${figureSVG(ch, 120)}</div>
    <div id="f-hero" class="actor hero-actor">${heroSVG(170)}</div>`;
  $('fightlog').innerHTML = '';
  $('fight-title').textContent = `${ch.name} vs. You — ${ARENAS[setup.arena].name}`;
  $('fight-next').style.display = 'none';
  $('fight-skip').style.display = '';
  narrate(pick(['The crowd settles in. The retirees in the stands have seen this before.', 'Somewhere, a save file holds its breath.', 'You stand perfectly still. It is the only move you know.']));
  logLine(`<i>The arena falls silent. ${esc(ch.name)} steps forward. You stand there. You are very good at standing there.</i>`);
  fight.timer = setInterval(stepFight, 1300);
}

function logLine(html, cls) {
  const el = document.createElement('div');
  el.className = 'logline ' + (cls || '');
  el.innerHTML = html;
  $('fightlog').appendChild(el);
  $('fightlog').scrollTop = 1e6;
}

function anim(id, cls) {
  const el = $(id);
  if (!el) return;
  el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls);
}

function stepFight() {
  const f = fight;
  if (f.step < f.result.beats.length) {
    anim('f-champ', 'lunge'); anim('f-hero', 'tink');
    logLine(esc(f.result.beats[f.step]));
    f.step++;
    return;
  }
  clearInterval(f.timer);
  finishFight();
}

function skipFight() {
  if (!fight || fight.done) return;
  clearInterval(fight.timer);
  while (fight.step < fight.result.beats.length) logLine(esc(fight.result.beats[fight.step++]));
  finishFight();
}

function finishFight() {
  const f = fight;
  if (f.done) return;
  f.done = true;
  $('fight-skip').style.display = 'none';
  const ch = f.ch;
  ch.attempts++;
  S.attempts++;
  const giftsText = ch.gifts.map(g => GIFTS[g].name).join(' + ') || 'no gifts';

  if (f.result.end === 'win') {
    anim('f-champ', 'lunge');
    const b = $('chand-b'); if (b) b.classList.add('fall');
    logLine(`${esc(ch.name)} adjusts the monocle, ignores you completely, and shoots the chain above your head. The arrow does not touch you. Your thorns have nothing to reflect.`, 'big');
    setTimeout(() => { anim('f-hero', 'down'); logLine('The chandelier lands on you. Thorns do not work on chandeliers. Regen does not work fast enough on chandeliers.', 'big'); }, 900);
    setTimeout(() => logLine('<b>You have been knocked out.</b> Somewhere, a save icon begins to spin.', 'win'), 2200);
    S.journal.push({ n: S.attempts, champ: ch.name, arena: ARENAS[f.arena].name, failure: 'SUCCESS', cat: 'Victory', text: 'The chandelier above you finally fell.', lesson: 'Indirect damage ignores thorns. It took a village.', gifts: giftsText, win: true });
    S.won = true;
    S.winInfo = { champ: ch.name, arch: ch.arch, gifts: giftsText, arena: ARENAS[f.arena].name };
    save();
    setTimeout(() => startEnding(), 4200);
    return;
  }

  const fail = FAILURES[f.result.end];
  let dmg = fail.dmg;
  if (f.result.end === 'thorns') dmg = Math.round(8 + f.result.s.power * 2.5);
  if (f.result.end === 'armorBounce') dmg = Math.round(10 + f.result.s.agility * 2);
  if (f.result.end === 'toad') dmg = 12 + S.toad * 4;
  if (f.result.end === 'exhaustion' && f.result.s.heavy) dmg += 6;
  dmg = Math.round(dmg * (0.85 + Math.random() * 0.3));

  // Injury: new one, or an old one gets worse
  const injId = pick(fail.injuries);
  const existing = ch.injuries.find(i => i.id === injId);
  let injury;
  if (existing) { existing.sev++; existing.name = INJURIES[injId].name + ' (again)'; injury = existing; }
  else { injury = Object.assign({ id: injId }, INJURIES[injId]); ch.injuries.push(injury); }
  S.injuriesDealt++;
  ch.cap = Math.max(0, ch.cap - injury.sev * 4);
  ch.dur = Math.min(ch.cap, ch.dur - dmg);

  const lines = f.result.end === 'exhaustion' && f.result.s.heavy ? fail.sleepyLines : fail.lines;
  const text = pick(lines).replace(/\{n\}/g, ch.name);
  anim('f-champ', ['thorns', 'ricochet', 'armorBounce', 'grab'].includes(f.result.end) ? 'knock' : 'collapse');
  if (f.result.end === 'chandelier') { const a = $('chand-a'); if (a) a.classList.add('fall'); }
  if (f.result.end === 'shelf') { const s = document.querySelector('.shelf.s1'); if (s) s.classList.add('topple'); }
  logLine(esc(text), 'big');

  const retired = ch.dur <= 0 || ch.cap <= 10;
  S.journal.push({ n: S.attempts, champ: ch.name, arena: ARENAS[f.arena].name, failure: fail.name, cat: fail.cat, text, lesson: fail.lesson, injury: injury.name, dmg, gifts: giftsText });

  // Tonics get used up
  if (ch.gifts.includes('tonic')) ch.gifts = ch.gifts.filter(g => g !== 'tonic');

  let summary = `<div class="result"><div class="row">${figureSVG(ch, 110)}<div>
    <div class="cname">${esc(ch.name)} is knocked out: ${fail.name}</div>
    <div>Injury: <b>${esc(injury.name)}</b> (severity ${injury.sev}). Durability lost: <b>${dmg}</b>.</div>
    ${durabilityBar(ch)}
    <div class="lesson">📝 Journal: ${esc(fail.lesson)}</div></div></div>`;
  if (retired) {
    const r = retireChampion(ch);
    summary += `<div class="retire">🏚️ ${esc(pick(RETIRE_LINES).replace(/\{n\}/g, ch.name))}<br>
      They become a <b>${ROLES[r.role].name}</b> in the village. ${ROLES[r.role].effect}</div>`;
  }
  summary += '</div>';
  save();
  setTimeout(() => {
    logLine(summary);
    logLine('<i>You remain at full health. You were always going to remain at full health.</i>');
    $('fight-next').style.display = '';
  }, 700);
}

function leaveArena() {
  fight = null;
  goHub(S.roster.length ? 'Back to the village. The hospital wing has the kettle on.' : 'Your roster is empty. The Recruit Board awaits fresh optimism.');
}

// ---------- The ending ----------
function startEnding() {
  showScreen('ending');
  const e = $('ending');
  e.className = 'ending';
  e.innerHTML = '<div class="savetext" id="savetext"></div>';
  const steps = ['Saving...', 'Saving...', 'Save complete.', 'Exiting game...'];
  steps.forEach((t, i) => setTimeout(() => { $('savetext').textContent = t; }, 900 * (i + 1)));
  setTimeout(() => { e.innerHTML = '<div class="crt"></div>'; }, 4600);
  setTimeout(() => { e.innerHTML = ''; }, 6200);
  setTimeout(showCredits, 8000);
}

function showCredits() {
  const w = S.winInfo || {};
  const retirees = S.retirees.map(r => `<li>${esc(r.name)}: ${ROLES[r.role].name}</li>`).join('') || '<li>No one retired. Somehow.</li>';
  const crafted = Object.keys(S.crafted).map(g => `<li>${S.crafted[g]} × ${GIFTS[g].name}</li>`).join('') || '<li>Nothing</li>';
  const toad = S.toad >= 4 ? 'The Bog Toad is now a regional power with its own flag.' : S.toad >= 1 ? `The Bog Toad grew to size ${S.toad + 1}. It misses you.` : 'The Bog Toad remains a normal toad. Well done.';
  $('ending').innerHTML = `<div class="credits"><div class="roll">
    <h1>Please Kill Me (Politely)</h1>
    <p>Final blow: <b>${esc(w.champ || 'someone')}</b>, with ${esc(w.gifts || 'determination')}, in ${esc(w.arena || 'an arena')}. Mostly the chandelier.</p>
    <h3>What your gifts built</h3>
    <p>${S.recruitedTotal} champions recruited · ${S.attempts} attempts · ${S.injuriesDealt} injuries · ${S.trips} bog trips</p>
    <h3>The Retirement Home</h3><ul>${retirees}</ul>
    <h3>Gifts Crafted</h3><ul>${crafted}</ul>
    <h3>The World You Left Behind</h3>
    <p>${S.buildings.hospital ? 'The Hospital Wing is the busiest in the realm.' : 'The village never built a hospital. Bold.'}
    ${S.buildings.academy ? ' The Academy teaches a course called "Not Hitting Him Directly 101".' : ''}</p>
    <p>${toad}</p>
    <p class="muted">The computer had a power button the whole time.<br>You never once looked at it.</p>
    <p>Thanks for playing.</p>
    <button class="btn big" onclick="resetGame();goHub('You wake up. New game. The escape key is still broken.');showIntro()">Start a new life</button>
  </div></div>`;
}
