---
id: T0080
title: "Snare: a Goober talent, your Gush puddles sap whatever stands in them"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T13:48:21Z
epic: E17
---

## Goal
After a first prestige this life, the Goober tree opens a second fork under Gush: Snare turns the Goo's puddle from a slow into a mark — sapped critters take more damage from you, so a Goober life picks a direction, Chew (the zone fights alone) or Snare (the zone feeds every weapon you have).

## Details
- New on-hit upgrade "Snare" in src/content/upgrades/ (closest example: reap.ts — an on-hit that reads a state on the target).
- Panel text: "After 1 prestige this life. Whatever stands in your Gush puddle is sapped: it takes 15% more damage from you, per rank +10%."
- maxLevel 3: hits on a sapped critter deal +15% (rank 1), +25% (rank 2), +35% (rank 3).
- New status "Sapped": 1 s, refreshed while the critter stands in a Gush puddle (closest example: Slosh, refreshed in the plain puddle). Both puddle variants lay it — the plain Gush puddle and the Chew puddle — on monsters and players in it. One Sapped per critter: a second puddle refreshes it, never stacks it.
- Readable in a crowd: a sapped critter wears a small blue drop on its upper back (ink outline, Goo's color) — a new field area with no hitbox (closest example: the splat on a Cling mark). Blue is a player-weapon color, so a monster wearing it reads as marked by a player's zone, not as a new monster.
- Works with every weapon and area: Bolt, Maw's bite, Lob's splash, Goo, Nerve's jab, Horn's dart, Slush's blob and puddle, and your own Gush puddle tick all deal the bonus on a sapped critter. It works on players too: a sapped player takes the bonus from your hits, at the usual half damage.
- The Gush puddle's own numbers do not change: 40 units (+10 per Gush rank), 20% slow, 1.5 s; Chew's 6 damage per 0.5 s is untouched.
- Talent line: id snare, upgrade snare, max 3, needs [["gush", 1]], points 3, prestige 1 — in the Goober tree (closest example: slush's line in the Lobber tree).
- The tree as the panel will draw it:
  ```
  Reap (3)
    Goo (3, needs Reap 1)
      Gush (3, needs Goo 1)
        Snare (3, needs Gush 1, points 3, prestige 1)
        Chew (3, needs Gush 3)
      Cling (3, needs Goo 2)
      Scatter (1, needs Goo 3)
  ```
- What it costs: 3 points after Reap 1, Goo 1, Gush 1, plus a prestige this life; those 3 points could instead take Gush 2-3 (a wider puddle) or reach Chew.
- Why it passes the prestige bar: it opens only once your Gush puddle exists in a second life, and it only amplifies what the zone already does — a fresh level-1 player cannot reach it and it never hands back level-17 power.

## Acceptance criteria
- [ ] After 1 prestige this life the Goober tab shows Snare under Gush with its text; before a prestige it shows what it still needs.
- [ ] A monster standing in your Gush puddle shows the blue drop on its back; it fades about 1 s after it leaves, and standing back in refreshes it.
- [ ] Rank 1: a Goo that deals 18 hits the same sapped monster for 21 (15% more, within rounding); the same hit on an unsapped monster is still 18.
- [ ] The bonus works with more than one weapon in one life: e.g. your Bolt and your Gush puddle tick both land the bonus on a sapped critter.
- [ ] A sapped player takes the bonus from your hits and shows the drop too.
- [ ] Two overlapping Gush puddles do not stack the bonus.
- [ ] A Goober without Snare lays the same puddle with the same numbers — slow only, no drop.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | an on-hit | Ricochet bounces a bolt on to another enemy; Snare makes your hits on a sapped critter deal more damage |
| Reckless | an on-hit that pays on a state | Reckless pays while you are hurt; Snare pays while the target stands in your puddle |
| Chill | an on-hit that marks the target | Chill slows whatever it hits (movement, any source); Sapped changes damage taken and only your puddle lays it |
| Reap | an on-hit that reads the target's state | Reap pays on any target already below half hp; Snare pays only on a target your own Gush puddle sapped |
| Swarm | an on-hit that scales with a count | Swarm adds flat damage per enemy around the target; Snare adds a percentage to one marked target, made by your zone |
| Mend | an on-hit that heals you | Mend heals you on a Nerve hit; Snare adds damage to your hits on a sapped critter, with any weapon |
| Cling | an on-hit, Goo only | Cling makes a Goo hit splat on its target and ride it; Snare makes a Goo kill's puddle mark what stands in it |
| Gush | the puddle it turns | Gush lays a slow puddle where a Goo kills; Snare turns that puddle into a damage mark |
| Chew | the same puddle | Chew makes the puddle deal its own damage every 0.5 s; Snare makes whatever the puddle saps take more damage from you |

## Design (architect, inet-racing)

Snare: a prestige-gated Goober talent whose puddles mark critters "sapped" (take more damage from you), shown by a blue drop riding the critter. Gate the sap behavior on a prestige stamp in the owner's `mem`, mark from the puddle pulses, and draw the drop as a riding area modeled on `splat`.

### Files
New (one item per file, named after id):
- `src/content/upgrades/snare.ts` — export `snare` (`UpgradeDef`, on-hit)
- `src/content/statuses/sapped.ts` — export `sapped` (`StatusDef`)
- `src/content/areas/sapped-drop.ts` — export `sappedDrop` (`AreaDef`, the riding drop)

Edits (add lines next to related ones; nothing else):
- `src/content/upgrades/index.ts` — import + `snare` after `cling`
- `src/content/statuses/index.ts` — import + `sapped` after `cling`
- `src/content/areas/index.ts` — import + `sappedDrop` beside `splat`/`puddle`/`chewPuddle`
- `src/content/talents/goober.ts` — insert the Snare talent line after the `gush` line
- `src/content/areas/puddle.ts`, `src/content/areas/chew-puddle.ts` — sap block in each `pulse` (below)

### Interfaces
`snare.ts` (copy the shape of `reap.ts`):
```ts
export const snare: UpgradeDef = {
  id: 'snare', name: 'Snare',
  description: 'After 1 prestige this life. Whatever stands in your Gush puddle is sapped: it takes 15% more damage from you, per rank +10%.',
  maxLevel: 3, look: { shape: 'circle', color: PALETTE.blue },
  onHit(ctx, me, level, hit) {
    me.mem.snare = me.prestige; // stamp: your puddles read it to know whether to sap
    if (hit.damage <= 0) return; // 0-damage touches (slush blob) are not hits
    if (ctx.statusOf(hit.target, 'sapped') > 0) ctx.damage(hit.target, hit.damage * (0.15 + 0.1 * (level - 1)), me);
  },
};
```
`sapped.ts`: `{ id: 'sapped', name: 'Sapped', color: PALETTE.blue }` — no `speedMul`, no `tick`; default `maxStacks` 1 = one per critter, `addStatus` refreshes the 1 s.

`sapped-drop.ts` (copy `splat.ts`'s riding structure): `id: 'sapped-drop', radius: 6, life: 2, interval: 0.25, follow: false`; no damage. Pulse: nearest unit within 120 with `ctx.statusOf(u, 'sapped') > 0`; none → `a.life = a.age` (dry up). Epoch guard: on the drop's first pulse set `a.mem.born = Math.round(ctx.time * 100)`; if `t.mem.sapBorn !== a.mem.born` dry up; else ride — `a.x = t.x; a.y = t.y; a.angle = t.angle; a.slots[0] = Math.round(t.radius); a.life = a.age + 0.3;`. Draw: `tr = e.slots[0] > 0 ? e.slots[0] : 12`; `g.rotate(e.angle); g.translate(-tr * 0.55, -tr * 0.55)` (its back is −x; −y is up). Teardrop = circle `e.radius` plus a short tail toward `Math.PI * 0.75` at ~1.9×r, drawn with goo.ts's one-outline trick: stroke the tail in `PALETTE.ink` at 2× outline, fill+stroke the body blue, re-fill the tail with no stroke, small white shine. Fully opaque — no hp-based fade.

Puddle pulse edits (same 4-line block in both `puddle.ts` and `chew-puddle.ts`, before the existing per-unit work):
```ts
const saps = (a.owner.mem.snare ?? -1) === a.owner.prestige;
// per unit u in ctx.unitsNear(...):
if (saps && ctx.statusOf(u, 'sapped') <= 0) {
  u.mem.sapBorn = Math.round(ctx.time * 100);
  ctx.addStatus(u, 'sapped', 1);
  ctx.area(a.owner, 'sapped-drop', { x: u.x, y: u.y });
}
```
In `chew-puddle.ts` only, also replace `ctx.damage(u, a.damage, a.owner)` with `ctx.strike(a, u)` so the tick is a hit (sapped is applied before the strike, so a fresh-sap tick already gets the bonus). Slow/damage numbers stay untouched.

`goober.ts`: `{ id: 'snare', upgrade: 'snare', max: 3, needs: [['gush', 1]], points: 3, prestige: 1 }`.

### Steps
1. New `sapped.ts`, then `sapped-drop.ts`, then `snare.ts` (no deps between them).
2. One line each in the three `index.ts` registries, beside the related Goober family.
3. Add the sap block to `puddle.ts`; add it to `chew-puddle.ts` + convert its tick to `ctx.strike(a, u)`.
4. Insert the talent line after `gush` in `goober.ts`.
5. `npm run check`, then `npm run smoke`.

### Pitfalls
- The gate must be the prestige stamp, not a plain flag: prestige does not clear `mem`, but knockout (`respawn`) does and resets `prestige`, and a stamp can only exist while Snare is held — so `(mem.snare ?? -1) === p.prestige` is true exactly this-life-with-Snare.
- Stamp is set in `onHit`, which runs before death/`onKill`; a puddle only appears from a Goo kill, so the stamp is always fresh before the puddle's first pulse.
- `ctx.damage` inside Snare's onHit (not `ctx.strike`/re-fired) — no on-hit recursion.
- `hit.damage <= 0` guard (Reap idiom) for 0-damage touches like the slush blob.
- No hp-based fade on the drop: a long-lived riding area's `e.hp` trends to 0; the drop pops when the server kills it, and the ~1 s linger comes from the sapped status duration.
- Epoch guard (`sapBorn` vs `a.mem.born`) prevents a second drop if the critter leaves and re-enters within the 0.25 s dry-up window.
- Do not touch the 40 (+10/rank) radius, 20% slow, 1.5 s, or Chew's 6/0.5 s.

### Tests
`npm run check` and `npm run smoke` must pass (content tests: registries, data validity, Snare in a real match, talent reachable, prestige gate). No new pure helpers, so no new unit tests. In-play: before prestige the Snare panel row shows its needs; a monster in a puddle wears the drop, fades ~1 s after leaving, re-entry refreshes; rank 1: 18 unsapped vs ~21 sapped; Bolt and the Chew tick both scale a sapped target; a sapped player takes it and shows the drop; two overlapping puddles never double it; without Snare the puddle is slow-only with no drop.
