---
id: T0048
title: The first draft always offers the default shot
assignee: baby-mama
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-28T12:01:28Z
claimed_at: 2026-10-28T12:38:33Z
finished_at: 2026-10-28T12:42:52Z
epic: E4
---

## Goal
A first-time player's first tower is the game's default shot: the very first draft always includes a Common Bolt, so the opening pick is never a dead end.

## Details
- The pre-wave-1 draft (the first pick, before any wave) always includes at least one **Common** Bolt among its three offered cards.
- If the run's one reroll (T0036) is spent on that first draft, the rerolled offer still guarantees at least one Common Bolt.
- From the second draft onward (after wave 1 clears), the roll is completely normal — Bolt is not guaranteed and tiers roll as usual.
- Only the offer selection changes — which cards are rolled for that one draft. The card display, tier frames, odds line, and the rest of the run are untouched; in particular this must not touch the draft card's corner rendering, which the owned-dot work (T0044) owns.
- This is onboarding: the first tower a new player builds is the augment that "shoots the enemy furthest along," the game's default shot.

## Acceptance criteria
- [ ] On a fresh profile's first run, the pre-wave-1 draft shows at least one Common Bolt among its three cards.
- [ ] Using the reroll on that first draft re-rolls the offer but still shows at least one Common Bolt.
- [ ] The draft after wave 1, and every later draft, rolls normally with no Bolt guarantee.
- [ ] The tier odds, card frames, and the draft card's owned-dot corner are unchanged by this.

## Design (architect, yoga)

### Files
- edit `src/core/augments.ts` - `rollOffer` (line 200): when `opening` is true, the first offer card is reserved as a Common Bolt; update its doc comment
- edit `tests/core/augments.test.ts` - two tests in the existing `describe('rollOffer')` block (line 165)

### Interfaces
No new or changed types or signatures. `rollOffer(rng: Rng, pool: readonly AugmentDef[], count: number, wave: number, opening = false): AugmentCopy[]` is unchanged; both call sites (`RunFlow.openDraft:90`, `RunFlow.rerollOffer:103`) already pass `this.run.wave === 0` as `opening`, so no change in RunFlow or DraftScene.

### Steps
1. In `src/core/augments.ts`, replace `rollOffer` with (note: `bolt` is already imported at line 3 — use `bolt.id`, add no import):
```ts
export function rollOffer(rng: Rng, pool: readonly AugmentDef[], count: number, wave: number, opening = false): AugmentCopy[] {
  const open = opening ? pool.filter((a) => a.first.damage > 0 || a.opening) : pool;
  const taken = new Set<string>();
  const offers: AugmentCopy[] = [];
  if (opening) {
    // The opening draft (and its one reroll) always offers the game's default shot: a Common Bolt.
    offers.push({ id: bolt.id, tier: 'common' });
    taken.add(bolt.id);
  }
  for (let i = offers.length; i < count; i++) {
    const tier = rollTier(rng, wave);
    const candidates = open.filter((a) => !taken.has(a.id) && (a.tier === undefined || a.tier === tier));
    const picked = rng.pick(candidates);
    taken.add(picked.id);
    offers.push({ id: picked.id, tier });
  }
  return offers;
}
```
2. In `rollOffer`'s doc comment, after "since the first one has to hold wave 1 alone." add: "Its first card is a Common Bolt, the game's default shot, so the opening pick is never a dead end."
3. In `tests/core/augments.test.ts`, add to the `rollOffer` describe block:
```ts
it('the opening draft (and its reroll) always offers a Common Bolt', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const offer = rollOffer(new Rng(seed), AUGMENTS, 3, 1, true);
    expect(offer.length).toBe(3);
    expect(new Set(offer.map((a) => a.id)).size).toBe(3);
    expect(offer.some((c) => c.id === 'bolt' && c.tier === 'common')).toBe(true);
  }
});

it('no Bolt promise after wave 1: some later draft rolls no Bolt at all', () => {
  let noBolt = 0;
  for (let seed = 1; seed <= 200; seed++) if (!rollOffer(new Rng(seed), AUGMENTS, 3, 2).some((c) => c.id === 'bolt')) noBolt += 1;
  expect(noBolt).toBeGreaterThan(0);
});
```

### Pitfalls
- Push the Bolt before the loop AND `taken.add(bolt.id)` — otherwise a later slot can also roll Bolt and "three different augments" breaks (existing test would fail).
- Tier must be the literal `'common'`, never `rollTier()` — a Rare Bolt would not satisfy "Common Bolt".
- Never edit DraftScene/RunFlow for this: odds line, tier frames, and the owned-dot corner (T0044) stay untouched; only the rolled offers change. The reroll is covered because `rerollOffer` still sees `run.wave === 0` until wave 1 starts.
- The opening now draws fewer numbers from `run.rng` (2 rolled slots, not 3), so the fixed-seed stream shifts; no test or save pins the old stream, and smoke mode's auto-pick of card 0 is now always a valid Common Bolt.

### Tests
- The two tests above (rule change in `src/core/augments.ts`).

## Result (attempt 1, baby-mama)

The pre-wave-1 draft (and its one reroll) now always includes a Common Bolt among its three cards: `rollOffer` in `src/core/augments.ts` reserves the first offer slot for the game's default shot when `opening` is true, and marks it taken so the other two slots roll different augments. From wave 1 onward the roll is untouched — no Bolt promise, tiers roll as usual. Two tests in `tests/core/augments.test.ts` pin the guarantee over 200 seeds each (opening always offers a Common Bolt; later drafts sometimes roll none). No types, signatures, or UI changed.

- Self-review: APPROVE
- Time: 4.3 min

```
projects/chokepoint/game/src/core/augments.ts        | 10 ++++++++--
 projects/chokepoint/game/tests/core/augments.test.ts | 15 +++++++++++++++
 2 files changed, 23 insertions(+), 2 deletions(-)
```
