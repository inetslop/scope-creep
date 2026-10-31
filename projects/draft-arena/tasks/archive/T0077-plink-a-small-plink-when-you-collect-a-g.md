---
id: T0077
title: "Plink: a small plink when you collect a gem"
assignee: yoga
size: S
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-31T13:15:23Z
claimed_at: 2026-10-31T14:34:59Z
finished_at: 2026-10-31T15:13:15Z
---

## Goal
The farm loop — the quietest moment in the match — gets a tick you can hear: a small plink the moment a gem lands on you, and a deeper, longer plink for the big jackpot gem.

## Details
- A short, high plink the moment your critter collects a gem (a monster gem, an event gem or the jackpot gem): about 0.1 s, a quiet sine blip (around 1500 Hz, peak about 0.06) — higher and shorter than the coin clink, sitting under it.
- The jackpot gem: the same plink an octave down and twice as long (about 0.2 s) — clearly deeper, so the big gem reads by ear.
- An event gem keeps its coin clink (the plink is the gem, the clink is the coin); both can play at once, the plink first.
- A small green star (8 units) pops where the gem was collected and fades over 0.3 s — a candy tick, no glow.
- Your own pickups only: you never hear or see another player's plink or star.
- It goes through the existing audio layer (gesture unlock, on while the match is shown) and works the same on desktop and mobile.

## Acceptance criteria
- [ ] A monster gem you collect plays a short, high plink (about 0.1 s) and a small green star pops where the gem was, fading over 0.3 s.
- [ ] The jackpot gem plays a lower, longer plink (an octave down, twice the length); a normal gem and the jackpot are told apart by ear.
- [ ] An event gem plays the plink and its existing coin clink; a monster gem plays the plink alone.
- [ ] Only your own pickups make a sound or a star, on desktop and mobile, and the plink is never louder than the coin clink or the monster pop.

## Design (architect, yoga)

### Files
- create `src/hud/plink.ts` — self-only HUD part (like `coin.ts`): plink sound + green star when YOU collect a gem
- create `src/hud/plink.css` — the star's styles, centered on you (the camera sits on you)
- edit `src/audio/sfx.ts` — add `plink(big)` next to `coinTick()`
- edit `src/hud/index.ts` — import + one line in `HUD_PARTS` after `coin,`

### Interfaces
```ts
// added to src/audio/sfx.ts, placed above coinTick()
export function plink(big: boolean): void; // big: the jackpot — 750 Hz over 0.2 s; else 1500 Hz over 0.1 s, peak 0.06
```

