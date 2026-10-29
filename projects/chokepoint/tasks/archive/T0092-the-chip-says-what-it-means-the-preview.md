---
id: T0092
title: "The chip says what it means: the preview teaches its tag once"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T01:18:08Z
claimed_at: 2026-10-29T02:07:05Z
finished_at: 2026-10-29T02:36:12Z
epic: E1
---

## Goal
The wave preview teaches its own tags where they first appear: the first time a tagged wave is previewed, one muted line names the tag in plain words, so a first-time player knows what "quiet" promises before the wave lands (pillar 8).

## Details
- The build-phase wave preview card (`src/ui/hud/NextWavePreview.ts`, T0015) grows one small muted line under the counts row, shown only when the previewed wave is tagged and the run is not yet taught the tag. Today the only tag is the quiet wave (T0071), so the line reads **"quiet: fewer, double gold"** — the tag's word, then its promise in plain words (half the enemies, double gold per kill).
- Taught once per run: from the second tagged wave's preview on, the line is gone. "Taught" is derived from the run's state, not stored: the run's held-wave count (the run ledger's waves-cleared, T0001) is 4 or more — the first quiet wave is wave 4, so a run that has held 4+ waves has already seen the tag. The same re-derivation pattern as the first run's hint dismissal (T0086): a resumed run re-derives and never re-teaches; no new save field.
- Look: the same muted gray and size as the pay line (T0079's "+N gold" line, in this same card); the card grows by one line the way T0079 did — the card's bottom edge and the counts row keep their screen positions, keeping the gap above the send ring — and the line appears and disappears with the card (build phase only).
- The mechanism is per-tag: each tag the preview can show gets its own one-time teach line (today: quiet only). Later tags — E5's boss, a "tight" tag — add their own line text without touching this one.
- No input, no sound, no rule change, no pause-screen line. Closest example: the pay line (T0079) for placement and style inside the same card; the quiet chip (T0071) for the word being taught.

## Acceptance criteria
- [ ] On a fresh run, the build phases previewing waves 2 and 3 show no teach line — untagged previews are byte-identical to today.
- [ ] The build phase previewing wave 4 shows "quiet: fewer, double gold" under the counts, with the pay line (T0079), the counts and the quiet chip (T0071) keeping their positions; the Send button (T0077) is unchanged.
- [ ] The build phase previewing wave 8 (and 12, 16, …) shows the quiet chip but no teach line — the tag was taught on wave 4's preview.
- [ ] A resumed run with 4 or more waves held never shows the line again; a resumed run before that teaches it when wave 4 is previewed.
- [ ] Desktop 1280x720 and mobile 412x915 smoke pass; no input and no sound.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/NextWavePreview.ts` - one-time tag teach line under the counts row: per-tag table, taught derivation from the run, and the muted line in `build()`

### Interfaces
Nothing exported. Additions inside `NextWavePreview` (all names exactly as below):
- module const `TEACH: { tag: string; first: number; text: string }[]`
- `private teachLine(plan: WavePlan, run: RunState): string | undefined`
- `build()` gains a parameter: `private build(plan: WavePlan, teach: string | undefined)`

### Steps
1. In `src/ui/hud/NextWavePreview.ts`, after `const GROUP_GAP = 8;` add (one entry per tag the preview can show; a later tag adds its own entry here):
```ts
/** The one-time teach line for each tag: the tag's word, then its promise in plain words. Taught once the run has held `first` or more
 *  waves (the tag's first wave), so it is re-derived from the run and never stored. */
const TEACH: { tag: string; first: number; text: string }[] = [
  { tag: 'quiet', first: 4, text: 'quiet: fewer, double gold' },
];
```
2. Add a private method just above `build()`:
```ts
  /** The one-time line that teaches this wave's tag on first preview, or none (taught once per run, derived from the run's held-wave count). */
  private teachLine(plan: WavePlan, run: RunState): string | undefined {
    for (const t of TEACH) {
      if (plan.tags.includes(t.tag) && run.wavesCleared < t.first) return t.text;
    }
    return undefined;
  }
```
3. In `update()`, change `this.box = this.build(plan);` to `this.box = this.build(plan, this.teachLine(plan, game.run));`. Change `build()`'s signature to `private build(plan: WavePlan, teach: string | undefined)`. In `build()`, directly after the `payLine` const add:
```ts
    if (teach) {
      // The tag's one-time teach, under the counts: the payline's mirror, so the card's bottom edge and the counts row don't move.
      pieces.push(scene.add.text(0, (H + LINE) / 2 - 8, teach, textStyle(14, PALETTE.muted)).setOrigin(0.5, 0.5));
    }
```
The line sits centered like the pay line (x=0, origin 0.5/0.5), 22 px below the container center = 8 px above the card's bottom edge, exactly mirroring the pay line's `-H / 2` (8 below the top). During build, `run.wavesCleared` = `run.wave` = waves held, so it is 3 previewing wave 4 (teach) and 7 previewing wave 8 (taught).

### Pitfalls
- Do NOT touch card height (`H + LINE`), `place()`, or `fitScale()`: the card's bottom edge, counts row, pay line, quiet chip and the gap above the send ring must all keep their exact screen positions — the line lives in the card's existing space below the counts row, so nothing moves.
- Do NOT grow `cardW` for the text: `left = -cardW/2 + PAD` re-centers the row, which would drag the chip and counts off their positions. The text stays centered on x=0.
- The decision happens once when the box is built per `planNumber`; the line lives and dies with the box — no per-frame state, nothing to clean up.
- No save field: "taught" is derived (`wavesCleared`), so a resumed run re-derives and never re-teaches; no new input, sound or pause-screen line.

### Tests
none

## Result (attempt 1, yoga)

The build-phase wave preview card (src/ui/hud/NextWavePreview.ts) now teaches its tags once: a per-tag TEACH table (quiet: first=4, "quiet: fewer, double gold") and a `teachLine()` derivation from `run.wavesCleared` (< first → show) drive one new muted line centered under the counts row, styled and placed as the exact mirror of the T0079 pay line, so the card, chip, counts, pay line and Send ring keep their positions. Shown only during the build phase, it appears on wave 4's preview and never again in the run; resumed runs re-derive from the held-wave count with no new save field. `npm run check` and desktop+mobile `npm run smoke` both pass; no input or sound added.

- Self-review: APPROVE
- Time: 29.1 min

```
.../chokepoint/game/src/ui/hud/NextWavePreview.ts  | 22 ++++++++++++++++++++--
 1 file changed, 20 insertions(+), 2 deletions(-)
```
