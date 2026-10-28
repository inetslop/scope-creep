---
id: T0051
title: Best combo on the claim card
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: [T0039]
attempts: 1
created: 2026-10-28T12:34:55Z
claimed_at: 2026-10-28T16:48:25Z
epic: E1
---

## Goal
The claim card remembers the run's loudest moment: the longest kill-combo chain the run reached.

## Details
- The rewards claim card (T0003) counts up its lines: waves held, stopped, and — when any — a green "Clean N" line (T0033), with a "Score N" line above the coins line once T0047 lands.
- This task adds a "Best combo ×N" line: N is the longest kill-combo chain of the run (the rising ×N counter from T0031), recorded in the run ledger (T0001) as the counter rises — the card reads the ledger and never recomputes.
- The line sits just above the "Score N" line, counts up with the others, and is shown only when N is 2 or more.
- Color: muted ink under ×10; at ×10 and up the same yellow the ×10 milestone uses on the board (T0034).
- The end-of-run screen before the claim is unchanged.

## Acceptance criteria
- [ ] A run whose longest chain was 5 shows a muted "Best combo ×5" line on the claim card, counting up in step with the other lines, just above the "Score N" line.
- [ ] A run whose longest chain reached 10 or more shows the line in the milestone yellow (T0034's color).
- [ ] A run with no chain of 2 or more shows no combo line, and every other line and the card layout are unchanged.

## Design (architect, desktop)

### Files
- edit `src/core/run.ts` - ledger: add `bestCombo` field + `noteCombo()` to `RunState`
- edit `src/systems/FxSystem.ts` - expose the live chain via a `chain` getter (next to `count`)
- edit `src/systems/EnemySystem.ts` - one line in `strike()`: record the chain into the ledger on every kill
- edit `src/scenes/RewardsScene.ts` - the "Best combo ×N" line on the claim card (layout, count-up)
- edit `tests/core/run.test.ts` - one test for `noteCombo`

### Interfaces
```ts
// RunState (core/run.ts), field after `kills = 0;` (line 27), method after `addKill()` (line 79):
bestCombo = 0; // the longest kill chain the run reached (the ×N counter's high mark)
noteCombo(n: number): void { if (n > this.bestCombo) this.bestCombo = n; }
// FxSystem (after `get count()`), EnemySystem.strike() after `const milestone = this.fx.killCount(e.x, e.y);`:
get chain(): number { return this.comboN; }
this.run.noteCombo(this.fx.chain);
```

### Steps
1. `core/run.ts`: add the field and method exactly as above (do not touch `clearWave()`).
2. `FxSystem.ts`: add the `chain` getter with comment `/** The current kill chain (the rising ×N counter), 0 between chains. */`. Do not change `killCount`'s signature or its boolean return (the milestone feeds `burst()`'s `double`).
3. `EnemySystem.ts` `strike()`: insert `this.run.noteCombo(this.fx.chain);` between the `killCount` line (114) and the `burst` line (115) — after `killCount`, so it sees the incremented chain.
4. `RewardsScene.ts` (mirror how `cleanText` is handled everywhere):
   - fields: `private combo = 0;` after `clean` (line 22); `private comboText?: Phaser.GameObjects.Text;` after `cleanText` (line 28)
   - `create()`: `this.combo = run.bestCombo;` after line 46; `this.comboText = undefined;` after line 50 (scene instances are reused — the reset is required)
   - line 68 becomes: `const mid = 1 + (run.cleanWaves > 0 ? 1 : 0) + (run.bestCombo >= 2 ? 1 : 0);` (keep the rest of the `dy`/`panelH`/`-dy`/`+dy` math — it generalizes)
   - between the `cleanText` line (76) and the `scoreText` line (77) insert: `if (run.bestCombo >= 2) this.comboText = this.add.text(0, 28 - dy + (run.cleanWaves > 0 ? 36 : 0), 'Best combo ×0', titleStyle(22, run.bestCombo >= 10 ? PALETTE.yellow : PALETTE.muted)).setOrigin(0.5);` and change the `scoreText` y to `28 - dy + (run.cleanWaves > 0 ? 36 : 0) + (run.bestCombo >= 2 ? 36 : 0)`
   - `parts`: `if (this.comboText) parts.push(this.comboText);` after the `cleanText` push (line 82)
   - `update()` after the `cleanText?.setText` line (104): `this.comboText?.setText(\`Best combo ×${Math.round(this.combo * k)}\`);` — the same `k` as the other lines, not the coins' `kc`
5. `tests/core/run.test.ts`: after the 'pays kills' test: `it('remembers the run's longest kill chain', ...)` calling `noteCombo(1); noteCombo(3); noteCombo(2); noteCombo(5); noteCombo(4);` and expecting `run.bestCombo` to be `5`.

### Pitfalls
- Colors: muted = `PALETTE.muted`, milestone yellow = `PALETTE.yellow` (the same one `FxSystem.ts:123` uses for the ×10 counter) — both already in `PALETTE`, and `PALETTE` is already imported in `RewardsScene`.
- Show only when `run.bestCombo >= 2`; with no combo line every existing position is byte-identical to today (`mid` falls back to 1 or 2).
- Count-up starts at `×0` like `Clean 0`; color is fixed from the final value at create, never re-colored mid-count.
- Don't touch `GameOverScene`, `core/profile.ts`, or the coins/`lastRun` path; the card reads the live `run` (already `getRun(this)`).

### Tests
- `tests/core/run.test.ts`: the `noteCombo` max test above (the ledger rule lives in `src/core`).
