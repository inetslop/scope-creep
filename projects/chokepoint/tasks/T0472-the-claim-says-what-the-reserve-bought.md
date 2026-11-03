---
id: T0472
title: The claim says what the reserve bought
size: S
priority: 2
status: todo
depends_on: [T0463]
attempts: 0
created: 2026-11-03T04:35:57Z
epic: E24
---

## Goal
The claim card (the run's ledger) names the heavy reserve cards the run bought, so the end card tells the whole story of the run — including its 80-gold decisions, which otherwise only flash as a wave chip.

## Details
- One muted line on the claim card (`src/scenes/RewardsScene.ts`, the card the coin-recipe line T0075 grows), directly under the "waves +A · stopped +B · clean +C" recipe line: "reserve: surge · wall" — the label "reserve:", then the names of the heavy cards the run bought, joined by " · ", in the fixed order surge, wall, harvest (regardless of which was bought first).
- It reads the run's reserve state (T0463's buy state) and lists whatever heavy cards the run bought from it — the wall (T0471) and the harvest show up here the moment their buys exist in that state, with no further change to this line.
- The line is hidden when the run bought no heavy card: such a run's claim card is byte-identical to today.
- The style is the recipe line's own (the same muted ink and size); the line fits the card at 412x915 and 1280x720 with the card's existing wrapping.

## Acceptance criteria
- [ ] A run that bought the surge shows the muted "reserve: surge" line directly under the claim card's coin recipe line; a run that bought no heavy card shows no line and an otherwise unchanged card.
- [ ] Once the wall is in (T0471), a run that bought the surge and the wall shows "reserve: surge · wall" in that order, whether the surge or the wall was bought first.
- [ ] The line fits the claim card at 412x915 and 1280x720 with the longest numbers on the card.

## Design (architect, yoga)

### Files
- create `src/core/reserveClaim.ts` - pure function that derives the claim card's reserve line from the run's reserve buy state (T0463's field on `RunState`)
- create `tests/core/reserveClaim.test.ts` - pins the label, the fixed order, and the hidden-when-empty rule
- edit `src/scenes/RewardsScene.ts` - one muted line under the coin recipe line, only when the run bought a heavy card

### Interfaces
```ts
// src/core/reserveClaim.ts
import type { RunState } from './run';

/** The heavy cards the reserve sells, in the order the claim card names them (never the order bought). */
const RESERVE_HEAVY = ['surge', 'wall', 'harvest'];

/** `reserve: surge · wall` — the heavy cards the run bought, in the fixed order. `undefined` when it bought none: the line stays hidden. */
export function reserveClaimLine(run: RunState): string | undefined {
  const bought = RESERVE_HEAVY.filter((id) => run.reserveBought.includes(id)); // use T0463's exact field; a Set would be `.has(id)`
  return bought.length > 0 ? `reserve: ${bought.join(' · ')}` : undefined;
}
```

### Steps
1. Read T0463's merged code: grep `surge` in `src/core/run.ts` for the buy-state field on `RunState` (its list of bought heavy-card ids). Do not edit `run.ts` or `saveRun.ts` — you only read the field.
2. Create `src/core/reserveClaim.ts` with `reserveClaimLine` exactly as above (the three id strings verbatim).
3. In `src/scenes/RewardsScene.ts`: add `import { reserveClaimLine } from '../core/reserveClaim';` between the `profile` and `waveStory` imports; after `const coinRecipe = recipe(...)` add `const reserveText = reserveClaimLine(run); const reserveLine = reserveText ? recipe(reserveText) : undefined;`; in the `rows` list split `coinRecipe`'s `after` to `reserveLine ? gapSmall : gapBig` and add `if (reserveLine) rows.push({ height: reserveLine.height, after: gapBig });` before the `boardText` row; after `coinRecipe.setY(top + col.ys[i++]);` add `if (reserveLine) reserveLine.setY(top + col.ys[i++]);`; in `parts` add `if (reserveLine) parts.push(reserveLine);` after the `levelLine` push.
4. Run `npm run check`.

### Pitfalls
- The line goes under `coinRecipe` (the 'waves +A · stopped +B · clean +C' line), not `scoreRecipe` (which has no `clean` term).
- Hidden case must be byte-identical: when `reserveLine` is undefined, rows, ys and parts change nothing — that is why `coinRecipe` keeps `after: gapBig` then.
- `reserveLine` is a create()-local like `levelLine`; the scene instance is reused between runs, so a no-buy run must not show a line from a previous run (it is rebuilt from `run` every create).
- Fit: `recipe()` already shrinks to `maxW` (never below 13px); the longest text 'reserve: surge · wall · harvest' is ~145px < 304px, and the stack row grows `col.height`, which the existing box scale fits at 412x915 and 1280x720.
- Join with `' · '` exactly as `coinRecipeParts.join(' · ')`.

### Tests
- `tests/core/reserveClaim.test.ts`: `new RunState(1)` gives `undefined`; pushing `'surge'` gives `'reserve: surge'`; pushing `'wall'` then `'surge'` still gives `'reserve: surge · wall'` (fixed order, not bought order).
