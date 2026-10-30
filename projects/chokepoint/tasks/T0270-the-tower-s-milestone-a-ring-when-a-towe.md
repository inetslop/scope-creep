---
id: T0270
title: "The tower's milestone: a ring when a tower crosses a kill count"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-30T09:22:16Z
claimed_at: 2026-10-30T09:22:45Z
designer: desktop-4070
---

## Goal
The player feels each tower's contribution grow: a tower that earns its keep marks the milestone on the board, so the gold spent on its slots is seen paying off where the tower stands — not only in the panel's kills line or the end card's by-tower list.

## Details
- When a tower's kill count for the current session first reaches 10, then 25, then 50 — the same per-tower number the tower panel's "kills N" line reads (T0070, by the source-of-kill rule) — the tower blooms one small ring in its own color (the first augment's color) at its base, growing from the plinth's width out to 1 cell over ~300 ms and fading. It is the working-aura ring's look (T0055) — a quiet ring at the base in the tower's own color — but it blooms once per milestone, on the tower itself, so it needs no new HUD and no change to the wave's effects.
- One bloom per milestone per tower. The milestone tracker resets on new and resumed runs exactly like the kills line it reads, so a resumed tower re-blooms a milestone as its (reset) count crosses it again.
- A tower whose kill count is 0 (a pure support: Mint, Toll, Rally, or a lone Anchor) never blooms.
- No sound, no text, no input. The ring is a transient board effect, like the working-aura ring (T0055): it clears on its own and leaves no mark, and it replaces nothing.
- It is a board effect, so it shows identically on desktop and mobile and is not a HUD element.

## Acceptance criteria
- [ ] A tower whose session kill count reaches 10 blooms one small ring in its own color from its plinth (out to 1 cell, ~300 ms, fading); no sound, no text.
- [ ] 25 and 50 each bloom once per tower per session; a milestone never re-blooms within the same session.
- [ ] After a resume (kills line reset to 0), a tower re-blooms 10 as its count crosses it again.
- [ ] A pure-support tower (0 kills) never blooms.
- [ ] The board and HUD are otherwise unchanged: no persistent mark, no new card or line.
