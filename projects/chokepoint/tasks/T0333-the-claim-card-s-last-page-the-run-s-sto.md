---
id: T0333
title: "The claim card's last page: the run's story, one mark per wave"
size: L
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-01T02:32:15Z
epic: E12
---

## Goal
The end of a run shows the run's shape, not just its numbers: under the claim card, a second small card marks every wave faced — green where it was clean, muted gray where it was held, red where the run ended — so a player sees at a glance which waves broke.

## Details
- The run's ledger gains a per-wave record, written as the run goes: when a wave ends, one record — the wave number and how many enemies leaked on it; when the run dies mid-wave, the death wave is recorded with the leaks it had taken so far. The record is carried through the resume save, so a resumed run's story is whole.
- The rewards screen grows a second white card under the claim card: centered, a small gap below the first. Top to bottom:
  - a bold ink "Waves" title (the claim card's title style, scaled down);
  - the marks: one small rounded square (~6 px, ~3 px gap) per wave faced, in run order, wrapping at 14 per row — green (the clean wave's own green) if the wave ended with 0 leaks, muted gray if it ended with one or more, red on the wave the run ended on (red wins over gray);
  - a muted legend naming the three marks, each preceded by a mini mark of its own color (clean, held, lost);
  - a muted line "loudest · wave N · M leaks" — N the wave with the most leaks (the earliest if tied), M that count.
- The card is sized from its content; a 60-wave run still fits both cards at 412x915 and 1280x720 (the marks wrap, nothing scrolls). A run that ended without facing a wave shows just the title and the legend.
- No sound, no input, nothing else on the screen changes. The claim card's own lines (waves, clean count, score, coins) are untouched — the story card shows the sequence and the loudest wave, which nothing shows today.

## Acceptance criteria
- [ ] After any run, the rewards screen shows the second card under the claim card with one mark per wave faced, in order: green for 0-leak waves, muted gray for held waves, red on the death wave.
- [ ] A resumed run's story is whole: marks for waves before the resume are present and correct after resuming and finishing.
- [ ] The legend and the "loudest · wave N · M leaks" line are present and match the run (most leaks, earliest wins ties).
- [ ] The per-wave record is written as the run goes (not recomputed at the end from wave numbers) and is present in the resume save.
- [ ] Both cards fit at 412x915 and 1280x720 on a long run; the smoke test's layout check passes.
- [ ] No new sound or input; the claim card's existing lines are unchanged.

## Design (architect, desktop)

### Files
- create `src/core/waveStory.ts` - pure `loudestWave()` over the run's per-wave story.
- edit `src/core/run.ts` - `WaveRecord` type + `story` field on `RunState`; write one record in `clearWave()` and the death record in `leak()`.
- edit `src/core/saveRun.ts` - `story` field on `SavedRun`, validation in `loadSavedRun`, carry it in the returned object.
- edit `src/systems/RunSave.ts` - copy `story` in `persist()` and `restore()`.
- edit `src/scenes/RewardsScene.ts` - the second "Waves" story card under the claim card, sized from its content, both cards scaled to fit.
- edit `src/debug/runChecks.ts` - one `run.story` invariant, next to `run.ledger` (line 24).
- edit `tests/core/run.test.ts` - story-recording cases.
- create `tests/core/waveStory.test.ts` - `loudestWave` cases.
- edit `tests/core/saveRun.test.ts` - `story` in `sample()` + broken-story rejections.

### Interfaces
```ts
// src/core/run.ts (above class RunState)
export interface WaveRecord { wave: number; leaks: number; }
// RunState: `story: WaveRecord[] = [];`  (after `cleanWaves`, line 46)
// src/core/waveStory.ts
import type { WaveRecord } from './run';
export function loudestWave(story: readonly WaveRecord[]): WaveRecord | undefined; // most leaks, earliest wins ties; undefined for []
// src/core/saveRun.ts — SavedRun gains: `story: WaveRecord[];` (after `cleanWaves`, line 54)
```

### Steps
1. `run.ts`: add the interface; in `clearWave()` add `this.story.push({ wave: this.wave, leaks: this.leaksThisWave });` just before `this.leaksThisWave = 0;` (line 151); in `leak()` replace line 123 with:
```ts
if (this.lives === 0) {
  this.phase = 'over';
  this.story.push({ wave: this.wave, leaks: this.leaksThisWave }); // the death wave, fatal leak included
}
```
2. Create `waveStory.ts`: `let best: WaveRecord | undefined; for (const r of story) if (r.leaks > (best?.leaks ?? -1)) best = r; return best;` (strict `>` keeps the earliest on a tie).
3. `saveRun.ts`: extend the `./run` import (line 5) with `WaveRecord`; add the field; after line 110 add
```ts
if (p.story !== undefined && (!Array.isArray(p.story) || p.story.length > 1e6 || !p.story.every((r) => !!r && typeof r === 'object' && inInt((r as { wave?: unknown }).wave, 1, 1e6) && inInt((r as { leaks?: unknown }).leaks, 0, 1e6)))) return undefined;
```
and in the returned object after `cleanWaves` (line 142): `story: Array.isArray(p.story) ? (p.story as WaveRecord[]) : [],` (older saves predate the field → `[]`).
4. `RunSave.ts`: in `persist()` after `cleanWaves` (line 50) add `story: run.story.map((r) => ({ wave: r.wave, leaks: r.leaks })),`; in `restore()` after line 74 add `run.story = saved.story.map((r) => ({ wave: r.wave, leaks: r.leaks }));`.
5. `RewardsScene.ts`: import `loudestWave` from `'../core/waveStory'` (after the `../core/profile` import). After `const col = stack(rows, pad);` (line 162), build the story card with the module-level `stack()` and `makeCard()`:
```ts
const story = run.story;
const deathWave = run.over ? run.wave : -1;
const loudest = loudestWave(story);
const CARD_GAP = 16; const MARK = 6; const MARK_GAP = 3; const MARKS_PER_ROW = 14;
const storyTitle = this.add.text(0, 0, 'Waves', titleStyle(22)).setOrigin(0.5);
const legendStyle = textStyle(13, PALETTE.muted);
const cleanT = this.add.text(0, 0, 'clean', legendStyle).setOrigin(0, 0.5);
const heldT = this.add.text(0, 0, 'held', legendStyle).setOrigin(0, 0.5);
const lostT = this.add.text(0, 0, 'lost', legendStyle).setOrigin(0, 0.5);
const loudestText = loudest ? this.add.text(0, 0, `loudest · wave ${loudest.wave} · ${loudest.leaks} leaks`, legendStyle).setOrigin(0.5) : undefined;
const marksRows = Math.ceil(story.length / MARKS_PER_ROW);
const marksH = marksRows * MARK + Math.max(0, marksRows - 1) * MARK_GAP;
const storyRows: Array<{ height: number; after: number }> = [{ height: storyTitle.height, after: 12 }];
let marksIdx = -1;
if (story.length > 0) { marksIdx = storyRows.length; storyRows.push({ height: marksH, after: 12 }); }
const legendIdx = storyRows.length;
storyRows.push({ height: Math.max(cleanT.height, heldT.height, lostT.height), after: loudest ? 10 : 0 });
let loudestIdx = -1;
if (loudest && loudestText) { loudestIdx = storyRows.length; storyRows.push({ height: loudestText.height, after: 0 }); }
const storyCol = stack(storyRows, 20);
const storyY = col.height / 2 + CARD_GAP + storyCol.height / 2;
const storyTop = storyY - storyCol.height / 2;
const storyPanel = makeCard(this, 0, storyY, panelW, storyCol.height, 28);
storyTitle.setY(storyTop + storyCol.ys[0]);
const marksG = this.add.graphics().setPosition(0, storyY);
if (marksIdx >= 0) {
  const markCenterY = storyCol.ys[marksIdx] - storyCol.height / 2;
  story.forEach((r, i) => {
    const row = (i / MARKS_PER_ROW) | 0;
    const inRow = Math.min(MARKS_PER_ROW, story.length - row * MARKS_PER_ROW);
    const w = inRow * MARK + (inRow - 1) * MARK_GAP;
    const x = -w / 2 + (i % MARKS_PER_ROW) * (MARK + MARK_GAP);
    const y = markCenterY - marksH / 2 + row * (MARK + MARK_GAP);
    const color = r.wave === deathWave ? PALETTE.red : r.leaks === 0 ? PALETTE.green : PALETTE.muted; // red wins over gray
    marksG.fillRoundedRect(x, y, MARK, MARK, 2, color);
  });
}
{
  const items = [cleanT, heldT, lostT];
  const colors = [PALETTE.green, PALETTE.muted, PALETTE.red];
  const itemW = items.map((t) => MARK + 4 + t.width);
  let lx = -(itemW[0] + 12 + itemW[1] + 12 + itemW[2]) / 2;
  const legendY = storyTop + storyCol.ys[legendIdx];
  items.forEach((t, i) => { marksG.fillRoundedRect(lx, legendY - MARK / 2, MARK, MARK, 2, colors[i]); t.setPosition(lx + MARK + 4, legendY); lx += itemW[i] + 12; });
}
if (loudestText && loudestIdx >= 0) loudestText.setPosition(0, storyTop + storyCol.ys[loudestIdx]);
```
After `if (this.ironTag) parts.push(this.ironTag);` (line 205) push `storyPanel, storyTitle, marksG, cleanT, heldT, lostT` (and `loudestText` when set) into `parts`. In `layout()` replace the `box.setPosition(...).setScale(...)` line with:
```ts
box.setPosition(width / 2, height / 2 - (CARD_GAP + storyCol.height) / 2).setScale(Math.min(1, (width - 24) / panelW, (height - 24) / (col.height + CARD_GAP + storyCol.height)));
```
6. `runChecks.ts`, after the `run.ledger` line: `['run.story', (g) => (g.run.story.every((r, i) => r.wave === i + 1) ? null : \`story waves ${g.run.story.map((r) => r.wave).join(',')}\`)],`.
7. Tests: in `run.test.ts` add — clear records `{wave, leaks}` in order (`startWave/leak(1)/clearWave/startWave/clearWave` → `[{wave:1,leaks:1},{wave:2,leaks:0}]`); death records the current wave with leaks including the fatal one (`clearWave` wave 1, then wave 2 `leak(1)`, `leak(START.lives-1)` → `[{wave:1,leaks:0},{wave:2,leaks:2}]`); after death further `leak()` adds nothing. In `waveStory.test.ts`: most leaks, earliest wins a tie, `[]` → `undefined`. In `saveRun.test.ts`: add `story: [{ wave: 1, leaks: 0 }, { wave: 2, leaks: 1 }, { wave: 3, leaks: 0 }],` to `sample()` (the round-trip test then covers it) and a `broken({ story: ... })` case for `'no'`, `[{wave:0,leaks:0}]`, `[{wave:1,leaks:-1}]`.

### Pitfalls
- The death record goes in `leak()` (the only place that sets `phase='over'`); `clearWave()` and the death record are mutually exclusive because `RunFlow` checks `run.over` before clearing. Push before `leaksThisWave = 0`.
- A mid-wave resume replays the wave: `restore()` sets the story (waves 1..wave-1) and `waves.start()` resets `leaksThisWave` — the in-flight wave correctly gets no record until it ends.
- Scene instance reuse: keep every story-card object a `create()`-local (as `flawlessText` is); instance fields would linger into the next run.
- The box scale must use the combined height of both cards, and the box y must shift up by `(CARD_GAP + storyCol.height)/2`, or the pair overflows 720 px. 60 waves → 5 mark rows (42 px); worst total ≈ 869 px → scale ≈ 0.80 at 1280x720, scale 1 at 412x915.
- Don't touch the claim card's rows, its count-up in `update()`, or add sound/input.

### Tests
- `tests/core/run.test.ts` (3 recording cases), `tests/core/waveStory.test.ts` (loudest/tie/empty), `tests/core/saveRun.test.ts` (story round-trip + broken rejections).
