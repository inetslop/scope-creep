---
id: T0003
title: Procedural sound effects
assignee: desktop
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
---

## Goal
The game is silent. Add short, clean, synthesized sound effects (no audio files) for the core actions. Think minimal and percussive: soft clicks, woodblock-like knocks, plucked tones — matching the flat Bauhaus look, not sci-fi zaps.

## Details
- Create `src/audio/Sfx.ts`: a class that synthesizes sounds with the Web Audio API (oscillators, filtered noise, gain envelopes). Get the `AudioContext` from Phaser: `(scene.sound as Phaser.Sound.WebAudioSoundManager).context`. If the sound manager is not WebAudio (e.g. `NoAudioSoundManager`), every method must be a silent no-op.
- Methods: `shoot()`, `hit()`, `enemyDeath(size: number)`, `pickup()`, `playerHurt()`, `levelUp()`. Keep each sound under 300 ms, and keep `shoot()` quiet; it plays several times per second. `pickup()` can rise in pitch slightly when shards are collected in quick succession.
- Throttle: at most one `hit()` and one `pickup()` sound per 40 ms.
- Master volume 0.35. Add a mute toggle: the `M` key toggles mute; store the setting in `localStorage` under `scope-creep:muted` (wrap storage access in try/catch).
- Wire it up: create one `Sfx` in `GameScene.create()`, pass it to the systems that need it (WeaponSystem, CombatSystem, PickupSystem), and call `levelUp()` when the LevelUp overlay opens.
- Browsers only allow audio after a user gesture; Phaser unlocks the context on the first input. Don't play sounds before that, and don't throw if the context is suspended.

## Acceptance criteria
- [ ] Shooting, hits, deaths, pickups, getting hurt and leveling up each have a distinct sound
- [ ] `M` mutes and unmutes, and the setting survives a reload
- [ ] No audio files were added
- [ ] No errors when audio is unavailable or locked
