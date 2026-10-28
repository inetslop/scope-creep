---
id: T0056
title: "The claim card says Board: the run's board as a four-letter code"
size: S
priority: 3
status: todo
depends_on: [T0051]
attempts: 0
created: 2026-10-28T13:04:03Z
epic: E1
---

## Goal
A memorable run is nameable: the rewards card shows the run's board as a short four-letter code, so a great board can be remembered and shared — the first step toward replaying a board (the ghost run in IDEAS).

## Details
- A new line on the rewards claim card, below the "+N coins" line: "Board ABCD" — four uppercase letters (A–Z) derived deterministically from the run's board seed: the same run always shows the same code, and two runs on different boards show different codes. The code never depends on time, on the run's outcome, or on luck.
- The line is the same muted ink and type size as the card's other secondary lines, and it appears with the card (no count-up — it is a label, not a number).
- Read-only: no copy button, no replay, no input of any kind. (Replaying the board is a later idea.)
- The card stays a centered white rounded card with all its lines at 412x915 and 1280x720 — the same compact spacing the "Score" (T0047) and "Best combo" (T0051) lines use.

## Acceptance criteria
- [ ] The claim card shows a "Board ABCD" line (four uppercase letters, A–Z) below the "+N coins" line, in muted ink, appearing with the card.
- [ ] The same run (same board seed) always shows the same code; two runs on different boards show different codes.
- [ ] The code is a readout only: no button, no replay, no sharing UI, no gameplay effect.
- [ ] The full card fits on 412x915 and 1280x720, centered, with every other line unchanged.

## Design (architect, desktop)

### Files
- create `src/core/boardCode.ts` - pure seed → four-letter board code (no Phaser)
- create `tests/core/boardCode.test.ts` - shape/determinism/distinctness of the code
- edit `src/scenes/RewardsScene.ts` - one import line and a 4-line layout change (the "Board" label below the coins line)

### Interfaces
```ts
// src/core/boardCode.ts (whole file)
import { Rng } from './rng';

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** The board's four-letter code: the same seed always gives the same code, different seeds different ones. */
export function boardCode(seed: number): string {
  const rng = new Rng(seed);
  let out = '';
  for (let i = 0; i < 4; i++) out += LETTERS.charAt(rng.int(0, 25));
  return out;
}
```

### Steps
1. Create `src/core/boardCode.ts` exactly as above.
2. Create `tests/core/boardCode.test.ts` (vitest, model on `tests/core/profile.test.ts`): three `it`s — (a) `boardCode(seed)` matches `/^[A-Z]{4}$/` for seeds `[0, 1, 1234, 2 ** 31 - 1, 987654321]`; (b) `boardCode(1234) === boardCode(1234)` (deterministic); (c) seeds `[0, 1, 2, 999, 1234, 424242, 2 ** 31 - 1]` give `new Set(...map(boardCode)).size === 7`.
3. In `src/scenes/RewardsScene.ts`:
   - Add `import { boardCode } from '../core/boardCode';` directly above the `../core/profile` import.
   - Line 71: `const panelH = 300 + 2 * dy;` → `const panelH = 372 + 2 * dy;` (+72: the new line, and the Menu button pushed down with it). If T0051's "Best combo" line has changed this constant, add 72 to whatever it currently is.
   - After the `this.coinIcon = ...` line (line 79), add: `const boardText = this.add.text(0, 80 + dy, `Board ${boardCode(run.seed)}`, titleStyle(22, PALETTE.muted)).setOrigin(0.5);` and change the Menu button's y in the very next line from `108 + dy` to `144 + dy`.
   - In the `parts.push(...)` line (line 83), insert `boardText,` before `menuButton.container`.
4. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Keep every existing line's y formula exactly as-is (title/waves/stopped/clean/score/coins unchanged); only the card grows 72 tall and the Menu button moves. The top padding above the title grows by 36 px — intentional.
- `boardText` is a local const, not a `this.` field, and `update()` is untouched: the code appears with the card, no count-up.
- Derive from `run.seed` only — never `run.rng` state (mutated during the run) or `Math.random()`.
- Read-only: no button, copy, replay or input; no `INVARIANTS` entry (display label, no system state).
- Fits check is automatic: `layout()` scales by `panelH`; worst case 444 px tall (clean waves) still fits 412x915 and 1280x720 unscaled and centered.

### Tests
- `tests/core/boardCode.test.ts` as in step 2 (the code is a rule in `src/core` that a later replay/ghost task could silently change).
