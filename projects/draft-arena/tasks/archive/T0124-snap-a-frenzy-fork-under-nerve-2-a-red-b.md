---
id: T0124
title: "Snap: a Frenzy fork under Nerve 2, a red burst on a player knockout while below half"
assignee: asus
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T20:44:19Z
claimed_at: 2026-10-31T22:08:56Z
finished_at: 2026-10-31T22:22:07Z
epic: E28
---

## Goal
The Frenzy's player kill becomes a moment: with the fork, knocking out a player while below half hp bursts the spot red — the wound that already makes the Frenzy hit harder now makes its kills punish whatever stands around the corpse. The Frenzy's slice of E28 (the Goober's is T0123).

## Details
- A new on-kill `snap` in the Frenzy tree, a fork under Nerve 2 alongside Adrenaline and Fang — the third kill-while-hurt payoff: a kill while hurt can pay speed (Adrenaline), coins (Fang) or the burst.
- Text (shown on the talent's row): "On a player knockout while below half your hp: a burst (radius 110) for 15 damage. Rank 2: 25."
- Talent line: id snap, upgrade snap, max 2, needs `[["nerve", 2]]`. No points commitment, no prestige gate.
- How it fires: when the player knocks out another player (human or bot, any level) while below half their own max hp, a burst strikes everything within 110 of the corpse (monsters and players alike) except the killer: 15 damage at rank 1, 25 at rank 2. A monster kill never bursts, and a knockout while at half hp or above never bursts.
- The burst is its own damage: it is a payoff, not a hit — Might, Reap and the other damage mods do not scale it (a rank-1 burst deals 15 even on a half-dead target).
- What it does to a player inside: half damage, like every other strike on a player (7 at rank 1, 12 at rank 2) — the burst is how a Frenzy trades one knockout for a second, and a hurt Frenzy is the one to fear at the crown's fall, the mark's end or a corpse gem.
- How it looks: a new effect `snap-burst` at the corpse — a red ring with an ink rim blooming out to 110 over 0.4 s, with about 20 red confetti pieces off it. The closest example is `src/content/effects/sting-burst.ts` (the same shape, teal to red); register the new effect in `src/content/effects/index.ts`.
- look: shape star, color #ff6b6b.

## Compared with what exists
One row for every on-kill:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Chomp | a kill payoff | heals the killer (5 hp, 25 on a player); Snap hurts whatever stands around the corpse — the Frenzy trades its wound for a strike, not a heal |
| Adrenaline | a kill while below half your hp | gives speed to leave (a 20% sprint for 1.5 s); Snap stays put and strikes a 110 circle, so the kill is a doorway, not an exit |
| Fang | a kill while below half your hp | banks coins from any kill (a long save); Snap is a burst in the moment, and only on a player knockout |
| Fuse | a kill by your own weapon | pops only when the bubble kills (Lobber-guarded, a 50 ring); Snap fires on any player knockout while you are below half, whatever weapon got the kill |
| Scatter | a kill by your own weapon | pops only when the Goo kills, into four seekers; Snap is a single red burst that strikes once and is gone |
| Gush | a kill by your own weapon | lays a slow puddle where a Goo kills (a zone that lingers); Snap's burst strikes once and leaves nothing on the ground |
| Chew | a kill by your own weapon | the Gush puddle it guards ticks for as long as it lasts; Snap is one instant 15/25 with no zone |
| Nest | a kill payoff | heals the killer per critter near a monster corpse (sustain); Snap strikes per critter inside 110 (offense), on a player kill |
| Sting | a kill burst | bursts only when the kill is crowded (2+ critters within 80, a radius-80 burst); Snap bursts on any player knockout while you are below half — the crowd is not the trigger, your wound is |
| Scavenge | a kill payoff | pays xp per critter near a monster corpse (the draft); Snap pays damage to whatever stands in the burst (the fight) |

The tree as the panel will draw it (Frenzy after this task):
```
Frenzy (3)
  Nerve (3, needs Frenzy 1)
    Adrenaline (2, needs Nerve 2)
    Fang (2, needs Nerve 2)
    Gore (2, needs Nerve 2, points 3, prestige 1)
    Snap (2, needs Nerve 2)
    Mend (3, needs Nerve 3)
    Reckless (1, needs Nerve 3 and Frenzy 3)
```
What a Frenzy gets, and what it costs: a point at Nerve 2, where it could buy Adrenaline (the escape sprint) or Fang (the coin branch) instead. Snap instead makes the dive pay in the moment: a Frenzy that takes a marked or crowned player while below half bursts the pursuers around the corpse, so the kill that ends a life can start a double.

## Acceptance criteria
- [ ] The Talents panel's Frenzy tab shows Snap under Nerve, beside Adrenaline and Fang, with its text and 2 ranks; it takes a point once Nerve 2 is bought.
- [ ] A Frenzy below half hp that knocks out a player sees a red ring with an ink rim bloom out to 110 with red confetti at the corpse, and everything inside takes 15 damage (rank 2: 25), the killer unaffected; a player inside takes half (7/12).
- [ ] A monster kill never bursts and a knockout while at half hp or above never bursts; the burst is not scaled by Might or Reap (a rank-1 burst still deals 15 on a half-dead target).
- [ ] The game is working and playable otherwise.

## Design (architect, desktop)

### Files
- create `src/content/upgrades/snap.ts` - the on-kill upgrade `snap` (Frenzy fork: player knockout while below half hp bursts the corpse)
- create `src/content/effects/snap-burst.ts` - the `snap-burst` effect (red ring with ink rim blooming to 110, red confetti)
- edit `src/content/talents/frenzy.ts` - one new talent line, after the `gore` line
- edit `src/content/upgrades/index.ts` - one import + one list line
- edit `src/content/effects/index.ts` - one import + one list line

### Interfaces
No new types. Two content defs, exact code for the weak assignee:

`src/content/upgrades/snap.ts`:
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Frenzy fork: a player knockout while below half hp snaps the spot red - the crowd around the corpse pays. */
export const snap: UpgradeDef = {
  id: 'snap',
  name: 'Snap',
  description: 'On a player knockout while below half your hp: a burst (radius 110) for 15 damage. Rank 2: 25.',
  maxLevel: 2,
  look: { shape: 'star', color: PALETTE.red },
  onKill(ctx, me, level, victim) {
    if (victim.type !== 'player' || me.hp >= me.maxHp * 0.5) return;
    const dmg = level === 2 ? 25 : 15;
    for (const u of ctx.unitsNear(victim.x, victim.y, 110))
      if (u.alive && u !== me) ctx.damage(u, dmg, me);
    ctx.effect('snap-burst', { x: victim.x, y: victim.y }, undefined, 110);
  },
};
```
`PALETTE.red` is exactly `#ff6b6b` (src/content/palette.ts:12).

`src/content/effects/snap-burst.ts` (copy of `sting-burst.ts` with three changes: `id: 'snap-burst'`, `duration: 0.4`, teal → red, 7 → 20 confetti; export name `snapBurst`, same doc style):
```ts
import { noise, type EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';
import { whump } from '../../audio/sfx.ts';

/** Snap: a knockout made while hurt - a red ring with an ink rim blooms out to `value`, red confetti with it. */
export const snapBurst: EffectDef = {
  id: 'snap-burst',
  duration: 0.4,
  draw(g, fx) {
    whump(fx.seed, fx.age);
    g.globalAlpha = 1 - fx.t;
    const r = fx.value * fx.t;
    g.lineWidth = 9;
    g.strokeStyle = PALETTE.ink;
    g.beginPath();
    g.arc(fx.ax, fx.ay, r, 0, Math.PI * 2);
    g.stroke();
    g.lineWidth = 5;
    g.strokeStyle = PALETTE.red;
    g.stroke();
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
      const d = r * (0.6 + 0.4 * noise(fx.seed, i + 20));
      g.fillStyle = PALETTE.red;
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 4 * (1 - fx.t) + 1.5, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = PALETTE.ink;
      g.stroke();
    }
  },
};
```

### Steps
1. Create `src/content/upgrades/snap.ts` with the code above, exactly.
2. Create `src/content/effects/snap-burst.ts` with the code above, exactly.
3. In `src/content/talents/frenzy.ts`, add one line after the `gore` line (line 16):
   `{ id: 'snap', upgrade: 'snap', max: 2, needs: [['nerve', 2]] },`
4. In `src/content/upgrades/index.ts`: add `import { snap } from './snap.ts';` directly above the `snare` import (line 40), and add `snap,` directly after `gore,` in the `UPGRADES` list (line 68).
5. In `src/content/effects/index.ts`: add `import { snapBurst } from './snap-burst.ts';` after the `stingBurst` import (line 15), and add `snapBurst,` after `stingBurst,` in the `EFFECTS` list (line 28).
6. Run `npm run check`.

### Pitfalls
- Do not halve player damage yourself: `ctx.damage(u, dmg, me)` applies the engine's pvp half (`rules.pvp.damageMul` 0.5) plus armor to players only, because `by` is a player — that is how every other strike on a player works (15→7, 25→12 as shown). Monsters in the circle take the full 15/25.
- `ctx.damage` is plain damage: it is not scaled by `me.stats.damage`, so Might/Reap never touch the burst (same as Sting). Never multiply by a stat.
- The killer must be excluded with `u !== me` (Sting does not exclude; Snap must). `u.alive` filters the fresh corpse and other dead units (the `glide.ts:16` idiom).
- Trigger guards, in order: `victim.type !== 'player'` first (a monster kill never bursts; both humans and bots are `Player`), then `me.hp >= me.maxHp * 0.5` (strictly below half, as in `adrenaline.ts:12`).
- If the burst kills a player while `me` is still below half, `onKill` re-fires (kill credit via `by`) and a second burst can chain — intended ("trade one knockout for a second"); do not add a guard.
- Effect draw is client-only: no `ctx`, no `Math.random` (variation from `noise(fx.seed, i)` only); the ring ends exactly at `fx.value` (110) at `t = 1`; keep the `g.globalAlpha` handling identical to `sting-burst.ts` (the engine resets state between effects).
- Do not touch `src/hud/talentTree.ts`/`.css`: the Frenzy tab draws from tree data. Fullest state is 8 rows; the longest text is Gore's description (~110 chars) which already fits the row layout at 412x915 and 1280x720, and Snap's row (~95 chars) is shorter; when locked it shows "Needs Nerve 2" like the other Nerve-2 forks.
- Registry edits are single-line insertions: do not reorder the existing `mend` line or any other line.

### Tests
none — no pure helpers; both defs are tested automatically by `engine/tests/` (on-kill upgrade in a real match, effect draw, talent reachability, registry/file-name rules).

## Result (attempt 1, asus)

Added Snap, a third kill-while-hurt fork under Nerve 2 in the Frenzy tree: a player knockout while below half max hp bursts the corpse spot red for 15/25 (25 rank 2, half to players via the engine's pvp half) in a radius-110 circle, striking monsters and players alike except the killer. Created the on-kill upgrade `src/content/upgrades/snap.ts` (plain `ctx.damage`, unscaled by Might/Reap; monster kills and at-or-above-half knockouts never fire) and the `snap-burst` effect (`src/content/effects/snap-burst.ts`: ink-rimmed red ring out to 110 over 0.4 s with 20 red confetti, a red copy of `sting-burst`), one talent line in `src/content/talents/frenzy.ts`, and one-line registry entries in the upgrades and effects indexes. Typecheck, lint, all 134 tests, and the desktop + mobile smoke test all pass.

- Self-review: APPROVE
- Time: 13.2 min

```
.../draft-arena/game/src/content/effects/index.ts  |  2 ++
 .../game/src/content/effects/snap-burst.ts         | 33 ++++++++++++++++++++++
 .../draft-arena/game/src/content/talents/frenzy.ts |  1 +
 .../draft-arena/game/src/content/upgrades/index.ts |  2 ++
 .../draft-arena/game/src/content/upgrades/snap.ts  | 18 ++++++++++++
 5 files changed, 56 insertions(+)
```
