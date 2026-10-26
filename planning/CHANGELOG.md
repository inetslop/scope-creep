# Changelog

What has been built, newest last. The runner appends a line for every finished task;
the PO reads this instead of the code.

- Baseline (scaffold, 2026-10-26): playable twin-stick loop on desktop, touch and gamepad; Bauhaus flat art; enemies Wedge, Dart, Block; weapons Point and Line; 10 upgrades; level-ups, pause, game over and restart.
- T0003 Procedural sound effects (desktop, 2026-10-26): Added `src/audio/Sfx.ts`, which synthesizes all six SFX (shoot, hit, enemyDeath, pickup with combo pitch-rise, playerHurt, levelUp) on Phaser's WebAudio context using oscillators, filtered noise and gain envelopes — no a
- T0004 Floating damage numbers (desktop, 2026-10-26): Added floating damage numbers: new `src/systems/DamageNumbers.ts` owns a lazy pool of at most 60 `Text` objects that pop up 24 world units and fade over 450 ms (bold ink, red+bigger for the reserved crit path, `paperLigh
- T0001 Add the Hex enemy (yoga, 2026-10-26): Added the Hex enemy as a new data file `src/content/enemies/hex.ts` — a green hexagon (hp 20, speed 115, contact damage 10, 2 XP, threat 2, weight 4, unlocks at 20s, chase behavior, knockbackResist 0.2, radius 15, spin -
- T0007 Add the Sentry enemy (desktop, 2026-10-26): Added the Sentry enemy — an orange pentagon (30 hp, threat 3, unlocks at 60 s) with a new `shoot` behavior: it holds a 240–300 unit distance band, strafes sideways, and every 2.4 s fires a slow ink point (speed 150, 8 da
- T0008 Add the Orbit weapon (desktop, 2026-10-26): Added the Orbit weapon: new data file `src/content/weapons/orbit.ts` (3 circles, radius 70, 2.5 rad/s, 12 dmg, knockback 90, 0.6 s per-enemy cooldown), `OrbitSpec` + optional `orbit` field in `content/types.ts`, the `orb
- T0009 Add the Splitter enemy (desktop, 2026-10-26): Added the Splitter enemy (slow spinning red square, unlocks at 75 s) that splits into two fast Splinter triangles on death via a new data-driven `splitsInto` field on `EnemyDef`, a `burst()` method on `Enemy` reusing kno
- T0002 Add the Tempo upgrade (yoga, 2026-10-26): Added the new hybrid upgrade `tempo` ("Tempo") to `UPGRADES` in `src/content/upgrades/index.ts`, appended after `composition` per the design.
- T0010 Add the Mote enemy (yoga, 2026-10-26): Added the Mote enemy — a tiny fast ink circle (radius 7, paper-light eye, `spin: 0` so it never rotates) with hp 6, speed 150, contactDamage 4, threat 1, spawnWeight 8, unlocking at 45 s for mid-game swarm pressure.
- T0012 Add the Draft upgrade (yoga, 2026-10-26): Added the "Draft" upgrade to `UPGRADES` in `src/content/upgrades/index.ts` — a size-S, max-3, weight-5, ink-colored upgrade whose single `projectileSpeedMul` ×1.25 mod makes all weapon projectiles 25% faster per level (s
- T0011 Generative background music (desktop, 2026-10-26): Added a quiet generative background score: new pure `src/core/music.ts` (tempo curve 80→120 BPM over 10 min, second-voice threshold at 100 BPM) with unit tests, and new `src/audio/Music.ts` — a lookahead beat scheduler o
- T0013 Add the Contrast crit upgrade (desktop, 2026-10-26): Added the Contrast upgrade (id `contrast`, maxLevel 3, +10% crit chance per level, weight 4, red) to `src/content/upgrades/index.ts`, backed by a new `critChance` stat (base 0, clamped 0–0.5) in `src/core/stats.ts`.
- T0017 Add the Boulder enemy (yoga, 2026-10-26): Added the Boulder enemy as a new data file `src/content/enemies/boulder.ts` (id `boulder`, hp 60, speed 60, contactDamage 15, xp 4, threat 3, spawnWeight 3, unlockAtSec 90, behavior `chase`, knockbackResist 0.6, big yell
