# Draft Arena — developer guide

A multiplayer .io arena for desktop and mobile browsers: up to 60 players share one big field, weapons fire by themselves, every level you spend a point in a talent tree, monsters come in crowds, and the other players are the real threat. TypeScript + Canvas 2D + Vite, a Node WebSocket server, no framework.

This file is maintained by humans. The engine's own notes: `engine/README.md`.

## The one rule: the engine is frozen

`engine/` is the owner's: netcode, the server, the simulation loop, the renderer, input. You cannot change it (edits are reverted). Everything you build goes in `src/` and talks to the engine **only through `engine/api.ts`** (lint enforced). That file is long: find what you need with Grep (`interface MonsterDef`, `interface Ctx`, `interface Stats`...) and read just that part. The engine owns what goes over the network; content owns behavior. So almost anything can be content:

- a new monster, weapon, projectile motion, field, status, pickup, visual effect, field event or HUD element is a new file in `src/` plus one line in its registry;
- state the players should see (a charge, a shield, stacks) goes in an entity's `slots` (4 whole numbers sent to every client) and is drawn by a `look.draw()`;
- the numbers of the match (spawning, xp, pvp, respawn) are in `src/content/rules.ts`.

If a feature truly needs the engine changed (a new kind of input, more slots, a new network field, rounds), it can't be built here: say so with `STATUS: BLOCKED`.

## Art style: Critters

Everything alive is a critter: a squishy body in a bright candy color with an ink outline (`rules.ink`), a soft shadow under it, and a face. It wobbles, and stretches more the faster it moves. The engine draws every look this way with `drawCritter()`; a look's own `draw()` starts with `drawCritter()` and adds on top (see `drawCritter` in `engine/api.ts`).

- **Faces carry meaning.** Monsters are angry by default, players happy. A monster's `look.face` is part of its design: `mood` (angry, happy, calm, scared), `eyes` (1, 2 or 3), `mouth` (none, o, smile, frown, teeth). A new monster gets a face that tells it apart, and a warning can change the face just before it acts (its look's `draw()` reads a slot the monster sets).
- **Colors** only from `PALETTE`: monsters warm (red, orange, purple, pink), player weapons cool (teal, blue, ice), rewards yellow and green. The field is mint with a dot pattern.
- **Shots and pickups** are small candy things: stars, bubbles, gems with a shine. No face unless it is a creature.
- **Effects** are confetti, rings with an ink rim, stars and zigzags. No glow, gradients or blur.
- **HUD and menus** are white sticker cards: a 3px ink border, rounded corners and a solid offset ink shadow (the `hud-card` class), in Fredoka (bundled, never loaded from the network). Buttons press down when clicked.
- No themed dressing (fantasy, sci-fi) in art, names or text, and no image files: everything is drawn.

## The talent trees

Every level gives a talent point. Points bank: players spend them when they like, from the Talents button (or T), on any talent whose needs are met, in any tree. Each rank of a talent gives one level of its upgrade. Everyone starts as a nomad with a free rank of Bolt.

