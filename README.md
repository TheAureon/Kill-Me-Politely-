# Please Kill Me (Politely)

A small playable slice of a dark-comedy RPG. You play the most overpowered character in the game. Your escape key is broken, so the only way to save and exit is to die, and nothing can kill you. You gather materials, craft gifts, and arm champions until one of them can finish the job.

## How to run it

1. Download this repository. On GitHub, click **Code → Download ZIP**, then unzip it.
2. Open the folder and double-click **`index.html`**.
3. The game opens in your web browser. Nothing needs to be installed.

Your progress saves in your browser automatically. Use the **Reset** button at the top to start over.

## What to try first

1. **Recruit Board:** recruit someone. Each recruit has things they like and a fear; check both.
2. **Go to the Bog:** click the resource piles to gather them, then click **Hag's Hollow** to fight the boss (you win by standing there). Return to the village.
3. **Craft Bench:** craft a gift. In the hub, click **Give gift** on your champion.
4. **Stage an Attempt:** pick your champion and an arena, then watch them fail.
5. Read the **Journal**. Every failure leaves a hint about what the next kit needs.

There is one real way to win in this slice. The journal will point you toward it.

## Files

- `index.html`: the page
- `style.css`: the look
- `js/data.js`: all content (champions, gifts, failures, injuries, jokes). Change numbers and text here.
- `js/state.js`: the save file
- `js/hub.js`, `js/gather.js`, `js/arena.js`: hub village, gathering area, arena
- `js/ui.js`: popups and the drawings
