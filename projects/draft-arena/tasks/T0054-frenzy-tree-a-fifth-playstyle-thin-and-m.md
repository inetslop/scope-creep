---
id: T0054
title: "Frenzy tree: a fifth playstyle, thin and mean, that hits harder the more hurt you are"
assignee: desktop
size: L
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T10:47:58Z
claimed_at: 2026-10-31T10:52:56Z
epic: E13
---

## Goal
A fifth talent tree and playstyle: Frenzy trades max HP for damage, and everything in the tree pays out while the player is hurt — a life that deliberately runs at half HP instead of playing safe. Replacement for T0053, whose Sprint (speed only below half HP, per rank) the frozen engine cannot express; Adrenaline takes its place as the hurt-fueled sprint, built from pieces the engine already has (an on-kill effect reaching the killer, a status with a speed multiplier).

## Details
A new tree file `src/content/talents/frenzy.ts`: name "Frenzy", description "Thin and mean: the more hurt you are, the harder you hit.", look: shape diamond, color red. Four talents, drawn in the panel as:

```
Frenzy (3)
  Nerve (3, needs Frenzy 1)
    Adrenaline (2, needs Nerve 2)
    Reckless (1, needs Frenzy 3 and Nerve 3)
```

- **Frenzy** (upgrade `frenzy`), max 3, needs nothing. Stats, per rank: −8 max hp, +12% damage. Text: "Trade 8 max hp for 12% damage, per rank." Look: red pentagon.
- **Nerve** (upgrade `nerve`), max 3, needs Frenzy 1. A weapon: every 0.8 s, if an enemy is within 180, a jab — a small pale ice pointed dart, straight, 360 u/s, gone on hit or after 0.5 s (if Split fans more darts, they move by a path like Split bolts). Damage: 5 + 2 per rank above the first + 1 per 10 hp the player is missing (floored). Text: "Every 0.8 s, a jab at the nearest enemy within 180. Hits harder the more hurt you are: +1 damage per 10 hp missing. Each rank: +2 damage." Look: ice diamond.
  - Which mods apply to it: it is a projectile, so damage stats (Might, Frenzy, Split's weakening), Haste (fires sooner), Quick (darts fly faster), Split (one more dart, fanned, all darts 12% weaker per rank), Lance (darts go through 1 more enemy per rank), and every on-hit effect (Chill slows, Reap's bonus below-half-hp target); Cling does nothing with it (Goo only).
- **Adrenaline** (upgrade `adrenaline`), max 2, needs Nerve 2. On-kill: on a kill, if the killer is below half its max hp, the killer gains a "Wired" status: rank 1 +20% move speed for 1.5 s, rank 2 +30% for 2 s, refreshed by each kill. Two status defs, like Chill 1/2/3; the status is applied to the killer the same way Chomp's heal reaches the killer. A small yellow tick puff on the critter when the speed lands (a new effect, as small as the slow-pop). Text: "On a kill while below half your hp: +20% move speed for 1.5 s, refreshed on each kill. Rank 2: +30% for 2 s." Look: red star.
- **Reckless** (upgrade `reckless`), max 1 (capstone), needs Frenzy 3 and Nerve 3. On-hit: while the player is below half its max hp, each of its hits deals its damage twice — an extra copy of the hit's damage, exactly the Reap pattern. Text: "While below half your hp, your hits hit twice as hard." Look: red circle.

What a Frenzy player gets and pays: Reckless costs 6 points (all of Frenzy and Nerve) — six points that could instead buy three ranks of Bolt with Lance, or start a Maw build. The build lives below half hp: Nerve's jabs bite harder there, Reckless doubles every weapon there, and Adrenaline turns each kill there into a speed burst to stay in the fight.

## Acceptance criteria
- [ ] A fifth tab "Frenzy" (a red diamond) appears in the talents panel, with the four talents drawn in the shape above and each showing its text.
- [ ] Buying Frenzy 3 leaves the player 24 max hp shorter and dealing 36% more damage from every weapon.
- [ ] Nerve only jabs when an enemy is within 180, fires a pale ice dart every 0.8 s, and a rank-3 Nerve jab at 20 hp missing deals 11 damage (5 + 4 + 2).
- [ ] Below half hp, a kill with Adrenaline makes the killer visibly run 20% faster for 1.5 s (30% for 2 s at rank 2), with a small yellow tick puff; a kill while above half hp gives nothing.
- [ ] With Reckless, while below half hp every hit from every weapon deals double damage; above half hp nothing changes.
- [ ] Bots take the tree like the others; a knockout resets it like every tree.
- [ ] `npm run check` and the desktop and mobile smoke runs pass.

## Compared with what exists

Trees (one row per tree):

