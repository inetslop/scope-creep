---
id: T0034
title: "Bulwark: a deep red octagon whose bubble shield eats the first 15 hits"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T06:50:30Z
epic: E9
---

## Goal
The crowd gains a wall: a big slow tank that soaks the first 15 hits of your weapons before it takes any damage, and pops open into a soft, rich kill when its shield breaks. A rare target you must commit to, and the first monster that punishes wasting shots.

## Details
- New monster file `src/content/monsters/bulwark.ts`, registered in `src/content/monsters/index.ts`. Closest examples: `snail.ts` (slow, with its own `think`) and `puff.ts` (big and tanky).
- Numbers: hp 100 (grows with the level of the player it spawned around, like every monster), speed 25 u/s, radius 30, damage 16 per second while touching, xp 8, weight 2, fromLevel 6.
- Behavior (`think`): it heads straight for the nearest player like a Dot, but slow. It carries a bubble shield: while the shield is up, every instance of damage your weapons deal — one bolt, one bubble splash, one Maw bite, each once — deals no damage to the Bulwark and removes 1 from the shield. The shield starts at 15 and never comes back. When the 15th absorbed hit lands, the bubble pops (a small white bubble pop with a few white stars, like the slow-pop) and from that moment on the Bulwark takes damage like any other monster.
- Look: a deep red octagon (a shape no monster uses; the Dot is a lighter red circle), angry face by default: 2 eyes, teeth mouth. The shield is drawn as a white bubble with an ink outline around the whole body. After 5 absorbed hits one ink crack appears on the bubble, after 10 a second one. When the shield pops, the face changes: mood scared, mouth o — a popped Bulwark looks scared and reads as a soft target.
- On death: it pops into confetti where it died, like every monster (its 30 radius makes a big pop), and drops a gem worth its xp (8).
- Crowd count: it adds only itself; it spawns rarely (weight 2 against the Dot's 10) and only around players of level 6 or more.
- What it punishes: players who spray and kite — a Gunner standing far wastes 15 hits before the hp matters, and a player who routes around it loses time while the crowd behind it closes in. What counters it: focused fire — a Lance's piercing bolts and a Maw's bite count against the shield fast, Split's fan eats three hits at once, and a popped Bulwark (100 hp, scared face) is a quick 8 xp.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Dot | heads straight for the nearest player | the Dot is hurt from the first hit; the Bulwark's bubble eats 15 hits whole, cracks as it takes them, and its face turns scared the moment it becomes vulnerable |
| Snail | slow, tanky, chases | the Snail is hurt from the first hit and traps the ground; the Bulwark must be cracked (shield popped) before it is soft, and its look tells you exactly when that happens |
| Puff | big, tanky, a moment of death | the Puff dies into three Dots that keep the fight going; the Bulwark's death is the end — the shield has to break first, then one big confetti and one 8 xp gem |

## Acceptance criteria
- [ ] Around a level 6 player a Bulwark appears rarely in the crowd: a big deep red octagon with 2 eyes and a teeth mouth, wrapped in a white bubble, walking at 25 u/s.
- [ ] Hits while the bubble is up deal no damage; after 15 absorbed hits the bubble pops with a small white pop and the face turns scared with an o mouth.
- [ ] An ink crack appears on the bubble after 5 absorbed hits and a second one after 10.
- [ ] After the pop it takes damage like any other monster; when it dies it pops into a big confetti and drops a gem worth 8 xp.
- [ ] It never spawns around players below level 6, and it never spawns or shoots anything itself.
