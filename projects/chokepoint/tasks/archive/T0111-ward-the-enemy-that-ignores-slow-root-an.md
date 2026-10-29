---
id: T0111
title: "Ward: the enemy that ignores slow, root and push"
assignee: cachyos-x8664
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-29T08:18:07Z
claimed_at: 2026-10-29T14:45:17Z
finished_at: 2026-10-29T15:16:37Z
---

## Goal
The enemy queue's next entry (the Bulwark, T0102, is up to land first): a plain slow walker that completely ignores slow, root and push — the first enemy that punishes a control build, so a Frost/Anchor/Push choke needs a real damage line to hold the run.

## Details
- Closest existing enemy: Block (a plain slow walker). What is new: control immunity — it survives by making the board's whole control family useless (Frost's slow, Anchor's root, Push's gusts all pass through it), so a control-heavy build must pair it with damage (Bolt, Splash, Ember, Chain, Beam, Pulse) to stop it. No existing enemy ignores control: the Mute disables towers, the Sprinter speeds up when hit, the Dasher bursts — but nothing shrugs off slow, root or push.
- Look: Block's round — a circle at Block's size — in red (a repeated family color: the warm palette is closed, T0074's lesson), with one thin dark ring around its edge in the token's darker side-face red (armor — still, not pulsing), the usual darker side face and soft shadow. The still ring carries the "immune" meaning, and it is the silhouette no other enemy has.
- Movement: Block's speed, walks (no behavior besides the immunity).
- Survivability: 1.5× Block's hp; wave escalation applies as usual. Threat 1 (Block's). Gold: the normal Block bounty. Leak: 1 life, as usual.
- Immunity rule: while a Ward is on the board, Frost's slow (first and added forms), Anchor's root (the timed full stop, first and added) and Push's gusts and per-hit pushes all pass through it with no effect — it does not slow, stop, stagger or move back (the gust and the Push windup fire normally, they just don't move it). Damage from every source — directed shots, pulse rings, trap springs, the beam, burn ticks — is full and unaffected by the immunity.
- Waves: from wave 15, one Ward on waves 15, 20, 25, 30, … — reserved in the wave plan and kept out of the budget picks (the Hauler/Mute/Bulwark pattern). The wave-20 slot yields to the boss when E5 opens.
- Its death is an ordinary kill: gold, combo, Mint, the kills line and the "stopped" count all fire normally. The name tag (T0085) announces "Ward" on its first spawn; the wave preview, icon and sounds pick it up the way the Hauler's did (T0057).
- It lives in its own content file (the Mute's own-files pattern, T0074 / the Bulwark's, T0102), so it lands beside the shared-augment queue and beside the in-progress Beam (T0073).

## Acceptance criteria
- [ ] From wave 15 on, waves 15, 20, 25, … each contain exactly one Ward (reserved in the plan, not added by the budget picks); waves 1–14 are byte-identical to today.
- [ ] A Frost tower's slow, an Anchor's root and a Push's gust have no effect on a Ward: it walks at Block's speed through a slowed, rooted and pushed group, never stops, and is not moved back.
- [ ] A Ward takes full damage from every source (directed shots, pulse rings, trap springs, the beam, burn ticks) — the immunity reduces nothing.
- [ ] The token is a red circle at Block's size with one thin dark ring around its edge (the armor), the darker side face and soft shadow; the ring is still (not pulsing).
- [ ] A Ward leak costs 1 life like any enemy's; its kill pays the normal gold with the normal pop, and the kills line counts it.
- [ ] The first spawn shows the "Ward" name chip (T0085); the wave preview shows its token and count.

## Design (architect, baby-mama)

### Files
- `src/content/enemies/ward.ts` (new): `ward: EnemyDef` — `id: 'ward'`, name 'Ward', behavior 'walk', `hp: 180` (1.5× Block's 120), `speed: 0.9`, `gold: 10`, `livesCost: 1`, `threat: 1` (placeholder, like Hauler/Mute), `fromWave: 15`, `ignoresControl: true`, look `{ shape: 'circle', color: 'red', size: 0.26 }` (Block's size; the ring is the new silhouette).
- `src/content/types.ts`: one optional field on `EnemyDef`, next to `dashCycle`.
- `src/content/enemies/index.ts`: import line + list entry after `mute`.
- `src/entities/Enemy.ts`: immunity guards in `slow()`, `root()`, `pushBack()`.
- `src/core/waves.ts`: walkers filter + reservation + quiet-keep, Mute-style.
- `src/art/entities.ts`: ring special case in `paintEntityTextures`, modeled on the hauler block.
- `src/debug/runChecks.ts`: one invariant line.
- `tests/core/waves.test.ts`: reservation test.

### Interfaces
- `EnemyDef.ignoresControl?: boolean` — "ignores all control: Frost slow, Anchor root, Push gusts and per-hit pushes, first and added forms"; read only by `Enemy.ts`.
- `planWave(wave, rng, ENEMIES)`: exactly one `'ward'` in `finalSpawns` iff `wave >= 15 && wave % 5 === 0 && wave !== 20` (wave 20 is the E5 boss slot); Ward excluded from the walkers budget pick; a quiet wave always keeps its Ward (Mute pattern).
- `Enemy.slow(pct, sec)`, `root(sec)`, `pushBack(units)`: return early when `this.def.ignoresControl` — the only entry points for control (all effects flow through `EnemySystem.ts:146-148`), so no `advance()` changes: the fields stay 0 and it walks at base speed, taking full damage from every source.

