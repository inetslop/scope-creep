---
id: T0039
title: "Pop: the first sound, a pop when a monster dies, pitched by its size"
size: M
priority: 1
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T07:44:39Z
epic: E11
---

## Goal
The field is silent. Give it its first sound: when a monster pops it makes a short pop, and a big one pops deeper than a small one. This is also where the game's audio starts, so every sound after it (chime, coin, more) builds on the same little layer.

## Details
- A short "pop" plays the moment any monster dies (Dot, Puff, Snail, Spitter, Zippy, and Flee and Boing as they land). It is a candy pop, not a gun or an explosion: a soft blip that snaps, like a bubble.
- Pitch follows size: a small monster (a Dot) pops high, a big one (a Puff and anything bigger) pops lower. The ear reads the crowd the way the eyes already do.
- One pop per monster that dies. A Puff that pops into three Dots plays one pop, not four.
- A crowd of ten dying at once must not turn into a buzz: overlapping pops are capped/throttled so the mix stays clean.
- Quiet by default: the pop sits under the action, not over it, and is short (under about 0.15 s).
- No sound before the match is underway. On phones the audio starts on the first user gesture (tapping Play), so there is no silent-autoplay problem, and nothing blocks the touch controls.
- No engine change: the sound is a small audio layer the developer adds on top, triggered by a monster that is already dying. The architect decides exactly how it hooks the existing death.

## Acceptance criteria
- [ ] Kill a Dot and a Puff in the same match: two pops, and the Dot's is clearly higher-pitched than the Puff's.
- [ ] A Puff popping into three Dots plays exactly one pop.
- [ ] Kill a whole crowd at once: the pops overlap but the mix stays clean (no loud buzz) and nothing stutters or drops frames.
- [ ] On a phone, tap Play, then kill a monster: the pop plays (audio started on the tap).
- [ ] The pop is short (under about 0.15 s) and quiet enough that a brighter level-up sound can sit on top of it later.

## Design (architect, desktop)

### Files
- create `src/audio/sfx.ts` - the game's whole audio layer (WebAudio, no files): gesture unlock, a "match is on screen" gate, and the pitched pop sound. Later sounds (chime, coin) add their own exported functions to this same file.
- create `src/hud/audio.ts` - an invisible HUD part (no DOM, so no `.css`): arms the gesture listener when the HUD is built (page load) and feeds the match gate every match frame
- edit `src/hud/index.ts` - one import and one line in `HUD_PARTS`
- edit `src/content/effects/pop.ts` - play the sound on the effect's first frames, passing `fx.seed`, `fx.value` (the dead monster's radius), `fx.age`
- create `tests/sfx.test.ts` - unit test for the pure radius→pitch mapping

### Interfaces
How it hooks the existing death: the engine already fires the `pop` effect on every monster death (`engine/sim/match.ts:750`, `addEffect(rules.effects.death, m, m, m.radius)`), and every client runs the effect's `draw(g, fx)` for its 0.45 s with `fx.value = radius`, `fx.age` and a per-instance `fx.seed` (the client hashes tick+position, `engine/client/session.ts:273`). The sound plays from that draw, once per seed. No engine change, no new network data.

`src/audio/sfx.ts` (exact file):
```ts
/**
 * The game's sound: short WebAudio blips, no files, all in this one layer.
 * Audio may only start on a user gesture (tapping Play), and only plays while a match is on
 * screen (the audio HUD part feeds hudNow() every match frame). Sounds sit under the action.
 */

let ctx: AudioContext | undefined;
let master: GainNode | undefined;
let armed = false;
let lastHud = 0; // performance.now() of the last match frame
let active = 0; // pops still sounding
const heard = new Map<number, number>(); // effect seed -> until when its pop has played

function wake(): void {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.8;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
}

/** Attach the gesture listeners that may start audio. Idempotent; called from the audio HUD part. */
export function arm(): void {
  if (armed) return;
  armed = true;
  for (const ev of ['pointerdown', 'keydown', 'touchstart'] as const) window.addEventListener(ev, wake, { passive: true });
}

/** A match frame just ran: pops may play for about a second (keeps the start screen silent). */
export function hudNow(): void {
  lastHud = performance.now();
}

/** The pop's starting pitch: small radii pop high, big radii low. */
export function pitchFor(radius: number): number {
  return Math.min(900, Math.max(180, 900 - (radius - 8) * 40));
}

function blip(f0: number, peak: number, life: number): void {
  if (!ctx || !master) return;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(f0, t0);
  osc.frequency.exponentialRampToValueAtTime(f0 * 0.55, t0 + life);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + life);
  osc.connect(gain);
  gain.connect(master);
  osc.onended = () => {
    active -= 1;
  };
  osc.start(t0);
  osc.stop(t0 + life + 0.02);
}

/**
 * One candy pop for a monster that died, pitched by its radius (the 'pop' effect's value).
 * Called from the pop effect's draw() on every client: at most once per effect (its seed) and
 * at most 6 pops at once, so a whole crowd dying stays a clean mix.
 */
export function pop(seed: number, radius: number, age: number): void {
  if (!ctx) return; // not unlocked by a gesture yet
  if (age > 0.25) return; // the effect's first frames only
  const now = performance.now();
  if (now - lastHud > 1000) return; // no match on screen
  const until = heard.get(seed);
  if (until !== undefined && until > now) return;
  heard.set(seed, now + 700);
  if (heard.size > 96) for (const [s, u] of heard) if (u <= now) heard.delete(s);
  if (active >= 6) return;
  active += 1;
  blip(pitchFor(radius), 0.12, 0.12);
}
```

