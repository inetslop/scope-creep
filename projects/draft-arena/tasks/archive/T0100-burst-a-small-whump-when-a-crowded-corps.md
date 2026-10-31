---
id: T0100
title: "Burst: a small whump when a crowded corpse bursts (Sting)"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T16:34:41Z
claimed_at: 2026-10-31T16:40:14Z
finished_at: 2026-10-31T16:53:00Z
epic: E16
---

## Goal
The Hive capstone's moment gets its own ear: when a crowded kill bursts (the Sting ring blooms), a short low whump plays under the normal pop, so a Hive player's signature kill lands by ear, not just by sight.

## Details
- Sound only: no card, no DOM, no HUD line — a new entry in the game's audio layer, like the coin tick, the gem plink and the level-up chime.
- When: exactly when the `sting-burst` effect plays (the teal ring with an ink rim blooming to its radius with teal confetti, on a kill with 2+ other enemies within 80 of the corpse). Every client that sees the burst hears it, the way everyone hears a monster pop — not yours only.
- The sound: a short soft low thump — a 200 → 130 Hz sine drop over 0.1 s, peak 0.05 (quieter than the pop, so it sits under it). A dull squeeze: clearly softer and lower than the pop's bright blip, and higher and shorter than the bonk's deep thud. One pitch for every burst (they are all the same size).
- Dedupe once per effect seed (the same pattern the pop and the toot use), and throttle to at most one whump per 200 ms globally (the bonk's throttle shape), so a field full of Hive capstone kills doesn't stack them.
- The file is `src/audio/sfx.ts`; the closest examples in it are `plink` (a short quiet blip, once per effect seed) and `toot` (the throttle). Clone their shape.

## Acceptance criteria
- [ ] A kill with 2 or more other enemies within 80 of the corpse, on a player with the Sting rank, plays the whump under the normal pop, at the moment the teal ring blooms.
- [ ] A normal kill (no burst) plays only the pop — no whump.
- [ ] On a field with several Hive capstone kills at once, at most one whump plays per 200 ms.
- [ ] `npm run check` and `npm run smoke` (desktop and mobile) pass.

## Design (architect, yoga)

### Files
- edit `src/audio/sfx.ts` - add a `lastWhump` module var and a `whump(seed, age)` function: same shape as `bonk` (lines 91-105), but 200 ms global throttle and the whump blip.
- edit `src/content/effects/sting-burst.ts` - import `whump` and call it as the first line of `draw(g, fx)`, exactly like `src/content/effects/burst.ts` calls `bonk(fx.seed, fx.age)`.

### Interfaces
In `src/audio/sfx.ts`, next to `let lastBonk = 0;` (line 14):
```ts
let lastWhump = 0; // performance.now() of the last whump
```
After the `bonk` function:
```ts
export function whump(seed: number, age: number): void {
  if (!ctx) return;
  if (age > 0.25) return; // the effect's first frames only
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (now - lastWhump < 200) return; // one whump per 200 ms
  lastWhump = now;
  if (active >= 6) return;
  active += 1;
  blip(200, 0.05, 0.1, 130); // 200 -> 130 Hz over 0.1 s, peak 0.05: the dull low squeeze
}
```
In `src/content/effects/sting-burst.ts`: add `import { whump } from '../../audio/sfx.ts';` with the other imports, and make `draw(g, fx)` start with `whump(fx.seed, fx.age);`.

### Steps
1. Add `lastWhump` in `sfx.ts` after `lastBonk`; add `whump` after the `bonk` function (copy `bonk`, swap the 500 ms `lastBonk` throttle for the 200 ms `lastWhump` throttle, swap `blip(130, 0.1, 0.18, 60)` for `blip(200, 0.05, 0.1, 130)`).
2. In `sting-burst.ts`, add the import and the `whump(fx.seed, fx.age);` first line of `draw`.

### Pitfalls
- The effect's `fx.seed`/`fx.age` exist on `EffectView` (`engine/api.ts`); never pass `fx.t` or radius — the seed is the dedupe key.
- Throttle before the `active += 1` so a skipped whump doesn't leak an `active` voice (mirror `bonk`'s order).
- No server code changes: the effect only plays from `sting.onKill`, so the whump only sounds on real bursts.

### Tests
none

## Result (attempt 1, yoga)

Added the Hive burst whump: a new `whump(seed, age)` in `src/audio/sfx.ts` — a short soft low squeeze (200 → 130 Hz sine over 0.1 s, peak 0.05) that sits under the pop, deduped once per effect seed and globally throttled to one per 200 ms with the same 6-voice cap as pops — and wired it in as the first line of the `sting-burst` effect's `draw()` in `src/content/effects/sting-burst.ts`, so every client who sees the teal ring bloom on a crowded Sting kill hears it. `npm run check` and `npm run smoke` (desktop + mobile) pass.

- Self-review: APPROVE
- Time: 12.8 min

```
projects/draft-arena/game/src/audio/sfx.ts         | 25 ++++++++++++++++++++++
 .../game/src/content/effects/sting-burst.ts        |  2 ++
 2 files changed, 27 insertions(+)
```
