---
id: T0379
title: "The crossing learns: the wave-50 boss banks into the uncovered ground"
size: L
priority: 2
status: design
depends_on: [T0317]
attempts: 0
created: 2026-11-01T21:18:04Z
epic: E10
---

## Goal
T0317's Flyer boss banks to a seeded line — the same bank on every board, whatever the player built. When the bank fires, it reads the board instead: the line it banks into is the one the run's towers cover least, so a build concentrated on the first line loses contact exactly where it chose to be strong, and spread cover stays ahead of the crossing.

## Details
- **The beat is unchanged (T0317):** at 50% hp, once, the 0.8 s preview of the two new segments, the quiet falling tone at the turn, a rooted or slowed Flyer still banking on its hp clock. Only where the bank point comes from changes: T0317's seeded point is no longer the choice — it becomes the fallback and a tie-break.
- **The choice (a new pure core function, no rng at bank time):** the moment the hp first drops to 50% (the same frame the preview starts), score a fixed deterministic set of candidate bank points — 8–10 points sampled evenly along the edge T0317's bank point lives on (the edge opposite the spawn side), always including the seeded point. For each candidate, the two-segment line (the Flyer's current position → the candidate → the exit gate) is sampled evenly along its length, and the candidate's score is the fraction of sampled points that lie outside every standing tower's range — each tower's current effective range as the game computes it for shooting (Reach-grown, the ring a placed tower shows). The Flyer banks to the highest score: the least covered line. Ties (within a fixed epsilon) break to the seeded point first, then the candidates' fixed order — the same board and the same towers always bank the same line.
- **The fallback:** with no standing towers, the bank is byte-identical to T0317 (the seeded point).
- **Fairness:** the existing 0.8 s preview shows the already-chosen line before the turn, the boss card's live hp shows the approach to 50%, and the choice is made once at the bank moment (towers cannot change mid-wave) — the line is never re-chosen and the preview never changes once shown.
- **What it punishes and what answers it:** it punishes a build whose rings all sit on the first line — the bank crosses to the part of the island those rings don't reach. The answers are cover spread into the island's interior: the wide rings (Beam 3.5, Reach 4.6), a tower or two off the road whose rings overlap several candidate lines, and still holding the first line hard (the pre-bank crossing is untouched).
- **Nothing else:** the regular Flyer in the mix waves (T0353) never banks and is untouched; the wave's plan, the first line, the 3 s start telegraph, the arrival horn, the boss card and the death beat are unchanged; seeded plans stay byte-identical (the choice happens at bank time, never plan time).

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| T0317's seeded bank | the same beat at 50% hp, the same preview and tone | the seeded bank is fixed per board before the build is known; this bank is a read of the run's towers, made at the bank moment |
| Colossus | a boss beat at half health | the Colossus's beat stops the fight (out of reach); this beat keeps it coming, on a line aimed at the build's gap |
| Orb | a boss that changes at half health | the Orb becomes two other enemies once; the Flyer stays one shape and re-aims itself at uncovered ground |

## Acceptance criteria
- [ ] Wave 50: the Flyer banks at 50% hp to the candidate line its standing towers cover least (the highest uncovered fraction of the sampled two segments), with T0317's 0.8 s preview, falling tone and turn — the preview shows the chosen line before the turn.
- [ ] With no standing towers the bank is byte-identical to T0317's seeded point; the seeded point is always among the candidates; the same board and towers bank the same line every time (no rng at bank time, unit-pinned).
- [ ] The regular Flyer in the mix waves never banks; the wave-50 plan, the first line, the 3 s start telegraph, the seeded plans for waves 1–50 and every existing boss beat are unchanged.
- [ ] Unit tests pin the pure choice on a fixture board: no towers → the seeded point; one wide tower near the island's center → the candidate whose line avoids its ring; a board covered on one side and bare on the other → the candidate that crosses the bare side; the same inputs twice → the same point.
- [ ] npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.
