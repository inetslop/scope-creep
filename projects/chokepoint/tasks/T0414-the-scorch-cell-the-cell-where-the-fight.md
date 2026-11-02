---
id: T0414
title: "The scorch cell: the cell where the fight was pays a tower"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T09:13:56Z
epic: E19
---

## Goal
The island remembers the fight: a build cell that has seen 12 kills this run keeps a small dark chip on the ground for the rest of the run, and a tower built on it deals 5% more damage — the player places the next tower with the run's own history in hand.

## Details
- **The count.** Every kill this run — any enemy; a split child and the wave boss's death each count as one kill — adds 1 to the build cell whose center is closest to the kill point; a kill with no build cell within 1.5 cells counts for nothing. A leak is not a kill.
- **The mark.** The moment a cell's count reaches 12 it is *scorched* for the rest of the run. One small flat chip fades in at the cell center over ~300 ms: a muted-ink rounded square, ~0.25 cell wide, ~40% alpha, under the tower layer (a tower on the cell stays fully visible). The chip is a functional mark — it says the cell pays, the marked cell's own kind of sign — not a hint or decoration, and it appears only where 12 kills happened (in practice the choke spots: a few cells per run at most). It persists for the rest of the run, through build phases, pauses and resumes.
- **The buff.** A tower built on a scorched cell deals 5% more damage: the cell's multiplier gains ×1.05, the marked cell's own way, multiplicative with the marked cell's 1.25/1.5 (a marked + scorched cell is 1.31× plain, 1.575× with The rich cell). The multiplier is read when the tower is built — and when a tower moves onto the cell (the move's own re-read); a tower already standing when the cell scorches is not retro-buffed. The panel's existing cell line keeps reading the tower's live multiplier, so a marked + scorched tower reads the product.
- **The teach.** The run's first scorch — the first cell to reach 12 — pops one muted chip above the cell, "12 kills here · +5% damage", the marked-cell chip's own look (T0389), holding ~1.5 s and fading. Once per run; a resumed run never shows it again.
- **The save.** The per-cell counts (and the scorched flags, and the teach's already-shown) ride the run's save like the other run state, so a resume keeps the chips, the counts and the one-time teach.
- No new HUD element and no permanent text on the board: the chip is the mark, the teach chip is one-time, and the only readout is the panel line a tower on the cell already wears.

## Acceptance criteria
- [ ] Kill 12 enemies whose kill points are closest to one build cell and that cell's chip fades in over ~300 ms and stays for the rest of the run (build phase, pause, and after a tab-close resume).
- [ ] The run's first scorch shows the one-time "12 kills here · +5% damage" chip above the cell for ~1.5 s; later scorches never show it, and a resumed run never does.
- [ ] A tower built on a scorched cell deals 5% more damage (the panel's cell line reads the live multiplier; on a marked + scorched cell, the product of both); a tower already standing when the cell scorches is unchanged until it is moved.
- [ ] A kill with no build cell within 1.5 cells and a leak change no count.
- [ ] A run before any cell reaches 12 kills draws the board byte-identically to before this task.
