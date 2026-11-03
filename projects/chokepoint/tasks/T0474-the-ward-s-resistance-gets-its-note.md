---
id: T0474
title: "The Ward's resistance gets its note"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-03T05:21:43Z
claimed_at: 2026-11-03T05:45:53Z
---

## Goal
When a control fails on a Ward, the player sees it (T0335's resist ring at the Ward's base) but never hears it: the tower's side gets no sign that its push gust, root or slow did not take. One quiet blip per resist, so a failed control is heard where it happens.

## Details
- Trigger: the exact moment T0335's resist ring paints on a Ward — a Push gust, an Anchor root, or a slow that does not take. One blip per ring, never per frame; a Ward resisting two controls at one moment gets one per ring.
- Sound: one 60 ms sine blip, pitch falling C5→A4, volume 0.08 — the run's quietest class (T0419's Mute note), under the hit blip. Silent with the sound toggle off (T0035).
- Files: a new trigger file beside `systems/enemyHooks/bossDeath.ts` riding the same path that paints the resist ring (T0335's hook), and the note as a new method in `src/audio/Sfx.ts` beside T0460's sip. Closest example to follow: T0460 (the Leech's drink gets its note).
- No new HUD, board mark or text; the ring's look and timing are untouched, and the Ward's behavior is untouched.

## Acceptance criteria
- [ ] A Push gust or Anchor root that fails on a Ward plays one soft blip at the resist ring's moment; with the sound toggle off nothing plays.
- [ ] Exactly one blip per resist ring — no repeats, no per-frame plays.
- [ ] The ring's look, the Ward's behavior and everything else on screen are unchanged; no new HUD element or text.

## Design (architect, yoga)

### Files
- create `src/systems/enemyHooks/wardDenyNote.ts` - the trigger hook: plays the note at the exact moment `wardDeny.ts` paints the resist ring. Model: `leechDrinkNote.ts` (T0460).
- edit `src/systems/enemyHooks/index.ts` - import line + one registry line, both directly **above** the `wardDeny` line.
- edit `src/audio/Sfx.ts` - one new `wardDeny()` method after `leechDrink()` (line 282).

### Interfaces
```ts
// src/systems/enemyHooks/wardDenyNote.ts
export const wardDenyNote: MakeEnemyHook = ({ enemies, scene, sfx }) => {
  const REFRESH_MS = 500; // the same one wardDeny.ts's REFRESH_MS
  const last = new Map<Enemy, number>(); // real ms the blip last played, per Ward
  return {
    update() {
      const now = scene.time.now;
      for (const e of enemies.all) {
        if (!e.active || e.def.ignoresControl !== true || !e.deny) continue;
        const t = last.get(e);
        if (t !== undefined && now - t < REFRESH_MS) continue;
        last.set(e, now);
        sfx?.wardDeny();
      }
    },
    onKill({ enemy }) { last.delete(enemy); },
    onLeak(enemy) { last.delete(enemy); },
  };
};
```
```ts
// src/audio/Sfx.ts, after leechDrink():
/** The Ward's deny, at its ring's moment (systems/enemyHooks/wardDenyNote.ts): one 60 ms sine, C5 falling to A4 (523.25 to 440 Hz), 0.08 pre-master, the run's quietest class, under the hit blip. */
wardDeny(): void {
  this.tone(523.25, 0.06, 'sine', 0.08, 440);
}
```
Doc comment for `wardDenyNote.ts` (model the style on `leechDrinkNote.ts`): "The Ward's deny gets its note: the exact moment wardDeny's ring plays — a Push gust, an Anchor root or a Frost slow that takes no effect — one soft blip (Sfx.wardDeny), one per ring, never per frame. Inside a Frost aura the deny lands nonstop, but the ring refreshes at most once per 0.5 s (wardDeny's REFRESH_MS); the blip rides that same throttle. It reads the one-frame `deny` flag (entities/Enemy.ts) without clearing it — wardDeny clears it — so its line sits directly above wardDeny's in ENEMY_HOOKS (index.ts). Silent with the sound toggle off (Sfx.tone is). It draws nothing: the ring stays wardDeny's."

### Steps
1. Create `src/systems/enemyHooks/wardDenyNote.ts` exactly as above (import `type { Enemy }` from `'../../entities/Enemy'` and `MakeEnemyHook` from `'./hook'`; no Phaser import needed).
2. In `src/systems/enemyHooks/index.ts`: add `import { wardDenyNote } from './wardDenyNote';` directly above the `wardDeny` import (line 22), and `  wardDenyNote,` directly above `  wardDeny,` in `ENEMY_HOOKS` (line 99).
3. In `src/audio/Sfx.ts`, insert the `wardDeny()` method between `leechDrink()` and `towerMilestone()` (after line 282).
4. `npm run check` passes; nothing else touched — `wardDeny.ts`, `Enemy.ts` and the ring constants are unchanged.

### Pitfalls
- Registry order is load-bearing: if `wardDenyNote` lands **below** `wardDeny`, wardDeny clears `e.deny` first and the blip is silently lost forever. Keep it directly above, as the doc comment says.
- Do **not** set `e.deny = false` in the new hook — wardDeny must still read the flag to paint the ring. Read it only.
- `REFRESH_MS` must stay 500, mirroring `wardDeny.ts`; if it drifts, blips desync from the ring (extra blips per Frost aura) — one blip per ring is the acceptance bar.
- Pooled enemies: the `last` Map is keyed by Enemy object; the `onKill`/`onLeak` `delete`s are required or a recycled slot inherits a stale entry and skips a blip for 0.5 s.
- No mute check in the hook: `Sfx.tone()` already returns silent while `muted` (T0035) — do not add one.
- Use `scene.time.now` (real ms), never `dt` accumulation — the ring's timing is scene.time (wardDeny.ts line 63).

### Tests
none
