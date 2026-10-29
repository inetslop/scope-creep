---
id: T0096
title: "The what-if: the tower previews the held augment before the gold is spent"
assignee: asus
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T02:00:38Z
claimed_at: 2026-10-29T10:15:35Z
finished_at: 2026-10-29T11:10:10Z
epic: E4
---

## Goal
The decision is visible before it is paid for: while a hand card is selected, a tower with a free slot shows what it would become with that augment — the new barrel, ring or tick, and the new reach where the reach changes — before the gold is spent.

## Details
- No new input: the hand's existing pick state (the tapped card that commits to a tower or an empty cell on tap) drives the preview; the same pick, the same commit.
- Desktop (hover): while a hand card is selected and the pointer is over a tower with at least one free slot, that tower shows a ghost of the result:
  - The marker the augment would add — the same look towerLook already paints for that augment in a tower (the barrel, ring or tick, in the augment's own color) — at the tower's next free slot position, at ~50% alpha, wearing the card's tier pip, so the rarity is seen in the preview too (E4's rule: rarity shows everywhere an augment appears).
  - Where the held augment changes the tower's shown range — an added Reach (+35% range per copy), an added Pulse (+0.5 cells per copy) — the tower's range ring previews the new reach: the same ring at the new radius, ~50% alpha. Where the held augment changes no range, the ring is untouched.
  - The ghost clears the moment the pointer leaves the tower, the card is committed, or the pick is canceled (the card tapped again).
- Mobile (no hover): while a hand card is selected, every tower with a free slot shows the ghost marker at its next free slot (the augment's own color, the card's tier pip, ~50% alpha) — no range ring, to keep the board quiet. Tapping a tower commits the card as today and clears every ghost.
- A tower with no free slot never shows a ghost, whatever card is held — "buy a slot first" stays the buy button's job.
- The ghost is display-only: it changes no damage, gold, targeting or timer; nothing is spent until the commit, and the committed augment renders exactly as it does today.
- No new sound (the pick is silent; the commit keeps its existing chime, T0088's if landed), no new key or button, no pause-screen line.

## Acceptance criteria
- [ ] On desktop, with a hand card selected, hovering a tower with a free slot shows the held augment's marker ghost (its own color, the card's tier pip, ~50% alpha) at the tower's next free slot; leaving the tower, committing, or canceling the pick clears it.
- [ ] With an added Reach or an added Pulse held, the hovered tower's range ring previews the new radius at ~50% alpha; with a card that changes no range, the ring is untouched.
- [ ] At 412×915 and 1280×720, with a hand card selected, every tower with a free slot shows the ghost marker (no range ring on mobile), and tapping a tower commits the card as today and clears the ghosts.
- [ ] A tower with no free slot never shows a ghost, whatever card is held.
- [ ] The ghost changes nothing measurable — gold, damage, targeting, cooldowns and the wave all behave exactly as today, and the committed augment renders identically to before this change.
- [ ] No new sound, key or button; the pause screen is unchanged.

## Design (architect, cachyos-x8664)

### Files

**Create `src/systems/towerGhost.ts`** — `TowerGhost`, the per-run, display-only owner of the "what-if" ghost marker(s). It draws, at a tower's next free-slot position, (a) the card's tier pip and (b) "the look `towerLook` already paints for that augment added to the tower" — a barrel / ring / tick / arrow / coin, in the augment's own color — both at ~50% alpha. Pure display: it owns only `Phaser.GameObjects.Graphics` on the scene; it changes no run state, gold, timer, sound, key, or HUD.

**Edit `src/entities/Tower.ts`** (+1 public method) — `slotPoint(index)`: the board point of slot `index`'s pip, so the marker sits exactly where the new pip will land.

**Edit `src/systems/Building.ts`** — the ghost state machine: it owns which towers show a ghost (the pointer tower on desktop, every free tower on mobile) and reconciles `TowerGhost` on every selection/commit/hover change.

**Edit `src/scenes/GameScene.ts`** (5 lines) — construct the `TowerGhost`, hand it to `Building`, and clear it on drag start.

Nothing else. `Building.tap`'s commit path, `TowerSystem.place`, the range ring, sound, keys, the HUD and the pause screen are all untouched.

### Interfaces

```ts
// src/systems/towerGhost.ts
export class TowerGhost {
  constructor(scene: Phaser.Scene);
  /** Towers currently showing a ghost marker. */
  get towers(): Tower[];
  /** Show (or move/replace) the what-if marker for `copy` on `tower`'s next free slot. */
  show(tower: Tower, copy: AugmentCopy): void;
  /** Remove `tower`'s marker, if any. */
  clear(tower: Tower): void;
  /** Remove every marker. */
  clearAll(): void;
}
```

```ts
// src/entities/Tower.ts  (new public method, next to freeSlots)
/** The board point of slot `index`'s pip on the plinth. */
slotPoint(index: number): { x: number; y: number };
```

