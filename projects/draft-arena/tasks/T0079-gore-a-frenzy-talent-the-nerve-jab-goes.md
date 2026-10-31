---
id: T0079
title: "Gore: a Frenzy talent, the Nerve jab goes through enemies while you are below half hp"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-31T13:48:21Z
epic: E17
---

## Goal
After a first prestige this life, the Frenzy tree opens its third fork under Nerve: Gore, the jab that threads a line of enemies only while you are hurt — the hurt state the whole tree lives in becomes how your weapon moves, not just how hard it hits.

## Details
- New upgrade "Gore" in src/content/upgrades/ (closest example: mend.ts — it also works with one weapon only and checks your state).
- Panel text: "After 1 prestige this life. While below half your hp, your Nerve jabs go through 1 more enemy, per rank."
- maxLevel 2. A jab fired while you are below half your max hp goes through 1 more enemy per rank (it hits the first, keeps flying, hits the next in its line); a jab fired at or above half hp goes gone on its first hit, as today.
- The jab keeps its look, speed, 180 range, 0.8 s cooldown and Nerve's +1 damage per 10 hp missing.
- Works with Nerve only, and why that is fine: Gore is the Frenzy commitment to the jab, the way Mend is Nerve-only. It does nothing with Bolt, Maw, Lob, Goo, Horn or Slush.
- Readable: the wound collar is on your critter exactly when the pierce is live, and a piercing jab reads the same way a Lance bolt reads.
- What it does with players: a jab that pierces a monster can still hit the player behind it (half damage, as every weapon does), and it can pierce a player too.
- Talent line: id gore, upgrade gore, max 2, needs [["nerve", 2]], points 3, prestige 1 — in the Frenzy tree (closest example: slush's line in the Lobber tree, the existing prestige-gated line).
- The tree as the panel will draw it:
  ```
  Frenzy (3)
    Nerve (3, needs Frenzy 1)
      Adrenaline (2, needs Nerve 2)
      Fang (2, needs Nerve 2)
      Gore (2, needs Nerve 2, points 3, prestige 1)
      Mend (3, needs Nerve 3)
      Reckless (1, needs Nerve 3 and Frenzy 3)
  ```
- What it costs: 2 points after 3 are already spent (Frenzy 1, Nerve 2) plus a prestige this life; the same 2 points could buy Adrenaline (kill sprint) or Fang (kill coins) — a real fork.
- Why it passes the prestige bar: it opens only after Nerve 2 in a second life, and it only changes how the jab moves — a fresh level-1 player cannot reach it and it never hands back level-17 power.

## Acceptance criteria
- [ ] After 1 prestige this life the Frenzy tab in the talents panel shows Gore under Nerve with its text; before a prestige it shows what it still needs.
- [ ] Below half hp with rank 1, a jab hits a first monster, keeps flying and hits a second in its line; at or above half hp the same jab goes gone on the first hit.
- [ ] Rank 2, below half hp: the jab goes through 3 enemies in its line.
- [ ] A jab that pierces a monster still hits a player behind it, at half damage.
- [ ] The wound collar is visible on your critter exactly when the jab pierces.
- [ ] Bots that take Gore behave the same in a 60-player match, and jabs cost no more than today (straight shots, no per-tick step).

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Lance | pierce | Lance adds a flat +1 pierce per rank to every projectile, always; Gore pierces only the Nerve jab, and only while you are below half hp |
| Reckless | the below-half-hp condition | Reckless doubles all your damage while hurt; Gore changes how one shot moves, and only the jab |
| Adrenaline | below half hp, Frenzy tree | Adrenaline pays on a kill with a speed burst; Gore pays every 0.8 s the jab fires, while you move |
| Fang | below half hp, Frenzy tree | Fang pays extra coins on a kill; Gore changes the jab's flight |
| Nerve | the weapon it touches | Nerve hits harder the more hurt you are; Gore makes the jab thread a line of enemies while you are hurt |
| Mend | a Nerve-only mod | Mend heals you on a Nerve hit per missing hp; Gore changes how the Nerve shot travels |

## Design (architect, cachyos-x8664)

### Files

- create `src/content/upgrades/gore.ts` — the Gore upgrade (`UpgradeDef`, `id: 'gore'`, `maxLevel: 2`, look `star` / `PALETTE.red`). One `onHit` hook: when one of the player's Nerve jabs lands its **first** hit and the player is below half max hp, extend that projectile's remaining hits by the rank (`p.pierce += level`), armed once per jab via the projectile's server-only `mem`.
- edit `src/content/upgrades/index.ts` — one import line (`gore`, between `goo` and `gush`) and one registry line in the `UPGRADES` list, next to the Frenzy cluster (after `fang`, before `fuse`).
- edit `src/content/talents/frenzy.ts` — one talent line in the Frenzy tree, after the `fang` line (it hangs off Nerve 2, grouped with the other `[['nerve', 2]]` forks, before `reckless`):
  `{ id: 'gore', upgrade: 'gore', max: 2, needs: [['nerve', 2]], points: 3, prestige: 1 },`

### Interfaces

```ts
// src/content/upgrades/gore.ts (new export; UpgradeDef hooks per engine/api.ts:352-368)
export const gore: UpgradeDef = {
  id: 'gore',
  name: 'Gore',
  description: 'After 1 prestige this life. While below half your hp, your Nerve jabs go through 1 more enemy, per rank.',
  maxLevel: 2,
  look: { shape: 'star', color: PALETTE.red },
  onHit(_ctx, me, level, hit) {
    const p = hit.projectile;
    if (!p || p.def.id !== 'jab' || p.mem.gored) return; // one arm per jab, at its first hit
    p.mem.gored = 1;
    if (me.hp < me.maxHp * 0.5) p.pierce += level; // rank 1: 2 hits, rank 2: 3
  },
};
```

That is the whole build. Everything else is existing: the `jab` projectile (`src/content/projectiles/jab.ts`: ice triangle, straight — no `path`/`step`, base pierce 1, life 0.5 s), the Nerve weapon (`src/content/upgrades/nerve.ts`: 0.8 s cooldown, 180 range, speed 360, +1 damage per 10 hp missing — unchanged; it is shared, do not touch it), and the wound collar (`directors/wound.ts` + `areas/wound.ts`, a red collar re-fired every tick on any critter below half hp) is the "readable" part — it is on exactly when the pierce is armed, so no new HUD, status or effect.

### Steps

1. Create `src/content/upgrades/gore.ts` exactly as above (copy the shape of `upgrades/mend.ts`: on-hit, jab-only guard, below-half check).
2. Register it in `src/content/upgrades/index.ts` (import + one line, next to the Frenzy cluster).
3. Add the one-line talent to `src/content/talents/frenzy.ts` after the `fang` line.

### Pitfalls

- **Arm exactly once per jab.** `onHit` runs on every hit; without the `p.mem.gored` guard, `pierce += level` re-arms on hit 2 and 3 and the jab never dies (or goes through too many). The guard must be set on the first hit regardless of the hp state. `mem` is server-only and dies with the projectile — the right place for "this jab is armed".
- **The extension must happen in `onHit`.** The engine resolves each hit as `strike` (owner's on-hit hooks run) **then** `p.pierce--`, killing the projectile at 0 — so the `+= level` inside the hook is honored before the decrement. It cannot be set at launch: upgrades have no `fire`/tick hook, and `stats.pierce` (the Lance way) is a flat per-launch stat that would pierce every weapon permanently, not conditionally on being hurt.
- **Strictly below half.** `me.hp < me.maxHp * 0.5` — at or above half hp the jab dies on its first hit as today (matches `fang`/`adrenaline`/`reckless` in this tree).
- **Nerve only.** The `p.def.id !== 'jab'` guard: Bolt, Maw, Lob, Goo, Horn, Slush jabs do nothing — their projectiles have other ids. `hit.projectile` is optional; guard it.
- **Do not touch shared files for numbers:** `nerve.ts` and `projectiles/jab.ts` stay as they are — look, speed, 180 range, 0.8 s cooldown and the +1 damage per 10 hp missing are all inherited. The jab stays a straight shot (no `step`), so it costs no more bandwidth than today and bots see nothing new.
- **PVP pass-through is engine, not content:** a jab that goes through a monster still strikes a player behind it at half damage (every weapon does), and it can pierce players too. Nothing to code.
- The panel text and gates are data-only: before a prestige the engine's panel shows what Gore still needs (the `points: 3` gate is Frenzy 1 + Nerve 2; `prestige: 1` opens it only after a prestige this life), after a prestige it shows under Nerve with its text.

### Tests

- `npm run check` — typecheck + lint + tests: one item per file and registered, valid data (`max: 2` ≤ `maxLevel: 2`), the talent in the Frenzy tree, reachable (Nerve 2 in-tree, 3 points spent, prestige gate), every upgrade in a tree, no upgrade's ranks sum past its `maxLevel`.
- `npm run smoke` — offline bots: a player with Gore rank 1 below half hp — jab hits the first monster, keeps flying, hits the second in its line (rank 2: 3); at/above half hp the same jab is gone on its first hit; a jab that pierced a monster still hits the player behind it at half damage; the 60-player budget holds with the jab unchanged (straight shot, no per-tick cost).
- Readability: the wound collar (the existing `wound` director) is visible on your critter exactly when the jab pierces — no new UI to verify beyond it.
