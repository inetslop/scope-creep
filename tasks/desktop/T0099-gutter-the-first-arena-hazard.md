---
id: T0099
title: Gutter — the first arena hazard
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T09:43:38Z
---

## Goal
The first arena hazard: after 14:00 an ink band periodically sweeps across the page, so the late game becomes a moving layout, not just a growing swarm. The concrete first of the arena-hazards family in the roadmap's "Later" list.

## Details
- From 14:00 (840 s) on, every 20 s a 40-unit-wide vertical band of flat ink sweeps horizontally across the page — a strip running the full height of the safe area, moving left or right. The first sweep starts at exactly 840 s. Direction alternates: sweep 1 left → right, sweep 2 right → left, and so on.
- The band's path is the crop-safe rect (T0045): it enters just off one safe edge, exits just off the other, and is clipped to the safe area (it never overlaps the crop margin — the margin is already burning). Its center crosses the safe width in exactly 4.0 s (speed = safe width / 4).
- Telegraph: 1.5 s before the band enters, a thin red rule (2 u) runs the full height of the safe area at the entering edge, opacity pulsing 0 → 0.6 → 0 over 1 s, repeating — the same pulse language as the boss approach (T0070). Red stays reserved for things that hurt.
- Damage: standing in the band burns the player for 4 damage per second (the same continuous-damage plumbing as the crop margin burn). The band does not damage, slow or move enemies, and it does not touch shards, bullets or knockback.
- Look: a flat ink band (the same ink as the enemy outlines), alpha 0.85, sharp edges, the hard paper-cut shadow on its leading edge.
- Teaching: the first sweep in a run shows a small ink marginalia note near the top of the page, "THE PAGE INKS", for 2 s alongside the telegraph (reuse the existing marginalia API additively). No new HUD element, no new key, no new SFX.
- Pure schedule module (pattern: `src/core/crop.ts`): given run time, whether a sweep is active, its X position (as a fraction of the safe width), its direction, and the telegraph window (the 1.5 s before entry); unit-tested in a new test file (pattern: `tests/core/crop.test.ts`): nothing (no sweep, no telegraph) before 838.5 s; sweep active at 840 s; next entries at 860 s and 880 s; direction alternates; the telegraph window is exactly [entry − 1.5, entry).
- Pause: the sweep freezes with the game (dt-driven, like the crop and the boss approach) and resumes without a jump.

## Acceptance criteria
- [ ] Nothing new happens before 838.5 s; at 838.5 s the red rule appears at one safe edge, and at 840 s the ink band enters and sweeps the safe area, taking 4.0 s to cross.
- [ ] Sweeps repeat every 20 s with alternating direction; with the crop active (after 12:00) the band is clipped to the crop-safe rect and burns the player 4 damage/s while inside.
- [ ] Enemies pass through the band unaffected; the band does not touch shards, bullets or knockback.
- [ ] The first sweep in a run shows the marginalia "THE PAGE INKS" for 2 s.
- [ ] Pausing freezes the band mid-sweep; resuming continues it with no jump.
- [ ] The new schedule unit tests pass: nothing before 838.5 s, first entry at 840 s, 20 s period, alternating direction, telegraph window exactly [entry − 1.5, entry).
- [ ] `npm run check` and `npm run smoke` pass.