```ts
// src/systems/Building.ts  (additions)
constructor(run, board, towers, fx, sfx, ghost: TowerGhost); // 6th param
dragStarted(): void;            // a drag: the pointer is on nothing, so clear the ghost
// private fields: pointerTower: Tower | undefined, hoverSeen: boolean
// private refreshGhosts(): void
```

### Steps

1. **`Tower.slotPoint(index)`** — return `{ x: this.pips.x + this.pipX(index), y: this.pips.y + 22 }`. Verified exact against `popPip` (line 169), which positions its temp pip at `this.pips.x + this.pipX(slot), this.pips.y + 22`, and against the filled pips (line 134: `fillCircle(x, 22, 4)` where `x = pipX(i)`). This is the one exact detail the marker depends on.

2. **`TowerGhost`** — `private markers = new Map<Tower, Phaser.GameObjects.Graphics>()`.
   - `show(tower, copy)`:
     - `const n = tower.augments.length;` (the next free slot — slots fill in order); `const p = tower.slotPoint(n);`
     - `this.clear(tower)` (recreate = move/replace), then `const g = this.scene.add.graphics().setDepth(DEPTH.towers + 3).setPosition(p.x, p.y).setAlpha(0.5);`
     - the tier pip, at exactly the slot point (local `(0, 0)`): `g.fillStyle(pipColor(copy.tier), 1).fillCircle(0, 0, 4);`
     - "what it would add," centered just above the slot point (local `(0, -9)`, a compact marker ~ the size of the real decoration scaled down; exact sizes are visual tuning matched to the plinth). Key off the **added form** `const e = getAugment(copy.id).added; const color = PALETTE[getAugment(copy.id).look.color];` — the same field-driven way `towerSpec` works — draw one compact shape in `color` (the whole marker is at 0.5 alpha via `setAlpha(0.5)`):
       - `e.extraShots` (Bolt) → a short capsule: a compact rounded-rect `fillRoundedRect`;
       - `e.pierce` (Lance) → a thin long rod (a narrower, taller rounded-rect);
       - `e.splash` (Splash) → a capsule + a small circle at the mouth (the bulb);
       - `e.rangeMul` (Reach) → a longer thinner capsule;
       - `e.slow` (Frost) → a ring: `fillRing(g, 0, -9, 9, 3, 0, Math.PI * 2, color, 1)`;
       - `e.root` (Anchor) → a ring + four ticks: `fillRing(..., 9, 3, 0, 2π)` + four `fillRing(..., 9, 5, a-0.12, a+0.12)` at 0/90/180/270°;
       - `e.mark` (Mark) → a ring + one tick: `fillRing(..., 9, 2, 0, 2π)` + one `fillRing(..., 9, 3, a-0.14, a+0.14)`;
       - `e.burn` (Ember) → a short thick arc: `fillRing(g, 0, -9, 9, 3, -0.4, -0.1, color, 1)`;
       - `e.rateMul` (Rapid) → a short thick arc / band: `fillRing(g, 0, -9, 9, 3, a, a+0.28, color, 1)`;
       - `e.push` (Push) → an outward-pointing triangle: `g.fillTriangle(...)` (a small arrowhead, centered ~ `(0,-9)`);
       - `e.goldPerKill` (Mint) → a coin: two stacked `fillCircle`s (the deep one offset a couple units down);
       - else (Rally, and any unknown) → a small token: a filled circle (r ~5) in `color` (Rally adds no dedicated decoration — a beacon — so its marker is its own token).
     - `this.markers.set(tower, g);`
   - `clear(tower)`: destroy that tower's Graphics, delete from the map. `clearAll()`: loop a snapshot of the keys, destroy + delete. `get towers()`: `[...this.markers.keys()]`.
   - Imports: `DEPTH` from `../config`, `PALETTE` from `../content/palette`, `getAugment` from `../content/augments`, `pipColor` from `../entities/towerLook`, `fillRing` from `../ui/ring`, `type { Tower }` from `../entities/Tower`, `type { AugmentCopy }` from `../content/types`, `type Phaser` from `phaser`. No `art/textures` (the marker is all `Graphics`).

3. **`Building`** — constructor stores `private readonly ghost: TowerGhost` (6th param). Add fields `private pointerTower: Tower | undefined` and `private hoverSeen = false`. Add:
   ```ts
   private refreshGhosts(): void {
     const held = this.heldCopy;
     if (!held || this.run.phase === 'over') { this.ghost.clearAll(); return; }
     const targets = this.hoverSeen
       ? (this.pointerTower && this.pointerTower.freeSlots > 0 ? [this.pointerTower] : [])
       : this.towers.towers.filter((t) => t.freeSlots > 0);
     for (const t of this.ghost.towers) if (!targets.includes(t)) this.ghost.clear(t);
     for (const t of targets) this.ghost.show(t, held);
   }
   ```
   and `dragStarted(): void { this.pointerTower = undefined; this.refreshGhosts(); }`.
   Call `refreshGhosts()` from:
   - `hover(x, y)` — compute `const tower = cell ? this.board.towerAt(cell) : undefined;` once at the top (before the `!cell || !held` early return), then `this.pointerTower = tower; this.hoverSeen = true; this.refreshGhosts();` (one call covers every return).
   - `tap(x, y)` — set `this.pointerTower = this.board.towerAt(cell)` right after the `const cell …; if (!cell) return;` lines (a tap IS a pointer position; the phase guard stays first). No `refreshGhosts()` call here: every commit funnels through `placeHeld`/`tap` → `afterHandChange`, which calls it.
   - `pickCard(index)` — after `this.selectedAugment = index;`.
   - `cardAdded()` — last line.
   - `afterHandChange()` — last line (every commit funnels through `placeHeld`/`tap` → `afterHandChange`, so this clears all ghosts and redraws for the new held copy, including when the hand goes empty).
   - `unlockSlot()` — last line.

