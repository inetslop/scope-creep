---
id: T0408
title: "The claim's bed: a quiet beat under the rewards card"
assignee: desktop
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T05:22:32Z
claimed_at: 2026-11-02T06:31:51Z
finished_at: 2026-11-02T06:40:39Z
---

## Goal
The claim — the moment the run's story is told — plays in its own quiet register: a fifth audio bed under the rewards card, the run's coda, handing off to the menu's bed when the player leaves.

## Details
- A new quiet generative bed in the same shape as the existing beds (buildBed, draftBed, menuBed): a 2–3 note beat on the menu bed's (T0397) note set at a slightly faster tempo, sparser than the draft bed (T0372) — the run's coda settling into the menu's calm. Same low volume as the other beds.
- It starts the moment the claim (rewards) card lands — after the game-over card and its fall (T0367) have played — and loops quietly under the claim card's count-up.
- When the player returns to the menu, the claim bed fades over ~300 ms as the menu's bed (T0397) takes over — the same hand-off the other beds already do between phases.
- The sound on/off toggle (pause's, remembered in the profile) silences it like every other bed.
- Nothing else changes: the wave bed still stops with the wave, the game-over card keeps its fall, and the menu, draft and build beds keep their own timing and volume.

## Acceptance criteria
- [ ] After the game-over card, a quiet bed plays under the claim card — sparser and calmer than the draft bed, a touch livelier than the menu bed.
- [ ] Returning to the menu, the claim bed fades over ~300 ms with no gap and no double-bed overlap as the menu's bed takes over.
- [ ] With sound toggled off, no bed plays on the claim; the toggle's remembered state behaves as on every other screen.
- [ ] The claim card's count-up lines and their blips stay clearly on top of the bed (the bed at the beds' own low volume).
- [ ] No other scene's audio changes: the menu, draft, build and wave beds and the game-over fall are unchanged.

## Design (architect, desktop)

### Files
- create `src/audio/claimBed.ts` — the `ClaimBed`: a copy of `src/audio/menuBed.ts` (same class shape) with the claim's constants and a rest in the beat.
- edit `src/scenes/RewardsScene.ts` — own and drive the bed: one import, two fields, three create() lines, the `menu()` stop, and the `update()` call.
- edit `src/debug/runChecks.ts` — add the `claimBed.valid` invariant next to the other bed checks, plus the `RewardsScene` import.

### Interfaces
`ClaimBed` is identical in shape to `MenuBed` (same private fields; same `constructor(sfx: Sfx | undefined)`, `update(dt: number, playing: boolean): void`, `stop(): void`, `broken(): string | undefined`). Constants change to `DECAY_SEC = 0.5, FADE_SEC = 0.3, STEP_SEC = 1.3, VOL = 0.02`; `NOTES` stays the menu's `[82.41, 123.47, 164.81]` (E2 B2 E3); add `const PATTERN = [0, 1, 2, -1];` (E2 B2 E3, then a rest — the sparser "beat").

### Steps
1. Copy `src/audio/menuBed.ts` to `src/audio/claimBed.ts`. In the copy: rename the class `MenuBed`→`ClaimBed`; set `FADE_SEC = 0.3` and `STEP_SEC = 1.3` (leave `VOL = 0.02` and `NOTES` as the menu's); add `const PATTERN = [0, 1, 2, -1];` on the line after `NOTES`; replace the `update()` while-loop line with `while (this.acc >= STEP_SEC) { this.acc -= STEP_SEC; const n = PATTERN[this.step % PATTERN.length]!; if (n >= 0) this.playNote(NOTES[n]!); this.step += 1; }` (the `-1` step is a rest); change the `stop()` doc comment's "0.6 s" to "0.3 s"; change the `broken()` message to say "claim bed"; replace the class doc comment with:
   `/** The run's coda: a quiet 3-note beat under the claim (rewards) card, on the menu bed's (T0397) note set at a faster step (1.3 s vs the menu's 1.6 s) with a rest in the beat — a touch livelier than the menu's calm, sparser and calmer than the draft's (T0372). 0.02 pre-master, the beds' own low volume, so the claim card's count-up stays on top. Fades in over 0.3 s when the card lands (after the game-over fall, T0367) and fades out over 0.3 s back to the menu's bed; silent when muted. */`
2. `RewardsScene.ts`:
   - imports: add `import { ClaimBed } from '../audio/claimBed';`; change the `./keys` line to `import { getRun, getSfx, onResize, SCENES } from './keys';`.
   - fields (after `private ironTag?: ...`): `bed!: ClaimBed;` (public — runChecks reads it) and `private claimClosed = false;`.
   - `create()`: right after `hook.overlay = SCENES.rewards;` add `this.bed = new ClaimBed(getSfx(this)); this.claimClosed = false; this.events.once('shutdown', () => this.bed.stop());`
   - `menu()` closure: right after `closed = true;` add `this.claimClosed = true; this.bed.stop();`
   - `update()`: replace the first line `this.elapsed += Math.min(deltaMs / 1000, 0.05);` with `const dt = Math.min(deltaMs / 1000, 0.05); this.bed.update(dt, !this.claimClosed); this.elapsed += dt;`
3. `runChecks.ts`: add `import { RewardsScene } from '../scenes/RewardsScene';` (next to the `MenuScene` import); add after the `menuBed.valid` line: `['claimBed.valid', (g) => (g.scene.isActive(SCENES.rewards) ? (g.scene.get(SCENES.rewards) as RewardsScene).bed.broken() : null)],`

### Pitfalls
- The scene instance is reused between runs: `create()` must reset `claimClosed = false` and recreate `bed` (done) — otherwise a stopped bed lingers or an old one restarts.
- `claimClosed` is what stops `update()` from restarting the bed after `menu()`, because the rewards scene can stay active under the menu. `stop()` is idempotent, so the explicit `bed.stop()` in `menu()` + the shutdown handler + the `update(false)` path never double-fade.
- Do NOT add a delay before starting the bed: the claim card only opens after the game-over fall (T0367) has played, so the first `update()` frame is already the right moment.
- Keep `bed` public (no `private`) or runChecks cannot read `.bed`.
- No blips to add: the rewards card has no count-up sounds; the 0.02 volume simply keeps the bed under the card's visuals and any UI sounds.
- Hand-off: `menu()` stops the claim bed (0.3 s fade) and then starts the menu, whose `MenuBed` fades in over 0.6 s — a short quiet crossfade, no gap, matching the other beds.

### Tests
none (audio task).

## Result (attempt 1, desktop)

Added the run's coda: a fifth quiet audio bed (src/audio/claimBed.ts, same shape as the menu bed) playing the menu's E2/B2/E3 notes at 1.3 s steps with a rest in the beat, at the beds' shared 0.02 volume. RewardsScene now owns and drives it — it fades in when the claim card lands and, on returning to the menu, fades out over 0.3 s while the menu's bed takes over; the bed is recreated and its closed flag reset each run, and the mute toggle silences it like every other bed. Added the claimBed.valid invariant to runChecks next to the other bed checks. check and smoke (desktop + phone) both pass.

- Self-review: APPROVE
- Time: 8.8 min

```
projects/chokepoint/game/src/audio/claimBed.ts     | 77 ++++++++++++++++++++++
 projects/chokepoint/game/src/debug/runChecks.ts    |  2 +
 .../chokepoint/game/src/scenes/RewardsScene.ts     | 14 +++-
 3 files changed, 91 insertions(+), 2 deletions(-)
```
