---
id: T0132
title: "Beam combos III: the beam carries Frost, Ember, Anchor, Push and Mark"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T10:40:00Z
epic: E4
---

## Goal
The "hits do X" augments (Frost, Ember, Anchor, Push, Mark) do nothing on a Beam-first tower, because a beam never "hits" today. Define a beam hit so they all work, and so a Frost or Anchor beam becomes a real control tower.

## Details
Applies to a tower whose **first** augment is Beam, on every line it holds (the main beam, Bolt rays from T0130 if present, Beam-added lines).
- **Contact effects (while the beam holds the enemy):**
  - Frost added: the beamed enemy is slowed by Frost's percent (40/50/60% by Frost tier) for as long as the beam holds it, and for Frost's 2 s after.
  - Mark added: the beamed enemy is marked (+25% damage taken per Mark) while held and for 2 s after.
  - Ember added: the beamed enemy is ablaze with Ember's burn (3/4/5 per second for 3 s), refreshed while held.
- **Pulse effects (one beam "hit" per second of contact on the same enemy, the first at the moment of lock):**
  - Anchor added: roots the enemy for Anchor's 0.5 s (+0.25 s per extra Anchor).
  - Push added: pushes it back 0.4 cells (+0.4 per Push).
  So a root or push never chains forever: one per second of contact.
- **Look:** a beam carrying an effect gets a thin second line beside it (2 px, 50% alpha) in the effect augment's own color, one per effect, at most two shown.
- **Panel:** "its beam slows by 40%", "its beam sets ablaze", "its beam roots for 0.5 s every second", etc.
- The Ward (T0111, if landed) ignores slow, root and push from beams like from anything else.

## Acceptance criteria
- [ ] Beam first + Frost: a held enemy moves at 60% speed while held and for 2 s after; unit-tested.
- [ ] Beam first + Mark / Ember: the held enemy is marked / ablaze while held; unit-tested.
- [ ] Beam first + Anchor: the held enemy is rooted 0.5 s once per second of contact, the first at lock; Push the same with 0.4 cells; unit-tested.
- [ ] Effect lines show beside the beam in the effect's color.
- [ ] The tower panel describes each effect.
