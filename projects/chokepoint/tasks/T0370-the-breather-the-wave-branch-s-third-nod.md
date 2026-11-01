---
id: T0370
title: "The breather: the wave branch's third node, quiet waves pay 2× the wave bonus"
size: S
priority: 2
status: todo
depends_on: [T0369]
attempts: 0
created: 2026-11-01T17:47:11Z
epic: E14
---

## Goal
The tech tree's "The wave" branch gets its last node — The breather: 155 coins, every quiet wave (every 4th) pays 2× the wave bonus, for every run after. With it the branch reads complete (three nodes).

## Details
- **The tech card:** "The breather", depth-3 node of the wave branch — 155 coins by the depth rule (the branch's base 30, as The door at 30 and The thin road at 85 per T0369), shown derived like every other node's price. No buy-gate inside the branch (each node buys independently at its depth price). Locked and owned looks as on the branch's other nodes, bought through the wave branch's existing buy dispatch. Card line: "Quiet waves pay 2× the wave bonus, for every run after."
- **The effect:** the wave bonus — the gold a cleared wave pays, computed at the run's own wave-bonus site (RunState's wave bonus, paid by clearWave) — is ×2 when the wave is quiet (the every-4th rule, read from core/waves.ts, read-only) and the node is owned. The owned state reaches the site the way The door's far-gate flag reaches the board generator (T0358). A cleared quiet wave pays its doubled bonus at the same moment and with the same gold pop it pays today; non-quiet waves pay their unchanged bonus.
- **What does not change:** kill gold, the quiet wave's own double kill gold (T0071), the last stand's ×4 (T0082), coins, the coin recipe and the claim card — the node doubles the wave's bonus term only.
- **On screen:** nothing new. If the coins reference's "Pays" line (T0329) lists the wave bonus, it reflects the owned node's 2× like its other owned states; if it does not, it is untouched. No HUD, no key, no sound.

## Acceptance criteria
- [ ] The tech screen's "The wave" branch shows The breather as its third node: 155 coins by the depth rule, bought with the existing dispatch, shown owned; the branch reads complete (three nodes) and every other branch is untouched.
- [ ] With the node owned, a cleared quiet wave pays exactly 2× the wave bonus it pays without the node, at the same moment with the same gold pop; a non-quiet wave pays its unchanged bonus.
- [ ] Kill gold, the quiet wave's double kill gold, the last stand's ×4, the coin payout and the claim recipe are byte-identical to before.
- [ ] A run started without the node pays the plain bonus on every wave; the game is playable menu to game over on desktop and mobile.

## Design (architect, inet-racing)

### Files
- Edit `src/content/tech/wave.ts` — one optional interface field + the third `WAVE_NODES` line
- Edit `src/core/tech.ts` — one new export after `boardFarGate`
- Edit `src/core/run.ts` — two imports + one line in `clearWave`
- Edit `tests/core/tech.test.ts` — multiplier, price, buy tests
- Edit `tests/core/run.test.ts` — wave-4 clear pays 28 plain / 56 with the node

### Interfaces
`WaveNode` gains an optional field (after the `farGate` line, comment style matching it):
```ts
  /** the multiplier a quiet wave's clear bonus takes (core/run.ts pays it): 1 = unchanged */
  quietBonusMul?: number;
```
`src/core/tech.ts` gains, directly after `boardFarGate`:
```ts
/** The multiplier a quiet wave's clear bonus takes: the biggest owned wave node's, 1 when none has one; each node counts once, unknown ids count for nothing. */
export function waveQuietBonusMul(owned: readonly string[]): number {
  let mul = 1;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = WAVE_NODES.find((n) => n.id === id);
    if (!node) continue;
    if (node.quietBonusMul !== undefined && node.quietBonusMul > mul) mul = node.quietBonusMul;
  }
  return mul;
}
```
`RunState.clearWave()` (core/run.ts:158) — the only effect site:
```ts
    const bonus = RunState.waveBonus(this.wave) * (isQuietWave(this.wave) ? waveQuietBonusMul(this.techOwned) : 1);
```

### Steps
1. `src/content/tech/wave.ts`: add the field above; append the node as the **third** entry of `WAVE_NODES`, after the two existing entries (T0369's node is built first per DEPENDS_ON):
```ts
  { id: 'breather', name: 'The breather', line: 'quiet waves pay 2× the wave bonus, for every run after', price: 155, farGate: false, quietBonusMul: 2 },
```
   If T0369 added a required field to `WaveNode`, give it its neutral no-effect value on this line (1 for a multiplier, `false` for a flag, 0 for an additive). The interface in the file is the source of truth; `npm run check` names any missing field.
2. `src/core/tech.ts`: paste the `waveQuietBonusMul` function after `boardFarGate` (it reads the existing `WAVE_NODES` import).
3. `src/core/run.ts`: add after the `./rng` import line: `import { waveQuietBonusMul } from './tech';` and `import { isQuietWave } from './waves';`; replace the bonus line in `clearWave` with the line above. `techOwned` is already the profile's purchased list on every run (GameScene.ts:101) — no GameScene, RunFlow, waves.ts, CoinsScene or HUD change; the "Wave N cleared +X" pop reads `clearWave()`'s return, so the doubled number appears at the same moment.
4. Tests, per ## Tests. 5. `npm run check`.

### Pitfalls
- Array position is the depth: depth 3 prices `Math.round(30 * 3**1.5 / 5) * 5 = 155`. A second entry would price 85. It must sit after both existing entries.
- T0369 edits the same two files and is built first: never reorder or rename `door` or T0369's line, and don't touch T0369's field. The field here is **optional** so no existing line is edited.
- Keep `RunState.waveBonus` the plain rate — coins, last stand, the claim recipe and every other consumer of the bonus stay byte-identical; only the paid clear bonus on quiet waves multiplies.
- Quiet kill-gold doubling (`quietGoldMul`, waves.ts:77) is a separate thing — untouched.
- No new UI/HUD/key/sound; `TechScene` renders the card, its price (`nodeCost` → 155), and the buy from the data line alone.

### Tests
`tests/core/tech.test.ts` — add `waveQuietBonusMul` to the `core/tech` import (after `startBonuses`), then next to the wave-branch tests:
- `waveQuietBonusMul` is 1 for `[]` and `['gold-1', 'door', 'nope']`, 2 for `['breather']` and `['breather', 'breather', 'gold-1']`.
- `nodeCost(WAVE_NODES, 'breather')).toBe(155)` (don't name T0369's node id).
- `buyWaveNode(withCoins(155), 'breather')` → `true`, coins 0, purchased contains `'breather'`; with 154 → `false`, coins stay 154.

`tests/core/run.test.ts` — two blocks:
- With node: `new RunState(1, ['breather'])`; loop waves 1→4 (`startWave()` then `clearWave()` each); assert `clearWave()` equals `RunState.waveBonus(wave)` for 1–3 and `RunState.waveBonus(4) * 2` (56) on wave 4, and `run.gold - before === bonus` each wave.
- Without: `new RunState(1)`; wave 1 `clearWave()` is `RunState.waveBonus(1)`, and walking to wave 4 (startWave/clearWave/startBuild(5) pairs) the wave-4 `clearWave()` is exactly `RunState.waveBonus(4)` (28).
