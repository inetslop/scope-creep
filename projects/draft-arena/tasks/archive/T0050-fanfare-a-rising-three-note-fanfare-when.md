---
id: T0050
title: "Fanfare: a rising three-note fanfare when a player prestiges"
assignee: cachyos-x8664
size: S
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-31T09:20:00Z
claimed_at: 2026-10-31T10:05:30Z
finished_at: 2026-10-31T10:12:56Z
epic: E11
---

## Goal
A prestige is the rarest moment of a life — the big ring and confetti where the player reboots — and it is silent. Give it a short rising fanfare, so the field hears a veteran being reborn.

## Details
- The moment a player (you or another, including bots) prestiges, a short three-note fanfare plays — a bright rising arpeggio ("da-da-DA") — at the same instant the big prestige ring blooms.
- C5→E5→G5 (523, 659, 784 Hz), each note about 0.1 s with 0.1 s between the starts — about 0.35 s total. Longer and lower than the level-up chime (E6→G6), so a prestige reads bigger than a level-up.
- Prestiges are rare, so it may be a touch brighter than pops, but still under the action (peak about 0.09).
- At most one fanfare every 2 s, in case a player and a bot prestige at the same moment.
- Builds on T0039's audio layer (src/audio/sfx.ts): add the fanfare there and trigger it where the prestige ring effect plays, the same one-line way the pop hooks the monster-death effect.
- No new HUD element, no engine change. Works on desktop and mobile with the existing gesture unlock.

## Acceptance criteria
- [ ] Prestige, or watch a player or bot prestige: one rising three-note fanfare plays as the big ring blooms.
- [ ] The fanfare is clearly longer and lower than the level-up chime, so the two moments don't blend into one sound.
- [ ] Two prestiges in the same second: only one fanfare plays.
- [ ] On a phone it plays with no extra tap and does not block the controls.

## Design (architect, yoga)

### Files
- edit `src/audio/sfx.ts` - add one module state line and the exported `fanfare(seed, age)` function (no other changes)
- edit `src/content/effects/prestige-ring.ts` - import `fanfare` and call it as the first line of `draw()` (exactly like `pop.ts:12`)

### Interfaces
```ts
// in src/audio/sfx.ts
let lastFanfare = 0; // performance.now() of the last fanfare (next to `let active`/`const heard`, lines 11-12)

export function fanfare(seed: number, age: number): void // at end of file, after playChime
```

### Steps
1. In `src/audio/sfx.ts`, after `const heard = ...` (line 12) add: `let lastFanfare = 0; // performance.now() of the last prestige fanfare`
2. At the end of `src/audio/sfx.ts` add, copy of `playChime` structure (its loop, gain, stop pattern) with these exact differences:

```ts
/**
 * Prestige: a bright rising arpeggio C5→E5→G5 ("da-da-DA"), lower and longer than the
 * level-up chime so a prestige reads bigger. Called from the prestige-ring effect's
 * draw() on every client: the frames the ring blooms (its seed) and at most one
 * fanfare every 2 s, so a player and a bot prestiging at once sound as one.
 */
export function fanfare(seed: number, age: number): void {
  if (!ctx || !master) return; // not unlocked by a gesture yet
  if (age < 0.2 || age > 0.35) return; // only as the ring blooms
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (now - lastFanfare < 2000) return; // one fanfare per 2 s
  lastFanfare = now;
  const t0 = ctx.currentTime;
  for (const [f, d] of [[523.25, 0], [659.25, 0.1], [784, 0.2]] as const) {
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = f;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.09, t0 + d);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + d + 0.12);
    o.connect(g);
    g.connect(master);
    o.start(t0 + d);
    o.stop(t0 + d + 0.14);
  }
}
```
3. In `src/content/effects/prestige-ring.ts`: add `import { fanfare } from '../../audio/sfx.ts';` after the PALETTE import (line 2), and make the first line of `draw(g, fx)` be `fanfare(fx.seed, fx.age);` (before `if (fx.t < 0.2) return;`).

### Pitfalls
- `age < 0.2` gate is required: without it the fanfare starts 0.2 s before the ring becomes visible; the gate sits in `sfx.ts`, not in `draw` (the call stays unconditional, like `pop.ts:12`).
- The 2 s gate is its own `lastFanfare` var; do not touch pop's `active` counter (that caps pops at 6) and do not remove the per-seed `heard` mark.
- Do not call `fanfare` from the director's `onPrestige` (server-only): sound is client-side, the effect's `draw()` is the client hook.
- `ctx` may be undefined (no gesture yet) or the start screen may be up: both are early-returns, exactly as `pop` does.
- `T0049` (Bonk) also edits `sfx.ts`; the runner serializes same-file edits — add nothing of its, no `DEPENDS_ON`.

### Tests
- none

## Result (attempt 1, cachyos-x8664)

Added the prestige fanfare to the audio layer: `fanfare(seed, age)` in `src/audio/sfx.ts` plays a rising C5→E5→G5 arpeggio (523/659/784 Hz, 0.1 s steps, 0.12 s each, peak 0.09) — clearly lower and longer than the E6→G6 level-up chime — gated to the frames the ring blooms (`age` 0.2–0.35 s), once per effect seed, with a `lastFanfare` 2 s cap so a player and bot prestiging at once sound as one, plus a `let lastFanfare` state line. Hooked it client-side the same one-line way `pop` hooks: `src/content/effects/prestige-ring.ts` now calls `fanfare(fx.seed, fx.age)` as the first line of `draw()`, so the fanfare plays as the big prestige ring blooms for you, other players, and bots alike.

- Self-review: APPROVE
- Time: 7.4 min

```
projects/draft-arena/game/src/audio/sfx.ts         | 33 ++++++++++++++++++++++
 .../game/src/content/effects/prestige-ring.ts      |  2 ++
 2 files changed, 35 insertions(+)
```
