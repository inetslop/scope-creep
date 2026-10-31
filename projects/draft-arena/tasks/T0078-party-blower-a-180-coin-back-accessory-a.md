---
id: T0078
title: "Party Blower: a 180-coin back accessory, a red blower rolled on a stick"
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T13:15:23Z
---

## Goal
The shop's thinnest shelf (the back, 3 items) gets a mid-price step: a Party Blower between the 120-coin Balloon and the 400-coin Medal.

## Details
- name "Party Blower" (12 characters), slot `back`, price 180 coins, no prestige.
- description: "A red party blower, rolled up on a stick, on the back."
- How it looks: a rolled party blower — a red spiral (a rolled paper horn) with a small white tip, on a thin stick, on the back, pointing up and to one side, with a small sway, gentler than the Balloon's bob. An ink outline around the spiral and the stick; red and white from the palette, no glow.
- It reads in a crowd: a round spiral head on a stick at the back — no other back item has a round head with a point.

## Compared with what exists
| Existing | What it shares | How the new one looks different (not a recolor) |
| --- | --- | --- |
| Candy Pack | a small item on the back | a flat green box held against the back; the Blower is a red spiral on a stick that stands up and to one side |
| Balloon | a round thing bobbing on the back | a smooth yellow ball on a string that bobs; the Blower is a rolled spiral with a white tip on a rigid stick that sways, not bobs |
| Medal | a round yellow thing with a ribbon | a flat yellow disc with a red ribbon under the body; the Blower is a red spiral on a stick above the back, no ribbon |

## Acceptance criteria
- [ ] The shop sells the Party Blower for 180 coins in the back row, and the preview critter wears it when it is pointed at.
- [ ] A bought blower shows on its wearer's back for everyone in the match: a red spiral with a white tip on a thin stick, ink outlines, a small sway; at a glance in a crowd it is apart from the Balloon, the Candy Pack and the Medal.
- [ ] Bots that wear random back items can wear it; it never covers the eyes or the face, and it changes nothing in play (same speed, size and hitbox).

## Design (architect, desktop)

### Files
- create `src/content/accessories/party-blower.ts` — the Party Blower accessory (`id: 'party-blower'`), a red spiral horn with a white tip on a thin stick at the back.
- edit `src/content/accessories/index.ts` — one import and one registry line for `partyBlower`, next to `balloon`.

### Interfaces
None new. Uses the existing `AccessoryDef` and `WearView` exactly like `balloon.ts`.

### Steps
1. Create `src/content/accessories/party-blower.ts`. Copy the structure of `src/content/accessories/balloon.ts` (imports, export const, `draw(g, w)`). Use this exact body:

```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

export const partyBlower: AccessoryDef = {
  id: 'party-blower',
  name: 'Party Blower',
  description: 'A red party blower, rolled up on a stick, on the back.',
  slot: 'back',
  price: 180,
  draw(g, w) {
    const r = w.radius;
    // gentler than the Balloon's bob: smaller amplitude, slower
    const sway = Math.min(1, w.speed / 200) * Math.sin(w.time * 5 + w.seed) * 0.08 * r;
    g.lineWidth = Math.max(1.5, r * 0.08);
    g.strokeStyle = w.ink;
    // stick: base on the back, rising up and to the right
    const bx = 0.5 * r, by = 1.25 * r;
    const tx = bx + 0.55 * r + sway, ty = by - 0.95 * r;
    g.beginPath();
    g.moveTo(bx, by);
    g.lineTo(tx, ty);
    g.stroke();
    // red spiral head (the rolled horn)
    g.fillStyle = PALETTE.red;
    g.beginPath();
    g.arc(tx, ty, 0.35 * r, 0, Math.PI * 2);
    g.fill();
    g.stroke();
    // inner roll line so it reads as a rolled horn
    g.beginPath();
    g.arc(tx, ty, 0.18 * r, 0, Math.PI * 1.5);
    g.stroke();
    // white tip: a small point at the far end of the horn
    g.fillStyle = PALETTE.white;
    g.beginPath();
    g.moveTo(tx + 0.28 * r, ty - 0.06 * r);
    g.lineTo(tx + 0.44 * r, ty - 0.2 * r);
    g.lineTo(tx + 0.36 * r, ty - 0.34 * r);
    g.closePath();
    g.fill();
    g.stroke();
  },
};
```

2. In `src/content/accessories/index.ts`, add `import { partyBlower } from './party-blower.ts';` right after the `balloon` import, and add `partyBlower,` on the line right after `balloon,` in `ACCESSORIES`.

### Pitfalls
- Keep every point within two radii of centre: the farthest reach is the white tip at `tx+0.44r ≈ 1.49r, ty-0.2r ≈ 0.1r` — well inside. Do not push the stick higher.
- Keep `w.seed` and `w.time` in the sway so it varies per player and animates; do not use `Math.random` (client draw hook, and lint forbids it in content).
- Draw the stick first, then the horn (fill+stroke), then the inner roll line, then the tip — one shared ink style, no crossing outlines.
- The tip is a small white triangle (a point), so it stays distinct from the Balloon (smooth ball, bobs) and Medal (flat disc + ribbon, flat) — not a recolor.
- This changes only cosmetics; it touches no stats, size or hitbox, so nothing in play changes.

### Tests
none
