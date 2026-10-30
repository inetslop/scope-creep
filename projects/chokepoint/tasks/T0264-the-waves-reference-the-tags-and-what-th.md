---
id: T0264
title: "The waves reference: the tags and what they do, off the pause"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T06:24:50Z
---

## Goal
A first-time player meets the wave tags one at a time — quiet at wave 4, tight at wave 8, boss at wave 10 — each taught once at its first preview; the pause screen gains a "Waves" screen (the enemies reference's pattern, T0252) that lists all three tags with what each means and when it comes, so the wave you haven't faced is readable at any pause, the way the shape you haven't met already is.

## Details
- The pause card gets a new "Waves" row in the "Enemies" row's pattern (T0252): its own row on the card, plus a matching line in the controls list (pillar 8). It opens a new scene over the dimmed pause (the EnemiesScene pattern: dim shade, one white rounded card) and closes back to the pause.
- One row per tag, in the order the run meets them: quiet, tight, boss. Each row shows the tag's own chip (the exact chip the preview wears, T0092), the tag's name, and its meaning in the preview's own tag-teach wording (T0092's table, grown by T0108's tight line) — the reference never calls a tag anything the preview doesn't. Boss's meaning line: "one big shape, instead of a crowd".
- Under each, a muted second line: when it comes — "every 4th wave" (quiet, T0071), "every 8th, from 6" (tight, T0108), "every 10th wave" (boss, E5) — and the next one in this run: "next: wave N".
- "next: wave N" is derived, never hardcoded: the first wave after the current one that the game's own wave rules tag with that tag (the same pure functions the preview and the banner use, in core/waves.ts), so the reference can never disagree with what actually comes. From a fresh run, next quiet is wave 4. Put the three rows' data (chip, name, meaning, when) in one small content file next to the tag rules so it is read in one place.
- Boss row while no boss is on the board yet (the Colossus is being built, T0253): the row still ships with chip, name, meaning and when/next; it shows the boss's own on-board token only once the boss exists in the content — no placeholder art before then.
- If the level rule (T0260) lands before this task is built, the boss row's when/next reads the wave rules like the other two rows (the bosses then end the levels) — the row data lives in the one content file, so that is a one-line switch, decided at build time.
- The reference is read-only: nothing on it is tappable except back to the pause; it plays no sound and paints nothing on the board. It teaches with what the preview already shows — no new teach line, no permanent mark.
- Fit: the card holds a heading and three two-line rows; it fits at 412x915 and 1280x720, and the pause card with the extra row still fits its tidy column (T0245).

## Acceptance criteria
- [ ] The pause card offers a "Waves" row (the Enemies row's look) with a matching controls line; it opens the waves reference over the dimmed pause and closes back to the pause.
- [ ] The reference shows exactly three rows — quiet, tight, boss — each with the tag's own chip, the preview's own teach wording, its "when" line, and a "next: wave N" that matches the game's wave rules (fresh run: next quiet is wave 4; a run resumed at a deep wave: every next column still matches the rules).
- [ ] While no boss exists in the content, the boss row shows no shape token; quiet and tight rows are unaffected.
- [ ] Nothing on the reference is tappable except back to the pause; it plays no sound and paints nothing on the board.
- [ ] The reference card fits at 412x915 and 1280x720, and the pause card with the new row fits its column.

## Design (architect, inet-racing)

### Files
- create `src/core/waveTags.ts` — the three tag rows (chip color, name, meaning, when, rule) + `nextTaggedWave()`, next to the tag rules in `core/waves.ts`
- create `src/scenes/WavesScene.ts` — the waves reference: dim shade, one white card, heading + three two-line rows, back button (the `EnemiesScene` pattern, `src/scenes/EnemiesScene.ts`)
- create `tests/core/waveTags.test.ts` — unit tests for `nextTaggedWave` and the row data (model imports on `tests/core/quietWaves.test.ts`)
- edit `src/scenes/keys.ts` — add `waves: 'Waves',` right after `enemies` in `SCENES`
- edit `src/scenes/PauseScene.ts` — one controls line + a "Waves" button row + its height/placement (the `enemiesButton` pattern)
- edit `src/main.ts` — import `WavesScene` and add it to the `scene` array after `EnemiesScene`

### Interfaces
```ts
// src/core/waveTags.ts
import { PALETTE } from '../content/palette';
import { isBossWave, isQuietWave, isTightWave } from './waves';
export interface WaveTagRow {
  tag: string;
  chip: number; // the exact fill the preview's chip wears for this tag
  name: string;
  meaning: string; // the preview's own tag-teach wording (T0092's table, grown by T0108)
  when: string;
  rule: (wave: number) => boolean; // the game's own wave rule for this tag
}
export const WAVE_TAG_ROWS: WaveTagRow[] = [
  { tag: 'quiet', chip: PALETTE.blueDeep, name: 'quiet', meaning: 'fewer, double gold', when: 'every 4th wave', rule: isQuietWave },
  { tag: 'tight', chip: PALETTE.muted, name: 'tight', meaning: 'they come bunched', when: 'every 8th, from 6', rule: isTightWave },
  { tag: 'boss', chip: PALETTE.purpleDeep, name: 'boss', meaning: 'one big shape, instead of a crowd', when: 'every 10th wave', rule: isBossWave },
];
/** The first wave after `current` that the tag's own rule tags (the reference's 'next: wave N'). */
export function nextTaggedWave(current: number, rule: (wave: number) => boolean): number;
```
Row data wording: quiet/tight meanings are the `TEACH` texts in `src/ui/hud/NextWavePreview.ts` with the leading "tag: " dropped; the tag word is the row's `name`. `colossus` already exists in `content/enemies`, so the boss token shows (via lookup, not hardcoded).

### Steps
1. Write `src/core/waveTags.ts` exactly as above; `nextTaggedWave` body: `let n = current + 1; while (!rule(n)) n += 1; return n;`
   - Build-time check: if T0257 has landed and `NextWavePreview.ts` now wears a boss chip, copy its exact chip color into the boss row (one line). If T0260 (level rule) has landed, the boss row's `when`/`rule` already read `isBossWave` — adjust the `when` string to match the new rule (one line).
2. Write `src/scenes/WavesScene.ts` on the `EnemiesScene` model: `super(SCENES.waves)`; `create()` does `uiCamera(this)`, `hook.overlay = SCENES.waves`, `closed = false`, shade (`PALETTE.ground, 0.78`, `setInteractive()`, no listener — it blocks the board), `doBack` (`closed` guard; **no sfx call — the reference plays no sound**; `hook.overlay = SCENES.pause`; `this.scene.start(SCENES.pause)` — GameScene stays paused), the round ink back button with white arrow (copy `EnemiesScene.ts:48-52`), `build()`, `layout` (`box` scaled `Math.min(1, (w-24)/panelW, (h-24)/panelH)`, back at `(width - EDGE - 24, 40)`), `onResize(this, layout)`, and `if (flags.smoke) this.time.delayedCall(1000, doBack);`.
   - `build()`: `const run = getRun(this);` `const bossDef = ENEMIES.find((e) => e.id === 'colossus');` Constants `panelW = 340, PAD = 16, HEADER = 64, BOTTOM = 20, ROW_GAP = 10, GAP = 8, CHIP_H = 18, TOKEN_R = 14`; `innerW = panelW - PAD * 2`. For each row in `WAVE_TAG_ROWS`: chip = Graphics `fillRoundedRect(-chipW/2, -9, chipW, CHIP_H, 9)` filled `row.chip` under a `textStyle(11, PALETTE.card, { fontStyle: 'bold' })` label (the preview's exact chip: `chipW = Math.ceil(label.width) + 14`), in a `container`; `name = titleStyle(14)`; `when = textStyle(12, PALETTE.muted)` reading `` `${row.when} · next: wave ${nextTaggedWave(run.wave, row.rule)}` ``; `meaning = textStyle(12, PALETTE.muted, { wordWrap: { width: innerW - chipW - GAP - name.width - GAP - tokenW } })` with `tokenW = row.tag === 'boss' && bossDef ? TOKEN_R * 2 + GAP : 0`. Measure all at (0,0), then per row `l1 = Math.max(CHIP_H + 2, name.height, meaning.height)`, `h = l1 + 4 + when.height`; place with `left = -panelW/2 + PAD`: chip container at `(left + chipW/2, rowTop + l1/2)`, name origin (0, 0.5) at `(left + chipW + GAP, rowTop + l1/2)`, meaning origin (0, 0.5) at `(left + chipW + GAP + name.width + GAP, rowTop + l1/2)`, when at `(left, rowTop + l1 + 4)`, and only for the boss row when `bossDef`: `artScale(this.add.image(..., enemyTexture('colossus')), TOKEN_R / (bossDef.look.size * CELL))` at `(left + innerW - TOKEN_R, rowTop + h / 2)`. `panelH = HEADER + Σ(h + ROW_GAP) - ROW_GAP + BOTTOM`; heading `'Waves'` `titleStyle(28)` at `(0, -panelH/2 + 42)`; everything in one `box` container. Nothing interactive except the back button.
3. `src/scenes/keys.ts`: add `waves: 'Waves',` after `enemies`.
4. `src/scenes/PauseScene.ts`: in `CONTROLS`, add `'Waves — the tags and when they come',` right after the `Enemies` line. After `enemiesButton` (line 164) add `showWaves` (`if (closed) return; this.scene.launch(SCENES.waves); this.scene.pause();`) and `const wavesButton = makeButton(this, 0, 0, 'Waves', showWaves, { width: 240, height: 52, radius: 26 });`. In the height sum (line 171) add `GAP_S + 52`; after `enemiesButton.container.setY(cy(52));` add `y += GAP_S; wavesButton.container.setY(cy(52));`; add `wavesButton.container` to `boxKids`.
5. `src/main.ts`: import `WavesScene` and add it after `EnemiesScene` in the `scene` array (draw order: overlays draw on top of the pause).
6. Write `tests/core/waveTags.test.ts`, then run `npm run check` and `npm run smoke`.

### Pitfalls
- `next: wave N` must come from `nextTaggedWave(run.wave, row.rule)` — never a hardcoded wave number; the row's `rule` is the same predicate the preview/banner use, so the reference can't disagree with the plan.
- No sfx import or call in `WavesScene` (the reference plays no sound); don't paint on the board. `hook.overlay` must be set in `create` and reset to `SCENES.pause` in `doBack`.
- Boss token only via the `ENEMIES.find(...)` lookup — if the boss leaves the content the row degrades to chip/name/when/next with no shape, no placeholder.
- Pause card fullest state: title + stats + worth + 6 controls lines + 5 button rows ≈ 660 px tall — fits 1280x720 (696 usable) and 412x915 at scale 1; the card scales down anyway, so just add the row to the existing top-down layout, never a hand-picked y.
- Don't touch `NextWavePreview.ts`, `core/waves.ts` or `HudScene` — T0257/T0260 are editing them; the boss chip color and level rule are absorbed at build time by the one-line switch in `waveTags.ts` (step 1).

### Tests
- `tests/core/waveTags.test.ts`: `nextTaggedWave(0, isQuietWave) === 4`, `nextTaggedWave(4, isQuietWave) === 8`, `nextTaggedWave(5, isTightWave) === 6`, `nextTaggedWave(6, isTightWave) === 14`, `nextTaggedWave(0, isBossWave) === 10`, `nextTaggedWave(19, isBossWave) === 20`; row order is `['quiet', 'tight', 'boss']` and each row's `rule` returns true for its first taught wave (4, 6, 10).
