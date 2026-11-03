---
id: T0456
title: "Chill: the augment that slows what it hits"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-11-03T00:11:22Z
---

## Goal
A new pool augment — Chill — the shot that slows what it hits: each hit adds chill stacks, each stack slows the enemy 10%, up to 5 stacks (50%), and the chill fades 2 s after the last hit. The first slow in the game (stackable, fading, applied by hits) — the answer to rush waves' 1.5× walkers, the boss's steady pace and the Mender's 5-second mends. Its registration retires Toll to keep the draft at 16. This is the T0421 re-file: the card lines this time fit the 70/56 budget.

## Card lines
Chill is a pool card (Common, Rare or Epic at the normal odds) and `opening: true` (offerable in the first draft, like Ember and Beam). `asTower` ≤ 70 chars, `asAdded` ≤ 56 chars, each tier stating its own numbers:
- asTower (Common): "Chills the furthest: 10% per hit, up to 50%; fades 2 s after."
- asTower (Rare): "Chills the furthest: 20% per hit, up to 50%; fades 2 s after."
- asTower (Epic): "Chills the furthest: 30% per hit, up to 50%; fades 2 s after."
- asAdded (Common): "Hits chill 10% each, up to 50%; fades 2 s after."
- asAdded (Rare): "Hits chill 20% each, up to 50%; fades 2 s after."
- asAdded (Epic): "Hits chill 30% each, up to 50%; fades 2 s after."
- Codex description: "A shot that chills the enemy furthest along: each hit slows it 10% per stack, up to 50%, fading 2 s after the last hit."

