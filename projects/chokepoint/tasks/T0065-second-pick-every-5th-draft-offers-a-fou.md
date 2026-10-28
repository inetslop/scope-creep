---
id: T0065
title: "Second pick: every 5th draft offers a fourth card"
assignee: desktop-4070
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 2
created: 2026-10-28T13:54:28Z
claimed_at: 2026-10-28T22:09:43Z
epic: E4
design_attempts: 1
---

## Goal
A beat of abundance in the run's rhythm: every 5th draft offers four cards instead of three, so a deep run gets a moment to branch where three cards never could.

## Details
- **When:** counting the pre-wave-1 draft as draft 1, every 5th draft (5, 10, 15, …) offers a fourth card alongside the usual three. The player first sees it around wave 4.
- **The fourth card rolls exactly like the others:** the same tier odds for that wave (T0011), the same no-repeat rule (T0052 — it may not be any augment in the same offer or in the immediately previous offer), and T0048's first-draft floor is untouched (it acts only on draft 1).
- **Reveal:** the fourth card flips in last — ~200 ms after the third lands — with its own tier chime (T0032); the Epic frame shimmer (T0041) applies to it if it is Epic.
- **Picking:** picking any of the four ends the draft; the un-picked cards go to the hand as usual. The reroll (T0036) on a four-card draft re-rolls all four (same flips, chimes and price).
- **Layout** (both layouts, in the same row area the three-card row uses — no new scroll or zoom):
  - 1280x720: four cards in one row sharing the three-card row's width; each card is ~25% narrower than its three-card size.
  - 412x915: four cards in a 2×2 grid in the same area (two per row, two rows where the three-card row was); each card ~55% of the three-card width.
  - Cards keep the same structure (frame, name line, effect line, gem row, the owned dot T0044); type may shrink at most ~20% and no card text goes below 12 px.
- No label, no new key, no pause-screen line — the fourth card's own late flip is the teaching.
- Chained behind T0064 on purpose: T0064 adds an Epic-only entry to the pool and this changes the offer count in the same draft module, so the two never build at once.

## Acceptance criteria
- [ ] Drafts 1–4, 6–9, 11–14, … offer exactly three cards exactly as today; drafts 5, 10, 15, … offer four.
- [ ] On the 5th draft the fourth card flips in last (~200 ms after the third) with its tier chime; the draft still ends on one pick and the un-picked cards land in the hand.
- [ ] At 1280x720 the four cards fit one row in the existing row area with no scroll; at 412x915 they fit a 2×2 grid in the same area with no scroll; all card text is at least 12 px and the name line stays bold.
- [ ] The fourth card never repeats an augment from its own offer or the immediately previous one (T0052); a reroll of a four-card draft re-rolls four cards.
- [ ] The hand, the tower panel, the reroll button and every three-card draft are unchanged.

## Design (architect, desktop-4070)

DESIGN:
### Files
- `src/core/augments.ts` — add `draftCardCount(draftNumber: number): number` beside `rollOffer`. Body: `return draftNumber > 0 && draftNumber % 5 === 0 ? 4 : 3;`. No change to `rollOffer` itself.
- `src/systems/RunFlow.ts` — import `draftCardCount`; in `openDraft()` (line 92) and `rerollOffer()` (line 106) replace the literal `3` in `rollOffer(this.run.rng, AUGMENTS, 3, this.draftWave, ...)` with `draftCardCount(this.draftWave)`. Update the two doc comments that say "three". Nothing else: `finishDraft`, `REROLL_COST`, `reroll()` untouched.
- `src/scenes/DraftScene.ts` — all layout/flip changes are internal; one signature change: `epicShimmer(scene, x, y)` gains a fourth param `w: number`.
- `src/debug/runChecks.ts` — import `draftCardCount`; add one invariant line (see Tests).
- `tests/core/augments.test.ts` — tests (see Tests).

### Interfaces
- `core/augments.ts`: `export function draftCardCount(draftNumber: number): number` — cards in the draft at draft number `draftNumber` (1-based; equals `RunFlow.draftWave`). 4 when a multiple of 5, else 3.
- `RunFlow.offer: AugmentCopy[]` unchanged as a type — it is 4 long every fifth draft; `RunFlow.draftWave` is the draft number to pass in (already set to `this.run.wave + 1` in `openDraft`).

