---
id: T0359
title: "The menu demo's far gate: the second entrance before the first run"
assignee: cachyos-x8664
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-01T12:52:50Z
claimed_at: 2026-11-01T12:59:57Z
finished_at: 2026-11-01T13:29:37Z
---

## Goal
The far gate's read (T0338) is seen before the first run: the menu's live demo plays on a road with two gates, and a third of its walkers come in through the far gate.

## Details
- The menu's live demo (MenuDemo's fixed road, the real planWave plan it already plays — T0049) gets a far gate partway down the road, drawn with the in-game far gate's look (T0338).
- The demo wave routes its walkers the way a real far-gate board does (T0338): a third of each non-boss wave's walkers spawn at the far gate and walk from there to the exit; the rest still spawn at the entrance. A boss demo wave sends none through the gate, as in a real run.
- Nothing else changes: the demo keeps its show behavior and its speed; no new HUD element, sound, or text. The demo board stays purely for show — never saved, never a run board.
- The gate and its walkers are visible without zoom at 412x915 and 1280x720.

## Acceptance criteria
- [ ] The menu demo shows a road with two gates (the entrance and the far gate), the far gate wearing the in-game far-gate look.
- [ ] A third of the demo wave's walkers spawn at the far gate and walk from there to the exit; the rest spawn at the entrance — the same split rule a real far-gate wave uses, and a boss demo wave sends none through the gate.
- [ ] The demo otherwise behaves as before: same speed and loop, no new sound, no new HUD element, and no board mark beyond the gate itself.
- [ ] A player with a fresh profile sees the far gate in the menu before their first run; at 412x915 and 1280x720 the gate is visible without zoom.

## Design (architect, desktop)

### Files
- edit `src/art/menu.ts` - pad the road texture on the left and bake in the entrance and far gate tokens
- edit `src/scenes/menu/MenuDemo.ts` - spawn a third of walkers at the far gate; offset all road-unit→screen math by the new pad
- edit `src/scenes/MenuScene.ts` - fit the wider road texture in the width cap (one line)

### Interfaces
```ts
// src/art/menu.ts (add; Point already imported)
export const MENU_ROAD_PAD = 28; // left of the road: the entrance gate's token and shadow (like the board's margin)
export const MENU_ROAD_TEX = { width: MENU_ROAD_SIZE.width + MENU_ROAD_PAD, height: MENU_ROAD_SIZE.height } as const;
export const MENU_FAR_GATE: Point = { x: 110, y: 53 }; // ~a third of the way in (road is 460 long)
export const MENU_FAR_GATE_DISTANCE = 153; // 110 along the first segment, then 96-53 up the second
// existing, unchanged: MENU_ROAD, MENU_ROAD_POINTS, MENU_ROAD_SIZE, paintMenuRoad
```