## Details
- **First form:** `kind shot` — shoots the enemy furthest along (Bolt's targeting): damage 8, range 2.6, rate 1.0/s, projectileSpeed 10 (deliberately under Bolt's 12 @ 1.6 — the slow is the identity; confirm it reads as "weaker than a plain Bolt, never pointless"). Each hit applies the tier's stacks to its target: Common 1, Rare 2, Epic 3.
- **The chill (per enemy):** each stack = 10% slow, cap 5 stacks (50%); all stacks clear at once 2 s after the last hit that applied a stack (one timer per enemy, refreshed by any chill hit). The slow multiplies the enemy's current speed — after the thin road node's 10%, Haste's +30% and a Sprinter's ramp — so a 50%-chilled enemy under a Haste aura walks 0.5 × 1.3 of base. Stacks from any Chill (any tower, any hit) add to the same cap.
- **Added form:** the same stacks-per-hit (1/2/3 by the copy's tier) applied on the tower's hits, on every attack kind: a shot's hit; each enemy a Lance pierce passes (every enemy the line strikes is chilled); each pellet of a Spray volley (a Spray+Chill cone fills the cap in one volley — a 50% slow the tower refreshes ~every 1.2 s); each of a Splash pulse's targets; a Push gust's and an Anchor root's hits (the hit that pushes or roots chills too). Stated no-ops: on a beam (the continuous line has no discrete hits — the beam ships ignoring almost every added augment), on a rally and 0-damage supports (no hits of their own), and on Ember's burn ticks (a burn is Ember's damage, not a hit).
- **Who it touches:** every enemy that walks or flies — both Flyer crossers included, so a chilled boss Flyer flies slow (the spec's "works on the Flyer's flight"). The only exception is the Ward's `ignoresControl` (as push, root and slow): no stack applies, and the Ward's immunity ring (T0335) shows on the attempted chill. A Dasher's committed dash is not slowed (the surge is fixed), a Blinker's blink distance is unchanged.
- **Tiers:** rare {damageMul 1.3, cooldownMul 0.85, stacks 2}, epic {damageMul 1.7, cooldownMul 0.7, stacks 3} (Bolt's curve) on top of the base stacks 1 — so Common is a nudge, Epic hits Bolt's damage and hard-chills (rarity matters in both forms).
- **Look:** icon a green circle, size 0.2 — a shape-and-color pair no other augment uses. On the tower: the shot's barrel in its own green (Chill is a shot, so it wears a barrel like Bolt's); no extra ring on the plinth. On a chilled enemy: a thin green ring at its base (the Chill's own color, like Haste's red and the Mute's purple) while its stacks are live, clearing the moment they fade — nothing above the enemy (status chips over enemies are not in this game, and the green ring is distinct from the Ward's muted immunity ring). The what-if (T0096) shows a compact marker for a held Chill in the existing per-augment marker vocabulary (T0361's pattern); the projectile is the homing bolt's look in its green.
- **Registration and the 16 cap:** the draft index caps at 16 (E4's protocol, T0361's pattern). When Chill registers, if the index is over 16, remove **Toll** — order-independent with the other removals (E4's three retire Rally, Mint and Mark; Herd's registration retires Anchor; none names Toll). Toll's removal: the draft no longer offers it, the codex (T0221) drops its card, and a tower that already holds a Toll keeps it and works exactly as before. The first-draft floor (T0048), the tier odds (T0011) and the no-repeat rule (T0052) are unchanged. As the five registrations land, the index converges on: Beam, Bolt, Chill, Ember, Haste, Lance, Mend, Momentum, Push, Rapid, Reach, Splash, Spray, Trap, Feast, Herd.
- **No new key, button or HUD element;** the pause's controls list is untouched. The panel's existing lines carry it (the card lines state both forms; the green ring on the enemy shows the live slow — no new readout, nothing shown twice).
- **The work lives in new files:** the augment's content file (beside `src/content/augments/`), the chill's per-enemy state and fade (a new core module beside `src/core/burn.ts` — the closest example: a per-enemy applied effect with a timer), and the per-frame tick (a new systems file beside `HasteSystem`); registrations, the tower look and the what-if marker follow the existing augment pattern (T0361's design is the template).

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | `kind shot`, hits the furthest | Bolt's hits deal damage only; Chill's hits also add chill stacks — a stacking, fading slow Bolt can never apply |
| Lance | `kind shot` | Lance's added form pierces (more enemies in the line take damage); Chill's added form slows, applying the stacks to each enemy a pierce passes |
| Rapid | `kind shot` | Rapid changes the tower's own rate and damage (the attack side); Chill changes the target's speed — the same hit does both when combined |
| Reach | `kind shot` | Reach stretches how far the tower sees; Chill's value is what the target does after the hit — it keeps walking 10–50% slow, which extra range only delays |
| Anchor | enemy control | Anchor is a timed full stop (root) with a 2 s immunity after; Chill is a partial slow that re-applies on every hit, has no immunity window, and stacks from many hits and many towers |
| Push | moves an enemy | Push steps the enemy back along the road once per hit (a position change); Chill multiplies the enemy's walk continuously while its stacks live |
| Haste | enemy speed | Haste is a support aura that makes enemies faster; Chill is a per-hit slow on the shot's target — the opposite direction, applied by a hit, not by standing nearby |
| Ember | an effect applied on every hit | Ember's on-hit effect is damage over time (the burn ticks damage); Chill's on-hit effect is speed (the chill ticks nothing — it only keeps the enemy slow until it fades) |

## Acceptance criteria
- [ ] The draft offers Chill as a Common, Rare or Epic card, including in the first draft; the card, hand, tower panel and codex show its green circle and the tier's card lines, each within the 70/56 budget.
- [ ] A Chill tower (the green barrel) shoots the furthest enemy; each hit adds the tier's stacks (1/2/3), 10% slow each, cap 5 (50%).
- [ ] A chilled enemy walks at (1 − 0.1 × stacks) of its current speed, composing with the thin road, Haste and a Sprinter's ramp; all stacks clear at once 2 s after the last chill hit, and the enemy is full speed the moment they fade.
- [ ] An added Chill applies the stacks on every attack kind — a shot's hit, each enemy a Lance pierce passes, each Spray pellet (5 per volley), each Splash target, a Push gust's and an Anchor root's hit — and does nothing on a beam, a rally, a 0-damage support or a burn tick (the stated no-ops).
- [ ] The Ward takes no chill (no stacks, the immunity ring T0335 shows); a Dasher's dash and a Blinker's blink are unslowed; both Flyer crossers' flight is slowed while chilled.
- [ ] On registration, if the index is over 16, Toll is removed from the draft index and the codex; a tower that already has a Toll keeps it and works as before; the other removals (Rally, Mint, Mark, Anchor) are untouched as they land.
- [ ] A chilled enemy wears the thin green base ring while its stacks live, clearing on the fade — nothing above the enemy; a held Chill shows its what-if marker.
- [ ] The game is playable menu to game over with a Chill card in the draft, on desktop and mobile.

## Design (architect, desktop)

### Files
- create `src/core/chill.ts` - pure chill rules (LiveChill, apply/step/pct, constants)
- create `src/content/augments/chill.ts` - the augment def
- create `src/systems/ChillSystem.ts` - per-frame fade tick (owned by GameScene)
- create `tests/core/chill.test.ts` - unit tests
- edit `src/content/types.ts` - `Chill` interface, `FirstForm.chill`, `AddedForm.chill`, `TierValues.chillStacks`
- edit `src/content/augments/index.ts` - register chill, retire toll (RETIRED + KNOWN_AUGMENTS)
- edit `src/core/tiers.ts` - tier replacements for `chill.stacks`
- edit `src/core/augments.ts` - `TowerSpec.chillStacks` + its combination loop
- edit `src/entities/Enemy.ts` - `chill` field, spawn reset, speed factor, `chill()` method
- edit `src/systems/EnemySystem.ts` - `HitPayload.chill`, apply in `strike()`
- edit `src/systems/TowerSystem.ts` - one payload line
- edit `src/systems/ProjectileSystem.ts` - pierce aim lead accounts for chill
- edit `src/systems/ChillSystem.ts` (created) / `src/scenes/GameScene.ts` - wiring
- edit `src/systems/enemyMarks.ts` - green base ring mark
- edit `src/systems/towerGhost.ts` - what-if marker branch
- edit `src/core/saveRun.ts`, `src/art/icons.ts`, `src/art/entities.ts`, `src/debug/runChecks.ts` - retirement plumbing (accept/keep retired augments)
- edit `tests/content.test.ts`, `tests/core/augments.test.ts` - two caps the task's stated lines/numbers exceed (see Steps)

### Interfaces
```ts
// core/chill.ts
export const CHILL_STACK_PCT = 0.1, CHILL_MAX_STACKS = 5, CHILL_FADE_SEC = 2;
export interface LiveChill { stacks: number; left: number; } // stacks 0: not chilled
export function chillPct(c: LiveChill): number;        // min(stacks,5) * 0.1
export function applyChill(c: LiveChill, stacks: number): boolean; // add (cap 5), left = 2, true if fresh
export function chillStep(c: LiveChill, dt: number): void;         // left -= dt; at 0: stacks = 0, left = 0
// content/types.ts (next to `Burn` / `slow` / `burnDps`)
export interface Chill { stacks: number; }
// FirstForm & AddedForm: `chill?: Chill;`  TierValues: `chillStacks?: number;` (replaces stacks in both forms)
// TowerSpec: `chillStacks: number;` (0 = none)  HitPayload: `chill: number;`
// Enemy: `chill: LiveChill = { stacks: 0, left: 0 };`  and `chill(stacks: number): void`
// systems/ChillSystem.ts: `export class ChillSystem { constructor(enemies: EnemySystem); update(dt: number): void; }`
```
Chill def (`content/augments/chill.ts`): `id 'chill'`, `name 'Chill'`, `description` the task's codex line verbatim, `look: { shape: 'circle', color: 'green', size: 0.2 }`, `first: { kind: 'shot', damage: 8, range: 2.6, rate: 1, projectileSpeed: 10, chill: { stacks: 1 } }`, `added: { chill: { stacks: 1 } }`, `opening: true`, and the task's six card lines verbatim with `tiers: { rare: { damageMul: 1.3, cooldownMul: 0.85, chillStacks: 2, asTower: '...20%...', asAdded: '...20%...' }, epic: { damageMul: 1.7, cooldownMul: 0.7, chillStacks: 3, asTower: '...30%...', asAdded: '...30%...' } }`. No `tier`/`minTier`/`tech` fields. No Sfx, no DECORATIONS, no barrel field: the green body and its one standard barrel come from the existing look code (barrels paint in the tower color); a Chill added to another tower shows its card line in the panel, like added Rally.

### Steps
1. Create `src/core/chill.ts` exactly as in Interfaces (mirror `core/burn.ts`'s comment style).
2. `content/types.ts`: add `Chill` after `Burn`; `chill?: Chill` in `FirstForm` (after `slow`) and `AddedForm` (after `slow`); `chillStacks?: number` in `TierValues` (after `burnDps`), doc: "Replaces this copy's chill stacks per hit in both forms (Chill)."
3. Create `src/content/augments/chill.ts` (above).
4. `content/augments/index.ts`: add `import { chill } from './chill';`; in `AUGMENTS` replace the `toll,` line (slot 7) with `chill,` + comment "T0456's registration retires toll (E4's protocol keeps the pool at 16)" — do NOT insert before slot 4 (`tests/core/augments.test.ts:443` slices the first 4 as bolt, lance, splash, spray). Below `AUGMENTS` add: `export const RETIRED: readonly AugmentDef[] = [ toll, // retired by Chill's registration (T0456) ];` and `export const KNOWN_AUGMENTS: readonly AugmentDef[] = [...AUGMENTS, ...RETIRED];`; build `byId` from `KNOWN_AUGMENTS`. If another registration's retirement already landed here, add `toll` to that existing retired list and use that known-export instead of creating a parallel one.
5. `core/tiers.ts`: in `tierFirst` common case add `chill: f.chill ? { ...f.chill } : undefined,`; in the tier case add `chill: f.chill ? { ...f.chill, stacks: t.chillStacks ?? f.chill.stacks } : undefined,`; same two lines in `tierAdded` for `a.chill`.
6. `core/augments.ts`: import `chill` (next to the `anchor` import); add `chillStacks: number` to `TowerSpec` (after `burnCount`), `chillStacks: 0` in `EMPTY` and in `towerSpec`'s spec init; after the Embers loop add: `for (let i = 0; i < augments.length; i++) { const c = augments[i]!; if (getAugment(c.id).id !== chill.id) continue; spec.chillStacks += (i === 0 ? f : tierAdded(getAugment(c.id), c.tier)).chill?.stacks ?? 0; }` (multiple Chills add: a Common over a Rare hits for 3).
7. `entities/Enemy.ts`: import `applyChill, chillPct, type LiveChill` from `../core/chill`; field after `burnSource`; spawn reset `this.chill.stacks = 0; this.chill.left = 0;` (after the burnSource reset); line 246 becomes `const speed = this.rootLeft > 0 ? 0 : this.speed * (1 - this.slowPct) * (1 - chillPct(this.chill)) * (1 + this.hastePct);`; method after `slow()`: `chill(stacks: number): void { if (this.def.ignoresControl) { this.deny = true; return; } applyChill(this.chill, stacks); }` — no `noteControl` (chill has no fatigue/immunity window).
8. `systems/EnemySystem.ts`: `HitPayload` field `chill: number` (after `burn`); in `strike()` after the `payload.slow` line: `if (payload.chill > 0) e.chill(payload.chill);`.
9. `systems/TowerSystem.ts`: in `attack()`'s payload, after `burn: spec.burn,`: `chill: spec.chillStacks,`.
10. `systems/ProjectileSystem.ts`: import `chillPct`; the pierce lead's final term becomes `target.speed * (1 - target.slowPct) * (1 - chillPct(target.chill))` so Lance+Chill bolts don't overlead chilled targets.
11. Create `src/systems/ChillSystem.ts` (Interfaces). `scenes/GameScene.ts`: import (after `Building`), field `chill!: ChillSystem;` after `haste`, `this.chill = new ChillSystem(this.enemies);` after the haste construction, `this.chill.update(simDt);` after `this.haste.update(simDt);`.
12. `systems/enemyMarks.ts`: after the "Slowed" mark add `// Chilled: a thin green ring at its base while its stacks live, gone the moment they fade.` with `(g, e) => { if (e.chill.left <= 0) return; fillRing(g, e.x, e.y + 2, e.def.look.size * 64 + 10, 2.5, 0, Math.PI * 2, PALETTE.green, 0.95); },` (radius +10: between frost's +7 and root's +12 so both can show).
13. `systems/towerGhost.ts`: in `drawMarker`, after the `added.root` branch add `else if (added.chill) { fillRing(g, 0, y, 9, 2, 0, Math.PI * 2, color, 1); }` (before the generic `else`; the draft fit row reuses this, so it is covered too).
14. Retirement plumbing: `saveRun.ts` line 89 and `runChecks.ts:218` check `KNOWN_AUGMENTS.some(...)` (swap their `AUGMENTS` imports); `art/icons.ts` and `art/entities.ts` loop `KNOWN_AUGMENTS` (a tower that still holds a Toll keeps its icon/body textures); `runChecks.ts`: extend `ward.control` with `|| e.chill.stacks > 0` (message: "a Ward is slowed, chilled, rooted or pushed") and add after `enemies.burn`: `['enemies.chill', (g) => (g.enemies.all.every((e) => !e.active || (e.chill.stacks >= 0 && e.chill.stacks <= 5 && e.chill.left >= -1e-9 && e.chill.left <= 2 + 1e-9 && (e.chill.left <= 1e-9 ? e.chill.stacks === 0 : e.chill.stacks > 0))) ? null : 'a broken chill')],`. The codex and draft pool iterate `AUGMENTS`, so Toll drops and Chill joins with no edit.
15. Test caps: `tests/content.test.ts` tier `asTower` cap 56 → 70 (the task's 61-char tier tower lines share the card's 70 budget — same text slot, same wrap, as the base `asTower`; the card grows to fit: fullest state = Rare/Epic Chill with fit row, 4-card grid at 412x915, wrap ≈76px → H ≈ 313, two grid rows end ≈810, fits). `tests/core/augments.test.ts:61`: exclude chill from the wave-1 DPS floor (`a.id !== 'chill'`) with the comment that its hits slow and the slow is what holds wave 1 — the task's 8 @ 1.0 is deliberately under Bolt.

### Pitfalls
- Pooling: reset `chill` in `spawn()` or a recycled enemy walks slowed with a stale green ring.
- Stated no-ops: do NOT wire chill into `BeamSystem`/`beamEffects`, `tickBurn`, `rally.ts` or `beamTick` — the payload/strike path alone covers every attack kind that has hits (shot, pierce, pellets, pulse, Push gust, Anchor root, Mark's strike).
- Don't touch the Dasher's surge line (`Enemy.ts:272`) or the Blinker's step: fixed by design; they must not read `chillPct`.
- `applyChill`/`chillStep` must use `dt` and clamp (`left` never negative, `stacks` never past 5) — the invariant checks it.
- The what-if branch must precede the generic `else` in `drawMarker`, or Chill falls to the plain dot.
- Inserting `chill` before `AUGMENTS` slot 4 breaks `tests/core/augments.test.ts:443`; use toll's slot.

### Tests
- `tests/core/chill.test.ts`: `applyChill` (fresh flag, refresh, cap at 5), `chillPct` (0.1/stack, 0.5 cap), `chillStep` (clears all at once at 2 s, dt > left, no-op at 0), `towerSpec` (chillStacks 1/2/3 by tier as first and added, sums with a second Chill, 0 without), `tierFirst`/`tierAdded` replace stacks by tier.
