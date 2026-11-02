---
id: T0449
title: "The tag's haptic: a special wave you feel before it happens"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-02T22:27:29Z
claimed_at: 2026-11-02T22:44:22Z
epic: E22
---

## Goal
On mobile, a tagged wave (anything but the quiet breather) is felt before it happens: one short buzz at the banner, so a phone player knows a special wave is coming without reading the chip.

## Details
- A new tagHaptic() in input/haptics.ts: one guarded navigator.vibrate(30) — the guarded pattern's own shape (T0265: place 20 ms, leak 80 ms, never throws on a desktop or a haptics-less browser).
- It plays once per wave start whenever the wave's plan wears a tag other than "quiet" — the tight, rush and short-cut waves now, and double and clumps (T0447, T0448) automatically when they land, because the buzz reads the plan's tags field (T0080), not a tag list.
- The moment: the wave banner's trigger point — the closest example is the boss-death haptic (T0428), which hooked its run moment's flag the same way.
- A quiet wave (the breather) never buzzes.
- No HUD element, no sound, no text, no toggle — the haptic's own pattern (T0265: no HUD or toggle).

## Acceptance criteria
- [ ] On mobile, a tight, rush or short-cut wave start plays one 30 ms vibration; a quiet wave start plays none.
- [ ] On a desktop (no navigator.vibrate) nothing plays and nothing throws.
- [ ] No new HUD element, no sound, no text.

## Design (architect, yoga)

### Files
- edit `src/input/haptics.ts` - add `tagHaptic()` after `haptic()`: one guarded `navigator.vibrate(30)`, same shape as `haptic()`
- edit `src/systems/WaveSystem.ts` - import `tagHaptic`; one condition + call at the end of `start()`
- edit `tests/input/haptics.test.ts` - add `tagHaptic()` to the import and one assertion to the no-op test

### Interfaces
```ts
// src/input/haptics.ts — new export, same guard as haptic():
/** A tagged wave's tag (T0449): one 30 ms buzz, as the wave starts. */
export function tagHaptic(): void;
```
No types change. The buzz reads `WavePlan.tags` (`string[]`, `src/core/waves.ts`), which T0447/T0448 will fill — nothing new from them is used.

### Steps
1. In `src/input/haptics.ts`, append after `haptic()`:
```ts
/**
 * A tagged wave's tag (T0449): a wave wearing a tag other than "quiet" (tight, rush, short cut,
 * boss — double and clumps when they land) buzzes 30 ms once, as it starts, so a phone player
 * feels the special wave coming without reading the chip. The same guarded no-op as `haptic`:
 * nothing on a desktop or a haptics-less browser.
 */
export function tagHaptic(): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(30);
  } catch {
    /* The phone refused the buzz (vibration locked, or the call threw): the run goes on without it */
  }
}
```
2. In `src/systems/WaveSystem.ts`: add `import { tagHaptic } from '../input/haptics';` between the `../debug/testHook` import and the `./EnemySystem` import. In `start()`, after the `this.timer = 0;` line, add:
```ts
// A tagged wave (anything but the quiet breather) buzzes once, so a phone player feels it coming (T0449).
if (this.plan && this.plan.tags.some((t) => t !== 'quiet')) tagHaptic();
```
3. In `tests/input/haptics.test.ts`: add `tagHaptic` to the import and one line to the no-op test:
```ts
expect(() => tagHaptic()).not.toThrow();
```

### Pitfalls
- Do not extend `PATTERNS`/`HapticKind` or call `haptic('...')` with a new string — the task wants the standalone guarded `tagHaptic()`; a new kind would break the `Record<HapticKind, number[]>` type.
- Keep the guard line byte-identical to `haptic()`'s — the test relies on it not throwing where `navigator.vibrate` is absent.
- One buzz per start, not per frame: it must live in `start()` (run once per wave: RunFlow's countdown end, `startWaveNow`, RunSave's resume all funnel through it).
- `some((t) => t !== 'quiet')` — an empty `tags` (a plain wave) buzzes none; boss waves' `['boss']` does buzz, as intended ("anything but the quiet breather").
- No HUD, sound, text, or toggle: this file and the WaveSystem line only.

### Tests
- `npm run check` covers it: the added `tests/input/haptics.test.ts` assertion is the only test (juice task; no `core/` rule changes).
