---
id: T0055
title: "Popper: a fat grinning red blob that pops a damaging puff when it dies"
assignee: desktop-4070
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T10:47:58Z
claimed_at: 2026-10-31T11:16:04Z
epic: E14
---

## Goal
A 9th monster that makes finishing a kill a choice: kill a Popper while standing on it and it pops a puff that hurts whoever is close — kill it with a ranged shot instead and it is a free gem.

## Details
A new monster `src/content/monsters/popper.ts`, registered in the monsters index after snail. It chases the nearest player plainly (like a Dot, slower and fatter) and has an `onDeath` that pops.

- Numbers: hp 50, speed 35 u/s, radius 20, touch damage 10, xp 4, weight 4, fromLevel 3.
- `onDeath`: lays a new area `pop-puff` (`src/content/areas/pop-puff.ts`) at its death spot: a 40-unit round zone that lasts 0.5 s and strikes everything inside it (players and monsters alike) once for 10 damage — like the bite area, but still and on the ground. With a new effect `puff-burst` (`src/content/effects/puff-burst.ts`): a soft orange ring blooming out to 40 over 0.5 s with a few orange confetti, as small as a monster pop.
- Look: shape circle, fat (radius 20), color red, face: mood happy, 2 small eyes, mouth smile — a fat grinning blob. When a player is within 60 of it (a kill about to happen), its mouth flips to teeth: the grin shows fangs right before it pops, so a player sees the pop coming.
- What it counters and punishes: it punishes the finish-on-the-body habit and close-range builds (a Maw bite reaches it from in front, a Nerve jabber stands within 180); it counts against every ranged weapon (Bolt, Goo's 260, Slush's 240, Lob) that can kill it from outside the 40-unit puff.
- Crowd count: it adds no monsters; each death adds one 40-unit area for 0.5 s.

## Acceptance criteria
- [ ] From player level 3, fat red blobs (20 units across, 2 small eyes, a smile) join the crowd: 50 hp, moving at 35 u/s toward the nearest player.
- [ ] While a player is within 60, the Popper's smile flips to a fanged grin; it returns to a smile when the player is farther.
- [ ] When it dies, an orange puff ring blooms to 40 at its spot and everything standing inside (players and monsters) takes 10 damage once; after 0.5 s the puff is gone and the spot is safe.
- [ ] Killing it from outside 40 units (a Bolt or Goo shot) gives its normal gem and no damage to the killer.
- [ ] Standing on it as it dies costs 10 hp, shown as the puff strikes.
- [ ] `npm run check` and the desktop and mobile smoke runs pass.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Puff | pops when it dies | Puff's death spawns three more enemies — a crowd that grows; Popper's death deals damage to whoever stands on it and spawns nothing |
| Dot | chases the nearest player in a plain way | Dot's death is a free gem; Popper's death is a zone that punishes the finish |
| Flee | a death a player triggers by catching it | Flee's pop costs the chaser nothing; Popper's pop costs anyone standing on it 10 hp, so it is something you kill from range |

## Design (architect, desktop-4070)

### Files
- create `src/content/monsters/popper.ts` - the Popper monster def (`export const popper: MonsterDef`)
- create `src/content/areas/pop-puff.ts` - the death puff area (`export const popPuff: AreaDef`)
- create `src/content/effects/puff-burst.ts` - the one-shot orange ring+confetti (`export const puffBurst: EffectDef`)
- edit `src/content/monsters/index.ts` - add import + one list line, after `snail`
- edit `src/content/areas/index.ts` - add import + one list line, at end of list
- edit `src/content/effects/index.ts` - add import + one list line, at end of list

