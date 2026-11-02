---
id: T0431
title: "The bank's first pay says what it is: the interest rule, taught once"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T15:49:41Z
claimed_at: 2026-11-02T15:50:16Z
designer: yoga
---

## Goal
A first-time player who sees the "bank +N" line on the stats card learns, once, that their gold earns interest — closing a "nothing unexplained" gap (Pillar 8) on a rule that today only shows a number.

## Details
- On the run's first build phase in which the stats card's "bank +N" line is visible (gold at least 20, the line's own condition from T0374), one muted line appears once directly under it: "your gold pays 5% each wave" — the bank rate's own number (T0363) — in the line's own muted style, for about 1.5 s, then it fades and never shows again.
- It follows the run's one-time teach pattern (the early-send teach's shape, T0272; the first-clean-wave line's shape, T0314) in its own small file, so the stats card's own layout is untouched.
- It is a one-time teach, not a permanent mark: it never repeats, and it does not restate the number the "bank +N" line already shows — it only names the rule behind that number. It rides the build phase only, and adds no sound.

## Acceptance criteria
- [ ] On a run's first build phase where the "bank +N" line is visible, a muted "your gold pays 5% each wave" line appears once under it for ~1.5 s, then fades and never shows again in that run or any later run.
- [ ] It does not show when the "bank +N" line is not visible (gold under 20), and it never shows twice.
- [ ] It adds no permanent mark, no key, no button and no sound.
