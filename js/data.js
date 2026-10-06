// ============================================================
// GAME DATA — everything here is plain numbers and text.
// Tweak values in this file to rebalance the game.
// ============================================================

// The hero. Never changes. That's the whole problem.
const YOU = {
  maxHp: 1500,
  regen: 100,          // healed every round
  armorCursed: 0.04,   // fraction of a direct hit that gets through the duct-taped armor
  armorBroken: 1.0,    // fraction that gets through once the curse is broken
  thorns: 0.5,         // fraction of a melee hit reflected back at the attacker
  maxRounds: 12,       // the arena is only booked for twelve rounds
};

const MATERIALS = {
  wood:      { name: 'Wood',          icon: '🪵' },
  herbs:     { name: 'Herbs',         icon: '🌿' },
  hide:      { name: 'Hide',          icon: '🟫' },
  ore:       { name: 'Ore',           icon: '🪨' },
  crystal:   { name: 'Crystal',       icon: '💎' },
  venom:     { name: 'Venom',         icon: '🧪' },
  sunstone:  { name: 'Sunstone',      icon: '☀️' },
  frost:     { name: 'Frost Shard',   icon: '❄️' },
  holywater: { name: 'Holy Water',    icon: '💧' },
  cursefrag: { name: 'Curse Fragment',icon: '🕸️' },
  goldleaf:  { name: 'Gold Leaf',     icon: '✨' },
  beasthorn: { name: 'Beast Horn',    icon: '📯', rare: true },
  wyrmfang:  { name: 'Wyrm Fang',     icon: '🦷', rare: true },
  wyrmbile:  { name: 'Wyrm Bile',     icon: '🟢', rare: true },
  abbotseal: { name: "Abbot's Seal",  icon: '📜', rare: true },
};

