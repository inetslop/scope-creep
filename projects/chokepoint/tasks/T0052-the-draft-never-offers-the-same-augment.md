---
id: T0052
title: The draft never offers the same augment twice in a row
assignee: inet-racing
size: S
priority: 2
status: done
depends_on: [T0048]
attempts: 1
created: 2026-10-28T12:34:55Z
claimed_at: 2026-10-28T13:20:29Z
finished_at: 2026-10-28T13:39:27Z
epic: E4
---

## Goal
Every offer has something new in it: an augment the draft just offered is not offered again in the next offer, so every pick always has a fresh branch to consider.

## Details
- The offer roll (T0002) excludes any augment that appeared in the immediately previous offer of this run.
- A reroll (T0036) excludes the offer it replaces — rerolling a draft re-rolls from the augments not in that offer.
- The pre-wave-1 offer has no previous offer: it keeps the Common Bolt floor (T0048) and otherwise rolls normally.
- Tier odds (T0002, T0011), card frames and gems, the flip (T0024), the tier chime (T0032), the tier word (T0026) and the owned dot (T0044) are all unchanged.
- If the exclusions ever left fewer than three eligible augments (not possible with the current eleven-augment pool), the rule relaxes for that offer only; the roll must never hard-fail as the pool grows.

## Acceptance criteria
- [ ] In one run, no augment appears in two consecutive draft offers.
- [ ] A reroll never offers an augment from the offer it replaces.
- [ ] The first draft of a fresh run still includes a Common Bolt (T0048).
- [ ] Card frames, gems, tier word, flip, chime and owned dot behave exactly as before on offers that obey the new rule.

## Design (architect, yoga)

### Files
- edit `src/core/augments.ts` - `rollOffer` gets the not-offered-again rule (new `exclude` param, relax guard, opening-reroll bolt skip)
- edit `src/systems/RunFlow.ts` - remember the last offer's ids and pass them to both rolls
- edit `tests/core/augments.test.ts` - 3 new tests + rename one existing test

### Interfaces
```ts
// core/augments.ts (param appended, all old call sites keep compiling)
export function rollOffer(rng: Rng, pool: readonly AugmentDef[], count: number, wave: number, opening = false, exclude?: readonly string[]): AugmentCopy[]
// systems/RunFlow.ts, field directly after the existing `offer` field (line 38)
private lastOffer: string[] = [];
```

