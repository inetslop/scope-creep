---
id: T0129
title: The Gallery — three studies with fixed seeds
assignee: asus
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T17:13:57Z
claimed_at: 2026-10-27T17:20:42Z
designer: desktop
---

## Goal
The menu gains three curated fixed-seed studies — Study in Red, No Level-Ups, Double Shards — each a full run under one stated rule with its own fixed seed and its own persisted best. The player gets something to compare runs against and a way to replay the page under a constraint, without a normal run changing in any way.

## Details
- The menu, below the start button (and the Redactor toggle once T0124 lands), shows three study cards in the Bauhaus style — flat card, 2 u ink frame, the study name in small caps, and a small persisted-best line under it: "BEST 12,340" or a faint "UNPLAYED" while empty. Layout: 412×915 — the three cards stack as a column, each ~64 u tall, with the start button above them; 1280×720 — the three cards sit in a row, each ~180×64 u. A card is activated the same way the start button is (pointer/touch) — no new key, nothing new for the pause-screen controls card to list.
- The three studies. A study run differs from a normal run only in the stated rule; the boss rotation, the hazards (Crop T0045, Gutter T0099, Tide T0127 once it lands), elites, the Underdrawing (T0100), marginalia, the Inkwell and the score all work as in a normal run:
  1. **Study in Red** — the spawn director only ever picks red and orange silhouettes: Wedge, Sentry, Splitter. Splinter and The Frame's wedge minion follow their parents as they always do. Elites are those silhouettes only. Bosses are unchanged.
  2. **No Level-Ups** — the level bar is not drawn, no card ever appears, and shards grant no XP. Kills are worth 2× score and the kill feed (T0106) reads +2 / +10 / +100. A pending Warm Start (T0114) is neither applied nor consumed — it stays armed for the next normal run.
  3. **Double Shards** — every shard is worth 2× XP. The study multiplier applies before the Gilt ×3 (T0112) — a gilt shard in this study is worth 6× base — and before any Redactor halving (T0124), which still applies last.
- Each study uses one fixed seed: three different small positive integers, stored as named constants. A study run is identical every time, enemy placement and shard drops included — with the same studio state (a Warm Start armed or not), since the Warm Start pick draws with the seeded run RNG (T0114).
- At a study run's start, a small-caps note prints the study's name for 2 s in the nameplate idiom (T0064): "STUDY IN RED" / "NO LEVEL-UPS" / "DOUBLE SHARDS".
- Persistence: each study keeps its own best score under its own key (the bestScore pattern, `src/core/bestScore.ts`), separate from the normal-run best and from the other studies. The game-over screen shows the study's best under the score in a study; the verdict stamp (T0128) still works on survival time.

## Acceptance criteria
- [ ] The menu shows the three study cards (name + best or "UNPLAYED") in the Bauhaus style at 412×915 (a column) and 1280×720 (a row); activating a card starts that study; the plain start button still starts a normal run; no new key or input of any kind.
- [ ] Two runs of the same study with the same studio state are identical in enemy placement, elites and shard drops (fixed seed), and the three studies use different seeds from each other.
- [ ] Study in Red: only Wedge, Sentry and Splitter (plus Splinter and the Frame's wedge minion) ever spawn; elites are those silhouettes; bosses, hazards and the score are otherwise unchanged.
- [ ] No Level-Ups: the level bar is absent, no card ever appears, shards grant no XP, the kill feed reads +2/+10/+100, and a run that started with an armed Warm Start ends with it still armed.
- [ ] Double Shards: a normal shard is worth 2× XP and a gilt shard 6×, so level-ups come roughly twice as fast as in a normal run on the same seed.
- [ ] Each study's best persists separately (from the normal-run best and from the other studies') across sessions, and the game-over screen shows the correct best for the mode just played.
- [ ] A normal run is untouched: spawn order, economy, level-ups, hazards and the normal-run best are identical to before this change.
