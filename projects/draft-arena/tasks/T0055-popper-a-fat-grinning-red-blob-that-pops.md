---
id: T0055
title: "Popper: a fat grinning red blob that pops a damaging puff when it dies"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T10:47:58Z
claimed_at: 2026-10-31T11:00:23Z
epic: E14
designer: desktop-4070
---

## Goal
A 9th monster that makes finishing a kill a choice: kill a Popper while standing on it and it pops a puff that hurts whoever is close — kill it with a ranged shot instead and it is a free gem.

## Details
A new monster `src/content/monsters/popper.ts`, registered in the monsters index after snail. It chases the nearest player plainly (like a Dot, slower and fatter) and has an `onDeath` that pops.

- Numbers: hp 50, speed 35 u/s, radius 20, touch damage 10, xp 4, weight 4, fromLevel 3.
- `onDeath`: lays a new area `pop-puff` (`src/content/areas/pop-puff.ts`) at its death spot: a 40-unit round zone that lasts 0.5 s and strikes everything inside it (players and monsters alike) once for 10 damage — like the bite area, but still and on the ground. With a new effect `puff-burst` (`src/content/effects/puff-burst.ts`): a soft orange ring blooming out to 40 over 0.5 s with a few orange confetti, as small as a monster pop.
- Look: shape circle, fat (radius 20), color red, face: mood happy, 2 small eyes, mouth smile — a fat grinning blob. When a player is within 60 of it (a kill about to happen), its mouth flips to teeth: the grin shows fangs right before it pops, so a player sees the pop coming.
- What it counters and punishes: it punishes the finish-on-the-body habit and close-range builds (a Maw bite reaches it from in front, a Nerve jabber stands within 180); it counts against every ranged weapon (Bolt, Goo's 260, Slush's 240, Lob) that can kill it from outside the 40-unit puff.
- Crowd count: it adds no monsters; each death adds one 40-unit area for 0.5 s.

## Acceptance criteria
- [ ] From player level 3, fat red blobs (20 units across, 2 small eyes, a smile) join the crowd: 50 hp, moving at 35 u/s toward the nearest player.
- [ ] While a player is within 60, the Popper's smile flips to a fanged grin; it returns to a smile when the player is farther.
- [ ] When it dies, an orange puff ring blooms to 40 at its spot and everything standing inside (players and monsters) takes 10 damage once; after 0.5 s the puff is gone and the spot is safe.
- [ ] Killing it from outside 40 units (a Bolt or Goo shot) gives its normal gem and no damage to the killer.
- [ ] Standing on it as it dies costs 10 hp, shown as the puff strikes.
- [ ] `npm run check` and the desktop and mobile smoke runs pass.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Puff | pops when it dies | Puff's death spawns three more enemies — a crowd that grows; Popper's death deals damage to whoever stands on it and spawns nothing |
| Dot | chases the nearest player in a plain way | Dot's death is a free gem; Popper's death is a zone that punishes the finish |
| Flee | a death a player triggers by catching it | Flee's pop costs the chaser nothing; Popper's pop costs anyone standing on it 10 hp, so it is something you kill from range |
