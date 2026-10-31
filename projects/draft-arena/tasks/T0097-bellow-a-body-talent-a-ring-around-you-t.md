---
id: T0097
title: "Bellow: a Body talent, a ring around you that strikes everything close, open after a prestige"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T16:11:39Z
epic: E17
---

## Goal
A second-life Body gets a weapon beside Maw: a bellow ring that strikes everything around the player, so a second-life tank can stand still in the middle of the swarm instead of turning to keep every threat in front of the bite.

## Details
- A new upgrade in the Body tree and the next prestige-gated talent after Slush, Cover, Gore and Snare. The Body's answer is stand-still defense: Cover guards a kiting Gunner's back, Slush zones a Lobber's ground, Bellow makes a tank that can face nothing at all.
- Talent line: id `bellow`, upgrade `bellow`, max 3, needs `[["maw", 3]]`, points 3, prestige 1. In the Body tree's file it goes after the Maw line; the Body tab draws it under Maw.
- Weapon: every 1.4 s, if any critter (monster or player) is within 60, the critter bellows — its mouth opens wide for 0.3 s — and an ice ring with an ink rim (a line that blooms out, not a filled field) spreads from the player to radius 80 over 0.3 s and strikes everything inside it once (everything but the player). With no critter within 60 it does not fire and waits.
- Damage: rank 1: 10, rank 2: 14, rank 3: 18. Players take half, as with every weapon.
- The ring is a new area in the same class as Maw's bite area: it strikes each critter inside once and is gone (fades 0.2 s after the bloom).
- Which mods apply: it is an area strike, so the general on-hit effects run on its hits — Chill slows whatever it strikes, Reap adds damage to a below-half target, Swarm scales with the crowd around each target, Reckless doubles the hit while the player is below half hp. Might and Frenzy raise its damage +12% per rank; Haste fires it 8% sooner per rank. It is not a projectile: Lance, Split and Quick do nothing to it, and the weapon-gated ones (Gore, Mend, Cling) do not.
- Look: shape star, ice (#99e9f2, Maw's color), so the tree's two weapons read as a pair.
- Text on the talent row: "After 1 prestige this life. Every 1.4 s, if a critter is within 60, a ring (radius 80) around you strikes everything inside. 10 damage. Per rank: +4."

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a weapon that fires by itself | aims one star at a time at one enemy; Bellow strikes every direction around the player at once, unaimed |
| Cover | a defensive weapon for a build that takes chase | a 3-bolt fan aimed at what chases from behind, for a kiting build; Bellow covers every direction and lets the player stand still |
| Maw | a Body weapon at close range | bites in front of the player only; Bellow is a full circle, so it covers the flanks and behind |
| Lob | a self-aimed weapon | an arcing bubble that must lead a target and splash where it lands; Bellow has no flight and no target, it is already around the player |
| Goo | a self-aimed weapon | a homing drop that chases the nearest enemy; Bellow chases nothing |
| Nerve | a short-range weapon | a jab that scales with the player's own wound; Bellow is a fixed ring that hits the same at full hp |
| Horn | a dart at the nearest enemy | an aimed single dart at one enemy; Bellow is an unaimed ring in every direction at once |
| Slush | a weapon whose strike leaves a ring-shaped zone | a thrown blob that leaves a lingering slow puddle; Bellow strikes once, slows nothing and leaves nothing on the ground |
| Sting | a burst ring on the field | a kill-triggered burst at a corpse that needs 2+ neighbors; Bellow is on a timer around the player, with or without a kill |
| Fuse | a damage ring | a ring where a bubble kills something, Lobber's only; Bellow is a ring around the player on a timer |
| Scatter | a kill-triggered pop | a Goo kill pops into 4 homing minis; Bellow is not triggered by a kill and sends nothing out |

The Body tree as the panel draws it:
```
Swift (5)
Vigor (3)
  Chill (3)
  Hide (3)
  Chomp (1, needs Vigor 3 + Swift 3)
Might (5)
  Maw (5, needs Might 2)
    Bellow (3, needs Maw 3, 3 points, 1 prestige)
Magnet (3)
```

What a Body player gets and what it costs: Bellow 1 costs Might 2, Maw 3 and 3 points in Body, plus 1 prestige this life — 6 points a second-life Body reaches mid-life with the points prestiging banks. The same 3 points instead buy Swift (a faster kiting tank), Might (a harder bite) or the road to the Chomp capstone (Vigor 3 + Swift 3). A first-life Body keeps kiting so threats stay in front of the bite; a second-life Body can stand in the middle of the swarm and bellow — and in a player fight the ring is the first thing a chaser learns to respect.

## Acceptance criteria
- [ ] The Body tab in the talents panel shows Bellow under Maw; before this life's first prestige it reads locked with the prestige need, after 1 prestige it reads "Needs Maw 3", and after Maw 3 it buys at 3 points.
- [ ] With Bellow 1 and a monster within 60: every 1.4 s an ice ring with an ink rim blooms from the player to radius 80, the mouth opens wide for 0.3 s, and every critter inside but the player takes 10 damage once (a player 5); monsters pop as usual.
- [ ] With no critter within 60, no ring blooms and the weapon waits for the next enemy.
- [ ] Ranks 2 and 3 strike for 14 and 18.
- [ ] Haste fires it sooner and Might and Frenzy raise its damage; Chill slows what it strikes, Reap adds damage on a below-half target, and Reckless doubles it below half hp.
- [ ] The ring reads as a ring line, not a filled field: in a crowd a Gush puddle and a bubble splash still read different from it, and Bellow's text fits its row in the panel at 412x915.

## Design (architect, desktop)

### Files
- create `src/content/areas/bellow-ring.ts` - the bellow ring: `AreaDef` id `'bellow-ring'`, one-strike blooming ice ring (export `bellowRing`)
- create `src/content/effects/bellow-mouth.ts` - the open mouth: `EffectDef` id `'bellow-mouth'`, 0.3 s, drawn above the player (export `bellowMouth`)
- create `src/content/upgrades/bellow.ts` - the weapon: `UpgradeDef` id `'bellow'` (export `bellow`)
- edit `src/content/areas/index.ts` - one import + one line in `AREAS`, after `bite`
- edit `src/content/effects/index.ts` - one import + one line in `EFFECTS`, after `wiredPop`
- edit `src/content/upgrades/index.ts` - one import (alphabetical: after `adrenaline`) + one line in `UPGRADES` after `maw` (weapons block)
- edit `src/content/talents/body.ts` - one talent line after the `maw` line

### Interfaces
No new types. Exact def shapes:
- `bellowRing: AreaDef` = `{ id: 'bellow-ring', radius: 80, life: 0.5, interval: 0.6, follow: true, look: { shape: 'circle', color: PALETTE.ice, draw(g, e) }, pulse(ctx, a) }`
- `bellowMouth: EffectDef` = `{ id: 'bellow-mouth', duration: 0.3, draw(g, fx) }`
- `bellow: UpgradeDef` = `{ id: 'bellow', name: 'Bellow', description: 'After 1 prestige this life. Every 1.4 s, if a critter is within 60, a ring (radius 80) around you strikes everything inside. 10 damage. Per rank: +4.', maxLevel: 3, look: { shape: 'star', color: PALETTE.ice }, cooldown: 1.4, fire(ctx, me, level) }`
- `body.ts` line: `{ id: 'bellow', upgrade: 'bellow', max: 3, needs: [['maw', 3]], points: 3, prestige: 1 }` (tree goes 8 → 9 talents, cap is 10)

### Steps
1. Create `src/content/areas/bellow-ring.ts`:
```ts
import type { AreaDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** Bellow's ring: an ink-rimed line of ice that blooms out from the bellowing critter, one strike. */
export const bellowRing: AreaDef = {
  id: 'bellow-ring',
  radius: 80,
  life: 0.5, // 0.3 s bloom + 0.2 s fade
  interval: 0.6, // > life: exactly one pulse
  follow: true, // stays centred on the player for the 0.5 s
  look: {
    shape: 'circle',
    color: PALETTE.ice,
    draw(g, e) {
      const t = (1 - e.hp) * 0.5; // seconds since the bellow
      const u = Math.min(1, t / 0.3);
      const bloom = 1 - (1 - u) * (1 - u); // ease out over the first 0.3 s
      const fade = u >= 1 ? Math.max(0, 1 - (t - 0.3) / 0.2) : 1;
      const r = e.radius * bloom;
      if (r < 2) return;
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
      g.globalAlpha = 0.9 * fade; g.strokeStyle = PALETTE.ink; g.lineWidth = 13; g.stroke(); // ink rim
      g.beginPath(); g.arc(0, 0, r, 0, Math.PI * 2);
      g.globalAlpha = 0.85 * fade; g.strokeStyle = PALETTE.ice; g.lineWidth = 9; g.stroke(); // ice line
      g.globalAlpha = 1;
    },
  },
  pulse(ctx, a) {
    if (!a.owner.alive) return;
    for (const u of ctx.enemiesNear(a.owner, a.x, a.y, a.radius)) ctx.strike(a, u);
  },
};
```
2. Create `src/content/effects/bellow-mouth.ts`:
```ts
import type { EffectDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The bellowing critter's mouth, wide open for the length of the bellow. */
export const bellowMouth: EffectDef = {
  id: 'bellow-mouth',
  duration: 0.3,
  draw(g, fx) {
    const open = Math.min(1, fx.age / 0.08);
    const close = fx.age < 0.2 ? 1 : Math.max(0, (0.3 - fx.age) / 0.1);
    const s = open * close;
    if (s <= 0) return;
    g.save();
    g.translate(fx.ax, fx.ay + 7.5); // a 18-radius critter's mouth sits 0.42 r below its centre
    g.scale(s, s);
    g.fillStyle = PALETTE.ink;
    g.beginPath(); g.ellipse(0, 0, 5, 6.5, 0, 0, Math.PI * 2); g.fill();
    g.restore();
  },
};
```
3. Create `src/content/upgrades/bellow.ts`:
```ts
import { type UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** The Body's second-life weapon: an unaimed bellow ring that strikes everything around the player. */
export const bellow: UpgradeDef = {
  id: 'bellow',
  name: 'Bellow',
  description: 'After 1 prestige this life. Every 1.4 s, if a critter is within 60, a ring (radius 80) around you strikes everything inside. 10 damage. Per rank: +4.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.ice },
  cooldown: 1.4,
  fire(ctx, me, level) {
    if (!ctx.nearestEnemy(me, 60)) return;
    ctx.area(me, 'bellow-ring', { damage: 10 + 4 * (level - 1) });
    ctx.effect('bellow-mouth', { x: me.x, y: me.y });
  },
};
```
4. `src/content/areas/index.ts`: add `import { bellowRing } from './bellow-ring.ts';` after the `bite` import; add `bellowRing,` after `bite,` in `AREAS`.
5. `src/content/effects/index.ts`: add `import { bellowMouth } from './bellow-mouth.ts';` after the `wiredPop` import; add `bellowMouth,` after `wiredPop,` in `EFFECTS`.
6. `src/content/upgrades/index.ts`: add `import { bellow } from './bellow.ts';` after the `adrenaline` import; add `bellow,` after `maw,` in `UPGRADES`.
7. `src/content/talents/body.ts`: add the talent line from Interfaces directly after the `maw` line.
8. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Do NOT hand-roll the mod interactions. The engine applies them: area damage × owner `damage` stat (Might/Frenzy), weapon cooldown × `cooldown` stat (Haste), `ctx.strike` → on-hit hooks (Chill/Reap/Swarm/Reckless) and the pvp half. Adding them in code double-counts.
- The mouth CANNOT go in the area's draw: the renderer draws areas under players (the centre is covered by the body), while effects draw above players — that is why it is an effect, like adrenaline's `wired-pop`. Effects get no translate: use `fx.ax/fx.ay` yourself (Step 2 does).
- The mouth effect is at a fixed point: it drifts if the player sprints during the 0.3 s. Accepted — Bellow is a stand-still weapon and this is the game's established idiom. Do not "fix" it with a projectile: even a 0-damage projectile strikes on contact and fires on-hit hooks.
- Ring = two thin stroked circles (ink 13 under ice 9). No filled disc — a filled circle reads as a Gush puddle / bubble splash. No glow, no gradient.
- `interval` (0.6) must stay > `life` (0.5) for exactly one pulse, like `bite`.
- Do not pass `x`/`y` to `ctx.area` (defaults to the owner's position); do not touch other lines in `body.ts`, `rules.ts` or `palette.ts` (`ice` already exists).
- The panel row's fullest state: name "Bellow", the 143-char description verbatim (wraps to ~4 lines in the 412 px-wide card, same layout as Maw's row — the panel is engine code and already handles `needs`+`points`+`prestige` together, see Cover), plus the lock line ("prestige need" before, "Needs Maw 3" after, "3 points" to buy). No panel or HUD code changes.

### Tests
- None in `tests/` (no pure helpers; content is tested automatically by `engine/tests/`, including the draw functions, the real-match weapon test and the 60-player budget). Verify with `npm run check` and `npm run smoke`.