### Steps
1. Replace the body of `rollOffer` in `src/core/augments.ts` with exactly this (keep the signature line as above):
```ts
  const open = opening ? pool.filter((a) => a.first.damage > 0 || a.opening) : pool;
  // The augments of the offer just before this one are not offered again.
  const excluded = new Set(exclude ?? []);
  // If that leaves fewer than 3 eligible, the rule relaxes for this offer only, so the roll never hard-fails.
  const banned = open.filter((a) => !excluded.has(a.id)).length < 3 ? new Set<string>() : excluded;
  const taken = new Set<string>();
  const offers: AugmentCopy[] = [];
  if (opening && !banned.has(bolt.id)) {
    // The opening draft (not its reroll, which excluded the bolt) offers the game's default shot: a Common Bolt.
    offers.push({ id: bolt.id, tier: 'common' });
    taken.add(bolt.id);
  }
  for (let i = offers.length; i < count; i++) {
    const tier = rollTier(rng, wave);
    const candidates = open.filter((a) => !taken.has(a.id) && !banned.has(a.id) && (a.tier === undefined || a.tier === tier));
    const picked = rng.pick(candidates);
    taken.add(picked.id);
    offers.push({ id: picked.id, tier });
  }
  return offers;
```
Update the doc comment: after "so the opening pick is never a dead end" add " - except when the bolt is excluded (the opening reroll), when the first card is rolled like the rest", and after that sentence add "`exclude` is the ids of the offer just before this one: those augments are not offered again; if they leave fewer than 3 eligible the rule relaxes for this offer only, so the roll never hard-fails."
2. `src/systems/RunFlow.ts`: add the `lastOffer` field (with the doc "The ids of the last offer: the next draft (and its reroll) does not offer them again.") after the `offer` field. In `openDraft()` and `rerollOffer()` change the roll to `this.offer = rollOffer(this.run.rng, AUGMENTS, 3, this.draftWave, this.run.wave === 0, this.lastOffer);` and put `this.lastOffer = this.offer.map((c) => c.id);` directly after it in both.
3. `tests/core/augments.test.ts`: rename the test at line 195 to "the opening draft always offers a Common Bolt" (drop "(and its reroll)"), and add these three tests directly after it:
```ts
  it('the next draft never offers an augment the last one did', () => {
    for (let seed = 1; seed <= 100; seed++) {
      const rng = new Rng(seed);
      let last: string[] = [];
      for (let i = 0; i < 12; i++) {
        const offer = rollOffer(rng, AUGMENTS, 3, i + 1, i === 0, last);
        for (const c of offer) expect(last.includes(c.id)).toBe(false);
        last = offer.map((c) => c.id);
      }
    }
  });
  it('a reroll offers nothing from the offer it replaces (the opening reroll drops the bolt)', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const first = rollOffer(new Rng(seed), AUGMENTS, 3, 1, true);
      const rerolled = rollOffer(new Rng(seed), AUGMENTS, 3, 1, true, first.map((c) => c.id));
      expect(rerolled.length).toBe(3);
      expect(new Set(rerolled.map((c) => c.id)).size).toBe(3);
      for (const c of rerolled) expect(first.some((f) => f.id === c.id)).toBe(false);
    }
  });
  it('the rule relaxes, rather than hard-failing, when exclusions leave fewer than 3 eligible', () => {
    const tiny = AUGMENTS.slice(0, 4); // bolt, lance, lead, splash
    for (let seed = 1; seed <= 50; seed++) expect(rollOffer(new Rng(seed), tiny, 3, 5, false, ['bolt', 'lance'])).toHaveLength(3);
  });
```

### Pitfalls
- The opening reroll (wave 0, `opening = true`) must NOT force-push the bolt: the `!banned.has(bolt.id)` check is what makes it satisfy "a reroll never offers from the replaced offer", since the first card of the first draft was always the bolt.
- `lastOffer` must survive `finishDraft` (which clears `this.offer`) - that is how the next draft learns the previous offer's ids; never clear it there.
- The relax guard counts on the opening-filtered pool `open` and drops only `banned`, never `taken` - cards must stay three different augments.
- Every existing `rollOffer` call site (tests/core/augments, mark, rally, tiers) omits `exclude` and is unchanged; DraftScene and all card rendering (frames, gems, tier word, flip, chime, owned dot) are untouched.

### Tests
- The three new tests in tests/core/augments.test.ts: the rule lives in src/core (rollOffer), and later pool/tier changes could silently break it.

## Result (attempt 1, inet-racing)

The draft now excludes the augments from the immediately previous offer: `rollOffer` in `src/core/augments.ts` gained an `exclude` param with a relax guard (so it never hard-fails) and a bolt-skip so the opening reroll doesn't re-offer the bolt, while `src/systems/RunFlow.ts` remembers the last offer's ids and passes them into both the draft and reroll rolls. Three new unit tests in `tests/core/augments.test.ts` cover no-repeat, reroll exclusion, and the relax guard, and the old bolt test was renamed since rerolls no longer force the bolt. Card rendering, tiers, chime and all other draft behavior are untouched; `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 19.0 min

```
projects/chokepoint/game/src/core/augments.ts      | 17 +++++++++----
 projects/chokepoint/game/src/systems/RunFlow.ts    |  8 ++++--
 .../chokepoint/game/tests/core/augments.test.ts    | 29 +++++++++++++++++++++-
 3 files changed, 46 insertions(+), 8 deletions(-)
```
