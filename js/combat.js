// ============================================================
// THE ARENA — simulates one attempt on your life.
// You never attack. Champions lose to your thorns, your gear,
// exhaustion, the room, or themselves.
// ============================================================

const CAUSE_CATEGORY = {
  thorns: 'Thorns', hug: 'Thorns', ricochet: 'Thorns',
  trip: 'Your gear', slip: 'Your gear', bounce: 'Your gear',
  exhaustion: 'Exhaustion', collapse: 'Exhaustion', heat: 'Exhaustion',
  chandelier: 'Environment', shelves: 'Environment', rocks: 'Environment',
  fear: 'Self-sabotage', summon: 'Self-sabotage', tonic: 'Self-sabotage', monster: 'Self-sabotage', backflip: 'Self-sabotage',
  timeout: 'Out of time',
};

const CAUSE_LABEL = {
  trip: 'tripping on your cape', slip: 'slipping onto your sword', bounce: 'bouncing off your armor', chandelier: 'falling chandelier',
  shelves: 'falling bookshelf', rocks: 'falling rock', fear: 'panicking', summon: 'own summon turning on them', backflip: 'botched backflip',
  collapse: 'collapsing in heavy armor',
};

// Works out every number for a fight before it starts.
function fightSetup(c, arenaId) {
  const A = ARENAS[arenaId];
  const defs = allGear(c).map(it => ITEMS[it.key]);
  const has = flag => defs.some(d => d[flag]);
  const sum = field => defs.reduce((t, d) => t + (d[field] || 0), 0);
  const weapon = c.gear.weapon ? ITEMS[c.gear.weapon.key] : null;
  const armor = c.gear.armor ? ITEMS[c.gear.armor.key] : null;
  const P = PERSONALITIES[c.personality];
  const st = {}; STATS.forEach(s => { st[s] = stat(c, s); });
  const mor = morale(c);
  const hecklers = Math.min(3, roleCount('heckler'));

  let power = st.POW * 10 + (weapon ? weapon.power : 0) + (weapon && weapon.magicScale ? st.MAG * weapon.magicScale : 0) + sum('powerBonus');
  power = Math.round(power * (P.powMult || 1) * (1 + 0.05 * mor) * (1 + 0.05 * hecklers));

  const reflectMult = defs.reduce((t, d) => t * (d.reflectMult || 1), 1);
  const thorns = YOU.thorns * reflectMult;
  const guard = 20 + st.END * 6 + (armor ? armor.guard : 0);
  const stamina = Math.max(10, 50 + st.END * 12 + sum('staminaBonus') + mor * 5);
  const heat = A.heat && !has('cooling') ? A.heat : 0;
  const drain = 10 + (weapon ? weapon.weight * 2 : 0) + (armor ? armor.weight * 4 : 0) + heat + (P.extraDrain || 0);
  const hazardMult = P.hazardMult || 1;
  const envMult = hazardMult * Math.max(0.3, 1 - st.WIT * 0.05);

  // fears: what in this fight scares them?
  const fearSources = [];
  if (A.fear === c.fear) fearSources.push(A.name);
  if (c.fear === 'fire' && weapon && weapon.fire) fearSources.push(weapon.name);
  if (c.fear === 'spiders' && has('spiders')) fearSources.push('the venom (it came from spiders)');
  if (c.fear === 'loud' && defs.some(d => d.loud)) fearSources.push('their own loud gear');
  const fearless = has('fearless');

  const cursed = !has('curseBreak');
  const armorFactor = cursed ? YOU.armorCursed : YOU.armorBroken;
  const regen = Math.round(YOU.regen * defs.reduce((t, d) => t * (d.regenMult || 1), 1));
  const poison = sum('poison');
  const trap = sum('trap');
  const riggingCarried = sum('rigging');
  const rigging = A.rigging ? riggingCarried : 0;

  // a monster you buffed earlier, now on your side
  let ally = null;
  if (has('whistle')) {
    const best = Object.entries(S.regions).filter(([, r]) => r.buffed > 0).sort((a, b) => b[1].buffed - a[1].buffed)[0];
    if (best) ally = { region: best[0], dmg: Math.round(60 * Math.min(3, best[1].buffed) * (cursed ? 0.5 : 1)) };
  }

  const summonDmg = has('summon') ? Math.round((20 + st.MAG * 8) * (cursed ? 0.25 : 1)) : 0;
  const melee = !(weapon && weapon.ranged);

  return {
    A, arenaId, defs, has, weapon, armor, P, st, mor, hecklers, power, thorns, guard, stamina, drain, heat,
    hazardMult, envMult, fearSources, fearless, cursed, armorFactor, regen, poison, trap, rigging, riggingCarried,
    ally, summonDmg, melee, ranged: !melee,
    reflect: Math.round(power * thorns),
    directDmg: Math.round(power * armorFactor),
    rounds: Math.min(YOU.maxRounds, Math.ceil(stamina / drain)),
  };
}

