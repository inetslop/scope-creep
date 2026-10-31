---
id: T0041
title: "Coin: a coin tick when a coin is picked up or spent"
size: S
priority: 2
status: todo
depends_on: [T0039]
attempts: 1
created: 2026-10-31T07:44:39Z
claimed_at: 2026-10-31T08:48:05Z
finished_at: 2026-10-31T09:16:11Z
epic: E11
---

## Goal
Coins are what you play for across matches, and right now they are silent. Give the coin a short bright tick, so earning it in the match and spending it in the shop both feel like something happened.

## Details
- A short bright "tick" (a small coin clink, under about 0.12 s) plays in two places:
  - In the match, the moment a coin lands on the player (a kill coin or an event coin being collected).
  - In the shop, the moment a buy succeeds and the price leaves the balance.
- One tick per coin event. Collecting several coins at once plays a quick little roll of ticks (staggered by a few milliseconds each), not one loud tick and not a buzz.
- Bright and small, pitched so it is its own thing, distinct from both the monster pop and the level-up chime.
- Uses the same audio layer the Pop set up (T0039). This task adds only the tick and hooks it to the moment a coin is collected in the match and to a successful shop buy.
- No engine change; works on desktop and mobile. In the shop, the buy tap is itself a user gesture, so the audio layer can start there on a phone even before the first match.

## Acceptance criteria
- [ ] Kill a monster that drops a coin and collect it: one coin tick the moment it lands on the player.
- [ ] In the shop, buy an item you can afford: one coin tick the moment the price is taken from the balance.
- [ ] Collect several coins at once: a quick roll of ticks, clean, no buzz.
- [ ] The tick sounds distinct from both the monster pop and the level-up chime.
- [ ] On a phone both hooks play without blocking the controls.

## Design (architect, yoga)

### Files
- create `src/hud/coin.ts` — the coin-tick HUD part: no DOM, plays the roll when my coins increase
- create `src/hud/coin.css` — the part's styles (sound only: one comment line, no rules)
- edit `src/hud/index.ts` — import `coin` and add its one line next to T0039's sound-part line
- edit `src/menu/shop.ts` — import `coinTick`; one tick in `buyBtn.onclick` when `view.buy(id)` returns true
- edit the audio layer file T0039 (Pop) created — Grep `src/` for `AudioContext`, exactly one file — add the exported tick next to the pop's play function

### Interfaces
```ts
// added in T0039's audio layer file, beside the pop's play function (match that file's tone recipe)
export function coinTick(): void; // one clink at now: 'triangle' wave, 3000 Hz, peak gain 0.18, over in 0.08 s, no pitch change

// src/hud/coin.ts
import type { MakeHudPart } from '../../engine/api.ts';
import './coin.css';
import { coinTick } from '<T0039 audio layer file>';
export const coin: MakeHudPart; // builds no DOM
```

### Steps
1. Grep `src/` for `AudioContext`; read that one file (small) and see how the pop plays its single tone.
2. In that file add `export function coinTick(): void` next to the pop's function: exactly the layer's one-tone recipe the pop uses, with wave `'triangle'`, frequency `3000`, no pitch change, peak gain `0.18`, done in `0.08` s. If the layer's tone function is generic `(freq, ms, gain)`, the body is that call with `3000, 80, 0.18`. Never a second `AudioContext`. 3000 Hz is the coin's own pitch: above the low monster pop, drier and shorter than the level-up chime.
3. Create `src/hud/coin.ts`:
```ts
export const coin: MakeHudPart = () => {
  let last: number | undefined;
  return {
    update(view) {
      const c = view.me?.coins;
      if (c === undefined) { last = undefined; return; } // menu/connecting: forget
      if (last === undefined) { last = c; return; }      // first match frame: no tick
      const d = c - last; last = c;
      if (d > 0) { coinTick(); for (let i = 1; i < d; i++) setTimeout(coinTick, 30 * i); }
    },
  };
};
```
4. Create `src/hud/coin.css` with only `/* the coin tick is sound: no DOM, no styles */`.
5. `src/hud/index.ts`: `import { coin } from './coin.ts';` and the line `coin,` next to the pop part's line.
6. `src/menu/shop.ts`: `import { coinTick } from '<T0039 audio layer file>';` and change line 102 to `if (view.buy(id)) { coinTick(); popConfetti(); }` — tick first, still inside the tap.

### Pitfalls
- Coins land in the profile via `profile.addEarnings` one frame before `hud.update`, so the `me.coins` delta is the earner-only moment; do NOT hook the sound to `effects/coin.ts` (that effect is seen by every client in view, not only the earner).
- Only `d > 0` ticks: a shop buy between matches makes coins drop — no tick; the first match frame must not tick (join is not a coin).
- The roll is wall-clock (`30 * i` ms): 18-coin knockout ≈ 0.6 s roll, never a buzz (≤3 of the 80 ms ticks overlap); no `Math.random`, no frame-rate dependence.
- Shop: `coinTick()` must be called synchronously in the click handler (the tap is the user gesture that unlocks the context on phones); never `await` or delay `popConfetti()`.
- The part builds no DOM: no `hud-card`, no layout for 412x915/1280x720.

### Tests
- none

## Attempt 1 failed (asus)

Runner error: UNKNOWN: unknown error, open 'C:\Users\InetSpark\Documents\Repos\scope-creep\projects\draft-arena\game\src\audio\sfx.ts'
- Conflicts in: projects/draft-arena/game/src/audio/sfx.ts, projects/draft-arena/game/src/hud/index.ts

```
Error: UNKNOWN: unknown error, open 'C:\Users\InetSpark\Documents\Repos\scope-creep\projects\draft-arena\game\src\audio\sfx.ts'
    at Object.writeFileSync (node:fs:2482:20)
    at autoResolve (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:391:8)
    at resolveConflicts (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:339:21)
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async integrate (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:266:28)
    at async runDevTask (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/dev.ts:144:21)
    at async main (file:///C:/Users/InetSpark/Documents/Repos/scope-creep/loop/runner.ts:154:9)
```
