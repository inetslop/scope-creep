---
id: T0053
title: "Mute: the enemy that silences towers within 2 cells"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T12:34:55Z
claimed_at: 2026-10-28T18:06:27Z
designer: cachyos-x8664
---

## Goal
The first enemy that fights back: a slow, heavy walker that jams every tower within 2 cells while it lives — so clustering (Rally, T0020) and auras (Mint, T0021) become a placement decision, not a default.

## Details
- **Closest existing enemy:** Block (a plain slow walker). **What is new:** it disables the player's towers — no enemy today interacts with towers at all.
- Look: the biggest enemy token on the board — about 1.3× Block's size, deep red (check the content folder; if red is taken by a landed or in-flight enemy, take the next free warm color — the Mute stays warm: red, orange or purple) — with a small muted inner ring that pulses once per second, so the silence is readable before a player counts the radius.
- Stats: 1.6× Block's hp, 80% of Block's speed, Block's kill gold; leaking one costs 1 life. It takes everything that works today — shots, roots, pushes, marks, burns — including Mark's bonus damage.
- Jam: while a Mute is alive, every tower within 2 cells of its position (a circle measured from the tower's center, the same rule as Rally's range) is jammed — it attacks nothing: no shots, no pulses, and its cooldowns hold. Passive rules are untouched: a jammed Rally tower still counts for its range, and a tower with only passive augments (no attack at all) is not jammed and keeps its normal look. The jam is a per-tower state that recomputes as Mutes move; a tower un-jams on the same tick its Mute dies or leaves range. Multiple Mutes do not stack — jam is a state, not a modifier.
- Jammed look: the tower's token (barrel and its augment rings) dims to about 40%, and a thin muted-gray ring appears on the ground around the tower's base — never on the plinth's front edge, where the tier pips sit (T0010); both clear the moment the tower works again.
- Sound: a soft low blip when a tower becomes jammed — one per tower per jam event, in the quiet leakWarn volume family (T0014); un-jamming is silent.
- Waves: Mute enters the mix from wave 11 — one Mute on waves 11, 14, 17, … (one every 3 waves), added to the wave's existing spawns and walking in with the wave's normal groups. When the wave preview (T0015) lands, the Mute shows in it like any other enemy.

## Acceptance criteria
- [ ] From wave 11, waves 11, 14, 17, … each include exactly one Mute in addition to the wave's usual enemies.
- [ ] While a Mute is on the board, a tower within 2 cells of it holds still — no shots, no pulses — its token dimmed with the gray ground ring; the moment the Mute dies or leaves range, that tower attacks again the same tick.
- [ ] A jammed Rally tower still speeds up its neighbours, and a tower with only passive augments keeps its normal look and keeps working.
- [ ] A Mute dies like any enemy (chips, kill gold) and leaks for exactly 1 life.
- [ ] The jam blip plays once per tower per jam event, never per frame.
- [ ] At 412x915 and 1280x720 the Mute reads as the biggest enemy on the board and the jam look is readable on a dimmed tower.
