---
id: T0061
title: "Prestige banks a point: each prestige this life banks +1 talent point"
assignee: desktop-4070
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T11:40:36Z
claimed_at: 2026-10-31T11:47:33Z
epic: E17
---

## Goal
Prestiging should pay in the draft currency itself, not only in coins: each prestige this life banks +1 talent point, so the level-1 start after a prestige is not a dead minute — the player already holds a point to spend the moment they calm down.

## Details
- A new director (a new file in src/content/directors/, closest example: prestige-coins, which pays coins on the same hook): on `onPrestige`, bank +1 talent point for the player who prestiges. Flat +1 per prestige this life, no scaling.
- Humans only: a bot that prestiges gets no point and its build does not change (precedent: kill coins, "bots earn nothing").
- The banked point lands in the player's existing bank of talent points: the Talents button pulses exactly as it does when a level-up banks a point, and the panel spends it on any talent whose needs are met, in any tree.
- The 2-second prestige card (top centre under the xp bar, currently the coins the last prestige paid) gains a second line while it shows: "+1 talent point". No new card, no new screen space.
- The point lasts the rest of this life: it survives the level-18 reset back to level 1, and is lost on a knockout like every other banked point.

## Acceptance criteria
- [ ] A human player who prestiges at level 18 sees the 2-second card with both lines: the coins (25 × N) and "+1 talent point".
- [ ] At the moment of the prestige the Talents button pulses as with a banked point, and the panel shows the extra point spendable on any available talent.
- [ ] The second prestige this life banks another point (2 points total after two prestiges).
- [ ] A bot that prestiges changes nothing in its build.
- [ ] Right after the level-18 reset the point is still banked and spendable; a knockout before it is spent loses it, like other banked points.

## Design (architect, desktop-4070)

### Files
- create `src/content/directors/prestige-points.ts` - director: on each prestige, a human player banks +1 talent point (`ctx.givePoints(player, 1)`); bots get none
- edit `src/content/directors/index.ts` - one import line and one registry line for the new director
- edit `src/hud/prestige.ts` - the 2-second prestige card gains a second, always-present line "+1 talent point" (no new element, no new position)
- edit `src/hud/prestige.css` - one line so the two lines sit nicely in the card

### Interfaces
No new types. Only engine API used: `ctx.givePoints(player, amount)` (api.ts:286, "Talent points, banked like the one a level gives" — it lands in `pendingPicks`, which is what makes the Talents button glow; knockout clears it exactly like other banked points, and the level-18 reset does not touch it — all engine behavior, nothing to build).

### Steps
1. Create `src/content/directors/prestige-points.ts` with exactly:
```ts
import type { DirectorDef } from '../../../engine/api.ts';

/** Each prestige this life banks +1 talent point, so the level-1 start is not an empty minute. Bots get none. */
export const prestigePoints: DirectorDef = {
  id: 'prestige-points',
  name: 'Prestige point',
  description: 'Each prestige this life banks 1 talent point to spend at once.',
  onPrestige(ctx, _mem, player) {
    if (!player.bot) ctx.givePoints(player, 1);
  },
};
```
No `tick`, no `mem`: fire the point in `onPrestige` itself (flat +1, no scaling by `count`).
2. Edit `src/content/directors/index.ts`: add `import { prestigePoints } from './prestige-points.ts';` as a new line after the `killCoins` import (line 12), and `prestigePoints,` as a new array line after `prestigeCoins,` (line 24).
3. Rewrite `src/hud/prestige.ts`: same card, same 2 s show/retrigger logic, but the card now holds two lines. Full new file:
```ts
import type { MakeHudPart } from '../../engine/api.ts';
import './prestige.css';

const PAY = 25; // same as the prestige-coins director
const SHOW = 2000; // ms

/** Top centre under the xp bar: what your last prestige paid — coins and a talent point. Shows for 2 s, then hides. */
export const prestige: MakeHudPart = (root) => {
  const el = document.createElement('div');
  el.className = 'hud-card hud-prestige';
  el.hidden = true;
  const coins = document.createElement('div');
  const points = document.createElement('div');
  points.textContent = '+1 talent point';
  el.append(coins, points);
  root.append(el);
  let last: number | undefined; // your prestiges this life, as last seen
  let anim: Animation | null = null;
  return {
    update(view) {
      const me = view.me;
      if (!me) {
        if (last !== undefined) {
          last = undefined;
          anim?.cancel();
          anim = null;
          el.hidden = true;
        }
        return;
      }
      if (last !== undefined && me.prestige > last) { // a knockout drops it to 0: not a show
        const n = me.prestige;
        el.hidden = false;
        coins.textContent = n === 1 ? `Prestige! +${PAY} coins` : `Prestige ${n}! +${PAY * n} coins`;
        anim?.cancel(); // a prestige within 2 s restarts the timer
        anim = el.animate(
          [
            { opacity: 1, visibility: 'visible' },
            { opacity: 1, visibility: 'visible', offset: 0.75 },
            { opacity: 0, visibility: 'hidden' },
          ],
          { duration: SHOW, fill: 'forwards' },
        );
        anim.onfinish = () => {
          el.hidden = true;
          anim = null;
        };
      }
      last = me.prestige;
    },
  };
};
```
4. Edit `src/hud/prestige.css`: add `line-height: 1.3;` inside the existing `.hud-prestige` rule (after `font-weight: 700;`). Nothing else; position, padding and the phone media query stay as they are.

### Pitfalls
- `ctx.giveCoins` skips bots in the engine, but `givePoints` does not — the bot check is on you; it is the `player.bot` boolean (see `gem-rush.ts:61`). Missing it fails the "bot changes nothing" criterion.
- Do not copy `prestige-coins`' one-tick-later `tick` + pickup trick: points bank instantly via `givePoints`; that is what makes them survive the reset and die on a knockout like every banked point. No `mem`, no `tick`.
- The Talents button pulse is automatic (`pendingPicks` → `talentTree.ts` re-renders when the point count changes). Never edit `src/hud/talentTree.ts` or `xpBar`.
- Keep the second line static text — only humans ever see the card, and a human always got the +1, so it never needs recomputing.
- Card fullest state: line 1 longest is "Prestige 9! +225 coins", line 2 "+1 talent point", both 15 px `nowrap`, centered; on 412x915 the card sits at `top: 182px` mid-x, clear of the scoreboard (right) and xp bar (top) as it does today — adding one line grows it downward only.

### Tests
none (engine/tests/ already runs every director's `onPrestige` in a match; persistence/reset/knockout behavior is the engine's own `givePoints`, which sim.test.ts covers).
