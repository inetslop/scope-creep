---
id: T0091
title: The last stand gets a sting
assignee: cachyos-x8664
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T01:18:08Z
claimed_at: 2026-10-29T01:55:25Z
finished_at: 2026-10-29T01:58:31Z
epic: E1
---

## Goal
The run's loudest state is heard as well as seen: the moment the last stand turns on, the banner's landing carries one soft low sting, so a player who is watching the board hears the comeback has started.

## Details
- The moment the last stand banner (T0060) slides in — a leak brings the lives to exactly 1 — one sting plays with the banner's landing: two sine notes, 80 ms each, back to back — a soft ascending minor third two octaves below the coin chime's notes (E5→G5, T0009): E3 (~165 Hz) then G3 (~196 Hz), at volume 0.1, the tier-chime's quiet class (T0032) — never louder than the hit blip.
- Once per entry into exactly 1 life — the banner's own trigger, so every re-entry to 1 life (T0060 shows the banner again) plays the sting again. Nothing plays when the last stand turns off (a life comes back, T0045's streak payback) and nothing plays at the run's start.
- A new two-note method in the Sfx module (`src/audio/Sfx.ts`), beside the coin chime (T0009) and the tier chime (T0032) — procedural like everything else, no sound file. Closest example: the coin chime for the two-note shape and the back-to-back timing; the tier chime for the quiet volume.
- Silent when sound is off (T0035's stored preference), like every other Sfx. No input, no new HUD element, no pause-screen line: a sound on a trigger that already exists, nothing new to teach (pillar 8).

## Acceptance criteria
- [ ] A leak that brings the lives to exactly 1 plays the sting once, with the last stand banner's slide-in (T0060); a later re-entry to 1 life plays it again.
- [ ] The sting is two 80 ms sines, E3 then G3, at volume 0.1 — never louder than the hit blip — and the pause sound-off (T0035) silences it.
- [ ] A life coming back to 2 (the clean streak's payback, T0045) plays no sting and shows no banner.
- [ ] Waves, gold, lives, the banner's motion and every other sound are byte-identical; no new key, button, HUD element or pause-screen line.

## Design (architect, desktop)

### Files
- edit `src/audio/Sfx.ts` - add one new method `sting()` right after `tierChime()` (before `leak()`, line 91)
- edit `src/ui/hud/LastStandBanner.ts` - play the sting on the exact branch that shows the banner (its rising edge), plus one import

### Interfaces
No new types. One new method on `Sfx` (class in `src/audio/Sfx.ts`):

```ts
/** The last stand turns on: two soft low notes, E3 then G3, the tier-chime's quiet class. */
sting(): void {
  this.tone(165, 0.08, 'sine', 0.1);
  this.tone(196, 0.08, 'sine', 0.1, undefined, 0.08);
}
```

Notes: E3 = 659/4 ≈ 165 Hz, G3 = 784/4 = 196 Hz (two octaves below the coin chime's E5→G5, `chime()` at line 77 — copy its exact two-note shape, including the `undefined, 0.08` back-to-back delay); volume 0.1 = `tierChime()`'s quiet class, never louder than the hit blip (`blip()`, also 0.1). `tone()` already returns silently when `muted` (line 32), so T0035's sound-off handles itself.

### Steps
1. In `src/audio/Sfx.ts`, insert `sting()` (above) between `tierChime()`'s closing brace (line 91) and `leak()`.
2. In `src/ui/hud/LastStandBanner.ts`, add the import `import { getSfx } from '../../scenes/keys';` after the `GameScene` import (line 3), then change `update()` to:
   ```ts
   update(game: GameScene): void {
     const one = isLastStand(game.run);
     if (one && !this.wasOne) {
       this.banner.show(['Last stand', 'kills pay double']);
       getSfx(game)?.sting();
     }
     this.wasOne = one;
   }
   ```
   This is the banner's own trigger (`PanicButton.ts` line 80, `getSfx(game)?.panic()`, is the existing pattern for a HUD part playing a sound): it fires once per entry into exactly 1 life, re-fires on every re-entry (T0060 shows the banner again too), and never fires when lives return to 2 (T0045) — the branch is a rising edge. Runs start at `START.lives = 20` (`src/config.ts`), so nothing plays at a run's start.

### Pitfalls
- Play the sting only inside the `one && !this.wasOne` branch — not on `update()` generally — or it would play every frame last stand is on.
- Keep `this.wasOne = one;` exactly as the last line; don't reorder it.
- Don't touch `TopBanner` or the banner's tween — the banner motion must stay byte-identical.
- Don't use `window.setTimeout` (the `tierChime` trick) — `tone()`'s `delaySec` param already sequences the two notes; a setTimeout would fire even while muted and survives scene shutdown.

### Tests
- none (audio + one existing trigger line; no core rule changes)

## Result (attempt 1, cachyos-x8664)

Added a new `sting()` method to `src/audio/Sfx.ts` (two 80 ms sine notes, E3→G3, volume 0.1, tier-chime quiet class, sequenced with `tone()`'s delay param) and wired it into `LastStandBanner.update()` so the sting plays on the exact rising edge that slides the banner in — once per entry into 1 life, re-firing on re-entry and silent when lives recover or the run starts. Verified with `npm run check` and `npm run smoke`, both pass.

- Self-review: APPROVE
- Time: 3.1 min

```
projects/chokepoint/game/src/audio/Sfx.ts              | 6 ++++++
 projects/chokepoint/game/src/ui/hud/LastStandBanner.ts | 6 +++++-
 2 files changed, 11 insertions(+), 1 deletion(-)
```