- **One file per tree** in `src/content/talents/` (`TREES` lists them). A tree is one playstyle. Today: Gunner (the nomad's Bolt) and Body (plain stats); new trees are for the developers to invent.
- **A tree's shape comes only from what its talents need.** `needs: [['haste', 2]]` (other talents in the same tree, at a rank) and `points: 4` (points spent in this tree). The panel draws each talent under the first talent it needs. There are no shared tiers: every tree can branch, merge or stay flat in its own way, and is balanced on its own.
- **Mods first, weapons deeper.** Cheap talents that need nothing help every weapon you have; a tree's weapon and its strongest talents come after a commitment.
- **The tests enforce:** needs point at talents in the same tree, every talent can be reached, every upgrade is in a tree, and no upgrade's talents add up to more ranks than its `maxLevel`.

## Where code runs

| Hook | Runs on | Rules |
| --- | --- | --- |
| `fire`, `onHit`, `onKill`, `think`, `step`, `pulse`, `collect`, `tick`, `onDeath`, `onEnd`, directors | the server only | Anything goes through `ctx`. Randomness from `ctx.rng`. State in `mem` and `slots`, never in module variables. |
| projectile `path(s, t, owner)` | the server AND every client | **Pure**: only its arguments, no `ctx`, no state, no `Math.random`. Same input, same point. |
| `look.draw(g, e)`, effect `draw(g, fx)` | every client, every frame | Drawing only. Variation from `noise(e.seed, i)`. |
| `src/hud/` parts | the client | DOM. Only touch it when what you show changed. |

A hook that throws disables its item for the rest of the match and is logged; the content tests and the smoke test fail on it.

## Projectiles: path or step

- **`path`** (or neither, for a straight shot): the server sends the launch once, every client computes the flight. Cheap. Use it for anything fired in numbers: whatever moves only by its launch and the time since (and the owner's current position, `owner`) is a path. Two free numbers `p1`/`p2` and a `seed` come with the launch.
- **`step`**: runs on the server only, so it can react to the world (homing, bouncing off enemies). Its position is sent every tick like a monster's, which costs bandwidth: keep these few. The load test fails when a match gets too heavy and names the projectile.

## Map of the game

| Folder | Contents |
| --- | --- |
| `src/content/monsters/` | One file per monster (`MonsterDef`) + `index.ts` (`MONSTERS`) |
| `src/content/projectiles/` | One file per projectile (`ProjectileDef`) + `PROJECTILES` |
| `src/content/areas/` | Fields and auras (`AreaDef`) + `AREAS` |
| `src/content/upgrades/` | What talents give: weapons (`cooldown` + `fire`), capstones, on-hit and on-kill effects, stat boosts (`UpgradeDef`) + `UPGRADES` |
| `src/content/talents/` | The talent trees: one file per tree (`TalentTreeDef`) + `TREES` |
| `src/content/statuses/` | What stays on a unit for a while (`StatusDef`) + `STATUSES` |
| `src/content/pickups/` | Gems and other things to collect (`PickupDef`) + `PICKUPS` |
| `src/content/effects/` | One-shot visuals (`EffectDef`) + `EFFECTS` |
| `src/content/directors/` | What runs the whole match: events and match-wide rules (`DirectorDef`) + `DIRECTORS` |
| `src/content/rules.ts`, `palette.ts`, `index.ts` | The match's numbers, every color, the content bundle |
| `src/hud/` | One file per HUD element (`MakeHudPart`) with its own `.css` beside it, `base.css` (the shared card and colors), `index.ts` (`HUD_PARTS`) |
| `engine/` | Frozen. Read `engine/api.ts` for everything you can use. |

## Working alongside other developers

Several developers change this game at the same time, each on their own task. Two changes to the same lines become a merge conflict, so the game is laid out for everyone to work in their own files:
- **One item per file, named after its id.** `src/content/monsters/dot.ts` holds the monster `id: 'dot'` and nothing else; its export is the id in camelCase (`gem-rain.ts` exports `gemRain`). The tests fail on a file that holds no item of its name or isn't in its registry.
- **Registries are lists, one item per line.** A new item is a new file plus one import and one line in its folder's `index.ts`. Add your line next to related ones. Lines only added to a registry merge by themselves.
- **A HUD element is its own `.ts` and `.css`.** Never restyle another element's file or `base.css` for yours.
- **Shared files** (`rules.ts`, `palette.ts`, a tree's file): change only the lines your task is about.
- No drive-by renames, reformatting or moving code you don't need to change.

## Commands (run in this folder)

| Command | What it does |
| --- | --- |
| `npm run check` | typecheck + lint + tests (every content item is tested automatically, plus the 60-player budget). Must pass. |
| `npm run smoke` | builds the game and plays it in a real browser (desktop + phone), offline against bots. Must pass. |
| `npm run dev` / `npm run server` | dev server / game server (humans only) |

## Rules

- Content is data plus small hooks. A new monster is a new `MonsterDef`, not a new class.
- Colors only from `PALETTE` (`src/content/palette.ts`), and looks in the Critters style (above).
- Everything moves by `dt` (seconds), positions are world units. The world is `rules.world` (4000 x 4000).
- Server randomness: `ctx.rng`. Never `Math.random`, `Date` or `performance` in `src/content/` (lint enforced).
- `slots` hold whole numbers -32768..32767: store a fraction times 100.
- Every input must work with mouse + keyboard AND touch, and be shown where it is used. The engine's inputs: move (WASD/arrows, a drag on a phone), talents (T or the Talents button, then click or tap a glowing talent), leave (Esc), ability A (Space; no touch control yet, so nothing uses it).
- HUD elements: sticker cards (`hud-card`), laid out for 412x915 and 1280x720; touch targets at least 44 px.
- Don't add npm dependencies. Don't edit this file.

## Recipes

**Add a monster** — copy `src/content/monsters/dot.ts`, change `id` (kebab-case), name, description, numbers and `look` (shape, a warm color and a face that tells it apart), and add it to `MONSTERS`. For its own behavior give it `think(ctx, m, dt)`, which sets `m.vx`/`m.vy` (units/s) every tick; the engine moves it and applies slows. `chase(m)` is the default behavior; `m.mem` keeps its state; `m.slots` shows it to clients (read them in `look.draw`). `ctx.fire(m, ...)` makes it shoot. See `MonsterDef` in `engine/api.ts`.

**Add a weapon** — an upgrade with `cooldown` and `fire(ctx, me, level)` (copy `upgrades/bolt.ts`), usually with its own projectile (copy `projectiles/bolt.ts`; give it a `path` to move another way, or a `step` to react to the world, see `ProjectileDef`) or an area (`AreaDef`, fired with `ctx.area`). Damage, speed and radius you pass are scaled by the player's stats automatically. Add each to its registry, and give the upgrade a talent in a tree (below): an upgrade in no tree can't be had.

**Add a talent** — one line in its tree's file (`src/content/talents/<tree>.ts`): `{ id: 'my-talent', upgrade: 'my-upgrade', max: 3, needs: [['bolt', 2]] }`. `max` is at most the upgrade's `maxLevel`; `needs` names talents of the same tree; `points` gates it on points spent in the tree. Put the line after the talent it hangs from.

**Add a capstone** — an upgrade with `maxLevel: 1` that changes how its tree plays (copy `upgrades/ricochet.ts` for an on-hit one, `upgrades/bolt.ts` for a weapon), as a talent that needs real commitment in its tree.

**Add a tree** — copy `src/content/talents/gunner.ts`: an id, a name, a one-line description, a look for its tab, and its talents. Add it to `TREES`.

**Make something work with every weapon** — a stat (`pierce`, `shots`, `projectileSpeed`...) or an `onHit`. The engine applies `pierce` and `shots` to every projectile a player fires.

**Add an on-hit or on-kill upgrade** — `onHit(ctx, me, level, hit)` (copy `upgrades/ricochet.ts`) or `onKill`. `ctx.damage()` deals damage without triggering on-hit hooks again.

**Add a stat upgrade** — `stats: { speed: 20 }` per level (copy `upgrades/swift.ts`). The stats are in `Stats` in `engine/api.ts`.

**Add a status** — a `StatusDef` in `src/content/statuses/` (a `speedMul`, and/or a `tick` for damage over time; see `engine/api.ts`), added to `STATUSES`; apply it with `ctx.addStatus(target, id, seconds)`. A ring in its color shows on units that have it.

**Add an effect** — copy `effects/pop.ts`; play it with `ctx.effect(id, a, b?, value?)` from any server hook.

**Add a field event or match-wide rule** — a director (copy `directors/gem-rain.ts`): `tick(ctx, mem, dt)` every tick, `onKill(ctx, mem, killer, victim)` after every death. `mem` is its memory for the match; `ctx.players()` lists the living players. Add it to `DIRECTORS`.

**Add a HUD element** — write `src/hud/<name>.ts` exporting a `MakeHudPart` and `src/hud/<name>.css` for its styles, imported at the top of the part (copy `xpBar.ts` and `xpBar.css`): build the DOM once, update it only when what it shows changed. Use the `hud-card` class for the card itself. Add one line to `HUD_PARTS`. Interactive elements set `pointer-events: auto` and are at least 44 px.

`engine/tests/` checks every content item automatically: one item per file and every file registered, valid data, pure paths, draw functions, each upgrade and monster in a real match, every talent reachable, the 60-player budget. Their messages say what to fix. Pure helpers of your own in `src/` get unit tests in `tests/`.
