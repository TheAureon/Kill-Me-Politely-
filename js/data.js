// All game content lives here. Edit numbers and text freely.

const RESOURCES = {
  bogiron:    { name: 'Bog Iron',        icon: '⛓️' },
  mossthread: { name: 'Mossthread',      icon: '🧵' },
  glowcap:    { name: 'Glowcap',         icon: '🍄' },
  bonedust:   { name: 'Bonedust',        icon: '🦴' },
  glasseye:   { name: "Hag's Glass Eye", icon: '👁️', rare: true },
};

// ---------- Champions ----------
const ARCHETYPES = {
  barbarian: {
    title: 'Reckless Barbarian', color: '#b5523b', origin: 'Gutrot War Camp',
    first: ['Brakka', 'Gorla', 'Thudd', 'Marrow', 'Krusk'],
    last: ['the Loud', 'Skullfirst', 'No-Plan', 'Twice-Swung', 'of the Big Swing'],
    durability: [95, 115], power: 9, agility: 3, stamina: 6,
    likes: ['greatsword'], fears: ['monocle'],
    personality: 'Hits first. Thinks never. Extremely tough.',
    fearText: 'Distrusts anything "sneaky". Will not wear a monocle.',
  },
  archer: {
    title: 'Nervous Archer', color: '#4f8a4a', origin: 'Thimbleford Village',
    first: ['Pip', 'Wren', 'Tansy', 'Dewey', 'Moss'],
    last: ['Wobbleton', 'Halfdraw', 'Flinchley', 'Quiverknees', 'Pardonme'],
    durability: [35, 45], power: 3, agility: 7, stamina: 4, ranged: true,
    likes: ['bow', 'monocle'], fears: ['greatsword'],
    personality: 'Brilliant shot. Apologises to targets. Very fragile.',
    fearText: 'Refuses to go within sword range of you. Will not take a greatsword.',
  },
  paladin: {
    title: 'Sleepy Paladin', color: '#8a8fa8', origin: 'Monastery of the Long Nap',
    first: ['Sir Dozewell', 'Dame Yawnsley', 'Sir Snorris', 'Dame Lull', 'Sir Restmore'],
    last: ['the Drowsy', 'of the Snooze', 'Heavyeyes', 'the Recumbent', 'Pillowborn'],
    durability: [75, 90], power: 6, agility: 2, stamina: 3, heavy: true,
    likes: ['tonic'], fears: ['boots'],
    personality: 'Sturdy, devout, permanently tired. Wears a lot of armor.',
    fearText: 'Fears footwear that implies effort. Will not wear boots.',
  },
  summoner: {
    title: 'Show-off Summoner', color: '#8b4fb0', origin: 'The Glitter Spire',
    first: ['Vexa', 'Lumina', 'Zaz', 'Orlo', 'Celestine'],
    last: ['the Magnificent', 'Sparkhand', 'the Adored', 'Encore', 'the Unforgettable'],
    durability: [50, 60], power: 4, agility: 5, stamina: 5, summoner: true,
    likes: ['bow', 'greatsword'], fears: ['tonic'],
    personality: 'Summons an imp for every occasion. Lives for applause.',
    fearText: "Won't drink anything not named after her. Refuses tonics.",
  },
};

// ---------- Gifts ----------
const GIFTS = {
  greatsword: {
    name: 'Greatsword of Overcommitment', icon: '🗡️',
    cost: { bogiron: 3, bonedust: 1 },
    desc: '+4 power. Heavy: tires the wielder faster. Hits harder, so it reflects harder.',
  },
  boots: {
    name: 'Featherweight Boots', icon: '👢',
    cost: { mossthread: 3 },
    desc: '+4 agility. Fewer trips and slips. Much more speed. Possibly too much speed.',
  },
  tonic: {
    name: 'Bottomless Stamina Tonic', icon: '🧪',
    cost: { glowcap: 2, bonedust: 1 },
    desc: '+6 stamina for one attempt (used up). Strong stuff. Muscles may object.',
    consumable: true,
  },
  bow: {
    name: 'Bow of Ricochet', icon: '🏹',
    cost: { mossthread: 2, bogiron: 1 },
    desc: 'Makes the wielder ranged. Arrows bounce off things. Including you. Back at them.',
  },
  monocle: {
    name: 'Monocle of Questionable Angles', icon: '🧐',
    cost: { glasseye: 1, glowcap: 1 },
    desc: "Lets the wearer see angles that don't involve hitting you directly. Needs a Hag's Glass Eye.",
  },
};