// Per-round accident chances [cause, chance, text, severity, lesson]
function roundHazards(c, F) {
  const H = [];
  const n = c.name;
  if (F.melee) {
    const p = Math.max(0.01, (10 - F.st.AGI) * 0.012) * (F.has('grip') ? 0.3 : 1) * F.hazardMult;
    H.push(['trip', p, `${n} steps on your duct-taped cape, trips, and faceplants into your greaves.`, 2,
      'Your cape is a menace. Grip Boots or more Agility help, or fight from range.']);
  }
  if (F.A.slip) H.push(['slip', F.A.slip * (F.has('grip') ? 0.1 : 1) * F.envMult,
    `${n} slips on a puddle and falls directly onto your sword. You did not move it. You never move it.`, 3,
    'The Wet Cellar is slippery. Bring Grip Boots, or rebook a dry arena.']);
  if (F.weapon && F.weapon.charge) H.push(['bounce', 0.2 * (F.st.AGI >= 7 ? 0.5 : 1) * F.hazardMult,
    `${n} charges, hits your breastplate, and bounces off into the wall at roughly the speed of sound.`, 3,
    'Charging into your armor ends badly. Use a non-charge weapon or a very agile champion.']);
  else if (F.melee && F.power > 220 && c.personality === 'Reckless') H.push(['bounce', 0.1,
    `${n} swings with everything they have, connects, and is launched backwards into the wall by their own momentum.`, 3,
    'Too much power and too little sense. A Careful champion would not do that.']);
  if (F.A.chandelier) H.push(['chandelier', F.A.chandelier * (F.has('hardhat') ? 0 : 1) * F.envMult,
    `The chandelier, loosened by ${n}'s war cry, falls on ${n}. Only on ${n}.`, 3,
    'The Grand Hall drops chandeliers. A Hard Hat solves it.']);
  if (F.A.shelves) H.push(['shelves', F.A.shelves * (F.has('hardhat') ? 0 : 1) * F.envMult,
    `${n} backs into a bookshelf. An entire encyclopedia lands on them, alphabetically.`, 2,
    'Library shelves fall. A Hard Hat, or more Wits, helps.']);
  if (F.A.rocks) H.push(['rocks', F.A.rocks * (F.has('hardhat') ? 0 : 1) * F.envMult,
    `A loose rock falls from the quarry wall. It misses you, which is unusual, because it was aimed at ${n}.`, 3,
    'The Quarry sheds rocks. Wear a Hard Hat.']);
  if (F.fearSources.length && !F.fearless) H.push(['fear', 0.12 * (F.P.fearMult || 1),
    `${n} is overcome by their fear of ${FEARS[c.fear].toLowerCase()} (${F.fearSources[0]}). They sprint, screaming, into a pillar.`, 2,
    `${n} fears ${FEARS[c.fear].toLowerCase()}. Remove the trigger (${F.fearSources[0]}) or gift a Comfort Blanket.`]);
  if (F.has('summon')) H.push(['summon', 0.2 * (F.st.MAG >= 7 ? 0.3 : 1) * (F.has('leash') ? 0 : 1),
    `${n}'s summoned creature looks at you, looks at ${n}, and makes the sensible choice. It bites ${n}.`, 2,
    'Summons turn on weak summoners. Use a Leash of Obedience, or a champion with 7+ Magic.']);
  if (F.P.backflip) H.push(['backflip', 0.06 * (F.st.AGI >= 8 ? 0.5 : 1),
    `${n} does a celebratory backflip before landing a single hit. The landing is not celebratory.`, 2,
    'Show-offs backflip. High Agility makes it less fatal.']);
  if (F.armor && F.armor.weight >= 4 && F.st.END < 5) H.push(['collapse', 0.3,
    `${n} collapses under the weight of their own armor and cannot get up. They wave a little.`, 2,
    'Heavy armor needs Endurance 5+. Give it to someone sturdier.']);
  return H;
}

