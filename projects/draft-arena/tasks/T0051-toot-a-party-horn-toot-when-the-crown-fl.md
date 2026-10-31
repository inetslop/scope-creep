---
id: T0051
title: "Toot: a party-horn toot when the crown flies off"
assignee: cachyos-x8664
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T10:32:35Z
claimed_at: 2026-10-31T10:52:50Z
finished_at: 2026-10-31T10:59:29Z
epic: E11
---

## Goal
The crown falling is the loudest moment of a player's life and it is silent: give it a sound, so knocking out the leader is heard, not just seen.

## Details
- When the crown lifts off the fallen leader's head (the start of the crown-fall effect), play a short party-horn toot: a two-note descending blip, ~500 Hz falling to ~300 Hz over 0.25 s, peak 0.15 — a candy "bwoot", not an alarm.
- When the crown pops into its 20 stars at the top of its spin (0.9 s into the effect), play one small soft tick: ~1500 Hz, 0.05 s, peak 0.08.
- No DOM, no card: sound only, the same shape as the coin tick and the bonk. Add the sound to the audio layer and hook it into the crown-fall effect's draw, exactly the way the pop and the bonk are hooked in.
- Dedupe per effect seed, under the shared voice cap, quiet enough to sit under a crowd of pops; on a phone it starts with the audio layer on the first gesture, like the other sounds.

## Acceptance criteria
- [ ] When a crowned player is knocked out, every client in the match hears the toot as the crown lifts off and the tick as it pops, at the same instant on desktop and phone.
- [ ] One toot and one tick per crown fall (not per frame, not per client), and never without a crown fall.
- [ ] The pop, chime, coin, bonk and fanfare sounds are unchanged.

## Design (architect, yoga)

### Files
- edit `src/audio/sfx.ts` — add the `tootTicks` map and exported `toot`, `tootTick` functions; nothing else changes
- edit `src/content/effects/crown-fall.ts` — one import plus two call lines at the top of `draw`

### Interfaces
In `src/audio/sfx.ts` (module level: `tootTicks` right after `let lastBonk = 0;` on line 14; both functions right after `bonk`), character for character:
```ts
const tootTicks = new Map<number, number>(); // crown-fall seed -> until when its toot tick has played
export function toot(seed: number, age: number): void {
  if (!ctx) return;
  if (age > 0.25) return; // the effect's first frames only
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (active >= 6) return;
  active += 1;
  blip(500, 0.15, 0.25, 300); // 500->300 Hz over 0.25 s, peak 0.15: the party-horn toot
}
export function tootTick(seed: number, age: number): void {
  if (!ctx) return;
  if (age < 0.9 || age > 1.05) return; // only as the crown pops (0.9 s into the effect)
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = tootTicks.get(seed);
  if (until !== undefined && until > now) return;
  tootTicks.set(seed, now + 700);
  if (tootTicks.size > 96) for (const [s, u] of tootTicks) if (u <= now) tootTicks.delete(s);
  if (active >= 6) return;
  active += 1;
  blip(1500, 0.08, 0.05); // 1500 Hz over 0.05 s, peak 0.08: the small soft tick
}
```
In `src/content/effects/crown-fall.ts`: add `import { toot, tootTick } from '../../audio/sfx.ts';` (same relative path burst.ts uses for `bonk`) and make the first two statements of `draw`, before the existing `if (fx.age < 0.9) {`, be `toot(fx.seed, fx.age);` then `tootTick(fx.seed, fx.age);` — exactly the way burst.ts calls `bonk(fx.seed, fx.age);` (its draw's first line).

### Steps
1. In `sfx.ts`, add the `tootTicks` line, then the two functions, character for character — they clone the existing `pop`/`fanfare` shape: `!ctx` gesture gate, `age` window, `lastHud` match-frame gate, per-seed map dedupe with the 96-entry cleanup, the shared 6-voice `active` cap, and `blip` (which owns the oscillator and the `active` decrement).
2. In `crown-fall.ts`, add the import and the two call lines only. The calls are no-ops outside their windows; `draw` runs on every client every frame, so each client hears one toot and one tick per crown fall.
3. No phone work: the existing `!ctx` gate plus `arm()`/`hudNow()` already make it start on the first gesture, like the other sounds.

### Pitfalls
- The tick must NOT check `heard`: the toot's `heard.set(seed, now + 700)` at age 0 would block the tick at age 0.9 forever. Hence the separate `tootTicks` map — both sounds still share the `active` cap.
- Gate the tick on `fx.age` (seconds; window 0.9..1.05), not `fx.t` (0→1 over the 1.3 s duration; 0.69 at the pop).
- Both functions must check `active >= 6` before `active += 1` and end in `blip(...)`; hand-rolling an oscillator leaks the shared 6-voice cap.
- Do not touch `pop`, `bonk`, `coinTick`, `playChime`, `fanfare` or `blip` — the pop, chime, coin, bonk and fanfare sounds stay unchanged.
- `crown-fall` is fired only by `directors/crown.ts` in `onKill` when the victim wore the crown, so the sounds can never play without a crown fall.

### Tests
none (engine/tests/ runs the effect's draw in a real match automatically).

## Result (attempt 1, cachyos-x8664)

Added the crown-fall sounds: `toot` (500→300 Hz, 0.25 s, peak 0.15) and `tootTick` (1500 Hz, 0.05 s, peak 0.08) in `src/audio/sfx.ts`, cloned from the pop/bonk shape with per-seed dedupe (a separate `tootTicks` map for the tick so the toot can't block it) under the shared 6-voice cap, and hooked both as the first two statements of the crown-fall effect's `draw` in `src/content/effects/crown-fall.ts`. So knocking out the crowned leader now plays the party-horn toot as the crown lifts off and a soft tick as it pops into 20 stars, on every client, phone included (same gesture-arming as the other sounds).

- Self-review: APPROVE
- Time: 6.7 min

```
projects/draft-arena/game/src/audio/sfx.ts         | 29 ++++++++++++++++++++++
 .../game/src/content/effects/crown-fall.ts         |  3 +++
 2 files changed, 32 insertions(+)
```
