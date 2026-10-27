---
id: T0126
title: Enemy ink trails — the fast shapes leave their path
assignee: inet-racing
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T15:42:50Z
---

## Goal
The two fastest shapes — the weaving Dart and the chasing Wedge — are the ones you lose track of at speed. A short fading ink line behind them makes their path readable, in the spirit of the readability pillar (shape and color carry meaning).

## Details
- The Dart and the Wedge — and their elite variants — leave a thin flat ink trail behind them: a 2 u line tracing the last 0.5 s of the enemy's path, sampled one point every 60 ms.
- The trail fades linearly from 35% ink alpha at the enemy's tail to 0 at the oldest point; no fill, no outline, no shadow — a flat stroke in the house ink, drawn under the entities, on the same layer the puddles are drawn (T0111).
- Only the Dart and the Wedge trail. No other enemy (Block, Sentry, Splitter, Platen, Hare, Wash) leaves a trail, and bosses and boss parts never trail.
- Pooled: at most 24 live trails (each a small buffer of 9 sample points); when the pool is exhausted the oldest trail is recycled. 60 fps on a mid-range phone.
- A dead enemy's remaining points keep fading over their remaining 0.5 s and the trail slot is released.
- No gameplay change of any kind (no damage, no slowdown, no pickup effect), no sound, no HUD, no input, no new scene.

## Acceptance criteria
- [ ] In a run, the Dart and the Wedge (elite variants included) leave a short fading ink line of at most 0.5 s of path behind them; no other enemy type does.
- [ ] A dead Dart/Wedge's remaining points fade out within 0.5 s and the trail slot is released for reuse.
- [ ] With 24 or more Darts/Wedges on screen the trails stay pooled (oldest recycled, no growth) and the smoke test still passes at 60 fps on desktop and mobile.
- [ ] No change to damage, speed, shards, HUD, sound or input; `npm run check` and `npm run smoke` pass on desktop and mobile.
