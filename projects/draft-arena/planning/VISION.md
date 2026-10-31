# Vision — Draft Arena

_The game's owner writes this file. Agents plan from it and never edit it._

**Pitch:** One big field, up to 60 players, and crowds of monsters closing in on every one of them. Your weapons fire by themselves; you steer. Every level gives a talent point to spend in one of the talent trees, so every life grows into a playstyle of its own. Monsters give you levels, but the other players are the real threat, and the real prize. Get knocked out and you are back in three seconds, from level 1.

**Genre:** Multiplayer .io arena with a survivor-style draft. Drop in, play a life of a few minutes, drop out. A scoreboard shows who is on top right now.

**Platforms:** Desktop and mobile browsers, equally. Move with WASD or a drag; nothing needs precise aim. Weapons aim themselves.

## Pillars

1. **Every level is a point to spend.** You start as a nomad with a Bolt and no decision to make. Every level gives a talent point; spend it when it's calm, in any tree. Cheap mods come first and work with whatever you have; a tree's weapon and capstone ask for commitment. Every tree has its own shape, and every life can grow into a different one.
2. **Crowds you can read.** Monsters are warm, player weapons cool, rewards yellow and green. A monster's shape and face tell you what it is, and its face changes before it does something.
3. **Other players matter.** Monsters are the farm; players are the fight. Knocking out a stronger player pays more than a crowd of monsters.
4. **Fun with three players or sixty.** Bots fill a quiet match; a busy one spreads out. Nothing should need a full server to be fun.
5. **Instant in, instant back.** No accounts, no lobby, no waiting: a name and play. Knocked out, back in three seconds.
6. **Plays great on a phone.** Portrait or landscape, one thumb, large cards, 60 fps on a mid-range phone.
7. **Depth over count.** A new monster brings a behavior no other has; a new upgrade changes how you play. Never more of the same with other numbers.
8. **Critters.** Everything alive is a squishy creature with a face: monsters glare, players smile. Bright candy colors with ink outlines on a mint field, white sticker cards for the HUD, confetti when things pop. No fantasy or sci-fi dressing.

## Tone

Short plain names (*Bolt*, *Split*, *Ricochet*, *Dot*), one-line texts with the numbers, no lore.

## The engine

The engine (networking, server, simulation loop, rendering, input) is the owner's and stays frozen; the game grows as content and HUD on top of it. Features that need the engine changed go to the owner (IDEAS.md, "Needs the engine").
