---
id: T0147
title: First Proof — the first kill of each type pays
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-27T21:50:56Z
---

## Goal
The marginalia teaches you a new shape; the First Proof pays you for meeting it. The first kill of each enemy type in a run drops one extra shard, so the run's bestiary is worth completing.

## Details
- A new drop rule, owned by a **pure rule module in `src/core/`** (the rest/underexposure pattern) with unit tests: a per-run set of proven types, `firstKill(id)` true exactly once per id.
- The rule: the first time in a run you kill a given **director-spawnable enemy type** — Wedge, Dart, Block, Sentry, Splitter, Hare, Platen, Wash (the types the spawn director unlocks on its own) — that kill drops **one extra normal shard** at the kill position, on top of the enemy's normal drops. Spawn-only kin (Splinter, The Frame's wedge minion) and boss parts (type blocks, swatches) are excluded.
- Elite or normal: whichever variant dies first for a type claims the proof.
- The extra shard is a normal shard: same size, motion and pickup as the enemy's normal drops, worth the same as one of them — **no gilt roll** (a clean bonus), no new art. It drops through the normal shard drop path, so it obeys everything a normal shard obeys: Gravity's pickup radius, the Varnish push (T0139), and the Gallery study rules (in No Level-Ups, T0129, it grants no XP like every other shard there).
- A small flat ink ring pops at the extra shard's drop point (the first-light ring idiom, T0138: ~8→24 u, 300 ms fade) — the proof is seen where it lands. No new sound.
- Once per type per run; a fresh run starts clean; per run, not persisted.
- No new key, scene, HUD element, marginalia, or change to stat, spawn, hazard, weapon, clock or music.
- Unit tests lock: the first kill of a type is true, the second is false, different types are independent (a kill of one type does not consume another type's proof), and a fresh run has no proofs.

## Acceptance criteria
- [ ] The first time you kill each of the eight director-spawnable enemy types in a run, that kill drops one extra normal shard at the kill position on top of the normal drops, with a small ink ring pop at the drop point.
- [ ] The second and later kills of the same type drop only the normal shards (no ring, no extra).
- [ ] An elite kill claims the type's proof the same way a normal kill does.
- [ ] Killing spawn-only kin (Splinter, Frame Wedge) or boss parts drops no extra shard.
- [ ] The extra shard behaves like a normal shard in every respect except the gilt roll (no gilt), and obeys the Gallery study rules (in No Level-Ups it grants no XP).
- [ ] A pure rule module with unit tests (first-kill true, repeat false, types independent, fresh run clean); the full gate (typecheck, lint, unit tests, desktop + mobile smoke) passes.

## Design (architect, desktop)

### Files
- create `src/core/proof.ts` — pure rule module: per-run set of proven enemy ids, `firstKill(id)` true exactly once per id (rest/underexposure pattern; no Phaser, no content imports)
- create `tests/core/proof.test.ts` — unit tests (below)
- edit `src/core/run.ts` — one new field on `RunState`
- edit `src/systems/PickupSystem.ts` — `drop()` gains a `noGilt` parameter (skips the gilt roll)
- edit `src/systems/FxSystem.ts` — new `proofRing(x, y)` reusing the existing `firstLightRings` emitter (T0138 idiom: 8→24 u, 300 ms, ink). No new emitter, art or sound
- edit `src/systems/CombatSystem.ts` — `killEnemy` claims the proof and drops one extra normal shard at the kill position. This is the single enemy-death path (projectiles, Arc and Orbit all route through it)
- edit `src/scenes/GameScene.ts` — enemy-registry import + a `first-proof` invariant in `registerInvariants()`

### Interfaces
```ts
// src/core/proof.ts — the only new type
export class FirstProof {
  firstKill(id: string): boolean; // true exactly once per id per run
  isProven(id: string): boolean;
  get count(): number;
  get ids(): string[];            // copy of the proven ids
}
// PickupSystem.drop gains a trailing optional param; every existing call site (CombatSystem, BossSystem ×2) is untouched:
drop(x: number, y: number, value: number, noGilt?: boolean): void;
```

### Steps
1. Create `src/core/proof.ts`:
```ts
/**
 * First proof (pure logic). The first kill of each enemy type in a run is "proven":
 * `firstKill(id)` returns true exactly once per id, and false for every later kill.
 * Per run only, never persisted — a fresh run starts clean. The caller decides which
 * ids are eligible (the director-spawnable types, spawnWeight > 0).
 */
export class FirstProof {
  private readonly proven = new Set<string>();

  /** True exactly once per enemy id per run. */
  firstKill(id: string): boolean {
    if (this.proven.has(id)) return false;
    this.proven.add(id);
    return true;
  }

  /** True once this type's proof has been paid. */
  isProven(id: string): boolean {
    return this.proven.has(id);
  }

  /** How many types have been proven this run. */
  get count(): number {
    return this.proven.size;
  }

  /** The proven ids so far (a copy; the smoke invariant reads this). */
  get ids(): string[] {
    return [...this.proven];
  }
}
```
2. `src/core/run.ts`: insert `import { FirstProof } from './proof';` between the `./fermata` and `./progression` imports; insert the field right after `readonly vignette = new VignetteState();`:
```ts
  /** First proof (core/proof.ts): the first kill of each director-spawnable type pays one extra shard. */
  readonly firstProof = new FirstProof();
```
3. `src/systems/PickupSystem.ts`: replace the first two lines of `drop()` with:
```ts
  /** Drops one shard at (x, y). With `noGilt` the gilt roll is skipped (the First Proof shard is a clean bonus). */
  drop(x: number, y: number, value: number, noGilt = false): void {
    const gilt = noGilt ? false : rollGilt(this.run.rng);
```
(rest of the method unchanged — pool-full direct-collect, pickup sfx and gilt pop all stay)
4. `src/systems/FxSystem.ts`: insert after the `firstLightRing(x, y)` method:
```ts
  /** First proof paid: the extra shard lands — one small flat ink ring at the drop point (same idiom as first light). */
  proofRing(x: number, y: number): void {
    this.firstLightRings.explode(1, x, y);
  }
```
5. `src/systems/CombatSystem.ts`: in `killEnemy`, insert between the `} else { this.pickups.drop(e.x, e.y, e.def.xp); }` block and `this.run.kills += 1;`:
```ts
    // First proof: the first kill of each director-spawnable type (spawnWeight > 0) pays one extra
    // normal shard at the kill position, no gilt roll. Spawn-only kin (Splinter, Frame Wedge) never claim one.
    if (e.def.spawnWeight > 0 && this.run.firstProof.firstKill(e.def.id)) {
      const proofValue = e.elite ? e.def.xp * (ELITE.xpMul / ELITE.shardCount) : e.def.xp; // same as one of its normal drops
      this.pickups.drop(e.x, e.y, proofValue, true);
      this.fx.proofRing(e.x, e.y);
    }
```
(`ELITE` is already imported. Elite and normal both claim; value equals one of that kill's own normal drops, so size/scale match.)
6. `src/scenes/GameScene.ts`: add `import { ENEMIES, ENEMY_BY_ID } from '../content/enemies';` as the first import line (before the `PALETTE` import). In `registerInvariants()`, insert after the `rest` invariant:
```ts
    hook.addInvariant('first-proof', () => {
      const provable = ENEMIES.filter((e) => e.spawnWeight > 0);
      if (this.run.firstProof.count > provable.length) return `${this.run.firstProof.count} proofs, only ${provable.length} provable types`;
      for (const id of this.run.firstProof.ids) {
        const def = ENEMY_BY_ID.get(id);
        if (!def || def.spawnWeight <= 0) return `proof claimed for non-provable type "${id}"`;
      }
      return null;
    });
```
Do not touch `bindSceneEvents()` — the existing SHUTDOWN handler already calls `hook.clearInvariants()`, which removes it.
7. Create `tests/core/proof.test.ts` (below), then run `npm run check` and `npm run smoke`.

### Pitfalls
- Eligibility is data, not a list: `def.spawnWeight > 0` is exactly "director-spawnable" (splinter and frame-wedge are 0). Type blocks and swatches are not `Enemy` instances and never reach `killEnemy`, so boss parts are excluded automatically. Do not hardcode the eight ids anywhere.
- Only the proof call passes `true`; never call `rollGilt` when `noGilt` (clean bonus — no rng draw either).
- If the shard pool (350) is full the proof shard takes the same direct-collect branch as any shard: `gilt=false` means plain pickup sound, no gilt pop. Do not special-case it.
- Do not add a particle emitter — reusing `firstLightRings` leaves the `setDepth` loop in the FxSystem constructor untouched.
- Splitter: its death claims the splitter proof, and its two splinter children then claim nothing (spawnWeight 0). No double pay.
- Parallel edits: T0139 (same machine, in-progress) and T0146 (desktop) also touch `run.ts`, `PickupSystem.ts` and `FxSystem.ts`. Re-read those files before editing and place each new line beside its neighbours — line numbers above may be stale, but the anchor points (named methods/fields) are stable.
- The Gallery "No Level-Ups" rule (T0129) does not exist yet: nothing to implement. The proof shard drops through the normal shard path, so it will inherit that rule for free.

### Tests
`tests/core/proof.test.ts` (vitest, style of `tests/core/rest.test.ts`):
```ts
import { describe, expect, it } from 'vitest';
import { FirstProof } from '../../src/core/proof';
import { RunState } from '../../src/core/run';

describe('first proof', () => {
  it('a fresh state has no proofs', () => {
    const p = new FirstProof();
    expect(p.count).toBe(0);
    expect(p.ids).toEqual([]);
    expect(p.isProven('wedge')).toBe(false);
  });

  it('the first kill of a type is true, the second is false', () => {
    const p = new FirstProof();
    expect(p.firstKill('wedge')).toBe(true);
    expect(p.firstKill('wedge')).toBe(false);
    expect(p.firstKill('wedge')).toBe(false);
    expect(p.isProven('wedge')).toBe(true);
    expect(p.count).toBe(1);
  });

  it('different types are independent: killing one does not consume another', () => {
    const p = new FirstProof();
    expect(p.firstKill('wedge')).toBe(true);
    expect(p.firstKill('dart')).toBe(true);
    expect(p.firstKill('wedge')).toBe(false);
    expect(p.firstKill('dart')).toBe(false);
    expect(p.count).toBe(2);
  });

  it('a fresh run starts clean', () => {
    const a = new RunState(7);
    expect(a.firstProof.firstKill('block')).toBe(true);
    const b = new RunState(8);
    expect(b.firstProof.firstKill('block')).toBe(true); // never persisted: a fresh run claims it again
    expect(b.firstProof.count).toBe(1);
  });
});
```
