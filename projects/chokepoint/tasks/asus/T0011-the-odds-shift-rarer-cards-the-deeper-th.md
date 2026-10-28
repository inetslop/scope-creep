---
id: T0011
title: "The odds shift: rarer cards the deeper the run goes"
assignee: asus
size: M
priority: 1
status: in-progress
depends_on: [T0002]
attempts: 1
created: 2026-10-28T02:08:37Z
claimed_at: 2026-10-28T03:49:09Z
epic: E4
---

## Goal
The draft gets more exciting the deeper a run goes: the rarity odds improve with the wave, and the draft's odds line always shows the live odds of the draft in front of the player.

## Details
- Supersedes T0002's fixed 70/25/5 from wave 5 on. The odds depend on the upcoming wave W (the draft before wave 1 uses W = 1; the draft after clearing wave N uses W = N + 1).
- Exact curve — epic grows first and faster, rare a little, both capped:
  - W 1–4: Common 70 · Rare 25 · Epic 5 (unchanged from T0002)
  - from W 5: Epic +1 per wave (cap 15, reached at W 14); Rare +1 per wave (cap 33, reached at W 12)
  - Common = 100 − Rare − Epic. So W 14+ settles at 52/33/15.
  - Examples: W 5 → 69/26/6 · W 10 → 58/31/11 · W 15 → 52/33/15.
- The draft's odds line (T0002) shows the odds of THIS draft: "Common 58 · Rare 31 · Epic 11". For W ≤ 4 it reads exactly "Common 70 · Rare 25 · Epic 5", so early drafts look unchanged.
- The roll must stay on the run's seeded rng (as T0002's roll is) — never Math.random. A unit test must show the same seed produces the same tier sequence, and that the epic share of 3000 rolls at W 15 is clearly higher than at W 5.
- Keep the curve a single pure function in the tier module (closest example: T0002's `TIER_ODDS` / `rollTier` in core/tiers.ts) so later tasks (and E3's levels) can read it.