### Steps
1. `src/art/menu.ts`: change the paint import to `import { roundRectPath, setShadow } from './paint';`. Add the four constants above (after `MENU_ROAD_SIZE`). Add a module-private helper, copying the gate look from `art/board.ts` (`gate()` at line 67) in menu units (menu token 36 ≈ road width 34, as the board's 38.4 is to its 37.1 road):
```ts
function paintGate(ctx: CanvasRenderingContext2D, p: Point, dir: number): void {
  ctx.save();
  setShadow(ctx, 0.8);
  roundRectPath(ctx, p.x - 18, p.y - 18, 36, 36, 9.6);
  ctx.fillStyle = rgba(PALETTE.faint, 1);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(dir);
  ctx.beginPath();
  ctx.moveTo(-4.2, -7.2);
  ctx.lineTo(4.2, 0);
  ctx.lineTo(-4.2, 7.2);
  ctx.lineWidth = 4.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();
  ctx.restore();
}
```
2. In `paintMenuRoad`: pass `MENU_ROAD_TEX.width` instead of `MENU_ROAD_SIZE.width` to `paintTexture`, add `ctx.translate(MENU_ROAD_PAD, 0);` as the first line of the draw callback (inside its existing `ctx.save()`, before `setShadow`), and after `ctx.restore()` draw the two gates:
```ts
    const dirIn = Math.atan2(MENU_ROAD_POINTS[1]!.y - MENU_ROAD_POINTS[0]!.y, MENU_ROAD_POINTS[1]!.x - MENU_ROAD_POINTS[0]!.x);
    paintGate(ctx, MENU_ROAD_POINTS[0]!, dirIn);
    paintGate(ctx, MENU_FAR_GATE, -Math.PI / 2); // the road travels up here, toward the exit
```
3. `src/scenes/menu/MenuDemo.ts`: import `MENU_FAR_GATE_DISTANCE, MENU_ROAD_PAD` (add to the existing `art/menu` import line) and add `import { isFarGateSpawn } from '../../core/farGate';`. Add field `private showOut = 0;` next to `spawnIn`. In `layout()` set `this.origin = { x: cx - (MENU_ROAD_PAD + MENU_ROAD_SIZE.width / 2) * k, y: top };`. In `toScreen()` return `{ x: this.origin.x + (MENU_ROAD_PAD + x) * this.k, y: this.origin.y + y * this.k }`. Change `spawnDef` to `private spawnDef(def: EnemyDef, hp: number, distance = 0): void` and push `{ img, def, distance, hp, slowLeft: 0 }`.
4. In `spawnWave`'s while-loop, the existing `this.spawnDef(def, Math.max(1, ...))` call gets a third argument: `isFarGateSpawn(this.next, plan, true) ? MENU_FAR_GATE_DISTANCE : 0`. In the wave-0 free show `spawn()`, same third argument: `this.showOut++ % 3 === 2 ? MENU_FAR_GATE_DISTANCE : 0`. Update the class doc comment's first line to say a third of the walkers come in through the far gate.
5. `src/scenes/MenuScene.ts`: import `MENU_ROAD_TEX` next to `MENU_ROAD_SIZE`; change only the width cap to `const kMax = Math.min(1.4, (width - 24) / MENU_ROAD_TEX.width);`. Leave every `MENU_ROAD_SIZE.height` room check as is.
6. Run `npm run check` and `npm run smoke`.

### Pitfalls
- The pad must be applied in BOTH `layout()` (origin) and `toScreen()`, or towers and walkers sit 28·k px right of the road.
- The gates are baked into the road texture (canvas), like the board — never a Phaser image: the token carries a bottom shadow, and painted shading must never be rotated. Only the chevron is rotated, in canvas space.
- Do not add the gate to `this.parts`: it belongs under everything, on the road image (depth −1), exactly as on the board.
- `isFarGateSpawn` already encodes the whole rule (every 3rd spawn, ≥3 spawns, and never on a boss wave via `plan.number`) — use it, don't hand-roll a boss or modulo check.
- Keep `MENU_FAR_GATE_DISTANCE` in sync with `MENU_FAR_GATE` (110 + (96−53) = 153 along `MENU_ROAD_POINTS`); the comment says why.
- Demo stays for show: no run state, no new sound, no HUD, no new game objects; `DEMO.spawnEvery` and all timers are unchanged.
- `paintTexture` caches by key and the road is painted at boot via `PAINTERS` (`art/generate.ts`) — no registry change is needed.

### Tests
- none (no `src/core` rule is added or changed; `isFarGateSpawn` is already covered by `tests/core/farGate.test.ts`).

## Result (attempt 1, cachyos-x8664)

The menu demo road is now a two-gate road: `src/art/menu.ts` bakes both the entrance gate and a far gate partway down the road (a faint token with a white chevron in the road's travel, same look as the board's gates) into the road texture, widening the texture by `MENU_ROAD_PAD` so the entrance gate isn't clipped. `MenuDemo.ts` now sends a third of every non-boss wave's walkers in through the far gate and out the exit, using the real `isFarGateSpawn` rule (boss waves send none) plus a matching every-third free show before the first run. `MenuScene.ts` fits the wider texture in the width cap so the gates and walkers are visible without zoom at 412x915 and 1280x720. The demo keeps its show behavior, speed, and purely-for-show status; no new HUD, sound, or text. `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 29.7 min

```
projects/chokepoint/game/src/art/menu.ts           | 39 ++++++++++++++++++++--
 projects/chokepoint/game/src/scenes/MenuScene.ts   |  4 +--
 .../chokepoint/game/src/scenes/menu/MenuDemo.ts    | 25 ++++++++------
 3 files changed, 52 insertions(+), 16 deletions(-)
```
