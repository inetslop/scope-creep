---
id: T0234
title: "Toll: the Epic that pays gold when a leak gets through"
assignee: inet-racing
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T22:31:19Z
claimed_at: 2026-10-29T23:01:02Z
epic: E4
---

## Goal
A new Epic-only augment with a new economy: income from what the run loses. The first augment that pays when you lose, not when you win.

## Details
- **Rolls only as an Epic card**, the same Epic-only roll as Mark, Rally, Mint and Anchor (T0012, T0020, T0021, T0023): Epic frame, gem row, "· Epic" name line, tier chime; **not offered in the pre-wave-1 draft** (no opening, like Mint); **no tech gate** (it rolls at the Epic odds from the first later draft on, like Mint); the codex (T0221), the what-if preview (T0096), the panel's DPS line (T0084, reads 0 like the other supports) and the end card's by-tower chip (T0216, "kills 0") cover it with no change of their own.
- **Card lines** (both forms, exact):
  - First: "While a Toll tower stands, every leak pays +2 gold."
  - Added: "Each extra Toll: +1 more gold per leak."
- **First form (a support with no attack of its own, like Mint):** while at least one Toll tower stands on the board, every enemy that reaches the exit pays Toll gold, on top of the life cost: each Toll tower contributes **+2 gold**, and each extra Toll copy in a tower contributes **+1 more** (a tower with 2 copies contributes +3, with 3 copies +4; two single-copy Toll towers together pay +4). The gold goes into the run's gold at the leak, handled where the Hauler's leak gold already is (T0057). It is run gold, not coins: the coin formula (T0001), the tally, the claim recipe and the pause worth line are untouched.
- **The moment:** the Toll gold shows as one small gold pop at the exit gate ("+N", N the total, the same gold pop as kill gold) ~100 ms after the leak's jolt. A Hauler leak still costs 1 life + 5 gold: its red "−5" pop stays, and the two pops sit side by side, never overlapping. A leak with no Toll tower on the board pays no gold and shows no pop — byte-identical to today.
- **Not a kill, so not a chain:** Toll gold is never doubled by last stand (T0054) or a quiet wave (T0071), never joins a kill-combo chain (T0031) or its milestone gold (T0066), and never pays a Mint (T0021). The leak itself — life cost, jolt (T0109), combo break (T0207), first-leak chip (T0107), exit warning (T0014) — is unchanged.
- **Look:** a Toll-first tower is a flat muted-gray disc at the tower's base — the Momentum disc's shape (T0064) in the HUD's muted-ink gray (take the palette name the quiet marks like "held · N" and the owned dot use), reading quiet, not a combat token — with one short tick per copy on its rim; an added Toll in any tower shows one small muted-gray tick, the tick language of the other added forms; the slot pip is Epic purple as usual (T0010).
- **Closest existing augment: Mint** (a passive Epic that pays gold without attacking). New: Mint pays per kill within a radius of itself; Toll pays per leak at the exit, from anywhere on the board, when the run loses — which no augment does.
- **16-cap (the augments module):** the pool caps at 16 augments — after registering, if the pool has more than 16, also remove the first of **Frost, then Rally, then Mint** that is still in the AUGMENTS index (a mechanical deletion, T0192's pattern; the full protocol is in T0064's task) and say which in the result.

## Compared with what exists

| Existing | What it shares | What Toll does that it can't (not numbers) |
| --- | --- | --- |
| Mint | `kind pulse` first form, 0 damage; gold economy | Mint pays per kill within 2 cells of itself; Toll pays per leak at the exit, from anywhere on the board, when the run loses |
| Splash | `kind pulse` first form | Splash's pulse damages around the tower; Toll's "pulse" touches no enemy at all — it reads the leak |
| Frost | `kind pulse` first form | Frost's pulse slows enemies on the road; Toll never slows, moves or touches an enemy |
| Push | `kind pulse` first form | Push's pulse pushes enemies back along the road; Toll never moves an enemy |
| Anchor | `kind pulse` first form | Anchor's pulse roots enemies; Toll never stops an enemy |

