---
id: T0358
title: "The wave branch and its first node, The door: the far gate on every board"
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-01T12:34:19Z
claimed_at: 2026-11-01T16:45:41Z
epic: E14
---

## Goal
The tech tree gets its fifth branch, "The wave" — between-run coins buy how a run plays (E14) — and its first node, The door (30 coins): once owned, every board carries the far gate (T0338), so every run's build plan covers two entrances from the first placement.

## Details
- **The branch:** a fifth branch on the tech screen, "The wave", beside the four existing branches, in the branches' own card language (a name with its nodes under it). This task brings the branch and exactly one node; the branch's other two nodes (The thin road, The breather) are later E14 tasks and are not stubbed, greyed or named here.
- **The node:** "The door", 30 coins, bought once, on for every run after (Iron included), kept on the profile like every other node. The card's dry line: "the far gate on every board".
- **The effect:** while the node is owned, every generated board carries the far gate exactly as today's far-gate boards do — a second gate partway down the road, a third of each non-boss wave coming in through it (boss waves unchanged), shown on the board, the pick screen's previews and the next-wave preview. The gate's position, look and wave behavior are T0338's, untouched: the node changes where the gate appears (some boards → every board), not what it is. No new save field for the board: the gate is part of the board, and a resumed run's board already has it.
- **While not owned:** board generation is byte-identical to today — the far gate still rolls onto only the boards it rolls onto today.
- **The boards reference:** the pause screen's boards reference (T0350) already names the far gate and where it comes from; while the node is owned that line reads "tech · The door", while it is not owned it reads as today.
- **Not here:** the menu's live demo is a fixed one-entrance road and stays one-entrance — the demo's own gate is a separate parked idea in IDEAS (that clause is why T0357 was rejected). No HUD element, no sound, no new readout: the node card says the same things every existing node card says (name, dry line, price, owned mark), and nothing the screen already shows is shown twice.
- **Why the screen has room (screen bar):** the branch and the node reuse the tech screen's existing card language — the 13 current node cards already fit; all five branches with their nodes must still fit the tech screen at 412×915 and 1280×720.
- **Why placement is more interesting (board bar):** today a build plan is made for the road it is dealt; with The door the plan is always for a road with two entrances — the far gate's shorter run-in shifts where the pressure lands, so cover chosen for the main gate no longer guarantees the second one.

## Acceptance criteria
- [ ] The tech screen shows a fifth branch, "The wave", with one node, "The door" at 30 coins, in the existing card language; all five branches and their nodes fit the tech screen at 412×915 and 1280×720.
- [ ] Buying The door spends 30 coins and wears the owned mark; the purchase survives closing and reopening the tab and is on for every run after.
- [ ] With the node owned, every fresh run's board carries the far gate: a second gate partway down the road, a third of each non-boss wave coming in through it (boss waves unchanged), shown on the board, the pick screen's previews and the next-wave preview exactly as on today's far-gate boards.
- [ ] Without the node, the same seed produces today's board — the far gate on only the boards it rolls onto today.
- [ ] The pause screen's boards reference reads the far gate's source as "tech · The door" while the node is owned, and as today while it is not.
- [ ] The menu's live demo is byte-identical: one entrance, no gate.
- [ ] Unit tests: the far-gate rule as a pure function of the node's ownership (owned → the gate on every generated board; not owned → today's seeded roll), and the gate's wave behavior (a third of non-boss waves) unchanged either way.

## Design (architect, desktop)

### Files
- create `src/content/tech/wave.ts` - "The wave" branch data: `WaveNode` interface + `WAVE_NODES` with the one node The door
- edit `src/core/tech.ts` - import `WAVE_NODES`; add `boardFarGate()` reader (after `boardFold`, ~line 100) and `buyWaveNode()` (after `buyBoardNode`, end of file); add `WAVE_NODES` to the `nodeInReach` branch list (line 159)
- edit `src/core/map.ts` - `generateMap()` gains trailing param `farGate = false` (line 39) and its last line (94-95) skips the roll when the flag is set
- edit `src/core/boardFacts.ts` - new tag kind `'someTech'`; the fargate row (line 26) gets `tag: { kind: 'someTech', node: 'door' }`; `boardFactTag()` resolves it
- edit `src/scenes/TechScene.ts` - import `WAVE_NODES`/`buyWaveNode`; `'wave'` in `RowNode.branch` (line 33); `'The wave'` in `ROW_LABELS` (46) and one row in `this.rows` (after line 83); `buy()` dispatch (315-322)
- edit `src/scenes/GameScene.ts` - import `boardFarGate` (line 12); compute the flag (after line 122) and pass it as `generateMap`'s last argument (line 125); extend the comment at 114-118
- edit `src/scenes/PickScene.ts` - import `boardFarGate` (line 13); `private farGate = false;` (after line 68); read it from the profile (after line 94); pass it in the preview `generateMap` (line 124)
- edit `tests/core/tech.test.ts` - wave-branch node shape, `boardFarGate`, `buyWaveNode` tests
- edit `tests/core/farGate.test.ts` - the flag's rule as a pure function of ownership
- edit `tests/core/boardFacts.test.ts` - the fargate tag while owned / not owned

