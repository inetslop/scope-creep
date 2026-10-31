---
id: T0057
title: "The wound: a red collar arc around any critter below half hp"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T11:14:52Z
epic: E15
---

## Goal
A player can read a hurt critter at a glance — the state Frenzy's whole tree, Reap and every fight pay out on — with no number anywhere on screen.

## Details
- A new field area "wound": a new file in src/content/areas/, registered in its index. The closest examples are the crown and prestige-stars areas, which draw attached to a critter.
- It draws on every critter — player and monster alike — whose hp is below half of its max hp: a thin red arc with an ink rim, about 8 world units outside the critter's radius, hugging the body.
- The arc runs around the lower two thirds of the body's circle; the top third stays open over the head, so hats, the crown, the mark's ring and the prestige stars all read on top of it.
- The sweep shrinks with the hp: at exactly half max hp the arc is a full 240 degrees; it shrinks to nothing as the hp goes to zero (sweep = 240 x hp / half-max-hp). At or above half max hp it draws nothing.
- It follows the critter and tracks its hp live: a hit that drops a critter below half shows the full collar in the same frame, and healing it back over half hides it again.
- Red with an ink rim is the game's hurt language (the mark's ring, Reckless's red); the ink rim keeps it readable over warm monster bodies. Nothing new on the HUD — this lives on the field.
- It must stay readable with 60 players and the full monster field: one thin stroke, drawn only on critters below half, nothing else changes.

## Acceptance criteria
- [ ] A full-hp critter shows nothing new.
- [ ] A critter at exactly half max hp shows a 240-degree red collar with an ink rim, the top of its head clear.
- [ ] A critter at a quarter of max hp shows a 120-degree arc; at a trace of hp the arc is almost gone.
- [ ] The wound shows on monsters and on other players and follows them as they move.
- [ ] Healing a critter back above half hp makes its wound disappear.
- [ ] A hat, the crown, the mark's ring and the prestige stars all still read on a wounded critter.
