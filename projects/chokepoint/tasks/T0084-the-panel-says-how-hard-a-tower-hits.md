---
id: T0084
title: The panel says how hard a tower hits
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
epic: E4
---

## Goal
A first-time player can compare towers at a glance: the tower panel shows each tower's expected damage per second, one number that moves as augments are added.

## Details
- A new muted line at the bottom of the tower panel, under the kills line (T0070): "≈ N/s" — N is the tower's expected damage per second against **one** enemy, read from the tower's accumulated spec (the same effective values the tower's attacks actually use — tier applied, added forms applied), one term per augment in the tower:
  - Shot attacks (Bolt, Lance, Rapid, Reach, Splash): the attack's effective damage × its attacks per second. Pierce, Splash's burst and any second target do not count — the line is one enemy; Splash counts its primary hit only.
  - Ember (T0028) added: its burn's per-second rate (3/4/5 by tier) is added on top of the host's shot term.
  - Support augments (Frost, Push, Anchor, Mark, Mint, Rally): 0 — they deal no damage to that enemy.
  - The "≈" says it is an estimate; N is floored to a whole number; a tower whose total is under 1/s (a pure support tower) shows no line at all.
  - When Chain (T0025) and Beam (T0073) land, they contribute their primary-strike terms (Chain: one strike per attack; Beam: its per-second rate, main beam only) — the spec is written so each augment kind adds exactly one term.
- New pure module (e.g. `src/core/towerDps.ts`) with the per-kind terms and unit tests; the panel line is a read of that function — it updates as augments are added with no extra state.
- Muted ink, the kills line's (T0070) size and placement; the panel grows by one fixed line height. No input, no sound, no board change.
- Closest example: the kills line (T0070) for placement and style; the tier-effective values the attacks already use (T0002's tiers) for the numbers.

## Acceptance criteria
- [ ] A lone Common Bolt tower shows "≈ N/s" where N is floor(its damage ÷ its attack interval), using the same damage and cadence the bolt actually fires with.
- [ ] A Bolt with Rapid added shows the modified damage and cadence (the added form's numbers, not the bare Bolt's).
- [ ] A Bolt with Ember added shows the bolt's term plus Ember's per-second rate for the tower's tier.
- [ ] A Rally-only tower shows no line; a Mark + Bolt tower shows the bolt's term with Mark contributing 0.
- [ ] The line updates as augments are added and removed from the hand; unit tests cover one per augment kind, a Bolt + Rapid + Frost combo and a support-only tower.

## Design (architect, cachyos-x8664)

### Files
- CREATE `src/core/towerDps.ts` — pure `towerDps(spec: TowerSpec): number` (no Phaser).
- CREATE `tests/core/towerDps.test.ts` — unit tests.
- EDIT `src/ui/hud/TowerPanel.ts` — add the DPS line under the kills line.

### Interfaces
New pure module `src/core/towerDps.ts`:

```ts
import type { TowerSpec } from './augments';

/**
 * The tower's expected damage per second against one enemy, read from its spec (tier and
 * added forms already applied). The shot or pulse primary strike (the accumulated damage
 * and attacks per second) plus the burn that keeps ticking after it (the strongest Ember
 * in the tower). Piercing, the splash burst and second targets do not count (one enemy);
 * support augments (Frost, Push, Anchor, Mark, Mint, Rally) deal no damage. Each augment
 * kind adds exactly one term, so a new kind (Chain, Beam) adds its own.
 */
export function towerDps(spec: TowerSpec): number {
  if (!spec.attacks) return 0;
  let dps = 0;
  if (spec.kind === 'shot' || spec.kind === 'pulse') dps += spec.damage * spec.rate;
  if (spec.burn) dps += spec.burn.dps;
  return dps;
}
```

The panel reads it and floors it: `const dps = towerDps(tower.spec); const n = Math.floor(dps);`, then shows `≈ ${n}/s` only when `n >= 1`.

### Steps
1. **New module** — `towerDps` as above: a sum of per-kind terms (shot/pulse `damage * rate` + Ember `burn.dps`), support = 0, written so each augment kind adds exactly one term (extensible for Chain T0025 / Beam T0073).
2. **`TowerPanel.build()`** — after the kills text, compute `dps`/`n` and add the DPS text under the kills line, muted (`textStyle(11, PALETTE.muted)`), same `x` (`left`) as the kills line, shown only when `n >= 1`. Grow `H` by one fixed line height (a new constant, e.g. `DPS_LINE`). No change to `update()` — the line is built from `tower.spec` in `build()` and rebuilds when `building.uiVersion` changes (no extra state).
3. **Tests** — one per augment kind (a lone tower's DPS), a Bolt+Rapid+Frost combo (=21.6), and a support-only tower (=0).

### Pitfalls
- **Layout tightness**: the gap between the kills line and the slots row is only ~13px; the DPS line goes under the kills line and `H` grows by one fixed line height — verify no overlap at 412x915 and 1280x720.
- **Show/hide**: floor first, then `n >= 1`; a support-only tower (DPS 0, e.g. Frost / Rally) shows no line.
- **No per-frame update**: the line is built in `build()` and rebuilds on `uiVersion`; do not touch `update()`.
- **`core/` stays pure** (no Phaser imports); the pure module lives in `core/`.

### Tests
New unit tests in `tests/core/towerDps.test.ts` (build specs via `towerSpec([...])`, then `towerDps(spec)`):
- Lone towers: bolt 19.2, lance 13.32, splash 15, rapid 20, reach 18.9, ember 3; frost / push / anchor / mint / rally / mark all 0.
- Bolt+Rapid+Frost: 21.6.
- Support-only tower: 0.
