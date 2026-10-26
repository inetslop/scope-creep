---
id: T0027
title: "Marginalia: first-encounter annotations"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-26T20:55:07Z
claimed_at: 2026-10-26T21:08:49Z
finished_at: 2026-10-26T21:18:58Z
---

## Goal
When an enemy type appears in a run for the first time, a small dry ink annotation fades in beside it for 2 s — the page teaches you what each shape is, in the game's art-school voice.

## Details
- The first time an enemy of a given type spawns in a run, a small all-caps ink text label appears just above that enemy (~24 units above its center), follows the enemy, and is clamped so the text stays inside the arena.
- The label fades in over 200 ms, holds, and fades out over the last 500 ms of its 2 s lifetime. If the enemy dies before 2 s, the label dies with it.
- Style: small (~13 px, the same clean geometric type as the HUD), ink color, no background box — like a dry handwritten note on the paper. No sound.
- One label per enemy type per run; if two new types appear close together, both labels show at once.
- Notes per enemy:
  - Wedge: "RED RUSHES"
  - Dart: "BLACK AND QUICK"
  - Block: "HEAVY HITS HARD"
  - Hex: "GREEN CLOSING IN"
  - Mote: "THEY COME IN FLOCKS"
  - Sentry: "THE PENTAGON SHOTS"
  - Splitter: "IT SPLITS WHEN IT DIES"
  - Splinter: "BORN ALREADY FAST"
  - Boulder: "SLOW BUT HEAVY"
  - Tile: "PLAIN AND PERSISTENT"
  - Slab: "A WALL THAT CRAWLS"
- Enemies added later without a note get the fallback "IT'S NEW."

## Acceptance criteria
- [ ] In a fresh run, the first Wedge to spawn shows "RED RUSHES" above it for ~2 s; later Wedges show nothing
- [ ] The first Sentry shows "THE PENTAGON SHOTS" and the first Slab shows "A WALL THAT CRAWLS"
- [ ] The label is small ink text with no background box, follows its enemy, stays inside the arena, and disappears if the enemy dies early
- [ ] At most one label per enemy type per run; works on desktop and mobile
- [ ] `npm run check` and `npm run smoke` pass

## Design (architect, desktop)

### Files
- create `src/systems/Marginalia.ts` - pooled ink labels for first-encounter notes (full code below)
- edit `src/core/run.ts` - add `seenEnemyIds` set + `firstSighting()`
- edit `src/content/types.ts` - add optional `note` to `EnemyDef`
- edit `src/content/enemies/{wedge,dart,block,hex,mote,sentry,splitter,splinter,boulder,tile,slab}.ts` - add `note` after `name`
- edit `src/systems/SpawnSystem.ts` - accept Marginalia, flag first sightings in `spawn()`
- edit `src/scenes/GameScene.ts` - construct/update/pin Marginalia, register invariant
- edit `tests/core/core.test.ts`, `tests/content.test.ts`, `docs/ARCHITECTURE.md` - see Steps

### Interfaces
```ts
// content/types.ts, in EnemyDef after `name`:
note?: string; // first-encounter annotation (all caps); omit for the "IT'S NEW." fallback

// core/run.ts, in RunState:
firstSighting(id: string): boolean; // true exactly once per id per run

// systems/Marginalia.ts (new):
constructor(scene: Phaser.Scene, bounds: Phaser.Geom.Rectangle);
readonly activeCount: number;
note(enemy: Enemy, def: EnemyDef): void;  // show the note above enemy
update(dt: number): void;                 // age labels; a label dies with its enemy
pin(): void;                              // place above enemy, clamped to arena (call in POST_UPDATE)

// systems/SpawnSystem.ts: new LAST constructor param `marginalia: Marginalia`
```

