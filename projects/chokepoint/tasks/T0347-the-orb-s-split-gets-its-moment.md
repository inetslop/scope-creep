---
id: T0347
title: "The Orb's split gets its moment"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-01T08:02:39Z
claimed_at: 2026-11-01T08:05:36Z
designer: yoga
---

## Goal
The wave-30 boss's signature move — splitting into two Shards at half health — is readable before it lands: the Orb's crack counts down with the damage it takes, and the split is telegraphed with a white flash, the way the Dasher's dash and the Colossus's phase already are.

## Details
- The Orb's token (the cracked purple hexagon, T0266) carries a static baked-in crack. It becomes live: one muted-ink line on the token's face, 25% alpha at full hp, deepening with the damage it takes — alpha = 0.25 + 0.75 × (hp lost / max hp), re-derived per frame. Closest example: the Splitter's live crack (the `crackDeep` enemy hook, T0344) — same look, same math.
- The moment a hit first drops the Orb to its half-hp split line: a 0.4 s telegraph. The Orb flashes white for the whole window (the Dasher's dash-telegraph tint, T0046) while it keeps walking at its own speed — no pause, no untargetable beat — and its crack reads fully opaque. The window runs on the simulation clock, so it lasts half as long in real time at 2x.
- When the window ends, the Orb vanishes into its two Shards exactly as it does today — no kill: no gold, no combo, no Toll, no "stopped", the BossCard's hp bar and the boss-death moment unchanged — plus one new burst: 12 chips in the Orb's own purple at the split spot (the milestone count, T0034). No sound.
- While the Orb is below half hp (from the first crossing until the split) it cannot be killed: hits deal damage, but the split fires at the end of the telegraph even if its hp reaches 0 inside the window. The Orb was never a kill before either.
- The Shards (count, spawn spot, speed, hp, gold), the wave-10 Colossus, the wave-20 Titan and the Splitter's live crack are untouched.
- Nothing shown twice: the BossCard's bar stays the precise hp readout; the crack is the token's own look (the owner's own rule when the status chips were removed, T0179).
- The display rides a new enemy hook in the `crackDeep` pattern (a new file in `src/systems/enemyHooks/`, registered in `enemyHooks/index.ts`; closest examples T0344's crack and T0293's shield-break burst). The 0.4 s clock rides the existing `splitsAt` handling (the `split` hook's path, T0059) — no new system, and no changes to the enemy pool's walking or spawning.

## Compared with what exists
| Existing | What it shares | What this does that it can't (not numbers) |
| --- | --- | --- |
| Splitter (live crack, T0344) | a crack that deepens with the damage it takes | its crack reads its own death and pays out on the kill; the Orb's crack reads a half-hp phase line and ends in a flash-telegraphed break into two, with no kill |
| Dasher | a white flash that warns of a sudden move | its flash warns of its own dash while it stops; the Orb's flash warns of a shape change (one becomes two) while the Orb keeps walking and taking hits |
| Colossus | a telegraphed half-hp phase (outOfReach's 0.5 s telegraph) | its phase makes it untargetable (a beat to survive); the Orb's phase keeps it hittable and moving and ends in a guaranteed split (a beat to pre-aim the Shards) |
| Titan's shield break (T0293) | a chip burst at the moment a state flips | that flip is instant; the Orb's split is a 0.4 s beat the player can read before the two Shards are on the road |

## Acceptance criteria
- [ ] The Orb's crack reads faint (25% alpha) at full hp and deepens continuously as it takes damage, fully opaque at the half-hp line; the static baked-in crack is replaced, not doubled.
- [ ] The first hit that drops the Orb to half hp starts a 0.4 s white flash (the Dasher's telegraph tint); the Orb keeps walking at its own speed through the window.
- [ ] At the end of the window the Orb vanishes into its two Shards with one 12-chip purple burst at the split spot and no sound; no gold, no combo, no Toll, no "stopped" — the Shards spawn, walk and pay exactly as today.
- [ ] A hit that would bring the Orb to 0 hp during the window does not kill it; the split still fires at the end of the telegraph.
- [ ] The window runs on the simulation clock: at 2x fast-forward it lasts half as long in real time.
- [ ] The Colossus (wave 10), the Titan (wave 20), the Splitter's live crack and every regular enemy behave byte-identically to before.
- [ ] The BossCard still shows the Orb's live hp while it is alive; the crack and the bar do not compete (the bar is the precise readout, the crack is the token's own look).
