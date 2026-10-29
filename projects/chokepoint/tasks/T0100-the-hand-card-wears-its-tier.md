---
id: T0100
title: The hand card wears its tier
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T02:55:25Z
epic: E4
---

## Goal
The hand names its tier the way the draft does: the hand card's tier word (the shared tier card look, T0008) is drawn in the tier's own color — the hand-side twin of T0097's draft-card change.

## Details
- A hand card already wears the shared tier card look — frame, gem row and tier word in plain ink (T0008). This task colors the word: "· Rare" in blue, "· Epic" in purple — the same tier colors the draft cards wear after T0097, and the same colors as the card's own frame and gems. A Common hand card stays the plain name, no word.
- If a hand card turns out to carry no word yet, add it first in the draft's style (T0026 — "Name · Rare" on the name line) and then color it; either way the finished word matches T0097's draft word in style and color.
- The word keeps the hand card's existing name-line style and position; the card grows to fit if needed (T0072's text-fit pattern). The frame and gem row (T0008) are untouched.
- No rule change, no input, no sound. The draft cards are T0097's and are not touched here.
- Closest examples: T0097 (the same color change on the draft surface) and the tier word itself (T0026).

## Acceptance criteria
- [ ] A Rare hand card reads "Name · Rare" with the word in blue (the Rare frame's blue); an Epic hand card reads "· Epic" in purple; a Common hand card shows the plain name.
- [ ] The word matches T0097's draft word in style and color; the hand card's frame and gem row (T0008) are unchanged.
- [ ] The card fits its text (T0072 pattern) at 412x915 and 1280x720; a Common card renders byte-identically to today.
- [ ] Desktop and mobile smoke pass.
