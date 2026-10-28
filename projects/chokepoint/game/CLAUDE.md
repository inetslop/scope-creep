# Chokepoint — developer guide

Abstract roguelite tower defence for desktop and mobile browsers. Phaser 3.90 + TypeScript + Vite.
Every run is a new board: a white road winds across a light island from a grey entrance gate to the dark exit gate. Towers have no types: they are what their **augments** make them. The run opens with a pick of one augment; you build a tower with it beside the road, and after every wave you pick another and put it into a tower. Enemies that reach the exit cost lives; the run ends when they run out.

This file is maintained by humans. Deeper docs: `docs/ARCHITECTURE.md`.

## Working alongside other developers

Several developers change this game at the same time, and every edit two of them make at the same spot becomes a merge conflict. So:
- **One concern per file.** Put new logic in a new file (a content file, a core module, an attack, a HUD part, a decoration) and touch shared files only for the one line that registers it.
- **Registries are lists, one item per line.** Content (`ENEMIES`, `AUGMENTS`), attacks (`ATTACKS`), HUD parts (`HudScene`), hotkeys (`HOTKEYS`), invariants (`INVARIANTS`), tower decorations (`DECORATIONS`), enemy marks (`MARKS`), texture painters (`PAINTERS`). Add your line next to the related ones, never at the very end where everyone appends.
- **Don't grow GameScene or HudScene.** GameScene only wires systems together; HudScene only lists HUD parts. Features live in systems/, ui/hud/, input/, entities/.
- No drive-by renames, reformatting or moving code you don't need to change.

## Art style: bright minimal

Calm and designed, like Mini Motorways: a soft sage-grey ground, the board as a lighter rounded island with a white road, ink-slate text, and clear saturated colors only for what matters (enemies warm: red, orange, purple; augments: teal, blue, ice, yellow, green). Everything that stands on the board is a **chunky rounded token**: the shape in its color on top of the same shape in its darker `*Deep` color (the side face), with a soft shadow. The HUD is white rounded cards with soft shadows. **No outlines, no gradients, no glow, no image files, no themed art** (no ink, paper, sci-fi or fantasy dressing).

How to draw:
- Textures are painted with Canvas 2D by the painter modules in `art/` (helpers in `art/paint.ts`: `paintToken()`, `shapePath()`, `roundRectPath()`, `setShadow()`), registered in `art/generate.ts`. They are painted at `ART` (3x) size: show them with `artScale(image, size)`, never a bare `setScale()`. Leave room for a token's shadow (`tokenRoom()`), or it ends in a hard edge.
- Painted shading (the side face, the shadow) must stay at the bottom: never rotate an image that has it. Rotate a separate flat part instead, like a tower's barrels.
- A tower's look comes from its spec in `entities/towerLook.ts`; a new augment visual is one more entry in `DECORATIONS` or one more field in the barrel look.
- Thick rings and arcs: `fillRing()` (`ui/ring.ts`), never a thick Graphics stroke (it looks notched and shimmers).
- UI: `makeCard()` and `makeButton()` (`ui/`); put icons into `button.content` so they lift with it. Primary buttons are ink (`fill: PALETTE.ink`).
- Colors only from `PALETTE` / `deepOf()` in `content/palette.ts`; text in `ink`, `muted` or `faint`.

## Commands (run in this folder)

| Command | What it does |
| --- | --- |
| `npm run check` | typecheck + lint + unit tests. Must pass. |
| `npm run smoke` | builds the game and plays it in a real browser (desktop + phone). Must pass. |
| `npm run dev` | dev server (humans only) |

## Map of src/

| Folder | Contents | May import Phaser? |
| --- | --- | --- |
| `core/` | Pure game logic: RNG, map and path generation, path geometry, waves, run state, augment combining (`augments.ts`), targeting, the board view math, best score | **No** (lint enforced) |
| `content/` | Data: enemies, augments, palette. One file per enemy and augment + an `index.ts` registry | **No** (lint enforced) |
| `art/` | Texture painters (one per kind: `entities`, `icons`, `barrels`, `board`, `menu`), their registry (`generate.ts`), helpers (`textures.ts`, `paint.ts`) | yes |
| `audio/` | `Sfx`: tiny procedural sounds (WebAudio, no files) | yes |
| `entities/` | Game objects: pooled `Enemy` and `Projectile`; `Tower` and its look rules (`towerLook.ts`) | yes |
| `systems/` | Owned by GameScene: `RunFlow` (phases), `Building` (hand, selection, taps), `Board` (cells, camera), `WaveSystem`, `EnemySystem` (+ `enemyMarks.ts`), `TowerSystem`, `attacks/` (one file per attack kind), `ProjectileSystem`, `FxSystem` | yes |
| `input/` | `BoardGestures` (tap, drag, pinch, wheel) and `hotkeys.ts` (the key table) | yes |
| `scenes/` | Boot, Menu (+ `menu/MenuDemo.ts`), Game, Hud, Draft, Pause, GameOver. Keys in `scenes/keys.ts` | yes |
| `ui/` | Text, cards, buttons, rings, the pixel ratio (`display.ts`), and the HUD parts (`ui/hud/`, one per element) | yes |
| `debug/` | URL flags, the `window.__SC__` test hook, and the run's invariants (`runChecks.ts`) | yes |

