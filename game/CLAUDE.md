# Scope Creep — developer guide

Abstract twin-stick roguelite for desktop and mobile browsers. Phaser 3.90 + TypeScript + Vite.
You are a blue circle on graph paper; red triangles, black diamonds and yellow squares close in. Shoot them, collect the yellow shards they drop (XP), level up and pick upgrades until you are erased.

This file is maintained by humans. Deeper docs: `docs/ARCHITECTURE.md`.

## Art style: Bauhaus flat

Flat primary colors (red, yellow, blue) and ink black on warm paper. Every shape has an ink outline and a small hard offset shadow (the paper-cut look). **No glow, no gradients, no neon, no additive blending.** Use `drawShape()` from `src/art/shapes.ts` and colors from `PALETTE`.

## Commands (run in this folder)

| Command | What it does |
| --- | --- |
| `npm run check` | typecheck + lint + unit tests. Must pass. |
| `npm run smoke` | builds the game and plays it in a real browser (desktop + phone). Must pass. |
| `npm run dev` | dev server (humans only) |

## Map of src/

| Folder | Contents | May import Phaser? |
| --- | --- | --- |
| `core/` | Pure game logic: RNG, vectors, stats, run state, upgrade rolls, spawn director, XP curve | **No** (lint enforced) |
| `content/` | Data: enemies, weapons, upgrades, palette. One file per thing + an `index.ts` registry | **No** (lint enforced) |
| `art/` | Procedural textures and the shape drawing helpers. There are no image files | yes |
| `entities/` | Pooled game objects: Player, Enemy, Projectile, Shard | yes |
| `systems/` | Per-frame logic owned by GameScene: Spawn, Weapon, Pickup, Combat, Fx | yes |
| `input/` | Twin-stick controls: keyboard+mouse, touch sticks, gamepad -> one `ControlState` | yes |
| `scenes/` | Boot, Menu, Game, Hud (overlay), LevelUp, Pause, GameOver. Keys in `scenes/keys.ts` | yes |
| `ui/` | Text styles and buttons | yes |
| `debug/` | URL flags and the `window.__SC__` test hook the smoke test reads | yes |

## Rules

- Content is data. New enemy/weapon/upgrade = new data, not new classes. Behaviors are switched on fields (e.g. `EnemyDef.behavior`).
- Colors come from `PALETTE` (`content/palette.ts`). Text styles from `ui/text.ts`. Scene keys from `SCENES`.
- Anything that moves uses `dt` (seconds), never assumes 60 fps.
- Use `run.rng` (seeded) for gameplay randomness, not `Math.random()`.
- Pooled objects (enemies, projectiles, shards) are reused: reset every field in their `spawn()`/`fire()`/`drop()`, and call `despawn()` instead of `destroy()`.
- Listeners you add in a scene's `create()` must be removed on `shutdown` (scene event emitters survive restarts). See `GameScene.bindSceneEvents()`.
- Every feature must work with mouse + keyboard AND touch. Test layouts at 412x915 (phone portrait) and 1280x720. Touch targets at least 44 px.
- Don't add npm dependencies. Don't edit this file.
- When you add a system, register a cheap invariant with `hook.addInvariant()` for "this should never happen" states, and remove it on shutdown.

## Recipes

**Add an enemy** — copy `content/enemies/wedge.ts` to a new file, change `id` (kebab-case, unique) and the numbers, pick a `look.shape` (`circle`, `triangle`, `square`, `diamond`, `pentagon`, `hexagon`, `star`) and `behavior` (`chase`, `weaver`, `charger`), then add it to `ENEMIES` in `content/enemies/index.ts`. The texture is generated automatically. Without `look.spin` the shape turns to face where it moves.

**Add an upgrade** — append an entry to `UPGRADES` in `content/upgrades/index.ts`. Use existing stats from `core/stats.ts` (`PlayerStats`). A new stat needs: a field in `PlayerStats`, a value in `BASE_STATS`, optional limits in `STAT_LIMITS`, and code that reads `run.stats.<name>`.

**Add a weapon** — copy `content/weapons/point.ts`, register it in `content/weapons/index.ts`, and add an upgrade with `grantsWeapon: '<id>'` so players can get it.

**Add an enemy behavior** — add the name to `EnemyBehavior` in `content/types.ts` and a `case` in `Enemy.steer()`.

**Add an overlay scene** — model it on `PauseScene.ts`: register it in `main.ts`, give it a key in `SCENES`, launch it from GameScene with `this.scene.launch(...)` + `this.scene.pause()`, and set `hook.overlay`.

`tests/content.test.ts` validates all content automatically. Pure logic in `core/` gets unit tests in `tests/core/`.
