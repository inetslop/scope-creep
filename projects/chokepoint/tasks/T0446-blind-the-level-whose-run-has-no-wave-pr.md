---
id: T0446
title: "Blind: the level whose run has no wave preview"
assignee: cachyos-x8664
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-02T21:47:49Z
claimed_at: 2026-11-02T23:03:56Z
epic: E21
design_attempts: 1
---

## Goal
The run-setup step's level set (Crowded, Lean, Short fuse, Swift, Tough) gains a sixth level, Blind: a run with no wave preview — the build phase plans without knowing what the wave sends, and the run's coin multiplier pays for the handicap. The first of the set's growth past the five (E21): the run the player sets up is a pick.

## Details
- Blind joins the level set on the set's own terms: the same slots on the run-setup step (the daily-board pick's screen, after Play), the same multiplier stack, the same white chip (name only) on the LevelChips row while it is on.
- Blind's multiplier: one notch above the set's current top, on the set's own scale (the five's multipliers are in the level data; take the scale's next step). No new readout: the menu's number before the run, the coin tally and the pause's worth line already carry the multiplier.
- Blind's one-liner on the run-setup step, in the set's dry voice: "no preview of the next wave."
- While a run has Blind, the next-wave preview card (the build-phase card above the next-wave button) never appears: no tokens, no counts, no tag chip, no one-time teach line — the boss's token rides the card too, so a boss wave is a surprise until it starts (the banner and the boss card still announce it at wave start).
- The flyer's build-phase line (the seeded crossing shown before a Flyer boss wave) stays hidden too — it is the preview's own information.
- What Blind does not touch: the wave banner and its tag chip at wave start (a tag is still seen where the wave lands), the next-wave button's live enemy count during the wave, the boss card while a boss is alive, the exit warning, the early send and its countdown gold, the draft and its cards, the wave reference.
- A resumed run keeps Blind: the run save carries the run's levels, so a resumed blind run is still blind.
- A run without Blind is byte-identical: the preview card, the flyer's line and the coin multiplier are all as they are.

## Acceptance criteria
- [ ] The run-setup step lists Blind next to the five, with its one-liner, and a run can start with it; a run without it is unchanged.
- [ ] A Blind run: the next-wave preview card never appears during any build phase, and the flyer's build-phase line never appears before a Flyer boss wave.
- [ ] A Blind run: the wave banner still wears its tag chip at wave start, the next-wave button still counts the wave's enemies during the wave, and the boss card still shows while a boss is alive.
- [ ] Blind's multiplier is one notch above the set's current top on the set's own scale; it shows on the menu's number before the run and rides on the coin tally and the pause's worth line, with no new readout.
- [ ] A resumed Blind run is still Blind at its resumed build phase.
- [ ] The LevelChips row shows Blind's chip (name only) while it is on.
- [ ] A run without Blind is byte-identical: the preview card, the flyer's line and the coin multiplier are unchanged.

## Design (architect, cachyos-x8664)

### Files

- **CREATE** `src/content/levels/blind.ts` — the new level def, modelled on `swift.ts`:
  ```ts
  import type { LevelAugmentDef } from '../types';

  /** Blind: while it is on, the build phase never previews the next wave: no preview card, no flyer line. */
  export const blind: LevelAugmentDef = {
    id: 'blind',
    name: 'Blind',
    line: 'no preview of the next wave',
    bonus: 0.35,
  };
  ```
  No `speedMul`/`countMul` — Blind is display-only; the four required fields are enough.

- **EDIT** `src/content/levels/index.ts` — register it (2 lines): add `import { blind } from './blind';` in the import block (alphabetically, before `crowded` at line 2), and extend the list at line 11: `export const LEVEL_AUGMENTS: readonly LevelAugmentDef[] = [tough, lean, shortFuse, swift, crowded, blind];`

- **EDIT** `src/ui/hud/NextWavePreview.ts` — guard the card in `update()` (line 68). Replace the `plan` line with:
  `const plan = !hidden && !game.run.level.includes('blind') && game.run.phase === 'build' ? game.waves.nextPlan : undefined;`

- **EDIT** `src/systems/FlyTelegraph.ts` — guard the build-phase line in `update()` (line 45). Replace the `show` line with:
  `const show = this.run.phase === 'build' && !this.run.level.includes('blind') && isFlyerBossPlan(this.waves.nextPlan);`

