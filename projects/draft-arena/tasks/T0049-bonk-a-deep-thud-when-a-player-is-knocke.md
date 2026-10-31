---
id: T0049
title: "Bonk: a deep thud when a player is knocked out"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T09:20:00Z
claimed_at: 2026-10-31T09:51:21Z
finished_at: 2026-10-31T10:04:50Z
epic: E11
---

## Goal
A player knockout is the biggest fight moment of the match, and right now it is only confetti. Give it a short deep thud, so a player falling reads by ear as "a player," not "a monster."

## Details
- The moment a player is knocked out (you or another), a short deep "bonk" plays — a soft low thud, like a marshmallow landing — at the same instant the knockout's confetti burst plays.
- Lower than any monster pop (the pops sit at 180–900 Hz): the bonk starts around 130 Hz and drops to about 60 Hz, so it reads as "someone fell," not "something popped."
- One bonk per knockout. In a busy match several players can fall in the same second — at most one bonk every 0.5 s, and it still sits under the existing 6-voice cap.
- Short (under 0.2 s) and a touch quieter than a pop (peak about 0.1), so a crowd of pops plus bonks stays clean.
- Builds on T0039's audio layer (src/audio/sfx.ts): add the bonk sound there and trigger it where the player-knockout burst effect plays, the same one-line way the pop hooks the monster-death effect.
- No new HUD element, no engine change. Works on desktop and mobile with the existing gesture unlock.

## Acceptance criteria
- [ ] Knock out a player, or get knocked out: one deep thud plays at the same moment the confetti burst plays.
- [ ] The thud is clearly lower than a monster pop, so a player falling reads differently from a monster dying.
- [ ] Three players knocked out in the same second: the thuds are at least 0.5 s apart and the mix stays clean (no buzz).
- [ ] A monster pop and a bonk in the same instant are both heard.
- [ ] On a phone it plays with no extra tap and does not block the controls.

## Design (architect, yoga)

### Files
- edit `src/audio/sfx.ts` - add the bonk: a `lastBonk` state var, exported `bonk(seed, age)`, and one optional parameter on `blip()` so the thud can fall 130→60 Hz (pops keep their old curve)
- edit `src/content/effects/burst.ts` - one import + one line: `bonk(fx.seed, fx.age);` as the first line of the burst effect's `draw()`, the same way `pop.ts` hooks its sound

### Interfaces
```ts
// src/audio/sfx.ts — new export, mirrors pop(seed, radius, age):
export function bonk(seed: number, age: number): void;
// existing private helper, signature only:
function blip(f0: number, peak: number, life: number, end = f0 * 0.55): void;
```

### Steps
1. `src/audio/sfx.ts`, state vars block (after line 12 `const heard = ...`): add `let lastBonk = 0; // performance.now() of the last bonk`.
2. `src/audio/sfx.ts`, `blip()`: signature `function blip(f0: number, peak: number, life: number, end = f0 * 0.55): void {` and change its second line to `osc.frequency.exponentialRampToValueAtTime(end, t0 + life);`. The default keeps every existing pop byte-identical (130→71.5 stays 180→99 etc. for pops: `end` defaults to `f0 * 0.55` exactly as before).
3. `src/audio/sfx.ts`, between `pop()` and `coinTick()` add:
```ts
/**
 * One deep bonk when a player is knocked out: 130 Hz falling to 60 Hz, under 0.2 s and a touch
 * quieter than a pop, so a player falling reads as "someone fell", not "something popped".
 * Called from the burst effect's draw() on every client: at most once per effect (its seed),
 * at most one bonk every 0.5 s, and under the same 6-voice cap as the pops.
 */
export function bonk(seed: number, age: number): void {
  if (!ctx) return;
  if (age > 0.25) return;
  const now = performance.now();
  if (now - lastHud > 1000) return;
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (now - lastBonk < 500) return;
  lastBonk = now;
  if (active >= 6) return;
  active += 1;
  blip(130, 0.1, 0.18, 60);
}
```
4. `src/content/effects/burst.ts`: add `import { bonk } from '../../audio/sfx.ts';` after the PALETTE import, and make `bonk(fx.seed, fx.age);` the first line of `draw(g, fx)`.

### Pitfalls
- The `end` default must stay `f0 * 0.55` or every monster pop changes pitch; the bonk is the only caller passing a 4th argument.
- Keep the gate order in `bonk()` exactly as written: seed dedup → 0.5 s throttle → 6-voice cap → `active += 1`. A throttled or capped bonk must not increment `active` (the `blip` oscillator's `onended` is what decrements).
- A *marked* player's knockout plays two burst effects the same instant (engine corpse burst + mark director ring burst): the 2nd seed passes the dedup but is dropped by the 0.5 s throttle, so it is still one bonk per knockout — do not "fix" this or add a per-effect count.
- No engine change and no registry: the trigger is the client-side effect draw, so all clients hear it at the confetti instant, unlocked by the existing `arm()` gesture (pointerdown/keydown/touchstart) — no extra tap on a phone.

### Tests
none (content is tested automatically by engine/tests/; no pure helpers added)

## Result (attempt 1, yoga)

Added a deep "bonk" thud for player knockouts in the audio layer: `src/audio/sfx.ts` gains a `lastBonk` state var, an exported `bonk(seed, age)` (130 → 60 Hz, peak 0.1, 0.18 s, deduped per effect seed, throttled to one every 0.5 s, under the same 6-voice cap as pops), and an optional `end` parameter on the private `blip()` defaulting to the old `f0 * 0.55` so pops stay byte-identical. `src/content/effects/burst.ts` now calls `bonk(fx.seed, fx.age)` as the first line of its `draw()`, exactly mirroring how the pop effect hooks its sound — so a knocked-out player's confetti burst plays the deep thud on every client at the same instant, desktop and phone.

- Self-review: APPROVE
- Time: 13.5 min

```
projects/draft-arena/game/src/audio/sfx.ts         | 27 ++++++++++++++++++++--
 .../draft-arena/game/src/content/effects/burst.ts  |  2 ++
 2 files changed, 27 insertions(+), 2 deletions(-)
```