## Acceptance criteria
- [ ] The draft offers Toll only as an Epic card (Epic frame, gem row, "· Epic" name line, tier chime), never in the pre-wave-1 draft; the codex lists it with both lines.
- [ ] With one Toll tower on the board, a leaking Dot pays +2 gold: a gold "+2" pop at the exit gate, the run's gold up by 2, the life cost unchanged; with no Toll tower the same leak pays nothing and pops nothing.
- [ ] A tower with 2 Toll copies pays +3 on a leak; two single-copy Toll towers pay +4 in total on one leak.
- [ ] A Hauler leak still costs 1 life and 5 gold: the red "−5" pop and the Toll gold pop both appear, side by side, not overlapping.
- [ ] Toll gold is not doubled by last stand or a quiet wave, never joins a combo chain or its gold, never pays a Mint; the coin tally, claim recipe and pause worth line are unchanged.
- [ ] A Toll-first tower is the flat muted-gray disc with one tick per copy; an added Toll shows one muted-gray tick on any tower; the Epic purple pip is as usual; works at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- create `src/content/augments/toll.ts` - the Toll AugmentDef (Epic-only, pulse first form, exact card lines)
- create `src/core/toll.ts` - pure leak-pay math (`tollPay`), model on `core/mint.ts`
- create `src/systems/enemyHooks/tollLeak.ts` - the onLeak hook: pay gold + delayed pop at the exit
- create `tests/core/toll.test.ts` - unit tests for the +2/+1 rule and `tollPay`
- edit `src/content/types.ts` - add `goldPerLeak?` to `FirstForm` and `AddedForm`
- edit `src/content/augments/index.ts` - import + one list entry next to `mint`; check the 16-cap
- edit `src/core/augments.ts` - two `TowerSpec` fields, EMPTY/init values, the combine loop, one `describeSpec` clause
- edit `src/systems/enemyHooks/index.ts` - import + one list entry after `haulerLeak`
- edit `src/entities/towerLook.ts` - one `DECORATIONS` entry after the Mint entry
- edit `tests/content.test.ts` - add the new field to the first-form effect check (line 51)
- edit `src/debug/runChecks.ts` - one invariant line next to `towers.gold`

### Interfaces
```ts
// content/types.ts — FirstForm (after goldRadius) and AddedForm (after goldPerKill):
/** Every leak pays this much gold while the tower stands (Toll). */
goldPerLeak?: number;
// core/toll.ts:
export interface TollTower { spec: TowerSpec }
export function tollPay(towers: readonly TollTower[]): number; // sum of spec.tollPerLeak
// core/augments.ts TowerSpec (after goldRadius):
tollPerLeak: number; // 0 without a Toll; the first copy's first form + each extra copy's added form
tollCount: number;   // Toll copies in the tower: one tick each
```
`toll.ts` def (copy `mint.ts`): `id 'toll'`, `name 'Toll'`, `description 'Every leak pays +2 gold while a Toll tower stands. Added: +1 more per leak.'`, `asTower: 'While a Toll tower stands, every leak pays +2 gold.'`, `asAdded: 'Each extra Toll: +1 more gold per leak.'`, `look: { shape: 'circle', color: 'yellow', size: 0.2 }` (unique pair; never `square pink`), `first: { kind: 'pulse', damage: 0, range: 1, rate: 1, goldPerLeak: 2 }`, `added: { goldPerLeak: 1 }`, `tier: 'epic'`, no `opening`, `tiers: { rare: { asAdded: 'Each extra Toll: +1 more gold per leak.' }, epic: { asAdded: 'Each extra Toll: +1 more gold per leak.' } }` with the mint comment.