## Acceptance criteria
- [ ] The draft before wave 1 shows the odds line "Common 70 · Rare 25 · Epic 5".
- [ ] The draft before wave 10 shows "Common 58 · Rare 31 · Epic 11"; from the draft before wave 15 on it shows "Common 52 · Rare 33 · Epic 15".
- [ ] A unit test: the epic share of many seeded rolls at W 15 is higher than at W 5, and the three odds always sum to 100 for any wave.
- [ ] A run replayed with the same seed produces the same card tiers as the original run.
- [ ] The odds line keeps T0002's style and fits the draft at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- edit `src/core/tiers.ts` - add the pure curve `tierOdds(wave)`; change `rollTier` to take the wave. Leave `TIER_ORDER`, `TIER_ODDS`, `tierIndex`, `tierFirst`, `tierAdded`, `tierAddedLine` untouched.
- edit `src/core/augments.ts` - `rollOffer` gains a `wave` parameter, passed to `rollTier`.
- edit `src/systems/RunFlow.ts` - new public field `draftWave`; `openDraft` sets it and passes it to `rollOffer`.
- edit `src/scenes/DraftScene.ts` - the T0002 odds line is built from `tierOdds(game.flow.draftWave)` instead of `TIER_ODDS`; nothing else moves.
- create `tests/core/tiers.test.ts` - curve, sum-to-100, determinism, epic-share tests.
- edit `tests/core/augments.test.ts` - add the new `wave` argument to the existing `rollOffer`/`rollTier` call sites (T0002's versions of them).

### Interfaces
```ts
// core/tiers.ts — added; the single source of the curve, readable by later tasks (E3 levels)
export function tierOdds(wave: number): Record<Tier, number>;
// core/tiers.ts — changed (one rng draw per call, exactly as T0002's rollTier)
export function rollTier(rng: Rng, wave: number): Tier;

export function tierOdds(wave: number): Record<Tier, number> {
  const grow = Math.max(0, wave - 4);
  const rare = Math.min(33, TIER_ODDS.rare + grow);
  const epic = Math.min(15, TIER_ODDS.epic + grow);
  return { common: 100 - rare - epic, rare, epic };
}
export function rollTier(rng: Rng, wave: number): Tier {
  const odds = tierOdds(wave);
  const n = rng.next() * 100;
  if (n < odds.epic) return 'epic';
  if (n < odds.epic + odds.rare) return 'rare';
  return 'common';
}

// core/augments.ts — changed (wave is the new 4th arg, `opening` becomes 5th)
export function rollOffer(rng: Rng, pool: readonly AugmentDef[], count: number, wave: number, opening?: boolean): AugmentCopy[]; // tiers roll via rollTier(rng, wave)

// systems/RunFlow.ts — added next to `offer`, and inside openDraft before the rollOffer call
draftWave = 1; // the wave the open draft rolls its odds for (the one after run.wave)
this.draftWave = this.run.wave + 1;
this.offer = rollOffer(this.run.rng, AUGMENTS, 3, this.draftWave, this.run.wave === 0);
```
`run.wave` is 0 before wave 1 and the last cleared N in the following draft (`core/run.ts`), so `run.wave + 1` is exactly the spec's W. DraftScene: replace `TIER_ODDS[t]` with `tierOdds(game.flow.draftWave)[t]` in the odds-line text, swap the import, keep `TIER_ORDER`, keep `textStyle(12, PALETTE.muted)` and both positions.

### Steps
1. `core/tiers.ts`: add `tierOdds` just above `rollTier`, replace `rollTier`'s signature and body.
2. `core/augments.ts`: add `wave: number` before `opening` in `rollOffer`, pass it to `rollTier`.
3. `RunFlow.ts`: add the field and the two lines in `openDraft` (typecheck lists any missed `rollOffer` call site — there is only RunFlow plus tests).
4. `DraftScene.ts`: the one-line odds change.
5. Tests, then `npm run check` and `npm run smoke`.

### Pitfalls
- The task text's "W 5 → 69/26/6" sums to 101; the rule "Common = 100 − Rare − Epic" (and the W 10/15 examples) win: W 5 is **68/26/6**. Do not special-case 69.
- `rollTier` must stay one `rng.next()` per card or the run's rng stream shifts; determinism then holds for free.
- Build the odds text once in `create()` as T0002 does — `draftWave` is fixed while the draft is open (GameScene paused); don't move it into `layout()`.
- Don't touch the odds line's positions (portrait `top + 58`, landscape `-CARD_H/2 - 18`) or style; the new numbers are the same text length, so it still fits at 412x915 and 1280x720.
- Keep `TIER_ODDS` exported (base odds, `tierOdds` derives from it). Don't touch HandBar/TowerPanel (T0008/T010 territory) or `towerLook.ts`.

### Tests
`tests/core/tiers.test.ts` (vitest, `Rng` from `src/core/rng`):
- `tierOdds` exact: (1,4)→`{common:70,rare:25,epic:5}`, (5)→`{68,26,6}`, (10)→`{58,31,11}`, (12)→`{54,33,13}`, (14,15,40)→`{52,33,15}`.
- For `wave` 0..60: `common + rare + epic === 100` and `common >= 0`.
- Determinism: `seq(wave)` = 300× `rollTier(new Rng(42), wave)`; `seq(15)` toEqual `seq(15)`.
- Replay: with `new Rng(1234)`, collect `c.tier` from `rollOffer(rng, AUGMENTS, 3, wave, wave === 1)` for `wave` 1..25 (75 cards); two independent runs toEqual, and the list contains `'epic'`.
- Share: 3000 rolls each with fresh `new Rng(7)`; `share(15) > share(5) + 0.02`.
`tests/core/augments.test.ts`: pass a wave (e.g. 5) at the `rollOffer`/`rollTier` call sites T0002 left there.
