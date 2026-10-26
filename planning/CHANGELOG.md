# Changelog

What has been built, newest last. The runner appends a line for every finished task;
the PO reads this instead of the code.

- Baseline (scaffold, 2026-10-26): playable twin-stick loop on desktop, touch and gamepad; Bauhaus flat art; enemies Wedge, Dart, Block; weapons Point and Line; 10 upgrades; level-ups, pause, game over and restart.
- T0003 Procedural sound effects (desktop, 2026-10-26): Added `src/audio/Sfx.ts`, which synthesizes all six SFX (shoot, hit, enemyDeath, pickup with combo pitch-rise, playerHurt, levelUp) on Phaser's WebAudio context using oscillators, filtered noise and gain envelopes — no a
- T0004 Floating damage numbers (desktop, 2026-10-26): Added floating damage numbers: new `src/systems/DamageNumbers.ts` owns a lazy pool of at most 60 `Text` objects that pop up 24 world units and fade over 450 ms (bold ink, red+bigger for the reserved crit path, `paperLigh
- T0001 Add the Hex enemy (yoga, 2026-10-26): Added the Hex enemy as a new data file `src/content/enemies/hex.ts` — a green hexagon (hp 20, speed 115, contact damage 10, 2 XP, threat 2, weight 4, unlocks at 20s, chase behavior, knockbackResist 0.2, radius 15, spin -
- T0007 Add the Sentry enemy (desktop, 2026-10-26): Added the Sentry enemy — an orange pentagon (30 hp, threat 3, unlocks at 60 s) with a new `shoot` behavior: it holds a 240–300 unit distance band, strafes sideways, and every 2.4 s fires a slow ink point (speed 150, 8 da
