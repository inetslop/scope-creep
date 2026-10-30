---
id: T0245
title: "The pause card: one tidy column that fits, and a Sound row like the other buttons"
assignee: desktop-4070
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-30T00:51:08Z
claimed_at: 2026-10-30T01:34:35Z
finished_at: 2026-10-30T02:26:29Z
---

## Goal
The pause card has outgrown its layout. Seen at about 510x480:
- the controls lines run past both sides of the card ("Space or the big button — start the wave early, +2 gold per second left" is wider than it);
- the stats line crowds the "Paused" title, and "worth +N coins" and "Controls" crowd it in turn;
- there's a big gap between "Controls" and its lines, and another above Resume;
- the Sound row is wider than the buttons above it, with "Sound" and "On" far apart.

Make it one even column that always fits inside its card, whatever controls are listed.

## Details
- **Why it broke:** in `src/scenes/PauseScene.ts` the card is a fixed 360x460, and every part is placed at a hand-picked offset from its top (+54, +78, +96, +114, +176, +276, +344, +406). Other tasks keep adding and removing control lines.
- **Lay the card out as one column, built from its parts in order:** each part's y comes from the part above it (its height plus a gap), and the card's height is the content plus the same padding at the top and the bottom. Use two gap sizes only: a small one inside a group, a bigger one between groups.
- **The groups, top to bottom:**
  1. "Paused", the stats line (wave, star, lives, gold) and "worth +N coins";
  2. "Controls" and its lines;
  3. Resume, Quit run and Sound.
- **The controls lines fit:** each one is never wider than the card minus its padding. A line too wide wraps (centered), or shrinks to fit, never below 11 px. Build them from a list of lines so adding or removing one needs no other change.
- **The Sound row matches the buttons:** the same width and height as Quit run. The speaker glyph sits beside "Sound on" or "Sound off" as one centered pair, muted when off, as now.
- **Keep:**
  - what each line says and when it shows (worth only after wave 1, the star at the best wave);
  - Resume, Quit and the sound toggle as they are;
  - the scaling that keeps the card on screen;
  - the `?smoke` auto-resume.

## Acceptance criteria
- [ ] At 412x915, 1280x720 and 510x480, no text crosses the card's edges (at least 16 px inside), with a 5-digit gold count and every control line listed.
- [ ] The padding above "Paused" equals the padding below the Sound row; the gaps inside each group match, and so do the gaps between groups.
- [ ] Resume, Quit run and Sound are the same width; the Sound row reads "Sound on" or "Sound off" beside its glyph.
- [ ] Adding a line to the controls list needs no other change to stay inside the card.

## Design (architect, desktop-4070)

### Files
- edit `src/scenes/PauseScene.ts` — replace the fixed 360x460 card and its eight hand-picked y offsets with one column laid out from its parts; merge the split "Sound"/"On" labels into one centered pair beside the speaker glyph; all three action rows become 240-wide buttons.

### Interfaces
No new exports. One module-level const above the class: `const CONTROLS: string[]` — the four current lines verbatim ("Space or the big button — start the wave early, +2 gold per second left", "F — fast-forward (2x) during waves", "1-9 — pick a card from the hand", "+ / - — zoom the board"). New local constants in `create()`: `panelW = 360`, `PAD = 28` (card top/bottom padding), `GAP_S = 10` (inside a group), `GAP_B = 22` (between groups), `maxW = panelW - 32`.

