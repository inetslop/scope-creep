---
id: T0336
title: "The run's story on the mid-run page: the pause's Summary"
assignee: inet-racing
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T03:39:37Z
claimed_at: 2026-11-01T04:26:01Z
finished_at: 2026-11-01T04:42:30Z
epic: E12
---

## Goal
E12's second slice: the run's shape is visible while the run is happening — the claim card's story (T0333) re-used on the pause's Summary page (T0306), so a player can look back at which waves were clean, which were held and which hurt most without ending the run.

## Details
- **Where:** the pause's Summary page (T0306's scene): a new "Story" section under the page's run reads and above the by-tower rows. The section is absent while the page reads "Ready" (before wave 1).
- **The marks:** one small mark per wave faced so far, in a wrapping row — the claim card's story marks (T0333), the same shape, size and colors: green for a clean wave, muted gray for a held wave. No red mark mid-run (the death wave's mark lives on the claim card only). The muted legend beside the row is T0333's own.
- **The loudest line:** one muted line under the marks — the run's loudest wave so far, T0333's own line ("loudest · wave N · M leaks") — shown only when at least one wave has been held; hidden while every wave so far is clean.
- **The data:** read the run's per-wave record (T0333's ledger field, written as each wave ends and carried through the resume save) — no new run or save field; a resumed run shows its whole story so far, a fresh run starts empty.
- **Nothing shown twice:** the wave card's "held · N" chip is the latest held wave only (transient), and the exit's clean chip is the current streak — the whole run's shape so far is on no other screen mid-run. Nothing on the section repeats the pause's own run line.
- No sound, no input, no marks on the board or the HUD: one section in the page's own card, which grows its height for it and keeps its scale-to-fit (the references' fit, T0329's pattern) at 412x915 and 1280x720.

## Acceptance criteria
- [ ] From wave 1 on, the pause's Summary page shows the "Story" section: one mark per wave faced (green clean, muted-gray held) in a wrapping row with T0333's legend, and the loudest-wave line when any wave has been held; before wave 1 the section is absent.
- [ ] The marks and the line agree with the claim card's story for the same run (same colors, and the same loudest wave at the run's end); a resumed run shows its whole story so far; no red mark ever appears on the page.
- [ ] Nothing on the section repeats the pause's run line, the wave card's held chip or the exit's clean chip; no new run or save field; the card fits at 412x915 and 1280x720; typecheck, lint, unit tests and the desktop/mobile smoke pass.

## Design (architect, inet-racing)

### Files
- edit `src/scenes/SummaryScene.ts` — add the Story section (one import, three insertions in `build()`); nothing else changes, no other file touched

### Interfaces
No new types, functions, fields, or registry lines. Reused as-is: `run.story: WaveRecord[]` (`src/core/run.ts`, written at wave end, carried by the resume save), `loudestWave(story)` (`src/core/waveStory.ts`).

