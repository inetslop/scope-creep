---
id: T0320
title: The first run says hold the road
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T01:28:10Z
claimed_at: 2026-10-31T01:28:13Z
epic: E11
designer: desktop
---

## Goal
A first-time player builds their first towers and then just watches the wave with nothing naming the point; on the device's very first run, one plain white card under the wave-1 banner says "Hold the road" for the length of wave 1. The third and last of E11's three hints (T0318 is the first, T0319 the second).

## Details
- First run only: the profile's runsPlayed is still 0. A first run resumed after a tab close is still a first run; the hint re-derives from the run's state (T0272's pattern), so a resumed first run that has already cleared wave 1 (wavesCleared ≥ 1) never shows it, and a resumed first run still inside wave 1 does.
- Wave 1 only: shown from the moment the wave phase begins on wave 1 until that wave ends. It appears in exactly one wave — never wave 2 or later, never a later run.
- Position: top-center, in the band just below where the wave banner rests (the banner's own place, T0067; the same band the boss card uses later, T0256), so it reads as the banner's follow-up. Wave 1 has no boss (the first boss is wave 10), so that spot is free — no overlap.
- Look: the HUD's own white card at the teach's scale (the draft-card language, one size below the banner): one line of bold ink, ~14 px, "Hold the road".
- Dismissed by doing: the moment wave 1 ends the card fades out (~150 ms) and never comes back; if the run instead ends on wave 1, the game-over card takes its place. No sound, no input — a teach, not a button (nothing to list on the pause screen).
- One in, one out: first run only, one line, gone by doing, never a permanent mark — the teach's language (T0318's pick, T0319's build, T0272's early send). It names the objective at the exact moment a first-timer first sees the road being defended, and it clears itself.
- Nothing shown twice: the card says a sentence, not a number — the wave number stays on the wave card and the banner, lives and gold on the stats card; none of it is repeated here.
- Untouched: the banner's own ~1 s slide, the wave card, the stats card, the leak warning, and every tower.
- Closest example for the build: the second hint T0319 — a new file in `src/systems/fx/` (a sibling of `src/systems/fx/streakTeach.ts`, T0314's guard-and-re-derive pattern), shown and hidden by one guarded hook in the wave phase's own system (the place the build→wave and wave→draft turns happen), the card in the look of the HUD's white cards — so the board, the draft, and the scene's HUD registration all stay untouched.

## Acceptance criteria
- [ ] On a fresh profile (no finished runs), wave 1 shows the "Hold the road" card under the banner for the whole wave; the moment wave 1 ends it fades out and never reappears in that run or any later run.
- [ ] It never shows on wave 2 or later, in any run with runsPlayed ≥ 1, in a resumed first run that has already cleared wave 1, or after wave 1 has ended.
- [ ] The card says a sentence only (no wave number, lives or gold); the wave banner, wave card, stats card and leak warning all behave exactly as before; the card takes no input and plays no sound.
- [ ] Everything still fits at 412x915 and 1280x720 with the card up during wave 1.
