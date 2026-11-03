---
id: T0469
title: "The towers' marks: the first augment's mark on every barrel"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T03:56:29Z
epic: E26
---

## Goal
The Patterns toggle (T0465) made the enemy tokens read by shape; this slice gives the towers the same: with the toggle on, every tower's barrel wears one small muted-ink mark shaped by its first augment, so a build reads by shape alone.

## Details
- The same toggle, the same flag: the pause's Patterns row (T0465) and its profile flag drive this slice — no new UI, no new profile field, the row's label untouched.
- With the toggle on, every tower token wears exactly one small muted-ink mark on the barrel's face: the same single muted ink as the enemy marks (the color the wave card's "held · N" chip uses), roughly a quarter of the barrel face's width (the enemy marks' own scale), centered on the barrel's face — never on the plinth, whose front edge is the tier pips' (T0010).
- The 16 first augments wear 16 distinct marks: extend the enemy vocabulary (T0465's ten shapes — bar, dot, chevron, X, two bars, triangle, square, diamond, ring, arc) with six more from the same one-color family (the architect's pick: cross, crescent, two dots, zigzag, hollow square, bar-and-dot or similar). No two first augments share a mark, and no mark copies its own barrel's silhouette (T0465's Ward rule: a ring on a circle reads as a target, not a mark).
- The mark is the first augment's only: buying slots or adding augments never changes it. It must not fight what already sits on the token — the tier pips (plinth), the Feast ring and the Haste working-aura ring (T0235, T0354 — both at the base): the mark owns the barrel's face, the rings keep the base.
- Keyed per augment id, the way T0465's enemy registry is, so a future registration (Herd, Chill) adds its own entry without renumbering the rest.
- A separate per-tower image driven by the registry flag every frame — T0465's exact pattern: the texture id beside `markTexture` in `src/art/textures.ts`, the painter beside `paintTypeMark` in `src/art/entities.ts` (or a new mark module if that reads cleaner), the per-token image the way `src/entities/Enemy.ts` keeps its (the token code for towers is `src/entities/Tower.ts`, the barrel art in `src/art/barrels.ts`).
- With the toggle off everything renders byte-identical to today: no mark anywhere, no new texture in use, the menu demo included.
- Out of scope for this slice: the bosses, the Shard and the Splinter, and the codex and enemies references keep their plain tokens — the next slice matches them.

## Acceptance criteria
- [ ] With the Patterns toggle on, every tower on the board wears exactly one small muted-ink mark on its barrel's face; the shape is its first augment's, the 16 first augments wear 16 distinct marks in one color, no two sharing, no mark copying its own barrel's silhouette.
- [ ] A tower's mark never changes as slots are bought or augments added (first augment's only), and the tier pips, the barrel's shape and color, and a Feast or Haste tower's base ring all still read with the mark on.
- [ ] With the toggle off the board, the menu demo, the codex and the references render exactly as before: no mark, no new texture drawn.
- [ ] The mark reads at the default zoom on all 16 barrel colors at the token scale, on 412x915 and 1280x720, and stays on the barrel through the placement drop-in and the fire kick.
- [ ] A unit test pins the tower marks' registry: one entry per first augment, 16 entries, all shapes distinct.
- [ ] No new HUD element, input, profile field or sound; the pause's Patterns row is unchanged from T0465.
