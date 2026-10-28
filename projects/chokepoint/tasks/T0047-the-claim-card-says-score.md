---
id: T0047
title: The claim card says Score
assignee: desktop
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T12:01:28Z
claimed_at: 2026-10-28T12:34:58Z
epic: E1
---

## Goal
The number that ranks a run is seen where the run is claimed: the rewards card's count-up gets a Score line.

## Details
- The rewards claim card (the count-up that opens after a finished run) shows a new "Score N" line, where N is the run's score — the same number the end-of-run screen already shows today.
- It counts up with the other lines (waves held, stopped, clean, coins) in the same style and timing.
- Placement: the "Score N" line sits just above the "+N coins" line, so the coins stay the final, most prominent line. With no clean waves the order reads: Waves, Stopped, Score N, +N coins.
- No rule change: the score is computed exactly as it is today; this only adds its display to the claim card.

## Acceptance criteria
- [ ] After any finished run, the rewards claim card counts up a "Score N" line showing the run's score — the same number the game-over screen shows.
- [ ] The Score line sits just above the "+N coins" line and counts up in step with the other lines.
- [ ] The score value is unchanged from today's calculation; only its display on the claim card is new.

## Design (architect, yoga)

### Files
- edit `src/scenes/RewardsScene.ts` - the claim card gets an always-present "Score N" line between the Clean line (when shown) and the "+N coins" line, counting up like the stat lines; the panel grows one 36-px line using the card's existing shift-down-the-bottom-half mechanism. No other file changes; no new types, no wiring, no invariants, no tests.
### Interfaces
none — all changes are inside the existing `RewardsScene` class (one new private field, one text game object, one line in `update()`).
### Steps
1. Add field `private score = 0;` next to the other number fields, and `private scoreText!: Phaser.GameObjects.Text;` next to the other text fields.
2. In `create()`, after `this.clean = run.cleanWaves;` add `this.score = run.score; // the same number the end-of-run screen shows`.
3. Replace `const dy = run.cleanWaves > 0 ? 18 : 0;` with:
   ```ts
   const mid = run.cleanWaves > 0 ? 2 : 1; // middle lines: Score always, Clean when there were clean waves
   const dy = 18 * mid; // each middle line: top half up 18, bottom half down 18, panel grows 36
   ```
   `panelH = 300 + 2 * dy` and every `± dy` line below stay exactly as they are (they now give 336/372 px panels).
4. Change the clean line's y from `10` to `28 - dy` (only created when `run.cleanWaves > 0`, as today).
5. After the clean line, create the score line, always: `this.scoreText = this.add.text(0, 28 - dy + (run.cleanWaves > 0 ? 36 : 0), 'Score 0', titleStyle(22)).setOrigin(0.5);` — plain ink `titleStyle(22)`, exactly the style of the Waves/Stopped lines.
6. In the `parts` array, push `this.scoreText` after `this.cleanText` and before `this.coinText` (e.g. fold it into `parts.push(this.scoreText, this.coinText, this.coinIcon, menuButton.container);` right after the existing clean `if`).
7. In `update()`, after the Clean setText, add `this.scoreText.setText(\`Score ${Math.round(this.score * k)}\`);` — `k`, not `kc` (coins keeps its own slower 1.0 s count-up and stays the last line to land).
### Pitfalls
- Existing strings and lines must not change: 'Rewards', 'Waves held', 'Stopped', 'Clean', '+N coins' all stay byte-identical; the score line is new.
- The score line is unconditional — never gated on `score > 0`.
- If `scoreText` is forgotten in `parts`, it is left at (0,0) outside the centered/scaled `box` — check it renders inside the card.
- Do not re-derive `panelH`, `44 + dy` or `108 + dy`; they already follow `dy` and the layout() scale handles 412x915 and 1280x720 (tallest panel 372 fits).
### Tests
none (UI-only; no core rule changes).
