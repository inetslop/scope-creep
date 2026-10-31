---
id: T0127
title: "Sash pop: a star ring and a bright two-note chime when the streak sash appears"
size: S
priority: 2
status: todo
depends_on: [T0126, T0125]
attempts: 0
created: 2026-10-31T21:05:07Z
epic: E29
---

## Goal
The sash arrives as a moment: a small star ring blooms where the streak is earned, and the streaker hears a bright chime — the streak is felt by eye and ear, for the wearer and for the field.

## Details
- A new field effect, sash-pop: a thin band with an ink rim (gold or green, matching the sash's tier) blooms from the player out to radius 30 over 0.3 s with 6 small stars of the same color, in the shape of the existing ring effect at a third of its size.
- It plays from the sash area itself — when the sash is first placed on a critter and again when its tier changes (`slots[0]` 1 to 2), the way the fizz-puddle plays the fizz-tick when its puddle strikes. A mere refresh of the 15 s timer (same tier) plays nothing. The director is not touched.
- It shows on every player's sash — a moment the whole field sees, like the crown's fall.
- A new sound in the audio layer, sash: a bright two-note (E6 then A6, 0.15 s, peak 0.06) — a step higher and shorter than the level-up chime, so a streak never sounds like a level-up. Yours only: it plays when your own sash first appears or changes tier, the way the plink plays only for your own pickups, with the sfx layer's gesture and match-on-screen gate, deduped per effect seed, and no more than one chime per 1.5 s for one player's sash.
- No HUD element: the sash is on the critter, the pay is already read by the coin chip and the coin tick.

## Acceptance criteria
- [ ] A sash appearing, or a gold-to-green change, blooms the sash-pop ring in the sash's color from the player; another player's sash blooms the same way.
- [ ] Your own sash appearance or tier change plays the two-note chime; another player's sash is silent to you.
- [ ] A sash that is only refreshed (the 15 s timer extended by another knockout in the chain, same tier) plays no ring and no chime.
- [ ] No more than one chime per 1.5 s for one player's sash; no new HUD element appears; the coin chip and the coin tick read the pay as before.

## Design (architect, desktop)

### Files
- create `src/content/effects/sash-pop.ts` — the sash-pop effect: thin ink-rimmed band + 6 small stars in the sash's color, blooming out to radius 30 over 0.3 s
- edit `src/content/effects/index.ts` — `import { sashPop } from './sash-pop.ts';` after the fizzTick import; `sashPop,` after `fizzTick,` in EFFECTS
- edit `src/audio/sfx.ts` — `lastSash` timestamp line + `sashChime()` sound (E6 then A6)
- create `src/hud/sashChime.ts` + `src/hud/sashChime.css` — sound-only part (no DOM, like the coin part) that plays the chime for your own sash only
- edit `src/hud/index.ts` — `import { sashChime } from './sashChime.ts';` between the prestige and scoreboard imports; `sashChime,` after `chime,` in HUD_PARTS
- edit `src/content/statuses/streak-gold.ts` — add the pop `tick` (file created by T0125)
- edit `src/content/statuses/streak-green.ts` — same tick, tier 2 (T0126's green-tier status file, named after its id per convention; if T0126 named it differently, add it to whatever file holds the green-tier status)
- The director (`src/content/directors/streak.ts`) and the coin/coinChip parts are NOT touched.

### Interfaces
No new types; everything uses existing ones. New exports: `sashPop: EffectDef` (id `'sash-pop'`), `sashChime(): void` in sfx.ts, `sashChime: MakeHudPart` in the HUD part.

### Steps
1. Create `src/content/effects/sash-pop.ts` exactly (copy `ring.ts`'s shape at a third of its size; `fx.value` is the tier, 1 gold / 2 green, default gold):
```ts
import { traceShape, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The sash pop: the streak sash arriving or turning green - a thin band with an ink rim and six
 *  small stars in the sash's color (gold, green at the green tier: fx.value 1 or 2) blooming out
 *  to radius 30 over 0.3 s where the streak is earned: the level-up ring at a third of its size. */
export const sashPop: EffectDef = {
  id: 'sash-pop',
  duration: 0.3,
  draw(g, fx) {
    const c = fx.value === 2 ? PALETTE.green : PALETTE.yellow;
    const r = 6 + fx.t * 24; // out to radius 30
    g.globalAlpha = 1 - fx.t;
    g.lineWidth = 3;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 2;
    g.strokeStyle = c;
    g.stroke();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + fx.t * 2;
      g.save();
      g.translate(fx.ax + Math.cos(a) * (r + 5), fx.ay + Math.sin(a) * (r + 5));
      g.beginPath();
      traceShape(g, 'star', 3, fx.t * 5);
      g.fillStyle = c;
      g.fill();
      g.lineWidth = 1.5;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
      g.restore();
    }
  },
};
```
Then the two registry lines in `src/content/effects/index.ts`.
2. In `src/audio/sfx.ts`: after the `let lastBloop = 0;` line add `let lastSash = 0; // performance.now() of the last sash chime`; after the `playChime()` function add:
```ts
/**
 * The sash chime: a bright two-note "ding-ding", E6 then A6, over 0.15 s at peak 0.06 - a step
 * higher and quieter than the level-up chime (E6, G6 at 0.12), so a streak never sounds like a
 * level-up. Called from the sashChime HUD part: your own sash only, at most one per 1.5 s.
 */
export function sashChime(): void {
  if (!ctx || !master) return;
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  if (now - lastSash < 1500) return; // one chime per 1.5 s for your sash
  lastSash = now;
  const t0 = ctx.currentTime;
  for (const [f, d, life] of [[1318.5, 0, 0.07], [1760, 0.07, 0.08]] as const) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t0 + d);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + d + life);
    o.connect(g);
    g.connect(master);
    o.start(t0 + d);
    o.stop(t0 + d + life + 0.02);
  }
}
```
3. Create `src/hud/sashChime.ts` exactly (sound only, no DOM; the chain is read from `me.kills`, which counts player knockouts only — never me.xp or me.coins, which also move on gems and on same-tier refreshes, and a refresh must stay silent):
```ts
import type { MakeHudPart } from '../../engine/api.ts';
import './sashChime.css';
import { sashChime as sashSound } from '../audio/sfx.ts';

/**
 * The sash chime: your own streak sash arriving (your second knockout in the chain) or turning
 * green (the third) plays the bright two-note chime - yours only, the way the plink is only for
 * your own pickups. Another player's sash is silent to you (its ring still blooms on the field).
 */
const SASH_WINDOW_MS = 15000; // the streak sash's 15 s timer (directors/streak.ts)

export const sashChime: MakeHudPart = () => {
  let lastKills: number | undefined;
  let chain = 0; // your knockouts in the current sash chain
  let lastKillAt = -1e9; // performance.now() of your last knockout
  return {
    update(view) {
      const me = view.me;
      if (!me) { lastKills = undefined; chain = 0; return; } // menu/connecting: forget
      if (lastKills === undefined) { lastKills = me.kills; return; } // first frame: no tick
      if (!me.alive) { chain = 0; lastKills = me.kills; return; } // knocked out: the chain breaks
      while (lastKills < me.kills) {
        lastKills += 1;
        const now = performance.now();
        chain = now - lastKillAt < SASH_WINDOW_MS ? chain + 1 : 1;
        lastKillAt = now;
        if (chain === 2 || chain === 3) sashSound(); // the sash appears, or turns green
      }
    },
  };
};
```
Create `src/hud/sashChime.css` with the single line `/* the sash chime is sound: no DOM, no styles */` (copy `coin.css`'s comment). Add the import and list line in `src/hud/index.ts`.
4. In `src/content/statuses/streak-gold.ts`, add this hook to the status def (it runs server-side every tick the sash is on the player; the mem gap is how it tells "first placed" from a mere 15 s refresh):
```ts
  tick(ctx, u) {
    const last = u.mem['sash-pop-gold'] ?? -99;
    if (ctx.time - last > 0.5) ctx.effect('sash-pop', { x: u.x, y: u.y }, undefined, 1); // the sash is first placed
    u.mem['sash-pop-gold'] = ctx.time;
  },
```
5. In `src/content/statuses/streak-green.ts`, add the same hook with key `'sash-pop-green'`, tier `2` and comment `// the sash turns green`.
6. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The two sash statuses tick in the same server pass (gold before green): they MUST use separate mem keys (`sash-pop-gold` / `sash-pop-green`). A shared key would let gold's every-tick write swallow green's first tick (gap < 0.5 s) and kill the tier-change pop.
- The 0.5 s gap threshold is deliberate: the tick runs every sim tick while the status is on the player, so any re-placement after expiry (>= 15 s) or a fresh status always sees a stale timestamp, while a same-tier refresh never does. Statuses are wiped on death (`p.statuses.length = 0`), so a respawn can't false-fire.
- `me.kills` is PVP-only (the engine increments it only when a player knocks a player out); monster kills give xp/score, not kills. Do not "improve" the trigger to use `me.xp`, `me.coins` or `me.score` — refreshes and gems would chime.
- No visible HUD element: the part adds no DOM, so no layout work and nothing appears on screen; the coin chip and coin tick keep reading the pay as before.
- The effect is one-shot and rare (a PVP chain of two within 15 s); no bandwidth or 60-player-budget concern. Never `Math.random`/`Date` in `src/content/` — the tick uses `ctx.time` only.
- Do not draw the sash itself (T0125/T0126 own its look) and do not edit `directors/streak.ts`.

### Tests
none — every content item is tested automatically by engine/tests (effect draw, status tick in a real match, registries), and the chime part is sound-only with no DOM.
