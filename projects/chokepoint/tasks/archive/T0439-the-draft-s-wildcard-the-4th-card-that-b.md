---
id: T0439
title: "The draft's wildcard: the 4th card that becomes a Rare or Epic"
assignee: desktop
size: L
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T18:33:27Z
claimed_at: 2026-11-02T18:46:34Z
finished_at: 2026-11-02T19:05:34Z
---

## Goal
Every 5th draft's 4th card is a Wildcard — a neutral card that, when picked, resolves to a random pool augment at Rare or Epic: a real gamble in the draft (the known card or the hidden Rare+), the draft's most special moment, in E4's own language ("sometimes a card is something special").

## Details
- **The card.** In the 4-card drafts (every 5th, T0065) the 4th card is the Wildcard: a plain white card in the draft card's own frame and size, one small muted-yellow "?" (the milestone yellow, T0334) at its center, the name "Wildcard" and the line "becomes a Rare or Epic augment". No tier word (it has no tier until it resolves), no owned dot (T0044), no "×N" count (T0094), no fit row (T0243 — its landing is the surprise), and no tier chime on its offer flip (T0065's 4th-card chime is replaced by the quiet flip).
- **The resolution.** Its identity rolls with the offer, in the offer's own rng stream (so a reroll rolls a new one, like any other 4th card): a random augment from the pool the draft draws from — the pool whatever the queue lands it to be; the Wildcard rides the pool and never names an augment — at the run's own tier odds (T0011) that never land Common: a Common roll becomes a Rare. It never is the immediately previous offer's augment (T0052's rule) and never is one of the other three cards already on its own table (it is always something new). The identity stays hidden until pick.
- **The reveal.** Picking the Wildcard flips it face-up over ~300 ms (the draft reveal's own flip, T0024, a touch longer) to its resolved identity — the augment's icon, its name and "· Rare" / "· Epic" in the tier's own color (T0026's language) — as it joins the hand, and plays its tier chime (T0032) at the resolved tier (two notes Rare, three Epic). The flip happens on pick, before the draft closes, so the reveal is seen in the draft; the build phase opens as today.
- **After the reveal it is ordinary.** The hand holds it as a card of that augment and tier: the hand bar's tier word (T0100), placement, slots, codex entries and everything else work with no new rule.
- **Everything else is untouched.** The 3-card drafts (every other draft, and the pre-wave-1 draft with its Common Bolt floor, T0048) are byte-identical; the draft's odds line reads as today for the first three cards; the reroll (T0276) re-rolls it like any other 4th card; Iron and normal runs both get it (modes never touch the draft); the codex (T0221) is unchanged — the Wildcard is not in the pool and the 16-cap is untouched.
- **The save.** The run's save writes when the run enters the build phase (after every draft), so an unresolved Wildcard is never in a save; a resume never holds one.
- No new key, button, HUD element or scene; the draft overlay keeps its size at 412x915 and 1280x720.