function knockoutSeverity(ratio) { return ratio > 2.2 ? 4 : ratio > 1.5 ? 3 : 2; }

// Runs a whole fight. Pure apart from randomness: it does not change S.
function simulateAttempt(c, arenaId) {
  const F = fightSetup(c, arenaId);
  const n = c.name;
  const lines = [];
  const log = (text, cls = '') => lines.push({ text, cls });
  let hp = YOU.maxHp, lowest = hp, stamina = F.stamina;
  const dmgBy = {};
  const hurt = (src, amt) => { if (amt <= 0) return; hp -= amt; dmgBy[src] = (dmgBy[src] || 0) + amt; lowest = Math.min(lowest, hp); };
  const end = (outcome, cause, sev, text, lesson, round) => ({ outcome, cause, sev, text, lesson, round, lines, lowest, damage: YOU.maxHp - lowest, dmgBy, F });

  log(`${F.A.icon} ${F.A.name}. ${n} the ${RACES[c.race].name} steps forward. You stand there politely.`, 'head');
  if (F.hecklers) log(`📣 ${F.hecklers} retired champion${F.hecklers > 1 ? 's' : ''} heckle from the stands. ${n} is riled up (+${F.hecklers * 5}% power).`);
  if (!F.cursed) log(`🧴 ${n} pours Curse Solvent on you. The duct tape fizzles. For the first time in years, your armor feels... optional.`, 'big');
  if (F.regen < YOU.regen) log(`🌀 The Insomnia Hex settles on you. Your regen spells start worrying instead of working.`, 'big');
  if (F.riggingCarried && !F.rigging) log(`🧨 ${n} brought Rigging Charges, but there is no cliff here to drop. They hold them awkwardly.`);
  const P = F.P;

  // ---- opening moves ----
  const buffedRegions = Object.entries(S.regions).filter(([, r]) => r.buffed > 0);
  const totalBuff = buffedRegions.reduce((t, [, r]) => t + r.buffed, 0);
  if (!F.ally && totalBuff && rnd() < Math.min(0.15, 0.03 * totalBuff)) {
    const rid = pick(buffedRegions)[0];
    const t = `A monster from ${REGIONS[rid].name}, wearing gear you once gifted, wanders into the arena and attacks the nearest person. It is not you. It is never you.`;
    log(t, 'ko');
    return end('ko', 'monster', 3, t, `Monsters you buffed in ${REGIONS[rid].name} crash fights. A Monster Whistle would make one fight for you instead.`, 0);
  }
  if (F.ally) log(`📯 ${n} blows the Monster Whistle. A beefed-up monster from ${REGIONS[F.ally.region].name} lumbers in and takes aim at you from a safe distance.`, 'big');
  if (P.hug && F.melee) {
    if (F.has('gauntlets')) log(`${n} opens with a hug. The gauntlets keep the thorns out. It is mostly just awkward.`);
    else {
      const hugHit = Math.round(F.power * F.thorns * 2);
      if (hugHit > F.guard) {
        const t = `${n} opens with a big warm hug. You are covered in thorns. ${n} takes ${hugHit} reflected damage and slides to the floor.`;
        log(t, 'ko');
        return end('ko', 'hug', knockoutSeverity(hugHit / F.guard), t, 'Huggy champions need Insulated Gauntlets. Grabbing you is the worst idea.', 0);
      }
      stamina -= Math.round(hugHit * 0.5);
      log(`${n} hugs you. The thorns hurt (${hugHit}). They let go, wiser and bleeding.`);
    }
  }
  if (F.has('tearRisk')) {
    if (rnd() < 0.35 * (F.st.END >= 7 ? 0.3 : 1)) {
      const t = `${n} downs the Berserker Tonic, roars, flexes, and tears a muscle mid-roar. Something also snaps in the ankle region.`;
      log(t, 'ko');
      return end('ko', 'tonic', 3, t, 'Berserker Tonic tears weak bodies. Give it only to Endurance 7+ champions.', 0);
    }
    log(`${n} downs the Berserker Tonic. Their veins become visible from orbit.`);
  }
  if (F.trap) { hurt('Traps', F.trap); log(`🪤 You step on a trap. You did not see it. You never look down. (${F.trap} damage, ignores your armor and thorns.)`, 'big'); }

  // ---- rounds ----
  const hazards = roundHazards(c, F);
  for (let r = 1; r <= YOU.maxRounds; r++) {
    for (const [cause, p, text, sev, lesson] of hazards) {
      if (rnd() < p) {
        log(`Round ${r}. ${text}`, 'ko');
        return end('ko', cause, sev, text, lesson, r);
      }
    }
    let line = `Round ${r}. `;
    // the attack
    if (F.ranged) {
      const ricochetP = F.has('noRicochet') ? 0.03 : Math.max(0.05, 0.3 - F.st.WIT * 0.025);
      if (rnd() < ricochetP) {
        const self = Math.round(F.power * 0.6);
        if (self > F.guard * 0.8) {
          const t = `${n} fires. It ricochets off your armor and comes straight back. ${n} takes ${self} damage from their own ${F.weapon.name}.`;
          log(`Round ${r}. ${t}`, 'ko');
          return end('ko', 'ricochet', knockoutSeverity(self / F.guard), t, 'Projectiles ricochet off your armor. Angled Arrowheads or high Wits fix it.', r);
        }
        stamina -= Math.round(self * 0.5);
        line += `${n}'s shot ricochets back and grazes them. `;
      } else {
        hurt('Direct hits', F.directDmg);
        line += `${n} shoots you from range for ${F.directDmg}. `;
      }
    } else {
      hurt('Direct hits', F.directDmg);
      if (F.reflect > F.guard) {
        const t = `${n} hits you as hard as they can (${F.directDmg} damage). Your thorns reflect ${F.reflect} back. Their guard is only ${F.guard}. They fold like a deck chair.`;
        log(`Round ${r}. ${t}`, 'ko');
        return end('ko', 'thorns', knockoutSeverity(F.reflect / F.guard), t,
          `Reflection (${F.reflect}) beat their guard (${F.guard}). Hit softer, add a Mirror Shield, more Endurance or better armor, or fight from range.`, r);
      }
      stamina -= Math.round(F.reflect * 0.2);
      line += `${n} hits you for ${F.directDmg}. Thorns sting them for ${F.reflect}. `;
    }
    if (F.summonDmg) { hurt('Summons', F.summonDmg); line += `The summon nibbles you (${F.summonDmg}). `; }
    if (F.ally) { hurt('Ranged ally', F.ally.dmg); line += `The monster pelts you from range (${F.ally.dmg}); your thorns bounce off its thick hide. `; }
    if (F.poison) { hurt('Poison', F.poison); line += `Poison ticks (${F.poison}). `; }
    if (F.rigging && r === 3) {
      hurt('Falling cliff', F.rigging);
      log(line, '');
      line = '';
      log(`🧨 Round 3. ${n} sets off the Rigging Charges. Half the quarry falls on you. (${F.rigging} damage.)`, 'big');
    }
    if (hp <= 0) {
      if (line) log(line);
      return end('kill', null, 0, 'You have been killed.', '', r);
    }
    const before = hp;
    hp = Math.min(YOU.maxHp, hp + F.regen);
    line += hp === YOU.maxHp && before >= YOU.maxHp - F.regen ? pick(NARRATOR.regen) : `You regenerate ${hp - before}. HP ${hp}/${YOU.maxHp}.`;
    log(line);
    // exhaustion
    stamina -= F.drain;
    if (stamina <= 0) {
      let cause = 'exhaustion', t;
      if (F.heat) { cause = 'heat'; t = `${n} overheats in the desert sun and keels over, steaming slightly.`; }
      else if (F.armor && F.armor.weight >= 3) { cause = 'collapse'; t = `${n} runs out of stamina and collapses inside their armor, which is now a very expensive tent.`; }
      else t = pick([`${n} has swung at your regen until their arms gave up. They lie down. They are asleep. Gently snoring.`,
        `${n} runs out of stamina and sits down mid-swing. "Five minutes," they say. It is not five minutes.`]);
      log(`Round ${r}. ${t}`, 'ko');
      const lesson = F.heat ? 'The Desert Pit drains stamina fast. Bring a Cooling Charm.'
        : `They lasted ${r} round${r > 1 ? 's' : ''}. More Endurance, Stamina Potions, or lighter gear means more rounds.`;
      return end('ko', cause, F.heat ? 2 : 1, t, lesson, r);
    }
  }
  const t = `The arena booking ends after ${YOU.maxRounds} rounds. ${n} is still standing. So are you. Everyone goes home.`;
  log(t, 'head');
  return end('timeout', 'timeout', 0, t, `They survived, but your regen won. They need much more damage per round: poison, traps, a broken curse, or a ranged ally.`, YOU.maxRounds);
}