// ------------------------------------------------------------
// REGIONS (the open world). Recruiting someone from a region
// unlocks its neighbors.
// ------------------------------------------------------------
const REGIONS = {
  woods: {
    name: 'Whispering Woods', icon: '🌲',
    desc: 'Trees that whisper. Mostly about you, and not kindly.',
    gather: { wood: [2, 4], herbs: [1, 3], hide: [1, 2] },
    dungeon: { name: 'Hollow Oak Den', loot: { hide: [2, 4], herbs: [2, 3], wood: [1, 3], goldleaf: [0, 1] } },
    boss: { name: 'Owlbear Matriarch', loot: { hide: [5, 7], beasthorn: [1, 1] },
      text: 'The Owlbear Matriarch mauls you for forty minutes. You check your nails. She gives up and leaves a horn behind out of embarrassment.' },
    recruit: { place: 'Mossbottom (village)', races: ['human', 'halfling'] },
    neighbors: ['swamp', 'mines'],
  },
  mines: {
    name: 'Rustpeak Mines', icon: '⛏️',
    desc: 'Deep tunnels, cheap ore, and a goblin camp with a strong union.',
    gather: { ore: [2, 4], crystal: [0, 2] },
    dungeon: { name: 'Goblin Warrens', loot: { ore: [3, 5], crystal: [1, 2], goldleaf: [0, 2] } },
    boss: { name: 'Iron Golem', loot: { ore: [8, 10], crystal: [2, 4] }, unlocksArena: 'quarry',
      text: 'The Iron Golem punches you into a wall, then into the next wall. Eventually it rusts. The quarry it guarded is now free for "events".' },
    recruit: { place: 'Goblin Pit (monster camp)', races: ['goblin', 'orc'] },
    neighbors: ['desert', 'peaks'],
  },
  swamp: {
    name: 'Gloomfen Swamp', icon: '🐸',
    desc: 'Smells like regret. Rich in venom, which feels relevant.',
    gather: { venom: [1, 3], herbs: [1, 3], hide: [0, 2] },
    dungeon: { name: 'Sunken Crypt', loot: { venom: [2, 3], cursefrag: [1, 2], goldleaf: [0, 1] } },
    boss: { name: 'Bog Hydra', loot: { venom: [6, 8], beasthorn: [1, 1] },
      text: 'The Bog Hydra bites you with all nine heads. Your thorns bite back. It regrows the heads. This goes on for some time.' },
    recruit: { place: 'Fenwick (village) & Lizardfolk Camp', races: ['lizardfolk', 'human'] },
    neighbors: ['abbey'],
  },
  desert: {
    name: 'Scorchsand Desert', icon: '🏜️',
    desc: 'Hot. Very hot. Your armor is fine with it. Everyone else is not.',
    gather: { sunstone: [1, 2], crystal: [1, 2] },
    dungeon: { name: 'Buried Pyramid', loot: { sunstone: [1, 3], goldleaf: [1, 3] } },
    boss: { name: 'Sand Colossus', loot: { sunstone: [4, 6], goldleaf: [2, 3] },
      text: 'The Sand Colossus tries to bury you. You simply stand up. It is very large and very sad about this.' },
    recruit: { place: 'Scorpion Rider Camp (monster camp)', races: ['scorpion'] },
    neighbors: ['peaks'],
    unlocksArena: 'desert',
  },
  peaks: {
    name: 'Frostfang Peaks', icon: '🏔️',
    desc: 'Cold mountains. A dragon lives at the top and has opinions about visitors.',
    gather: { frost: [1, 3], ore: [1, 2] },
    dungeon: { name: 'Ice Caves', loot: { frost: [2, 4], crystal: [1, 3] } },
    boss: { name: 'Elder Wyrm', loot: { wyrmfang: [1, 1], wyrmbile: [1, 1], frost: [2, 4] },
      text: 'The Elder Wyrm breathes fire at you for eleven minutes. Your regen yawns. The wyrm leaves a tooth and some bile, the way cats leave things.' },
    recruit: { place: 'Yeti Camp & Cliffside Monastery', races: ['yeti', 'monk'] },
    neighbors: ['abbey'],
  },
  abbey: {
    name: 'Cursed Abbey', icon: '⛪',
    desc: 'Where curses are made, and occasionally, unmade.',
    gather: { holywater: [1, 2], cursefrag: [1, 2] },
    dungeon: { name: 'Catacombs', loot: { cursefrag: [2, 3], holywater: [1, 2] } },
    boss: { name: 'The Undying Abbot', loot: { abbotseal: [1, 1], cursefrag: [2, 4] },
      text: 'The Undying Abbot and you stare at each other for a full day. Two immortals, deeply bored. He hands you his seal just to make you leave.' },
    recruit: { place: 'Order of the Penitent', races: ['penitent'] },
    neighbors: [],
  },
};
const START_REGIONS = ['woods', 'mines'];
const BOSS_COOLDOWN = 5; // days

// ------------------------------------------------------------
// RACES — base stats [POW, AGI, MAG, END, WIT] and toughness.
// Toughness sets the durability meter (how long before retirement).
// ------------------------------------------------------------
const STATS = ['POW', 'AGI', 'MAG', 'END', 'WIT'];
const STAT_NAMES = { POW: 'Power', AGI: 'Agility', MAG: 'Magic', END: 'Endurance', WIT: 'Wits' };

