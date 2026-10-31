---
id: T0116
title: "Fizz: a Lobber capstone, the bubble's splash lingers and strikes every 0.5 s"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-31T19:30:37Z
claimed_at: 2026-10-31T19:30:41Z
epic: E23
designer: desktop
---

## Goal
A committed Lobber's splash stops being a one-shot: where a bubble's splash lands, the ice stays 2.5 s and keeps striking, so kiting leaves a trail of popping ice and a held splash is a real zone.

## Details
- This supersedes T0109, the failed first draft of this same capstone (rejected only for an incomplete table). Everything below is the full spec.
- **Fizz is an on-hit upgrade** — it must be, because no server hook can ask a player for their upgrades: its one hook fires when your bubble's splash strikes, and when you have Fizz it lays a **fizz-puddle** at the splash's spot.
  - Radius: the splash's radius where it landed, so **Wide makes the puddle as big as the splash**.
  - Lasts 2.5 s and strikes everything inside (monsters and players alike) every 0.5 s for 3 damage (players at half, as with all your hits) — five strikes.
  - **No slow** (that is Slush).
  - One puddle per splash. A fizz-puddle's own strikes lay no new puddles. Split's fanned bubbles each leave their own puddle where they land.
  - If Bop (T0118) has landed by build time: a popped bubble leaves no splash, and so no fizz-puddle.
- **Look:** a shallow ice puddle with an ink rim — the splash's rim, flattened to the ground, in the splash's teal/ice colors. A small white tick (a 4-unit pop, no glow) where it strikes, each 0.5 s.
- **Talent line (Lobber tree, planning/modules/talents.md):** id `fizz`, upgrade `fizz`, max 1, needs `[["lob", 4]]` — the capstone beside Fuse, the same commitment as Fuse.
- **Text:** "When your bubble's splash lands, it lingers 2.5 s and strikes everything inside every 0.5 s for 3 damage. The puddle is as big as the splash."
- **With every weapon:** Fizz is the Lobber's capstone and reacts only to your bubble's splash. A player who cross-trained elsewhere (for example Split from the Gunner) gets a puddle per fanned bubble that lands; Fizz never touches any other tree's weapon.

## Compared with what exists
Fizz is an on-hit, so one row for every on-hit and on-kill upgrade that exists:

| Existing | What it shares | What Fizz does that it can't (not numbers) |
| --- | --- | --- |
| Ricochet | on-hit hook on your hits | sends one bolt on to another enemy; Fizz leaves ground where your splash landed |
| Reckless | on-hit that changes the hit | doubles your hits while you are hurt; Fizz adds strikes on the ground after the hit |
| Chill | on-hit that acts on the victim it hit | slows the one it hit; Fizz strikes whoever stands in the spot afterwards |
| Reap | on-hit extra damage | adds damage to a half-dead target it hits; Fizz keeps striking the spot on a timer |
| Swarm | on-hit scaled by the crowd | scales with the enemies around the target; Fizz strikes the spot no matter who is around |
| Leech | on-hit that pays the attacker | heals you while the crowd is on you; Fizz pays the ground, not you |
| Mend | on-hit that heals the attacker | heals you on a Nerve hit; Fizz never heals |
| Gore | on-hit that extends a shot | lets a Nerve jab pass through while you are hurt; Fizz extends a splash in time, not range |
| Cling | on-hit that lays a field | splats a riding field on the critter it hit; Fizz lays a field on the ground where the splash was |
| Snare | on-hit that marks the victim | saps the one it hit so your damage bites it harder; Fizz marks the spot, and it bites whoever stands there later |
| Chomp | on-kill | heals you when a kill happens; Fizz reacts to a splash's strike and it strikes back |
| Adrenaline | on-kill that buffs you | sprints you on a kill while hurt; Fizz leaves a hazard where you hit |
| Fang | on-kill coin | pays coins on a kill while hurt; Fizz pays damage over time on the ground |
| Fuse | a reaction to your bubble's kills | pops a one-shot ring where a bubble killed; Fizz makes the splash itself linger and strike again |
| Scatter | a kill that spawns more attacks | pops a Goo kill into 4 seekers; Fizz keeps the same splash striking where it landed |
| Gush | lays a puddle where a kill happens | a slow puddle at a Goo kill, refreshed while you stand in it; Fizz's puddle strikes (no slow) and is where the splash lands, not where a kill happened |
| Chew | a puddle that bites | bites whatever stands in your Gush puddle; Fizz's bite is on any splash that lands, with no puddle there before |
| Nest | on-kill scaled by the crowd | heals per neighbor of the corpse; Fizz's puddle is as big as the splash and strikes on a timer |
| Sting | on-kill burst | bursts the corpse when the crowd is on it; Fizz's field stays after everything is dead |
| Scavenge | on-kill xp | pays xp per neighbor of the corpse; Fizz pays damage per strike, with no kill needed |

## Acceptance criteria
- [ ] A player with Fizz: after a bubble's splash strikes, a puddle the size of the splash stays where it was for 2.5 s and strikes everything inside (monsters and players, players at half) every 0.5 s for 3 damage.
- [ ] A puddle from a rank-3 Wide splash is visibly bigger than one without Wide.
- [ ] A critter standing in a fizz-puddle moves at full speed (the puddle slows nothing).
- [ ] A fizz-puddle's strikes lay no further puddles.
- [ ] A player without Fizz is unchanged: the splash strikes once and is gone.
- [ ] Split's fanned bubbles each leave their own puddle where they land.
- [ ] A small white tick where the puddle strikes, each 0.5 s.
- [ ] Fizz is in the Lobber tab of the talents panel as a 1-rank capstone beside Fuse, needs Lob 4, with the text above.
