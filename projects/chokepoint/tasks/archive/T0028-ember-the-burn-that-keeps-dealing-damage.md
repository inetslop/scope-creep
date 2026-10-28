---
id: T0028
title: "Ember: the burn that keeps dealing damage"
assignee: desktop
size: L
priority: 3
status: done
depends_on: [T0021, T0006]
attempts: 1
created: 2026-10-28T06:24:55Z
claimed_at: 2026-10-28T16:04:06Z
finished_at: 2026-10-28T16:32:01Z
epic: E4
---

## Goal
The draft can roll a new augment, Ember — the first damage over time in the game. Every combo hits twice: the shot, and the burn that keeps ticking after it, so a slow sniper and a fast volley both leave enemies burning.

## Details
- New pool augment (rolls at all tiers; offered from the opening draft). **Closest existing:** Mark (a cadence effect on the enemy furthest along). **What is new:** no existing augment deals damage over time — the burn is a second damage source that keeps ticking after the attack ends, and its ticks are the source tower's damage, so Mark amplifies them and the tick that kills is the source tower's kill (gold, stats and Mint's +1 all apply to it).
- **As a tower's first augment (its own attack):** sets ablaze the enemy furthest along within range, every 1.5 s. The burn deals its rate continuously (the engine may tick it every 0.5 s). Common: 3 damage per second for 3 s. Rare: 4 per second for 3 s. Epic: 5 per second for 3 s. An untouched enemy takes about 9/12/15 over the burn's life.
- **Re-ignition:** setting ablaze an enemy that is already ablaze refreshes the 3 s duration and keeps the higher per-second rate — two Common Embers never add to 6/s, a Rare over a Common burns at 4/s. The burn never stacks additively.
- **When added to a tower:** every enemy this tower hits is also set ablaze with the tower's tier burn (3/4/5 per second for 3 s), refreshed on every hit. The new way no added form has: any attack pattern can ignite — Bolt's volley, Splash's burst, Lance's line, Reach's heavy shot — and the damage keeps working after the shot stops.
- **Card lines:** Common first: "Sets ablaze the enemy furthest along: 3 per second for 3 s." / added: "Hits set ablaze: 3 per second for 3 s." Rare and Epic show their own rate in both lines (4, 5); the duration is 3 s at every tier.
- **Look on the tower:** the burn's color is orange everywhere (the tower's look, the mark on the enemy, the ticks). A body shape and bright color no other augment uses (check the content folder; if the obvious pair is taken by an in-flight augment, take the next free one). Ember first: a small orange dot at the muzzle of the barrel. Every added Ember: one short orange tick on the barrel, the existing tick style. If T0010's tier pips have landed, they stay visible — the ticks never sit on top of the pips.
- **The mark on an ablaze enemy:** a small orange dash (6 px, rounded) orbits the enemy, one full turn in about 1 s, for as long as the burn is active.
- **The tower-panel line** (the same place Mark's mark line lives): "Sets ablaze the furthest enemy: 3 per second for 3 s", and for a tower with Ember added to another first augment, "...and its hits set ablaze".
- **Sound:** one new Sfx method, a soft low whoosh, played only when an enemy that is not already ablaze is set ablaze (a refresh, or a Rapid host re-igniting the same enemy, is silent — a Rapid host must not spam it). The ticks are silent.
- **Spec-test coverage** closest to Mark's (`tests/core/mark.test.ts`): the burn's total over its life per tier, refresh keeping the higher rate (never additive), Mark's +25% on the ticks, the killing tick crediting the source tower's kill gold, the added form through a Bolt tower, and the card lines per tier. One invariant line in the debug run checks next to the other enemy invariants (no active enemy with a negative burn time).
- No new input, no new HUD element; the pause screen is unchanged.

## Acceptance criteria
- [ ] The draft can roll Ember as Common, Rare and Epic (frame and gem row per T0002); the card shows that tier's per-second rate; the added line reads "Hits set ablaze: N per second for 3 s."
- [ ] A lone Common Ember tower sets ablaze the enemy furthest along within range every 1.5 s: an orange dash orbits the enemy and it takes 3 damage per second for 3 s (an untouched enemy takes about 9 from the burn).
- [ ] Re-ignition refreshes the 3 s and keeps the higher rate: two Common Embers on one enemy never deal 6/s; a Rare Ember over a Common burns at 4/s.
- [ ] A marked, ablaze enemy takes +25% from the burn's ticks — visibly faster death than the same unmarked ablaze enemy.
- [ ] The tick that kills an enemy is a normal kill for the tower that lit the burn: gold pops where the enemy died, the run's stopped count grows, and a Mint within 2 cells pays its +1.
- [ ] A Bolt tower with Ember in a later slot ignites every enemy its shots hit, and the tower shows one short orange tick per Ember in it.
- [ ] A first-time player can read it from the board alone: enemies with the orbiting orange dash keep taking damage after the last shot.

## Design (architect, desktop)

### Files
- create `src/core/burn.ts` — pure burn rules: `LiveBurn`, `ignite()`, `burnTick()` (no Phaser; import only `Burn` type from content)
- create `src/content/augments/ember.ts` — Ember `AugmentDef` (model on `mark.ts`)
- create `src/systems/attacks/burn.ts` — the 'burn' attack: ignites the furthest enemy in range (model on `mark.ts`, but `pickTarget`, `aimAt` + `kick`, no sfx)
- create `tests/core/ember.test.ts` — spec tests (see Tests)
- edit `src/content/types.ts` — `Burn` interface; `AttackKind` += `| 'burn'`; `FirstForm.burn?`, `AddedForm.burn?`; `TierValues.burnDps?` + `TierValues.asTower?`
- edit `src/content/augments/index.ts` — `ember,` one line after `mark,`
- edit `src/core/tiers.ts` — `tierFirst`/`tierAdded` copy the burn and apply `burnDps`; new `tierTowerLine()` next to `tierAddedLine()`
- edit `src/core/augments.ts` — `TowerSpec.burn`/`burnCount` (+ `EMPTY`); in `towerSpec` an Ember loop next to the Mark loop; `describeSpec` 'burn' branch + `', and its hits set ablaze'` suffix in the other branches
- edit `src/systems/attacks/index.ts` — `burn` import + `burn,` in `ATTACKS`
- edit `src/entities/Enemy.ts` — `burn` field (reset in `spawn()`), `ignite()` method, `hit()` gains a `flash` parameter
- edit `src/systems/EnemySystem.ts` — `HitPayload.burn`; `strike()` ignites (+ whoosh only when fresh); extract the kill body into `private kill(e)`; `update()` ticks burns; `brokenBurn()`
- edit `src/systems/TowerSystem.ts` — `burn: spec.burn,` in the payload literal (one line)
- edit `src/systems/enemyMarks.ts` — orbiting dash as one `MARKS` line, inserted before the frost line
- edit `src/entities/towerLook.ts` + `src/art/barrels.ts` — burn tower gets 1 barrel; `BarrelLook.emberTicks`/`emberMuzzle`, included in the texture key and painted
- edit `src/audio/Sfx.ts` — `ignite()` after `mark()`; edit `src/scenes/DraftScene.ts` — tower line via `tierTowerLine(b, copy.tier)` (one line + import)
- edit `src/debug/runChecks.ts` — `['enemies.burn', (g) => g.enemies.brokenBurn()],` after `enemies.mark`; edit `tests/content.test.ts` — first-form check gains `|| a.first.burn`; tier loop checks `burnDps > 0` and `asTower` length/label like `asAdded`

### Interfaces
```ts
// content/types.ts
export interface Burn { dps: number; sec: number; }          // FirstForm/AddedForm: burn?: Burn
// TierValues: burnDps?: number;  asTower?: string;          // AttackKind: | 'burn'
// core/burn.ts
export interface LiveBurn { dps: number; left: number; }     // left 0 = not ablaze
export function ignite(burn: LiveBurn, dps: number, sec: number): boolean;  // true = fresh ablaze; re-ignite: left = sec, dps = max
export function burnTick(burn: LiveBurn, dt: number): number; // dps × seconds still ablaze this tick, 0 when spent
// core/augments.ts: TowerSpec += burn: Burn | undefined; burnCount: number;
// core/tiers.ts: export function tierTowerLine(def: AugmentDef, tier: Tier): string;
// systems/EnemySystem.ts: HitPayload += burn: Burn | undefined;
//   private kill(e: Enemy): void;  private tickBurn(e: Enemy, dt: number): void;  brokenBurn(): string | undefined;
// entities/Enemy.ts: burn: LiveBurn = { dps: 0, left: 0 };  ignite(dps: number, sec: number): boolean;
//   hit(damage: number, flash = true): boolean;
// art/barrels.ts: BarrelLook += emberTicks: number; emberMuzzle: boolean;   // audio/Sfx.ts: ignite(): void
```
Ember values: `range: 2.6`, `rate: 1 / 1.5`, `damage: 0`, `first.burn = added.burn = { dps: 3, sec: 3 }`, `tiers.rare = { burnDps: 4, … }`, `epic = { burnDps: 5, … }`, `look: { shape: 'circle', color: 'orange', size: 0.2 }`, `opening: true` (its damage is the burn, which `first.damage` doesn't count — keep the `rollOffer` filter untouched). `tierSpec.burn` = strongest Ember in the tower (max dps, like slow — never summed); `burnCount` = Embers in any slot.
Card lines exactly: asTower `'Sets ablaze the furthest enemy: 3 per second for 3 s.'`; asAdded `'Hits set ablaze: 3 per second for 3 s.'`; rare/epic replace the 3 with 4/5 in both (per-tier asTower via `tiers[?].asTower`). Panel: burn branch `Sets ablaze the furthest enemy: N per second for 3 s`; other kinds append `, and its hits set ablaze`. Sound: `ignite(): this.tone(150, 0.25, 'sine', 0.3, 60)`. Mark: dash `fillRoundedRect(x-3, y-1.5, 6, 3, 1.5)` in `PALETTE.orange` at radius `look.size * 64 + 9`, angle `2π (e.age % 1)`. Barrel: ticks are short rounded rects (≈ `w*1.2 × w*0.38`) at `c - len * (0.18 + 0.1*i)`, painted `orangeDeep` when the barrel color is orange else `orange`; muzzle dot: circle `w*0.3` at the tip in `orangeDeep`.

### Steps
1. `core/burn.ts`, 2. `content/types.ts`, 3. `content/augments/ember.ts` + registry line, 4. `core/tiers.ts`, 5. `core/augments.ts`, 6. `systems/attacks/burn.ts` + `ATTACKS`, 7. `entities/Enemy.ts`, 8. `systems/EnemySystem.ts`, 9. `systems/TowerSystem.ts` payload line, 10. `enemyMarks.ts`, 11. `towerLook.ts` + `barrels.ts`, 12. `Sfx.ts`, `DraftScene.ts`, `runChecks.ts`, 13. tests, 14. `npm run check`. No changes to GameScene, HudScene, main.ts, RunFlow or Building: the tick lives in `EnemySystem.update` (after `advance`, skip leaked; `if (e.hit(damage, false)) this.kill(e)`), the whoosh in `strike` (`if (payload.burn && e.ignite(payload.burn.dps, payload.burn.sec)) this.sfx?.ignite()`), and every attack already flows through `strike`/`hit` so Bolt's volley, Splash's burst and pulse all ignite via the shared payload.

### Pitfalls
- White flash: a burn tick every frame must not call the flashing `hit()` — pass `flash = false`, or burning enemies sit permanently white.
- Pooling: reset `burn` in `spawn()`; the killing tick must go through the one extracted `kill()` (gold pop at the death spot, `addKill`, `enemiesKilled`, `sfx.kill`, `despawn`) — never a second kill path. Mint (T0021) will hook exactly this function: if it lands first, extract `kill()` around its lines.
- Barrel textures are cached by key — `emberTicks` and `emberMuzzle` must be in the key or old textures get reused without ticks. Never rotate anything else; ticks are painted into the (rotating) barrel like Rapid's bands.
- Refresh, don't add: `ignite` sets `left = sec` and `dps = max`; a tower with several Embers uses the strongest only (two Commons never make 6/s).
- Content bar: `asTower` is ≤ 56 chars — the task's "Sets ablaze the enemy furthest along: …" is 59; use the shorter "the furthest enemy" wording (53) for card and panel.
- `first.damage` is 0: `tests/content.test.ts` line 39 needs `|| a.first.burn`, and the opening draft needs `opening: true` (don't edit `rollOffer`).
- Look: color stays `orange` (unused by any augment); if a parallel task has already taken the (circle, orange) pair in `content/augments/`, take the next shape whose (shape, orange) pair is free.
- dt-based tick (`burnTick` = rate × active seconds); GameScene already clamps dt. Projectile payloads are shared references — read-only, never mutate `payload.burn`.

### Tests
`tests/core/ember.test.ts` (pure, like `mark.test.ts`): Ember spec (`kind: 'burn'`, `damage: 0`, `burn {dps 3, sec 3}`, `rate ≈ 1/1.5`); burn total over life per tier (loop `burnTick` 0.5 s: ≈ 9/12/15); re-ignition refresh + higher rate, never additive (Common-over-Rare keeps 4/s); tier specs rare/epic first **and** added; strongest-of-tower (Bolt+Ember+Ember stays 3/s); added form through a Bolt tower (`kind: 'shot'` + `burn` set); card lines per tier (`tierTowerLine`/`tierAddedLine`) and panel lines (`describeSpec`); Ember offerable in the opening draft. Mark's +25% on ticks and the killing tick's kill credit are by construction (ticks go through `Enemy.hit()`'s one mark gate and the one `kill()` path) — covered by the browser smoke, not unit-testable without Phaser.

## Result (attempt 1, desktop)

Added Ember, the first damage-over-time augment: a pool card (circle/orange, opening-eligible, 3/4/5 per second for 3 s by tier) whose first form ignites the furthest enemy in range every 1.5 s and whose added form sets ablaze every hit. The burn ticks through the enemies' single hit/kill path (marked enemies take +25% from ticks; the killing tick is a normal kill for the tower that lit the burn, paying its Mints), re-ignition refreshes duration and keeps the higher rate, and it reads from the board via an orbiting orange dash, a muzzle dot, and orange barrel ticks. New pure rules in core/burn.ts with spec tests; smoke passes on desktop and mobile.

- Self-review: APPROVE
- Time: 27.9 min
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/art/barrels.ts        |  21 ++++-
 projects/chokepoint/game/src/audio/Sfx.ts          |   5 +
 .../chokepoint/game/src/content/augments/ember.ts  |  22 +++++
 .../chokepoint/game/src/content/augments/index.ts  |   2 +
 projects/chokepoint/game/src/content/types.ts      |  16 +++-
 projects/chokepoint/game/src/core/augments.ts      |  23 ++++-
 projects/chokepoint/game/src/core/burn.ts          |  31 ++++++
 projects/chokepoint/game/src/core/tiers.ts         |   6 +-
 projects/chokepoint/game/src/debug/runChecks.ts    |   1 +
 projects/chokepoint/game/src/entities/Enemy.ts     |  27 +++++-
 projects/chokepoint/game/src/entities/towerLook.ts |   8 +-
 .../chokepoint/game/src/systems/EnemySystem.ts     |  41 +++++++-
 .../chokepoint/game/src/systems/TowerSystem.ts     |   5 +-
 .../chokepoint/game/src/systems/attacks/burn.ts    |  14 +++
 .../chokepoint/game/src/systems/attacks/index.ts   |   2 +
 projects/chokepoint/game/src/systems/enemyMarks.ts |   8 ++
 projects/chokepoint/game/tests/content.test.ts     |   3 +-
 projects/chokepoint/game/tests/core/ember.test.ts  | 105 +++++++++++++++++++++
 18 files changed, 322 insertions(+), 18 deletions(-)
```