## Rules

- Content is data. A new enemy or augment is new data, not a new class. Behaviors are switched on fields (`EnemyDef.behavior`, an augment's `first.kind`).
- Colors come from `PALETTE` (`content/palette.ts`). Text styles from `ui/text.ts`. Cards and buttons from `ui/`. Scene keys from `SCENES`.
- Board positions are board units (one cell = `CELL`). The camera fits the board to the screen and the player can zoom and drag it (`core/view.ts`, `Board`); never use screen pixels in GameScene. Screen-space UI belongs in a HUD part or an overlay scene.
- Layout and input work in CSS pixels: use `viewSize()` and `pointerCss()` (`ui/display.ts`), never `scene.scale.width` or `pointer.x`. Screen-space scenes call `uiCamera(this)` first.
- Board input goes through the gestures: act on a tap (`Building.tap`), never on a raw pointerdown, or dragging and pinching would trigger it.
- Anything that moves or counts down uses `dt` (seconds), never assumes 60 fps.
- Use `run.rng` (seeded) for gameplay randomness, never `Math.random()` (cosmetic effects may).
- Pooled objects (enemies, projectiles) are reused: reset every field in `spawn()`/`fire()`, and call `despawn()` instead of `destroy()`.
- Listeners you add in a scene's `create()` must be removed on `shutdown`. Use `onResize()` and `onKey()` from `scenes/keys.ts`, which do it for you.
- Every feature must work with mouse + keyboard AND touch. Test layouts at 412x915 (phone portrait) and 1280x720. Touch targets at least 44 px.
- Every input is shown where it is used: a key hint on its button or card, a touch control on mobile.
- Don't add npm dependencies. Don't edit this file.
- When you add a system, add a cheap invariant for "this should never happen" to `INVARIANTS` in `debug/runChecks.ts`.

## Recipes

**Add an enemy** — copy `content/enemies/dot.ts`, change `id` (kebab-case, unique), the numbers and `look` (`shape`: `circle`, `triangle`, `square`, `diamond`, `pentagon`, `hexagon`; `color`: one of `BRIGHTS`), and add it to `ENEMIES` in `content/enemies/index.ts`. Its texture is painted automatically; waves send it from `fromWave`. A new way of moving needs a new `EnemyBehavior` in `content/types.ts` and a `case` in `Enemy.advance()`.

**Add an augment** — copy `content/augments/frost.ts`, give it a new `id`, `look`, the two card lines (`asTower`: what it does as a tower's first augment; `asAdded`: what it changes when added, with its numbers) and its two forms: `first` (the tower's attack when it goes in first) and `added` (the change it makes to any attack after that). Add it to `AUGMENTS` in `content/augments/index.ts`. It shows up in the draft, its icon and tower body are painted automatically, and `core/augments.ts` combines it. A new kind of change needs a field in `AddedForm` (`content/types.ts`) and its handling in `towerSpec()`; give it a visual in `entities/towerLook.ts`.

**Add an attack kind** — add the kind to `AttackKind` (`content/types.ts`), write `systems/attacks/<kind>.ts` (model it on `shot.ts`: it gets an `AttackContext` and returns whether it attacked), and add one line to `ATTACKS` in `systems/attacks/index.ts`.

**Add a HUD element** — write `ui/hud/<Name>.ts` implementing `HudPart` (model it on `WaveCard.ts`: build in the constructor, place in `layout()`, refresh in `update()`), and add one line to the `parts` list in `HudScene.create()`.

**Add a hotkey** — one line in `HOTKEYS` (`input/hotkeys.ts`), and its hint on screen.

**Add an overlay scene** — model it on `PauseScene.ts`: register it in `main.ts` (after HudScene, so it draws on top), give it a key in `SCENES`, launch it with `this.scene.launch(...)` + `this.scene.pause()` on GameScene, set `hook.overlay`, and give it a full-screen interactive shade so clicks don't reach the board.

`tests/content.test.ts` validates all content automatically. Pure logic in `core/` gets unit tests in `tests/core/`.
