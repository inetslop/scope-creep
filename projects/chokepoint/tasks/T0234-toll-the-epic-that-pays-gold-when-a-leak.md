---
id: T0234
title: "Toll: the Epic that pays gold when a leak gets through"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T22:31:19Z
claimed_at: 2026-10-29T22:31:23Z
epic: E4
designer: desktop
---

## Goal
A new Epic-only augment with a new economy: income from what the run loses. The first augment that pays when you lose, not when you win.

## Details
- **Rolls only as an Epic card**, the same Epic-only roll as Mark, Rally, Mint and Anchor (T0012, T0020, T0021, T0023): Epic frame, gem row, "· Epic" name line, tier chime; **not offered in the pre-wave-1 draft** (no opening, like Mint); **no tech gate** (it rolls at the Epic odds from the first later draft on, like Mint); the codex (T0221), the what-if preview (T0096), the panel's DPS line (T0084, reads 0 like the other supports) and the end card's by-tower chip (T0216, "kills 0") cover it with no change of their own.
- **Card lines** (both forms, exact):
  - First: "While a Toll tower stands, every leak pays +2 gold."
  - Added: "Each extra Toll: +1 more gold per leak."
- **First form (a support with no attack of its own, like Mint):** while at least one Toll tower stands on the board, every enemy that reaches the exit pays Toll gold, on top of the life cost: each Toll tower contributes **+2 gold**, and each extra Toll copy in a tower contributes **+1 more** (a tower with 2 copies contributes +3, with 3 copies +4; two single-copy Toll towers together pay +4). The gold goes into the run's gold at the leak, handled where the Hauler's leak gold already is (T0057). It is run gold, not coins: the coin formula (T0001), the tally, the claim recipe and the pause worth line are untouched.
- **The moment:** the Toll gold shows as one small gold pop at the exit gate ("+N", N the total, the same gold pop as kill gold) ~100 ms after the leak's jolt. A Hauler leak still costs 1 life + 5 gold: its red "−5" pop stays, and the two pops sit side by side, never overlapping. A leak with no Toll tower on the board pays no gold and shows no pop — byte-identical to today.
- **Not a kill, so not a chain:** Toll gold is never doubled by last stand (T0054) or a quiet wave (T0071), never joins a kill-combo chain (T0031) or its milestone gold (T0066), and never pays a Mint (T0021). The leak itself — life cost, jolt (T0109), combo break (T0207), first-leak chip (T0107), exit warning (T0014) — is unchanged.
- **Look:** a Toll-first tower is a flat muted-gray disc at the tower's base — the Momentum disc's shape (T0064) in the HUD's muted-ink gray (take the palette name the quiet marks like "held · N" and the owned dot use), reading quiet, not a combat token — with one short tick per copy on its rim; an added Toll in any tower shows one small muted-gray tick, the tick language of the other added forms; the slot pip is Epic purple as usual (T0010).
- **Closest existing augment: Mint** (a passive Epic that pays gold without attacking). New: Mint pays per kill within a radius of itself; Toll pays per leak at the exit, from anywhere on the board, when the run loses — which no augment does.
- **16-cap (the augments module):** the pool caps at 16 augments — after registering, if the pool has more than 16, also remove the first of **Frost, then Rally, then Mint** that is still in the AUGMENTS index (a mechanical deletion, T0192's pattern; the full protocol is in T0064's task) and say which in the result.

## Compared with what exists

| Existing | What it shares | What Toll does that it can't (not numbers) |
| --- | --- | --- |
| Mint | `kind pulse` first form, 0 damage; gold economy | Mint pays per kill within 2 cells of itself; Toll pays per leak at the exit, from anywhere on the board, when the run loses |
| Splash | `kind pulse` first form | Splash's pulse damages around the tower; Toll's "pulse" touches no enemy at all — it reads the leak |
| Frost | `kind pulse` first form | Frost's pulse slows enemies on the road; Toll never slows, moves or touches an enemy |
| Push | `kind pulse` first form | Push's pulse pushes enemies back along the road; Toll never moves an enemy |
| Anchor | `kind pulse` first form | Anchor's pulse roots enemies; Toll never stops an enemy |

## Acceptance criteria
- [ ] The draft offers Toll only as an Epic card (Epic frame, gem row, "· Epic" name line, tier chime), never in the pre-wave-1 draft; the codex lists it with both lines.
- [ ] With one Toll tower on the board, a leaking Dot pays +2 gold: a gold "+2" pop at the exit gate, the run's gold up by 2, the life cost unchanged; with no Toll tower the same leak pays nothing and pops nothing.
- [ ] A tower with 2 Toll copies pays +3 on a leak; two single-copy Toll towers pay +4 in total on one leak.
- [ ] A Hauler leak still costs 1 life and 5 gold: the red "−5" pop and the Toll gold pop both appear, side by side, not overlapping.
- [ ] Toll gold is not doubled by last stand or a quiet wave, never joins a combo chain or its gold, never pays a Mint; the coin tally, claim recipe and pause worth line are unchanged.
- [ ] A Toll-first tower is the flat muted-gray disc with one tick per copy; an added Toll shows one muted-gray tick on any tower; the Epic purple pip is as usual; works at 412x915 and 1280x720.
