---
id: T0137
title: "The mine's voice: a tick when your mine arms, a low boom when a mine pops"
size: S
priority: 2
status: designing
depends_on: [T0135]
attempts: 0
created: 2026-10-31T23:01:32Z
claimed_at: 2026-10-31T23:29:59Z
epic: E31
designer: desktop
---

## Goal
A Miner's life is silent right now: the trail arms and pops with no sound. Give the trap a voice — your own fuse ticks when it arms, and every pop thumps low, yours or a neighbor's — so a player hears their trail come alive, and hears a trap go off before the ring reaches them.

## Details
Two new sounds in game/src/audio/sfx.ts, next to the bloop and the plink (the closest examples):
- The arm tick: when a mine you laid finishes arming (0.5 s after it lands) — one short high tick, 880 Hz to 660 Hz over 0.08 s, peak 0.06, sine. Yours only: you never hear another player's mines arm.
- The pop boom: when any mine detonates (yours or another player's) — one low boom, 130 Hz to 45 Hz over 0.3 s, peak 0.14. Every client that sees the pop hears it; if two mines pop within 150 ms, one boom plays and the next waits for the throttle.
- Both follow the existing sfx gating: the first-gesture unlock, the match-on-screen check, the 150 ms per-sound throttle and the 6-voice cap.
- Hooks: the arm tick where the mine arms, the boom where the mine detonates (both in the mine area's content from T0135).

## Acceptance criteria
- [ ] A mine you lay ticks once, softly, 0.5 s after it lands; another player's mines arm silently.
- [ ] A mine's pop (yours or a neighbor's) thumps low on every client that sees it; two mines popping within 150 ms make one boom, not a squashed two.
- [ ] Neither sound plays before the first gesture or while the match is off screen.
- [ ] `npm run check` and `npm run smoke` pass.
