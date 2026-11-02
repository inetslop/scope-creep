---
id: T0439
title: "The draft's wildcard: the 4th card that becomes a Rare or Epic"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T18:33:27Z
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
