---
id: T0403
title: "The storm: the third mode off the menu"
size: L
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-11-02T04:17:18Z
epic: E17
---

## Goal
A third card on the menu, Storm: a run that plays faster and pays richer — every wave rushes and every wave pays double the wave bonus gold. Tempo is the price, in-run gold is the pay; the choice is a mode's, not a few gold's.

## Details
- **The menu card.** Under the Iron card, in the Iron card's language: a white card with the bold name "Storm" and a muted sub-line "every wave rushes · 2× wave gold". Included in the menu's fit-sum like the Iron card, so the column still fits at 412x915 and 1280x720 without scrolling. Tapping it starts a storm run through the same flow Play and Iron use. The storm is its own mode: it is not combined with Iron.
- **The run remembers.** A storm run carries the mode for the whole run the same way it carries Iron; a saved and resumed storm run is still a storm run.
- **The wave rules (storm runs only):**
  - No quiet waves: the every-4th breather does not happen — no halving, no "quiet" tag or chip, no quiet teach line, no ×2 quiet kill gold.
  - Every non-boss wave is a rush wave: all its walkers move at the rush factor (1.5×, the rush tag's own value, T0337), and the wave banner and the preview wear the rush chip exactly as a normal-play rush wave does. The one-time rush teach line under the preview shows on the run's first build phase — wave 1 is the run's first rush wave, so its teach moment is wave 1 (not the normal-play first rush wave) — and never again that run.
  - Tight waves keep their tight tag and bunched spawns; a tight storm wave wears both chips (tight, rush) on the banner and the preview.
  - Boss waves (every 10th) keep the boss's own pace: no rush chip, the boss lane unchanged — but the wave bonus still doubles.
  - The wave-clear gold bonus is doubled (×2) for every wave in the run.
  - Everything else is untouched: bank interest, the early-send gold, rerolls, lives, the last stand, the clean streak, level augments.
- **The claim.** The claim card shows a "Storm" line where an Iron run shows "Iron" — same place, same style.
- **Normal and Iron runs are byte-identical** — the storm rules apply only while the mode is on.

## Acceptance criteria
- [ ] The menu shows a white "Storm" card under the Iron card with the sub-line "every wave rushes · 2× wave gold"; the menu column still fits at 412x915 and 1280x720 without scrolling.
- [ ] A storm run's wave 1 banner wears the rush chip, and the preview's one-time rush teach line shows in the first build phase and never again that run.
- [ ] No wave in a storm run is quiet: wave 4 is full size, with no quiet chip, no quiet teach line and normal kill gold (no ×2 quiet).
- [ ] Every non-boss wave's walkers move at 1.5× in a storm run; a boss wave shows no rush chip.
- [ ] A cleared wave in a storm run pays 2× the normal wave bonus gold, on every wave including boss waves.
- [ ] The claim card shows a "Storm" line where an Iron run shows "Iron".
- [ ] A normal run and an Iron run are byte-identical: same waves, same bonus, same UI.