const RACES = {
  human:      { name: 'Human',          icon: '🧑', base: [5, 5, 4, 5, 5], tough: 6, monster: false,
                names: ['Gerald', 'Brenna', 'Osric', 'Maude', 'Tobias', 'Wilhelmina', 'Percival', 'Agnes', 'Doug', 'Rowena'] },
  halfling:   { name: 'Halfling',       icon: '🧒', base: [3, 7, 4, 4, 7], tough: 4, monster: false,
                names: ['Pip', 'Rosie', 'Bramble', 'Tuck', 'Merry-Ann', 'Fennel'] },
  goblin:     { name: 'Goblin',         icon: '👺', base: [4, 6, 3, 3, 6], tough: 3, monster: true,
                names: ['Snik', 'Grubba', 'Nixit', 'Kragg', 'Lil Stabby'] },
  orc:        { name: 'Orc',            icon: '👹', base: [7, 4, 2, 7, 3], tough: 8, monster: true,
                names: ['Urzag', 'Mogra', 'Thrak', 'Bolga', 'Kevin'] },
  lizardfolk: { name: 'Lizardfolk',     icon: '🦎', base: [5, 6, 3, 7, 4], tough: 7, monster: true,
                names: ['Sss-Tallen', 'Ixta', 'Vrrsk', 'Hissandra'] },
  scorpion:   { name: 'Scorpion Rider', icon: '🦂', base: [6, 7, 3, 5, 5], tough: 6, monster: true,
                names: ['Zahra', 'Kaleb', 'Tamsin', 'Dune'] },
  yeti:       { name: 'Yeti',           icon: '🦍', base: [8, 2, 2, 9, 3], tough: 10, monster: true,
                names: ['Big Hal', 'Snowpea', 'Grumm', 'Lady Frostbottom'] },
  monk:       { name: 'Monk',           icon: '🧘', base: [4, 6, 6, 8, 6], tough: 7, monster: false,
                names: ['Brother Onn', 'Sister Vell', 'Brother Quill'] },
  penitent:   { name: 'Penitent',       icon: '🧙', base: [3, 3, 8, 6, 6], tough: 5, monster: false,
                names: ['Father Mortimer', 'Sister Ash', 'Deacon Bleak'] },
};

// ------------------------------------------------------------
// PERSONALITIES — change how champions fight and what they accept.
// ------------------------------------------------------------
const PERSONALITIES = {
  Proud:    { desc: 'Hits 10% harder. Refuses "sneaky" items like poison and traps.', powMult: 1.1, refuses: 'sneaky' },
  Reckless: { desc: 'Hits 20% harder. Has 50% more accidents.', powMult: 1.2, hazardMult: 1.5 },
  Careful:  { desc: 'Has 40% fewer accidents. Hits 10% softer.', powMult: 0.9, hazardMult: 0.6 },
  Greedy:   { desc: 'Loves shiny things. May become a warlord if they retire rich.', likes: 'shiny' },
  Timid:    { desc: 'Fears trigger twice as often. Loves cozy things.', fearMult: 2, likes: 'cozy' },
  Zealous:  { desc: 'Loves holy things. Refuses "cursed" items.', likes: 'holy', refuses: 'cursed' },
  Lazy:     { desc: 'Burns extra stamina just existing. Loves cozy things.', extraDrain: 5, likes: 'cozy' },
  'Show-off': { desc: 'Insists on a backflip every round. Loves shiny things.', backflip: true, likes: 'shiny' },
  Huggy:    { desc: 'Opens every fight with a hug. You are covered in thorns.', hug: true, likes: 'cozy' },
};

const FEARS = {
  fire:    'Fire',
  water:   'Water',
  heights: 'Heights',
  dark:    'The Dark',
  spiders: 'Spiders',
  loud:    'Loud Noises',
};

const ITEM_TAGS = ['shiny', 'heavy', 'magic', 'sneaky', 'cozy', 'brutal', 'holy', 'cursed', 'nature'];

