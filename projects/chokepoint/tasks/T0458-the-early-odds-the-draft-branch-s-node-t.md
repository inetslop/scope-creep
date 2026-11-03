---
id: T0458
title: "The early odds: the draft branch's node that starts the odds shift at wave 1"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T01:13:05Z
epic: E23
---

## Goal
Between-run coins buy how the run's cards come: the tech tree's existing "The draft" branch gains a fourth node that, once owned, makes the draft's tier-odds shift — the one that brings rarer cards up more often as a run deepens (T0011) — start from the very first draft instead of wave 5.

## Details
- A node on an existing branch, not a new row (T0450 was rejected for framing it as a new eighth row): the tech screen's "The draft" row — the 2nd row, home of the two Slot II −5 nodes and Fourth card — shows one more node card after its current ones: **The early odds**, 80 coins (the branch's depth-4 price: base 10 — 30 at depth 2, 80 at depth 4), dry one-liner "the odds shift starts at wave 1, not wave 5". It buys with between-run coins and wears the owned mark exactly like the branch's other nodes; it buys independently of them (no gate — the branch's existing rule). The run-start row already carries five nodes, so a four-node row needs no layout change.
- The effect (on for every run started after the buy, carried in the run's tech state like the branch's other nodes): the tier-odds shift (`tierOdds` in core/tiers.ts, T0011) starts at wave 1 instead of wave 5 — every draft rolls at the odds today's curve gives the same draft four waves later. The first draft (before wave 1) already shows shifted odds, above the flat 70/25/5, and the caps land four waves earlier: Rare 33% at wave 8 (not 12), Epic 15% at wave 10 (not 14); Common is the remainder.
- The draft's own odds line shows the shifted numbers; nothing else changes: the card count, the no-repeat rule, the reroll, the opening Common Bolt floor and the cards' looks.
- A run without the node rolls exactly today's odds: flat 70/25/5 until the shift starts at wave 5 (+1/wave to Rare and Epic, caps 33 and 15 at waves 12 and 14).

## Acceptance criteria
- [ ] The tech screen's "The draft" row shows The early odds as its fourth node — 80 coins, the one-liner, the branch's node look; buying it spends between-run coins and it wears the owned mark; no new row, no other layout change.
- [ ] In a run started after the buy, the first draft (before wave 1) already shows tier odds above the flat 70/25/5, and each later draft's odds match today's curve four waves ahead — the Rare 33% cap at wave 8, the Epic 15% cap at wave 10.
- [ ] In a run without the node the odds are exactly today's: flat 70/25/5 until the wave-5 shift (+1/wave, caps 33 at wave 12 and 15 at wave 14).
- [ ] The draft offer is otherwise unchanged: same card count, no-repeat rule, reroll and opening Bolt floor.

## Design (architect, desktop)

### Files
- edit `src/content/tech/draft.ts` - new 4th node on the branch + extend `kind` union + doc comments
- edit `src/core/techEffects.ts` - `DraftTech.earlyOdds` and its counting in `draftTech()`
- edit `src/core/run.ts` - `RunState.earlyOdds` field (like `fourthCard`)
- edit `src/scenes/GameScene.ts` - one line carrying the flag into the run at start
- edit `src/core/tiers.ts` - `early` parameter on `tierOdds()` and `rollTier()`
- edit `src/core/augments.ts` - `early` parameter on `rollOffer()` passed to `rollTier()`
- edit `src/systems/RunFlow.ts` - the two `rollOffer` calls pass `this.run.earlyOdds`
- edit `src/scenes/DraftScene.ts` - the odds line passes the flag
- edit `tests/core/tiers.test.ts`, `tests/core/techEffects.test.ts`, `tests/core/tech.test.ts`, `tests/core/augments.test.ts` - new/updated assertions
- No changes to `TechScene.ts` or `core/tech.ts`: the row renders `DRAFT_NODES` generically and `buyNode`/`nodeCost` already handle it.

