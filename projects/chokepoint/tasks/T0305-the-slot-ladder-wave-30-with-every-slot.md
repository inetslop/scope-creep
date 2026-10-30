---
id: T0305
title: "The slot ladder: wave 30 with every slot filled unlocks one more"
assignee: asus
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T20:35:44Z
claimed_at: 2026-10-30T22:20:05Z
epic: E9
---

## Goal
The slot ladder from E9's spec: a run that reaches wave 30 with every unlocked level slot filled earns one more slot, so the player's payout choice grows with each full clear, up to the size of the set.

## Details
- The rule, one pure function with unit tests: given (slots owned, the run's max wave, level augments on, set size), the run earns +1 slot when it reached wave 30 (max wave ≥ 30; dying mid-wave counts, same as T0285's first unlock) and had as many level augments on as it had slots (all filled). 0 slots + wave 30 earns the first slot, so T0285's first unlock and the ladder are the one rule. The slot count never goes down and is capped at the set size — the number of level augments in the set, read from the set's own list (5 when the first set is complete), not a constant.
- The check runs once per run, when the run ends and the profile is updated — the same moment T0285's first unlock is saved. A resumed run keeps its chosen augments (T0285's run save, untouched).
- The claim card's moment: when the run earned a slot (first or later), one bold line on the claim card — "Level slot · N of S" (N the new total, S the set size), in the card's existing column (T0224); the card grows the one line only when the run earned a slot — no such line today, no line when the run earned nothing.
- The picker's next-goal line: while the player's slots are below the set size, the menu's Level card (T0285) shows one muted line — "wave 30 with N on unlocks the next" (N the current slot count). The 0-slot teaser ("reach wave 30 to unlock") stays unchanged; at the cap there is no goal line.
- No new input, no new HUD element; wording stays one dry line (the game's tone).

## Acceptance criteria
- [ ] The pure rule is unit-tested: +1 only when max wave ≥ 30 and level augments on ≥ slots owned, capped at the set size — (0, 30, 0, 5) → 1; (2, 30, 2, 5) → 3; (2, 30, 1, 5) → 2; (5, 40, 5, 5) → 5; (2, 29, 2, 5) → 2.
- [ ] Ending a run at wave 30 or beyond with every unlocked slot filled raises the profile's slot count by 1, saved at the same moment T0285's first unlock is saved; the count never decreases across runs.
- [ ] The claim card shows the bold "Level slot · N of S" line exactly when this run earned a slot; a run that earned nothing shows no such line.
- [ ] The menu's Level card shows "wave 30 with N on unlocks the next" while slots are below the set size; the 0-slot teaser is unchanged; no goal line at the cap.
- [ ] The picker still caps the toggles at the slot count — a newly earned slot opens exactly one more toggle.
- [ ] The gate (typecheck, lint, unit tests, smoke on desktop and mobile) passes.

## Design (architect, desktop)

### Files
- edit `src/core/levels.ts` - replace `levelSlotsAfter` with the one-rule slot ladder (4 args)
- edit `src/core/profile.ts` - `recordRun` calls the ladder with the set size; `RecordResult` gains `levelSlotEarned`
- edit `src/scenes/GameOverScene.ts` - pass `slotEarned` into the rewards scene start
- edit `src/scenes/RewardsScene.ts` - one bold "Level slot · N of S" line in the claim column, only when earned
- edit `src/scenes/menu/LevelCard.ts` - one muted next-goal line between the header and the toggle rows
- edit `tests/core/levels.test.ts` - new signature + ladder cases
- edit `tests/core/profile.test.ts` - ladder cases through `recordRun`

### Interfaces
```ts
// src/core/levels.ts — replaces the current 2-arg levelSlotsAfter (the one rule: T0285's first unlock is the 0-slot case)
/** A run that reached the unlock wave with every unlocked slot filled earns one more slot, capped at the set's size.
 * 0 filled counts as all filled, so the first earn is the first slot. Never fewer. */
export function levelSlotsAfter(old: number, wavesReached: number, on: number, setSize: number): number {
  const slots = Math.min(Math.max(old, 0), Math.max(setSize, 0)); // a broken save can't hold more slots than the set
  return wavesReached >= LEVEL_UNLOCK_WAVE && on >= slots ? Math.min(slots + 1, setSize) : slots;
}
```
```ts
// src/core/profile.ts — RecordResult gains one field
levelSlotEarned: boolean; // this run earned a slot (first or later): the claim card prints its line
```
Set size is always `LEVEL_AUGMENTS.length` from `src/content/levels/index.ts` (3 today, 5 once the set completes) — never a literal in src. "Level augments on" for a run is `old.levelOn.length` in `recordRun` (the picker caps it at slots; nothing else changes `levelOn` during a run, and a resumed run keeps the same choice).

### Steps
1. `src/core/levels.ts`: replace lines 6-9 with the function above; keep `LEVEL_UNLOCK_WAVE`.
2. `src/core/profile.ts`: change the line-3 import to `import { LEVEL_AUGMENTS, getLevelAugment } from '../content/levels';`. In `recordRun`: compute `const levelSlots = levelSlotsAfter(old.levelSlots, result.reached ?? result.waves, old.levelOn.length, LEVEL_AUGMENTS.length);`, use `levelSlots,` for the profile field, and return `{ profile, coins, newBest, levelSlotEarned: levelSlots > old.levelSlots };`. Add the field to `RecordResult`.
3. `src/scenes/GameOverScene.ts` line 33: `this.scene.start(SCENES.rewards, { slotEarned: result.levelSlotEarned });`.
4. `src/scenes/RewardsScene.ts`: import `LEVEL_AUGMENTS` from `../content/levels`. Signature `create(data?: { slotEarned?: boolean }): void`. After the flawless block (line 129): `let slotText: Phaser.GameObjects.Text | undefined;` and `if (data?.slotEarned) slotText = this.add.text(0, 0, \`Level slot · ${profile.levelSlots} of ${LEVEL_AUGMENTS.length}\`, titleStyle(22, PALETTE.ink)).setOrigin(0.5);`. In the `rows` list, after the flawless push: `if (slotText) rows.push({ height: slotText.height, after: gapBig });`. In placement, after the flawless block and before `menuButton.container.setY(...)`: `if (slotText) { slotText.setY(top + col.ys[i]); i++; }`. In `parts`, after the flawless push: `if (slotText) parts.push(slotText);`. It is a local (like `flawlessText`), never read in `update()`, so no reset is needed.
5. `src/scenes/menu/LevelCard.ts`, in the picker branch only (the `slots <= 0` teaser card is untouched): after `const n = LEVEL_AUGMENTS.length;` add `const goalShown = slots < n;` and `const headerToRows = goalShown ? 32 : 10; // 8 down to the line, 14 for it, 10 to the rows`. Change the height line to `12 + 20 + headerToRows + n * ROW_H + (n - 1) * ROW_GAP + 12`. After the `mul` text: `let goal: Phaser.GameObjects.Text | undefined;` and `if (goalShown) goal = scene.add.text(0, 0, \`wave 30 with ${slots} on unlocks the next\`, textStyle(12, PALETTE.muted)).setOrigin(0.5);`, and push it into `kids` right after `mul`. Change the row y to `-height / 2 + 12 + 20 + headerToRows + ROW_H / 2 + i * (ROW_H + ROW_GAP)`; after `header.setY(...)`: `if (goal) goal.setY(-height / 2 + 47);`.
6. `tests/core/levels.test.ts`: replace the first `it` with the ladder — `levelSlotsAfter(0, 29, 0, 5)` → 0; `(0, 30, 0, 5)` → 1; `(1, 30, 0, 5)` → 1; `(1, 30, 1, 5)` → 2; `(2, 30, 2, 5)` → 3; `(2, 29, 2, 5)` → 2; `(5, 40, 5, 5)` → 5; `(4, 10, 4, 5)` → 4.
7. `tests/core/profile.test.ts`: add one `it` — seed `store.setItem('chokepoint:profile', JSON.stringify({ levelSlots: 2, levelOn: ['tough', 'swift'] }))`, then `recordRun(store, { waves: 29, stopped: 0, clean: 0, seed: 311, bgen: 2, reached: 30 })` → `profile.levelSlots` 3 and `levelSlotEarned` true (died during wave 30, both filled); then a run with no `reached` at wave 5 → still 3 (never decreases). Seed again `{ levelSlots: 2, levelOn: ['tough'] }` and `recordRun(store, { waves: 30, stopped: 0, clean: 0, seed: 312, bgen: 2 })` → 2 and `levelSlotEarned` false (a slot empty). The existing `levelSlots` `it` (lines 116-120) passes unchanged — its sequences never fill a slot after the first earn.
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- The old 2-arg call in `profile.ts` and the old expectations in `levels.test.ts` no longer typecheck — both are listed above; a missed one fails `npm run check`, not the gate's spirit.
- Goal line width: at 12px "wave 30 with 4 on unlocks the next" (~33 chars, ~195px) fits the 220px card; 13px does not — keep 12.
- Claim column: the slot row must be pushed and placed in the same order as `ys`; the index `i` is incremented before the menu button, or lines shift. Fullest card (all lines + slot line) is ~630px and still scales to 1 at 412x915.
- The picker cap is already `on.length < slots` in `buildLevelCard` — do not change it; a newly saved slot is picked up because `MenuScene` passes the fresh `p.levelSlots`.
- Don't touch `loadProfile` or `RunSave`; the clamp lives in the pure function.

### Tests
- `tests/core/levels.test.ts`: the ladder `it` above (the five acceptance vectors plus the not-filled and capped cases).
- `tests/core/profile.test.ts`: the `recordRun` ladder `it` above (save moment, never-decrease, not-all-filled, `levelSlotEarned`).
