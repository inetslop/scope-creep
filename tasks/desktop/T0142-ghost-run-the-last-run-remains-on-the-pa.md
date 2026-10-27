---
id: T0142
title: Ghost run — the last run remains on the page
assignee: desktop
size: M
priority: 2
status: todo
depends_on: [T0124]
attempts: 0
created: 2026-10-27T20:19:39Z
---

## Goal
Every run carries a ghost: a faint pencil outline tracing where your last run's circle actually was, in sync with the run clock. You race your own last performance, and the moment you outlive it is marked with a "PAST YOU" flash while the ghost holds at the spot where you died.

## Details
- At the moment a normal run ends (the game-over moment), the run's player path is saved: the player's center sampled every **150 ms** of the run clock (positions rounded to integers, first sample at 0:00), plus the run's total survival time. The save **replaces** the previous one and persists in localStorage (the bestScore pattern, its own key), so it survives a page reload. A run that never reaches game over saves nothing.
- The record is capped at **20:00** (13,333 samples); a longer run saves the first 20:00 and the true survival time, so the flash can still fire past the cap.
- The next run draws the ghost: a flat **pencil-grey circle** — the same grey as the Underdrawing stroke (T0100), **2 u stroke, no fill, no eye, no shadow**, at **50% alpha**, the player's base radius (no build rings, T0131, no swell) — drawn under the entities on the layer the puddles and ink trails use (T0111/T0126). It starts at the first sample at 0:00 and replays the path in sync with the run clock, linearly interpolated between samples.
- The ghost is a memory, not a shape: no hitbox — it deals no damage, takes no damage, is not targetable, is not pushed, and is ignored in both directions by enemy steering, bullets, weapons, hazards and shards. It is drawn on the paper, so Crop (T0045) and Tide (T0127) need no special-casing — an old position in a shrunken margin is just memory on the page.
- The moment the run clock **strictly passes** the saved survival time, once: a small-caps **"PAST YOU"** note prints in the HUD for 2 s (the nameplate idiom, T0064), and the ghost stops moving and **holds at its last position** for the rest of the run — the place you died last time stays on the page.
- Teaching: the first run in which a ghost appears, a run-start note **"THE LAST RUN REMAINS"** prints for 2 s (the nameplate idiom, T0064, the way Warm Start's does, T0114); a persisted flag (bestScore pattern) keeps it to once per player.
- A run with no saved path yet (the first run ever) has no ghost. When the Gallery studies (T0129) land, study runs neither record nor show a ghost — studies have their own rules and their paths are not comparable; until then every run is a normal run.
- Purely visual: no new key, sound, HUD element (beyond the two notes) or scene; no stat, spawn, hazard, weapon, clock or music change.
- A new **pure module in `src/core/`** (the crop/rest pattern) owns: the recorder buffer (150 ms sampling against the run clock, the 20:00 cap), the compact encode/decode of the saved path (integer positions; a full 20:00 record stays in the low tens of KB), and the replay rules (sample index + linear interpolation, the hold at the last sample after the survival time, the single outlived crossing). Unit tests lock: encode/decode round-trips; the replayed position is continuous across sample boundaries; the crossing fires exactly once at the survival time and never again; a 20:00+ record caps at 13,333 samples while the crossing still uses the true survival time; a missing path replays nothing.

## Acceptance criteria
- [ ] The first run in a fresh profile shows no ghost; after that run ends, the next run shows a faint grey circle (2 u stroke, no fill, no shadow, 50% alpha) tracing the previous run's path in sync with the run clock.
- [ ] The ghost and everything pass through each other: enemies, bullets, weapons, hazards and shards ignore it, and it affects none of them.
- [ ] The moment the clock passes the previous run's survival time, "PAST YOU" prints in small caps for 2 s (once per run) and the ghost holds still at its last position for the rest of the run.
- [ ] The first run that contains a ghost prints "THE LAST RUN REMAINS" at run start for 2 s, and never again.
- [ ] The saved path survives a page reload and each ended run replaces it with its own.
- [ ] No new key, sound, HUD element beyond the two notes, or scene; the full gate (typecheck, lint, unit tests, desktop + mobile smoke) passes.

## Design (architect, desktop)

### Files
- create `src/core/ghost.ts` — pure module (crop/rest pattern, no Phaser): recorder buffer (150 ms run-clock sampling, 13,333 cap), compact encode/decode (int16 deltas + base64), replay rules (interp + hold + single outlived crossing), localStorage persistence in its own keys (bestScore pattern).
- create `src/systems/GhostSystem.ts` — one `Graphics` on `DEPTH.floor + 1` (the puddle/platemark paper layer) drawing the ghost circle; owns one `GhostRecorder` + one `GhostReplay` per run.
- create `tests/core/ghost.test.ts` — unit tests (see Tests).
- edit `src/scenes/GameScene.ts` — wiring only: imports, two fields, instantiation, 2 lines in `update()`, 1 line in `endRun()`, one invariant. No new listeners.
- edit `src/scenes/keys.ts` — one new key in `GAME_EVENTS`.
- edit `src/scenes/HudScene.ts` — route the new event to the existing nameplate handler (`onNameplate`), exactly like `warmStart` (2 s life, screen-space, works at 412x915 and 1280x720).

### Interfaces
```ts
// src/core/ghost.ts
export const GHOST = { sampleSec: 0.15, maxSamples: 13333 } as const;
export const GHOST_KEY = 'scope-creep.ghost';
export const GHOST_TAUGHT_KEY = 'scope-creep.ghost-taught';
export interface GhostSample { x: number; y: number; }
export interface GhostRecord { survivalSec: number; samples: readonly GhostSample[]; } // sample i at i*sampleSec, first at 0:00; survivalSec is always the true value
export class GhostRecorder {
  readonly samples: GhostSample[];
  tick(timeSec: number, x: number, y: number): void; // pushes Math.round(center) for every sample due (i*sampleSec <= timeSec); stops at maxSamples
  finish(survivalSec: number): GhostRecord;
}
export class GhostReplay {
  constructor(record: GhostRecord | null);
  get hasPath(): boolean;                          // false for missing path: replays nothing, never crosses
  positionAt(timeSec: number): GhostSample | null; // lerp between samples i, i+1; holds at last sample for f >= n-1
  crossedOutlived(timeSec: number): boolean;       // true exactly once: first call with timeSec > survivalSec (strict)
}
export function encodeGhost(record: GhostRecord): string;          // {"v":1,"s":survivalSec,"d":base64}
export function decodeGhost(data: string | null): GhostRecord | null; // null when absent/malformed — never throws
export function loadGhostPath(): GhostRecord | null;
export function saveGhostPath(record: GhostRecord): void;          // no-op when samples.length === 0
export function loadGhostTaught(): boolean;
export function saveGhostTaught(): void;

// src/systems/GhostSystem.ts
export class GhostSystem {
  constructor(scene: Phaser.Scene);   // loads saved path + taught flag; adds the graphics (DEPTH.floor + 1, hidden)
  get hasGhost(): boolean;
  get teachNote(): boolean;           // true only on the first run that shows a ghost, once per player
  markTaught(): void;                 // persists the flag; call after the note is actually emitted
  get sampleCount(): number;          // for the invariant
  get position(): GhostSample | null; // last drawn position; for the invariant
  update(timeSec: number, x: number, y: number): boolean; // ticks recorder + draws ghost; returns crossedOutlived (true once)
  finishRun(survivalSec: number): void; // the game-over moment: save this run's path, replacing the saved one
}
```

### Steps
1. `src/core/ghost.ts`. Encode payload: little-endian int16 in `4 + 4*(n-1)` bytes — int16 x0, int16 y0, then per i≥1 int16 `(x_i-x_{i-1})`, int16 `(y_i-y_{i-1})` (deltas never overflow: max step ≈ 180 u incl. knockback « 32767). Base64 via `btoa`/`atob` (Node ≥16 globals; tests run on Node 24) — build the binary string in **8192-byte chunks** (`String.fromCharCode(...bytes.subarray(i, i + 8192))`); never spread the full ~53 KB (stack overflow). `decodeGhost` returns null unless: JSON parses, `v === 1`, `s` finite ≥ 0, `d` a string, `atob` succeeds, `len ≥ 4 && (len-4) % 4 === 0`, sample count ≤ `maxSamples`, and every decoded position satisfies `|x|,|y| ≤ ARENA_SIZE/2` (import from `../config`, as `director.ts` does) — anything else is corruption and means "no ghost", never an exception. Recorder: `while (this.samples.length < GHOST.maxSamples && this.samples.length * GHOST.sampleSec <= timeSec + 1e-9) push({x: Math.round(x), y: Math.round(y)})` — first sample at 0:00, keyed off the run clock, not frames. Replay `positionAt`: `f = timeSec / sampleSec`; `f >= n-1` → last sample; else lerp `a + (b-a)*(f-floor(f))`. Crossing: `if (outlived || record === null || timeSec <= record.survivalSec) return false; outlived = true; return true;`
2. `src/systems/GhostSystem.ts` per Interfaces. Draw with the house helper, no fill/no eye/no shadow: `drawShapeOutline(this.g, 'circle', p.x, p.y, PLAYER_RADIUS, PALETTE.pencil, 2, 0.5)` (2 u pencil stroke, outer edge at the base radius 16 — same grey/width/alpha as the Underdrawing stroke; hide the graphics when `positionAt` returns null).
3. `src/scenes/keys.ts`: add to `GAME_EVENTS` (one item per line, after `warmStart`): `ghostNote: 'ghost-note'` with a doc comment (payload: the note text).
4. `src/scenes/HudScene.ts`: `gameEvents.on(GAME_EVENTS.ghostNote, onNameplate);` directly after the `warmStart` line in `create()`, and `gameEvents.off(GAME_EVENTS.ghostNote, onNameplate);` in the existing shutdown block. The nameplate's existing 2 s life is the spec'd note duration.
5. `src/scenes/GameScene.ts`: after imports add `const GHOST_TEACH_NOTE = 'THE LAST RUN REMAINS';` and `const GHOST_PAST_YOU = 'PAST YOU';`; import `GHOST` from `../core/ghost` and `GhostSystem` from `../systems/GhostSystem` (alphabetical slots: `GHOST` after the `crop` import, `GhostSystem` between `GiltPop` and `GutterSystem`). Fields: `private ghost!: GhostSystem;` after `puddles`, `private ghostTeachNote = '';` after `warmStartName`. In `create()`, directly after `this.puddles = new PuddleSystem(this);`: `this.ghost = new GhostSystem(this); this.ghostTeachNote = this.ghost.teachNote ? GHOST_TEACH_NOTE : '';`. In `update()`, directly after the warmStart emit block: `if (this.ghostTeachNote !== '') { this.events.emit(GAME_EVENTS.ghostNote, this.ghostTeachNote); this.ghost.markTaught(); this.ghostTeachNote = ''; }` (first-tick pattern — the HUD listener exists only from the first update tick, exactly why warmStart emits there). In `update()`, directly after `this.player.aimAngle = ...` and **outside** the fermata `if (!holding)` block: `if (this.ghost.update(run.timeSec, this.player.x, this.player.y)) { this.events.emit(GAME_EVENTS.ghostNote, GHOST_PAST_YOU); }`. In `endRun()`, directly after the `saveBestScore` line: `this.ghost.finishRun(this.run.timeSec);`. In `registerInvariants()`, directly after the `puddle-pool` line: `hook.addInvariant('ghost', () => { if (this.ghost.sampleCount > GHOST.maxSamples) return `ghost recorder at ${this.ghost.sampleCount} samples`; const p = this.ghost.position; return p !== null && (!Number.isFinite(p.x) || !Number.isFinite(p.y)) ? `ghost at (${p.x}, ${p.y})` : null; });`
6. No new physics, group, listener, key, sound, or scene: the ghost is not a body and is not in any list (enemies/shot/projectile/shard arrays), so every system ignores it in both directions for free; Crop/Tide need nothing (it is drawn on the paper).

### Pitfalls
- Run-clock keying: drive everything off `run.timeSec` (never `scene.time` or frame counts) — pause/level-up/fermata freeze the run clock, so the ghost freezes with it; fermata must NOT skip the ghost update (it is not a frozen enemy).
- Both notes emit from `update()` (first tick), never from `create()` — Phaser queues `scene.launch`, so the HUD listener does not exist during `create()`. If a warm start and the ghost teach note land the same tick, the ghost note emits second and wins the single nameplate slot (it is once-per-player).
- `btoa` chunking (8192) or the ~53 KB spread throws a RangeError at run start.
- The spec's "20:00" and "13,333 samples" disagree: 13,333 × 150 ms ≈ 33:20 of run clock, not 20:00. Implement the concrete, repeated number — `maxSamples = 13333`; a full record is ≈ 71 KB base64 (tens of KB, fine for localStorage). Do not "fix" it to 8,001.
- Corrupt localStorage must degrade to no ghost: `decodeGhost` null on any malformation (including out-of-arena positions); `saveGhostPath`/`loadGhostTaught` swallow storage errors like `bestScore.ts`.
- Smoke mode (`?smoke`) auto-restarts: each quick death just re-saves a short path; the ghost and both notes are harmless there — verify nothing assumes `localStorage` is fresh.
- T0129 (Gallery studies) does not exist yet: every run is a normal run now. When study runs land they must gate `finishRun`/replay — no code for that now.

### Tests
`tests/core/ghost.test.ts` (vitest, node): (1) encode/decode round-trips survival time + integer positions, and a full 13,333-sample record encodes to < 80,000 chars; (2) replayed position is continuous across sample boundaries — at every sample time i it sits within 1e-8 of sample i, and ±1 % of a step away it moves no more than one step's worth (use a straight-line record so the bound is exact); (3) crossing fires exactly once: false at 99.999/100, true at 100.001 for survivalSec 100, false again at 200 and 1e6; (4) pump a 40:00 record through `GhostRecorder` → exactly 13,333 samples, `finish(2400)` keeps true survival 2400, and after an encode/decode round-trip the crossing still fires at 2400.001 while `positionAt(2400)` holds; (5) `new GhostReplay(null)` replays nothing (`hasPath` false, `positionAt` null, crossing always false). Plus: first sample at 0:00 rounded to integers (tick 0.016 → one sample; tick 0.3 → three).
