---
id: T0035
title: "Chef Hat: a 300-coin head accessory, the top of the shop"
assignee: desktop-4070
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T06:50:30Z
claimed_at: 2026-10-31T07:42:54Z
epic: E6
---

## Goal
The shop's first long goal: a hat that takes many matches to save up for, so the coins a player earns across lives are worth playing for (the "prices span" bar in planning/modules/shop.md: cheap things, middle ones, and goals that take many matches).

## Details
- New accessory file `src/content/accessories/chef-hat.ts`, registered in `src/content/accessories/index.ts`. Closest example: `src/content/accessories/round-glasses.ts` (T0021).
- Name: "Chef Hat". Slot: head. Price: 300 coins. No prestige requirement. Description: "A tall white puff on the head."
- Look: a tall white puff — three stacked bumps, each with an ink outline, reaching about 16 units above the top of the head (at most one radius of the player's head, leaving room for the name) — with a thin ink band at its base. It sits straight on the head, bobs a little with the critter, and never covers the eyes. White like the HUD's sticker cards, ink outlines, no glow, no themed dressing.
- It changes nothing in play: no stats, no size change; bots wear it at random like every other accessory.
- The two starter hats from T0017 (in progress) are the only other head items: at design time check them in `src/content/accessories/` and keep the puff clearly distinct from both — a light, cloud-shaped silhouette against two simple hats. If either starter hat is itself a light puffy hat, flag this task instead of building a copy.
- Priced against what a match earns: 1 coin per monster kill and the victim's level per knockout (T0019), plus 1 coin per event gem (T0027), give a 5-minute match of a new player roughly 30–60 coins and a good player 60–100. 300 is about 3–6 matches. Against the rest of the stock (patterns 30, Round Glasses 80, Candy Pack 100) it is 3x the current top and the first item that needs saving.

## Compared with what exists

The head slot is empty in the game today; the only head items are the two starter hats T0017 is building.

| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| the two starter hats from T0017 (in src/content/accessories/) | a simple silhouette on the head | a tall white puff: three stacked ink-outlined bumps about 16 units above the head with an ink band at the base — a light cloud silhouette, distinct in shape and color from both starter hats (verify against them at design time) |

## Acceptance criteria
- [ ] The accessories registry includes a "Chef Hat": head slot, 300 coins, description "A tall white puff on the head."
- [ ] On the critter (preview and in the match) it draws as a tall white puff of three bumps with an ink band at the base, about 16 units above the head, bobbing a little and never covering the eyes.
- [ ] It can be bought, worn and taken off like Round Glasses, and shows on bots at random.
- [ ] It changes nothing in play: no stats, no size, and the player's name still sits above it.

## Design (architect, yoga)

### Files
- create `src/content/accessories/chef-hat.ts` — the accessory, exporting `chefHat`
- edit `src/content/accessories/index.ts` — one import line + one list line

### Interfaces
No new types. Exact content of `chef-hat.ts` (closest example: `round-glasses.ts`):
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const chefHat: AccessoryDef = {
  id: 'chef-hat',
  name: 'Chef Hat',
  description: 'A tall white puff on the head.',
  slot: 'head',
  price: 300,
  draw(g, w) {
    const r = w.radius;
    const bob = Math.min(1, w.speed / 200) * Math.sin(w.time * 6 + w.seed) * 0.08 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.fillStyle = PALETTE.white;
    g.strokeStyle = w.ink;
    for (const [x, y, br] of [[0, -1.42, 0.46], [-0.3, -1.5, 0.36], [0.26, -1.52, 0.32]]) {
      g.beginPath();
      g.arc(x * r, (y + bob) * r, br * r, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
    g.fillStyle = w.ink;
    g.beginPath();
    g.ellipse(0, (-1.08 + bob) * r, 0.56 * r, 0.1 * r, 0, Math.PI * 2);
    g.fill();
  },
};
```
In `index.ts`: `import { chefHat } from './chef-hat.ts';` between the candy-pack and round-glasses imports; `chefHat,` in the list between `candyPack` and `roundGlasses`.

### Steps
1. Create `chef-hat.ts` exactly as above. Numbers (r = `w.radius`, 18 for a player): three white bumps, each filled `PALETTE.white` then ink-stroked — big centre `y=-1.42` r`0.46`, left `x=-0.3, y=-1.5` r`0.36`, right `x=0.26, y=-1.52` r`0.32` — highest tip at `-1.88r` = 16 units above the top of the head (`-r`); thin solid-ink band ellipse at `y=-1.08`, rx `0.56r` ry `0.1r`. Draw bumps in list order, band last so it sits at the base.
2. Add the one import and one list line in `index.ts` as above.

### Pitfalls
- `draw` runs on every client every frame: only `w.*` values, no state, no `Math.random`. The bob uses `w.time`, `w.speed`, `w.seed` only (candy-pack pattern).
- Never covers eyes (eyes are a little above the middle; lowest drawn point is `-0.98r+bob`) and never passes one radius above the head even with max bob (`-1.96r < 2r`); the engine itself moves the name up when a head item is worn.
- Don't touch `rules.ts`, shop or menu files — buying/wearing/bots all key off the registry; don't import from T0017's hats.
- Guard: if T0017 has landed and either `cone.ts`/`beanie.ts` draws a light puffy cloud like this one, stop and flag — the task rejects a copy, and the task's table describes both as simple silhouettes.
- `name` must be ≤ 18 chars ("Chef Hat" is 8); no `prestige` field (price-gated only).

### Tests
none (content items are tested automatically by engine/tests/).
