---
id: T0090
title: "Build countdown tick: the last three seconds are audible"
assignee: cachyos-x8664
size: S
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-29T00:51:07Z
claimed_at: 2026-10-29T02:12:21Z
finished_at: 2026-10-29T02:20:11Z
epic: E1
---

## Goal
The last three seconds of every build break are audible — one soft blip per second — so a player mid-thought hears the wave coming without reading the number, and the break's price (Send, T0077) sits next to its ticking.

## Details
- The build countdown's last three whole seconds — the number going 3, then 2, then 1 — each play one soft blip the moment the number changes: the tier chime's lowest note (T0032, 80 ms, volume 0.1), so no new sound is needed. No blip at 4, 5, … and none at 0: the wave banner (T0067) takes over the moment the wave starts.
- The blip follows the countdown's own clock: pausing the game stops the countdown and the blips together, and resuming continues where it left off. Fast-forward (T0019) is wave-phase only, so it never touches the tick.
- If the wave is started early (Send, T0077), the tick stops with the phase change — the moment of sending plays no extra blip.
- No input, no new HUD element, no pause-screen line: a sound on an element that already exists, nothing new to teach (pillar 8).

## Acceptance criteria
- [ ] Every build countdown's last three whole seconds (the number going 3, 2, 1) each play one soft blip on the number change; seconds four and up are silent, and the wave start itself plays no blip.
- [ ] The blip is the quiet class — at most the tier chime's 0.1 volume, never louder than the UI blip — and the pause sound-off (T0035) silences it.
- [ ] Pausing during the last three seconds stops the blips with the countdown; resuming continues the count and the blips exactly where it left off.
- [ ] Starting the wave early (the Send button, once in) plays no extra blip, and the wave banner is unchanged.
- [ ] No new key, button, HUD element or pause-screen line.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/NextWaveButton.ts` - the build countdown's last three whole seconds (3, 2, 1) each play `sfx.blip()` on the number change; no other file changes.
### Interfaces
No new or changed types or signatures — one private field and one call inside the existing `update()`.
### Steps
1. In `NextWaveButton.ts`, add `import { getSfx } from '../../scenes/keys';` directly after the `GameScene` type import (line 4), exactly as `PanicButton.ts` line 6 does.
2. In the class, after `private waveSize = 1;`, add:
   ```ts
   /** The last number shown: a change to 3, 2 or 1 is the build break's soft blip. */
   private lastShown = -1;
   ```
3. In `update()`, in the `if (run.phase === 'build')` branch, insert directly after `const secs = Math.max(0, Math.ceil(run.buildLeftSec));`:
   ```ts
   if (this.lastShown !== secs) {
     this.lastShown = secs;
     if (secs >= 1 && secs <= 3) getSfx(game)?.blip();
   }
   ```
   `Sfx.blip()` is the tier chime's lowest note (523 Hz, 80 ms, volume 0.1) and returns silently when `muted` (T0035) or audio is locked — nothing else to gate.
### Pitfalls
- The `secs >= 1` guard, not just `secs <= 3`, is what kills the 0-blip: on the frame the countdown expires the phase is already `wave` so the branch is skipped, but the guard also protects against any update ordering where the number reads 0 while phase is still `build`.
- Blips are driven by the shown number's change, never by `dt` or a timer: pausing (GameScene paused, `buildLeftSec` frozen) stops them and resuming continues exactly; fast-forward is wave-phase only and can't double-fire; a build start at 8/10 s sets `lastShown` silently (out of range).
- Do not touch the teal ring, the `title`/`hint` text or `waveStart()`: the wave banner and its chime already play at wave start.
- Send/Space (`startWaveNow`) just zeroes `buildLeftSec` and flips the phase — the same path covers it; no code needed for T0077's button.
### Tests
none

## Result (attempt 1, cachyos-x8664)

The build countdown's last three whole seconds now play one soft blip each — one private `lastShown` field plus a four-line change detection inside `NextWaveButton.update()` in `src/ui/hud/NextWaveButton.ts`, calling the existing `Sfx.blip()` (the tier chime's 523 Hz/80 ms/0.1 note) via `getSfx(game)` from `scenes/keys`. The blip is driven by the shown number's change, so it stops and resumes with the frozen `buildLeftSec` on pause, stays silent past 3 and at 0/Send, and silences under T0035 mute. `npm run check` and `npm run smoke` (desktop + phone) pass.

- Self-review: APPROVE
- Time: 7.8 min

```
projects/chokepoint/game/src/ui/hud/NextWaveButton.ts | 7 +++++++
 1 file changed, 7 insertions(+)
```