### Steps
1. `content/types.ts`: add `note?: string;` to `EnemyDef` after `name`.
2. In each of the 11 enemy files add `note: '…'` directly after `name: '…'`: wedge `'RED RUSHES'`, dart `'BLACK AND QUICK'`, block `'HEAVY HITS HARD'`, hex `'GREEN CLOSING IN'`, mote `'THEY COME IN FLOCKS'`, sentry `'THE PENTAGON SHOTS'`, splitter `'IT SPLITS WHEN IT DIES'`, splinter `'BORN ALREADY FAST'`, boulder `'SLOW BUT HEAVY'`, tile `'PLAIN AND PERSISTENT'`, slab `'A WALL THAT CRAWLS'`.
3. `core/run.ts`: after `upgradeLevel()` add `private readonly seenEnemyIds = new Set<string>();` and
```ts
firstSighting(id: string): boolean {
  if (this.seenEnemyIds.has(id)) return false;
  this.seenEnemyIds.add(id);
  return true;
}
```
4. Create `src/systems/Marginalia.ts` exactly:
```ts
import Phaser from 'phaser';
import { DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import type { EnemyDef } from '../content/types';
import type { Enemy } from '../entities/Enemy';
import { textStyle } from '../ui/text';

const MAX_LABELS = 16;
const LIFE = 2;
const FADE_IN = 0.2;
const FADE_OUT = 0.5;
const OFFSET = 24;
const MARGIN = 8;
const FALLBACK_NOTE = "IT'S NEW.";

interface Label { text: Phaser.GameObjects.Text; enemy: Enemy | null; age: number; }

/** First-encounter annotations: one small ink note per enemy type per run, 2 s lifetime. Cosmetic only. */
export class Marginalia {
  private readonly scene: Phaser.Scene;
  private readonly bounds: Phaser.Geom.Rectangle;
  private readonly labels: Label[] = [];
  private readonly pool: Phaser.GameObjects.Text[] = [];

  constructor(scene: Phaser.Scene, bounds: Phaser.Geom.Rectangle) { this.scene = scene; this.bounds = bounds; }

  get activeCount(): number { return this.labels.length; }

  /** Shows the note for `def` above `enemy`. Call only for a first sighting this run. */
  note(enemy: Enemy, def: EnemyDef): void {
    let i = this.pool.findIndex((t) => !t.active);
    if (i === -1) {
      if (this.pool.length >= MAX_LABELS) return;
      i = this.pool.length;
      this.pool.push(this.scene.add.text(0, 0, '', textStyle(13, PALETTE.ink)).setOrigin(0.5).setDepth(DEPTH.fx));
    }
    const t = this.pool[i];
    t.setText(def.note ?? FALLBACK_NOTE);
    t.setAlpha(0).setActive(true).setVisible(true);
    const label = { text: t, enemy, age: 0 };
    this.labels.push(label);
    this.pinLabel(label);
  }

  /** Ages labels (fade in 200 ms, hold, fade out the last 500 ms); a label dies with its enemy. */
  update(dt: number): void {
    for (let i = this.labels.length - 1; i >= 0; i--) {
      const l = this.labels[i];
      l.age += dt;
      if (!l.enemy || !l.enemy.active || l.age >= LIFE) { this.despawn(i); continue; }
      l.text.setAlpha(l.age < FADE_IN ? l.age / FADE_IN : l.age > LIFE - FADE_OUT ? (LIFE - l.age) / FADE_OUT : 1);
    }
  }

  /** Places each label ~24 units above its enemy, clamped inside the arena. Call in POST_UPDATE. */
  pin(): void { for (const l of this.labels) this.pinLabel(l); }

  private pinLabel(l: Label): void {
    if (!l.enemy || !l.enemy.active) return;
    const t = l.text;
    t.setPosition(
      Phaser.Math.Clamp(l.enemy.x, this.bounds.left + t.width / 2 + MARGIN, this.bounds.right - t.width / 2 - MARGIN),
      Phaser.Math.Clamp(l.enemy.y - OFFSET, this.bounds.top + t.height / 2 + MARGIN, this.bounds.bottom - t.height / 2 + MARGIN),
    );
  }

  private despawn(i: number): void {
    const l = this.labels[i];
    l.enemy = null;
    l.text.setActive(false).setVisible(false);
    this.labels.splice(i, 1);
  }
}
```
5. `SpawnSystem.ts`: `import { Marginalia } from './Marginalia';`; add `private readonly marginalia: Marginalia;`; add it as the last constructor param and assign; in `spawn()`, after the `enemy.spawn(...)` line add `if (this.run.firstSighting(def.id)) this.marginalia.note(enemy, def);`
6. `GameScene.ts`: add `private marginalia!: Marginalia;` (import between DamageNumbers and FxSystem); in `create()` add `this.marginalia = new Marginalia(this, this.bounds);` after the damageNumbers line and pass `this.marginalia` as the last arg to `new SpawnSystem(...)`; in `update()` add `this.marginalia.update(dt);` right after `this.spawns.update(dt);`; in `onPostUpdate` add `this.marginalia.pin();` after `this.orbit.pinToPlayer();`; in `registerInvariants()` add `hook.addInvariant('marginalia-labels', () => (this.marginalia.activeCount <= 16 ? null : `${this.marginalia.activeCount} marginalia labels active`));` and append `'marginalia-labels'` to the `INVARIANTS` array.
7. `docs/ARCHITECTURE.md`: append to frame-list item 5: " `Marginalia.update` ages first-encounter notes (one ink label per enemy type per run, pinned in POST_UPDATE)."
8. Add the tests below, then run `npm run check` and `npm run smoke`.

