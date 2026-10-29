---
id: T0135
title: "Spray gets its own look, not Beam's"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T09:34:10Z
claimed_at: 2026-10-29T09:44:06Z
finished_at: 2026-10-29T09:58:48Z
epic: E4
---

## Goal
Spray (`content/augments/spray.ts`) and Beam (`content/augments/beam.ts`) both use `look: { shape: 'chevron', color: 'green' }`. Their draft cards, hand icons and tower bodies are therefore the same green chevron, and a player can't tell them apart at a glance. Give Spray a shape and colour of its own.

## Details
- New look: `{ shape: 'diamond', color: 'yellow', size: 0.24 }`. No live augment uses this pair: diamond appears only on Frost (ice), and yellow only on Rapid (triangle). The in-flight augments don't use it either: Pulse T0089 is a red chevron, Trap T0062 a red circle, Chain T0025 a red circle. If a task that lands first takes diamond+yellow, choose the next free pair and say so in the result.
- Beam keeps its green chevron. Only Spray changes.
- Everything that reads the look follows automatically: the draft card glyph, the hand, the tower body colour, the barrel tint and the projectile tint. Check that nothing hard-codes Spray's green (`grep -rn "green" src` near the Spray and needle and pellet code). Spray's barrel shape, the flat wide head with one tick per copy, stays as it is.
- Add a guard test in tests/content.test.ts: no two augments in `AUGMENTS` share the same `shape` + `color` pair. Exception: the existing pink squares (Anchor, Mark, Mint) share one on purpose as the support family, so allow-list exactly those three. This stops the problem recurring with the next augment.
- Independent of T0134 (the shotgun rework). Both edit `spray.ts`, but this task changes only the `look` line.

## Acceptance criteria
- [ ] Spray's card, hand icon and tower are a yellow diamond. Beam is still a green chevron. In a draft the two are told apart at a glance.
- [ ] Spray's shots or pellets and its barrel use the new yellow tint. No leftover green.
- [ ] The new content test fails if two augments share a shape+colour pair, except the allow-listed pink-square supports.
- [ ] `npm run check` passes. Desktop 1280x720 and mobile 412x915 smoke pass.

## Result (attempt 1, yoga)

- **Look change**: `spray.ts` look is now `{ shape: 'diamond', color: 'yellow', size: 0.24 }`; `beam.ts` untouched (still green chevron). The draft card glyph, hand icon, tower body, barrel tint and projectile/needle tint all read `look` automatically (`towerColor()` → `look.color`, `lightOf()` for the needles; `diamond` is a supported shape in `art/shapes.ts`/`icons.ts`, `yellow` is in `PALETTE`).
- **No leftover green**: grep of `green` across `src` shows only the palette definition, the Beam/Reach look lines, and unrelated green UI (clean-wave chip, lives flash, clean/reward text) — nothing in the Spray/needle/pellet path.
- **Guard test**: I temporarily restored the old chevron+green look to confirm the new test fails on a duplicate (`expected 'chevron green' to be 'square pink'`), then re-applied the fix. It now passes, allowing only the Anchor/Mark/Mint pink squares.

SUMMARY: Gave Spray its own look so it no longer collides with Beam: `look` in `src/content/augments/spray.ts` is now a yellow diamond (size 0.24), while Beam keeps its green chevron. Because the draft card, hand icon, tower body, barrel tint and projectile/needle tint all derive from `look`, everything recolours to yellow automatically with no hard-coded green left behind (verified by grep). Added a guard test to `tests/content.test.ts` that fails if two augments share a shape+color pair, with the Anchor/Mark/Mint pink squares allow-listed as the support family; I confirmed it fails on the old duplicate. …

- Self-review: APPROVE
- Time: 14.7 min

```
projects/chokepoint/game/src/content/augments/spray.ts |  2 +-
 projects/chokepoint/game/tests/content.test.ts         | 16 ++++++++++++++++
 2 files changed, 17 insertions(+), 1 deletion(-)
```