// ---------- Arenas ----------
const ARENAS = {
  pit:     { name: 'The Muddy Pit',      desc: 'Puddles everywhere. Very slippery.' },
  dunes:   { name: 'The Scorching Dunes', desc: 'Hot. Heavy armor turns into an oven.' },
  library: { name: 'The Overdue Library', desc: 'Tall shelves. Two chandeliers. One of them is right above you.' },
};

// ---------- Injuries ----------
// sev: 1 minor, 2 serious, 3 severe. Each injury permanently lowers how far a champion can be healed.
const INJURIES = {
  blackEye:    { name: 'Black eye',           sev: 1, detail: 'Swollen shut. Looks worse than it is. Slightly.' },
  singed:      { name: 'Burns',               sev: 1, detail: 'Eyebrows gone. Hair mostly gone. Dignity entirely gone.' },
  headBandage: { name: 'Head wound',          sev: 2, detail: 'Concussed. Keeps asking what year it is.' },
  armCast:     { name: 'Broken arm',          sev: 2, detail: 'In a cast. Hits for less.' },
  sling:       { name: 'Dislocated shoulder', sev: 2, detail: 'In a sling. Pops back out when sneezing.' },
  neckBrace:   { name: 'Whiplash',            sev: 2, detail: 'Neck brace. Can only look straight ahead, which is where you are.' },
  cane:        { name: 'Wrecked knee',        sev: 2, detail: 'Walks with a cane. Moves slower.' },
  legCast:     { name: 'Broken leg',          sev: 3, detail: 'Full leg cast. Limps. Moves much slower.' },
  eyepatch:    { name: 'Lost eye',            sev: 3, detail: 'Eyepatch. Aiming is now mostly guessing.' },
};

// ---------- Failure types ----------
// Each failed attempt picks one of these. "lesson" is what the knockout journal teaches.
const FAILURES = {
  thorns: {
    name: 'Thorns Reflection', cat: 'Thorns', dmg: 8,
    injuries: ['headBandage', 'armCast', 'blackEye'],
    lines: [
      '{n} puts everything into one mighty swing. Your thorns put everything back.',
      '{n} hits you very, very hard. Then {n} hits the floor very, very hard.',
    ],
    lesson: 'Harder hits reflect harder. More power just means a bigger knockout. For them.',
  },
  ricochet: {
    name: 'Ricochet', cat: 'Thorns', dmg: 14,
    injuries: ['eyepatch', 'sling', 'blackEye'],
    lines: [
      '{n} looses an arrow. It strikes your pauldron, considers its options, and returns home.',
      'The arrow bounces off your thorns and goes straight back the way it came. Punctual.',
    ],
    lesson: 'Ranged shots bounce off you. Maybe aim at something that is not you?',
  },
  grab: {
    name: 'Grabbed the Thorns', cat: 'Thorns', dmg: 10,
    injuries: ['armCast', 'sling'],
    lines: ['{n} tries to wrestle you to the ground. You are, regrettably, covered in spikes.'],
    lesson: 'Grabbing you hurts. A lot. Nobody should touch you, which is sort of the problem.',
  },
  swordSlip: {
    name: 'Fell on Your Sword', cat: 'Your Gear', dmg: 18,
    injuries: ['sling', 'headBandage', 'armCast'],
    lines: [
      '{n} slips and falls onto your sword. You did not move it. You cannot move it. It is taped on.',
    ],
    lesson: 'Clumsy champions plus slippery floors plus your sword is a bad combination. Better footwear helps.',
  },
  capeTrip: {
    name: 'Tripped on Your Cape', cat: 'Your Gear', dmg: 12,
    injuries: ['legCast', 'blackEye', 'cane'],
    lines: ['{n} steps on your duct-taped cape mid-charge and plants their face firmly in the floor.'],
    lesson: 'Low agility trips on the cape. Something for the feet might help.',
  },
  armorBounce: {
    name: 'Bounced Off Your Armor', cat: 'Your Gear', dmg: 10,
    injuries: ['neckBrace', 'legCast', 'headBandage'],
    lines: [
      '{n} charges at a speed the boots are very proud of, hits your breastplate, and leaves at the same speed in the opposite direction. The wall stops them.',
    ],
    lesson: 'Speed solves tripping, then turns them into a projectile. Your armor is not a door.',
  },
  exhaustion: {
    name: 'Exhaustion', cat: 'Exhaustion', dmg: 8,
    injuries: ['cane', 'neckBrace'],
    lines: [
      '{n} keeps at it until your regen wins on points. They collapse in a heap of their own equipment.',
      '{n} runs out of stamina. Your health bar has not noticed anything happened.',
    ],
    sleepyLines: [
      '{n} sits down "just for a second" and falls asleep in full armor. They have to be carried out by four people.',
    ],
    lesson: 'You heal faster than they can tire. More stamina, or less heavy stuff.',
  },
  overheat: {
    name: 'Overheated', cat: 'Exhaustion', dmg: 16,
    injuries: ['singed', 'cane', 'headBandage'],
    lines: ['In the desert heat, {n} gently cooks inside their own armor until they tip over, steaming.'],
    lesson: 'Desert plus heavy gear makes soup. Pick a cooler arena or carry less.',
  },
  shelf: {
    name: 'Falling Bookshelf', cat: 'Environment', dmg: 18,
    injuries: ['armCast', 'headBandage', 'legCast'],
    lines: ['A bookshelf, unsettled by all the shouting, leans over and commits. It lands on {n}. Not on you. Never on you.'],
    lesson: 'Heavy things fall in libraries. And falling things do not care about thorns...',
  },
  chandelier: {
    name: 'Chandelier', cat: 'Environment', dmg: 25,
    injuries: ['neckBrace', 'legCast', 'headBandage'],
    lines: [
      "{n}'s arrow ricochets off you and snaps the chain of the chandelier above {n}. The chandelier falls on {n}. The chandelier above YOU watches, unused, full of potential.",
    ],
    lesson: 'The chandelier ignored thorns completely. If only someone could see an angle to the one above you, and aim at it on purpose.',
  },
  summonBetrayal: {
    name: 'Summon Betrayal', cat: 'Self-Sabotage', dmg: 16,
    injuries: ['singed', 'eyepatch', 'blackEye'],
    lines: [
      '{n} summons a magnificent imp. The imp looks at you. The imp looks at {n}. The imp makes the sensible choice.',
    ],
    lesson: 'Summons side with whoever is winning. That is always you.',
  },
  tornMuscle: {
    name: 'Torn Muscle', cat: 'Self-Sabotage', dmg: 15,
    injuries: ['legCast', 'cane', 'sling'],
    lines: [
      "The buff surges through {n}. {n}'s hamstring, which was not consulted, resigns effective immediately.",
    ],
    lesson: 'Big buffs on bodies not built for them tear things. Match the gift to the champion.',
  },
  toad: {
    name: 'The Toad You Fed', cat: 'Self-Sabotage', dmg: 12,
    injuries: ['neckBrace', 'legCast'],
    lines: ['The Bog Toad you have been feeding arrives, now the size of a barn, and sits on {n}. It looks at you fondly.'],
    lesson: 'Feeding monsters has consequences. They grow. They wander. They sit on people.',
  },
};

