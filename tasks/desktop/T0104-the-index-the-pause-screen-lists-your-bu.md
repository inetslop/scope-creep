---
id: T0104
title: The Index — the pause screen lists your build
assignee: desktop
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T11:11:53Z
---

## Goal
When you pause, you can read your run back: the pause screen lists every upgrade you picked this run in a narrow ink column, so a 16-pick build is legible at a glance instead of remembered. "Every level-up is a decision" only lands if the build you made is visible.

## Details
- Pause screen only — no in-game HUD element, no new key or button, no new sound.
- A narrow ink column set in the same small-caps ink type as the existing pause text, with a small "PICKS" header above the first line. Placed beside the existing pause content — to its right in landscape (1280×720), below it in portrait (412×915) — never overlapping the resume/quit controls, with at least 12 units of paper margin around it.
- One line per distinct upgrade picked this run (weapon cards included — Line, Orbit, Arc and Counterpoint are single-level entries). Pips: one small flat square per level, tinted in that upgrade's card color (the same color its level-up card shows), flat squares not circles.
- Order: most recently picked first — the decision you just made sits at the top of the column.
- Bounded by the pool: at most 16 lines, and a line's pips never exceed that upgrade's max level — the whole column always fits 412×915 and 1280×720 with no scroll and no clipping.
- Empty state: before the run's first level-up the column shows one dry line instead of entries: "NOTHING PICKED YET".
- Data: read from the run's existing ordered upgrade-pick record (the same record the stat pipeline and the level-up flow already use). No new tracking, nothing stored between runs. If a read-only accessor for the pick record is missing, add one.

## Acceptance criteria
- [ ] Pick Rhythm twice and Weight once in a run, then pause: the column shows exactly two lines — "RHYTHM" with 2 pips and "WEIGHT" with 1 pip — most recently picked on top, pips in the two card colors.
- [ ] Pausing before the run's first level-up shows the single line "NOTHING PICKED YET" in the same column position.
- [ ] Weapon cards appear as single lines with 1 pip (picking the Orbit card adds one "ORBIT" line); a weapon is maxed after one pick and is never offered again.
- [ ] A maximal build (16 distinct upgrades, each at its max level) fits fully in both 412×915 portrait and 1280×720 landscape — no scroll, no clipped lines — and no line ever shows more pips than that upgrade's max level.
- [ ] The list is per-run: empty at the start of a new run, never carried over from a previous one; resume, quit and every other pause-screen element behave exactly as before.

## Design (architect, desktop)

### Files
- edit `src/scenes/PauseScene.ts` — the only change: draw the "PICKS" column in `create()` from the run's existing pick record. No core/content/system files touched; no new listeners, sounds, or keys.

### Interfaces
- No new types or signatures. Uses existing: `getRun(scene)` (`scenes/keys.ts`), `run.upgradeHistory: readonly string[]` (oldest→newest picks), `run.upgradeLevel(id)`, `UPGRADE_BY_ID: ReadonlyMap<string, UpgradeDef>`, `UpgradeDef.name/.maxLevel/.color` (`color` is exactly what the level-up card shows).

### Steps
1. In `src/scenes/PauseScene.ts`, set imports (alphabetical by path, `type` for the def):
   `import type { UpgradeDef } from '../content/types';`
   `import { UPGRADE_BY_ID } from '../content/upgrades';`
   change `import { titleStyle } from '../ui/text';` → `import { textStyle, titleStyle } from '../ui/text';`
   change `import { onResize, SCENES } from './keys';` → `import { getRun, onResize, SCENES } from './keys';`
