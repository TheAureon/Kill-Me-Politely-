// The Whispering Bog: click resource nodes, beat a boss (by standing there), feed a toad (please don't).

const NODE_TYPES = [
  { res: 'bogiron',    label: 'Rusty Heap',    icon: '⛓️', line: 'You pull iron from the muck. The muck lets you. Everything lets you.' },
  { res: 'mossthread', label: 'Hanging Moss',  icon: '🌿', line: 'You harvest moss. A goblin attacks you, hits your thorns, and leaves in an ambulance.' },
  { res: 'glowcap',    label: 'Glowcaps',      icon: '🍄', line: 'You pick glowing mushrooms. They are for other people. Everything is for other people.' },
  { res: 'bonedust',   label: 'Old Skeleton',  icon: '💀', line: 'An adventurer who came before you. They got the ending you want. You take their dust.' },
];
const SPOTS = [[12, 22], [30, 14], [48, 26], [66, 12], [20, 52], [40, 60], [58, 46], [78, 34], [30, 82], [56, 80], [84, 62]];
let bog = null;

function goBog() {
  bog = {
    nodes: shuffle(SPOTS).slice(0, 9).map(([x, y], i) => ({ i, x, y, type: NODE_TYPES[i % 4], left: true })),
    bossDone: false, fedToad: false, busy: false,
  };
  showScreen('bog');
  renderBog();
  placeHero(50, 92, true);
  narrate('The Whispering Bog. The monsters here have heard about you. They attack anyway. It is a matter of pride.');
}

function renderBog() {
  const map = $('bogmap');
  map.querySelectorAll('.node').forEach(n => n.remove());
  bog.nodes.forEach(n => {
    if (!n.left) return;
    map.insertAdjacentHTML('beforeend',
      `<button class="node" style="left:${n.x}%;top:${n.y}%" onclick="gatherNode(${n.i})" title="${n.type.label}">${n.type.icon}<span>${n.type.label}</span></button>`);
  });
  map.insertAdjacentHTML('beforeend',
    `<button class="node boss ${bog.bossDone ? 'done' : ''}" style="left:88%;top:12%" onclick="fightBoss()" title="Hag's Hollow">🕳️<span>Hag's Hollow${bog.bossDone ? ' (cleared)' : ''}</span></button>`);
  const toadSize = 1 + S.toad * 0.25;
  map.insertAdjacentHTML('beforeend',
    `<button class="node toad" style="left:8%;top:76%;font-size:${toadSize * 26}px" onclick="feedToad()" title="Grumbling Toad">🐸<span>Grumbling Toad (size ${S.toad + 1})</span></button>`);
  renderResources();
}

function placeHero(x, y, instant) {
  const h = $('bog-hero');
  if (instant) { h.style.transition = 'none'; void h.offsetWidth; }
  h.style.left = x + '%'; h.style.top = y + '%';
  if (instant) { void h.offsetWidth; h.style.transition = ''; }
}

function walkTo(x, y, then) {
  if (bog.busy) return;
  bog.busy = true;
  placeHero(x, y);
  setTimeout(() => { bog.busy = false; then(); }, 650);
}

function gatherNode(i) {
  const n = bog.nodes[i];
  if (!n.left) return;
  walkTo(n.x, n.y, () => {
    const amount = 1 + rand(2);
    S.res[n.type.res] += amount;
    n.left = false;
    save(); renderBog();
    narrate(`+${amount} ${RESOURCES[n.type.res].name}. ${n.type.line}`);
  });
}

function fightBoss() {
  if (bog.bossDone) { narrate('The Hag is regrouping. She needs a moment. She needs several moments.'); return; }
  walkTo(88, 12, () => {
    bog.bossDone = true;
    S.res.glasseye += 1;
    S.res.bonedust += 2;
    save(); renderBog();
    narrate("The Bog Hag hurls a curse, then a cauldron, then herself. Your thorns handle all three. She drops a Glass Eye and 2 Bonedust. You did not attack. You never attack.");
  });
}

function feedToad() {
  walkTo(10, 72, () => {
    if (bog.fedToad) { narrate('The toad is full. It is looking at you the way a dog looks at a person who feeds it.'); return; }
    if (S.res.glowcap < 1) { narrate('The toad wants a Glowcap. You have none. The toad will remember this.'); return; }
    S.res.glowcap--;
    S.toad++;
    bog.fedToad = true;
    save(); renderBog();
    narrate(`You feed the toad a Glowcap. It grows. Toad size: ${S.toad + 1}. This seems fine and will have no consequences.`);
  });
}

function leaveBog() {
  S.trips++;
  let extra = '';
  for (let k = 0; k < roleCount('shopkeeper'); k++) {
    const r = pick(['bogiron', 'mossthread', 'glowcap', 'bonedust']);
    S.res[r]++;
    extra = ' Your retired shopkeeper slips you some extra stock.';
  }
  refreshBoard();
  save();
  goHub('You return to the village. New recruits are waiting on the board.' + extra);
}
