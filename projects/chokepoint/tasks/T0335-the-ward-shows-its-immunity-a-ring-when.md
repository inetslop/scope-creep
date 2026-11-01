---
id: T0335
title: "The Ward shows its immunity: a ring when a control does not take"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T02:32:15Z
claimed_at: 2026-11-01T02:32:54Z
designer: yoga
---

## Goal
A Ward that shrugs off a slow, a root or a gust says so on the board: the control that does not take gets one small ring, so a first-time player learns the Ward's rule from the board instead of from a leak.

## Details
- Display-only, on the board: the moment a control that a Ward ignores — a Frost slow (first apply or a re-apply), an Anchor root, a Push gust or a per-hit push — is applied to a live Ward and takes no effect, one small ring plays at the Ward's base: a thin ring in the Ward's own **red**, muted at ~40% alpha, growing from the token's base out to ~0.5 cells over ~400 ms while fading, at ground level under the token (the Mute ring's / the boss-arrival ring's ground placement).
- One ring at a time per Ward: if a ring is already playing, the new event restarts it from the top; a Ward standing inside a Frost aura refreshes it no more often than once per 0.5 s.
- The hook fires exactly where the Ward's `ignoresControl` makes a push, root or slow be skipped — the shared control path the fatigue module (T0301) rides. New file `src/systems/enemyHooks/wardDeny.ts`, registered in `src/systems/enemyHooks/index.ts` (one import, one `ENEMY_HOOKS` line, the `bossPhase` anchor pattern). Closest example to copy: the Mute's silence ring hook (T0219).
- No sound, no input, no gameplay change: the Ward's numbers (hp 180, speed 0.9, gold 10, 1 life) and its immunity are untouched; the controls still do nothing to it.

## Acceptance criteria
- [ ] A Frost apply, an Anchor pulse, a Push gust or a per-hit push landing on a live Ward plays one small red ring at its base; a re-apply restarts the ring instead of stacking, and inside a Frost aura it refreshes at most once per 0.5 s.
- [ ] The ring is display-only: a Ward's hp, speed, gold, leak cost and control immunity are unchanged; the controls still do nothing to it.
- [ ] No ring on any enemy that is not a Ward; no sound; no new input.
- [ ] The hook is a new file registered in the enemy-hook list; typecheck, lint, unit tests and the smoke test pass.