### Steps
1. Add the import after the `towerDps` line (line 4): `import { loudestWave } from '../core/waveStory';`
2. In `build()`, after the `'By tower'` heading block (after line 105, before the `// The card grows to its content` comment), create the section's objects — they must exist before the height math:
```ts
    // The run's story, the claim card's own marks (T0333): one per wave faced — green clean,
    // muted held. There is no lost wave mid-run, so no red mark on this page. Absent while no
    // wave has ended yet (before wave 1, the pause reads "Ready").
    const story = run.story;
    const loudest = loudestWave(story);
    const MARK = 6, MARK_GAP = 3, MARKS_PER_ROW = 14; // the claim card's own mark size and wrap
    const marksRows = Math.ceil(story.length / MARKS_PER_ROW);
    const marksH = marksRows * MARK + Math.max(0, marksRows - 1) * MARK_GAP;
    let storyHeading: Phaser.GameObjects.Text | undefined;
    let legendClean: Phaser.GameObjects.Text | undefined;
    let legendHeld: Phaser.GameObjects.Text | undefined;
    let loudestText: Phaser.GameObjects.Text | undefined;
    if (story.length > 0) {
      storyHeading = this.add.text(0, 0, 'Story', textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5);
      legendClean = this.add.text(0, 0, 'clean', textStyle(13, PALETTE.muted)).setOrigin(0, 0.5);
      legendHeld = this.add.text(0, 0, 'held', textStyle(13, PALETTE.muted)).setOrigin(0, 0.5);
      // The claim card's own line, shown once any wave has been held: a story of all-clean
      // waves still has a loudestWave (its first record, 0 leaks) and must not print it.
      if (loudest && loudest.leaks > 0) loudestText = this.add.text(0, 0, `loudest · wave ${loudest.wave} · ${loudest.leaks} leaks`, textStyle(13, PALETTE.muted)).setOrigin(0.5);
    }
```
3. Height math: after the `readLines.forEach` loop (line 112) and before the first `if (entries.length > 0 && heading)` (line 113), add — same order the placement below uses:
```ts
    if (story.length > 0 && storyHeading && legendClean && legendHeld) {
      h += GAP_BIG + storyHeading.height + GAP + marksH + 12 + Math.max(legendClean.height, legendHeld.height) + (loudestText ? 10 + loudestText.height : 0);
    }
```
4. Placement: after the flawless-star block (after line 138) and before the placement `if (entries.length > 0 && heading)` (line 139):
```ts
    if (story.length > 0 && storyHeading && legendClean && legendHeld) {
      y += GAP_BIG;
      storyHeading.setY(cy(storyHeading.height));
      y += GAP;
      const markTopY = y; // top of the marks' first row, in the card's top-down y
      y += marksH;
      y += 12;
      const legendY = cy(Math.max(legendClean.height, legendHeld.height));
      // Marks and legend swatches share one graphics object, drawn in card coordinates
      // (card center is 0,0), the claim card's own mark: 6px rounded squares, gap 3.
      const marks = this.add.graphics();
      story.forEach((r, i) => {
        const row = (i / MARKS_PER_ROW) | 0;
        const inRow = Math.min(MARKS_PER_ROW, story.length - row * MARKS_PER_ROW);
        const w = inRow * MARK + (inRow - 1) * MARK_GAP;
        const x = -w / 2 + (i % MARKS_PER_ROW) * (MARK + MARK_GAP); // left edge; rows center on the card
        marks.fillStyle(r.leaks === 0 ? PALETTE.green : PALETTE.muted);
        marks.fillRoundedRect(x, markTopY + row * (MARK + MARK_GAP), MARK, MARK, 2);
      });
      // The legend is T0333's own, sans "lost": the death wave's mark lives on the claim card only.
      const items = [legendClean, legendHeld];
      const colors = [PALETTE.green, PALETTE.muted];
      const itemW = items.map((t) => MARK + 4 + t.width);
      let lx = -(itemW[0] + 12 + itemW[1]) / 2;
      items.forEach((t, i) => {
        marks.fillStyle(colors[i]);
        marks.fillRoundedRect(lx, legendY - MARK / 2, MARK, MARK, 2);
        t.setPosition(lx + MARK + 4, legendY);
        lx += itemW[i] + 12;
      });
      parts.push(storyHeading, marks, legendClean, legendHeld);
      if (loudestText) {
        y += 10;
        loudestText.setY(cy(loudestText.height));
        parts.push(loudestText);
      }
    }
```
5. Run `npm run check` and `npm run smoke`.

### Pitfalls
- The section sits strictly between the read lines and the by-tower block; do not move the flawless-star placement or touch the `entries` blocks.
- `cy(h)` both centers and advances `y` — call it exactly once per line, in the same order as the height math (GAP_BIG, heading, GAP, marksH, 12, legend, 10, loudest); a second call or a swapped order desyncs card height from content.
- Marks use `fillRoundedRect`'s top-left corner: row y is `markTopY + row * (MARK + MARK_GAP)`, swatch y is `legendY - MARK / 2` — these are the claim card's exact coordinates, copied from `RewardsScene.ts:193-213`.
- No `PALETTE.red` anywhere in the section; `r.leaks === 0 ? green : muted` is the whole color rule mid-run.
- Fit is already handled: `panelH` grows via `h` and the existing `layout()` scale-to-fit (line 60) is untouched. Fullest card (every optional line, ~60 waves, 12 towers) is ≈764px < the 891px budget at 412x915; at 1280x720 the card scales to ≈0.9.
- `noUnusedLocals` is on: every declared variable is used inside its `if (story.length > 0)` branch; do not "clean up" the `| undefined` lets into `!`.

### Tests
none — no core rule changes; `loudestWave` is already covered by `tests/core/waveStory.test.ts`, and this is a UI-only task.

## Result (attempt 1, inet-racing)

The pause's Summary page (T0306) now shows the run's story while the run is happening: a "Story" section between the run reads and the by-tower rows with one 6px mark per wave faced (green clean, muted-gray held, no red mid-run), T0333's legend, and the claim card's "loudest · wave N · M leaks" line when any wave has been held. It reads the existing per-wave ledger `run.story` (so resumed runs show their whole story so far), is absent before wave 1, and grows the card's height through the existing scale-to-fit. Only `src/scenes/SummaryScene.ts` changed.

- Self-review: APPROVE
- Time: 16.5 min

```
.../chokepoint/game/src/scenes/SummaryScene.ts     | 62 ++++++++++++++++++++++
 1 file changed, 62 insertions(+)
```