### Steps
1. `content/types.ts`: the two `goldPerLeak?` fields with the comments above.
2. `content/augments/toll.ts`: the def above.
3. `content/augments/index.ts`: `import { toll } from './toll';` after the `spray` import (alphabetical); `toll,` in `AUGMENTS` on the line after `mint,`. Then count entries: 15 ≤ 16, so **remove nothing** and say "16-cap: pool is 15, no removal". If you actually find 16+ entries, remove the first of `frost`, `rally`, `mint` still present (its import line and list line) and say which.
4. `core/toll.ts`: `TollTower` + `tollPay` (sum `spec.tollPerLeak`).
5. `core/augments.ts`: fields in `TowerSpec` and `0` in `EMPTY` and in the `towerSpec` init (after `goldRadius`); after the Mints line (line 215) add the loop: for each copy `if (a.id !== 'toll') continue; spec.tollCount += 1; spec.tollPerLeak += i === 0 ? a.first.goldPerLeak ?? 0 : a.added.goldPerLeak ?? 0;` (like the Marks loop, reading the raw def); in `describeSpec` after the gold lines add `if (spec.tollPerLeak > 0) line += `, every leak pays +${spec.tollPerLeak} gold`;`.
6. `systems/enemyHooks/tollLeak.ts`:
```ts
export const tollLeak: MakeEnemyHook = ({ run, fx, towers }) => ({
  onLeak(enemy) {
    const pay = tollPay(towers());
    if (pay <= 0) return; // no Toll tower stands: byte-identical to today
    const x = enemy.x, y = enemy.y; // captured: it returns to the pool before the pop lands
    run.gold += pay; // run gold, not coins: the tally and claim recipe never see it
    fx.scene.time.delayedCall(100, () => fx.popText(x - 40, y - 20, `+${pay}`));
  },
});
```
7. `systems/enemyHooks/index.ts`: import next to `haulerLeak`; `tollLeak,` in `ENEMY_HOOKS` on the line after `haulerLeak,`.
8. `entities/towerLook.ts`: new entry in `DECORATIONS` after the Mint entry: if `spec.tollCount === 0` return; if `spec.firstId === 'toll'` draw `g.fillStyle(PALETTE.muted, 1); g.fillCircle(0, 4, BODY * 1.5)` (4 = the body's lift above the plinth center, as in `Tower.ts`), then for each copy `fillRing(g, 0, 4, BODY * 1.5, 3, a - 0.14, a + 0.14, PALETTE.ink)` with `a = -Math.PI / 2 + (i / spec.tollCount) * Math.PI * 2`; else for each copy `fillRing(g, 0, 0, BODY * 1.8, 3, a - 0.12, a + 0.12, PALETTE.muted)` with `a = Math.PI / 2 + (i / spec.tollCount) * Math.PI * 2` (the Rapid-tick language, muted).
9. `tests/content.test.ts` line 51: add `|| a.first.goldPerLeak` next to `a.first.goldRadius`.
10. `tests/core/toll.test.ts`: via `towerSpec([{ id, tier: 'epic' }])` — one toll → `tollPerLeak 2`, two → `3`, three → `4`; `tollCount` matches; `['bolt','toll']` → `1`, `['bolt','toll','toll']` → `2`; `tollPay` sums two toll towers (2 + 3 = 5) and is 0 with none; a toll-first spec is `kind 'pulse'`, `damage 0`.
11. `debug/runChecks.ts` after `towers.gold`: `['towers.toll', (g) => { for (const t of g.towers.towers) if (!Number.isInteger(t.spec.tollCount) || t.spec.tollCount < 0 || t.spec.tollCount > t.augments.length) return \`toll ${t.spec.tollCount} at (${t.cell.col}, ${t.cell.row})\`; return null; }],`
12. `npm run check`, then `npm run smoke`.

### Pitfalls
- **Pooling**: capture `enemy.x/y` before the 100 ms `delayedCall` — the enemy is despawned in `leak()` and may be respawned elsewhere before the pop lands.
- **Gold path**: `run.gold += pay` directly (Hauler's pattern). Never `run.addKill` — it increments `run.kills` and `goldEarned`, which would corrupt the end card's "Stopped N" and the coin tally; also keep it out of the kill flow so last stand, quiet wave, combos and Mint never touch it.
- **Pop geometry**: life pop at `x`, Hauler "−5" at `x + 40`; put Toll at `x − 40` so the three sit side by side.
- **content.test.ts**: forgetting the line-51 field fails the suite; `look` must keep the shape+color pair unique (circle+yellow is free; square+pink is locked to anchor/mark/mint).
- **Line lengths**: `asTower` ≤ 70, tier `asAdded` ≤ 56 chars (both fit exactly as given).
- No FxSystem methods (project rule): the pop is `fx.popText` + `fx.scene.time.delayedCall`, the `mintPop` idiom; the call is cancelled on scene shutdown automatically.
- A bare Toll tower must not attack: `TowerSystem.update`'s pure-support check already skips it (damage 0, no effects) — do not touch TowerSystem. The Epic card frame, gem row, "· Epic" name line, tier chime, codex entry, what-if ghost (fallback marker), panel DPS (0, hidden) and "kills 0" all come from `tier: 'epic'`/`spec` generically — no changes there.
- The disc is a flat `fillCircle` in `PALETTE.muted` (the "held · N"/owned-dot gray) with ink rim ticks; no texture, no shadow, no rotation.

### Tests
- `tests/core/toll.test.ts` (new, above) — the +2/+1 per-copy rule and the board sum a later change could silently break; the `tests/content.test.ts` edit keeps the auto content validation green.