## Acceptance criteria
- [ ] A 4-card draft (every 5th) offers its 4th card as the Wildcard — plain white, muted-yellow "?", "Wildcard", "becomes a Rare or Epic augment" — with no tier word, owned dot, "×N", fit row or tier chime on its offer flip.
- [ ] Picking it flips it (~300 ms, before the draft closes) to its resolved identity (icon, name, "· Rare"/"· Epic" in the tier's color), plays its tier chime at the resolved tier, and then the card plays, stacks and shows everywhere as an ordinary card of that augment and tier.
- [ ] A resolved Wildcard is never Common (a Common roll at the run's odds becomes a Rare), never the immediately previous offer's augment, and never one of the other three cards on its own table; a reroll of a 4-card draft offers a new Wildcard.
- [ ] The 3-card drafts, the pre-wave-1 draft, the odds line, the codex and Iron runs are byte-identical to today; no run save ever holds an unresolved Wildcard; `npm run check` and the desktop + mobile smoke pass.

## Design (architect, desktop)

### Files
- edit `src/content/types.ts` — add one optional field to `AugmentCopy` (the flag a 4-card draft's 4th card carries until picked).
- edit `src/core/augments.ts` — `rollOffer`: roll the 4th card of an every-fifth draft as the Wildcard (Common roll → Rare, set the flag) and extend its doc comment.
- edit `src/scenes/DraftScene.ts` — the Wildcard's hidden face, its quiet offer flip, and the reveal flip + tier chime + close in `pick()`.
- edit `src/systems/RunFlow.ts` — `finishDraft`: strip the flag when the pick joins the hand (1 line).
- edit `src/debug/runChecks.ts` — extend the `draft.offer` and `augments.valid` invariants.
- edit `tests/core/augments.test.ts` — Wildcard unit tests in the existing `rollOffer` describe.

### Interfaces
```ts
// src/content/types.ts — AugmentCopy gains:
  /** The every-fifth draft's 4th card: rolled with the offer, hidden until the pick. Stripped before it joins the hand. */
  wildcard?: boolean;
```
No other signature changes. `RunFlow.offer` stays `AugmentCopy[]`; `finishDraft(pick: AugmentCopy | undefined)` is unchanged.

### Steps
1. `src/core/augments.ts` `rollOffer` (line 424): add after the `banned` line: `// The every-fifth draft's fourth card is the Wildcard: hidden until the pick, and a Common roll becomes a Rare.` / `const wildSlot = count === 4 && draftCardCount(wave) === 4;`. In the loop: `const wildcard = wildSlot && i === count - 1;`, `let tier = rollTier(rng, wave);` then `if (wildcard && tier === 'common') tier = 'rare';`, and `offers.push(wildcard ? { id: picked.id, tier, wildcard: true } : { id: picked.id, tier });`. The candidate filter, `taken`, `banned` and rng calls are otherwise untouched (the wildcard consumes exactly one `rollTier` + one `pick`, so the stream stays byte-identical for the other three cards). Trigger is `draftCardCount(wave) === 4` deliberately: the pre-wave-1 draft's "Fourth card" node (count 4, draft 1) offers no Wildcard.
2. `src/systems/RunFlow.ts` line 167: `this.run.takeAugment({ id: pick.id, tier: pick.tier }); // the hand holds the plain copy: the wildcard flag never leaves the draft`.
3. `src/scenes/DraftScene.ts`:
   - `cards` (line 55) gains optional fields: `hidden?: Phaser.GameObjects.GameObject[]; resolved?: Phaser.GameObjects.GameObject[]`.
   - `pick` (line 59) becomes: guard as today; then `const copy = game.flow.offer[i];` and `const close = (): void => { if (hint) { this.tweens.add({ targets: hint, alpha: 0, duration: 150, ease: 'Quad.easeIn' }); this.time.delayedCall(150, () => this.scene.stop()); } else { this.scene.stop(); } game.flow.finishDraft(copy); };`; then `const hidden = cards[i]?.hidden; const resolved = cards[i]?.resolved;` and `if (hidden && resolved) { this.tweens.add({ targets: cards[i]!.button.container, scaleX: 0.03, duration: 150, ease: 'Quad.easeIn', yoyo: true, repeat: 1, onYoyo: () => { hidden.forEach((o) => o.setVisible(false)); resolved.forEach((o) => o.setVisible(true)); getSfx(this)?.tierChime(copy.tier); }, onComplete: close }); } else { close(); }`.
   - In `buildRow`'s `lines` map: first line after `const b = getAugment(copy.id);` → `if (copy.wildcard) return { copy, b, towerLine: undefined, addedLine: undefined, fit: undefined };` (no line texts are created). `H` map: `(l) => (l.towerLine && l.addedLine ? l.towerLine.height + 10 + l.addedLine.height + 117 + (l.fit ? 10 + l.fit.height : 0) : 0)`.
   - In the `cards` map, right after `const t = -H / 2;`, add the Wildcard branch and `return` from it:
```ts
        if (copy.wildcard) {
          // The Wildcard's face: plain white, the milestone-yellow "?" where the icon would be, its name and one line.
          const button = makeButton(this, 0, 0, '', () => pick(i), { width: cw, height: H, radius: Math.round(22 * k), accent: PALETTE.yellow });
          const question = this.add.text(0, t + 31, '?', titleStyle(24, PALETTE.yellow)).setOrigin(0.5);
          const wName = this.add.text(0, t + 66, 'Wildcard', titleStyle(four ? 16 : 20)).setOrigin(0.5);
          const wLine = this.add.text(0, t + 101, 'becomes a Rare or Epic augment', textStyle(four ? 12 : 14, PALETTE.muted, { align: 'center', wordWrap: { width: cw - 24 } })).setOrigin(0, 0);
          const key = this.add.text(-cw / 2 + 14, t + 10, String(i + 1), textStyle(12, PALETTE.faint, { fontStyle: 'bold' }));
          // Its resolved identity, built now and hidden until the pick: the augment's icon, name and tier word.
          const icon = artScale(this.add.image(0, t + 31, augmentTexture(b.id)), 1.3 * k);
          const name = this.add.text(0, 0, b.name, titleStyle(four ? 16 : 20)).setOrigin(0.5);
          const tierWord = this.add.text(0, 0, ` · ${tierName(copy.tier)}`, titleStyle(four ? 16 : 20, tierGemColor(copy.tier))).setOrigin(0.5);
          name.setPosition(-tierWord.width / 2, t + 66);
          tierWord.setPosition(name.width / 2, t + 66);
          const hidden = [question, wName, wLine, key];
          const resolved = [icon, name, tierWord];
          for (const o of resolved) o.setVisible(false);
          button.content.add([...hidden, ...resolved]);
          // The offer flip, quiet: no tier chime, no epic lengthening (the tier is hidden until the pick).
          const back = artScale(this.add.image(0, 0, GEM_TEXTURE)).setTint(PALETTE.faint);
          button.content.setVisible(false);
          button.container.add(back);
          const flip = this.tweens.add({
            targets: [button.container],
            scaleX: 0.03,
            delay: i === 3 ? 420 : 100 + i * 60,
            duration: 100,
            ease: 'Quad.easeIn',
            yoyo: true,
            repeat: 1,
            onYoyo: () => { back.setVisible(false); button.content.setVisible(true); },
            onComplete: () => { button.container.setScale(1); flipped[i] = true; },
          });
          flipTweens.push(flip);
          return { button, frame: undefined, hidden, resolved };
        }
```
   The normal path after the branch is byte-identical to today (its chime/leg/shimmer are never reached by a Wildcard). No new imports (all needed names are already imported). Update the scene's header comment: the four-card draft's 4th card is the Wildcard, hidden until the pick.
4. `src/debug/runChecks.ts`: replace the `draft.offer` entry (line 193) with a block form: `if (hook.overlay !== SCENES.draft) return null; const offer = g.flow.offer; const count = draftCardCount(g.flow.draftWave); if (offer.length !== count) return \`draft offers ${offer.length} cards, expected ${count}\`; const wild = offer.filter((c) => c.wildcard); if (count !== 4) return wild.length === 0 ? null : \`a ${count}-card draft offers a wildcard\`; return wild.length === 1 && offer[3]!.wildcard === true && offer[3]!.tier !== 'common' ? null : 'the four-card draft's wildcard is wrong';` — and in `augments.valid` (line 198) add `|| c.wildcard` to the loop's condition.
5. `tests/core/augments.test.ts`, inside `describe('rollOffer', ...)`: four tests, each over seeds — (a) `rollOffer(new Rng(seed), AUGMENTS, 4, 10)`: `offer[3].wildcard === true`, `offer.slice(0,3)` have none; (b) `rollOffer(..., 3, 5)` and `rollOffer(..., 4, 1)` (the pre-wave-1 node draft) have no wildcard at all; (c) over 300 seeds the wildcard's tier is never `'common'` and both `'rare'` and `'epic'` appear; (d) a 10-draft loop like the existing "never offers an augment the last one did" with `count = d % 5 === 0 ? 4 : 3` — every card (wildcard included) is not in `last` and all ids in the offer are unique; plus a reroll test: `second = rollOffer(rng, AUGMENTS, 4, 10, false, first.map((c) => c.id))` has `second[3].wildcard === true` and `second[3].id !== first[3].id`.

### Pitfalls
- The wildcard must roll LAST (`i === count - 1`), so `taken` already holds the other three cards — never hard-code index 3 (the opening draft's fixed Bolt push shifts the loop).
- Its offer flip must not leak the resolved tier: duration 100 (never the epic 175), no `tierChime`, no `epicShimmer`.
- The reveal must swap faces in `onYoyo` (the card is a line at that moment), not at tween start; chime at the same moment; `close` in `onComplete` (~300 ms total) — the build phase opens only after.
- `this.picked = true` is set before the reveal, so `r`/digit keys and re-taps cannot re-fire mid-reveal; reroll is blocked the same way.
- `finishDraft` must strip the flag (`takeAugment({ id, tier })`): the hand, the save and the codex see plain copies; saves never write during `'draft'`, so an unresolved Wildcard is never persisted.
- Do not create the `towerLine`/`addedLine` text objects for the wildcard card (the `H` map would read `undefined.height`); early-return in `lines` and in the `cards` map.
- The hidden line wraps on the 121 px portrait-4 card (2 lines); it stays within `CARD_H` because it starts at `t + 101`.
- Smoke picks card 0, never the Wildcard — leave `pick(0)` alone.

### Tests
- `tests/core/augments.test.ts`: the five Wildcard tests in Step 5 (4-card shape, 3-card/node-draft absence, never-Common + both tiers seen, previous-offer/own-table exclusion, reroll rolls a new one).

## Result (attempt 1, desktop)

The every-fifth draft's 4th card is now the Wildcard: `rollOffer` (src/core/augments.ts) rolls it last in the offer's own rng stream — a Common roll becomes a Rare, it can never be the previous offer's augment or one of its own three tablemates, and a reroll re-rolls it — carrying a new optional `wildcard` flag on `AugmentCopy` (src/content/types.ts). DraftScene shows it as a plain white card with a muted-yellow "?", "Wildcard" and "becomes a Rare or Epic augment", no tier word/dot/count/fit row and a quiet offer flip; picking it flips to the resolved identity (icon, name, tier word in the tier's color) over ~300 ms with the tier chime, then closes and the card plays as an ordinary card. `finishDraft` strips the flag so the hand, saves and codex only ever see plain copies, and the `draft.offer`/`augments.valid` invariants (src/debug/runChecks.ts) now police the wildcard's shape and tier. `npm run check` (625 tests) and the desktop + mobile smoke both pass.

- Self-review: APPROVE
- Time: 19.0 min

```
projects/chokepoint/game/src/content/types.ts      |  2 +
 projects/chokepoint/game/src/core/augments.ts      | 12 +++-
 projects/chokepoint/game/src/debug/runChecks.ts    | 12 +++-
 projects/chokepoint/game/src/scenes/DraftScene.ts  | 83 +++++++++++++++++++---
 projects/chokepoint/game/src/systems/RunFlow.ts    |  2 +-
 .../chokepoint/game/tests/core/augments.test.ts    | 52 ++++++++++++++
 6 files changed, 146 insertions(+), 17 deletions(-)
```
