---
id: T0324
title: The boards rank by level, then score
assignee: cachyos-x8664
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T23:37:22Z
claimed_at: 2026-11-01T00:44:39Z
epic: E9
---

## Goal
The owner's call: the leaderboard ranks the level a run was played at first, then its score. A level-2 run with 1000 points beats a level-0 run with 10000. And **Today** is now the UTC day (since 00:00 UTC), the same day as the shared daily boards.

## Details
- **The server is done by the owner** (`leaderboard/`, outside the game; don't edit it). It now:
  - takes `level` (the number of level augments on in the run, 0 to 10) and `mul` (the run's multiplier, 1 at level 0) with every submitted run, and computes the score as `floor((waves × 100 + kills) × mul)`, the run's `finalScore`;
  - ranks both boards by level, then score;
  - echoes `level` and `mul` on every entry and on `me`, and `level` on each `Place` of a submission;
  - counts Today from 00:00 UTC.
  A run sent without `level` posts at level 0 with ×1.
- **The game (`net/boards.ts`):** `RunForBoards` gets `level`, `BoardEntry` and `Place` get `level`. `submitRun` sends `level: run.level.length` and `mul: run.levelHpMul` (`ui/boardsLine.ts`, where the run is posted today).
- **The rows (`scenes/BoardsScene.ts`):** each row shows its level as a small tag before the score, "L2" (no tag at level 0); the existing ×mul tag keeps showing. The player's own row (`me`) shows its level the same way.
- **The Today tab:** a muted line "since 00:00 UTC".

## Acceptance criteria
- [ ] A submitted run carries `level` and `mul` (unit test on the body `submitRun` sends).
- [ ] Rows show "L<n>" for level 1 and up, no tag at level 0, and the ×mul tag.
- [ ] The Today tab reads "since 00:00 UTC".
- [ ] With the boards off (no `VITE_BOARDS_URL`, or ?smoke) nothing changes.

## Design (architect, cachyos-x8664)

### Files
- create `tests/net/boards.test.ts` — unit test: the run is posted with its `level` and `mul` in the body
- edit `src/net/boards.ts` — add `level: number` to `RunForBoards`, `BoardEntry`, `Place`; header doc "last 24 hours" → "since 00:00 UTC"
- edit `src/ui/boardsLine.ts` — add `level: run.level.length` to the `submitRun` body in `post()`
- edit `src/scenes/BoardsScene.ts` — level tag before the score in `addRow` (`me` flows through it); "last 24 hours" → "since 00:00 UTC" in `SUBTITLE.today`, the class doc, and the empty-state message

### Interfaces
```ts
// src/net/boards.ts — added, all required
export interface RunForBoards { name: string; waves: number; kills: number; seed: number; mul: number; level: number; }
export interface BoardEntry { rank: number; name: string; score: number; waves: number; mul?: number; level: number; }
export interface Place { rank: number; total: number; score: number; best: boolean; level: number; }
```
`submitRun(run: RunForBoards)` keeps its signature; `level = run.level.length` (0–10); `mul = run.levelHpMul` is already sent.

### Steps
1. `src/net/boards.ts`: add `level: number` to the three interfaces (doc: "the level the run was played at: the level augments on (0 with none)"); header doc line 4 → "…each name's best run since 00:00 UTC…".
2. `src/ui/boardsLine.ts:56` → `submitRun({ name, waves: run.wavesCleared, kills: run.kills, seed: run.seed, mul: run.levelHpMul, level: run.level.length })`.
3. `src/scenes/BoardsScene.ts`: `SUBTITLE.today` → `'The best run of every name since 00:00 UTC.'`; class doc and line 144 → `'No runs since 00:00 UTC.\nBe the first.'` (Forever wording untouched). Replace `addRow`'s tail from `const score` down (keep the existing `tag`/`scoreX` lines):
```ts
const score = this.add.text(scoreX, y, e.score.toLocaleString('en-US'), style(15, mine)).setOrigin(1, 0.5);
// A run that wore a level wears it as a small tag before its score; level 0 wears none.
const levelTag = e.level > 0 ? this.add.text(scoreX - score.width - 6, y, `L${e.level}`, style(11, false, PALETTE.muted)).setOrigin(1, 0.5) : undefined;
this.listBox.add([
  this.add.text(left + 22, y, `${e.rank}`, style(14, false, PALETTE.muted)).setOrigin(1, 0.5),
  this.add.text(left + 36, y, e.name, style(16, true)).setOrigin(0, 0.5),
  score,
  this.add.text(right, y, `W${e.waves}`, style(13, false, PALETTE.muted)).setOrigin(1, 0.5),
]);
if (tag) this.listBox.add(tag);
if (levelTag) this.listBox.add(levelTag);
```
4. create `tests/net/boards.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
vi.mock('../../src/debug/flags', () => ({ flags: { smoke: false, skipMenu: false, debug: false, seed: undefined } }));
describe('the boards post', () => {
  it('posts the run with its level and multiplier', async () => {
    const fetchSpy = vi.fn(async (url: string, init: RequestInit) => ({ ok: true, status: 200, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchSpy);
    process.env.VITE_BOARDS_URL = 'http://boards.test'; // BASE is read once, on the module's first import
    const { submitRun } = await import('../../src/net/boards');
    const run = { name: 'WREN', waves: 5, kills: 40, seed: 7, mul: 1.5, level: 2 };
    await submitRun(run);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('http://boards.test/submit');
    expect(JSON.parse(String(init.body))).toEqual(run);
  });
});
```

### Pitfalls
- `process.env.VITE_BOARDS_URL` must be set before the dynamic `import` of `net/boards`: `BASE` is captured once at module evaluation (a static import gives an empty base, `boardsOn()` false, no fetch). `@types/node` is present, so `process.env` typechecks.
- `vi.mock('../../src/debug/flags', …)` is hoisted, so no `window` stub is ever needed: the node test env has no `window`, and `debug/flags` reads `window.location.search` at module scope.
- The level tag's x is `scoreX - score.width - 6` (read `score.width` after creating the score text, same lazy pattern as the existing `tag.width`); never a hand-picked x offset. The ×mul tag keeps its exact current spot (`right - 54`, only when `mul > 1.0001`).
- `e.level > 0` → no tag at level 0 and if an old echo omits `level`; `me` is posted/echoed level the same way because it goes through the same `addRow`.
- Boards off stays untouched: only type fields + one request field behind the existing `boardsOn()` guard — no new fetch, no wiring.

### Tests
- The new test pins the body: the parsed POST body deep-equals the run (`mul: 1.5`, `level: 2`) and the URL is `http://boards.test/submit`; then `npm run check` and `npm run smoke`.
