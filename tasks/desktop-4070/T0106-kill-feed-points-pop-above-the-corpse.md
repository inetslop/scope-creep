---
id: T0106
title: Kill feed — points pop above the corpse
assignee: desktop-4070
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T11:41:58Z
claimed_at: 2026-10-27T12:04:51Z
designer: desktop
---

## Goal
The score (T0054) now has a number to show: the moment any kill lands, a small ink "+1", "+5" or "+50" pops above the corpse, matching the points the HUD score just gained — so a first-time player sees, kill by kill, exactly why the number is climbing.

## Details
- Purely additive to T0054: at the same instant a kill is registered (the shared kill path that already calls `addScore()`), spawn a small ink text above the killed enemy's center, clear of its outline.
- Closest example: the floating damage numbers (T0004) — same pooled, rising, fading ink text. This feed shows the *score value* of the kill instead of the *hit value*; hits keep showing their own damage numbers, the feed only appears on kills.
- Values match `SCORE_POINTS` exactly — read the same constant from `config.ts`, never retype the numbers:
  - normal (non-elite) kill: "+1", small ink text in the damage-number style
  - elite kill: "+5", same style but visibly larger and bolder
  - boss kill: "+50", the largest of the three, plus a small expanding ink ring at the corpse — reuse the existing crit-ring look from T0019
- Motion: rise ~24 world units over ~0.6 s and fade to gone, same rhythm as the damage numbers. No new SFX, no new art, no new HUD element; the HUD `SCORE` readout and the game-over lines are untouched.
- Pool the texts with a cap of about 32; when a swarm kill exhausts the pool, recycle the oldest text — never an error, never a dropped frame.
- No score values, XP, shard drops or kill-streak behavior change. Elite and boss kills keep working exactly as they do today.

## Acceptance criteria
- [ ] Killing a normal enemy shows a small ink "+1" rising above the corpse and fading in ~0.6 s
- [ ] Killing an elite shows a "+5" that is visibly larger than a "+1"
- [ ] Killing The Frame or The Grid shows a "+50" with a small ink ring — once per boss death, at the boss's position
- [ ] The HUD score still gains exactly 1 / 5 / 50 per kill class; the feed changes no score values, XP, shards or streaks
- [ ] A burst of 10+ kills in one second stays smooth — pooled texts recycle, nothing in the console
- [ ] No feed text appears at run start or while nothing is killed
- [ ] `npm run check` and `npm run smoke` pass