// ---------- Retirement roles ----------
const ROLES = {
  healer:     { name: 'Hospital Healer',  effect: 'Hospital heals +10 more.' },
  instructor: { name: 'Academy Instructor', effect: 'New recruits get +1 power (+2 with Academy).' },
  bartender:  { name: 'Bartender',        effect: 'New recruits get +8 durability. Liquid courage.' },
  shopkeeper: { name: 'Shopkeeper',       effect: '+1 random resource every bog trip.' },
  veteran:    { name: 'Bitter Veteran',   effect: 'Warns champions: +1 stamina per attempt.' },
  heckler:    { name: 'Arena Heckler',    effect: 'Sits in the stands and yells. No bonus. Lots of yelling.' },
  vengeful:   { name: 'Vengeful Survivor', effect: 'Will come back to the recruit board with a grudge (+3 power).' },
};

const RETIRE_LINES = [
  '{n} hangs up their weapon. It stays hung up. Unlike you.',
  '{n} retires to the village. They wave at you with whichever arm still works.',
  '{n} is done. Their doctor agrees. Their doctor is very firm about it.',
];

const HECKLES = [
  '"HIT HIM IN THE CAPE!" yells a heckler from the stands.',
  'A retiree in the stands holds up a sign: "I WAS YOU ONCE."',
  '"Bend the knees! BEND THE KNEES!" shouts a heckler with no working knees.',
  'Someone in the stands throws a cabbage at you. It bounces off your thorns and hits them.',
];

const HUB_LINES = [
  'You stand in the village square. The escape key remains broken.',
  'Your regeneration spell hums. It has never had a day off.',
  'A child asks why you do not just log off. You do not understand the question.',
  'The duct tape holds. It always holds.',
  'Somewhere, a save file waits patiently for you to die.',
];