function killMethod(res) {
  const top = Object.entries(res.dmgBy).sort((a, b) => b[1] - a[1]);
  const names = top.filter(([, v]) => v > 0).map(([k]) => k);
  const label = {
    'Direct hits': res.F.cursed ? 'a direct hit (somehow)' : 'a direct hit through a dissolved curse',
    'Poison': 'poison, which ignores thorns', 'Traps': 'a trap, which ignores thorns',
    'Falling cliff': 'an environmental accident (a cliff)', 'Ranged ally': 'a monster you once buffed, firing from range',
    'Summons': 'a summoned creature',
  };
  return names.slice(0, 3).map(k => label[k] || k).join(' + ');
}

// Applies a finished fight to the save file. Returns { injury, retire }.
function resolveAttempt(c, res) {
  S.stats.attempts++;
  c.attempts++;
  // consumables are used up
  c.gear.consumables = [];
  if (res.damage > S.stats.bestDamage) { S.stats.bestDamage = res.damage; S.stats.bestBy = c.name; }
  if (res.outcome === 'kill') {
    S.ended = true;
    S.killer = { name: c.name, race: c.race, method: killMethod(res), day: S.day, attempts: S.stats.attempts, round: res.round };
    S.journal.push({ n: S.stats.attempts, day: S.day, champ: c.name, icon: RACES[c.race].icon, arena: res.F.A.name, round: res.round,
      category: 'SUCCESS', text: 'They did it. You are dead. Saving...', lesson: '', injury: null, damage: res.damage });
    return { injury: null, retire: false };
  }
  let injury = null;
  if (res.sev > 0) injury = applyInjury(c, res.cause, res.sev);
  else c.dur = Math.max(1, c.dur - 5); // a long day of swinging
  S.journal.push({
    n: S.stats.attempts, day: S.day, champ: c.name, icon: RACES[c.race].icon, arena: res.F.A.name, round: res.round,
    category: CAUSE_CATEGORY[res.cause], text: res.text, lesson: res.lesson,
    injury: injury ? `${injury.icon} ${injury.name}${injury.sev >= 4 ? ' (crippling)' : ''}` : null, damage: res.damage,
  });
  const retire = needsRetirement(c); // checked before the overnight rest
  endDay();
  return { injury, retire };
}