### Steps
1. Create `src/hud/plink.ts` exactly:
```ts
import type { MakeHudPart } from '../../engine/api.ts';
import './plink.css';
import { plink } from '../audio/sfx.ts';

/**
 * The gem plink: a short high blip and a little green star the moment you collect a gem —
 * a monster gem, an event gem or the jackpot (an octave down, twice as long). Yours only:
 * you never hear or see another player's. The coin clink stays the coin part's; the star
 * pops on you, where the gem lands.
 */
export const plink: MakeHudPart = (root) => {
  const makeStar = (): void => {
    const s = document.createElement('div');
    s.className = 'plink-star';
    s.innerHTML =
      '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 5 L61.2 34.6 L92.8 36.1 L68.1 55.9 L76.5 86.4 L50 69 L23.6 86.4 L31.9 55.9 L7.2 36.1 L38.8 34.6 Z" fill="#51cf66" stroke="#3b3355" stroke-width="8" stroke-linejoin="round"/></svg>';
    s.addEventListener('animationend', () => s.remove());
    root.append(s);
  };
  let lastXp: number | undefined;
  let lastLevel: number | undefined;
  return {
    update(view) {
      const me = view.me;
      if (!me) { lastXp = lastLevel = undefined; return; } // menu/connecting: forget
      if (lastXp === undefined) { lastXp = me.xp; lastLevel = me.level; return; } // first frame: no tick
      const d = me.xp - lastXp;
      const levelChanged = me.level !== lastLevel;
      lastXp = me.xp;
      lastLevel = me.level;
      if (levelChanged) return; // level up or a prestige: the chime has the tick
      if (d > 0) {
        plink(d === 25); // the jackpot's xp is 25: an octave down, twice as long
        makeStar();
      }
    },
  };
};
```
2. Create `src/hud/plink.css` exactly:
```css
/** The gem plink's star: on you, at the screen's centre (the camera sits on you), fading in 0.3 s. */
.plink-star {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 12px;
  height: 12px;
  margin-left: -6px;
  margin-top: -6px;
  pointer-events: none;
  animation: plink-fade 0.3s ease-out forwards;
}

@media (min-width: 768px) {
  /* 8 world units: about 12 px on a phone (412x915), about 8 px at 1280x720. */
  .plink-star {
    width: 8px;
    height: 8px;
    margin-left: -4px;
    margin-top: -4px;
  }
}

@keyframes plink-fade {
  from { opacity: 1; transform: scale(0.4); }
  to { opacity: 0; transform: scale(1); }
}
```
3. In `src/audio/sfx.ts`, add above `coinTick()` (its comment + function):
```ts
/**
 * One short, high plink the moment your critter collects a gem: a 1500 Hz sine over 0.1 s, peak
 * 0.06 — higher and shorter than the coin clink, sitting under it and under the monster pop.
 * The jackpot plays it an octave down (750 Hz) and twice as long (0.2 s), so the big gem reads
 * deeper by ear. Called from the plink HUD part: only your own collections.
 */
export function plink(big: boolean): void {
  if (!ctx || !master) return;
  const life = big ? 0.2 : 0.1;
  const t0 = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = 'sine';
  o.frequency.value = big ? 750 : 1500;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.06, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + life);
  o.connect(g);
  g.connect(master);
  o.start(t0);
  o.stop(t0 + life + 0.02);
}
```
4. In `src/hud/index.ts`: add `import { plink } from './plink.ts';` (between the `connection` and `prestige` imports), and `plink,` after `coin,` in `HUD_PARTS`.

### Pitfalls
- Key the plink on the **xp delta, not the coin delta**: an event gem pays +1 coin, and so does every monster kill — coin deltas can't tell gems apart. Gems are xp (monster gem 1–5, event gem its value, jackpot 25).
- Skip level-changed frames before reading `d` (xp resets/rolls on a level-up); the chime owns that tick. Do not add coin guards to exclude mark kills (20 xp + 5 coins) or the gem-rush grab (12 + 12) — they would also kill real event-gem frames, and they are rare.
- `d === 25` exactly for the big plink, not `>=` (a level-7 crown kill pays 28).
- No seed/age gating on `plink()` (that's for effect-draw sounds); it is reached only with a match shown, like `coinTick`. No `Math.random`/`Date`/`performance` in the part.
- The star sits at 50%/50% of the screen = your critter (camera locked on you); a gem is pulled onto you and lands within ~25 units, so the centre is where it was collected. No canvas, no hand-picked offsets.
- One star per frame max (one per `d > 0`); it self-removes on `animationend`, `pointer-events: none` — it must never block input or linger.

### Tests
none.

## Result (attempt 1, yoga)

The gem farm loop now has an audible tick: a short high plink (1500 Hz, 0.1 s, peak 0.06) plays the moment you collect any gem, and the jackpot gem plays it an octave down and twice as long (750 Hz, 0.2 s). A small green star pops on you where the gem lands and fades over 0.3 s. Keyed off your own xp delta, only your pickups sound or show the star, the event-gem coin clink still plays alongside, and the plink stays under the clink and the monster pop. Added `src/hud/plink.ts` + `plink.css`, a `plink(big)` function in `src/audio/sfx.ts`, and one registry line in `src/hud/index.ts`.

- Self-review: APPROVE
- Time: 38.3 min

```
projects/draft-arena/game/src/audio/sfx.ts  | 23 +++++++++++++++++
 projects/draft-arena/game/src/hud/index.ts  |  2 ++
 projects/draft-arena/game/src/hud/plink.css | 27 ++++++++++++++++++++
 projects/draft-arena/game/src/hud/plink.ts  | 38 +++++++++++++++++++++++++++++
 4 files changed, 90 insertions(+)
```