| Existing | What it shares | What Frenzy does that it can't (not numbers) |
| --- | --- | --- |
| Gunner | a committed build around a self-aiming weapon | kites at full hp with volleys; Frenzy wants to be hurt — its stats sell hp for damage and its jab and capstone only pay out below half hp |
| Body | stat mods that work with every weapon, and a kill reward (Chomp) | Chomp heals on every kill at any hp while the tree grows thicker; Frenzy grows meaner while hurt and its kill reward is speed, only when the kill is made while hurt |
| Lobber | a self-aiming weapon with commitment behind it | controls space from range and never asks to be hurt; Frenzy is a close-range all-in that asks the player to live below half hp |
| Goober | a self-aiming weapon with kill-triggered payoffs | Gush and Scatter fire on every Goo kill at any hp; Adrenaline and Reckless only work while the player itself is hurt |

Nerve, against every weapon:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | a self-aiming straight shot | Bolt kites at long range at any hp; Nerve only fires within 180 and gets harder the more hurt the shooter is |
| Maw | a close-range attack | Maw bites in front of you at any hp; Nerve throws a dart that reaches 180 and its damage is the shooter's own missing hp |
| Lob | a self-aiming thrown shot | Lob splashes from range and marks the ground; Nerve is a close-range jab that never touches the ground |
| Goo | a self-aiming lob that finds the nearest enemy | Goo hits at range for fixed damage; Nerve is a weak close jab that grows with the damage the shooter took |
| Slush | a self-aiming straight shot | Slush zones the ground from 240; Nerve leaves nothing on the ground and is only strong while the shooter is hurt |

Adrenaline, against every on-kill:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Chomp | a reward on kill | Chomp heals on every kill at any hp; Adrenaline only pays below half hp and pays speed, not hp |
| Fuse | a payoff when your own weapon kills | Fuse pops a damage ring where the bubble kills; Adrenaline changes how the killer moves and puts nothing on the field |
| Scatter | a kill that spawns more of your own | Scatter adds homing shots on a Goo kill; Adrenaline adds nothing to the field, only a timed speed burst on the killer |
| Gush | a kill that marks the spot | Gush leaves a slow puddle where a Goo kills; Adrenaline is a status on the killer that a puddle can't give |

Reckless, against every on-hit:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | a change to what a hit does | Ricochet bounces a bolt on to another enemy; Reckless re-deals the same hit's damage, only while the shooter is hurt |
| Chill | an on-hit effect | Chill slows the target; Reckless changes the damage of the hit itself and never touches the target's state |
| Reap | bonus damage on a hit, under a condition | Reap's condition is the target below half its hp; Reckless's is the shooter below half its hp, and it doubles the whole hit |
| Cling | an on-hit effect from one weapon | Cling splats Goo on its target; Reckless works with every weapon the player has |

Frenzy, against the same-stat upgrades:

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Might | raises damage | Might only adds damage; Frenzy sells 8 max hp for it, so a Frenzy build deliberately keeps less cushion |
| Vigor | raises max hp | Vigor buys a bigger cushion and regen; Frenzy sells cushion for damage — the two pull a build in opposite directions |

## Design (architect, desktop)

### Files
- create `src/content/talents/frenzy.ts` - the Frenzy tree (fifth tab)
- create `src/content/upgrades/frenzy.ts` - stat upgrade: sells max hp for damage
- create `src/content/upgrades/nerve.ts` - weapon: close jab, damage grows with missing hp
- create `src/content/projectiles/jab.ts` - the pale ice dart (straight, no path, no step)
- create `src/content/upgrades/adrenaline.ts` - on-kill: Wired speed status on the killer
- create `src/content/statuses/wired-1.ts`, `src/content/statuses/wired-2.ts` - the two Wired ranks
- create `src/content/effects/wired-pop.ts` - small yellow puff when the speed lands
- create `src/content/upgrades/reckless.ts` - capstone on-hit: double damage below half hp
- edit `src/content/talents/index.ts` - import + one line: `frenzy` after `goober` in `TREES`
- edit `src/content/upgrades/index.ts` - imports (alphabetical) + lines: `nerve` after `goo`, `reckless` after `ricochet`, `adrenaline` after `chomp`, `frenzy` after `vigor`
- edit `src/content/projectiles/index.ts` - import + `jab` after `bolt`
- edit `src/content/statuses/index.ts` - imports + `wired1`, `wired2` after `chill3`
- edit `src/content/effects/index.ts` - import + `wiredPop` after `slowPop`

