---
id: T0040
title: "Chime: a level-up chime"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: [T0039]
attempts: 1
created: 2026-10-31T07:44:39Z
claimed_at: 2026-10-31T08:39:03Z
epic: E11
---

## Goal
A level-up is the one moment of every life, and right now it is only a yellow ring. Give it a short bright chime, so the player hears their build grow even when the ring has already spread off-screen.

## Details
- The moment the player levels up, a short two-note chime plays (a bright "ding-ding," like a candy bell), at the same instant the yellow level-up ring spreads from them.
- One chime per level-up event, even if several levels land at once.
- Bright and short (under about 0.2 s), a touch higher and cleaner in pitch than the monster pops, so it reads as "you," not "the crowd."
- Uses the same audio layer the Pop set up (T0039). This task adds only the chime and hooks it to the moment the level-up ring plays.
- No engine change; works on desktop and mobile (audio already started by T0039).

## Acceptance criteria
- [ ] Level up once in a match: one bright chime plays at the same moment the yellow ring spreads.
- [ ] The chime is clearly brighter and higher than a monster pop, so it reads as the player's own moment.
- [ ] If a level-up and a monster pop happen at the same instant, both are heard and neither drowns the other.
- [ ] On a phone it plays with no extra tap and does not block the controls.

## Design (architect, yoga)

### Files
- create `src/hud/chime.ts` - HUD part (no DOM): when `view.me.level` goes up, play the chime from T0039's audio layer.
- create `src/hud/chime.css` - comment only, e.g. `/* The chime plays a sound and shows nothing: no styles of its own. */` (every part's .ts imports its .css, as `xpBar.ts` does).
- edit `src/hud/index.ts` - add `import { chime } from './chime.ts';` after the `connection` import (keep alphabetical) and `chime,` after `connection,` in `HUD_PARTS`.
- edit T0039's audio-layer file (find it: Grep `AudioContext` in `src/` — T0039 is the only task that creates one) - add the `playChime` function next to the pop's play function.

### Interfaces
```ts
// in T0039's audio-layer file (same module that owns the shared AudioContext + master gain):
export function playChime(): void;
// in src/hud/chime.ts:
export const chime: MakeHudPart; // () => { update(view) { ... } } — no DOM, root unused
```
`chime.ts` body, exactly:
```ts
import type { MakeHudPart } from '../../engine/api.ts';
import './chime.css';
import { playChime } from '../audio.ts'; // adjust path to T0039's file
/** Your level-up: a short bright chime, at the moment the yellow ring spreads. */
export const chime: MakeHudPart = () => {
  let last: number | undefined;
  return {
    update(view) {
      const me = view.me;
      if (!me) { last = undefined; return; }
      if (last === undefined) { last = me.level; return; }
      if (me.level > last) { last = me.level; playChime(); }
      else if (me.level < last) last = me.level; // prestige or fresh respawn: no chime
    },
  };
};
```
`playChime` (use T0039's exact names for the context variable and master gain, same wiring as the pop; same peak-gain value the pop uses):
```ts
/** Level-up: a bright two-note candy-bell "ding-ding", E6 then G6, under 0.2 s. */
export function playChime(): void {
  const t0 = actx.currentTime;
  for (const [f, delay] of [[1318.5, 0], [1568, 0.07]] as const) {
    const o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = f;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.2, t0 + delay);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + delay + 0.08);
    o.connect(g); g.connect(master);
    o.start(t0 + delay); o.stop(t0 + delay + 0.09);
  }
}
```

### Steps
1. Read T0039's audio file; note its context/master variable names and the pop's peak gain.
2. Add `playChime` there (sine notes, not the pop's noise/pitch), next to the pop function.
3. Create `src/hud/chime.ts` and `src/hud/chime.css` as above; fix the import path.
4. Add the two lines to `src/hud/index.ts` (alphabetical, after `connection`).
5. `npm run check`, then `npm run smoke`.

### Pitfalls
- Do NOT hook the chime into the `ring` effect (`effects/ring.ts`): the engine fires that same effect for every bot level-up and the crown director fires it on leader changes — it would chime for others. Only `view.me.level` rising is "you".
- Fresh oscillators per call: never reuse the pop's oscillator node, or a simultaneous pop+chime would steal each other's sound (acceptance: both heard).
- `exponentialRampToValueAtTime` cannot target 0 — ramp to 0.001.
- Level drop (prestige 18→1, respawn) must not chime: keep the `me.level > last` test; `last` resets to `undefined` only when `me` is gone (menu).
- Phone: the chime rides T0039's already-resumed context — no extra gesture, no DOM, so controls stay unblocked; total sound 0.15 s (< 0.2 s).

### Tests
- none (no new pure helper; the engine tests + smoke cover it — level up once and hear one chime with the ring).
