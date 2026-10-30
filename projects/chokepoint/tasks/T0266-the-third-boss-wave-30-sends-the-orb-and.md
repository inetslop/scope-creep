---
id: T0266
title: "The third boss: wave 30 sends the Orb, and the Orb splits in two at half health"
assignee: inet-racing
size: L
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T07:33:51Z
claimed_at: 2026-10-30T07:47:12Z
epic: E5
---

## Goal
The run's deepest wave — wave 30, the run's final shape once the level rule (T0260) lands — sends the third boss: the Orb, a big cracked shape that, unless it dies to a single hit first, splits into two faster Shards at half health. E5's promised "one splits at half hp" later boss.

## Details
**The enemies** (two new content files, like the others in src/content/enemies/; both spawnOnly in the Colossus's sense — never in a normal mix, the regular 10-cap untouched):

- **The Orb** (the wave's boss):
  - Description: "The whole wave in one cracked shape: at half health it splits into two Shards that keep walking."
  - Behavior walk, steady on the road. No timed phase — the Colossus's outOfReach is its mechanic; the Orb swaps it for the split.
  - Numbers: hp 720 (the boss 6× Block, wave-scaled like everything), speed 0.9 (Block's), gold 20 (the boss bounty), livesCost 1, threat at the boss level the Colossus's 50 and the Titan's 95 set (≈ its own wave's budget), fromWave 30, size 0.5.
  - Look: a purple hexagon at 0.5 with a thin muted-ink crack line down the middle of its face, painted into its own texture (the Hauler's coin language, T0098) — the standing telegraph that this one splits. No other marks.
  - The split: the moment the Orb's hp first drops to 50% of its max or below after a hit and it is still alive, it splits on the same tick — the Orb is gone with no kill (no gold, no combo, no "stopped" count, no Mint, no by-tower count, no name tag, no leak echo, no Toll), a soft white ring at its spot (T0229's look, 300 ms), and two Shards spawn through the split's own machinery (the Splitter's, core/split.ts) at its exact road position, so the two get the same spacing the Splinters do. Each Shard inherits half of the Orb's hp after the triggering hit (minimum 1 hp each). A single hit that kills the Orb whole — crossing 50% in one hit — is an ordinary boss kill (20 gold, the boss death moment T0258 if it has landed): no Shards.
- **The Shard** (the split's product, the Splinter's pattern T0068 — spawnOnly, no mechanic of its own; it exists to be the piece):
  - Description: "A small, fast piece of a split Orb."
  - Behavior walk. Numbers: hp 180 (a quarter of the Orb's base — the inheritance rule above decides the live value), speed 1.3 (faster than the Orb — the split is a pressure spike), gold 12 (two Shards pay more than the boss bounty they replace), livesCost 1, threat 2, fromWave 30, size 0.2.
  - Look: a purple hexagon at 0.2, no crack. No further split; an ordinary kill. Shards spawn fresh — no slow, root, push, mark or burn carries over from the Orb.

**The wave rule (core/waves.ts):** wave 30's plan is exactly one Orb (delaySec 0), declared the wave's boss by whatever mechanism the boss branch uses today (the plan's declared-boss field if T0256/T0259 have landed), with the every-10 "boss" tag (T0257) — so the preview token row, the preview chip, the banner chip and the one-time teach line all come straight from the plan with no change to those files. Wave 30 is a boss wave, so the quiet/tight treatment never touches it (the boss branch's early return). The second boss (T0259) may land before or after this: add wave 30 as its own case in the boss branch and leave every other wave's plan byte-identical.

**Everything else is automatic:** the name tags say "Orb" on its first spawn in a run and "Shard" on the first split (T0085); an Orb leak and a Shard leak are ordinary 1-life leaks (the warning, the jolt scaled to their size, the combo break, the Toll pay); a Shard kill is an ordinary kill (12 gold, chips, combo, Mint, by-tower count, the last-stand doubling); a wave-30 boss wave held clean counts clean; the save writes at the start of the wave, before spawns, so a mid-fight Orb or Shard is never in a save (a resumed wave 30 re-derives the Orb plan); the enemies reference (T0252) lists the Orb ("wave 30") and the Shard ("from the Orb", the Splinter's "from a Splitter" pattern — the label's parent check must recognize the Orb's split field the way it recognizes splitsInto); the boss card (T0256, if it has landed) shows the Orb's hp while it is alive and hides after the split — the Shard is not the boss — with no phase notch (the Orb has none). No new HUD, no new sound, no new input.

**What it punishes:** the one-big-single-target focus — the moment the Orb splits, two Shards stand where one boss was, 44% faster, and a build tuned to one target has to pick between them. **What it rewards:** the burst — a hit that can carry the Orb from over 50% to zero in one shot (a Reach's heavy shot behind a Mark, a Chain cascade, a Momentum bonus) kills it whole and skips the split. **What counters it:** the area and the line — a Splash burst, a beam corridor, a Spray cone, a Lance line through both Shards — and the Shard's 1.3 is still slower than a Dart, so raw late-wave damage holds.

## Compared with what exists — the Orb
One row for every `walk` enemy; if T0259 has landed by design time, add rows for the Titan (its resistance is carried by its Guard's life — the Orb's split is its own, and it always takes full damage) and the Guard (an escort with a role — the Orb has no escort).

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Dot | `walk` | the steady basic walker; no mechanic at all |
| Dart | `walk` | speed and fragility only; its death ends it |
| Block | `walk`, slow and heavy, the purple family | soaks damage to the end; one shape to the end |
| Sprinter | `walk` | gets faster when hit; never divides |
| Splitter | `walk`, "makes pieces" | its pieces come from its death — two small splinters, the fight continues as it was; the Orb divides mid-life, at half health, while it is still the wave's main threat, into two pieces that keep walking |
| Hauler | `walk`, big and slow | a bigger bank of gold on the road; one shape to the end |
| Mute | `walk` | silences the towers around it — a debuff on the run, not its own survival |
| Ward | `walk`, "do not touch it" | ignores control for its whole life; one shape to the end |
| Bulwark | `walk`, the tough front | halves shots into its face — a direction, not a division |
| Splinter | `walk` | a fast fragment; no mechanic of its own |
| Colossus | `walk`, the boss wave's shape, the purple family | goes out of reach in timed beats — one shape to the end, on a clock; the Orb stays targetable and fully controllable the whole time, and at half health becomes two walking threats instead of one |

## Compared with what exists — the Shard
The Shard's newness is its parent's: the Orb's mid-life split. The Shard itself is a spawnOnly product with no mechanic of its own, exactly as the Splinter is the Splitter's (T0068) — the rows say that plainly instead of inventing a false difference. Add Titan/Guard rows if they have landed (the Shard is a piece of its parent; the Guard is an escort for another enemy's defense).

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Dot | `walk` | walks alone; its death is its own |
| Dart | `walk` | speed and fragility only; no parent |
| Block | `walk` | soaks damage; no parent |
| Sprinter | `walk` | ramps when hit; no parent |
| Splitter | `walk` | makes pieces on its own death; the Shard is a piece of a mid-life split, not a killer |
| Hauler | `walk`, the gold on the road | carries a fortune; no parent |
| Mute | `walk` | silences towers; no parent |
| Ward | `walk` | ignores control; no parent |
| Bulwark | `walk` | wears a plate; no parent |
| Splinter | `walk`, the small fast spawnOnly piece of a bigger shape | a piece of a killed walker; the Shard is a piece of a boss that split mid-life — boss scale of threat, boss gold, and its parent is still the wave's main event |
| Colossus | `walk`, the purple family | is the boss itself; the Shard is what the Orb leaves when it divides |

## Acceptance criteria
- [ ] The wave-30 build-phase preview shows exactly one token — the Orb's — plus the every-10 "boss" chip, and nothing else; the wave sends exactly one Orb at 0 s.
- [ ] The Orb is a purple hexagon (size 0.5) with the crack line, walking at 0.9 with wave-30 scaled hp; the first Orb spawn in a run pops its name tag, later spawns do not.
- [ ] The moment the Orb's hp first drops to 50% or below after a hit and it survives: it splits on the same tick — the Orb is gone with no kill (no gold, no combo bump, no "stopped" count, no Mint, no by-tower count, no name tag, no Toll), a soft white ring at its spot, and two Shards at its road position.
- [ ] Each Shard's hp is half the Orb's hp after the triggering hit (minimum 1 each) — pinned by a unit test (e.g. an Orb hit from 60% down to 44% leaves two Shards at 22% each).
- [ ] A single hit that takes the Orb from over 50% to zero is an ordinary boss kill (20 gold, the boss death moment if it has landed) — no Shards.
- [ ] The Shard is a purple hexagon (size 0.2) without the crack, walking at 1.3; a Shard kill pays 12 with the ordinary kill (chips, combo, Mint, by-tower count, the last-stand doubling); the first Shard in a run pops its name tag once.
- [ ] An Orb leak and a Shard leak each cost exactly 1 life with the ordinary leak (warning, size-scaled jolt, combo break, Toll pay); a wave 30 held clean counts clean.
- [ ] The enemies reference lists the Orb ("wave 30") and the Shard ("from the Orb"); the boss card (if it has landed) shows the Orb's hp while it is alive, hides after the split, and wears no phase notch.
- [ ] Wave 30 is the only wave that sends the Orb or a Shard (both stay out of every normal mix); every other wave is byte-identical to today (wave 10 and 40 keep sending the Colossus; wave 20 sends whatever T0259 has landed, or the Colossus).
- [ ] No new HUD, no new sound, no new input.

## Design (architect, desktop)

### Files
- create `src/content/enemies/orb.ts` - the Orb's `EnemyDef` (id `orb`, name `Orb`, description "The whole wave in one cracked shape: at half health it splits into two Shards that keep walking.", behavior `walk`, hp 720, speed 0.9, gold 20, livesCost 1, threat 150 // a wave-30 budget's worth: it is the wave, fromWave 30, spawnOnly: true, splitsAt: { hpFrac: 0.5, into: 'shard' }, look { shape: 'hexagon', color: 'purple', size: 0.5 })
- create `src/content/enemies/shard.ts` - the Shard's `EnemyDef` (id `shard`, name `Shard`, description "A small, fast piece of a split Orb.", behavior `walk`, hp 180, speed 1.3, gold 12, livesCost 1, threat 2, fromWave 30, spawnOnly: true, no splitsAt/splitsInto, look { shape: 'hexagon', color: 'purple', size: 0.2 })
- create `src/core/midSplit.ts` - pure split rule (see Interfaces); modeled on `core/split.ts`
- create `src/systems/enemyHooks/midSplit.ts` - the hook that performs the split (see Interfaces); modeled on `systems/enemyHooks/split.ts`
- create `tests/core/midSplit.test.ts` - pins the crossing test and the hp inheritance (see Tests)
- edit `src/content/types.ts` - one new optional field on `EnemyDef`, directly after `splitsInto` (line 33)
- edit `src/content/enemies/index.ts` - two imports (orb after colossus, shard after orb) and two `ENEMIES` lines after `colossus,`
- edit `src/core/waves.ts` - the boss branch's one spawn line (wave 30 → `orb`) plus its two doc comments; nothing else
- edit `src/systems/enemyHooks/index.ts` - import + one `ENEMY_HOOKS` line after `split,` (before `nameTag`, so a first Shard is name-tagged the frame it spawns)
- edit `src/art/entities.ts` - one `if (e.id === 'orb')` crack block after the `ward` block in the enemy paint loop
- edit `src/scenes/EnemiesScene.ts` - the parent label (lines 76-77) recognizes `splitsAt`
- edit `src/debug/runChecks.ts` - one invariant line after `['enemies.reach', ...]`
- edit `tests/content.test.ts` - size cap 0.45 → 0.5; a `splitsAt` validation block after the `outOfReach` block
- edit `tests/core/waves.test.ts` - wave 30 now expects the Orb; two new expectations

### Interfaces
```ts
// content/types.ts, EnemyDef, after `splitsInto?: string;`:
/** The mid-life split (the Orb): when its hp first drops to `hpFrac` of its max after a hit and it survives, it vanishes with no kill and leaves two of `into` at its road spot, 0.25 cells either side (core/split.ts), each with half its hp after the triggering hit (core/midSplit.ts). */
splitsAt?: { hpFrac: number; into: string };

// core/midSplit.ts (import type { EnemyDef } from '../content/types'):
export function atSplitLine(def: EnemyDef, hp: number, maxHp: number): boolean {
  return def.splitsAt !== undefined && hp > 0 && hp <= maxHp * def.splitsAt.hpFrac;
}
export function splitChildHp(hp: number): number {
  return Math.max(1, Math.floor(hp / 2));
}

// systems/enemyHooks/midSplit.ts:
import { CELL } from '../../config';
import { getEnemy } from '../../content/enemies';
import { splitDistances } from '../../core/split';
import { atSplitLine, splitChildHp } from '../../core/midSplit';
import { clearRing } from '../fx/clearRing';
import type { MakeEnemyHook } from './hook';
export const midSplit: MakeEnemyHook = ({ board, enemies, fx }) => ({
  update() {
    for (const e of enemies.all) {
      if (!e.active || !atSplitLine(e.def, e.hp, e.maxHp)) continue;
      const child = getEnemy(e.def.splitsAt!.into); // atSplitLine guarantees it
      const half = splitChildHp(e.hp);
      const x = e.x, y = e.y, d = e.distance; // capture before spawning: spawn may recycle this slot
      e.despawn(); // gone with no kill: no gold, no combo, no onKill, no name tag, no Toll, no count
      for (const dd of splitDistances(d, board.path.length)) enemies.spawn(child, half / child.hp, dd);
      clearRing(fx, x, y, e.def.look.size * CELL); // T0229's soft white ring, 300 ms
    }
  },
});
```
Waves boss branch (`core/waves.ts:118`): `return { number: wave, spawns: [{ enemy: wave === 30 ? 'orb' : 'colossus', delaySec: 0 }], hpMul: waveHpMul(wave), tags: ['boss'] };` — keep the `planNormalWave(wave, rng, enemies)` call above it (it consumes the rng so later seeded plans don't shift).
EnemiesScene lines 76-77 become:
```ts
const parent = def.spawnOnly ? ENEMIES.find((d) => d.splitsInto === def.id) ?? ENEMIES.find((d) => d.splitsAt?.into === def.id) : undefined;
const wave = this.add.text(0, 0, parent ? (parent.splitsInto === def.id ? `from a ${parent.name}` : `from the ${parent.name}`) : `wave ${def.fromWave}`, textStyle(12, PALETTE.muted)).setOrigin(1, 0.5);
```
runChecks.ts: `['enemies.orb', (g) => (g.enemies.all.filter((e) => e.active && e.def.id === 'orb').length <= 1 ? null : 'more than one Orb alive')],`

### Steps
1. `types.ts` field → `orb.ts`/`shard.ts` → registry (both import lines and both `ENEMIES` lines, after `colossus`).
2. `core/midSplit.ts`, then `systems/enemyHooks/midSplit.ts` + its two registry lines.
3. `waves.ts` one line + comments.
4. Art: in the `paintEntityTextures` loop, after the `ward` block, one `if (e.id === 'orb')` block: stroke `rgba(PALETTE.muted, 1)`, `lineWidth = Math.max(1, r * 0.1)`, round caps/joins, a slightly jagged vertical line down the face center — `moveTo(cx, cy - r * 0.55)`, `lineTo(cx - r * 0.08, cy - r * 0.06)`, `lineTo(cx + r * 0.06, cy + r * 0.12)`, `lineTo(cx, cy + r * 0.5)`, where `cx = size / 2, cy = size / 2 - depth / 2` (same center as the Splitter's crack). The Shard gets nothing (the generic loop covers it).
5. EnemiesScene label, runChecks invariant.
6. Tests: `content.test.ts` (cap + splitsAt block), `waves.test.ts` (below), new `tests/core/midSplit.test.ts`. Then `npm run check` and `npm run smoke`.
Everything else is automatic and must stay untouched: name tags (the `nameTag` hook labels first spawn of any type), leaks/kills (plain `despawn()` skips `kill()`/`leak()` side effects), preview token row/chip/banner/teach line (read the plan's `spawns`/`tags`), save/resume (wave 30 re-derives its plan), MenuDemo (filters `spawnOnly`). No boss card or boss death moment exists yet (T0256/T0258) — nothing to wire.

### Pitfalls
- `splitsAt` (mid-life) and `splitsInto` (on death) are different fields. Do not put the Orb in `splitsInto`: `crackTick` would draw a live crack line on it, and the death-split hook would split it again on death. The Orb's crack is painted into the texture only.
- The split uses a bare `e.despawn()` — never route the Orb through `kill()` (it is private anyway); that is what keeps gold, combo, onKill hooks, name tag, Mint, Toll and the "stopped" count out.
- A single hit from over 50% to zero dies in `strike()` before the hook's `update` runs, so it is an ordinary boss kill with no Shards — do not add a kill path.
- `enemies.spawn` during the `for...of enemies.all` iteration may push a new pool entry; that is safe (Shards have no `splitsAt`), but capture x/y/distance before spawning, since the first Shard can reuse the Orb's own slot.
- The check runs in the hook `update` (after enemies moved, before towers fire next frame) — the Colossus's `reachClock` uses the same one-tick-late pattern. Known tolerated edge: an Orb that crosses to ≤50% and is then killed by an active Ember burn tick while at ≤~2 hp dies as an ordinary kill instead of splitting; leave it.
- `tests/content.test.ts` asserts `look.size <= 0.45` — the Orb's 0.5 fails it; raise the cap to 0.5, do not shrink the Orb.
- `tests/core/waves.test.ts:144` asserts wave 30 sends the Colossus — update it in the same change or the suite fails.
- EnemiesScene: the Splinter's row must stay byte-identical ("from a Splitter"); the Orb reads "wave 30"; the Shard "from the Orb". The card gains two rows; its existing scale-to-fit (like the codex) handles 412x915 — check it visually.

### Tests
- `tests/core/midSplit.test.ts`: `atSplitLine(orb, 3660, 7320)` true (exactly half), `(orb, 3659, 7320)` true, `(orb, 3661, 7320)` false, `(orb, 0, 7320)` false (a corpse is an ordinary kill); `splitChildHp(316.8)` = 158 (a hit from 60% to 44% of base 720 leaves two Shards at 22% each); `splitChildHp(2)` = 1 and `splitChildHp(0.4)` = 1 (the minimum); a def without `splitsAt` (dot) never fires it.
- `tests/core/waves.test.ts`: the boss test becomes `expect(plan.spawns).toEqual([{ enemy: wave === 30 ? 'orb' : 'colossus', delaySec: 0 }])` for [10, 20, 30, 40]; add "non-boss waves never send the Orb or a Shard" (waves 1-40, skip multiples of 10); add the wave-30 orb plan to the rng-stream test (seeds 1, 7, 42).
- `tests/content.test.ts`: `expect(e.look.size).toBeLessThanOrEqual(0.5)`; after the `outOfReach` block: `if (e.splitsAt) { expect(e.splitsAt.hpFrac).toBeGreaterThan(0); expect(e.splitsAt.hpFrac).toBeLessThanOrEqual(1); expect(ENEMIES.some((d) => d.id === e.splitsAt.into)).toBe(true); }`.
