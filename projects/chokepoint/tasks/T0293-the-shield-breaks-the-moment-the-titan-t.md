---
id: T0293
title: "The shield breaks: the moment the Titan takes full damage"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-30T17:15:59Z
claimed_at: 2026-10-30T17:28:45Z
---

## Goal
The wave-20 boss's trick changes state the instant the Guard dies — the Titan goes from halved to full — and right now that change is invisible. The player should see the shield break, at the Titan.

## Details
- The instant a Guard dies while the Titan it was shielding is still alive: one burst of 8 chips in the shield's own orange (the flat disc the Guard carried, T0259) at the Titan's token, and one small white chip — "shield down" (the name tag's look, T0085: bold 12 px muted ink on a rounded white chip) — riding over the Titan's token for ~1 s and fading.
- The Guard's own death feedback (the kill burst at the Guard's spot, its gold) is unchanged; this moment plays at the Titan, the one whose state changes.
- Once per run: wave 20 sends exactly one Guard and one Titan. A Guard that dies after its Titan plays nothing, as does any Guard on a board with no Titan; a resumed run whose Guard is already dead plays nothing.
- No sound, no input, no new HUD element. It teaches with what the game already shows: the bosses reference (T0277) already reads "kill the Guard to make the Titan take full damage" — the chip names the state change at the moment of change.
- One new enemy-hook file on the bossOut pattern (T0284), registered in the hooks' index: it fires on a Guard's death only while a Titan is alive.

## Acceptance criteria
- [ ] Killing the Guard while the Titan is alive plays the 8-chip orange burst at the Titan and the "shield down" chip over it for ~1 s.
- [ ] Killing the Titan first (or a Guard on a non-boss wave) plays nothing; the moment plays at most once per run, including across a resume.
- [ ] No sound, no new HUD card; the Guard's own death feedback is unchanged.
- [ ] npm run check and the desktop 1280×720 / mobile 412×915 smoke pass.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/shieldDown.ts` — the new hook: on a Guard's death, if a Titan is still on the board, play the shield-break at the Titan.
- edit `src/systems/enemyHooks/index.ts` — one import line (next to the `titanShield` import) and one line in `ENEMY_HOOKS` (right after `titanShield`).

### Interfaces
No new types. One new hook of the existing `MakeEnemyHook` type, exporting exactly:
```ts
export const shieldDown: MakeEnemyHook
```
It uses only the context's `enemies` (to find the live Titan) and `fx` (burst + chip). No `sfx`, no `scene`, no `run`.

### Steps
1. Create `src/systems/enemyHooks/shieldDown.ts` with exactly this content (model: `bossDeath.ts` for the `onKill({ enemy })` shape; `titanShield.ts` for the closure boolean and the "find the live Titan" idiom):
```ts
import { PALETTE } from '../../content/palette';
import { nameLabel } from '../fx/nameLabel';
import type { MakeEnemyHook } from './hook';

/**
 * The shield's break: the moment a Guard dies while its Titan is still on the board, the Titan
 * goes from halved to full damage - and that change is shown at the one whose state changes, not
 * at the dead Guard. One 8-chip burst in the shield's own orange (the flat disc the Guard carried,
 * art/entities.ts) at the Titan's token, and the name chip's look (systems/fx/nameLabel.ts)
 * reading "shield down" over it for ~1 s. The Guard's own kill burst is unchanged (EnemySystem).
 * A Guard that dies after its Titan, or any Guard with no Titan on the board, plays nothing;
 * at most once per run (one Guard and one Titan, both wave 20). No sound, no HUD.
 */
export const shieldDown: MakeEnemyHook = ({ enemies, fx }) => {
  let played = false; // at most once per run (one Guard and one Titan, both wave 20)
  return {
    onKill({ enemy }) {
      if (played || enemy.def.id !== 'guard') return;
      const titan = enemies.all.find((e) => e.active && e.def.id === 'titan');
      if (titan === undefined) return; // the Guard died after its Titan: no break to show
      played = true;
      fx.burst(titan.x, titan.y, PALETTE.orange, 8); // the shield's orange, where its wall now takes full
      nameLabel(fx, titan.x, titan.y, 'shield down');
    },
  };
};
```
2. In `src/systems/enemyHooks/index.ts`: add `import { shieldDown } from './shieldDown';` on the line after `import { titanShield } from './titanShield';` (line 8).
3. In the same file, add `shieldDown,` to the `ENEMY_HOOKS` array immediately after `titanShield,` (line 36) — next to its kin, not at the end of the list.

### Pitfalls
- The whole correctness is the `find` + `played` guard: never play at a dead/absent Titan, never for a non-Guard kill, never twice. This also satisfies "kill the Titan first" and "Guard on a non-boss wave play nothing" (wave 20 is the only source of a Guard).
- Do not add the two `index.ts` lines at the end of the file/array — that is where every task appends and it becomes a merge conflict; put them next to `titanShield`.
- `fx.burst` and `nameLabel` both self-cap on `fx.full` (burst checks `this.live < FxSystem.MAX`; nameLabel `if (fx.full) return`), and both own their objects via `fx.track` — do not add your own cap check or cleanup.
- Do not destructure `sfx`, and add no sound and no HUD element. Do not touch `EnemySystem` or `titanShield.ts` (that hook only flips `shielded`; this one is a separate visual, both may coexist).
- Board units (`titan.x`, `titan.y`) are correct here — a hook, not a HUD/overlay; no screen-pixel math involved.

### Tests
none
