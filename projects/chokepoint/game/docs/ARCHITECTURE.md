# Architecture

Keep this document current when you add or change a system.

## Boot and rendering

`main.ts` installs the test hook (`window.__SC__`), creates the `Phaser.Game` and registers the scenes. The canvas is sized in device pixels, at least 2x (supersampling: WebGL doesn't antialias shapes) and shown at CSS size; every camera zooms by `display.ratio` so all scene code works in CSS pixels (`ui/display.ts`: `viewSize()`, `pointerCss()`, `uiCamera()`). `?smoke` renders at 1x. `BootScene` paints every texture (`art/generate.ts`), creates the shared `Sfx`, and starts `MenuScene`, or `GameScene` directly with `?smoke` or `?play`.

## Scenes

```
Boot -> Menu -> Game ──launch──> Hud (overlay, runs in parallel)
                  │  ├─pause──> Draft (overlay, before wave 1 and after every cleared wave) ─resume─┐
                  │  ├─pause──> Pause (overlay)                                              ─resume─┤
                  │  <──────────────────────────────────────────────────────────────────────────────┘
                  └─start──> GameOver -> Game | Menu
```

Scene order in `main.ts` is draw order: Hud draws over Game, Draft and Pause over Hud.

- **GameScene** only wires the run together: it creates the `RunState`, the `Board` and the systems, the gestures and hotkeys, and the invariants, and calls `RunFlow.update()` every frame. Other scenes reach the systems through `getGameScene()` (`game.flow`, `game.building`, `game.board`, ...).
- **HudScene** lists the HUD parts (`ui/hud/`, one per element) and calls their `layout()` and `update()`.
- **DraftScene** shows the three augments in `RunFlow.offer`; picking one calls `RunFlow.finishDraft(id)`.
- **MenuScene** shows the title over a live demo (`scenes/menu/MenuDemo.ts`, purely for show).

## The run (`systems/RunFlow.ts`)

`RunState.phase` moves `draft -> build -> wave -> draft ...` and to `over` when the lives hit 0:
- **draft**: opens the run (the first augment; only ones that deal damage are offered) and follows every cleared wave. The pick goes into the hand (`RunState.hand`).
- **build**: `buildLeftSec` counts down (`BUILD_SEC`: 8 s before wave 1, 10 s after); "next wave" / Space sets it to 0, then `WaveSystem.start()` plans the next wave.
- **wave**: in this order every frame: `WaveSystem` (spawns), `EnemySystem` (walk, leaks), `TowerSystem` (attacks), `ProjectileSystem` (bolts fly and hit). Everything spawned and nothing alive: the wave bonus, then the draft.
- **over**: GameScene stops the HUD and starts GameOverScene.
Last every frame, in every phase: `EnemySystem.drawBars()` (`systems/enemyMarks.ts`), so no health bar outlives its enemy.

## Building (`systems/Building.ts`)

The hand, the selected card, the open tower panel, and what a tap does: on an empty cell with a card held, build a tower with it (pays the first slot); on a tower, put the held card into a free slot and open the tower's panel. `Building.uiVersion` goes up on every change so the hand and the panel redraw. Gold only buys slots (`SLOT_COSTS`): the first is the tower itself, every further slot on the same tower costs much more, up to `MAX_SLOTS`.

## Augments (`content/augments/`, `core/augments.ts`)

Towers have no type. `towerSpec(augments)` combines a tower's augments, in the order they were put in:
1. The first augment's `first` form is the attack: its kind (`shot` or `pulse`), damage, range, rate (and Frost's slow, with no damage).
2. Every later augment applies its `added` form: multipliers multiply, extra shots and splash add up, the strongest slow wins. On a pulse tower, splash widens the pulse and extra shots fire that many bolts per pulse (with Bolt's damage).

`TowerSystem.attack()` hands the spec to the attack for its kind (`systems/attacks/`: `shot.ts`, `pulse.ts`, registered in `ATTACKS`). Hits go through `EnemySystem.hit()` / `strike()` (damage, splash, slow, kills, gold).

## Towers (`entities/Tower.ts`, `entities/towerLook.ts`)

A tower is a white plinth, a body in its first augment's shape and color, barrels under the body that turn to aim (one per shot, longer for range, thinner for speed, a bulb for splash, yellow bands per Rapid), decorations around the body (`DECORATIONS`: the frost ring, speed ticks), and one pip per slot. `towerLook.ts` works the look out of the spec, so new augments that change the stats change the look too.

## Map, path and the camera

`core/map.ts` generates the board from the run seed: 14x8 cells on landscape screens, 8x14 on portrait ones; the path enters on one short edge and leaves on the other in runs of 2-3 cells with sideways turns, never touching itself; 5 rocks block random cells. `core/path.ts` turns it into a `PathLine` (board units); enemies only store `distance` along it. A cell is `CELL` (64) board units. `Board` paints the run's board texture (`art/board.ts`) and drives the camera with the pure view math in `core/view.ts` (fit between the HUD bars, zoom up to `ZOOM.max` around a point, pan, clamp with 1.5 cells of overscroll).

## Input (`input/`)

`BoardGestures`: a press that moves less than `TAP_SLOP` px is a tap (`Building.tap`), more drags the board, two fingers pinch-zoom, the wheel zooms at the cursor; taps and hover only count between the HUD bars. `hotkeys.ts`: the key table (`HOTKEYS`). HUD buttons only fire when the press started on them, and stop their events so the board never sees them; overlays have a full-screen interactive shade.

## Art (`art/`)

Painter modules paint textures with Canvas 2D at `ART` (3x) size: `entities.ts` (enemies, plinth, tower bodies, bolts, chips), `icons.ts` (augment icons, coin, life), `menu.ts` (the menu road), all at boot via `generate.ts`; `barrels.ts` (per look) and `board.ts` (per run) on demand. Images show them with `artScale()`. HUD cards are textures from `ui/card.ts`.

## Audio

`Sfx` synthesizes short tones on its own WebAudio context, unlocked by the first pointer or key press. Every call is a silent no-op before that or without WebAudio.

## Test hook contract (`debug/testHook.ts`, `debug/runChecks.ts`)

The browser smoke test (owned by the loop, outside this folder) plays `?smoke&seed=1234`: the opening draft picks itself, then it clicks or taps the free cells beside the path that are on screen (`__SC__.buildSpots()`), presses Space, and clicks at random. It fails the build if:
- `__SC__.ready` never becomes true, or the Game scene is never reached;
- `__SC__.frame` stops increasing;
- `__SC__.errors` is non-empty, any page error or `console.error` happens, or a request fails;
- `__SC__.invariants()` returns anything (`INVARIANTS` in `debug/runChecks.ts`);
- after playing, `stats.towersBuilt`, `stats.enemiesSpawned` or `stats.shotsFired` is still 0.

`?smoke` also auto-starts from the menu, auto-picks the first augment in every draft, auto-resumes the pause screen and auto-restarts after game over, so random clicks can't strand the test.
