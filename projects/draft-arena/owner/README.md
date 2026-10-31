# Owner only

Agents of the fleet can't read or change anything in this folder (`loop/sandbox.ts` hides a project's
`owner/` from every role, for reading and searching). It holds what the owner keeps out of their sight.

## removed-content/

Content taken out of the game on 2026-10-31 to see what the fleet invents without it: the monsters
Dart (creeps, warns, lunges) and Spitter (keeps its distance and shoots), the talent trees Hunter,
Tide, Blades, Warden and Storm, and everything only they used (weapons Wave, Seeker, Orbit, Aura,
Spark; capstones Tide, Swarm, Sawstorm, Nova, Shatter; mods Pierce, Reach, Knockback, Splash, Crit,
Bleed, Armor, Chain, Frost; the Chill and Bleed statuses; the Zap and Nova effects).

Paths are the game's own (`removed-content/src/content/...` was `game/src/content/...`), and each
folder's `index.ts` is the full registry as it was. To bring something back, move its files into
the game and copy its lines from the old registry. To let agents learn from them without adding
them to the game, move them to `game/engine/examples/` (readable, not loaded).
