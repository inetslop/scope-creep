---
id: T0385
title: "The bank's pay pops at the gold number"
size: S
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-11-01T22:18:47Z
claimed_at: 2026-11-01T22:40:55Z
finished_at: 2026-11-01T22:52:26Z
design_attempts: 1
---

## Goal
The bank's pay (T0363) is predicted (the "bank +N" line, T0374) and heard (the coin blip) but never seen at the moment it lands: the stats card's gold number wears the game's own gold pop for the exact amount paid.

## Details
- **When:** the moment the interest pay is added to the gold at a wave start — both pay paths (the countdown ending and the big button's early send), the bankPay's own moment. A pay of 0 (the gold below the +1 floor) pops nothing.
- **What:** a small gold "+N" pop at the stats card's gold number — the kill-gold pop's own look (a small gold "+N" in the HUD's own gold, popping in and fading over ~0.5 s). N is the exact interest pay at that moment — the same number the "bank +N" line showed during the build if the gold did not change in the meantime; if it did, the pop shows the actual pay, not the line's last value. The gold number updates exactly as today; the pop sits beside it inside the card, never leaving the card and never overlapping another line.
- **Not the send's gold:** the early-send's banked seconds-gold (the big button's own "+N" pill, T0223) is never part of this pop.
- **Silent:** the coin blip already plays at the pay; this task adds no sound.
- **Transient:** the pop is never part of the run save and a resumed run never replays it. It is its own small piece (its own file under ui/hud/, included by the stats card — the ComboBar's pattern), so the card's own lines are untouched; the coin trail to the number stays parked.

## Acceptance criteria
- [ ] At a wave start where the bank pays N ≥ 1 gold, on both pay paths, a small gold "+N" pops at the stats card's gold number for ~0.5 s, N the exact interest pay (the early-send gold excluded); the gold number updates exactly as today.
- [ ] At a wave start where the bank pays 0, nothing pops.
- [ ] The pop stays inside the stats card and never overlaps another line (the layout check in the gate); the card fits at 412x915 and 1280x720.
- [ ] No new sound (the coin blip unchanged), no new line or button on the stats card, and the "bank +N" build-phase line is unchanged.

## Rejected by architect (yoga)

the pop already exists — at both wave starts `RunFlow.bankPay` (RunFlow.ts:122-134, called from the countdown end and `startWaveNow`) already adds the exact interest pay, sets `registry 'bankPay'` and plays the coin blip, and `StatsCard.popGold` (StatsCard.ts:139-147) already wears the gold "+N" on the gold number for that exact pay (nothing pops on a 0 pay, the early-send's seconds-gold is excluded, the coin trail and "bank +N" line already run), so T0385 is already built.
