---
id: T0488
title: "Clumps: the level whose waves all come in clumps"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-03T10:58:13Z
claimed_at: 2026-11-03T11:18:20Z
epic: E21
designer: desktop
---

## Goal
The eighth level on the run-setup step: Clumps. A run that plays in one rhythm — every wave walks in clumps of 2 and 3, so a build that lives in the burst (splash, the beam, the feast chain across a clump) is the answer — and the ×1.40 coin multiplier pays for giving up the run's varied march.

## Details
- The pick (the level pattern, T0446/T0452): the level joins the run-setup step's level set — the name "Clumps", the dry one-liner "every wave comes in clumps", the set's current multiplier notch (bonus 0.40, ×1.40 — Plain's own), and the level chip (the level chips' own look, name only) under the stats card for the whole run. The levels reference (T0467) names it from the set, and the daily board pick's level order takes it in (T0452's insert).
- The rule (Clumps runs only): every non-quiet, non-boss wave walks in clumps of 2 and 3 with a 4 s simulation-time gap between clumps — the clumps tag's own values (T0448). The wave's number-based march tags do not fire in a Clumps run: no tight, rush, short cut, double, screen, scatter or halt wave — the march is the level's, one rhythm for the whole run.
- What keeps its own: a quiet wave (every 4th) stays a breather — its halving, its quiet tag and chip, its ×2 kill gold — and it does not clump; a boss wave keeps its own lane and pace.
- What is shown: nothing new. A Clumps wave wears no tag chip on the preview or the banner — the level chip says the march, nothing is shown twice. The word "clumps" is already readable in the waves reference (the pause's own line for the tag), so the one-liner at the pick teaches the whole rule.
- The tag's buzz and note (T0449, T0457) fire on a wave's own tag; a Clumps run's waves wear no march tag, so the run has no special-wave buzz or note — the rhythm is constant, taught once at the pick.
- The wave's own threat, hp scale, gate and spawn rules are untouched; only the march (the spacing into clumps) changes.
- A run without the level is byte-identical: same plans, same tags, same spawns, nothing new shown.

## Acceptance criteria
- [ ] The run-setup step offers "Clumps" with the one-liner "every wave comes in clumps" and the ×1.40 multiplier; picking it shows the "Clumps" chip under the stats card for the whole run, and the levels reference and the daily board pick's level order include it.
- [ ] In a Clumps run, a wave that would wear a march tag in normal play (tight, rush, short cut, double, screen, scatter or halt) walks in clumps of 2 and 3 with a 4 s simulation-time gap between clumps, and wears no tag chip on the preview or the banner — the level chip is the only march readout.
- [ ] In a Clumps run, no wave carries a number-based march tag; a quiet wave (every 4th) is halved, wears its quiet chip, pays ×2 kill gold and does not clump; a boss wave keeps its lane and pace.
- [ ] The wave's threat, hp scale and gate rules are unchanged: a Clumps wave has the same enemies and counts as the same wave in normal play, only spaced into clumps.
- [ ] The run has no special-wave buzz or note (the tag's own, T0449/T0457) while the level is on.
- [ ] A run without the level is byte-identical before and after: same plans, same tags, same spawns, same screens.
- [ ] Unit tests cover the Clumps run's plan (clumps spacing on a normal wave, no march tags, the quiet and boss exclusions, the ×1.40 multiplier) and the plain run's byte-identity.
