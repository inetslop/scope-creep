---
id: T0401
title: "The pause's Ahead card: the two waves after next"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T03:32:09Z
claimed_at: 2026-11-02T04:16:15Z
designer: cachyos-x8664
---

## Goal
The pause screen gains an "Ahead" reference card — the two waves after the run's current one, token + count rows read from the run's own plans — so a build plans for the wave after next, not just the one the preview shows.

## Details
- A new pause reference scene in the exact family of the wave reference (T0264, the closest example: a pause scene read from core/waves.ts) and the boards reference (T0350): the pause screen's reference row gains one white card, "Ahead", the family's own card look, a tap target, no key.
- Two rows: the wave at (current wave + 2) and (current wave + 3) — before wave 1 the current is 0, so the rows are waves 2 and 3. The rows are the run's own plans for those numbers, read the same pure way the next-wave preview reads its plan (a wave plan for a number, the run's own board and level): what the card says is what comes — never a guess, never a re-roll.
- Each row, left to right: "Wave N" in the preview's number style; the same muted tag chips the banner wears for that wave (the quiet / tight / rush / boss chips, T0080); then the enemy rows — each type's on-board token (~16 px) and its count, the preview's own row look. A boss wave's row adds the boss's token and its name in the BossCard's bold ink.
- No gold line: the preview's "+N gold" line is out (T0223) and stays out; the coins reference (T0329) already says what a wave pays.
- It is a readout: no sound, no key, nothing on the board, the pause's controls list unchanged (the card is a tap target exactly like its siblings).
- Why the screen has room: the pause is an overlay (the board is hidden behind it) and the reference family (Summary, Waves, Boards) already lives there; the card shows two waves no other screen shows — the preview shows the next, the wave card the current, the Waves reference the tags' rules, not the coming waves.

## Acceptance criteria
- [ ] The pause screen shows an "Ahead" card among its reference cards, same look and tap target as the siblings; its two rows are always (current wave + 2) and (current wave + 3), read from the run's own plans.
- [ ] Each row shows the wave number, that wave's own tag chips, and each enemy type's token and count exactly as the preview draws them; a boss wave's row shows the boss's token and its bold name.
- [ ] The rows are the run's own: they change with the board's gates (the far-gate board plans differently) and are exactly the plans those waves will run.
- [ ] No new key, sound or board mark; the pause's controls list is unchanged; the card with its longest row fits at 412x915 and 1280x720.
