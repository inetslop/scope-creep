---
id: T0079
title: "Gore: a Frenzy talent, the Nerve jab goes through enemies while you are below half hp"
size: M
priority: 2
status: design
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
