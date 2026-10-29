---
id: T0235
title: "Feast: the Epic that feeds on the kill chain"
size: L
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T22:31:19Z
epic: E4
---

## Goal
A new Epic-only augment with a new source of power: the kill chain itself. Quick kills sharpen every tower for as long as the chain lives, and the chain's clock can be bought longer.

## Details
- **Rolls only as an Epic card**, the same Epic-only roll as Mark, Rally, Mint and Anchor (T0012, T0020, T0021, T0023): Epic frame, gem row, "· Epic" name line, tier chime; **not offered in the pre-wave-1 draft** (no opening, like Mint); **no tech gate**; the codex (T0221), the what-if preview (T0096, ghosts the tick like the other supports), the panel's DPS line (T0084, reads 0 like the other supports) and the end card's by-tower chip (T0216, "kills 0") cover it with no change of their own.
- **Card lines** (both forms, exact):
  - First: "Kills chain: every tower +4% damage per chain level."
  - Added: "Each extra Feast: the combo window +0.4 s."
- **First form (a support with no attack of its own, like Momentum):** while at least one Feast tower stands on the board **and** the run's kill chain (the ×N counter, T0031) is alive, every damage a tower deals — shots, Lance pierce, Spray pellets, Beam per-second, Ember ticks, Trap springs — is multiplied by **(1 + 0.04 × the chain's current level)**: ×2 → +8%, ×5 → +20%, ×10 → +40%. The bonus is live per hit: it applies to each damage event while the chain is alive and is off (×1) the moment the chain breaks (window expiry, or a leak per T0207). The chain's count, its gold milestones (T0066) and its milestone yellow (T0034) are unchanged; the damage path reads the live chain level the way Momentum's bonus is read (T0064).
- **Added form (new: it lengthens a system's timing instead of adding damage, which no added form does):** each Feast copy on the board **beyond the first** lengthens the kill chain's window by **+0.4 s**, additive, no cap — one Feast copy: the base 1.5 s; two copies: 1.9 s; three: 2.3 s. Everything that reads the window uses the effective one: the ×N counter itself, the drain bar under it (T0220, which must drain over 1.5 s today), and nothing else changes (the bar still refills on each kill, and the 2× fast-forward still scales it with the sim, T0019).
- **Look:** a Feast-first tower is a **low open ring (a plate — a stroke, no fill) at the tower's base in yellow**, one short tick per copy on the ring. It must read as a ring, not as Momentum's filled yellow disc (T0064) — different shape, same color family is acceptable because the shapes differ. The ring is **lit (full opacity) while the kill chain is alive and dim (half opacity) while it is broken**, so the buff's state is visible on the tower where it is spent; the slot pip is Epic purple as usual (T0010).
- **Closest existing augment: Momentum** (a passive Epic whose power comes from how the run went). New: Momentum's bonus is granted per clean wave and never comes back; Feast's is live per hit while the kill chain is alive — momentary, per-hit, off the instant the chain breaks — and its added form lengthens the chain's window instead of growing a bonus.
- **16-cap (the augments module):** the pool caps at 16 augments — after registering, if the pool has more than 16, also remove the first of **Frost, then Rally, then Mint** that is still in the AUGMENTS index (a mechanical deletion, T0192's pattern; the full protocol is in T0064's task) and say which in the result.

## Compared with what exists

| Existing | What it shares | What Feast does that it can't (not numbers) |
| --- | --- | --- |
| Momentum | 0-damage Epic support; a damage bonus that comes from how the run went | Momentum's bonus is granted per clean wave and is permanent; Feast's is live per hit while the kill chain is alive, off the moment it breaks, and its added form lengthens the chain's window instead of growing a bonus |
| Rapid | an added form that changes a tower's combat stat | Rapid changes the host tower's own attack rate (a stat of its attack); Feast changes every tower's damage from a run state no tower controls |
| Mark | damage amplification | Mark adds a flat % to one marked enemy (per enemy, applied by a hit); Feast adds a % to every enemy from the chain state — no target, no mark |
| Mint | `kind pulse` first form, 0 damage | Mint's pulse is a per-kill gold radius around itself; Feast reads the kill chain — no enemy, no radius, no gold |
| Splash | `kind pulse` first form | Splash's pulse damages around the tower; Feast's "pulse" does nothing to any enemy |
| Frost | `kind pulse` first form | Frost's pulse slows enemies on the road; Feast never slows an enemy |
| Push | `kind pulse` first form | Push's pulse pushes enemies back along the road; Feast never moves an enemy |
| Anchor | `kind pulse` first form | Anchor's pulse roots enemies; Feast never stops an enemy |

## Acceptance criteria
- [ ] The draft offers Feast only as an Epic card (Epic frame, gem row, "· Epic" name line, tier chime), never in the pre-wave-1 draft; the codex lists it with both lines.
- [ ] With a Feast tower on the board, while the ×N counter is alive at ×2, every tower deals 1.08× its undamaged-against value (same tower, target and tier as without the chain); at ×10 it deals 1.40×; the moment the counter breaks (window expiry or a leak), damage is back to ×1.
- [ ] With no Feast tower on the board, the chain changes nothing about damage — byte-identical to today.
- [ ] Two Feast copies on the board: the chain window is 1.9 s (the ×N counter lives 1.9 s after each kill and the drain bar, T0220, drains over 1.9 s); three copies: 2.3 s; one copy: 1.5 s, as today.
- [ ] Combo gold (T0066) and the milestone yellow (T0034) still key on the chain level and are unchanged; a leak still breaks the chain (T0207) and the 2× fast-forward (T0019) still scales the window with the sim.
- [ ] A Feast-first tower is the yellow open ring (a plate, not a disc) with one tick per copy, lit while the chain is alive and dim while it is broken; the Epic purple pip is as usual; works at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- create `src/content/augments/feast.ts` — the augment def (Epic-only, 0-damage pulse first form) + exported `FEAST_WINDOW_EXTRA_SEC = 0.4`
- create `src/core/feast.ts` — pure rules: window ms per copy count, chain liveness, damage multiplier
- create `src/systems/FeastGlow.ts` — per-frame system: lit/dim state of the Feast plates (model on `ComboBar`)
- create `tests/core/feast.test.ts` — unit tests for the core rules
- edit `src/content/augments/index.ts` — import `feast` (between `ember` and `frost`); add `feast,` after `mark,` in `AUGMENTS` (with the other Epic-only supports); then the 16-cap check (see Steps)
- edit `src/content/types.ts` — `FirstForm.runPower?: boolean` (after `goldRadius`); `AddedForm.chainWindowSec?: number` (after `goldPerKill`)
- edit `src/core/augments.ts` — `TowerSpec.feastCount: number` (+ `feastCount: 0` in `EMPTY`); in `towerSpec()` next to the Mints loop: `for (const a of augments) if (a.id === 'feast') spec.feastCount += 1;`
- edit `src/systems/FxSystem.ts` — public `comboWindowMs = FEAST_CHAIN_BASE_MS` (imported from `core/feast`); in `killCount()` replace both `1500` literals with `this.comboWindowMs`
- edit `src/systems/ComboBar.ts` — line 35: `/ 1500` → `/ this.fx.comboWindowMs`
- edit `src/systems/EnemySystem.ts` — the damage multiplier + window setting (exact points below)
- edit `src/entities/Tower.ts` — `feastPlate` graphics (created/redrawn in `refresh()`, destroyed in `destroy()`), `setFeastPlateLit()`
- edit `src/entities/towerLook.ts` — exported `drawFeastPlate(g, spec)`
- edit `src/scenes/GameScene.ts` — `feastGlow!: FeastGlow` field + import; `this.feastGlow = new FeastGlow(this, this.fx, () => this.towers.towers);` after the ComboBar line; `this.feastGlow.update();` after `this.comboBar.update();`
- edit `src/debug/runChecks.ts` — `['feast.window', (g) => (Number.isFinite(g.fx.comboWindowMs) && g.fx.comboWindowMs >= FEAST_CHAIN_BASE_MS ? null : `the chain window is ${g.fx.comboWindowMs} ms`)],` after `comboBar.valid`
- edit `tests/content.test.ts` — line 51: add `|| a.first.runPower` before `).toBeTruthy()`

### Interfaces
```ts
// src/core/feast.ts
export const FEAST_CHAIN_BASE_MS = 1500;
export function feastChainWindowMs(copies: number): number;            // 1500 + 400 * max(0, copies-1)
export function chainAlive(chain: number, now: number, lastKill: number, windowMs: number): boolean; // chain >= 1 && now - lastKill < windowMs
export function feastDamageMul(feastCopies: number, chain: number, now: number, lastKill: number, windowMs: number): number; // 1 + 0.04*chain while copies>0 and chainAlive, else 1

// src/content/augments/feast.ts
export const FEAST_WINDOW_EXTRA_SEC = 0.4;
// def: id 'feast'; name 'Feast'; asTower 'Kills chain: every tower +4% damage per chain level.';
// asAdded 'Each extra Feast: the combo window +0.4 s.' (same string in tiers.rare/epic.asAdded);
// look { shape: 'ring', color: 'yellow', size: 0.22 }; first { kind: 'pulse', damage: 0, range: 1, rate: 1, runPower: true };
// added { chainWindowSec: FEAST_WINDOW_EXTRA_SEC }; tier: 'epic'.

// src/entities/towerLook.ts
export function drawFeastPlate(g: Phaser.GameObjects.Graphics, spec: TowerSpec): void;
// g.clear(); r = BODY * 1.95 (the base, below the pips, like the Mark ring);
// fillRing(g, 0, 0, r, 2, 0, Math.PI * 2, PALETTE.yellow, 1); // the open ring (a stroke, no fill)
// then spec.feastCount ticks: a = (i * Math.PI * 2) / spec.feastCount (0 = up);
// fillRing(g, 0, 0, r, 4, a - 0.12, a + 0.12, PALETTE.yellow, 1); // same color, thicker, like Anchor's ticks

// src/entities/Tower.ts
setFeastPlateLit(lit: boolean): void; // guard: no-op if !feastPlate or unchanged; setAlpha(lit ? 1 : 0.5)
// refresh(): if (spec.firstId === 'feast') { create if (!this.feastPlate): scene.add.graphics().setDepth(DEPTH.towers + 1).setPosition(this.x, this.y); drawFeastPlate(this.feastPlate, spec); }
//            else destroy it and reset plateLit. destroy(): this.feastPlate?.destroy();

// src/systems/FeastGlow.ts
export class FeastGlow { constructor(scene: Phaser.Scene, fx: FxSystem, towers: () => readonly Tower[]); update(): void; }
// update: alive = chainAlive(this.fx.chain, this.scene.time.now, this.fx.comboLastKill, this.fx.comboWindowMs);
// for (const t of this.towers()) if (t.spec.firstId === 'feast') t.setFeastPlateLit(alive);
```
`EnemySystem` gains two private helpers — `feastCopies()` (sum of `t.spec.feastCount` over `this.towers()`) and `feastMul()` (`feastDamageMul(this.feastCopies(), this.fx.chain, this.scene.time.now, this.fx.comboLastKill, this.fx.comboWindowMs)`) — and `feastChainWindowMs` is applied in `kill()`: set `this.fx.comboWindowMs = feastChainWindowMs(this.feastCopies());` **before** `this.fx.killCount(e.x, e.y);`. The multiplier is applied at exactly the three damage points: `strike()` — `payload.damage * this.feastMul() * (…plateMul… )`; `tickBurn()` — `burnTick(e.burn, dt) * this.feastMul()`; `beamTick()` — `target.hit(damage * this.feastMul(), false)`.

### Steps
1. `content/augments/feast.ts`, `content/types.ts` (the two fields), `content/augments/index.ts` registration.
2. **16-cap**: after registering, count `AUGMENTS`. Today that is 15 — if ≤ 16 stop. If the index grew past 16 meanwhile (other tasks landed), remove the first of **frost → rally → mint** still in the index: delete its array line and its import line only (nothing else imports them directly), and say which one you removed in the result.
3. `core/feast.ts`, then `core/augments.ts` (spec field + count loop).
4. `FxSystem` window field, `ComboBar` drain, the five `EnemySystem` edits.
5. `towerLook.ts` `drawFeastPlate`, `Tower.ts` plate lifecycle + `setFeastPlateLit`, `FeastGlow.ts`, the four `GameScene` lines, the invariant.
6. `tests/core/feast.test.ts`, the `content.test.ts` line, `npm run check`, `npm run smoke`.
No other files change: draft (Epic roll via `tier: 'epic'`, no opening via `damage: 0`), tier chime, codex, DPS line (0 like Mint), end-card chip (kills 0) and the what-if ghost (falls back to its plain token for the unknown added field, like Rally) all read the data generically.

### Pitfalls
- **Never treat `fx.chain > 0` as "alive".** `FxSystem` resets `comboN` lazily (next kill) and arms no timer for a level-1 chain, so after a break the count can sit stale. `chainAlive()` checks the window too — that is what makes damage snap to ×1 at expiry and keeps a lone-kill chain (+4% for 1.5 s, then off) correct. Do not "fix" `FxSystem`'s reset logic; nothing else observes the stale value.
- **Window consistency**: `comboWindowMs` is set at each kill, *before* `killCount` (the expiry check and the timer both read it), and `ComboBar` drains over it — bar, counter and break stay in lockstep on the scene clock, so 2× fast-forward scales it for free. All timing is scene-clock comparison, no `dt` accumulation.
- **`FeastGlow` must run in every phase** (hence `GameScene.update`, not an enemy hook — hooks only update during a wave): the chain can expire while the draft is open. Do not cache the lit state in the system; a newly built Feast tower would otherwise stay at its default alpha. `setFeastPlateLit` keeps its own per-tower guard.
- **Byte-identical without Feast**: `feastCopies() === 0` returns exactly 1 and the window stays 1500 — a feast-less run must change nothing.
- **Plate lifecycle**: redraw on every `refresh()` (tick count changes when a copy is added), destroy in `Tower.destroy()`, and only Feast-**first** towers get a plate (`spec.firstId === 'feast'`) — a Feast added elsewhere shows nothing (the buff is board-wide, like a Rally added elsewhere shows no beacon). No new painter: icon and body are painted from `look` automatically (`ring` is already supported — the Mute's shape); the plate is `fillRing`, never a thick stroke, and lives in `towerLook.ts` rather than `DECORATIONS` because only the plate's alpha is dynamic.
- **`content.test.ts:51`** rejects a first form that does nothing to enemies; `runPower` is the marker (it also preps Momentum T0064). Extend that one line only.

### Tests
`tests/core/feast.test.ts`: window (0→1500, 1→1500, 2→1900, 3→2300); `chainAlive` (alive at ×1 and ×3 within the window, broken at/after expiry even with a stale count, broken at 0); `feastDamageMul` (×2→1.08, ×10→1.40, ×1→1.04, expired→1, 0 copies→1, chain 0→1); `towerSpec` feastCount (feast-first=1, two copies=2, feast added to a bolt=1). `tests/content.test.ts` covers the new def automatically.