4. **`GameScene`** — `import { TowerGhost } from '../systems/towerghost';` (correct casing); field `ghost!: TowerGhost;`; in `create()`, `this.ghost = new TowerGhost(this);` before the `Building` construction; change to `this.building = new Building(this.run, this.board, this.towers, this.fx, sfx, this.ghost);`; and the drag handler becomes:
   ```ts
   dragStart: () => { this.board.showHover(undefined, false, 0); this.building.dragStarted(); },
   ```

### Pitfalls

- **Display-only**: it must change nothing measurable — no `RunState`, no gold, no `Tower.augments`, no `towerSpec`, no targeting, no timer, no sound, no key, no HUD part, no pause line. Committed augments render exactly as today. The markers are `Graphics` on the scene, torn down with the scene on shutdown (no explicit cleanup).
- **`slotPoint` is exact**: it must be `pips.x + pipX(index), pips.y + 22` (board units), or the ghost floats off the plinth and the tier pip won't sit where the real one will. Depth `DEPTH.towers + 3` (with the pips).
- **Desktop vs mobile is the `hoverSeen` flag**: `BoardGestures` fires `hover` only for desktop pointers (`!p.wasTouch && !p.isDown`), so a desktop hover has fired iff `hoverSeen` is true. Desktop: only `pointerTower` (if it has a free slot) shows a ghost. Mobile (never hovered): every tower with a free slot shows one.
- **`dragStarted` is required**: while a drag is active the pointer is down, so `hover` does NOT fire and a stale `pointerTower` would linger; clearing it on drag start (and on the `dragStart` handler) stops a ghost stuck on a tower the pointer is no longer over.
- **The range ring already previews an added augment's radius** (`Building.hover` computes `towerSpec([...tower.augments, held]).range * CELL` and `Board.showHover` draws it) — do NOT duplicate or change it; the ghost is only the marker on a tower with a free slot.
- **Stale cases**: a tap sets `pointerTower` (a tap IS a position); `hover` overwrites it every move; a drag clears it. There is no deselect in the pick model — re-tapping the selected card re-selects it (`pickCard` sets `selectedAugment`, no toggle), so the ghost clears and redraws for the same copy; do not invent a deselect.
- **Do not touch** `RunFlow.ts`, `TowerSystem.ts`, `towerLook.ts`, `debug/runChecks.ts`, `core/augments.ts`, `content/types.ts`, or the draft/menu/pause/game-over scenes (owned by other in-flight tasks). The ghost reuses `towerLook`'s visual vocabulary but adds nothing to it.

### Tests

None (display-only). `npm run check` (typecheck + lint + unit tests) and `npm run smoke` (build + play in a real browser at 412×915 phone portrait and 1280×720) must pass; the ghost is verified in-browser: on desktop it appears on the tower under the pointer (and only that tower) with a hand card selected, and clears on hover-leave / commit / card re-tap; on touch, every tower with a free slot shows one; a full tower (no free slot) shows none; committing clears all.

## Result (attempt 1, asus)

Added the "what-if" tower preview: a new `src/systems/towerGhost.ts` (`TowerGhost`) draws, at half alpha on a tower's next free slot, the tier pip plus a compact marker of what the held card would add (capsule/rod/bulb/ring/tick/arrow/coin per the augment's added form, in its own color); `Tower.slotPoint()` supplies the exact pip position and `Building` reconciles the ghosts on hover, tap, pick, card-added, slot-unlock, commit and drag-start (desktop: only the tower under the pointer; touch: every tower with a free slot). `GameScene` constructs the ghost, hands it to `Building` and clears it on drag start — nothing else changes, the range-ring preview and commit path are untouched, and `npm run check` and `npm run smoke` (412×915 + 1280×720) both pass.

- Self-review: APPROVE
- Time: 54.6 min

```
projects/chokepoint/game/src/entities/Tower.ts     |  5 ++
 projects/chokepoint/game/src/scenes/GameScene.ts   |  7 +-
 projects/chokepoint/game/src/systems/Building.ts   | 38 +++++++++-
 projects/chokepoint/game/src/systems/towerGhost.ts | 86 ++++++++++++++++++++++
 4 files changed, 132 insertions(+), 4 deletions(-)
```
