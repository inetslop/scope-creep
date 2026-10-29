---
id: T0085
title: "The name tag: a new enemy says its name once"
assignee: desktop
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T23:26:44Z
claimed_at: 2026-10-29T01:18:13Z
---

## Goal
A shape's name is learned the moment it first matters: the first time an enemy type appears in a run, a small white label with its name pops up where it appears.

## Details
- When an enemy type spawns for the first time in a run, a small white rounded label with the enemy's name (the same name its content uses: "Sprinter", "Hauler", …) pops up above the spot where it appeared: ~200 ms scale-in, ~700 ms hold, fade — gone in about 1 s (the clean chip's (T0005) motion family, small).
- The label stays at the spot it appeared at (the enemy walks on, the label fades in place — the gold pop's (T0017) family, not a follower).
- Style: one line of bold ~12 px muted ink on a white rounded chip — the HUD card language at the banner's (T0067) scale, small.
- The second and later appearances of the same type in the run show nothing. The "seen" set resets on a new run and on a resumed run (it is a display state, not part of the save).
- No sound, no input, no rule change, no new HUD element in the card layout.
- Closest example: the enemy-hook pattern of T0059's `burnLeap.ts` (one new hook file, one line of registration, effects outside the hub files per 1f3a65f) for where it triggers — at spawn, once per type per run; T0005's clean chip for the pop motion; T0017's gold pop for the label's painter style.

## Acceptance criteria
- [ ] The first Dot of a run gets a "Dot" label above its spawn spot for ~1 s; the second Dot gets nothing.
- [ ] Every enemy type shows its own correct name on its first appearance in a run (a test covers each of the landed types with a fresh seen set).
- [ ] A resumed run: the seen set is empty, so the first spawned enemy of the resumed wave gets its label again.
- [ ] No sound and no new input; desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, desktop)

### Files
- create `src/systems/fx/nameLabel.ts` - the white name chip effect (model: `src/systems/fx/comboGold.ts` for the style, `FxSystem.cleanChip` for the pop motion)
- create `src/systems/enemyHooks/nameTag.ts` - the hook: first spawn of a type per run pops the label (model: `src/systems/enemyHooks/burnLeap.ts` for the serial mark)
- edit `src/systems/enemyHooks/index.ts` - one import line + one registry line for `nameTag`
- create `tests/systems/nameTag.test.ts` - unit test (model: `tests/systems/enemyHooks.test.ts` fake-context pattern)

### Interfaces
No new types. New exports, exactly:

```ts
// src/systems/fx/nameLabel.ts
import { DEPTH } from '../../config';
import { PALETTE, cssColor } from '../../content/palette';
import type { FxSystem } from '../FxSystem';

export function nameLabel(fx: FxSystem, x: number, y: number, name: string): void {
  if (fx.full) return;
  const label = fx.scene.add.text(0, -1, name, {
    fontFamily: 'ui-rounded, "SF Pro Rounded", "Nunito", "Varela Round", "Segoe UI", system-ui, "Helvetica Neue", Arial, sans-serif',
    fontSize: '12px',
    fontStyle: 'bold',
    color: cssColor(PALETTE.muted),
    resolution: 1 / fx.scene.scale.zoom,
  });
  label.setOrigin(0.5);
  const g = fx.scene.add.graphics();
  const w = label.width + 14;
  g.fillStyle(PALETTE.cardDeep, 1);
  g.fillRoundedRect(-w / 2, -8, w, 20, 10); // side face
  g.fillStyle(PALETTE.card, 1);
  g.fillRoundedRect(-w / 2, -11, w, 20, 10); // chip body
  const chip = fx.scene.add.container(x, y - 30, [g, label]);
  chip.setDepth(DEPTH.fx).setScale(0);
  fx.scene.tweens.add({ targets: chip, scale: 1, duration: 200, ease: 'Back.easeOut' });
  fx.track(chip, 100, { alpha: 0, delay: 900, ease: 'Quad.easeIn' }); // gone in ~1 s
}
```
Add the comment block from `comboGold.ts:7-9` (why the style is repeated inline instead of importing `ui/text.ts`).

```ts
// src/systems/enemyHooks/nameTag.ts
import type { Enemy } from '../../entities/Enemy';
import { nameLabel } from '../fx/nameLabel';
import type { MakeEnemyHook } from './hook';

export const nameTag: MakeEnemyHook = ({ enemies, fx }) => {
  const seenTypes = new Set<string>();
  // The pool is reused: a new serial on a pooled enemy is a new spawn (the same mark as burnLeap's).
  const spawnSerial = new WeakMap<Enemy, number>();
  return {
    update(_dt: number) {
      for (const e of enemies.all) {
        if (!e.active || spawnSerial.get(e) === e.serial) continue;
        spawnSerial.set(e, e.serial);
        if (seenTypes.has(e.def.id)) continue;
        seenTypes.add(e.def.id);
        nameLabel(fx, e.x, e.y, e.def.name);
      }
    },
  };
};
```

### Steps
1. Create `nameLabel.ts` exactly as above.
2. Create `nameTag.ts` exactly as above.
3. In `src/systems/enemyHooks/index.ts`: add `import { nameTag } from './nameTag';` after the `mintRing` import, and add `nameTag,` to `ENEMY_HOOKS` after the `split,` line (it reacts to spawns; next to its kin). Nothing else in the file changes.
4. Create `tests/systems/nameTag.test.ts`: fake context with `enemies: { all }` (plain objects `{ active: true, serial: n, def, x: 100, y: 200 }`) and `fx` stubbed as `{ full: false, scene: { add: { text: (_x, _y, s) => { names.push(s); return { width: s.length * 7, setOrigin() {} }; }, graphics: () => ({ fillStyle: () => ({ fillRoundedRect() {} }) }), container: () => ({ setDepth: () => ({ setScale() {} }) }) }, tweens: { add() {} } }, track() {} }`, cast `as unknown as EnemyHookContext`. Test 1: for each `def` of `ENEMIES` (`src/content/enemies`) make a fresh `nameTag(ctx)`, push one active enemy, `hook.update?.(1 / 60)` → expect `names` `toEqual([def.name])`; push a second enemy AND bump the first's `serial`, update again → still `[def.name]`. Test 2: fresh context, `nameTag(ctx)` labels a spawn, then a second `nameTag(ctx)` (a new run = new hook, empty seen set) labels a same-type spawn again → `[def.name, def.name]`.
5. Run `npm run check` and `npm run smoke`.

### Pitfalls
- Never import `ui/text.ts` (or anything in `ui/`) in `nameLabel.ts`: it drags in `debug/flags.ts`, which reads `window` at load and breaks the Node unit tests — that is why `comboGold.ts` repeats the style inline; copy it verbatim.
- The label is a static board container at the spawn spot — never a child of the enemy and never repositioned (the enemy walks on, the label fades in place).
- Pooling: key the spawn mark by `e.serial` in a `WeakMap`, like `burnLeap.ts` — a bare `Set<Enemy>` would suppress the label of a recycled enemy.
- Keep marking the type as seen even when `fx.full` skips the chip (the cap suppresses the display, not the "seen" state).
- `update()` already runs after `waves.update` spawns and after enemies advanced in `RunFlow.update`, so the spot is the spawn spot within one frame's walk (~2 units); do not try to recover the pre-advance position.
- All cleanup is via `fx.track` (destroys the container and its children on complete) — no timers, no listeners, nothing to remove on shutdown.

### Tests
- `tests/systems/nameTag.test.ts` as specified in Step 4 (the acceptance criteria require per-type coverage with a fresh seen set).