### Steps
1. Keep imports, class shell, `uiCamera`, `hook.overlay`, `resume`, `quit`, shade, `onKey`, `?smoke` auto-resume, and the final `layout()`/`onResize` wiring exactly as they are (they already scale the whole `box`).
2. Create every part unpositioned (x=0), in this order: `title = this.add.text(0, 0, 'Paused', titleStyle(34)).setOrigin(0.5)`; then the stats line built from a list of parts exactly as now — `waveText` (origin 0,0.5), star image at `x + 13` when `starred`, `restText` — but only set their x's and the container after step 4's fit; `worthText = game.run.wave > 0 ? this.add.text(0, 0, `worth +${coins} coins`, textStyle(13, PALETTE.muted)).setOrigin(0.5) : undefined`; `heading` ("Controls", `textStyle(13, PALETTE.ink, { fontStyle: 'bold' })`); one Text per entry of `CONTROLS`: `this.add.text(0, 0, line, textStyle(12, PALETTE.muted, { align: 'center' })).setOrigin(0.5)`, collected in `const lines: Phaser.GameObjects.Text[] = []`.
3. Fit helper (local): `const fitTo = (texts: Phaser.GameObjects.Text[], start: number, extra = 0): void => { let size = start; while (texts.reduce((w, t) => w + t.width, extra) > maxW && size > 11) { size -= 0.5; for (const t of texts) t.setFontSize(size); } };` Apply: `fitTo([waveText, restText], 13, starred ? 21 : 0)`; for each control line `fitTo([t], 12)` then `if (t.width > maxW) t.setWordWrap({ width: maxW });`.
4. Assemble the stats container now that widths are final: set kid x's (`rest` starts at `waveText.width + (starred ? 21 : 0)`), `const statsH = waveText.height;`, `const stats = this.add.container(-totalW / 2, 0, kids);`.
5. Buttons, all created at (0,0) then placed in step 6: `makeButton(this, 0, 0, 'Resume', resume, { width: 240, height: 56, radius: 28, fill: PALETTE.ink })`; `makeButton(this, 0, 0, 'Quit run', quit, { width: 240, height: 52, radius: 26 })`; `const soundRow = makeButton(this, 0, 0, '', toggleSound, { width: 240, height: 52, radius: 26 })`.
6. Sound row content: keep `glyph` and `paintGlyph` unchanged (it draws from x −12 to +8 at its origin). Delete `wordText`/`stateText`; add one label `const soundText = this.add.text(0, 0, 'Sound on', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);`. In `refreshRow()`: `paintGlyph(isOn)`, then `soundText.setText(isOn ? 'Sound on' : 'Sound off'); soundText.setColor(cssColor(isOn ? PALETTE.ink : PALETTE.muted)); const leftEdge = -(28 + soundText.width) / 2; glyph.setPosition(leftEdge + 12, 0); soundText.setPosition(leftEdge + 28, 0);` (28 = glyph width 20 + gap 8, centered pair). Then `soundRow.content.add([glyph, soundText]); refreshRow();` as now.
7. Card height from content, then place: `let h = PAD + title.height + GAP_S + statsH; if (worthText) h += worthText.height + GAP_S; h += GAP_B + heading.height; for (const t of lines) h += GAP_S + t.height; h += GAP_B + 56 + GAP_S + 52 + GAP_S + 52 + PAD; const panelH = Math.ceil(h);` then `const panel = makeCard(this, 0, 0, panelW, panelH, 28);` and place top-down: `let y = -panelH / 2 + PAD; const cy = (hh: number): number => { const c = y + hh / 2; y += hh; return c; };` then `title.setY(cy(title.height)); y += GAP_S; stats.setY(cy(statsH)); if (worthText) { y += GAP_S; worthText.setY(cy(worthText.height)); } y += GAP_B; heading.setY(cy(heading.height)); for (const t of lines) { y += GAP_S; t.setY(cy(t.height)); } y += GAP_B; resumeButton.container.setY(cy(56)); y += GAP_S; quitButton.container.setY(cy(52)); y += GAP_S; soundRow.container.setY(cy(52));`.
8. `boxKids` = `[panel, title, stats, heading, ...lines, resumeButton.container, quitButton.container, soundRow.container]`, push `worthText` if present, into the `box` container as before.

### Pitfalls
- Measure widths only AFTER fitting: Phaser Text updates `.width` on `setFontSize`/`setWordWrap`, so steps 4 and 7 must run after step 3; a control line that wraps grows to 2 lines and its `.height` is used — this is what keeps the card tall enough.
- The shrink floor is 11 px; at 11 px even "Wave 99999 · 30 lives · 99999 gold" is well under 328 px, so wrap is only ever needed for the long "Space…" line — never both.
- `makeButton` returns a container already sized; move it with `.container.setY(...)`, never rebuild it. The button's own empty default label can stay (the sound row passes `''`).
- Glyph coordinates in `paintGlyph` are local (−12…+8); only its position changes, so the muted/unmuted look is unchanged.
- Keep every value that gates content (`wave > 0` for worth, `starred` for the star) exactly as-is; don't touch `coinsForRun`/`loadProfile` inputs.

### Tests
none

## Result (attempt 1, desktop-4070)

Reworked the pause card in `src/scenes/PauseScene.ts` from a fixed 360x460 panel with eight hand-picked y-offsets into one even column built from its parts in order — groups of "Paused"/stats/worth, "Controls" and its lines, and Resume/Quit/Sound — with 28 px top/bottom padding, 10 px gaps inside groups and 22 px between them, and the card height computed from the content so it always fits. The controls are now a module-level `CONTROLS` list: each line is fitted (shrink to at most 11 px, then centered wrap) so it never crosses the card's edges, and adding or removing a line needs no other change. The Sound row is now the same 240-wide button as the others, with "Sound on"/"Sound off" as one label centered beside the speaker glyph instead of labels split across the row. `npm run check` and `npm run smoke` both pass. One deviation from the design: Phaser's `Text` has no `setWordWrap` method (that's BitmapText), so wrapping is enabled with `t.setStyle({ wordWrap: { width: maxW } })`, the same mechanism used elsewhere in the codebase.

- Self-review: APPROVE
- Time: 51.9 min

```
projects/chokepoint/game/src/scenes/PauseScene.ts | 122 +++++++++++++++++-----
 1 file changed, 97 insertions(+), 25 deletions(-)
```