### Interfaces
Each file mirrors its closest sibling (see Steps). Exact bodies:
- `jab.ts` (copy of `projectiles/bolt.ts`): `{ id: 'jab', radius: 5, life: 0.5, look: { shape: 'triangle', color: PALETTE.ice } }` — no `path`, no `step` (straight flight; Split's fanned copies launch at their own angles, exactly like Split bolts).
- `frenzy.ts`: `look: { shape: 'pentagon', color: PALETTE.red }`, `maxLevel: 3`, `stats: { maxHp: -8, damage: 0.12 }`, description `Trade 8 max hp for 12% damage, per rank.`
- `nerve.ts` (copy of `upgrades/bolt.ts`'s shape): `cooldown: 0.8`, `look: { shape: 'diamond', color: PALETTE.ice }`, `maxLevel: 3`, description `Every 0.8 s, a jab at the nearest enemy within 180. Hits harder the more hurt you are: +1 damage per 10 hp missing. Each rank: +2 damage.`, and
  ```ts
  fire(ctx, me, level) {
    const target = ctx.nearestEnemy(me, 180);
    if (!target) return;
    const missing = me.maxHp - me.hp;
    ctx.fire(me, 'jab', { angle: v.angleTo(me, target), speed: 360, damage: 5 + 2 * (level - 1) + Math.floor(missing / 10) });
  }
  ```
  (import `v` from the engine like bolt.ts does). Damage passed pre-stat: Might/Frenzy/Split's `damage`, Haste via `cooldown` stat, Quick via `projectileSpeed`, Lance via `pierce` all apply automatically.
- `adrenaline.ts` (shape of `upgrades/chomp.ts`): `look: { shape: 'star', color: PALETTE.red }`, `maxLevel: 2`, description `On a kill while below half your hp: +20% move speed for 1.5 s, refreshed on each kill. Rank 2: +30% for 2 s.`, and
  ```ts
  onKill(ctx, me, level, _victim) {
    if (me.hp < me.maxHp * 0.5) {
      ctx.addStatus(me, level === 2 ? 'wired-2' : 'wired-1', level === 2 ? 2 : 1.5);
      ctx.effect('wired-pop', { x: me.x, y: me.y });
    }
  }
  ```
- `wired-1.ts` / `wired-2.ts` (copy `statuses/chill-1.ts`): `{ id: 'wired-1', name: 'Wired 1', color: PALETTE.yellow, speedMul: 1.2 }` and `wired-2` / `Wired 2` / `1.3`.
- `wired-pop.ts` (copy `effects/slow-pop.ts`): `id: 'wired-pop'`, `duration: 0.3`, same fade-out puff but `PALETTE.yellow` and `const r = 7 + 5 * fx.t;` (keep the 3px ink stroke and the white shine dot).
- `reckless.ts` (copy `upgrades/reap.ts`): `look: { shape: 'circle', color: PALETTE.red }`, `maxLevel: 1`, description `While below half your hp, your hits hit twice as hard.`, and
  ```ts
  onHit(ctx, me, _level, hit) {
    if (hit.damage <= 0) return; // 0-damage touches (the goo bubble) are not hits
    if (me.hp < me.maxHp * 0.5) ctx.damage(hit.target, hit.damage, me);
  }
  ```
- `talents/frenzy.ts` (copy `talents/gunner.ts`): `id: 'frenzy'`, `name: 'Frenzy'`, `description: 'Thin and mean: the more hurt you are, the harder you hit.'`, `look: { shape: 'diamond', color: PALETTE.red }`,
  ```ts
  talents: [
    { id: 'frenzy', upgrade: 'frenzy', max: 3 },
    { id: 'nerve', upgrade: 'nerve', max: 3, needs: [['frenzy', 1]] },
    { id: 'adrenaline', upgrade: 'adrenaline', max: 2, needs: [['nerve', 2]] },
    { id: 'reckless', upgrade: 'reckless', max: 1, needs: [['nerve', 3], ['frenzy', 3]] },
  ],
  ```

### Steps
1. Create `jab.ts`, then the four upgrades, the two statuses, the effect, and the tree file (exact bodies above).
2. Add the five registry lines (one per file, at the named positions).
3. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- `needs` order is the layout: the panel hangs a talent under the *first* need it lists (`talentTree.ts` `parentOf`), so Reckless must list `['nerve', 3]` first to sit under Nerve beside Adrenaline.
- Reckless must use `ctx.damage` (plain damage, no on-hit hooks) with the `hit.damage <= 0` guard — copying Reap verbatim avoids an infinite double-hit loop and the goo bubble's 0-damage touches.
- Nerve's missing hp uses `me.maxHp`, the stat-adjusted value (100 → 76 at Frenzy 3); floor the `missing / 10`.
- `maxHp: -8` is fine: the engine clamps (`s.maxHp = Math.max(1, …)`, `p.hp = Math.min(p.hp, p.maxHp)`); `damage: 0.12` is additive on the base of 1 (Split's `-0.12` is the precedent).
- No `path`/`step` on the jab (cheapest flight, and the only legal kind at this fire rate); no slots needed — the Wired ring is drawn by the engine from the status.
- Colors: red tree/tab/capstone look (warm is fine for tree identity), ice dart (cool weapon), yellow Wired status and puff.
- Panel fullest state: the Frenzy tab shows all four rows at once; longest text is Nerve's two-sentence description (wraps in the existing card), locked Reckless adds `Needs Nerve 3 and Frenzy 3`; the 5th tab wraps to a second tab row via the existing CSS, and 4 rows is shorter than Gunner's 5 — no layout change.
- Bots/knockout need no code: they run over `TREES` and the engine's prestige reset generically.

### Tests
none (content is tested automatically by engine/tests/).
