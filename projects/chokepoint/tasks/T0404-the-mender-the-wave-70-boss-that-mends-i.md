---
id: T0404
title: "The Mender: the wave-70 boss that mends itself and its pack"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T04:17:18Z
claimed_at: 2026-11-02T04:37:49Z
designer: desktop
---

## Goal
The wave-70 boss (next in the every-10 lane): the first enemy that heals — the Mender mends itself and its escorts on a clock, so the fight is a net-damage race and the player chooses between burst, burn and separating the pack.

## Details
- **The wave (the boss lane).** Wave 70 sends exactly the Mender with two Ward escorts — the Mender carries the wave's whole budget minus the escorts (each at the Ward's own threat of 1, the lane's own arithmetic, as the Titan's 95 + Guard's 5 did, T0259): the two Wards spawn 0.4 s apart, the Mender 1.2 s behind them. The Mender is `spawnOnly`; the regular cap is untouched. The Wards walk at their own speed, so the pack walks together.
- **The Mender.** `walk`, hp 720 (wave-scaled like every boss), speed 0.9, gold 20, livesCost 1, fromWave 70, spawnOnly. Look: a solid circle in orange at the boss scale (size 0.5) — a silhouette no enemy wears (the board's circles are the small red Dot, Splitter, Ward and Splinter; the Mute is a hollow ring).
- **The mend.** The Mender has 4 mends. Its clock starts when it spawns: every 5 s while mends remain, a thin ring in its own orange contracts from 3 cells in to the token over 1.2 s (every other ring on the board grows outward — the closing one reads as taking back), then it mends: it and each living Ward escort within 3 cells restore 15% of their own max hp. The mend's moment: a small white flash on each mended token (the hit flash, turned into a heal) and the BossCard's hp bar climbing. A mend never revives: a killed Ward does not come back, and later mends heal only the living. After the fourth mend the ring never forms again — no sound, the pips say it.
- **The pips (on the card, not the board).** The BossCard's hp row wears four small pips (the tier pip's shape, muted ink) — one per mend remaining — a pip fading as each mend is used. The hp bar alone cannot show this: a mended bar looks like a fresh one. Nothing new stays on the board; the telegraph ring and the flash are the only marks and both are transient.
- **Control.** Frost slow, Anchor root and Push gusts work on the Mender (its Wards ignore control, as always). The mends land on their clock even while the Mender is rooted. A Push gust separates the Mender from its pack: an escort more than 3 cells away stops being healed.
- **The rest of the lane.** It inherits everything the boss lane already has: the boss chip on the preview and the banner, the arrival ring and horn, the BossCard, the death burst and name card, the death horn, and a 1-life leak with the boss's escape horn.

## What counters it, and what it punishes
- Counters: burst — drop the Mender before its later mends land and pay a smaller tax; DoT — the Ember burn ticks on its own clock, independent of the mends; Push — separate it from its escorts and the pack loses its heal.
- It punishes: steady slow dps (a trickle under the heal rate means the Wards walk forever), and builds with no burst or burn; a Ward that leaks costs a life and the Mender keeps mending.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Block | `walk`, slow and tough (the idea's closest) | only soaks damage; the Mender restores 15% of max hp to itself and its escorts, four times |
| Hive | `walk`, the boss lane, a pulse on a clock while it walks | the Hive's pulse adds enemies to the board; the Mender's pulse gives hp back — it grows the pack's life, not its size |
| Colossus | `walk`, the boss lane, a timed beat on a clock | the Colossus's beat denies the player's damage (out of reach); the Mender's beat gives its own side hp back while it stays fully hittable |
| Ward | `walk`, ignores control, walks as an escort | the Ward is merely immune; the Mender's Ward escorts are also kept topped up (15% of max every 5 s), so they never die to chip damage |
| Titan | `walk`, the boss lane, the escort pattern (escort first, boss behind, T0259) | the Titan's escort shields it from damage; the Mender's escorts are its heal targets — clearing them is a choice, not a step |

## Acceptance criteria
- [ ] Wave 70 sends exactly one Mender (boss lane, `spawnOnly`) with two Ward escorts behind it, and nothing else.
- [ ] The Mender reads as a new silhouette: a solid orange circle at the boss scale, distinct from the small red circles (Dot, Ward, Splitter, Splinter) and the Mute's hollow ring.
- [ ] While mends remain, every 5 s a thin orange ring contracts from 3 cells to the Mender over 1.2 s, then the Mender and each living Ward within 3 cells flash white and the BossCard's hp bar climbs 15% of max.
- [ ] The BossCard's hp row wears four muted pips; one fades per mend; after the fourth mend the ring never forms again (no sound).
- [ ] A killed Ward does not come back: mends heal only the living, and an escort more than 3 cells from the Mender (e.g. after a Push gust) stops being healed.
- [ ] Frost slow, Anchor root and Push gusts work on the Mender but not its Wards; the mends land on their clock even while the Mender is rooted.
- [ ] The Mender inherits the boss lane's moments: the boss chip on preview and banner, the arrival ring and horn, the death burst and name card, the death horn, and the 1-life leak with the boss's escape horn.
- [ ] No wave other than 70 changes: the every-10 lane below it and the regular mix are untouched.
