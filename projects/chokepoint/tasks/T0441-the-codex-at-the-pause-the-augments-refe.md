---
id: T0441
title: "The codex at the pause: the augments reference row"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T19:42:29Z
claimed_at: 2026-11-02T20:29:46Z
designer: desktop
---

## Goal
The pause's reference set covers enemies, waves, bosses, coins, boards and the run's loop — but the only reference for the game's core pick, the augments (the codex), is menu-only: a player mid-run checking what a held card combines with must end the run. The pause gains an "Augments" row that opens the existing codex over the dimmed pause, in the How row's cross-context pattern (How is on the menu and on the pause) — the reference set gets the family the draft is about.

## Details
- **The row:** a new "Augments" row in the pause card's reference rows, the Enemies/Waves/Bosses/Coins/Boards/How rows' own pattern (T0252: its own row, plus a matching line in the controls list). Word "Augments" — the rows' own single-noun vocabulary.
- **From the pause:** the codex opens over the dimmed pause (the pause reference scenes' pattern, T0252's EnemiesScene) and its back returns to the pause — the run exactly as it was (a mid-wave pause and a mid-build countdown both survive the round trip). The scene takes where it was opened from (a scene parameter, not a global flag); the menu's path stays byte-identical to today: dimmed menu, back to the menu.
- **The content is unchanged:** the codex's cards, order, tier reads and fit are exactly T0221's (and T0248's lock on the gated cards, once it lands) — this task adds a door, not a new screen.
- **Nothing shown twice:** the pause has no augments reference today; the row is that reference in-run, and the menu's codex stays (one content, two contexts — the How row's own precedent, not a second button in one screen).
- **It fits:** one more row in the pause card's even column (the column grows the way T0245's does); the codex card is the menu's card, already fitted at 412x915 and 1280x720.
- No new HUD element, sound, key or board mark; no change to the codex's content or to the menu.

## Acceptance criteria
- [ ] The pause card wears an "Augments" row with a matching line in the controls list; tapping it opens the codex over the dimmed pause, and its back returns to the pause with the run exactly as it was (a mid-wave pause and a mid-build countdown both survive the round trip).
- [ ] The menu's codex button behaves exactly as before (dimmed menu, back to the menu, the same cards in the same order).
- [ ] The codex's cards, tier reads and fit are byte-identical in both contexts; with the gated-augment lock present (T0248) it shows there too.
- [ ] The pause card fits at 412x915 and 1280x720 with the new row (the column grows, nothing overlaps — the layout check).
- [ ] A run that never opens the row is byte-identical to before; `npm run check` and the desktop + mobile smoke pass.
