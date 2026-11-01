---
id: T0353
title: "The Flyer: the small crosser that flies the sky"
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T11:14:54Z
claimed_at: 2026-11-01T11:14:57Z
epic: E10
designer: desktop
---

## Goal
The road stops being the only line on the board: a small fast enemy flies straight across the island to the exit, so a build that only covers the road stops being enough — the regular half of E10 (the wave-50 boss, T0317, is the big version of the same crossing).

## Details
- A new enemy, the Flyer, with a new way of moving: instead of walking the road it crosses the island. It spawns at a point on the island's edge (the seed picks the point, on the entrance's side of the board) and flies in a straight line at constant speed to the exit gate. The line is its whole path — one line for its whole life, no turns (banking is the boss's T0317 depth). The line is chosen so it crosses the island's open build area — never along the road; a crossing that follows the road is not a crossing. If the boss Flyer (T0317) has landed first, build on its crossing instead of duplicating it (same behavior, this one single line, no banking); if it has not, this task is the first crossing and the boss reuses it.
- Numbers: hp 60 (wave 1 base; the waves scale it as they scale the others), speed 2.0 cells/s, gold 8, livesCost 1, threat 3, fromWave 13.
- How often: one on wave 13, 17, 21, 25, 29, 33, … — the Feeder's exact slot and skips (the slot never lands on a boss, quiet or tight wave).
- Look: a new silhouette — a small wing shape (two rounded chevrons, one behind the other, distinct from the Sprinter's single chevron) that points the way it flies; purple (a repeated family color, a new silhouette — the Mute lesson); size 0.2. A new shape in the shape set, bright and abstract, no theme. Description line for the enemies reference: "The crosser: flies straight from the island's edge to the exit — the road doesn't hold it."
- The tell: the moment it spawns, one thin purple ring at the entry point on the edge grows and fades over 0.5 s (the boss-arrival ring's language, T0312); after that its own straight-line flight is the read. The next-wave preview shows its token and count with no change to that card.
- Targeting: for the "furthest along" target rules (Bolt, Beam, Ember, Mark, Splash, Reach), the Flyer's progress is its closeness to the exit — the same ordering the other enemies get from their road progress, so every attack's target rule works unchanged.
- Control: it takes damage from everything (a burn ticks, a mark marks, a splash bursts over it); a Frost slow slows it, and the Haste aura speeds it (the 2-cell distance rule reaches it in the sky as on the road); a Push gust and an Anchor root do not reach it — a gust moves it not and a root stops it not.
- A kill is an ordinary kill (the gold pop, the kill-combo, the Mint's 2-cell radius, the by-tower ledger and the run summary); a leak costs 1 life at the exit, and the exit warning's last 3 seconds work on it as on a walker.
- The Feeder leaves the game in this task (the regular cap is 10 of 10): its content, its neighbor-speeding ring and hook, its crescent art and its reference entry all go; its slot becomes the Flyer's. The Feeder's name tag, preview token and reference row disappear with it (they read from the content). The Wall (parked in IDEAS) stays parked — it needs a slot the Flyer does not open.
- What counters it and what it punishes: the answer is a tower off the road whose range crosses the line — a Frost slow is the best use of one, a Beam holds it as it passes — and it punishes the road-only build, which never touches it, and the slow heavy shot that needs time it does not get.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dasher | its own movement instead of a plain walk | the Dasher's whole cycle — crawl, stop, surge — happens on the road; the Flyer never touches the road at all: it crosses the island in a straight line from the edge to the exit, so road cover does not meet it |
| Sprinter | a mid-run enemy whose identity is speed | the Sprinter earns its speed hit by hit and has to walk the road; the Flyer is fast from the spawn on the shorter straight line, and the road's controls (push, root) do not reach it |

## Acceptance criteria
- [ ] from wave 13, one on 13, 17, 21, 25, 29, 33, …: the Flyer appears at a point on the island's edge (one thin purple ring there, 0.5 s) and flies in a straight line at 2.0 cells/s to the exit gate — never on the road, one line for its whole life
- [ ] its token is the new small wing silhouette (purple, size 0.2) pointing the way it flies; it appears in the next-wave preview and the enemies reference with its name and its dry line, and its first appearance gets the one-time name tag
- [ ] every attack reaches it: the "furthest along" ordering treats it by closeness to the exit; a Frost slow slows it; a Push gust and an Anchor root do not move or stop it
- [ ] killing it pays 8 gold with the ordinary kill (the pop, the combo, the Mint radius, the by-tower row); letting it reach the exit costs 1 life, with the exit warning's red gate and ticks in its last 3 seconds
- [ ] a build that covers only the road holds it not at all, and a tower off the road whose range crosses the line kills it
- [ ] the Feeder is gone: not in the content, not in any wave (13, 17, 21, … send the Flyer), no ring or hook for it, no entry in the enemies reference
