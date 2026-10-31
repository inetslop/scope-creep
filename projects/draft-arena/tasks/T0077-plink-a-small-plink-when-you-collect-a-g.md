---
id: T0077
title: "Plink: a small plink when you collect a gem"
size: S
priority: 3
status: design
depends_on: []
attempts: 0
created: 2026-10-31T13:15:23Z
---

## Goal
The farm loop — the quietest moment in the match — gets a tick you can hear: a small plink the moment a gem lands on you, and a deeper, longer plink for the big jackpot gem.

## Details
- A short, high plink the moment your critter collects a gem (a monster gem, an event gem or the jackpot gem): about 0.1 s, a quiet sine blip (around 1500 Hz, peak about 0.06) — higher and shorter than the coin clink, sitting under it.
- The jackpot gem: the same plink an octave down and twice as long (about 0.2 s) — clearly deeper, so the big gem reads by ear.
- An event gem keeps its coin clink (the plink is the gem, the clink is the coin); both can play at once, the plink first.
- A small green star (8 units) pops where the gem was collected and fades over 0.3 s — a candy tick, no glow.
- Your own pickups only: you never hear or see another player's plink or star.
- It goes through the existing audio layer (gesture unlock, on while the match is shown) and works the same on desktop and mobile.

## Acceptance criteria
- [ ] A monster gem you collect plays a short, high plink (about 0.1 s) and a small green star pops where the gem was, fading over 0.3 s.
- [ ] The jackpot gem plays a lower, longer plink (an octave down, twice the length); a normal gem and the jackpot are told apart by ear.
- [ ] An event gem plays the plink and its existing coin clink; a monster gem plays the plink alone.
- [ ] Only your own pickups make a sound or a star, on desktop and mobile, and the plink is never louder than the coin clink or the monster pop.
