---
id: T0399
title: The Bulwark says which way is armored
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-02T03:05:38Z
---

## Goal
The Bulwark's plate halves shots from the front and lets the back go through — but the token only shows a plate, not the rule. A first-time player wastes damage on the face without knowing it is directional. One quiet teach at the first Bulwark states the directional rule the look does not carry.

## Details
- Once per run, at the first Bulwark's spawn, one small muted line fades in just below the token for ~1.5 s and fades out: "front is halved" — the directional rule (front shots take half, back shots go full), which the plate's look does not state.
- It lands after the name tag's own ~1.5 s (T0085) so the two never overlap: the name chip is above the token, this line is a few px below it. Muted ink, the name tag's own small type. No sound, no new permanent mark — it fades and is gone.
- It reads the spawn the same way the name tag does (the once-per-type-per-run spawn hook, T0085's pattern): only the first Bulwark of the run shows it. A resumed run does not re-show it (the name tag's own once-per-run rule).
- No new key, button, HUD element or board mark; the pause screen is untouched.

## Acceptance criteria
- [ ] The first Bulwark to spawn in a run shows one muted "front is halved" line below it for ~1.5 s (after the name tag), then it is gone; later Bulwarks and the next run never show it
- [ ] The line sits below the token and does not overlap the name chip above it; it fits at 412x915 and 1280x720
- [ ] No sound, no persistent mark, no new key/button/HUD element; `npm run check` and the desktop + mobile smoke pass

## Design (architect, yoga)

### Files
- create `src/systems/fx/bulwarkTold.ts` - the teach chip: text "front is halved", the name-tag look (12px bold `PALETTE.muted` on a white rounded chip), placed below the token, life ~1.5 s. Model it on `src/systems/fx/leakCost.ts` (identical except position and text).
- create `src/systems/enemyHooks/bulwarkTeach.ts` - the once-per-run hook: at the first Bulwark's spawn, set `run.bulwarkTold` and show the chip after the name tag's ~1.5 s.
- edit `src/systems/enemyHooks/index.ts` - one import line (next to the `bulwarkPlate` import) and one entry `bulwarkTeach,` in `ENEMY_HOOKS` (next to `bulwarkPlate,`).
- edit `src/core/run.ts` - one field, next to `blockTold`.
- edit `src/core/saveRun.ts` - three spots, each next to `blockTold`: `SavedRun` field, the `loadSavedRun` type check, and the returned object.
- edit `src/systems/RunSave.ts` - two spots, each next to `blockTold`: `persist()` and `restore()`.
- edit `tests/core/saveRun.test.ts` - `bulwarkTold: false,` in `sample` (next to `blockTold`) + one round-trip test.

### Interfaces
```ts
// fx/bulwarkTold.ts  (model: fx/leakCost.ts)
export function bulwarkTold(fx: FxSystem, x: number, y: number): void;

// enemyHooks/bulwarkTeach.ts  (model: nameTag.ts spawn-read + blockTeach.ts run-gate)
export const bulwarkTeach: MakeEnemyHook;

// core/run.ts (RunState), next to: blockTold = false;
bulwarkTold = false; // the run's one Bulwark teach showed (T0399): the first spawn has paid

// core/saveRun.ts (SavedRun), next to: blockTold: boolean;
bulwarkTold: boolean; // the Bulwark's directional teach was shown; older saves predate the field
```

### Steps
1. `fx/bulwarkTold.ts`: copy `leakCost.ts` exactly; change the text to `'front is halved'` and the container to `fx.scene.add.container(x, y + 30, [g, label])` (below the token, mirroring the name chip's `y - 30`). Keep `if (fx.full) return;`, the chip graphics, `chip.setDepth(DEPTH.fx)`, the pop-in tween, and `fx.track(chip, 300, { alpha: 0, delay: 1000, ease: 'Quad.easeIn' })`.
2. `enemyHooks/bulwarkTeach.ts`:
```ts
import { bulwarkTold } from '../fx/bulwarkTold';
import type { MakeEnemyHook } from './hook';

const AFTER_NAME_MS = 1500; // the name tag's own ~1.5 s (T0085): the two never overlap

export const bulwarkTeach: MakeEnemyHook = ({ run, fx, enemies }) => ({
  update() {
    if (run.bulwarkTold) return; // the run's one teach is set: a resumed run never re-shows it
    for (const e of enemies.all) {
      if (!e.active || e.def.id !== 'bulwark') continue;
      run.bulwarkTold = true; // set before any chip, like the Block and Hauler teaches
      const x = e.x, y = e.y; // the spawn spot, stays put (the name chip's mark, not a follower)
      fx.scene.time.delayedCall(AFTER_NAME_MS, () => bulwarkTold(fx, x, y));
      return;
    }
  },
});
```
3. `index.ts`: `import { bulwarkTeach } from './bulwarkTeach';` after the `bulwarkPlate` import; `bulwarkTeach,` after `bulwarkPlate,` in the array.
4. `run.ts`: after `blockTold = false;` add `bulwarkTold = false; // the run's one Bulwark teach showed (T0399): the first spawn has paid`.
5. `saveRun.ts`: after the `blockTold` line in `SavedRun` add `bulwarkTold: boolean; // the Bulwark's directional teach was shown; older saves predate the field`; after the `blockTold` check add `if (p.bulwarkTold !== undefined && typeof p.bulwarkTold !== 'boolean') return undefined;`; after the `blockTold` line in the return add `bulwarkTold: p.bulwarkTold === true,`.
6. `RunSave.ts`: in `persist` after `blockTold: run.blockTold,` add `bulwarkTold: run.bulwarkTold,`; in `restore` after `run.blockTold = saved.blockTold;` add `run.bulwarkTold = saved.bulwarkTold;`.
7. `tests/core/saveRun.test.ts`: in `sample` add `bulwarkTold: false,` after `blockTold: false,`; then add a test mirroring the block-told one with `bulwarkTold` (`saveRun(store, sample({ bulwarkTold: true }))`, `delete without.bulwarkTold`, `broken({ bulwarkTold: 'x' })`).

### Pitfalls
- The chip is `fx.track`-ed (cleaned on fade), never a persistent board mark; guard `if (fx.full) return;`.
- Set `run.bulwarkTold = true` before the `delayedCall` so a save can't re-trigger it; a resumed run restores it true and never re-shows. A brand-new run starts `false` and shows again.
- The chip is `y + 30` (below) and the name chip is `y - 30` (above), and the 1.5 s delay means they read one after the other — no time or space overlap; both are board units (fit at 412x915 and 1280x720).
- `delayedCall` runs on scene time (pauses with the scene); capture `e.x/e.y` at spawn so the chip stays put (not a follower).
- The chip reads only `e.def.id/e.x/e.y` on a pooled enemy — no pooling changes.
- Omitting `bulwarkTold` from the test `sample` breaks the equal-object round-trip test.

### Tests
- `tests/core/saveRun.test.ts`: the `bulwarkTold` round-trip (saved-true loads true; absent key loads false; a string is broken).