// ------------------------------------------------------------
// ITEMS — the Forge. slot: weapon | armor | trinket | consumable
// Consumables are used up in one arena attempt.
// ------------------------------------------------------------
const ITEMS = {
  // ---- Weapons ----
  club:       { name: 'Wooden Club', icon: '🏏', slot: 'weapon', forge: 1, cost: { wood: 2 },
                power: 20, weight: 1, tags: ['nature'], desc: 'A stick with ambitions.' },
  sword:      { name: 'Iron Sword', icon: '🗡️', slot: 'weapon', forge: 1, cost: { ore: 3, wood: 1 },
                power: 40, weight: 1, tags: [], desc: 'Reliable. Pointy. Mostly pointy.' },
  hammer:     { name: 'War Hammer', icon: '🔨', slot: 'weapon', forge: 1, cost: { ore: 6, wood: 2 },
                power: 90, weight: 3, tags: ['heavy', 'brutal'], loud: true, desc: 'Hits very hard. Thorns will hit back very hard.' },
  bow:        { name: 'Longbow', icon: '🏹', slot: 'weapon', forge: 1, cost: { wood: 4, hide: 1 },
                power: 50, weight: 1, ranged: true, tags: ['nature'], desc: 'Ranged: no thorns on contact. Arrows may ricochet off your armor.' },
  lance:      { name: 'Jousting Lance', icon: '🦯', slot: 'weapon', forge: 2, cost: { wood: 4, ore: 3 },
                power: 70, weight: 2, charge: true, tags: ['shiny'], desc: 'Charge attacks. Stopping is not included.' },
  wand:       { name: 'Fire Wand', icon: '🪄', slot: 'weapon', forge: 2, cost: { crystal: 2, sunstone: 1 },
                power: 30, magicScale: 10, weight: 0, ranged: true, fire: true, tags: ['magic'], desc: 'Ranged. Scales with Magic. Fireballs ricochet too.' },
  goldaxe:    { name: 'Gilded Axe', icon: '🪓', slot: 'weapon', forge: 2, cost: { ore: 4, goldleaf: 3 },
                power: 60, weight: 2, tags: ['shiny', 'brutal'], desc: 'Mostly for show. Greedy people adore it.' },
  greatsword: { name: 'Wyrmfang Greatsword', icon: '⚔️', slot: 'weapon', forge: 3, cost: { wyrmfang: 1, ore: 6 },
                power: 150, weight: 4, tags: ['heavy', 'brutal', 'shiny'], desc: 'Forged from a dragon tooth. Absurdly strong. Absurdly heavy.' },

  // ---- Armor ----
  jerkin:     { name: 'Leather Jerkin', icon: '🦺', slot: 'armor', forge: 1, cost: { hide: 3 },
                guard: 12, weight: 0, tags: ['cozy'], desc: 'Light protection. Smells like a cow.' },
  plate:      { name: 'Tower Plate', icon: '🛡️', slot: 'armor', forge: 2, cost: { ore: 10 },
                guard: 45, weight: 4, tags: ['heavy', 'shiny'], desc: 'Huge guard. Huge weight. Weak people collapse in it.' },
  mirror:     { name: 'Mirror Shield', icon: '🪞', slot: 'armor', forge: 2, cost: { ore: 4, crystal: 3 },
                guard: 15, weight: 2, reflectMult: 0.5, tags: ['shiny'], desc: 'Halves the thorns that bounce back.' },
  politemirror: { name: 'Mirror of Polite Refusal', icon: '🔮', slot: 'armor', forge: 3, cost: { crystal: 6, holywater: 2, sunstone: 2 },
                guard: 20, weight: 1, reflectMult: 0.15, tags: ['holy', 'shiny', 'magic'], desc: 'Returns your thorns to sender, unopened. Blocks 85% of reflection.' },

  // ---- Trinkets (two slots) ----
  boots:      { name: 'Grip Boots', icon: '🥾', slot: 'trinket', forge: 1, cost: { hide: 3 },
                grip: true, tags: ['cozy'], desc: 'No slipping on puddles. Far fewer cape trips.' },
  hardhat:    { name: 'Hard Hat', icon: '⛑️', slot: 'trinket', forge: 1, cost: { ore: 2, hide: 1 },
                hardhat: true, tags: [], desc: 'Falling chandeliers, shelves and rocks bounce off.' },
  gauntlets:  { name: 'Insulated Gauntlets', icon: '🧤', slot: 'trinket', forge: 1, cost: { hide: 2, crystal: 1 },
                gauntlets: true, reflectMult: 0.8, tags: ['cozy'], desc: 'Safe hugging and grabbing. Slightly less thorns.' },
  blanket:    { name: 'Comfort Blanket', icon: '🧸', slot: 'trinket', forge: 1, cost: { hide: 2, herbs: 1 },
                fearless: true, tags: ['cozy'], desc: 'Cures all fears for the length of one fight. Every fight.' },
  arrowheads: { name: 'Angled Arrowheads', icon: '📐', slot: 'trinket', forge: 1, cost: { ore: 2 },
                noRicochet: true, tags: ['sneaky'], desc: 'Projectiles stop ricocheting off your armor.' },
  leash:      { name: 'Leash of Obedience', icon: '🪢', slot: 'trinket', forge: 2, cost: { hide: 2, crystal: 2 },
                leash: true, tags: ['magic'], desc: 'Summoned creatures stop turning on their summoner.' },
  cooling:    { name: 'Cooling Charm', icon: '🧊', slot: 'trinket', forge: 2, cost: { frost: 2, crystal: 1 },
                cooling: true, tags: ['magic'], desc: 'No overheating in the desert arena.' },
  amulet:     { name: 'Sunstone Amulet', icon: '📿', slot: 'trinket', forge: 2, cost: { sunstone: 1, goldleaf: 2 },
                bonus: { END: 2 }, tags: ['shiny'], desc: '+2 Endurance. Very shiny.' },
  whistle:    { name: 'Monster Whistle', icon: '📯', slot: 'trinket', forge: 2, cost: { beasthorn: 1, hide: 2 },
                whistle: true, tags: ['nature'], desc: 'Calls a monster you buffed earlier to fight on your side, from range. Needs a region with buffed monsters.' },

  // ---- Consumables (three slots, used up per attempt) ----
  stamina:    { name: 'Stamina Potion', icon: '🧃', slot: 'consumable', forge: 1, cost: { herbs: 3 },
                staminaBonus: 40, tags: ['nature'], desc: '+40 stamina for one fight.' },
  tonic:      { name: 'Berserker Tonic', icon: '🍺', slot: 'consumable', forge: 1, cost: { herbs: 2, venom: 1 },
                powerBonus: 50, tearRisk: true, tags: ['brutal'], desc: '+50 power. May tear a muscle or snap an ankle.' },
  summon:     { name: 'Summoning Scroll', icon: '📜', slot: 'consumable', forge: 1, cost: { crystal: 2, herbs: 2 },
                summon: true, tags: ['magic'], desc: 'Summons a creature to help. Creatures have opinions.' },
  vial:       { name: 'Swamp Venom Vial', icon: '🧪', slot: 'consumable', forge: 1, cost: { venom: 3 },
                poison: 15, spiders: true, tags: ['sneaky'], desc: 'Poison: 15 damage per round. Ignores armor and thorns.' },
  trap:       { name: 'Trap Kit', icon: '🪤', slot: 'consumable', forge: 1, cost: { wood: 3, ore: 2 },
                trap: 150, tags: ['sneaky'], desc: 'One trap: 150 damage. Ignores armor and thorns.' },
  wyrmbane:   { name: 'Wyrmbane Venom', icon: '☠️', slot: 'consumable', forge: 2, cost: { wyrmbile: 1, venom: 3 },
                poison: 75, spiders: true, tags: ['sneaky'], desc: 'Poison: 75 damage per round. Ignores everything.' },
  rigging:    { name: 'Rigging Charges', icon: '🧨', slot: 'consumable', forge: 2, cost: { ore: 4, sunstone: 2 },
                rigging: 700, loud: true, tags: ['sneaky', 'brutal'], desc: 'Drops a cliff on you: 700 damage. Only works in the Quarry arena.' },
  insomnia:   { name: 'Insomnia Hex', icon: '🌀', slot: 'consumable', forge: 2, cost: { frost: 2, cursefrag: 2, crystal: 2 },
                regenMult: 0.4, tags: ['cursed', 'magic'], desc: 'Keeps your regen awake and anxious: regen -60% for one fight.' },
  solvent:    { name: 'Curse Solvent', icon: '🧴', slot: 'consumable', forge: 3, cost: { cursefrag: 4, holywater: 3, abbotseal: 1 },
                curseBreak: true, tags: ['holy'], desc: 'Dissolves the duct tape. Your armor stops protecting you for one fight.' },
};

