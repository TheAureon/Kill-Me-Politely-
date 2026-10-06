# Please Kill Me (Politely)

A dark-comedy RPG prototype. You are the most overpowered character in the game, your Escape key is broken, and the only way to save and exit is to die. Nothing can kill you. So you arm other people until one of them can.

## How to play (no installing needed)

1. On GitHub, click the green **Code** button, then **Download ZIP**.
2. Unzip it anywhere.
3. Double-click **`index.html`**. It opens in your web browser. That's the game.

Your progress saves automatically in that browser. "Start a new game" is at the bottom of the Hub tab.

## The loop

1. **World**: gather materials, clear dungeons, beat bosses, and recruit champions. Each trip takes one day. Recruiting someone from a region unlocks the regions next to it.
2. **Forge**: craft gear, potions, and spells. Free and instant.
3. **Champions**: gift items. Match their likes, avoid their hates, and mind their fears and personality (Proud champions refuse poison, Huggy ones hug you, and you are covered in thorns).
4. **Arena**: stage an attempt. You never fight back. Check the fight sheet first.
5. **Knockout Journal**: every failure, with a lesson about what to change.

Injuries stack and lower each champion's durability for good. When it runs out, they retire. Give them a room in the **Retirement Home**, where they become instructors, hecklers, healers, bitter veterans (who show the odds of each failure), and so on.

Your gifts change the world: monsters wearing your hand-me-downs, warlords, rebellions.

**Hint:** no single trick works. Stack several rare ones in one fight: poison, traps, a cliff in the Quarry, the Insomnia Hex, Curse Solvent, or a monster ally.

## Files

| File | What it holds |
|---|---|
| `js/data.js` | All the numbers and text: items, regions, races, arenas, injuries. **Edit this to rebalance.** |
| `js/game.js` | Game state and actions (gathering, crafting, gifting, retiring, consequences) |
| `js/combat.js` | The arena fight simulator |
| `js/ui.js` | The screens and buttons |
| `css/style.css` | Looks |

## Milestones

- [x] 1. Engine: data and fight simulator, balance-tested (early play always fails; several late-game builds can win)
- [x] 2. Playable loop: grind, craft, gift, arena, knockout journal
- [x] 3. Long game: injuries, durability, retirement roles, hub upgrades, world consequences
- [x] 4. Ending: real kill methods, shutdown sequence, credits, autosave
- [ ] Next ideas: art and sound, more champion personalities, scripted story beats between regions, tuning from real playtests
