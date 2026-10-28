---
id: T0075
title: The claim card says why the coins are what they are
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-28T21:24:45Z
claimed_at: 2026-10-28T21:51:40Z
finished_at: 2026-10-28T22:26:32Z
epic: E1
---

## Goal
The run's coin payout is explained where it is claimed: one muted recipe line under the "+N coins" on the claim card, so the number that carries over to the profile (E1) is readable, not just counted up.

## Details
- One muted line directly under the "+N coins" line on the rewards claim card (`src/scenes/RewardsScene.ts`, the file T0003 created and T0047/T0056 grew): "waves +A · stopped +B · clean +C", where A = the waves the run held, B = floor(enemies stopped / 10), C = the clean waves held — the run ledger's own coin formula (T0001: waves + floor(stopped/10) + clean). Read the same values the payout used; never recompute.
- All three terms are always shown, even at +0 — the formula is the point. The three terms always sum exactly to the "+N" shown.
- Shown with the card (no count-up), in the muted style of the Board line (T0056), one line below it. The card grows by one line height, the way the Score (T0047) and Board lines grew it; both 1280x720 and 412x915.
- No rule change: the coin formula, the payout and the profile are untouched — display only.
- Closest example: the Board line (T0056) — same placement under the coins, same muted style, no count-up.

## Acceptance criteria
- [ ] The claim card shows "waves +A · stopped +B · clean +C" in muted gray directly under the "+N coins" line, with A + B + C exactly equal to the N shown.
- [ ] A run with zero clean waves reads "clean +0"; the line is present on every claim and is shown with the card (no count-up).
- [ ] A resumed run's claim (T0042) shows the recipe of its own ledger.
- [ ] The card fits 1280x720 and 412x915 with the new line.
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile.

## Design (architect, yoga)

### Files
- edit `src/scenes/RewardsScene.ts` - one muted recipe line under the "+N coins" line; card grows one line height

### Interfaces
No new types or signatures. Everything in `create()` of `RewardsScene`, no `update()` change, no new class field (local `const` like `boardText` is).

### Steps
In `create()`, exactly these 5 changes (all else untouched):
1. `const panelH = 372 + 2 * dy;` → `const panelH = 372 + 2 * dy + 36;`
2. Insert directly after the `this.coinIcon = artScale(...)` line:
```ts
const recipeText = this.add.text(0, 80 + dy, `waves +${this.waves} · stopped +${Math.floor(this.stopped / 10)} · clean +${this.clean}`, titleStyle(22, PALETTE.muted)).setOrigin(0.5);
```
3. `boardText` y: `80 + dy` → `116 + dy`
4. `menuButton` y: `144 + dy` → `180 + dy`
5. `parts.push(...)` line: insert `recipeText, ` before `boardText`
The line reads `this.waves`/`this.stopped`/`this.clean` — the exact values the payout used (live `coinsForRun` or `lastRun.coins` recorded from them by `GameOverScene`), so A+B+C === the "+N" shown, both for fresh and resumed runs.

### Pitfalls
- No count-up: the text is final in `create()`; never add it to `update()`.
- Never recompute coins from `run` fields a second way; the three scene fields are the payout's own values.
- Don't put the recipe in `mid` (it's always shown): the fixed `+36` in panelH and the two `+36` y-shifts are the whole growth.
- 22px bold is the Board line's style and fits: worst-case string ≈ 320px < 360 card; max panelH 516 fits 720px (scale min 1).
- `titleStyle` and `PALETTE` are already imported; the `·` separator is the codebase's usual one.

### Tests
none

## Result (attempt 1, yoga)

The rewards claim card in `src/scenes/RewardsScene.ts` now explains its coin payout: a muted "waves +A · stopped +B · clean +C" line sits directly under the "+N coins" line, using the exact three values the payout was computed from (so the terms always sum to the shown N, for fresh and resumed runs alike). The card grew by one fixed line height and the Board line and Menu button shifted down to make room. All three terms are always shown (even at +0), final with no count-up. `npm run check` and `npm run smoke` pass on desktop and mobile.

- Self-review: APPROVE
- Time: 34.9 min
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/scenes/RewardsScene.ts | 9 +++++----
 1 file changed, 5 insertions(+), 4 deletions(-)
```
