---
id: T0248
title: "The codex shows why a card is quiet: a lock on the gated augments"
size: S
priority: 2
status: todo
depends_on: [T0152, T0062, T0095]
attempts: 0
created: 2026-10-30T01:33:38Z
epic: E4
design_attempts: 1
---

## Goal
The codex says why a gated augment is missing from the draft: every pool augment whose tech-tree node is not yet bought wears a small muted lock, so the tree's promise is seen on the screen where the cards are listed.

## Details
- In the codex (src/scenes/CodexScene.ts, the T0221 screen), the card of every pool augment gated by an unbought tech node wears a small muted-gray lock glyph in the card's top-right corner (~9 px: a rounded body with a shackle arc, in the codex's own muted-ink text color, the T0213 dot's position language).
- The gated set is derived, not named: an augment is locked exactly while some tech-tree node names it in its `unlocks` list and that node is unbought (the pool branch's nodes in src/content/tech/pool.ts and the purchased list in src/core/tech.ts — the same lookup the tech screen's locked state uses). Today that is Haste, Momentum and Mend; the ungated Epics (Mark, Rally, Mint, Anchor) never wear a lock.
- The lock is state-based: it clears the moment its node is bought (the codex re-derives on open). While at least one locked card is present, one small muted line under the grid reads "locked · tech tree" (the codex's muted line style); with no locked card there is no line.
- It replaces nothing and the screen has room: the tech tree shows the node's state where coins are spent; the codex is where the cards are listed, and the lock answers "why can't I pick this?" — shown nowhere else. The cards do not grow: the corner glyph and the under-grid line only; the icon, the name line, the tier word, both card lines and the grid layout stay as they are.
- No new input, no sound. Fits at 412x915 (2 columns) and 1280x720 (3 columns) as today.

## Acceptance criteria
- [ ] On a fresh profile the codex shows the lock on exactly the cards whose tech node is unbought (Haste, Momentum and Mend today) and the muted "locked · tech tree" line under the grid; no ungated card wears a lock.
- [ ] After buying one pool node (e.g. Haste) the lock is on the remaining locked cards only; after all three pool nodes are bought the codex is byte-identical to today (no lock, no line).
- [ ] Every card's icon, name line, tier word, card lines and the grid layout are unchanged; the codex fits at 412x915 and 1280x720 as before.

## Design (architect, cachyos-x8664)

**Reads:** CodexScene (`src/scenes/CodexScene.ts`) lists `AUGMENTS` as cards; `POOL_NODES` (`src/content/tech/pool.ts`) has `unlocks: string`; purchased list is `loadProfile(window.localStorage).purchased` (read `src/core/profile.ts` line 38). Haste/Momentum/Mend augment content does not exist yet — their cards arrive with T0152/T0062/T0095; the lock mechanism is derived, so it builds now and shows once those land.

### Files
- edit `src/core/tech.ts` — add `gatedPoolAugments()` between `buyPoolNode` (ends line 126) and `nodeInReach`.
- edit `src/scenes/CodexScene.ts` — read profile in `build()`, lock glyph on gated cards, line under grid, panelH.
- edit `tests/core/tech.test.ts` — pin the derived gated set.

### Interfaces
```ts
// src/core/tech.ts, no new imports (POOL_NODES already imported)
export function gatedPoolAugments(purchased: readonly string[]): string[]
// = pool-order ids from POOL_NODES[n].unlocks for nodes with !purchased.includes(n.id)
```
CodexScene imports: `import { loadProfile } from '../core/profile';` and `import { gatedPoolAugments } from '../core/tech';` after the `../content/palette` line; module consts `const LOCK_LINE_GAP = 14; const LOCK_LINE_H = 16;` above the class.

### Steps
1. core:
```ts
export function gatedPoolAugments(purchased: readonly string[]): string[] {
  const out: string[] = [];
  for (const n of POOL_NODES) {
    if (purchased.includes(n.id) || out.includes(n.unlocks)) continue;
    out.push(n.unlocks);
  }
  return out;
}
```
2. CodexScene `build()`: after the entries loop, before `const rowHeights`:
```ts
const gated = new Set(gatedPoolAugments(loadProfile(window.localStorage).purchased));
const anyLocked = AUGMENTS.some((def) => gated.has(def.id));
```
NOT `gated.size` — the set contains 'haste'/'momentum'/'mend' even before those augments are in AUGMENTS; the line must appear only when a card is actually locked.
3. Replace the panelH line (line 100) with the same reduce plus `+ (anyLocked ? LOCK_LINE_GAP + LOCK_LINE_H : 0)` before `+ g.bottom`.
4. In the `entries.forEach` block, after the epic tier-word `if` (line 119), before `const towerLine`:
```ts
if (gated.has(def.id)) {
  const lock = this.add.graphics();
  lock.fillStyle(PALETTE.muted, 1);
  lock.fillRoundedRect(lx + g.entryW - 18, ty + 9, 9, 8, 2);
  lock.lineStyle(1.5, PALETTE.muted, 1);
  lock.arc(lx + g.entryW - 13.5, ty + 10, 3.5, Math.PI, 2 * Math.PI);
  parts.push(lock);
}
```
Arc from `Math.PI` to `2 * Math.PI` (default direction) is the top half — the shackle; do not flip `anticlockwise`.
5. After `entries.forEach` closes, before `this.box = this.add.container(0, 0, parts)`:
```ts
if (anyLocked) {
  parts.push(this.add.text(0, this.panelH / 2 - g.bottom - LOCK_LINE_H / 2, 'locked · tech tree', textStyle(12, PALETTE.muted)).setOrigin(0.5));
}
```
6. tests/core/tech.test.ts: add `gatedPoolAugments` to the import from `../../src/core/tech` and:
```ts
it('the codex gates: a pool augment is gated while its node is unbought, clear once the node is bought', () => {
  expect(gatedPoolAugments([])).toEqual(['haste', 'momentum', 'mend']);
  expect(gatedPoolAugments(['haste'])).toEqual(['momentum', 'mend']);
  expect(gatedPoolAugments(['haste', 'momentum', 'mend'])).toEqual([]);
  expect(gatedPoolAugments(['nope', 'gold-1', 'clean2'])).toEqual(['haste', 'momentum', 'mend']);
});
```

### Pitfalls
- Byte-identical when nothing gated: `anyLocked` false → no lock objects, no line, no panelH term — all three terms must be gated by `anyLocked`/`gated.has`.
- Locks/line must go into `parts` (destroyed with `this.box` on the class-flip rebuild); re-derived fresh on open because the scene relaunches from the menu with no state.
- No card grows: glyph spans y `ty+6.5..ty+17`, x `lx+entryW-18..lx+entryW-9`; the name/tier lines start at y `ty+30` — no overlap; icon is at lx+26 left.
- `arc`/`fillRoundedRect` exist on Phaser 3.90 Graphics (verified in phaser.d.ts); `PALETTE.muted` (0x6f8287) is the codex's muted color.

### Tests
`tests/core/tech.test.ts`: the `gatedPoolAugments` test above (the rule lives in src/core/tech.ts).
