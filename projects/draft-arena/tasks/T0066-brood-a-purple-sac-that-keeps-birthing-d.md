---
id: T0066
title: "Brood: a purple sac that keeps birthing Dots while it lives"
assignee: inet-racing
size: L
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T12:44:22Z
claimed_at: 2026-10-31T12:51:44Z
epic: E18
---

## Goal
The menagerie's 10th and final monster type: a big slow sac that keeps birthing Dots, so a crowd can grow itself and a player in its area has to choose — kill the sac early, or clear the Dots it drops.

## Details
- What it is: a big round sac, deep purple (Puff's purple, darker), the largest body on the field. Three small eyes in a row on top, one wide mouth across the bottom. Calm face (mouth o) while it shuffles; before each birth its mouth snaps to teeth and its belly bulges — a 0.8 s telegraph, synced in its slots like the other monsters' wind-ups — then the belly squashes flat for a beat as the Dot pops out.
- Numbers: hp 70, speed 25 u/s, radius 24, touch damage 8 per second, xp 6, weight 3, fromLevel 6.
- Behavior: chases the nearest player like a Dot, slower than a Popper. While a player is within 300, it runs a birth cycle: telegraph 0.8 s (teeth, bulged belly), then a Dot pops out of its flank with a small pop effect (the monster pop, scaled to a small radius) and the belly squashes. It births three Dots, 4 s apart, then rests 8 s (calm face, soft belly) and the cycle repeats. It never holds more than 3 of its Dots at once — the cycle's three births, then rest.
- The Dots it births are plain Dots (12 hp, 85 u/s, 12 damage per second on touch), so a player already knows what to dodge.
- Crowd math: one Brood adds at most itself plus 3 Dots — 4 more in a crowd of up to 60.
- What it punishes: a kiting build that leaves monsters in its wake (a Brood near your path drops Dots behind you), and a camp (a gem geyser or jackpot held beside one gets Dots walking into the holder).
- What counters it: it is slow and worth 6 xp plus 3 Dots avoided, so an early kill is cheap; a zone build (a Wide bubble, a Maw bite) eats the Dots where they land.
- It is the 10th monster type (weight 3, counting toward the cap of 10); nothing is removed.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Puff | turns into Dots | Puff's Dots come once, on its death; the Brood keeps birthing Dots across its whole life, with a telegraph before each |
| Dot | the Dots it makes, and a straight chase | a Dot is one small chaser; the Brood is a slow factory that adds a whole small crowd over time |
| Popper | a big slow blob you must kill carefully | a Popper hurts you when it dies; a Brood hurts you while it lives, by adding Dots to your path |
| Sleeper | a face state machine | a Sleeper switches between sleeping and chasing; a Brood's state changes produce new monsters on the field |
| Snail | slow, rare, high-xp | a Snail marks the ground behind it; a Brood marks the crowd ahead of you with new Dots |

## Acceptance criteria
- [ ] A level 6+ field gets the 10th monster type: a large deep-purple sac with three eyes and a wide mouth, the biggest body in the field, shuffling at 25 u/s.
- [ ] Within 300 of a player it telegraphs (teeth face, bulged belly) for 0.8 s, then a plain Dot pops from its flank with a small pop; three births, 4 s apart, then 8 s of calm rest, and the cycle repeats.
- [ ] It never has more than 3 of its Dots at once.
- [ ] The Dots it births are plain Dots (same look, same chase, same 12 touch damage) and drop their own gem when killed.
- [ ] It drops a gem worth 6 xp when killed, and its touch damage is 8 per second.
- [ ] It reads in a crowd: three eyes, the biggest body, a mouth that changes before it acts.

## Design (architect, desktop)

### Files
- create `src/content/monsters/brood.ts` — the `brood` monster: a slow deep-purple sac that birthing-cycles plain Dots while a player is within 300
- edit `src/content/monsters/index.ts` — one import and one array line, both next to `puff` (the registry comment: "the order is the wire order (keep new ones next to related ones)")

### Interfaces
No new types — one `MonsterDef`, id `'brood'`. Sync protocol (the only new contract):
- `slots[0]` = phase: `0` shuffling/resting, `1` telegraphing, `2` pop beat
- `slots[1]` = belly fill `0..100` (only nonzero during phase 1, ramped by the server each tick)
- `mem` keys: `ph` (phase), `tm` (seconds left in phase), `bi` (births this cycle)
- constants: `NEAR = 300`, `TELE = 0.8`, `BEAT = 0.3`, `GAP = 2.9`, `REST = 8`, `BIRTHS = 3`, `POP_OFFSET = 42`, `POP_RADIUS = 12`

### Steps
1. Create `src/content/monsters/brood.ts`. Imports: `chase, drawCritter, shade` + types `Face, Look, MonsterDef` from `engine/api.ts`; `PALETTE` from `../palette.ts`. Faces: `CALM = { mood: 'calm', eyes: 3, mouth: 'o' }`, `TEETH = { mood: 'calm', eyes: 3, mouth: 'teeth' }`. Look: `{ shape: 'circle', color: shade(PALETTE.purple, -0.35), face: CALM }` with:
```ts
look.draw = (g, e) => {
  const ph = e.slots[0] ?? 0;
  g.save();
  if (ph === 1) { const fill = (e.slots[1] ?? 0) / 100; g.scale(1 + 0.1 * fill, 1 + 0.1 * fill); } // belly fills over the 0.8 s telegraph
  else if (ph === 2) g.scale(1.1, 0.88); // squashed flat for the beat as the Dot pops out
  drawCritter(g, look, e, { ink: PALETTE.ink, face: ph === 0 ? CALM : TEETH });
  g.restore();
};
```
Def fields: `id: 'brood'`, `name: 'Brood'`, `description: 'Keeps birthing Dots while you stay close.'`, `hp: 70`, `speed: 25`, `radius: 24`, `damage: 8`, `xp: 6`, `weight: 3`, `fromLevel: 6`, `look`, and:
```ts
think(ctx, m, dt) {
  const mem = m.mem;
  let ph = mem.ph ?? 0, tm = (mem.tm ?? 0) - dt;
  if (!ctx.nearestEnemy(m, NEAR)) { // nobody within 300: the cycle resets, it just shuffles
    ph = 0; tm = 0; mem.bi = 0; m.slots[0] = 0; m.slots[1] = 0;
    chase(m); mem.ph = ph; mem.tm = tm; return;
  }
  if (ph === 0 && tm <= 0) { ph = 1; tm = TELE; m.slots[1] = 0; } // rest/gap over: start the telegraph
  else if (ph === 1) {
    if (tm <= 0) { // pop: a plain Dot from a random flank
      const a = ctx.rng.next() * Math.PI * 2;
      const x = m.x + Math.cos(a) * POP_OFFSET, y = m.y + Math.sin(a) * POP_OFFSET;
      ctx.spawnMonster('dot', x, y);
      ctx.effect('pop', { x, y }, undefined, POP_RADIUS);
      mem.bi = (mem.bi ?? 0) + 1; ph = 2; tm = BEAT; m.slots[1] = 0;
    } else m.slots[1] = Math.min(100, Math.round((1 - tm / TELE) * 100));
  } else if (ph === 2 && tm <= 0) { // beat over: next birth in 4 s, or 8 s rest after the third
    ph = 0; m.slots[1] = 0;
    if ((mem.bi ?? 0) >= BIRTHS) { mem.bi = 0; tm = REST; } else tm = GAP;
  }
  m.slots[0] = ph; mem.ph = ph; mem.tm = tm;
  chase(m); // it keeps shuffling through every phase
}
```
2. Edit `src/content/monsters/index.ts`: add `import { brood } from './brood.ts';` after the `puff` import, and `brood,` after `puff,` in `MONSTERS`.
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Timing identity: pop-to-pop must be exactly 4 s = `TELE + BEAT + GAP`, so `GAP = 2.9`, not 3.2; the 8 s rest starts after the beat.
- `think` must set velocity on every path — the reset branch calls `chase(m)` before returning, or the sac keeps drifting on stale velocity.
- Max 3 Dots: `bi` only increments at pop and only resets at the 8 s rest or a full cycle reset; never spawn in phase 0.
- Draw reads slots only (no client state), save/restore around the scales, face inside the transform (the boing/sleeper/snail idiom); scales stay within 0.8..1.2.
- `ctx.rng` only, no `Math.random`; `spawnMonster` may return `undefined` (field full) — ignore the result.
- Inserting mid-registry is the documented practice (wire order is per-build); do not append at the end.
- 10 monster types total is the cap, this is the 10th — nothing is removed.

### Tests
none — engine/tests/ auto-tests every monster (registration, data, a live match, the 60-player budget); there are no pure helpers.