2. As the last statement of `create()`, add: `this.buildPicksColumn(width, height);` (existing `width`/`height` consts are already there). Do not alter the PAUSED/Resume/Quit lines at all.
3. Add this private method:
```ts
  /** The run's build in a narrow ink column: one line per distinct upgrade, most recently picked first. */
  private buildPicksColumn(width: number, height: number): void {
    const run = getRun(this);
    const COL_W = 200, PIP = 8, PIP_GAP = 4, HEADER_H = 16, HEADER_GAP = 8, MAX_ROWS = 16;
    const rows: { def: UpgradeDef; index: number }[] = [];
    run.upgradeHistory.forEach((id, i) => {
      const def = UPGRADE_BY_ID.get(id);
      if (!def) return;
      const existing = rows.find((r) => r.def.id === id);
      if (existing) existing.index = i; // keep the LAST index: the decision you just made sorts to the top
      else rows.push({ def, index: i });
    });
    rows.sort((a, b) => b.index - a.index);
    const picked = rows.slice(0, MAX_ROWS); // the pool bounds the column at 16 lines

    const horizontal = width >= 760; // same breakpoint as LevelUpScene
    const top = horizontal ? 12 : height * 0.52 + 70 + 26 + 12; // portrait: below Quit (52 px tall) + 12 paper margin
    const bottom = height - 12;
    const centerX = horizontal ? width / 2 + 110 + 28 + COL_W / 2 : width / 2; // landscape: 28 right of the centered 220 px buttons
    const rowH = Math.max(0, Math.min(18, Math.floor((bottom - top - HEADER_H - HEADER_GAP) / MAX_ROWS)));
    const colH = HEADER_H + HEADER_GAP + rowH * MAX_ROWS; // always reserve the full band so the empty state sits in the same spot
    const colTop = (top + bottom - colH) / 2;
    const colLeft = centerX - COL_W / 2;
    const colRight = centerX + COL_W / 2;

    this.add.text(centerX, colTop, 'PICKS', textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5, 0);
    const firstRowY = colTop + HEADER_H + HEADER_GAP + rowH / 2;
    if (picked.length === 0) {
      this.add.text(colLeft, firstRowY, 'NOTHING PICKED YET', textStyle(13, PALETTE.inkSoft, { fontStyle: 'bold' })).setOrigin(0, 0.5);
      return;
    }
    const g = this.add.graphics();
    picked.forEach((r, i) => {
      const y = firstRowY + i * rowH;
      this.add.text(colLeft, y, r.def.name.toUpperCase(), textStyle(13, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
      const level = Math.min(run.upgradeLevel(r.def.id), r.def.maxLevel); // pips never exceed the card's max level
      for (let p = 0; p < level; p++) {
        const x = colRight - PIP / 2 - p * (PIP + PIP_GAP);
        g.fillStyle(r.def.color, 1);
        g.fillRect(x - PIP / 2, y - PIP / 2, PIP, PIP);
        g.lineStyle(1, PALETTE.ink, 1);
        g.strokeRect(x - PIP / 2, y - PIP / 2, PIP, PIP);
      }
    });
  }
```
4. Run `npm run check` and `npm run smoke`.

### Pitfalls
- Order is by LAST occurrence in `upgradeHistory` (history is oldest→newest), not first — that is what makes "the decision you just made" sit on top (R,W,R → RHYTHM above WEIGHT).
- Pips are flat `fillRect` squares with a 1px ink `strokeRect` in one `Graphics` object — not `drawShape()` (its offset shadow is noise at 8 px) and not circles. Tint = `def.color`, the same value `LevelUpScene.makeCard` paints, so the pip always matches the card.
- Weapons (`line`/`orbit`/`arc`, later `counterpoint`) are `maxLevel: 1` entries in `UPGRADES`, so they render as one 1-pip line automatically; "never offered again" is existing `isUpgradeAvailable` logic — don't touch it.
- Nothing is interactive in the column and nothing is added per-frame; `scene.stop()` destroys the texts/graphics on resume/quit, so there is no pooling or listener cleanup to do. Don't add an invariant — no new system, and the existing `upgrade-history` invariant already guards the record.
- Never scroll: if the band shrinks, `rowH` shrinks (16 lines always fit). Verified margins ≥12 at 412×915 (band 583.8..903 holds a 312 px column) and 1280×720 (column x 778..978, buttons end at 750). Ignore sub-340 px-tall landscape windows — not spec sizes.
- Per-run correctness comes for free: `RunState` is fresh per run and nothing is stored; a resize restart re-runs `create()` and rebuilds the column at the new size.

### Tests
- none (UI-only; no rule in src/core changes).
