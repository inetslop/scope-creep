---
id: T0059
title: "Mend: a Nerve hit heals the more hurt you are"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T11:14:52Z
claimed_at: 2026-10-31T11:40:14Z
epic: E15
---

## Goal
The Frenzy tree's second fork under Nerve: a sustain branch, so a hurt Frenzy life can fight at half hp instead of running for regen — the endgame Reckless points to.

## Details
- A new on-hit upgrade "Mend" in the Frenzy tree: a new file in src/content/upgrades/ (registered in its index) plus its talent line in src/content/talents/frenzy.ts.
- Talent line: id mend, upgrade mend, max 3, needs [["nerve", 3]]. The tree as the panel will draw it (T0058 adds Fang under Nerve the same way; add only the Mend line):
  ```
  Frenzy (3)
    Nerve (3, needs Frenzy 1)
      Adrenaline (2, needs Nerve 2)
      Mend (3, needs Nerve 3)
      Reckless (1, needs Nerve 3, Frenzy 3)
  ```
- Text: "On a Nerve hit: heal 1 hp per 10 hp missing. Per rank: +1 per 10 hp missing." maxLevel 3. Look: shape star, color green (#51cf66).
- Each Nerve jab hit heals the attacker for its hp missing divided by 10, per rank: rank 1 heals 1 hp per 10 hp missing (a critter at half of 100 max hp heals 5 hp per hit), rank 2 heals 2 per 10 (10 hp), rank 3 heals 3 per 10 (15 hp). Heals up to max hp, never over.
- Nerve's jab only — the tree's own weapon, the way Cling is Goo-only; Bolt, Maw, Lob, Goo and Slush hits do not heal. The heal does not depend on the jab's damage, so Split's extra (12% weaker) jabs each heal the same, and Reckless doubles the jab's damage but not Mend's heal.
- The heal reads without a new effect: it climbs the hp, and once T0057's wound arc is in the build it makes the arc grow back, vanishing at half hp.

## Compared with what exists

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Chomp | a heal from your own hits and kills | Chomp is a flat heal (5, 25 on a player) on every kill, any weapon, from the Body tree; Mend ticks on Nerve hits only and grows with your own missing hp |
| Reckless | the Frenzy tree, a hit while you are hurt | Reckless doubles the damage you deal below half hp; Mend heals you per Nerve hit, the more hurt you are — one spends the hurt for damage, the other buys back hp |
| Reap | a hit bonus tied to a hurt critter | Reap reads the enemy's hp (+6 on a hit on a hurt target); Mend reads your own missing hp and heals you |
| Chill | an on-hit effect | Chill slows the target; Mend heals the attacker |
| Ricochet | an on-hit effect | Ricochet bounces a bolt to another enemy; Mend heals you |
| Cling | an on-hit effect tied to one weapon | Cling sticks to the target on a Goo hit and ticks damage; Mend heals the attacker on a Nerve hit |

## Acceptance criteria
- [ ] The panel's Frenzy tab shows Mend under Nerve with its text, 3 ranks, needing Nerve 3.
- [ ] A player with Mend 1 at full hp fights: the jab hits heal nothing.
- [ ] The same player at half of 100 max hp: each Nerve jab hit heals 5 hp (Mend 1), 10 (Mend 2), 15 (Mend 3).
- [ ] Split's extra jabs each heal; Reckless does not change the heal.
- [ ] Mend never heals above max hp.

## Design (architect, yoga)

### Files
- create `src/content/upgrades/mend.ts` — the "Mend" on-hit upgrade (jab-only heal for the attacker)
- edit `src/content/upgrades/index.ts` — one import (between `maw` and `might`) + one `mend,` line after `reap,` (line 41, the on-hit group)
- edit `src/content/talents/frenzy.ts` — one talent line after the `adrenaline` line (line 13)

### Interfaces
No new types. Uses existing `UpgradeDef` (`onHit(ctx, me, level, hit)`), `Ctx.heal(target, amount)` (engine clamps to maxHp — verified `engine/sim/match.ts:1128-1131`), projectile id `'jab'` (`src/content/projectiles/jab.ts`), `PALETTE.green` (= `#51cf66`).

### Steps
1. Create `src/content/upgrades/mend.ts` (copy `cling.ts`'s structure):
```ts
import type { UpgradeDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A hurt Frenzy life buys back hp: every Nerve jab hit heals the attacker, the more hurt, the more. */
export const mend: UpgradeDef = {
  id: 'mend',
  name: 'Mend',
  description: 'On a Nerve hit: heal 1 hp per 10 hp missing. Per rank: +1 per 10 hp missing.',
  maxLevel: 3,
  look: { shape: 'star', color: PALETTE.green },
  onHit(ctx, me, level, hit) {
    if (!hit.projectile || hit.projectile.def.id !== 'jab') return; // Nerve jabs only (Bolt, Maw, Lob, Goo, Slush: nothing)
    const missing = me.maxHp - me.hp;
    if (missing > 0) ctx.heal(me, Math.floor(missing / 10) * level);
  },
};
```
2. Register: import line in `index.ts` between `maw` and `might`; list line `mend,` after `reap,`.
3. `src/content/talents/frenzy.ts`: add exactly `{ id: 'mend', upgrade: 'mend', max: 3, needs: [['nerve', 3]] },` after the `adrenaline` line (before `reckless`), so the panel draws Mend under Nerve with 3 ranks needing Nerve 3 (auto-drawn like Adrenaline; no panel code needed).

### Pitfalls
- Guard on projectile id `'jab'` only — never on damage: Split's weaker extra jabs each heal the same, Reckless doubles jab damage but not the heal.
- `ctx.heal` clamps at maxHp and no-ops on amount 0; a killing jab still fires onHit, which is fine (the attacker is alive and full-hp players get missing = 0 → no heal).
- `Math.floor` on missing (54 missing → 5 per rank), heal per rank `* level`.
- No effect, slot or visual: the hp climb is the readout; T0057's wound arc reverts from it automatically.

### Tests
none (content is auto-tested by engine/tests/).
