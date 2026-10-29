---
id: T0083
title: The score says what it is made of
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
epic: E1
---

## Goal
The number that ranks runs is explained where it is seen: the Score line on the claim card (T0047) and the game-over card get a small muted recipe under them, the claim card's coins-recipe pattern (T0075) applied to the score.

## Details
- Under the "Score N" line, one small muted line: the score's own terms from the run ledger in plain words — the exact values the score is computed from (read the score's real formula and name each term in the score's own units, e.g. "waves +A · stopped +B · clean +C" if that is the recipe). The terms always sum exactly to the score shown; all terms are always shown, even at +0.
- The line appears on both cards: the claim card (under T0047's Score line, shown with the card — no count-up, T0075's placement rule) and the game-over card (under its score line, same style).
- No rule change: the score value for any run is unchanged; nothing new is stored — the terms come from the ledger values the score already reads.
- Closest example: T0075's "waves +A · stopped +B · clean +C" line — same muted style, same "terms always sum to the number above" rule, same no-count-up placement.

## Acceptance criteria
- [ ] The claim card's Score line has a muted line under it whose terms are the score's own inputs and sum exactly to the score shown.
- [ ] The game-over card's score line has the same line in the same style.
- [ ] The score value is unchanged for a given run (a unit test pins one run's score before and after).
- [ ] Desktop 1280x720 and mobile 412x915 smoke pass with the extra line on both cards.

## Design (architect, yoga)

### Files
- edit `src/scenes/RewardsScene.ts` — claim card: one muted score-recipe line under the Score line, bottom block shifted down, panel grows
- edit `src/scenes/GameOverScene.ts` — game-over card: same line under its score line, everything below shifted down, panel grows
- edit `tests/core/run.test.ts` — pins one run's score (score value unchanged)

### Interfaces
None. No new types, fields or functions — only local text objects created in each scene's `create()`.

### Steps
Score's real formula (`RunState.score`, src/core/run.ts:55-57): `wavesCleared * 100 + kills`. The recipe line is exactly those two terms, always shown: `` `waves +${run.wavesCleared * 100} · stopped +${run.kills}` `` — sums exactly to the displayed score.

1. `tests/core/run.test.ts` — after the test "counts cleared waves for the score" add:
```ts
it('scores the run: the cleared waves at a hundred, the stopped enemies at one', () => {
  const run = new RunState(1);
  expect(run.score).toBe(0);
  run.startWave();
  run.addKill(3);
  run.clearWave();
  expect(run.score).toBe(103);
  run.startBuild(5);
  run.startWave();
  run.addKill(7);
  run.leak(START.lives);
  expect(run.score).toBe(210);
});
```
2. `RewardsScene.ts` `create()`, after the `this.scoreText = ...` line (the `Score 0` text), add (static, like the coin `recipeText` — NOT in `update()`, no count-up):
```ts
const scoreRecipe = this.add.text(0, 64 - dy + (run.cleanWaves > 0 ? 36 : 0) + (run.bestCombo >= 2 ? 36 : 0), `waves +${run.wavesCleared * 100} · stopped +${run.kills}`, titleStyle(22, PALETTE.muted)).setOrigin(0.5);
```
3. In the same file shift everything below the Score line down 36 (y only): `coinText` and `coinIcon` `44 + dy` → `80 + dy`; `recipeText` `80 + dy` → `116 + dy`; `boardText` `116 + dy` → `152 + dy`; `flawlessText` `152 + dy` → `188 + dy` and `flawlessStar` y `153 + dy` → `189 + dy`; `menuButton` y `180 + dy + (flawless ? 36 : 0)` → `216 + dy + (flawless ? 36 : 0)`. Then `panelH`: `372` → `444` (keep `+ 2 * dy + 72 + (flawless ? 72 : 0)`). In the `parts` list insert `scoreRecipe` after `this.scoreText`. Do not touch `mid`/`dy` or any `+dy` on the upper lines.
4. `GameOverScene.ts` `create()`, after the `const score = ...` line add:
```ts
const scoreRecipe = this.add.text(0, -80, `waves +${run.wavesCleared * 100} · stopped +${run.kills}`, textStyle(15, PALETTE.muted)).setOrigin(0.5);
```
5. Same file, shift everything below the score line down 17 (y only): `wavesText` -71 → -54; `stoppedText` -54 → -37; `cleanText` -37 → -20; `coinsText` -20 → -3; `bestText` 8 → 25; `claimButton` 70 → 87; `againButton` 134 → 151; `menuButton` 196 → 213. `panelH` `480` → `497`. In `parts.push(...)` insert `scoreRecipe` before `wavesText`. `flawlessStar` stays at -99 (it rides the score line).
6. `npm run check && npm run smoke`.

### Pitfalls
- The claim card's wave term must be `run.wavesCleared * 100`, NOT `this.waves` (that one may come from the saved profile's `lastRun`); the terms must sum exactly to the shown `run.score`.
- Do not add the line to `RewardsScene.update()` count-up and do not add any state field, listener or stored value — the card shows the final values, as the coin recipe does.
- Forgetting the flawless star / menu button (RewardsScene) or the three buttons (GameOverScene), or not growing `panelH` (444 / 497), clips or overlaps the card; the fit-scale in `layout()` uses `panelH`, so both screens stay inside after the change.
- No score or ledger value changes anywhere — display only.

### Tests
- The one pin test in step 1 (acceptance: score unchanged before/after). No other unit test — scene layout is covered by smoke.
