---
id: T0064
title: "Momentum: the Epic that grows every tower on a clean wave"
size: L
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T13:54:28Z
epic: E4
---

## Goal
A run that holds the line grows: each clean wave makes every tower stronger. The fourth rule-changing Epic — the first whose power comes from how the run went, not from what is on the board.

## Details
- **Rolls only as an Epic card**, the same Epic-only roll as Mark, Rally and Mint (T0012, T0020, T0021). The draft's odds line and tier chime cover it with no change.
- **The gate (the tech-tree unlock, E2's pool branch):** T0209's node (“Momentum”, 30 coins, `unlocks: 'momentum'`) is already in the game and sits dimmed “not in the game yet” until this augment lands. The def carries `tech: 'momentum'` (T0152's pattern: the tech node id that must be in the profile's purchased list before the augment rolls) and Momentum is absent from every draft roll (pre-wave-1, later, reroll, the fourth card) unless the purchased list holds `momentum` — the draft-side check is this task's line, exactly as Haste's gate is T0152's. (Added cycle 64: T0209 is in the game, so the gate is what makes the node do anything.)
- **Card lines** (both forms, with their numbers):
  - First (a tower with no attack of its own, a support like Rally and Mint): "Each clean wave: every tower deals +5% more damage (for the run)."
  - Added: "Each clean wave: +5% more damage per Momentum."
- **The rule:** at the end of every clean wave (zero leaks — the same clean wave the chip T0005, the streak T0045 and the rewards line T0033 use), the run's momentum bonus grows by 5% × (the total number of Momentum copies on the board at that moment), and it stays for the rest of the run. The bonus multiplies every damage a tower deals (shots, Lance pierce, Beam per-second, Ember ticks, Trap springs, Ricochet bounces); slows, roots, marks and gold are untouched.
- **Stacking:** the bonus is additive per copy — two Momentum copies mean each clean wave adds +10%. No cap. A later leak never takes the bonus back. A tower built after a clean wave is at the bonus from its very first shot.
- **Look on the tower:** a tower with Momentum is a low wide yellow disc (a flattened standard token, roughly 40% of a normal token's height, sitting on the plinth) with one thin notch cut into its front face per Momentum copy — the tick language the other augments use.
- **Readable:**
  - The tower panel gains one small line while the bonus is above 0: "Bonus +N%" (N is the run's total bonus — the same number on every Momentum tower; no line at 0).
  - The moment a clean wave grants the bonus, a small muted-yellow "+N%" pop rises from each Momentum tower (the same pop motion as the kill-gold pop), N being what that wave just added.
- **16-cap (the augments module; this task is the protocol's canonical statement):** the pool caps at 16 augments, and the pipeline holds 21 (15 in + T0025, T0062, T0064, T0095, T0152, T0235), so the six registrations land five removals. The rule (pointed to by T0025, T0062, T0095 and T0152): after registering your augment, if the pool has more than 16 augments, also remove the first of **Frost, then Rally, then Mint, then Mark, then Anchor** that is still in the AUGMENTS index, and say which in the result. (Mark and Anchor extend the order, 2026-10-30: the beam carries the mark (T0132) and Ward already punishes the root build; Bolt, Beam, Splash, Lance, Rapid, Reach, Push, Ember, Spray and Toll are protected — the draft floor (T0048) and the beam-combo web (T0210, T0242) depend on them.) The removal is mechanical (the pattern T0192 used for the root chip): delete the augment's content file, its line in the AUGMENTS index, its spec fields and loop in `core/augments.ts` (the `EMPTY` line, the `towerSpec` loop, the `describeSpec` lines), its towerLook/art lines and its tests; nothing else changes. A run save that references the removed id loads as invalid (the same path as a corrupt save — no resume offered, the profile's coins and best wave untouched). Why this order: the PO-leaning Frost + Haste merge resolves as Frost's removal (Haste, T0152, owns the enemy-speed stat, opposite sign); Rally is subsumed by Haste's tower side (the same attack-speed stat, 3× strength); Mint is the smallest rule-changer and yields to Mend (T0095).
- **Closest existing augment:** Mint (a passive Epic aura that never attacks). New: it changes damage instead of gold, and it grows from wave results — the first augment whose power comes from how the run went, not from what is on the board.

## Acceptance criteria
- [ ] The draft offers Momentum only as an Epic card (Epic frame, gem row, "· Epic" name line, tier chime); the odds line is unchanged.
- [ ] The gate (T0209's node, already in the game): with `momentum` not in the profile's purchased list, no draft — pre-wave-1, later, a reroll, a fourth card — ever offers Momentum; with it owned, Momentum rolls Epic-only like the other Epics.
- [ ] A first-time player reading the card lines learns both rules: a clean wave makes every tower deal +5% more, and each extra Momentum adds +5% per clean wave.
- [ ] After the first clean wave with one Momentum on the board, every tower deals 1.05× its previous damage (same tower, same target, same tier), the panel shows "Bonus +5%", and a muted-yellow "+5%" pop plays from the Momentum tower.
- [ ] With two Momentum copies the next clean wave adds +10% (total +15%), and the pop reads "+10%".
- [ ] A wave with any leak grants nothing; the bonus persists through a later leak; a tower built after a clean wave is at the bonus from its first shot.
- [ ] A Momentum tower shows the low wide yellow disc with one notch per copy; its slot pip is Epic purple as usual.
- [ ] Gold, lives, the clean streak (T0045) and the coin formula are unchanged by this task.

## Design (architect, desktop)

### Files
- create `src/content/augments/momentum.ts` - the augment def (model: `mint.ts`)
- create `src/core/momentum.ts` - the grant rule (per-copy growth, the total per clean wave)
- create `tests/core/momentum.test.ts` - unit tests for the rule
- edit `src/content/types.ts` - `Shape` gains `'disc'`; `FirstForm` and `AddedForm` each gain `momentum?: number`
- edit `src/content/augments/index.ts` - import + one line in `AUGMENTS`
- edit `src/core/run.ts` - `RunState.momentum` field + `momentumMul` getter
- edit `src/core/augments.ts` - `TowerSpec.momentumCount` (+ `EMPTY`, + count loop in `towerSpec`)
- edit `src/art/shapes.ts`, `src/art/paint.ts` - paint the `disc` (flattened circle)
- edit `src/art/entities.ts` - the disc's smaller eye dot in `paintTowerBody`
- edit `src/entities/towerLook.ts` - one `DECORATIONS` line: the notches
- edit `src/systems/EnemySystem.ts` - the damage multiplier in `strike()`
- edit `src/systems/RunFlow.ts` - the grant + pops in `clearWave()`'s clean branch
- edit `src/ui/hud/TowerPanel.ts` - the "Bonus +N%" line
- edit `src/debug/runChecks.ts` - one invariant line
- edit `tests/content.test.ts` - line 51 support condition gains `|| a.first.momentum`

### Interfaces
```ts
// content/types.ts: Shape = 'circle' | 'disc' | ... ; in FirstForm (after goldRadius) and AddedForm (after goldPerKill):
momentum?: number; // this copy grows the run's damage bonus by this fraction on every clean wave (Momentum)

// core/momentum.ts (new):
export const MOMENTUM_PER_COPY: number;                  // momentum.first.momentum ?? 0
export function momentumGrant(copies: number): number;   // copies * MOMENTUM_PER_COPY, no cap

// core/run.ts RunState (field next to cleanWaves, getter with the other getters):
momentum = 0;                       // fraction of extra damage; 0.05 = +5%; never taken back
get momentumMul(): number;          // 1 + this.momentum

// core/augments.ts TowerSpec (after goldRadius) + EMPTY:
momentumCount: number;              // Momentum copies in the tower: one notch each, any slot
```
`content/augments/momentum.ts`: `id 'momentum'`, `name 'Momentum'`, `look { shape: 'disc', color: 'yellow', size: 0.22 }`, `tier: 'epic'` (no `opening`), `first: { kind: 'pulse', damage: 0, range: 2, rate: 1, momentum: 0.05 }`, `added: { momentum: 0.05 }`, `asTower: 'Each clean wave: every tower deals +5% more damage (for the run).'`, `asAdded: 'Each clean wave: +5% more damage per Momentum.'`, both `tiers.{rare,epic}.asAdded` = the asAdded line. Card lines are exactly the task's — do not append "Does not attack." (the test caps `asTower` at 70 chars; with it, the line is 83).

### Steps
1. `content/types.ts`: add `| 'disc'` after `'circle'` in `Shape`; the two `momentum` fields.
2. Create `content/augments/momentum.ts` (code above); register in `content/augments/index.ts` (import after `mint`, `momentum,` after `mint,` in `AUGMENTS`).
3. Create `core/momentum.ts`; add `RunState.momentum` + `momentumMul` in `core/run.ts`; add `momentumCount` to `TowerSpec`/`EMPTY` and in `towerSpec` after the Push block: `for (const a of augments) if (a.id === 'momentum') spec.momentumCount += 1;`
4. `art/shapes.ts`: `disc: 0` in the `sides` Record (typecheck fails without it). `art/paint.ts` `shapePath`, after the circle case: `if (shape === 'disc') { ctx.beginPath(); ctx.ellipse(x, y, radius, radius * 0.4, 0, 0, Math.PI * 2); return; }` (as wide as a token, 40% of its height). `art/entities.ts` `paintTowerBody`: for `shape === 'disc'` the eye dot is `r * 0.13` at `c - r * 0.02`.
5. `entities/towerLook.ts` `DECORATIONS`, after the Mint entry:
```ts
// Momentum: one thin notch cut into the body's front face per Momentum in the tower.
(g, spec) => {
  if (spec.momentumCount === 0) return;
  const ry = spec.firstId === 'momentum' ? BODY * 0.4 : BODY; // a disc is 40% of a body's height
  for (let i = 0; i < spec.momentumCount; i++) {
    const a = (Math.PI * (i + 0.5)) / spec.momentumCount;
    g.fillStyle(PALETTE.ink, 0.45);
    g.fillRoundedRect(Math.cos(a) * BODY - 0.9, Math.sin(a) * ry - 3.4, 1.8, 3.6, 0.9);
  }
},
```
6. `systems/EnemySystem.ts` `strike()`: the damage line becomes `if (payload.damage <= 0 || !e.hit(payload.damage * this.run.momentumMul)) return false;` — every tower damage (shots, pierce, future beam/ember/trap/ricochet) flows through `strike()`/`hit()`, so this one spot covers all of it.
7. `systems/RunFlow.ts` `clearWave()`, inside the existing `if (clean)` (the same clean wave as the chip), before the chip line; import `momentumGrant`:
```ts
const grant = momentumGrant(this.s.towers.towers.reduce((n, t) => n + t.spec.momentumCount, 0));
if (grant > 0) {
  this.run.momentum += grant;
  for (const t of this.s.towers.towers)
    if (t.spec.momentumCount > 0) this.s.fx.popText(t.x, t.y - 20, `+${Math.round(grant * 100)}%`, PALETTE.yellowDeep);
}
```
8. `ui/hud/TowerPanel.ts`: fields `private bonus: Phaser.GameObjects.Text | undefined; private bonusN = -1;`; in `build()` (reset both, then after `stats`) `const bonus = scene.add.text(left, top + 78, 'Bonus +0%', textStyle(12, PALETTE.yellowDeep, { fontStyle: 'bold' })).setOrigin(0, 0).setVisible(false);`, add it to `items`, `this.bonus = bonus;`; in `update()` after the unlock block: show it only when `selectedTower.spec.momentumCount > 0 && game.run.momentum > 0`, and when shown `setText(\`Bonus +${Math.round(game.run.momentum * 100)}%\`)` only when the number changed.
9. `debug/runChecks.ts` after `run.ledger`: `['run.momentum', (g) => (Number.isFinite(g.run.momentum) && g.run.momentum >= 0 ? null : \`momentum bonus is ${g.run.momentum}\`)],`
10. `tests/content.test.ts` line 51: add `|| a.first.momentum`. Add `tests/core/momentum.test.ts`; run `npm run check` and `npm run smoke`.

### Pitfalls
- No DraftScene/odds/chime changes: `tier: 'epic'` + damage-0 first form + no `opening` gives Epic-only, non-opening rolls exactly like Mint; the frame/gems/"· Epic"/chime/shimmer are tier-generic.
- The bonus line must refresh in `TowerPanel.update()`, not only `build()`: a clean wave can end while the panel is open (building works during waves) and `uiVersion` doesn't change.
- Float drift: `run.momentum` accumulates 0.05 steps; always display `Math.round(momentum * 100)` (pop and panel), never the raw fraction.
- `TowerSystem.update()`'s skip check already handles a bare Momentum tower (damage 0, no slow/root/bolts/mark) — don't touch it; Momentum must not get its own `AttackKind`.
- If `src/systems/BeamSystem.ts` (T0029, in flight) exists when you start, verify its per-second damage goes through `EnemySystem.strike()`; anything that calls `e.hit()` directly bypasses the bonus.
- Pooled objects and dt are untouched; the pops are capped by FxSystem's MAX; notches are static Graphics redrawn in `Tower.refresh()`, no per-frame cost.

### Tests
`tests/core/momentum.test.ts`: `MOMENTUM_PER_COPY` is 0.05 and equals `added.momentum` of the def; `momentumGrant(0|1|2|40)` → `0|0.05|0.1|2` (no cap); `towerSpec`: `spec('momentum')` → `{ attacks: true, kind: 'pulse', damage: 0, momentumCount: 1 }`, `spec('bolt','momentum').momentumCount` 1 with bolt damage unchanged, `spec('momentum','momentum')` 2, `describeSpec(spec('momentum'))` is `'Does not attack.'`; `RunState`: starts 0 / mul 1, after `momentum += momentumGrant(1)` the mul is ≈1.05, and `leak()` doesn't change `momentum`; across many seeds `rollOffer` never yields Momentum except as Epic (model: the Mint test).

## Note (by hand, 2026-10-28)

No longer waits on T0038, T0045: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.
