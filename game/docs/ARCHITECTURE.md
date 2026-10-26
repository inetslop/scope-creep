# Architecture

Keep this document current when you add or change a system.

## Boot

`main.ts` installs the test hook (`window.__SC__`), creates the `Phaser.Game` (RESIZE scale mode, Arcade physics, 3 pointers for multi-touch, gamepad on) and registers the scenes. `BootScene` draws every texture (`art/textures.ts`) and starts `MenuScene` — or `GameScene` directly with `?smoke` or `?play`.

## Scenes

```
Boot -> Menu -> Game ──launch──> Hud (overlay, runs in parallel)
                  │  ├─pause──> LevelUp (overlay) ─resume─┐
                  │  ├─pause──> Pause (overlay)   ─resume─┤
                  │  <─────────────────────────────────────┘
                  └─start──> GameOver -> Game | Menu
```

- **GameScene** owns one run: the `RunState`, the player, all systems, the camera. It shares `run` and `controls` through `this.registry` (typed getters in `scenes/keys.ts`).
- **HudScene** only reads `RunState` and draws bars, timer, kills, the pause button and touch sticks.
- **LevelUpScene** gets `{ choices: string[] }` (upgrade ids), applies the picked upgrade to `RunState`, resumes Game.

## A frame of GameScene.update()

1. `dt` = frame time in seconds, clamped to 50 ms.
2. `controls.read()` -> `ControlState { move, aim, firing, device }`.
3. Player velocity from `move * stats.moveSpeed`; barrel angle from `aim`.
4. `WeaponSystem.update` fires volleys for every owned projectile weapon on cooldown while firing and ages projectiles; `ArcSystem.update` snaps chained arcs on its own cooldown; `OrbitSystem.update` spins the orbit circles and applies contact damage.
5. `SpawnSystem.update` asks the `SpawnDirector` (pure) what to spawn, places enemies on a ring just outside the view, steers every enemy.
6. `PickupSystem.update` magnets shards inside `pickupRadius`, collects on touch (XP).
7. Regen; movement trail; hook stats.
8. Death -> GameOver after a short delay. Pending level-ups -> LevelUp overlay.

Physics overlaps live in `CombatSystem` (projectile↔enemy, player↔enemy, enemy↔enemy separation).

## Data flow for stats

`UpgradeDef.mods: StatMod[]` -> `RunState.applyUpgrade()` -> `computeStats()` (all `add`, then all `mul`, then `STAT_LIMITS`) -> `run.stats`. Systems read `run.stats` every frame, so upgrades apply instantly.

## Coordinates and camera

The arena is `ARENA_SIZE` square, centered on (0,0). Camera zoom = short screen side / `VIEW_SHORT_SIDE`, so every device sees roughly the same amount of world. Screen-space UI belongs in HudScene (zoom 1), not GameScene.

## Input

`TouchSticks` turns touches on the left/right half of the screen into floating sticks (state only; HudScene draws them). `Controls` merges gamepad > touch > keyboard+mouse into one `ControlState`. Touches starting in the top 72 px are ignored (HUD buttons).

## Audio

`Sfx` (`src/audio/Sfx.ts`) synthesizes every sound effect on Phaser's WebAudio context — oscillators, filtered noise and gain envelopes; there are no audio files. Master volume is 0.35. `M` toggles mute, persisted in `localStorage` (`scope-creep:muted`). Sounds only play once the first input unlocks the context; before that (or with a non-WebAudio sound manager) every call is a silent no-op. `Music` (`src/audio/Music.ts`) plays a quiet generative score on the same context at ~25% of the SFX master — a lookahead beat scheduler driving a low pulse, sparse pentatonic notes and noise swells, tempo 80→120 BPM over the first 10 minutes, a second voice at 100 BPM — driven from `GameScene.update` so it stops while paused/on game over and resumes on unpause, and it follows the SFX mute.

## Test hook contract (`debug/testHook.ts`)

The browser smoke test (owned by the loop, outside this folder) fails the build if:
- `__SC__.ready` never becomes true, or the Game scene is never reached with `?smoke`;
- `__SC__.frame` stops increasing;
- `__SC__.errors` is non-empty, any page error or `console.error` happens, or a request fails;
- `__SC__.invariants()` returns anything;
- no shots are fired or no enemies spawn while it plays with random keyboard/mouse and two-thumb touch input.

In `?smoke` mode the menu is skipped, level-up picks the first card, and game over restarts automatically. Keep those shortcuts working when you change those scenes.