// ------------------------------------------------------------
// ARENAS — where attempts are staged. The arena rotates daily;
// you can rebook it for 1 Gold Leaf.
// ------------------------------------------------------------
const ARENAS = {
  courtyard: { name: 'Practice Courtyard', icon: '🏟️', desc: 'Flat, dry, boring. The safest place to fail.', start: true },
  cellar:    { name: 'Wet Cellar', icon: '💦', desc: 'Puddles everywhere. Slipping is likely. Your sword is right there.', start: true,
               slip: 0.15, fear: 'water' },
  hall:      { name: 'Grand Hall', icon: '🕯️', desc: 'Echoing marble hall. Very old chandeliers. Very old chains.', start: true,
               chandelier: 0.1, fear: 'heights' },
  library:   { name: 'Dusty Library', icon: '📚', desc: 'Dim. Tall shelves. Nobody has dusted since the last apocalypse.', needs: 'academy',
               shelves: 0.1, fear: 'dark' },
  desert:    { name: 'Desert Pit', icon: '🔥', desc: 'A sand pit at noon. Champions overheat without cooling.', needs: 'region:desert',
               heat: 15, fear: 'fire' },
  quarry:    { name: 'Collapsing Quarry', icon: '🪨', desc: 'Loose rocks overhead. Rigging Charges can drop a cliff on you.', needs: 'boss:mines',
               rocks: 0.08, fear: 'heights', rigging: true },
};