### Interfaces
```ts
// src/content/tech/wave.ts
export interface WaveNode { id: string; name: string; line: string; price: number; farGate: boolean; }
export const WAVE_NODES: readonly WaveNode[] = [
  { id: 'door', name: 'The door', line: 'the far gate on every board', price: 30, farGate: true },
];
// src/core/tech.ts (mirror boardFold / buyBoardNode exactly: seen-set, loadProfile, nodeCost, setItem in try/catch)
export function boardFarGate(owned: readonly string[]): boolean; // true iff an owned WAVE_NODES id has farGate
export function buyWaveNode(store: KeyValueStore | undefined, id: string): boolean;
// src/core/map.ts
export function generateMap(rng: Rng, cols: number, rows: number, rocks: number, extraBends = 0, lengthMul = 1, bgen = 2, chokes = 1, fold = false, farGate = false): GameMap;
// its last line becomes:
// return { ...result, farGate: farGate ? farGateCell(result) : rng.chance(1 / 3) ? farGateCell(result) : undefined };
// src/core/boardFacts.ts
export type BoardFactTag = { kind: 'always' } | { kind: 'some' } | { kind: 'tech'; node: string } | { kind: 'someTech'; node: string };
```
`boardFactTag` gains, before the `'owned'` line: `if (tag.kind === 'someTech') return purchased.includes(tag.node) ? \`tech · ${techName(tag.node)}\` : 'some boards';` where new helper `techName(id)` looks the id up in `BOARD_NODES` then `WAVE_NODES` (and the existing `'tech'` return switches to use it). No scene change: `BoardFactsScene.tagText` shows the returned string verbatim for non-`'tech'` kinds, so it renders `tech · The door` owned, `some boards` unowned.

### Steps
1. Create `src/content/tech/wave.ts` exactly as above.
2. `src/core/tech.ts`: import, `boardFarGate` (after `boardFold`), `buyWaveNode` (after `buyBoardNode`), and `nodeInReach` list → `[TECH_NODES, POOL_NODES, CLAIM_NODES, BOARD_NODES, WAVE_NODES]`.
3. `src/core/map.ts`: signature + one doc-comment sentence ("With `farGate` (the wave branch's The door) every board carries the far gate, no roll.") + the last-line swap above.
4. `src/core/boardFacts.ts` per the Interfaces section.
5. `src/scenes/TechScene.ts`: the five edits above; in `buy()`, insert `: node.branch === 'wave' ? buyWaveNode(window.localStorage, node.id)` between the claim and board arms. Card rendering, price (`nodeCost` → 30), owned mark and sound all work off the existing row data — nothing else changes.
6. `src/scenes/GameScene.ts`: `const farGate = boardFarGate(loadProfile(window.localStorage).purchased);` after the `fold` line; append `farGate` to the `generateMap` call.
7. `src/scenes/PickScene.ts`: field, profile read and preview call as listed.
8. Add the tests (below), then run `npm run check`.

### Pitfalls
- Byte-identity: the unowned path must keep the exact `rng.chance(1 / 3)` draw (it is the seed's last draw; skipping it only when owned is intended — the road/rocks are identical either way, which the new test asserts via `path`/`kinds` equality).
- `farGateCell()` can still return `undefined` (no straight, choke-clear cell): never force a gate; owned boards get `farGateCell(result)`, possibly none. Tests must compare against `farGateCell`, not assume a gate.
- `ROW_LABELS[i]` indexes `this.rows[i]` — add the label and the row at the same (last) position.
- No new save field: `SavedRun` is untouched; a resumed run regenerates the board from seed + the current flag, and the flag never changes road or rocks, so saved towers stay valid.
- Ghost and iron runs flow through the same `GameScene` lines — no special-casing; the flag applies to every run, as required.
- Do not stub, grey or name the branch's other two nodes.

### Tests
- `tests/core/farGate.test.ts`, new describe "the far gate as the wave node is owned": per size (14x8, 8x14), over seeds 1-300, `generateMap(rng, cols, rows, 5, 0, 1, 2, 1, false, true)` has `farGate` equal to `farGateCell(owned)`, keeps every gate the unowned roll produced on the same cell, shares `path`/`kinds` with the unowned map, and gates strictly more boards than the roll does; plus `generateMap(..., 2, 1, false, false)` toEqual today's default call (same seed); plus one send-rule check that `isFarGateSpawn(i, planOf(9, 9), !!owned.farGate)` is `i % 3 === 2` for a non-boss wave and none for a boss (10) — the existing `isFarGateSpawn` tests already pin the rest unchanged.
- `tests/core/tech.test.ts`: `WAVE_NODES` shape (`[['door', 'The door', 'the far gate on every board', 30, true]]`); `nodeCost(WAVE_NODES, 'door')` is 30; `boardFarGate` false for `[]`/other-branch ids, true for `['door']`/duplicates; `buyWaveNode` refuses unknown/owned/unaffordable (29 coins, coins unchanged), and a 60-coin buy leaves 30 and `purchased` containing `'door'`.
- `tests/core/boardFacts.test.ts`: `boardFactTag(BOARD_FACTS[5]!, ['door'])` is `'tech · The door'` (the unowned `'some boards'` assertion already exists).
