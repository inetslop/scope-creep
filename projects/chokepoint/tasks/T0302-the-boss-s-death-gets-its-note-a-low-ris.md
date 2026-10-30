---
id: T0302
title: "The boss's death gets its note: a low rising horn under the burst"
assignee: cachyos-x8664
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T19:42:22Z
claimed_at: 2026-10-30T20:06:48Z
---

## Goal
The run's loudest kill gets its own note: the moment the run's boss dies, one low rising horn answers the arrival's deep horn (T0268), so the wave-10/20/30 peak is heard, not just seen (pillar 5).

## Details
- One new method in `src/audio/Sfx.ts`, next to the boss's own notes (the arrival horn and `bossOut()`): `bossDown()` — three 120 ms sine notes rising G2→B2→D3 (98 → 123 → 147 Hz), 60 ms apart, volume 0.15, sequenced with `tone()`'s existing delay parameter (the sting's pattern, T0091).
- The low register is the boss horns' own (the arrival and the boss-leak horn, T0268/T0269, sit at 62–82 Hz). The small two-note E5→G5 rise — the coin chime (T0009), the wave sweep (T0240), the streak pay (T0290), the record note (T0296) — stays for small payouts; three low notes mark this as the run's biggest moment.
- One line in `src/systems/enemyHooks/bossDeath.ts`: the horn plays at the exact moment that hook already fires — the same beat as the 24-chip burst and the name card (T0273). For the Orb (wave 30) that beat is its half-hp split; for the Colossus (wave 10) and the Titan (wave 20) it is their kill.
- No HUD, no board mark, no pause-screen line: a note, not a control (the T0255 and T0284 precedent). Silent with the sound toggle off (T0035), like every Sfx note.
- Real time, not the simulation clock: at 2× fast-forward (WaveSpeed) the horn plays once per boss death, never stretched.
- Iron runs wear the same horn (the muted star, T0249, is visual only).
- The arrival horn (T0268), the out-of-reach note (T0284), the boss-leak horn (T0269) and the wave sweep (T0240) are untouched. Future bosses (the wave-40 Hive, T0292) inherit the note through the same hook.
- No unit test: Sfx is a browser output, verified by the smoke test and by ear (the T0296 precedent).

## Acceptance criteria
- [ ] Killing the Colossus (wave 10), the Titan (wave 20) or the Orb (wave 30, at its split) plays one low rising horn — three ~120 ms notes G2→B2→D3 (98/123/147 Hz), 60 ms apart, volume 0.15 — at the same moment as the 24-chip burst and the name card, once per boss death.
- [ ] Ordinary enemy deaths — Dots, Blocks, a Guard dying while the Titan lives, the Orb's two Shards, a Splitter's splinters — play no new sound.
- [ ] The arrival horn, the out-of-reach note, the boss-leak horn and the wave sweep are unchanged, and with the sound toggle off the boss death is silent.
- [ ] At 2× fast-forward the horn plays exactly once per boss death, in real time.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` — add `bossDown()` after `bossOut()` (line 139)
- edit `src/systems/enemyHooks/bossDeath.ts` — `sfx?.bossDown()` in `onKill`; new `update()` so the Orb's horn plays at its split

### Interfaces
- `Sfx.bossDown(): void` — new method, three `tone()` calls, no state.
- `bossDeath` stays a `MakeEnemyHook`; gains an `update`, no registry change (its `ENEMY_HOOKS` line is unchanged).

### Steps
1. Insert into `Sfx.ts` after `bossOut()`'s closing `}` (before `leakWarn()`):
```ts
  /** The boss dies: a low rising horn, G2 then B2 then D3 (98, 123, 147 Hz), 120 ms sines 60 ms apart, the sting's volume class up. */
  bossDown(): void {
    this.tone(98, 0.12, 'sine', 0.15);
    this.tone(123, 0.12, 'sine', 0.15, undefined, 0.06);
    this.tone(147, 0.12, 'sine', 0.15, undefined, 0.12);
  }
```
2. Rewrite `bossDeath.ts` (keep the existing doc comment, add one line after "A resumed run sets nothing.": `Its horn (Sfx.bossDown, T0302) answers the death: the Colossus's and the Titan's kill, and the Orb's split (midSplit's ring beat, where the Orb is gone with no kill).`):
```ts
import { bossId } from '../../core/waves';
import { atSplitLine } from '../../core/midSplit';
import type { MakeEnemyHook } from './hook';

export const bossDeath: MakeEnemyHook = ({ run, scene, enemies, sfx }) => ({
  onKill({ enemy }) {
    if (bossId(run.wave) !== enemy.def.id) return;
    scene.registry.set('bossDeathName', enemy.def.name);
    sfx?.bossDown();
  },
  update() {
    const boss = bossId(run.wave);
    if (boss === undefined) return;
    for (const e of enemies.all) {
      if (e.active && e.def.id === boss && atSplitLine(e.def, e.hp, e.maxHp)) sfx?.bossDown();
    }
  },
});
```
The task's "one line" undercounts: the hook's `onKill` does not fire at the Orb's half-hp split (midSplit despawns it with no kill — the hook's own doc comment says so), and the acceptance bar needs the horn at that split. The hook's `update` slot (the midSplit.ts precedent) is where that beat lives; the Colossus/Titan horn stays the `onKill` line, at the 24-chip burst and name card's beat.
3. `npm run check`.

### Pitfalls
- The `bossDeath` line must stay above the `midSplit` line in `ENEMY_HOOKS`: `update()` must see the Orb `active` before midSplit's `despawn()`; a reorder would silence the Orb.
- No double play: `atSplitLine` needs `hp > 0`, a kill needs `hp <= 0` — split and kill are mutually exclusive per Orb; shards (`def.id === 'shard'`) and every non-boss never match `bossId`, so no other death plays it.
- 2× fast-forward: `tone()` schedules on `ctx.currentTime` (real time) and the hook fires once per death — never stretched; `tone()` no-ops when `this.muted`, so the toggle-off run is silent.
- `sfx` is `Sfx | undefined`: always `sfx?.bossDown()`, like bossArrival.ts.

### Tests
none
