# Changelog

What has been built, newest last. The runner appends a line for every finished task;
the PO reads this instead of the code.

- Baseline (scaffold, 2026-10-26): playable twin-stick loop on desktop, touch and gamepad; Bauhaus flat art; enemies Wedge, Dart, Block; weapons Point and Line; 10 upgrades; level-ups, pause, game over and restart.
- T0003 Procedural sound effects (desktop, 2026-10-26): Added `src/audio/Sfx.ts`, which synthesizes all six SFX (shoot, hit, enemyDeath, pickup with combo pitch-rise, playerHurt, levelUp) on Phaser's WebAudio context using oscillators, filtered noise and gain envelopes — no a