// The Bitter Veteran's forecast: chance of each failure over the whole fight.
function forecast(c, arenaId) {
  const F = fightSetup(c, arenaId);
  const out = [];
  if (F.melee && F.reflect > F.guard) out.push({ p: 1, text: `Thorns: reflection ${F.reflect} beats guard ${F.guard}. Certain knockout in round 1.` });
  if (F.P.hug && F.melee && !F.has('gauntlets') && F.power * F.thorns * 2 > F.guard) out.push({ p: 1, text: 'The opening hug will end them. Gauntlets, please.' });
  const totalBuff = Object.values(S.regions).reduce((t, r) => t + r.buffed, 0);
  if (!F.ally && totalBuff) out.push({ p: Math.min(0.15, 0.03 * totalBuff), text: 'A monster you buffed earlier crashes the fight' });
  if (F.has('tearRisk')) out.push({ p: 0.35 * (F.st.END >= 7 ? 0.3 : 1), text: 'Berserker Tonic might tear a muscle.' });
  const rounds = F.rounds;
  for (const [cause, p] of roundHazards(c, F)) {
    if (p <= 0) continue;
    const total = 1 - Math.pow(1 - p, rounds);
    out.push({ p: total, text: `${CAUSE_CATEGORY[cause]}: ${CAUSE_LABEL[cause] || cause} (${Math.round(p * 100)}% per round)` });
  }
  if (F.ranged) {
    const rp = F.has('noRicochet') ? 0.03 : Math.max(0.05, 0.3 - F.st.WIT * 0.025);
    if (F.power * 0.6 > F.guard * 0.8) out.push({ p: 1 - Math.pow(1 - rp, rounds), text: `Thorns: own projectile ricochets back (${Math.round(rp * 100)}% per round)` });
  }
  const perRound = F.directDmg + F.summonDmg + (F.ally ? F.ally.dmg : 0) + F.poison - F.regen;
  const projected = Math.max(0, F.trap + F.rigging * (rounds >= 3 ? 1 : 0) + perRound * rounds);
  out.sort((a, b) => b.p - a.p);
  return { risks: out.slice(0, 5), rounds, perRound, projected, F };
}