### Interfaces
In `content/tech/draft.ts` — `kind: 'slot2' | 'fourth' | 'early';` and the node (must be LAST in `DRAFT_NODES`, order = depth = price):
```ts
{ id: 'early-odds', name: 'The early odds', line: 'the odds shift starts at wave 1, not wave 5', price: 80, requires: null, kind: 'early' },
```
In `core/techEffects.ts`: `DraftTech` gains `earlyOdds: boolean`; `draftTech` sets `if (node.kind === 'early') earlyOdds = true;` and returns `{ slotDiscount, fourthCard, earlyOdds }`.
In `core/run.ts` (after `fourthCard`): `/** The draft's tier-odds shift starts at wave 1 (the "The early odds" node, off in resumed runs). */` + `earlyOdds = false;`
In `core/tiers.ts`:
```ts
export function tierOdds(wave: number, early = false): Record<Tier, number> {
  const grow = Math.max(0, early ? wave : wave - 4);
```
and `export function rollTier(rng: Rng, wave: number, early = false): Tier` calling `tierOdds(wave, early)`. Update both doc comments to say the shift starts at wave 1 with `early` (caps then at waves 8 and 10).
In `core/augments.ts`: `rollOffer(rng, pool, count, wave, opening = false, exclude?, early = false)`; line 443 becomes `let tier = rollTier(rng, wave, early);` (note the param order: `early` after `exclude`).

### Steps
1. Add the node and `kind` in `draft.ts`; update the two doc comments there.
2. `techEffects.ts`: field + counting + return (three small edits in `draftTech`).
3. `run.ts`: the field; `GameScene.ts` line 119 area: add `this.run.earlyOdds = draft.earlyOdds;` after the `fourthCard` line.
4. `tiers.ts`: the two signatures + `grow` line + comments; `augments.ts`: `rollOffer` signature, call, comment.
5. `RunFlow.ts` lines 143 and 158: append `, this.run.earlyOdds` as the last `rollOffer` argument in both.
6. `DraftScene.ts` line 111: `tierOdds(game.flow.draftWave, game.run.earlyOdds)`.
7. Tests (below), then `npm run check`.

### Pitfalls
- Append the node at the END of `DRAFT_NODES`: inserting it before `fourth-card` would bump `fourth-card` to depth 4 and change its price from 50 to 80.
- The displayed price is `nodeCost()` (80 at depth 4), not the `price` literal; the literal only seeds the branch base and is snapshotted by a test — keep it `80`.
- `Math.max(0, ...)` must stay for the `early` case too (draftWave is always ≥ 1, but don't make wave 0 negative).
- Don't "fix" `nodeInReach` in `core/tech.ts` (it already ignores all draft nodes) — out of scope.
- `earlyOdds` is deliberately not saved in `RunSave` (resumed runs get `false`, same as `fourthCard`); don't add it to the save.
- Unchanged by design: card count, no-repeat rule, reroll (it re-rolls at the same shifted odds), the opening Common Bolt (fixed, not rolled), the Wildcard's Common→Rare bump, and the odds text width (longest shifted line "Common 52 · Rare 33 · Epic 15" matches today's longest).

### Tests
- `tests/core/tiers.test.ts`: `tierOdds(1, true)` → `{common:68, rare:26, epic:6}`; for waves 1–40 `tierOdds(w, true)` equals `tierOdds(w + 4)`; caps: `tierOdds(8, true)` rare 33, `tierOdds(10, true)` epic 15; sums to 100 with `early`.
- `tests/core/techEffects.test.ts`: add `['early-odds', 'The early odds', 80, null, 'early']` to the `DRAFT_NODES` snapshot; every `draftTech(...)` `toEqual` gains `earlyOdds: false`, plus `draftTech(['early-odds'])` → `earlyOdds: true`.
- `tests/core/tech.test.ts`: in the `nodeCost` test add `expect(nodeCost(DRAFT_NODES, 'early-odds')).toBe(80);` (import `DRAFT_NODES` from `../../src/content/tech/draft`).
- `tests/core/augments.test.ts`: same seed, `count` 3, non-opening: the tier sequence of `rollOffer(rng, AUGMENTS, 3, w, false, undefined, true)` for w=1..12 equals the sequence of `rollOffer(rng, AUGMENTS, 3, w + 4, false)` — the "four waves ahead" identity.
