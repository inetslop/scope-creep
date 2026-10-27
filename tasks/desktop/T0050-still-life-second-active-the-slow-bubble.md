---
id: T0050
title: "Still Life — second active: the slow bubble"
assignee: desktop
size: M
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-27T00:32:39Z
---

## Goal
A second active alongside the Understudy decoy: Still Life slows time in a bubble around the player, buying a few seconds of breathing room in late-game swarms and a moment to think mid-boss.

## Details
- A new active, available from the start of every run, on top of the Understudy — no unlock, no choice; both are always available, each with its own trigger and its own cooldown.
- Desktop trigger: the **Q** key (Space stays with the Understudy, mouse click keeps firing). Register it in `src/scenes/keys.ts` next to the others.
- Mobile trigger: a second 60 px round touch button in the bottom-left thumb zone, next to the Understudy button (no overlap with it).
- On trigger, a pale **blue** disc with a dashed blue ink ring appears around the player, radius **160 units**, lasting **5 seconds**. The bubble follows the player while it lasts.
- While the bubble is up, every enemy inside it — including elites and bosses — moves at **50% speed**, and enemy projectiles inside it fly at **50% speed**. Enemies that walk in get slowed immediately; when the bubble ends, everything snaps back to full speed at once. A boss's own movement is slowed, but the timing of its attack patterns (The Frame's bursts, The Grid's arms) is unchanged. The player is never slowed.
- **12 s cooldown** from the moment of trigger (the bubble ends at 5 s; the active re-triggers at 12 s).
- HUD: a second cooldown icon beside the Understudy icon — clockwise fill, solid when ready (desktop); the mobile button dims while on cooldown. Reuse the Understudy's cooldown rendering.
- Audio: one new quiet synthesized SFX on activation (a soft descending "shush"); nothing on end.
- Keep the active window and cooldown in a pure core module with unit tests (5 s window, 12 s cooldown), modeled on `src/core/understudy.ts` and its test; expose the active state in `debug/testHook.ts` so the smoke test can verify it, as T0015 did for the decoy.

## Acceptance criteria
- [ ] Pressing Q (or the new mobile button) shows a pale blue disc + dashed blue ring of 160 u radius around the player for exactly 5 s, with the new quiet SFX playing once per activation.
- [ ] While the bubble is up, enemies and their projectiles inside it move at half speed; enemies outside it keep full speed.
- [ ] A boss inside the bubble moves at half speed while its attack patterns keep their normal timing.
- [ ] A second cooldown indicator (clockwise-filling icon on desktop, dimmed 60 px button on mobile) counts a 12 s cooldown from trigger; the active cannot re-trigger before it completes.
- [ ] The Understudy (Space / bottom-left button) still works unchanged alongside the new active.
- [ ] `npm run check` (including the new core-module tests) and `npm run smoke` pass.
