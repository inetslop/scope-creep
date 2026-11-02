---
id: T0448
title: "The clumps: the wave that walks in clumps"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T22:27:29Z
claimed_at: 2026-11-02T22:54:31Z
epic: E22
designer: inet-racing
---

## Goal
The sixth wave tag, "clumps": deep-run waves sometimes walk in clumps of 2–3 with gaps between, and the gaps break the kill chain — a wave that tests the builds that live off the chain (the Feast's glow, the combo gold).

## Details
- The tag: "clumps". From wave 26, every 11th wave that is not quiet, tight, rush, short cut, double or a boss wave wears the tag. The schedule rides the short cut's own shape (isShortCutWave in core/waves.ts, T0440 — the closest example): a wave wears one tag, and a boss wave's plan is never tagged.
- The clumps: the plan's enemies in order, grouped 2, 3, 2, 3, … (the last clump takes whatever is left, 1–3). The spawn interval inside a clump is the wave's normal one; between clumps, a 4 s gap (simulation time, 2× fast-forward scales it).
- A 4 s gap always breaks the kill chain: the chain's window is 1.5 s + 0.4 s per Feast (T0031, T0235), so even a run with five Feasts (3.5 s) breaks.
- The chip: "clumps" on the preview card's chip line and on the wave banner's chip, the tag chip's existing mechanism (T0422, T0080) — no change to the preview's token row.
- The teach: the first clumps wave's preview names it once, under the preview card, the tag-teach's shape (T0092): "the wave comes in clumps — the gaps break the chain".
- The preview shows the total count; the wave ends and pays the normal bonus.
- The waves reference (the pause's waves card, T0264) lists the clumps — it reads core/waves.ts; if the list is not automatic, add the line there.

## Acceptance criteria
- [ ] A unit test pins the clumps schedule: from wave 26 every 11th non-quiet/tight/rush/short-cut/double/boss wave is clumps, no wave wears two tags, and no boss wave is clumps.
- [ ] In a clumps wave the enemies spawn in clumps of 2–3 (2, 3, 2, 3, …) with a 4 s gap between clumps and the wave's normal interval inside a clump.
- [ ] The preview shows the total count with the "clumps" chip; the banner wears the chip; the first clumps wave's teach line shows once, never again in that run.
- [ ] The waves reference card lists the clumps.