// ------------------------------------------------------------
// HUB VILLAGE BUILDINGS. cost[i] = cost to go from level i to i+1.
// ------------------------------------------------------------
const BUILDINGS = {
  forge: { name: 'Forge', icon: '⚒️', start: 1, max: 3,
    desc: ['', 'Basic recipes.', 'Advanced recipes.', 'Legendary recipes.'],
    cost: [null, { ore: 8, wood: 6 }, { ore: 15, crystal: 6, sunstone: 3 }] },
  hospital: { name: 'Hospital Wing', icon: '🏥', start: 0, max: 3,
    desc: ['Champions heal 2 durability per day.', 'Heal +3 more per day.', 'Heal +6 more per day.', 'Heal +9 more per day.'],
    cost: [{ wood: 6, herbs: 6 }, { wood: 10, herbs: 10, crystal: 3 }, { holywater: 3, crystal: 6, herbs: 12 }] },
  academy: { name: 'Academy', icon: '🎓', start: 0, max: 2,
    desc: ['No instructors can teach.', 'Up to 2 instructors boost new recruits. Unlocks the Library arena.', 'Up to 4 instructors boost new recruits.'],
    cost: [{ wood: 8, ore: 4 }, { crystal: 5, ore: 8, goldleaf: 2 }] },
  home: { name: 'Retirement Home', icon: '🏡', start: 0, max: 3,
    desc: ['Room for 2 retirees.', 'Room for 4 retirees.', 'Room for 7 retirees.', 'Room for 12 retirees.'],
    capacity: [2, 4, 7, 12],
    cost: [{ wood: 8, hide: 4 }, { wood: 12, ore: 6, hide: 6 }, { wood: 20, crystal: 4, goldleaf: 3 }] },
};
const MAX_ACTIVE_CHAMPIONS = 4;

// ------------------------------------------------------------
// RETIREE ROLES — what retired champions do in the hub.
// ------------------------------------------------------------
const ROLES = {
  instructor: { name: 'Instructor',     icon: '🎓', desc: 'New recruits get +1 to a stat (needs the Academy).' },
  heckler:    { name: 'Heckler',        icon: '📣', desc: 'Yells from the arena stands. Champions hit 5% harder (max 3 hecklers).' },
  shopkeeper: { name: 'Shopkeeper',     icon: '🛒', desc: '+1 extra material from every gathering trip.' },
  healer:     { name: 'Healer',         icon: '🩺', desc: 'Champions heal +2 durability per day.' },
  bartender:  { name: 'Bartender',      icon: '🍻', desc: 'Hears gossip: +1 recruit candidate on every recruiting trip.' },
  veteran:    { name: 'Bitter Veteran', icon: '🧓', desc: 'Watches you prepare and mutters the odds. Shows risk forecasts in the arena.' },
  vengeful:   { name: 'Vengeful Survivor', icon: '😤', desc: 'Leaves to train. Returns in a few days, angrier and stronger, for one more go.' },
};

