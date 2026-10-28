---
id: T0073
title: "Beam: the line that never stops (the T0029 re-task)"
size: L
priority: 1
status: design
depends_on: []
attempts: 0
created: 2026-10-28T21:24:45Z
epic: E4
---

## Goal
The pool gains the beam — the first sustained attack: a continuous line of damage that never fires a shot, and a second line when added. This re-tasks the failed T0029: its complete work is saved in `tasks/salvage/T0029.diff`.

## Details
- **Card lines (both forms):** as a new tower's first augment — "A continuous beam on the enemy furthest along: 6/8/10 damage per second by tier, range 4.5." Added — "A second beam on the enemy nearest the main target at half the per-second rate." Closest existing augment is Reach (a long single-target attack); new is the sustained line that never fires, and the sustained second target on any first augment.
- **First form:** a continuous beam from the tower's barrel on the enemy furthest along in range (4.5 cells). No projectile: the line appears the instant a target is locked and is gone the instant there is no target. It deals 6/8/10 damage per second by tier (a sustained tick, not a shot). It retargets the instant its target dies or leaves range — the new target is the enemy furthest along in range. The beam's damage is the tower's damage: Mark's +25% applies to it, and a kill by the beam is that tower's kill for gold, the combo chain, Mint's +1 and the panel's kills line (the source-of-kill rule, exactly like Ember's ticks).
- **Added form (on any tower):** a second beam on the enemy nearest the main target, at half the per-second rate (3/4/5 per second by tier), only while another enemy is in range. It disappears when the main target does, and each line retargets independently the instant its own target is gone.
- **Look:** the beam is a flat thin line (about 4 px) in the tower's own color, from the barrel tip to the hit point, with one small flat tick (about 8 px, the tower's own color) at the hit end. The tower's barrel is a short, flat, wide head lying on the plinth (wider than it is tall) in Beam's own color; each added Beam adds one small flat tick beside the barrel. Beam's own color: the first of green, yellow or blue that no landed augment already uses — check the content folder (Lead's green was freed when Lead was removed).
- **Draft:** pool augment, all tiers, offered from the opening draft. The card, the hand, the tower panel and the slot pip show it in the shared tier look (T0002/T0008); the draft's no-repeat rule (T0052) and the owned dot (T0044) work for it as for any augment.
- **Re-apply, don't restart:** the failed T0029's complete design — the beam system, its attack kind, the tower look, the line drawing — is in `tasks/salvage/T0029.diff`. Re-base it onto the latest code as a **short branch**: T0029's branch lived too long under a landing pool of augments and died three times on merge conflicts. Where the salvage conflicts with what has landed since — Anchor is Epic-only, enemy hooks/effects/sounds live in their own files (the Hauler's pattern), the kill flow in the strike block (combo gold, the kill gold trail, burn on death, the quiet wave), the draft's no-repeat rule — **the landed code wins and the beam keeps its behavior and values as speced here**.
- **No sound in this task:** the beam hum is T0043, which waits on this task; the beam is silent until then.

## Acceptance criteria
- [ ] A tower with Beam as its first augment holds a continuous line in its own color on the enemy furthest along within 4.5 cells: no projectile, 6/8/10 damage per second by tier; the line vanishes the instant its target dies or leaves range and locks the new furthest enemy immediately.
- [ ] A tower with Beam added holds a second line on the enemy nearest the main target at half the per-second rate, only while another enemy is in range; it drops with the main target, and each line retargets independently.
- [ ] A beam kill pays through the normal kill path — gold, the combo chain, Mint's +1, the panel's kills line — attributed to the beam's tower; a marked beam target takes Mark's +25%.
- [ ] The draft offers Beam from the opening draft at all tiers; card, hand, tower panel and slot pip show it in the shared tier look; the tower shows the flat wide barrel plus one tick per added Beam, and no line is drawn while the tower has no target.
- [ ] The draft never offers two Beams in one offer (T0052), and the owned dot (T0044) marks an offered Beam the run already has.
- [ ] `npm run check` and `npm run smoke` pass on desktop and mobile.
