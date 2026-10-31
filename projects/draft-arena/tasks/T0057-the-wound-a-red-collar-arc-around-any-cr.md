---
id: T0057
title: "The wound: a red collar arc around any critter below half hp"
assignee: cachyos-x8664
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T11:14:52Z
claimed_at: 2026-10-31T11:48:37Z
epic: E15
---

## Goal
A player can read a hurt critter at a glance — the state Frenzy's whole tree, Reap and every fight pay out on — with no number anywhere on screen.

## Details
- A new field area "wound": a new file in src/content/areas/, registered in its index. The closest examples are the crown and prestige-stars areas, which draw attached to a critter.
- It draws on every critter — player and monster alike — whose hp is below half of its max hp: a thin red arc with an ink rim, about 8 world units outside the critter's radius, hugging the body.
- The arc runs around the lower two thirds of the body's circle; the top third stays open over the head, so hats, the crown, the mark's ring and the prestige stars all read on top of it.
- The sweep shrinks with the hp: at exactly half max hp the arc is a full 240 degrees; it shrinks to nothing as the hp goes to zero (sweep = 240 x hp / half-max-hp). At or above half max hp it draws nothing.
- It follows the critter and tracks its hp live: a hit that drops a critter below half shows the full collar in the same frame, and healing it back over half hides it again.
- Red with an ink rim is the game's hurt language (the mark's ring, Reckless's red); the ink rim keeps it readable over warm monster bodies. Nothing new on the HUD — this lives on the field.
- It must stay readable with 60 players and the full monster field: one thin stroke, drawn only on critters below half, nothing else changes.

## Acceptance criteria
- [ ] A full-hp critter shows nothing new.
- [ ] A critter at exactly half max hp shows a 240-degree red collar with an ink rim, the top of its head clear.
- [ ] A critter at a quarter of max hp shows a 120-degree arc; at a trace of hp the arc is almost gone.
- [ ] The wound shows on monsters and on other players and follows them as they move.
- [ ] Healing a critter back above half hp makes its wound disappear.
- [ ] A hat, the crown, the mark's ring and the prestige stars all still read on a wounded critter.

## Design (architect, cachyos-x8664)

### Files
- create `src/content/areas/wound.ts` — the wound `AreaDef`: a thin red collar with an ink rim, `follow: true`, re-fired every tick by its director; the sweep comes in on `slots[0]`, the owner's radius on `slots[1]`
- create `src/content/directors/wound.ts` — the wound `DirectorDef` that re-fires the area every tick for every critter at/below half hp
- edit `src/content/areas/index.ts` — add `import { wound } from './wound.ts';` and one `wound` line in `AREAS` (after `mark,`, its hurt-language sibling)
- edit `src/content/directors/index.ts` — add `import { wound } from './wound.ts';` and one `wound` line in `DIRECTORS` (after `mark,`)

### Interfaces
`src/content/areas/wound.ts` (full file body; imports `type { AreaDef }` from `../../../engine/api.ts`, `PALETTE` from `../palette.ts`, `RULES` from `../rules.ts`):
```ts
export const wound: AreaDef = {
  id: 'wound',
  radius: 1,
  life: 0.15, // 3 ticks; the director re-fires it every tick, so the collar never disappears
  interval: 1, // > life: the pulse fires once at birth, never again
  follow: true, // stays centred on the wounded critter; ends when it is knocked out
  look: {
    shape: 'circle',
    color: PALETTE.red,
    draw(g, e) {
      const f = (e.slots[0] ?? 0) / 100; // 100 = exactly half max hp: a full 240°
      if (f <= 0) return; // full hp: nothing (healed: the last area expires)
      const r = (e.slots[1] ?? RULES.player.radius * 100) / 100 + 8; // 8 outside the body
      const a0 = Math.PI / 2 - (2 * Math.PI / 3) * f; // top edge; the top 120° stays open
      const a1 = Math.PI / 2 + (2 * Math.PI / 3) * f; // bottom edge
      g.beginPath(); g.arc(0, 0, r, a0, a1);
      g.lineWidth = 6; g.strokeStyle = PALETTE.ink; g.stroke(); // ink rim, like mark.ts
      g.beginPath(); g.arc(0, 0, r, a0, a1);
      g.lineWidth = 3; g.strokeStyle = PALETTE.red; g.stroke();
    },
  },
  pulse(_ctx, a) {
    a.slots[0] = Math.min(100, Math.max(0, Math.round((2 * a.owner.hp / a.owner.maxHp) * 100)));
    a.slots[1] = Math.round(a.owner.radius * 100); // the collar hugs the owner's body
  },
};
```
`src/content/directors/wound.ts` (full file body; imports `type { DirectorDef }` from `../../../engine/api.ts`):
```ts
export const wound: DirectorDef = {
  id: 'wound',
  name: 'The wound',
  description: 'A red collar shows on any critter under half hp.',
  tick(ctx) {
    // The whole 4000 x 4000 field from its centre: one call reaches every critter
    for (const u of ctx.unitsNear(2000, 2000, 4000)) {
      if (u.hp * 2 <= u.maxHp) ctx.area(u, 'wound');
    }
  },
};
```
### Steps
1. Create `src/content/areas/wound.ts` exactly as above.
2. Create `src/content/directors/wound.ts` exactly as above.
3. Add the two import lines and the two registry lines (`wound` after `mark` in both `index.ts` files).
4. `npm run check`.
### Pitfalls
- `e.radius` is the *area's* radius (1), not the critter's — the owner's radius must come from `slots[1]` set in the pulse, or the collar hugs a 1-unit body.
- The slots are on the *area*, never on `a.owner` (the critter's own slots are 4 numbers for its looks).
- Canvas angles: 0 = right, π/2 = down; the open 120° gap centres on top (−π/2), so hats, the crown and the prestige stars always read on top; at f=1 the sweep is −π/6..7π/6 (240°), shrinking symmetrically toward the bottom as f→0.
- `f=0` must `return` before drawing — a dying critter's area ends on knockout anyway.
- `life: 0.15` plus the every-tick re-fire is the crown/mark pattern: a longer life keeps a stale collar on a healed critter; skipping the re-fire makes it flicker. The pulse at birth is what makes the hp live (one server tick behind the hit).
- The director's `<=` is deliberate: exactly half must show the full 240°; strictly above half, no area is fired and the last one expires within 0.15 s.
- No effect, no one-shot, no module state: one thin stroke per critter, and only critters at/below half ever get an area — bounded at 60 players.
### Tests
none