### Steps
1. `ward.ts`: copy `block.ts`'s shape, the values above, a plain one-line `description` (e.g. "Unstoppable: slow, roots and gusts do not touch it; every hit still lands.").
2. `types.ts`: `/** Ignores all control: Frost slow, Anchor root, Push gusts and pushes, both forms. */ ignoresControl?: boolean;`.
3. `index.ts`: `import { ward } from './ward';` (after `./sprinter`) and `ward,` after `mute,` in `ENEMIES`.
4. `Enemy.ts`: `slow()`: first line `if (this.def.ignoresControl) return;`; `root()`: same guard before `applyRoot`; `pushBack()`: extend the existing guard to `if (!this.active || this.def.ignoresControl || units <= 0) return;`.
5. `waves.ts`: (a) walkers filter (line 98) add `&& e.id !== 'ward'`; (b) after the Mute line (134): `// The Ward: one on 15, 25, 30, ... — wave 20 is the boss's slot (E5).` then `if (wave >= 15 && wave % 5 === 0 && wave !== 20) reserved.push('ward');`; (c) after the Mute keep line (153), the same pattern: `if (wave >= 15 && wave % 5 === 0 && wave !== 20 && !finalSpawns.some((s) => s.enemy === 'ward')) finalSpawns = [{ enemy: 'ward', delaySec: 0 }, ...finalSpawns];`.
6. `art/entities.ts`: in the enemy `paintTexture` callback, after the hauler block: `if (e.id === 'ward')` — still thin ring, `ctx.strokeStyle = rgba(deepOf(e.look.color), 1)`, `ctx.lineWidth = Math.max(1, r * 0.16)`, `ctx.arc(cx, cy, r * 0.88, 0, Math.PI * 2)` at the face center (`size / 2`, `size / 2 - depth / 2`), stroke. No tween, no rotation (painted into the texture; `deepOf`/`rgba` already imported).
7. `runChecks.ts`: `['ward.control', (g) => g.enemies.all.some((e) => e.active && e.def.id === 'ward' && (e.slowPct > 0 || e.rootLeft > 0 || e.pushLeft > 0)) ? 'a Ward is slowed, rooted or pushed' : null],` next to `mute.jam`.
8. `waves.test.ts`: `it('sends exactly one Ward on 15, 25, 30, ... — wave 20 is the boss slot, a quiet wave keeps it')`: loop wave 1..40, `expected = wave >= 15 && wave % 5 === 0 && wave !== 20 ? 1 : 0`, expect the `'ward'` count in `planWave(wave, new Rng(wave), ENEMIES)` to be `expected` (covers waves 1–14 unchanged and the wave-40 quiet keep).

### Pitfalls
- `threat: 1` alone does NOT keep it out of the budget: the walkers filter must carry `e.id !== 'ward'` or the cheapest enemy wins the picks from wave 15 (same as Hauler/Mute).
- Push the Ward AFTER the splitter count (it sits after the Mute line): before it, the Ward would count toward the one-per-seven splitter ratio.
- Wave 20 is quiet AND a Ward slot; both the push and the keep line must guard `wave !== 20`, so the slot stays empty for E5.
- Wave 40 is quiet and on schedule: without the Mute-style keep line the quiet halving drops the Ward and the 15/20/25/30/… schedule silently breaks from wave 40.
- No edits needed for the name chip, wave preview, menu icon or sounds: `nameTag.ts` keys off `def.name`, and `NextWavePreview`/`MenuDemo` draw `enemyTexture(id)` — Ward's ringed texture is picked up automatically (the Hauler's way).
- The ring is still (never tweened or rotated): the shading in the texture must stay at the bottom.

### Tests
- `tests/content.test.ts` validates the new def (unique id, fromWave, threat > 0) automatically.
- New `waves.test.ts` case per step 8; existing Hauler/Mute tests stay green (Ward never drawn from the budget, waves 1–14 plans unchanged).
- `npm run check` (typecheck + lint + unit) and `npm run smoke` (desktop + phone) must pass; at smoke, watch wave 15 first spawn for the "Ward" name chip and the ringed token in preview and on the road.

## Result (attempt 1, cachyos-x8664)

Added the Ward enemy — a plain Block-sized red walker that ignores all control (Frost slow, Anchor root, Push gusts and per-hit pushes, both forms) while still taking full damage from every source. New def in `src/content/enemies/ward.ts` (hp 180, speed 0.9, gold 10, 1 life, threat 1 placeholder, fromWave 15, `ignoresControl`), registered in `src/content/enemies/index.ts`; `ignoresControl` field on `EnemyDef` (`src/content/types.ts`) with guards in `src/entities/Enemy.ts` (`slow`/`root`/`pushBack`); reserved one-per-wave on 15/25/30… (wave 20 left for the E5 boss) in `src/core/waves.ts` with the walkers filter + quiet-keep; the still armor ring painted in `src/art/entities.ts`; `ward.control` invariant in `src/debug/runChecks.ts`; reservation test in `tests/core/waves.test.ts`. `npm run check` (241 tests) and `npm run smoke` (desktop + mobile) both pass.

- Self-review: APPROVE
- Time: 31.3 min

```
projects/chokepoint/game/src/art/entities.ts          |  9 +++++++++
 projects/chokepoint/game/src/content/enemies/index.ts |  2 ++
 projects/chokepoint/game/src/content/enemies/ward.ts  | 16 ++++++++++++++++
 projects/chokepoint/game/src/content/types.ts         |  2 ++
 projects/chokepoint/game/src/core/waves.ts            |  6 +++++-
 projects/chokepoint/game/src/debug/runChecks.ts       |  1 +
 projects/chokepoint/game/src/entities/Enemy.ts        |  4 +++-
 projects/chokepoint/game/tests/core/waves.test.ts     | 10 +++++++++-
 8 files changed, 47 insertions(+), 3 deletions(-)
```
