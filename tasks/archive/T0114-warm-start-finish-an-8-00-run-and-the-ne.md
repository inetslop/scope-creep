---
id: T0114
title: "Warm Start — finish an 8:00+ run and the next run begins with one pick"
assignee: desktop-4070
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-27T13:48:11Z
claimed_at: 2026-10-27T14:45:26Z
finished_at: 2026-10-27T16:02:06Z
---

## Goal
The first concrete step of the studio meta-progression: after any run of 8:00+, the next run starts with one random upgrade level already applied — a returning player walks in with an edge, and a first-time player can read the loop on the menu.

## Details
- Earning it: the moment the game-over card lands, if the run's clock reached 8:00 (480 s — exactly 480.0 arms it), a "warm start" flag is set and persisted between sessions, exactly like the saved best score (same persistence idiom as `src/core/bestScore.ts`). A run under 8:00 neither arms nor consumes anything.
- Spending it: the player's next run start consumes the flag and applies exactly one level of one upgrade at run start: a uniformly random id from the same 16-card `UPGRADES` pool the level-up roll uses, at level 1, applied through the same path as a normal pick — so it counts toward the card's max level, composes with later picks of the same card, and may be a weapon card (starting a run with Line, Orbit, Arc or Counterpoint is legal and fun). The pick is drawn with the run's seeded RNG, so a fixed seed reproduces the whole run, warm start included.
- The menu teaches it: one small ink line under the start button in the Menu scene (`src/scenes/Menu.ts`), Bauhaus small caps in the menu's existing style — while the flag is armed, "WARM START READY — NEXT RUN BEGINS WITH ONE PICK"; while unarmed, "FINISH AN 8:00+ RUN TO EARN A WARM START".
- The run announces it: the moment the run starts, a "WARM START — <UPGRADE NAME>" note prints in small caps in the HUD using the boss-nameplate idiom (T0064), fading over 2 s, so the player sees exactly what they got.
- The pick is a normal pick: it appears in The Index (T0104) on the pause screen, and later picks of the same card level it as usual (the existing roll rule that never offers a maxed card keeps it within the card's maxLevel).
- No new input, no new scene, no new content file, no new sound; the run timer, the score and the game-over card are unchanged.

## Acceptance criteria
- [ ] A run of 480 s or more arms the flag the moment the game-over card lands, and the menu line under the start button reads "WARM START READY — NEXT RUN BEGINS WITH ONE PICK" — and still does after a page reload.
- [ ] The next run starts with exactly one level of one random upgrade already applied: the "WARM START — <NAME>" note prints in the HUD for 2 s at run start, and the pick appears in The Index on the pause screen.
- [ ] Picking the same card later in the run levels it normally, never above its maxLevel; the warm-start pick may be any of the 16 cards, including weapon cards.
- [ ] A run under 480 s does not arm the flag; an armed flag is consumed by the next run whatever that run's outcome; after spending it the menu line reverts to "FINISH AN 8:00+ RUN TO EARN A WARM START".
- [ ] The same seed reproduces the same warm-start pick, and the existing upgrade-roll, spawn and boss tests stay green.
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/core/warmStart.ts` — warm-start rule: 8:00 threshold, persisted flag, uniform pick (exact code below)
- create `tests/core/warmStart.test.ts` — unit tests (see Tests)
- edit `src/scenes/keys.ts` — add `warmStart` to `GAME_EVENTS`
- edit `src/scenes/GameScene.ts` — consume+apply in `create()`, arm in `endRun()`, emit HUD note, one invariant
- edit `src/scenes/HudScene.ts` — route the new event into the existing boss-nameplate
- edit `src/scenes/MenuScene.ts` — one ink line under the start prompt

### Interfaces
Exact content of the new `src/core/warmStart.ts` (pure TS; load/save copy the try/catch localStorage idiom from `src/core/bestScore.ts`; reuse `isUpgradeAvailable` from `src/core/upgrades.ts`):
```ts
import type { UpgradeDef } from '../content/types';
import type { Rng } from './rng';
import { isUpgradeAvailable } from './upgrades';

export const WARM_START_TIME_SEC = 480; // 8:00; exactly this value arms the flag
export const WARM_START_KEY = 'scope-creep.warm-start';

/** True when this run's clock earned the next run a warm start. */
export function isWarmStartEarned(timeSec: number): boolean { return timeSec >= WARM_START_TIME_SEC; }

/** Stored flag; false when absent or storage is blocked. '1' armed, '0' unarmed. */
export function loadWarmStart(): boolean {
  try { return localStorage.getItem(WARM_START_KEY) === '1'; } catch { return false; }
}
export function saveWarmStart(armed: boolean): void {
  try { localStorage.setItem(WARM_START_KEY, armed ? '1' : '0'); } catch { /* storage blocked */ }
}

/** Uniformly random card a fresh run can still take (all 16, weapon cards included), drawn from the run's seeded rng. */
export function drawWarmStartPick(rng: Rng, pool: readonly UpgradeDef[], levelOf: (id: string) => number, ownedWeapons: readonly string[]): UpgradeDef {
  const available = pool.filter((d) => isUpgradeAvailable(d, levelOf, ownedWeapons));
  return rng.pick(available.length > 0 ? available : pool);
}
```

### Steps
1. Create `src/core/warmStart.ts` (above).
2. Create `tests/core/warmStart.test.ts` (Tests), run `npm run test` — green before touching scenes.
3. `keys.ts`: in `GAME_EVENTS` add `warmStart: 'warm-start'` (comment: run started with a warm-start upgrade; payload: the full note text, string).
4. `GameScene.ts`:
   - imports: line 7 becomes `import { UPGRADES, UPGRADE_BY_ID } from '../content/upgrades';`; after the `../core/vec` import add `import { drawWarmStartPick, isWarmStartEarned, loadWarmStart, saveWarmStart } from '../core/warmStart';`
   - field next to `storedBest`: `private warmStartName = '';`
   - in `create()`, right after `this.storedBest = loadBestScore();`:
     ```ts
     this.warmStartName = '';
     if (loadWarmStart()) {
       saveWarmStart(false); // consumed by this run whatever its outcome
       const def = drawWarmStartPick(this.run.rng, UPGRADES, (id) => this.run.upgradeLevel(id), this.run.weapons);
       this.run.applyUpgrade(def);
       this.warmStartName = def.name;
       hook.stats.upgradesTaken += 1;
     }
     ```
   - immediately after `this.scene.launch(SCENES.hud);`: `if (this.warmStartName !== '') this.events.emit(GAME_EVENTS.warmStart, \`WARM START — ${this.warmStartName}\`);`
   - in `endRun()`'s 700 ms callback, just before `this.scene.start(SCENES.gameOver, summary)`: `if (isWarmStartEarned(this.run.timeSec)) saveWarmStart(true);`
   - in `registerInvariants()` after the 'upgrade-history' block: `hook.addInvariant('upgrade-levels', () => { for (const [id, level] of Object.entries(this.run.upgradeLevels)) { const def = UPGRADE_BY_ID.get(id); if (!def) return \`unknown upgrade ${id}\`; if (level < 1 || level > def.maxLevel) return \`${id} at level ${level}, max ${def.maxLevel}\`; } return null; });` and add `'upgrade-levels'` to the `INVARIANTS` array.
5. `HudScene.ts`: rename the `onBossNameplate` handler to `onNameplate` (body unchanged); register it on `GAME_EVENTS.warmStart` too; in the SHUTDOWN cleanup `off` it on both events. The plate already prints, positions and fades over 2 s — no other HUD changes.
6. `MenuScene.ts`: import `loadWarmStart`; after the hint text (line 49) add: `this.add.text(width / 2, height * 0.7, loadWarmStart() ? 'WARM START READY — NEXT RUN BEGINS WITH ONE PICK' : 'FINISH AN 8:00+ RUN TO EARN A WARM START', textStyle(Math.min(16, short * 0.032), PALETTE.ink)).setOrigin(0.5);`
7. `npm run check`, then `npm run smoke`.

### Pitfalls
- Copy the strings verbatim: em dash '—' and '8:00+' (acceptance text is matched exactly).
- The flag is consumed at run START (`create()`), not at death; re-armed only in `endRun()` at `timeSec >= 480`. A short run that started armed stays spent; a 480 s+ run re-arms even if it started armed.
- Draw the pick with `this.run.rng`, never `Math.random()` — same seed must reproduce the same pick (it also deterministically shifts the rest of the run).
- Emit the note only AFTER `scene.launch(SCENES.hud)` — the launch is synchronous, but emitting before it means no listener and the note never prints.
- The new HUD listener must be removed on HudScene SHUTDOWN, and 'upgrade-levels' must be in `INVARIANTS`, or both leak across scene restarts.
- Keep the menu line at `height * 0.7`: below ~0.74 it collides with the decorative triangle at (0.82w, 0.8h) at 412x915.
- No new card, scene, input or sound: the pick reuses `UPGRADES` + `applyUpgrade`, so it counts toward maxLevel, later rolls still exclude maxed cards, and the pick shows in the pause PICKS column for free.
- `GameScene.ts` is also touched by open T0100/T0111/T0109/T0110 — keep your edits to the exact spots above so merges stay clean.

### Tests
`tests/core/warmStart.test.ts` (model on `tests/core/upgrades.test.ts`; node env — never call load/save):
- `isWarmStartEarned`: false at 479.999, true at exactly 480 and at 480+; `WARM_START_TIME_SEC === 480`.
- `drawWarmStartPick`: `new Rng(7)` twice gives the same id; with 'rhythm' maxed (apply it 5× into a fresh `RunState`) it is never returned across 200 seeds; across 4000 seeds the distinct ids seen equal `UPGRADES.length` (all 16 reachable, weapon cards included).

## Result (attempt 1, desktop-4070)

T0114 Warm Start implemented per the design: new `src/core/warmStart.ts` holds the 8:00 threshold (480 s exactly), the persisted '1'/'0' flag using the same try/catch localStorage idiom as bestScore, and a uniform pick drawn through the run's seeded rng from the full 16-card pool filtered to what a fresh run can still take. GameScene consumes the flag at run START in `create()` — one level of one card applied via the normal `applyUpgrade` path (so it shows in The Index and later picks respect maxLevel), re-armed only in `endRun()` when the game-over card lands with the clock at 8:00+ — and emits the "WARM START — <UPGRADE NAME>" note after the HUD is launched. The HudScene nameplate handler (now registered for both boss-nameplate and warm-start, both removed on shutdown) prints the note with the same 2 s fade, MenuScene shows the exact armed/unarmed ink line at 70% height, and an `upgrade-levels` invariant was registered and listed in INVARIANTS. Four unit tests were added (reproducible pick for a fixed seed, maxed cards never offered, all 16 cards reachable including weapon cards, arming boundary); `npm run check` (typecheck + lint + 245 tests) and `npm run smoke` (real-browser desktop + phone) both pass with no checks weakened and no deviation from the design.

- Self-review: APPROVE
- Time: 76.7 min
- Self-review made fixes (kept; checks pass).

```
game/src/core/warmStart.ts        | 23 +++++++++++++++++++++
 game/src/scenes/GameScene.ts      | 31 +++++++++++++++++++++++++++--
 game/src/scenes/HudScene.ts       | 10 ++++++----
 game/src/scenes/MenuScene.ts      |  2 ++
 game/src/scenes/keys.ts           |  2 ++
 game/tests/core/warmStart.test.ts | 42 +++++++++++++++++++++++++++++++++++++++
 6 files changed, 104 insertions(+), 6 deletions(-)
```
