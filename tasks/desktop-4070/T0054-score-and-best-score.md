---
id: T0054
title: Score and best score
assignee: desktop-4070
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T00:59:33Z
---

## Goal
Kills now earn points, so a run has a number to chase: the score is always visible in the HUD, and the game-over screen shows this run's score next to your all-time best, which persists between runs.

## Details
- A new run stat `score`, reset to 0 at the start of every run. It is awarded in the shared kill path (the same place that drops shards and counts the kill-streak) so every kill source counts — Point, Line, Orbit, Arc, and boss kills alike.
- Points per kill:
  - a normal (non-elite) enemy kill: +1 point
  - an elite kill: +5 points
  - a boss kill (The Frame now, The Grid later): +50 points
- HUD: a small ink readout `SCORE 123` in the top-left corner (small, same style as the kill-streak tally but on the left so the two never overlap). It updates the instant a kill lands. Do not crowd the HP/XP bar.
- Game over: show two lines under the existing game-over text — `SCORE 123` for this run and `BEST 456` for the all-time best (best = the higher of this run's score and the stored best).
- Persistence: store the all-time best in `localStorage` under the key `scope-creep.best-score` so it survives a reload and future runs. On a new run, read the stored best (default 0 if absent); at game over, write back the new best if this run beat it.
- Add `score: number` (starting 0) to the debug stats in `debug/testHook.ts` so the smoke test can read it.
- No new SFX, no new art.

## Acceptance criteria
- [ ] The HUD shows `SCORE 0` at the start of a run, in the top-left, and it increments the moment any kill lands
- [ ] Killing a normal enemy adds 1 point, an elite adds 5, and The Frame adds 50 — all through the one shared kill path (kills by any weapon or the boss count)
- [ ] The game-over screen shows this run's `SCORE` and a `BEST` that is the higher of the run and the stored best
- [ ] After a run that beats the stored best, reloading the page and starting a new run shows the new best already (persisted in `localStorage` under `scope-creep.best-score`)
- [ ] `score` is present in the debug stats
- [ ] `npm run check` and `npm run smoke` pass