// ------------------------------------------------------------
// INJURIES — by failure cause. sev 4 = crippling (instant retirement).
// ------------------------------------------------------------
const INJURIES = {
  thorns:     [{ name: 'Concussion', icon: '🤕', stat: 'WIT' }, { name: 'Shattered Wrist', icon: '🦴', stat: 'POW' }],
  hug:        [{ name: 'Full-Body Thorn Lacerations', icon: '🩹', stat: 'END' }],
  ricochet:   [{ name: 'Own Arrow in the Eye', icon: '🏴‍☠️', stat: 'AGI' }, { name: 'Self-Inflicted Shoulder Wound', icon: '🩹', stat: 'POW' }],
  trip:       [{ name: 'Broken Nose', icon: '👃', stat: 'WIT' }, { name: 'Sprained Ankle', icon: '🦯', stat: 'AGI' }],
  slip:       [{ name: 'Sword-Shaped Laceration', icon: '🩹', stat: 'END' }, { name: 'Cracked Tailbone', icon: '🩼', stat: 'AGI' }],
  bounce:     [{ name: 'Wall-Shaped Fracture', icon: '🩼', stat: 'END' }, { name: 'Dislocated Everything', icon: '🦴', stat: 'AGI' }],
  exhaustion: [{ name: 'Total Exhaustion', icon: '😴', stat: 'END' }],
  collapse:   [{ name: 'Crushed Ribs', icon: '🩹', stat: 'END' }],
  heat:       [{ name: 'Heatstroke', icon: '🥵', stat: 'END' }],
  chandelier: [{ name: 'Chandelier Imprint', icon: '🕯️', stat: 'WIT' }, { name: 'Neck Brace', icon: '🧣', stat: 'AGI' }],
  shelves:    [{ name: 'Encyclopedic Concussion', icon: '📚', stat: 'WIT' }],
  rocks:      [{ name: 'Cracked Skull', icon: '🤕', stat: 'WIT' }, { name: 'Crushed Foot', icon: '🦯', stat: 'AGI' }],
  fear:       [{ name: 'Panic-Sprinted Into a Pillar', icon: '🤕', stat: 'WIT' }],
  summon:     [{ name: 'Bitten by Own Summon', icon: '🩹', stat: 'MAG' }],
  tonic:      [{ name: 'Torn Muscle', icon: '💪', stat: 'POW' }, { name: 'Snapped Ankle', icon: '🦯', stat: 'AGI' }],
  monster:    [{ name: 'Mauled by Your Old Gift', icon: '🩹', stat: 'END' }],
  backflip:   [{ name: 'Botched Backflip', icon: '🦴', stat: 'AGI' }],
};

// ------------------------------------------------------------
// FLAVOR TEXT — the deadpan narrator.
// ------------------------------------------------------------
const NARRATOR = {
  intro: [
    'You are the most powerful being in this game.',
    'Your escape key is broken. The only way to save and exit is to die.',
    'Nothing can kill you. You have checked. Thoroughly.',
    'So you will arm other people until one of them can. Politely.',
    'It does not occur to you to turn the computer off. It never will.',
  ],
  idle: [
    'You regenerate a little. You did not need to.',
    'Somewhere, a save file waits.',
    'Your cape is still duct-taped to you. It always will be.',
    'You consider the menu. It considers you back. Nothing happens.',
    'A bird lands on your helmet, takes 4 thorn damage, and leaves a one-star review.',
    'You try pressing Escape again. Out of habit.',
    'The retirement home sends a fruit basket. It is passive-aggressive.',
  ],
  regen: [
    'You regenerate. You are, once again, fine.',
    'Your regen spells hum. They have never had a day off.',
    'Your health bar does not move. It is very good at that.',
    'You heal. You did not want to.',
  ],
};