### Steps
1. In `DraftScene.create()`: `const four = game.flow.offer.length === 4`; size `flipped` from `game.flow.offer.map(() => false)` instead of `[false, false, false]`. Add `cardWidth = (w: number): number => !four ? CARD_W : w < 740 ? 121 : 165` (portrait ≈55% of 220; landscape makes the 4-card row span 708, the same as today's 3-card span).
2. `cardSlot(i, w, h)`: keep the existing 3-card branches; for `four`, landscape: `{ x: w / 2 + (i - 1.5) * (cw + 16), y: h / 2 + 10 }` where `cw = cardWidth(w)`; portrait 2×2: `const r = Math.floor(i / 2); const top = Math.max(70, (h - 2 * (CARD_H + 16) - 90) / 2); return { x: w / 2 + (i % 2 === 0 ? -1 : 1) * (cw + 24) / 2, y: top + 84 + CARD_H / 2 + r * (CARD_H + 16) };`. Leave `rerollSlot`, title/subtitle/odds lines and `layout()` body untouched (`layout` calls the updated `cardSlot`).
3. `buildRow`: at its top compute `const cw = cardWidth(size.width); const k = cw / CARD_W;` and use `cw` instead of `CARD_W` in: `makeButton(..., { width: cw, height: CARD_H, radius: Math.round(22 * k), accent: ... })`, `textX = -cw / 2 + 42 * k`, glyph x `-cw / 2 + 26`, key hint x `-cw / 2 + 14`, owned-dot x `cw / 2 - 14`, icon `artScale(..., 1.3 * k)`, `wordWrap: { width: Math.round(cw - 58 * k) }`, and the Rare/Epic frame `strokeRoundedRect(-cw / 2 - 1, -CARD_H / 2 - 1, cw + 2, CARD_H + 2, Math.round(23 * k))`.
4. Text: body lines 14 → `four ? 12 : 14` (still `textStyle`); name keeps `titleStyle(four ? 16 : 20)` (stays bold); key hint and legend/odds sizes unchanged (already ≥12).
5. Flip: `delay: i === 3 ? 420 : 100 + i * 60` (third starts 220 ms, ends 420 ms; fourth then starts ≈200 ms after). The existing `onYoyo` already plays `tierChime(copy.tier)` and the Epic branch's `epicShimmer(this, p.x, p.y)` — pass `cw` as the new param.
6. `epicShimmer(scene, x, y, w)`: sweep the band from `x - w / 2 + 36` to `x + w / 2 - 36` (was ±CARD_W/2).
7. Reroll needs no change: `rerollOffer()` re-rolls `this.offer` (all four) for the same `REROLL_COST`, and `buildRow(game.flow.offer)` in `reroll()` already redraws from the offer. Picking any card already works: `pick(i)` is per-index and the digit handler uses `cards.length`.

### Pitfalls
- Do not add a `four` branch inside `rollOffer`; identical roll rules come free from passing `count = 4`. The opening floor must stay draft-1-only: `draftCardCount(1) === 3` — never change it to depend on `opening`, and leave the `Bolt` push in `rollOffer` alone.
- The draft number is `this.draftWave` (1-based). Don't invent a new counter in RunFlow; the pre-wave-1 draft is draft 1, so drafts 5, 10, 15, ... get four cards.
- No scroll/zoom: don't touch `layout()`'s non-card parts or add a camera. A mid-draft resize repositions via `cardSlot` but card widths/fonts are baked at `buildRow` time — acceptable, do not "fix" it by rebuilding cards.
- Don't rename `CARD_W`/`CARD_H` or touch the reroll button, legend, odds line, or key hint (acceptance: labels/key/pause unchanged). Smoke mode is fine as-is: `pick(0)` at 800 ms picks card 0 of four.

### Tests
- `tests/core/augments.test.ts`: import `draftCardCount`. New `describe('draftCardCount', ...)`: loop `d = 1..25`, expect `draftCardCount(d) === (d % 5 === 0 ? 4 : 3)`; plus a seeded check, `for seed 1..30`: `const offer = rollOffer(new Rng(seed), AUGMENTS, 4, 5); expect(offer).toHaveLength(4); expect(new Set(offer.map((c) => c.id)).size).toBe(4);`
- `debug/runChecks.ts`: one new invariant, same one-line style as its neighbours (near the augments entry): name `'draft.offer'`; return a message when `g.run.phase === 'draft' && g.flow.offer.length !== draftCardCount(g.flow.draftWave)`, else null — e.g. `` `draft offers ${g.flow.offer.length} cards, expected ${draftCardCount(g.flow.draftWave)}` ``.
- Verification: `npm run check` must pass; `npm run smoke` unchanged (auto-pick still fires on the four-card draft).

## Note (by hand, 2026-10-28)

No longer waits on T0064: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Attempt 1 interrupted (desktop-4070)

The runner stopped mid-task (crash, restart or reboot). Requeued.