`src/hud/audio.ts` (exact file):
```ts
import type { MakeHudPart } from '../../engine/api.ts';
import { arm, hudNow } from '../audio/sfx.ts';

/** No card: starts the sound on the first gesture and keeps it on while the match is shown. */
export const audio: MakeHudPart = () => {
  arm();
  return { update() { hudNow(); } };
};
```

`src/hud/index.ts`: add `import { audio } from './audio.ts';` between the `./base.css` and `./connection.ts` imports, and add `audio,` as the first line of the `HUD_PARTS` array.

`src/content/effects/pop.ts`: add import `import { pop as popSound } from '../../audio/sfx.ts';` after the `PALETTE` import, and as the first line of `draw(g, fx)` add `popSound(fx.seed, fx.value, fx.age);`.

### Steps
1. Create `src/audio/sfx.ts` exactly as above.
2. Create `src/hud/audio.ts` exactly as above (no `.css` file: it renders no DOM).
3. Edit `src/hud/index.ts` (the one import + one array line).
4. Edit `src/content/effects/pop.ts` (one import + one call line).
5. Create `tests/sfx.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { pitchFor } from '../src/audio/sfx.ts';

describe('sfx: the pop pitch', () => {
  it('small monsters pop higher than big ones', () => {
    expect(pitchFor(11)).toBeGreaterThan(pitchFor(14)); // Flee, Dot
    expect(pitchFor(14)).toBeGreaterThan(pitchFor(22)); // Dot, Puff
  });
  it('stays in the candy range for any radius', () => {
    for (const r of [8, 11, 14, 18, 22, 40, 100]) {
      const f = pitchFor(r);
      expect(f).toBeGreaterThanOrEqual(180);
      expect(f).toBeLessThanOrEqual(900);
    }
  });
});
```
6. Run `npm run check`, then `npm run smoke`. Do not touch any other file.

### Pitfalls
- `src/content/**` may not use `window`, `performance`, `Date` or `Math.random` (lint): `pop.ts` only passes `fx` arguments; all browser access stays in `src/audio/sfx.ts`.
- Don't "fix" `flee.ts:85`: Flee fires a second identical `pop` effect from its `onDeath` on top of the engine's death effect — same tick and position, so the client gives both the same `fx.seed` and the `heard` map collapses them to one sound. Editing flee.ts is out of scope and would break the merge with others.
- Puff→3 Dots plays one pop because only deaths fire the effect (`match.ts:750`); `ctx.spawnMonster` fires nothing. Don't add sounds to spawns.
- The `lastHud` gate is load-bearing: behind the start screen the engine draws a spectator match, so without it pops would play on the menu. `hud.update()` only runs while a real session exists (`engine/client/main.ts:222`), which is why the gate uses "HUD updated in the last 1 s".
- Never skip creating the oscillator based on `ctx.state`: scheduling while suspended is fine and plays once resumed; a skipped node would leak `active` (its `onended` never fires) and mute all later pops.
- `exponentialRampToValueAtTime` needs non-zero values: keep the `0.0001` floors and the positive `f0 * 0.55`.
- Keep the per-voice peak at 0.12 (master 0.8): the later level-up chime must sit on top of the pop. Keep the 6-voice cap for crowd bursts.
- In the test environment `sfx.pop` is a no-op (`ctx` undefined), which is why the content test's `effect.draw` calls keep passing — don't create the `AudioContext` at module scope.

### Tests
`tests/sfx.test.ts` as above (the `pitchFor` helper is pure; a later retune of the pitch curve would be caught). Everything else (effect fires per death, draw throws nothing) is covered by `engine/tests/`.