### Pitfalls
- T0005 (in progress) also edits `SpawnSystem.ts`: keep your change to exactly import + constructor param + one line in `spawn()` so the merge is trivial.
- Pin in `POST_UPDATE`, not in `update()`: physics writes body positions back to sprites in POST_UPDATE; pinning earlier makes the label trail its enemy by a frame (same reason the barrel and orbit circles are pinned there).
- Call `firstSighting` only after the `if (!enemy) return null;` guard so a pool-exhausted spawn doesn't burn the type's one label.
- Null `l.enemy` in `despawn()`: enemies are pooled and reused — a stale reference would pin the label to a different enemy.
- No tweens for the fade: manual alpha in `update(dt)` stops when the scene pauses and obeys the dt rule.
- The label is world-space (like DamageNumbers): the 13 px font scales with camera zoom; do not put it in HudScene.

### Tests
- `tests/core/core.test.ts`, in `describe('RunState')`:
```ts
it('reports each enemy id as a first sighting exactly once', () => {
  const run = new RunState(1);
  expect(run.firstSighting('wedge')).toBe(true);
  expect(run.firstSighting('wedge')).toBe(false);
  expect(run.firstSighting('dart')).toBe(true);
});
```
- `tests/content.test.ts`, in `describe('enemies')`:
```ts
it.each(ENEMIES.map((e) => [e.id, e] as const))('%s note is non-empty all-caps when present', (_id, e) => {
  if (e.note === undefined) return;
  expect(e.note.length > 0 && e.note === e.note.toUpperCase(), 'note must be non-empty all-caps').toBe(true);
});
```

## Result (attempt 1, desktop)

Added first-encounter marginalia: each enemy type now carries an all-caps `note` in its content file, `RunState.firstSighting()` tracks seen ids per run, and a new pooled `Marginalia` system shows a small ink label above the first enemy of each type for 2 s (fade in 200 ms / fade out 500 ms, arena-clamped, dies with its enemy), wired into `SpawnSystem` and `GameScene` with a `marginalia-labels` invariant. Also added unit tests for `firstSighting` and note validation, and a line in `docs/ARCHITECTURE.md`. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 10.2 min
- Self-review made fixes (kept; checks pass).

```
game/docs/ARCHITECTURE.md            |  2 +-
 game/src/content/enemies/block.ts    |  1 +
 game/src/content/enemies/boulder.ts  |  1 +
 game/src/content/enemies/dart.ts     |  1 +
 game/src/content/enemies/hex.ts      |  1 +
 game/src/content/enemies/mote.ts     |  1 +
 game/src/content/enemies/sentry.ts   |  1 +
 game/src/content/enemies/slab.ts     |  1 +
 game/src/content/enemies/splinter.ts |  1 +
 game/src/content/enemies/splitter.ts |  1 +
 game/src/content/enemies/tile.ts     |  1 +
 game/src/content/enemies/wedge.ts    |  1 +
 game/src/content/types.ts            |  2 +
 game/src/core/run.ts                 |  9 +++++
 game/src/scenes/GameScene.ts         | 10 ++++-
 game/src/systems/Marginalia.ts       | 74 ++++++++++++++++++++++++++++++++++++
 game/src/systems/SpawnSystem.ts      |  6 ++-
 game/tests/content.test.ts           |  5 +++
 game/tests/core/core.test.ts         |  7 ++++
 19 files changed, 122 insertions(+), 4 deletions(-)
```
