---
id: T0055
title: "Working aura: the quiet ring under support towers when their aura works"
size: S
priority: 3
status: todo
depends_on: [T0039, T0054, T0027]
attempts: 0
created: 2026-10-28T13:04:03Z
epic: E4
---

## Goal
A tower that never fires gives no sign of life until something happens: a quiet ring at the base of a pure Anchor or pure Mint tower, each time its aura does its job, makes a tower that never fires visibly working.

## Details
- **The ring:** a thin rounded ring on the ground around the tower's base, in the tower's own color (a tower takes its first augment's color), growing from the plinth out to about a 1-cell radius and fading over ~1 s. Quiet: no sound, no glow, no screen effect.
- **When it plays:**
  - A tower whose first augment is Anchor: with each root pulse, the moment the pulse lands.
  - A tower whose first augment is Mint: each time its aura pays a kill's +1 gold — the same beat as the gold's pop (T0039), at the tower's base. One ring per paying kill, even when the tower pays several +1 at once.
- **When it does not:** Rally towers show no ring — their effect (faster attacks) is visible on the rallied towers firing. A tower with an attacking first augment (e.g. Bolt + Anchor) shows no ring — its added aura works on every hit, which is visible on the enemy.
- No change to aura values, gold, sounds, the HUD, the waves, the draft or the profile. No new HUD element.

## Acceptance criteria
- [ ] A pure Anchor tower plays a fading ring at its base on every root pulse; a pure Mint tower plays one ring at its base each time its aura pays a kill's +1 gold.
- [ ] Rally towers and towers whose first augment has an attack show no ring at all.
- [ ] The ring is in the tower's own color, ~1-cell radius, ~1 s fade, and silent.
- [ ] Aura values, gold, sounds and the layout are otherwise unchanged; works at 412x915 and 1280x720.

## Design (architect, yoga)

### Files
- edit `src/core/mint.ts` — add `mintPayers` (which towers pay a kill's extra gold); `mintGoldBonus` now sums over it, same numbers
- edit `src/systems/FxSystem.ts` — new `auraRing()` method, placed directly after `ring()`
- edit `src/systems/TowerSystem.ts` — in `attack()`: the quiet ring when a no-damage Anchor tower's pulse lands
- edit `src/systems/EnemySystem.ts` — in `strike()`: one ring per paying Mint tower, same beat as the gold's pop
- edit `tests/core/mint.test.ts` — tests for `mintPayers`

### Interfaces
```ts
// core/mint.ts (new; MintTower/chebyshev already exported there)
export function mintPayers<T extends MintTower>(towers: readonly T[], cell: Cell, source: T): readonly T[];
// FxSystem (new method, like ring())
auraRing(x: number, y: number, radius: number, color: number): void;
```
Nothing else changes; `mintGoldBonus` keeps its exact signature.

### Steps
1. `core/mint.ts`: add `mintPayers` — body is exactly the per-tower loop already inside `mintGoldBonus` (skip `goldPerKill <= 0`; keep tower when `t === source || (t.spec.goldRadius > 0 && chebyshev(t.cell, cell) <= t.spec.goldRadius)`), collecting into `payers`; then rewrite `mintGoldBonus`'s loop body to `for (const t of mintPayers(towers, cell, source)) bonus += t.spec.goldPerKill;`.
2. `FxSystem.ts`, after `ring()`: method body — `if (this.live >= FxSystem.MAX) return;` then `const g = this.scene.add.graphics().setDepth(DEPTH.preview).setPosition(x, y); fillRing(g, 0, 0, radius, 3, 0, Math.PI * 2, color, 0.5); g.setScale(0.2); this.track(g, 1000, { scale: 1, alpha: 0, ease: 'Quad.easeOut' });` (thin ring, thin alpha 0.5, ground depth like `wave`, silent).
3. `TowerSystem.ts` `attack()`: replace `if (attacked) hook.stats.shotsFired += 1;` with
```ts
    if (attacked) {
      // No damage, no bolts: the landing pulse is its aura working — the quiet ring at its base.
      if (spec.firstId === 'anchor' && spec.damage <= 0 && spec.bolts === 0)
        this.fx.auraRing(t.x, t.y, CELL, color ? PALETTE[color] : PALETTE.faint);
      hook.stats.shotsFired += 1;
    }
```
4. `EnemySystem.ts`: extend the `../core/mint` import with `mintPayers`; add `import { towerColor } from '../core/augments';`. In `strike()`, directly after the gold's pop line (today `this.fx.popText(e.x, e.y - 20, `+${paid}`);`):
```ts
    // The mints that paid for this kill ring quietly at their base, one ring per paying tower.
    if (cell) {
      for (const t of mintPayers(this.towers(), cell, payload.source)) {
        if (t.spec.firstId !== 'mint' || t.spec.damage > 0 || t.spec.bolts > 0) continue;
        const c = towerColor(t.augments);
        this.fx.auraRing(t.x, t.y, CELL, c ? PALETTE[c] : PALETTE.faint);
      }
    }
```
5. Add the tests below. `npm run check`.

### Pitfalls
- The Anchor ring must stay inside `if (attacked)`: no enemies in range = no pulse landed = no ring.
- No ring in `leak()`; the Mint loop runs only in `strike()` (kills), so leaks and rally effects never ring.
- The exact filter is `firstId` + no damage + no bolts: Bolt+Anchor, Bolt+Mint, Rally never ring; Bolt added to Anchor/Mint sets `spec.bolts > 0` and switches the ring off — copy the filter in both call sites verbatim.
- Keep the generic `<T extends MintTower>` on `mintPayers`: it is what makes `t.x`/`t.y` type at the `EnemySystem` call site; dropping it breaks the build.
- `auraRing` sits after `ring()`, the Mint loop right after the gold pop line: T0039 and T0027 also edit `strike()`/`FxSystem.ts` (T0045 may add another Fx method) — if their lines landed, keep this exact position.
- `track()` destroys the graphics on tween end, so no leak; the MAX-160 cap early-return is enough.

### Tests
`tests/core/mint.test.ts` (import `mintPayers` alongside `mintGoldBonus`):
```ts
describe('mintPayers', () => {
  it('each paying tower exactly once: its own kills and kills within its mints radii', () => {
    const a = tower(0, 0, mintCopy());
    const b = tower(0, 5, mintCopy()); // 3 cells from the kill: out of radius
    const bolt = tower(1, 2, copy('bolt'));
    expect(mintPayers([a, b, bolt], cell(1, 2), bolt)).toEqual([a]);
  });

  it('a Bolt with a Mint in it pays on its own kills; a Mint tower in radius pays too', () => {
    const bm = tower(0, 0, copy('bolt'), mintCopy());
    const mint = tower(2, 1, mintCopy());
    expect(mintPayers([bm, mint], cell(0, 0), bm)).toEqual([bm, mint]);
  });
});
```