### Interfaces
No new types. Verified engine signatures used: `MonsterDef.onDeath?: (ctx: Ctx, m: Monster) => void`, `think?: (ctx, m, dt)`, `ctx.nearestEnemy(of: Point & { team: number }, range: number): Unit | undefined`, `ctx.area(owner: Unit, areaId: string, opts?: AreaOptions)` (`AreaOptions.damage` = one strike's damage), `ctx.effect(effectId: string, a: Point, b?: Point, value?: number)`, `AreaDef.pulse: (ctx: Ctx, a: Area) => void`, `EffectDef.draw: (g: CanvasRenderingContext2D, fx: EffectView) => void` (`fx.ax/fx.ay`, `fx.t` 0→1, `fx.seed`), `Entity.slots: number[]`, `Unit.id`, `Unit.alive`.

### Steps
1. Create `src/content/effects/puff-burst.ts` (copy the shape of `src/content/effects/pop.ts`; import `{ noise, type EffectDef }` from api and `PALETTE`):
```ts
export const puffBurst: EffectDef = {
  id: 'puff-burst',
  duration: 0.5,
  draw(g, fx) {
    const fade = 1 - fx.t;
    g.globalAlpha = 0.3 * fade; // soft orange fill
    g.beginPath();
    g.arc(fx.ax, fx.ay, 40 * Math.max(0.12, fx.t), 0, Math.PI * 2); // blooms out to 40
    g.fillStyle = PALETTE.orange;
    g.fill();
    g.globalAlpha = 0.9 * fade; // ink rim
    g.strokeStyle = PALETTE.ink;
    g.lineWidth = 3;
    g.stroke();
    for (let i = 0; i < 7; i++) { // a few orange confetti, sized like a monster pop
      const a = (i / 7) * Math.PI * 2 + noise(fx.seed, i) * 0.6;
      const d = 8 + fx.t * 42 * (0.8 + 0.4 * noise(fx.seed, i + 7));
      g.globalAlpha = fade;
      g.fillStyle = PALETTE.orange;
      g.beginPath();
      g.arc(fx.ax + Math.cos(a) * d, fx.ay + Math.sin(a) * d, 4 * (1 - fx.t) + 1.5, 0, Math.PI * 2);
      g.fill();
    }
  },
};
```
2. Create `src/content/areas/pop-puff.ts` (model: `src/content/areas/bite.ts`, but still and striking everyone, not just enemies):
```ts
export const popPuff: AreaDef = {
  id: 'pop-puff',
  radius: 40,
  life: 0.5,
  interval: 0.6, // > life: exactly one pulse
  look: {
    shape: 'circle',
    color: PALETTE.orange,
    draw(g, e) {
      const fade = e.hp; // 1 at birth -> 0 at death
      g.globalAlpha = 0.4 * fade;
      g.beginPath();
      g.arc(0, 0, e.radius, 0, Math.PI * 2);
      g.fillStyle = PALETTE.orange;
      g.fill();
      g.globalAlpha = 0.9 * fade;
      g.strokeStyle = PALETTE.ink;
      g.lineWidth = 3;
      g.stroke();
    },
  },
  pulse(ctx, a) {
    for (const u of ctx.unitsNear(a.x, a.y, a.radius)) { // players and monsters alike
      if (u.alive && u.id !== a.owner.id) ctx.strike(a, u);
    }
  },
};
```
Do NOT add `follow` (it must stay on the ground), do NOT check `a.owner.alive` (the owner is already dead when this fires).
3. Create `src/content/monsters/popper.ts` (copy `dot.ts`'s structure, numbers from the task):
```ts
import { chase, drawCritter, type Face, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A fat grinning blob: when a player is close its smile shows fangs, and standing on it as it dies takes 10. */
export const popper: MonsterDef = {
  id: 'popper',
  name: 'Popper',
  description: 'Standing on it as it dies costs 10.',
  hp: 50,
  speed: 35,
  radius: 20,
  damage: 10,
  xp: 4,
  weight: 4,
  fromLevel: 3,
  look: {
    shape: 'circle',
    color: PALETTE.red,
    draw(g, e) {
      const face: Face = (e.slots[0] ?? 0) === 1
        ? { mood: 'happy', eyes: 2, mouth: 'teeth' } // the grin shows fangs right before it pops
        : { mood: 'happy', eyes: 2, mouth: 'smile' };
      drawCritter(g, this, e, { ink: PALETTE.ink, face });
    },
  },
  think(ctx, m, _dt) {
    m.slots[0] = ctx.nearestEnemy(m, 60) ? 1 : 0;
    chase(m);
  },
  onDeath(ctx, m) {
    ctx.area(m, 'pop-puff', { damage: 10 });
    ctx.effect('puff-burst', { x: m.x, y: m.y });
  },
};
```
4. Edit the three registries, one import + one list line each: `monsters/index.ts` (import after the `snail` import; element after `snail,`), `areas/index.ts` (after `chewPuddle`), `effects/index.ts` (after `slowPop`).

### Pitfalls
- The puff is fired from `onDeath` with a dead monster as owner — that is supported: `splash` areas outlive their dead bubbles, and non-`follow` areas stay put (`follow` areas only end with their owner).
- `ctx.area(m, 'pop-puff', { damage: 10 })`: do not pass `x/y/radius/life` — the defaults are the def's values (radius 40, life 0.5), which is exactly what's wanted. Monster owners have no damage stat to scale the 10.
- Do not use `ctx.enemiesNear(a.owner, ...)` in the pulse: the owner is a monster (team 0) so that would hit only players; the spec requires monsters inside to take damage too. If the smoke test objects to striking same-team monsters, the fallback is `enemiesNear` (players only), but try the specified version first.
- `interval` must stay greater than `life` (bite pattern) or the puff strikes twice.
- The face flip is slot-driven: server sets `m.slots[0]` in `think`, clients draw it in `look.draw` — never store the state anywhere else; no module variables, no `Math.random`.
- Effect/area draw code: only `fx.t`/`noise(fx.seed, i)` variation (client-side), no `ctx`, no timers.

### Tests
none - content is tested automatically by engine/tests (registration, valid data, every monster in a real match); run `npm run check` and `npm run smoke`.