- **EDIT** `tests/core/levels.test.ts` — pin the value in the two existing blocks (matches the per-id / multiplier pattern already there): in the `by id` block add `expect(getLevelAugment('blind')).toMatchObject({ name: 'Blind', line: 'no preview of the next wave', bonus: 0.35 });`; in the multiplier block add `expect(levelMultiplier(['blind'])).toBeCloseTo(1.35, 12);` and `expect(levelMultiplierLabel(['blind'])).toBe('×1.35');`

### Interfaces

- Blind is a `LevelAugmentDef` (`content/types.ts`) — a pre-run level, **not** a tower augment. It is never in the draft, hand, a tower, or the codex (the comment at `index.ts:10`). It sets only `id`, `name`, `line`, `bonus`. No interface field is added.
- The multiplier rides the existing `levelMultiplier(ids)` (`core/levels.ts`): `1 +` the chosen bonuses. The top of the five is `short-fuse` at `0.30`; the step is `0.05`, so `bonus: 0.35` → `levelMultiplier(['blind']) = 1.35`, label `×1.35`. It feeds `RunState.levelHpMul` (enemy HP) and the coin/score readouts exactly like the other levels — no new readout.
- The display effect is an id check, same precedent as `leanBounty`/`levelBuildSeconds` (`RunFlow.ts:173`, `EnemySystem.ts:274`): `run.level.includes('blind')`. `RunState.level: string[]` is set before the HUD exists and restored by `RunSave` (`RunSave.ts:61,79`), so a resumed run keeps Blind and no save edit is needed.

### Steps

1. Create `blind.ts` with the def above.
2. Add the import + list entry in `index.ts` (now six levels).
3. Guard `plan` in `NextWavePreview.update()` — when Blind is on, `plan` is always `undefined`: the card is never built (tokens, counts, tag chip, and every one-time teach line are all gone because `planNumber` stays `-1` and the box is never created).
4. Guard `show` in `FlyTelegraph.update()` — when Blind is on, `show` is always `false`: the build-phase flyer line is never created.
5. Extend `tests/core/levels.test.ts` as listed.

### Pitfalls

- Hiding `plan` hides the **whole** card: tokens, counts, the tag chip, and every one-time teach line (`EARLY_SEND`, `BANK_PAY`, `TEACH`, `FLYER_TEACH`) — intended ("no tokens, no teach lines, no one-time teach line"). The early-send **gold-banking mechanic** still runs (untouched); only the preview text hides.
- The boss wave is now a surprise until it starts: the boss token rides the card. The WaveBanner + boss card still announce at wave start (untouched).
- In a blind run `plan` is always `undefined`, so `planNumber` stays `-1`, the box is never built, and the pop-in tween / `!box.visible` re-show branch stay inert.
- FlyTelegraph: when `show` is false the line is never created; the fade branch (`this.line && active && visible`) and `broken()` stay inert (line never visible), so the existing `flyLine.valid` invariant still holds. The boss Flyer's **in-wave** bank line (T0317's `flyLine.ts`) is a different thing and still runs — only the build-phase line is hidden.
- `PickScene`: the slot chip row (`0..slots`) and the per-id detail card (`def.name` + `def.line` + `levelMultiplierLabel`) are dynamic — no edit. With six levels a max-slot player's head row is slightly wider than the 412×915 budget, so `layoutView` self-scales ~2% (chips just under 44 px). That is a known marginal for a max-slot player only; **do not edit PickScene** (T0386 also touches it).
- Byte-identical when off: the two guards short-circuit identically and `levelMultiplier` ignores an absent id, so preview, flyer line, and the coin/score multiplier are unchanged. The slot cap grows to 6 automatically (`levelSlotsAfter` is called with `LEVEL_AUGMENTS.length`; `MilestoneScene.ts:44` already uses that cap) — no edit.

### Tests

`blind.ts` is content + two display guards, not a rule in `src/core`; the existing per-id `tests/core/levels.test.ts` already validates each level's `name`/`line`/`bonus`, and `tests/core/daily.test.ts` uses `LEVEL_AUGMENTS.length` dynamically (no fixed list), so nothing breaks from the new entry. The added lines pin `blind`'s id/line/bonus (`0.35`) and its multiplier/label (`1.35` / `×1.35`) so a later edit can't silently change the value. `npm run check` and `npm run smoke` must pass.
