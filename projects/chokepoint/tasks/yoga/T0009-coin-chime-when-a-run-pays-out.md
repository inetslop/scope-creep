---
id: T0009
title: Coin chime when a run pays out
assignee: yoga
size: S
priority: 3
status: todo
depends_on: [T0001, T0003]
attempts: 0
created: 2026-10-28T01:07:07Z
epic: E1
---

## Goal
Earning coins is heard, not just read: the game-over "+N coins" line gets a short chime and a small pop.

## Details
- When the game-over card's "+N coins" line appears and N > 0: play a two-note chime — sine wave, E5 then G5, 80ms each, at the same soft volume as the other Sfx blips (closest example: the existing hit blip in audio/Sfx — add one new chime method next to it).
- The line pops in: scale from 1.15x down to 1.0x over 150ms, like the existing gold pop.
- When N = 0: no sound, no pop — the line appears plainly.

## Acceptance criteria
- [ ] A run that earns coins plays the chime exactly once, when the game-over card appears.
- [ ] A run that earns 0 coins plays no chime and the line has no pop.
- [ ] The pop lasts ~150ms and does not shift the other card lines.
- [ ] The chime volume matches the other UI sounds (no louder than the hit blip).

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` — add a `delaySec` param to `tone()`; add a `chime()` method right after `kill()` (the hit blip, vol 0.18)
- edit the scene T0003 lands the "+N coins" line in — the game-over card, `src/scenes/GameOverScene.ts` (pop the line + play the chime)
### Interfaces
```ts
// in Sfx — tone is private, only chime is public
private tone(freq: number, durSec: number, type: OscillatorType, volume: number, slideTo?: number, delaySec = 0): void;
chime(): void; // sine, E5 (659) then G5 (784), 0.08 s each, volume 0.18
```
### Steps
1. `Sfx.tone`: add the final param `delaySec = 0`; first line of the body becomes `const t = ctx.currentTime + delaySec;`. No other change.
2. In `Sfx`, after `kill()`:
```ts
/** The run pays out coins: E5 then G5. */
chime(): void {
  this.tone(659, 0.08, 'sine', 0.18);
  this.tone(784, 0.08, 'sine', 0.18, undefined, 0.08);
}
```
3. In that scene's `create()`, immediately after the local const that builds the "+N coins" line (use that const, whatever T0003 named it): when N > 0 do `line.setScale(1.15); this.tweens.add({ targets: line, scale: 1, duration: 150, ease: 'Quad.easeOut' });` and `getSfx(this)?.chime();` — add `getSfx` to the existing `./keys` import. N is the same number the line's text shows. N = 0: no tween, no sound, line appears plainly.
### Pitfalls
- Scale only the line's text object (it keeps origin 0.5 and its y) — never tween the box/panel container or the other lines, or they shift.
- Volume 0.18 (never above the `kill()` hit blip); schedule G5 through the `delaySec` param, no `setTimeout`.
- Chime goes in `create()` so it plays exactly once per card appearance; it is a safe no-op if audio is still locked.
- If T0003 puts the line in a scene other than `GameOverScene`, put the pop + chime in that scene instead — the line's scene owns its juice.
### Tests
- none
