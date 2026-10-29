---
id: T0095
title: "Mend: the Epic that buys a life back (the T0093 re-file)"
size: L
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T02:00:38Z
epic: E4
---

## Goal
The Epic pool gets the survival axis no other Epic touches: a tower that turns the run's kills into lives, so a leaking run can still hold, and the last stand (T0054, in) becomes a comeback instead of a countdown.

## Details
- This is the re-file of T0093 after its architect rejection. The rejection was on exactly one thing: the Added card line (91 chars) exceeded the card line / tier line caps enforced by tests/content.test.ts. The mechanic, panel, art, sound and state design were approved as sound and are reproduced here unchanged; the only change in this task is the shortened Added card line below.
- Epic-only roll, like Mark, Rally, Mint and Anchor (the same Epic flag). Both card lines (within the caps in tests/content.test.ts — card line ≤ 70, tier line ≤ 56):
  - First (as a new tower): "Every 12 kills this run, the run gets +1 life." A support with no attack of its own: it never fires, aims at nothing and deals no damage.
  - Added: "−2 kills per extra Mend: 12, 10, 8, 6, 4 — no shorter" (53 chars, within the tier line cap; the copies-count-together mechanic lives in the run, not the line).
- Copies count run-wide: the run's N Mend copies, in any towers, set the count to max(12 − 2×(N−1), 4). The target is read live from the run's copies, so a copy added mid-count shortens the current count; the kill progress since the last pay is kept.
- The count: kills by any source this run — exactly the kill the kills line (T0070) counts, by whatever source it happens (a shot, an Ember's killing tick). A leak is not a kill; the panic pulse's clear (T0063) is not a kill. The count restarts at the current target after each pay and after each hold.
- The pay: the run's lives go up by 1 — a small green "+1" on the lives number (the clean streak's green pop, T0045). If the pay brings the run from 1 to 2 lives, the last stand's red number clears the same moment (T0054's own rule).
- The cap: a pay never raises the run above the lives it started the run with (a resumed run keeps its saved starting value). A count that reaches its target at the cap is **held** — one at most — and pays at the next leak: the held "+1" lands on the lives number as the leak's loss is applied, green pop and chime included.
- The panel: one small muted line under the kills line (T0070) — "life in N" while counting (N counting down to the current target) and "life held" while a pay is held. Momentum's "Bonus +N%" panel line (T0064) is the pattern.
- Look: a low green disc at the tower's base with one tick per copy (Momentum's tick language, T0064); the disc is the tower's shape — a Mend-only tower has no barrel and never fires. No working-aura ring (T0055's scope stands: Anchor and Mint only); the lives-number pop is the tower's tell, at most 12 kills away.
- Sound: one soft two-note ascending chime, E4 (~330 Hz) then G4 (~392 Hz), 80 ms sines at the tier chime's quiet volume (T0032, 0.1) — the coin chime's shape (T0009) one octave down — when a Mend pays or a held pay clears at a leak. If that leak also starts the last stand, the sting (T0091) plays instead — the bad note wins. A new two-note method in the Sfx module beside the coin chime, the tier chime and the sting; procedural, no sound file. Silent when sound is off (T0035).
- State: the count and a held pay are run state — they survive a resume (the T0042 pattern) and a new run starts the count fresh.
- Closest existing augment: Mint (a passive Epic aura that touches the run's economy and never attacks); new is that it pays in **lives** — the first augment that restores lives — and its trigger is the run's total kills, not kills near a spot (Mint) or a wave's result (Momentum).

- **16-cap (the augments module):** the pool caps at 16 augments — after registering, if the pool has more than 16, also remove the first of **Frost, then Rally, then Mint** that is still in the AUGMENTS index (a mechanical deletion, T0192's pattern; the full protocol is in T0064's task) and say which in the result.

## Acceptance criteria
- [ ] Mend rolls only as an Epic card, and its draft and tower-panel cards read the two card lines above, both passing the caps in tests/content.test.ts.
- [ ] A Mend-only tower never fires and deals no damage; its kills line (T0070) reads "kills 0"; it shows the low green disc with one tick per copy.
- [ ] With one Mend on the board, the 12th kill this run (any source, including an Ember killing tick) pays the run +1 life: a green "+1" on the lives number, the "life in N" line restarting at 12, and the chime playing.
- [ ] At the run's starting lives, reaching the count does not raise the lives: the panel line reads "life held", and the next leak pays the +1 back on the lives number (green pop, chime) — the lives never read above the starting number.
- [ ] A second Mend anywhere in the run changes the target to 10 (three → 8, four → 6, five or more → 4), and a copy added mid-count shortens the current count.
- [ ] The count and a held pay survive a resume (T0042) and are fresh on a new run.
- [ ] Sound off (T0035) keeps the pay visible and the chime silent; a leak that both starts the last stand and clears a held Mend plays the sting (T0091), not the chime.

## Design (architect, desktop)

### Files
- create `src/content/augments/mend.ts` - the Mend augment data (id `mend`, `tier: 'epic'`) + `export const MEND_FLOOR_KILLS = 4`
- create `src/core/mend.ts` - pure run-side rules: copy count, target, pay, held clear, panel line
- create `src/systems/attacks/mend.ts` - the `mend` Attack: `() => false` (never fires), modeled on `rally.ts`
- create `src/systems/enemyHooks/mendLife.ts` - the hook: counts kills, pays/holds, clears held at a leak
- create `src/systems/fx/lifePay.ts` - the small green "+1" that rises from the lives number
- create `tests/core/mend.test.ts` - unit tests for the core rules
- edit `src/content/types.ts` - `AttackKind` gains `| 'mend'` (insert after the `'rally'` entry, with a doc line); `FirstForm` gains `/** The run's kill count for the next +1 life when this is the run's first copy (Mend). */ mendKills?: number;` (after `goldRadius`); `AddedForm` gains `/** Each further copy in the run shortens that count by this many kills (Mend). */ mendPerCopy?: number;` (after `goldPerKill`)
- edit `src/content/augments/index.ts` - import + one `mend,` line in `AUGMENTS` (after `mint,`)
- edit `src/core/augments.ts` - `TowerSpec` gains `mendCount: number;` (after `goldPerKill`) + `mendCount: 0` in `EMPTY` and in the `towerSpec` literal; after the mint loop add `for (const a of augments) if (a.id === 'mend') spec.mendCount += 1;`; in `describeSpec` add `} else if (spec.kind === 'mend') { line = 'Every 12 kills this run, the run gets +1 life'; }` before the `spec.damage <= 0` branch
- edit `src/core/run.ts` - two fields after `streakPaid`: `mendCount = 0;` / `mendHeld = false;` (with short comments naming core/mend.ts)
- edit `src/core/saveRun.ts` - `SavedRun` gains required `mendCount: number; mendHeld: boolean;` after `rerollUsed`; in `loadSavedRun` validate `if (p.mendCount !== undefined && !inInt(p.mendCount, 0, 12)) return undefined;` and the boolean analog, and return `mendCount: p.mendCount ?? 0, mendHeld: p.mendHeld ?? false,` (old saves load fresh, never rejected)
- edit `src/systems/RunSave.ts` - `persist`: add `mendCount: run.mendCount, mendHeld: run.mendHeld,` after `rerollUsed`; `restore`: add `run.mendCount = saved.mendCount; run.mendHeld = saved.mendHeld;` after the `rerollUsed` line
- edit `src/systems/attacks/index.ts` - import + `mend,` in `ATTACKS` (after `rally,`)
- edit `src/systems/enemyHooks/index.ts` - import + `mendLife,` in `ENEMY_HOOKS` (after `mintRing,`)
- edit `src/audio/Sfx.ts` - one method after `sting()`: `mend(): void { this.tone(330, 0.08, 'sine', 0.1); this.tone(392, 0.08, 'sine', 0.1, undefined, 0.08); }` with a doc line (E4 then G4, coin chime's shape one octave down at the tier chime's quiet)
- edit `src/entities/towerLook.ts` - one `DECORATIONS` entry after the Mint entry (see Interfaces for the exact code)
- edit `src/ui/hud/TowerPanel.ts` - the "life in N" / "life held" line under the kills line, only for towers holding a Mend
- edit `src/ui/hud/StatsCard.ts` - register `statsLives`, consume the `mendLivesPay` flag, forceable `popLives`
- edit `src/debug/runChecks.ts` - one invariant line after `run.streak`
- edit `tests/content.test.ts` - the first-form check (line 51) gains `|| a.first.mendKills`
- edit `tests/core/saveRun.test.ts` - `sample()` gains `mendCount: 5, mendHeld: true`; one test that a save without the pair loads fresh, one `broken({ mendCount: 13 })`

### Interfaces
`src/content/augments/mend.ts` (card lines verbatim, both within caps):
```ts
export const MEND_FLOOR_KILLS = 4;
export const mend: AugmentDef = {
  id: 'mend', name: 'Mend',
  description: 'Every 12 kills this run, +1 life. Added: −2 kills per extra Mend.',
  asTower: 'Every 12 kills this run, the run gets +1 life.',
  asAdded: '−2 kills per extra Mend: 12, 10, 8, 6, 4 — no shorter',
  look: { shape: 'circle', color: 'green', size: 0.22 },
  first: { kind: 'mend', damage: 0, range: 2, rate: 1, mendKills: 12 },
  added: { mendPerCopy: 2 },
  tier: 'epic',
  tiers: { rare: { asAdded: '−2 kills per extra Mend: 12, 10, 8, 6, 4 — no shorter' }, epic: { asAdded: '−2 kills per extra Mend: 12, 10, 8, 6, 4 — no shorter' } },
};
```
`src/core/mend.ts` (pure; imports `START` from `../config`, `mend`/`MEND_FLOOR_KILLS` from `../content/augments/mend`, `type RunState` from `./run`):
```ts
export function mendCopies(towers: readonly { augments: readonly { id: string }[] }[]): number;
export function mendTarget(copies: number): number;   // Math.max(mend.first.mendKills ?? 12 - (mend.added.mendPerCopy ?? 2) * (copies - 1), MEND_FLOOR_KILLS)
export function mendPay(run: RunState): 'paid' | 'held';          // lives < START.lives → lives += 1, 'paid'; else 'held'
export function mendClearHeld(run: RunState): boolean;            // needs mendHeld; clears it, lives = Math.min(lives + 1, START.lives)
export function mendTick(run: RunState, copies: number): 'paid' | 'held' | 'none';
// copies === 0 || run.mendHeld || run.mendCount < mendTarget(copies) → 'none'; else const r = mendPay(run); run.mendCount = 0; return r
export function mendLine(run: RunState, copies: number): string;  // held → 'life held'; else `life in ${Math.max(1, mendTarget(copies) - run.mendCount)}`
```
`src/systems/enemyHooks/mendLife.ts`:
```ts
export const mendLife: MakeEnemyHook = (ctx) => {
  let heldAtLeak = false;
  const payFx = (): void => {
    const spot = ctx.scene.registry.get('statsLives') as Point | undefined;
    if (!spot) return;
    lifePay(ctx.fx, ctx.board.toBoard(spot));
  };
  return {
    onKill() { if (mendCopies(ctx.towers()) > 0) ctx.run.mendCount += 1; },
    onLeak() { if (ctx.run.mendHeld) heldAtLeak = true; },
    update() {
      if (ctx.run.over) return;
      if (heldAtLeak) {
        heldAtLeak = false;
        if (mendClearHeld(ctx.run)) {
          ctx.scene.registry.set('mendLivesPay', true); // StatsCard pops the lives number green
          payFx();
          if (!isLastStand(ctx.run)) ctx.sfx?.mend(); // a leak that starts the last stand plays the sting instead
        }
        return;
      }
      if (mendTick(ctx.run, mendCopies(ctx.towers())) === 'paid') { payFx(); ctx.sfx?.mend(); }
    },
  };
};
```
`src/systems/fx/lifePay.ts`: `export function lifePay(fx: FxSystem, x: number, y: number): void;` — returns early on `fx.full`; one `fx.scene.add.text(x, y - 16, '+1', textStyle(14, PALETTE.green, { fontStyle: 'bold', stroke: cssColor(PALETTE.card), strokeThickness: 4 })).setOrigin(0.5).setDepth(DEPTH.fx)`, then `fx.track(t, 750, { y: y - 46, alpha: 0, ease: 'Quad.easeOut' })` (model: `FxSystem.mintPop`).
`src/entities/towerLook.ts` new DECORATIONS entry (after Mint):
```ts
// Mend: a low green disc at the base, one tick per Mend in the tower.
(g, spec) => {
  if (spec.mendCount === 0) return;
  g.fillStyle(PALETTE.greenDeep, 1); g.fillCircle(0, 15, 10);
  g.fillStyle(PALETTE.green, 1); g.fillCircle(0, 13, 10);
  for (let i = 0; i < spec.mendCount; i++) {
    const a = -Math.PI / 2 + (i - (spec.mendCount - 1) / 2) * 0.55;
    fillRing(g, 0, 13, 6, 2.5, a - 0.14, a + 0.14, PALETTE.greenDeep, 1);
  }
},
```
`TowerPanel.ts`: new const `MEND_LINE = 14` beside `DPS_LINE`; in `build()` `const hasMend = tower.augments.some((a) => a.id === mend.id);` (import `mend` from `../../content/augments/mend`), `H` gains `+ (hasMend ? MEND_LINE : 0)`, the kills text's y gains `− (hasMend ? MEND_LINE : 0)`, and when `hasMend` create `this.mendText` (a field beside `killsText`, reset to `undefined` in `build()`) at `H / 2 - 79 - DPS_LINE` with `mendLine(game.run, mendCopies(game.towers.towers))`, `textStyle(11, PALETTE.muted)`, pushed to `items`; in `update()` refresh it beside the kills refresh: `if (this.mendText && tower) this.mendText.setText(mendLine(game.run, mendCopies(game.towers.towers)));`
`StatsCard.ts`: in `layout()` beside the `statsGold` line add `this.scene.registry.set('statsLives', { x: this.box.x + this.lives.x, y: this.box.y + this.lives.y });`; in `update()` after the lives-pop block: `if (this.scene.registry.get('mendLivesPay')) { this.scene.registry.delete('mendLivesPay'); this.popLives(true); }`; `popLives(force = false)`: `if (this.livesPop && !force) return; if (force) this.scene.tweens.killTweensOf(this.lives);` then the existing body.
`runChecks.ts`: `['run.mend', (g) => (g.run.mendCount >= 0 && g.run.mendCount <= 12 && (!g.run.mendHeld || g.run.lives <= START.lives + 1) ? null : `mend count ${g.run.mendCount} (held ${g.run.mendHeld}), lives ${g.run.lives}`)],`

### Steps
1. `content/types.ts`: the union entry and the two optional form fields.
2. `content/augments/mend.ts`, then register in `content/augments/index.ts`.
3. `core/mend.ts` (all six functions, exact bodies above).
4. `core/run.ts` fields; `core/saveRun.ts` schema + tolerant load; `systems/RunSave.ts` persist/restore.
5. `core/augments.ts`: `mendCount` (interface, EMPTY, literal, count loop) + `describeSpec` case.
6. `systems/attacks/mend.ts` + `ATTACKS` line.
7. `systems/fx/lifePay.ts`, then `systems/enemyHooks/mendLife.ts` + `ENEMY_HOOKS` line.
8. `audio/Sfx.ts` `mend()`; `entities/towerLook.ts` decoration.
9. `ui/hud/TowerPanel.ts` line; `ui/hud/StatsCard.ts` registry/flag/force pop.
10. `debug/runChecks.ts` invariant; `tests/content.test.ts` condition; tests.
11. `npm run check` then `npm run smoke`.

### Pitfalls
- `onLeak` fires BEFORE `run.leak()` applies the loss (EnemySystem lines 101-102): never pay in `onLeak` — `onLeak` only books `heldAtLeak`, the clear happens in `update()` same frame, after the loss lands.
- Guard `ctx.run.over` at the top of the hook's `update()`: the leak that books the clear can end the run before `update()` runs, and a pay at 0 lives would resurrect it.
- A held clear nets lives unchanged in one frame (5→4→5), so StatsCard's `lives > lastLives` auto-pop never fires for it — that's what the `mendLivesPay` flag + `popLives(true)` are for; don't remove either.
- The held pay is silent (no chime on the hold itself); the chime plays only on a pay and on a held clear, and not at all when the clearing leak starts the last stand (the banner stings instead).
- Old saves lack the mend fields: load must default them to fresh (0/false), not reject the save.
- Adding `mend` to `AttackKind` makes the `ATTACKS` record incomplete until step 6 — the typecheck catches it; `TowerSystem.update` already skips Mend (damage 0, nothing else set), so the never-firing attack file is for the record, don't add firing logic.
- The disc ticks are drawn on `deco` (origin = body center, y−4 above the plinth): small offsets, never rotate the painted disc; `fillRing` for ticks, no thick strokes.
- All new registry lines go next to their kin, never appended at list ends (see exact spots above).
- The fx "+1" and its offset are board units (like `popText`/`mintPop`); the registry point is CSS px and must go through `ctx.board.toBoard()`.

### Tests
- `tests/core/mend.test.ts`: `mendTarget` 1→12, 2→10, 3→8, 4→6, 5→4 and 7→4 (floor); `mendPay` pays below `START.lives`, holds at it, and a resumed run at 3 saved lives still pays up (cap is the starting 20, not 3); `mendClearHeld` false when not held, +1 capped at 20 when held; `mendTick` 'none' under target / with 0 copies / while held, 'paid' resets `mendCount` to 0 (restart after pay), 'held' sets `mendHeld` and resets, and a copy added mid-count (count 11, target 10) pays; `mendLine` 'life in 12' fresh, 'life in 7' at count 5, 'life held', 'life in 1' when a second copy shortens past the count; `towerSpec([mend])` kind 'mend' / damage 0 / `mendCount` 1, `towerSpec([bolt, mend])` kind 'shot' with `mendCount` 1, two mends → 2.
- `tests/core/saveRun.test.ts`: sample round-trip with the pair; a save without the pair loads 0/false; `broken({ mendCount: 13 })`.
- `tests/content.test.ts`: only the one extra `|| a.first.mendKills` (no new tests).
