---
id: T0132
title: "The double knot: a second feud between the same pair wears a second knot and pays double"
size: M
priority: 2
status: designing
depends_on: [T0130]
attempts: 0
created: 2026-10-31T22:29:04Z
claimed_at: 2026-10-31T22:29:08Z
epic: E30
designer: desktop
---

## Goal
A feud that restarts between the same two players this match is a bigger deal — they wear a second, smaller knot, and whoever ends that repeat feud is paid double, so a rivalry that keeps coming back becomes the most valuable target on the field.

## Details
- In `src/content/directors/grudge.ts`, count how many times each pair has formed a feud this match: a new `mem` entry `count:<a>:<b>` (a < b), incremented in the same branch that forms a feud (next to `setGrudge`). Once a pair's count reaches 2 they are a double feud for the rest of the match (the count never resets within a match; a new match starts fresh).
- The double knot: a new status `src/content/statuses/grudge-knot-2.ts`, registered in `src/content/statuses/index.ts`, modeled on `grudge-knot.ts` (T0130) — a second, smaller candy-red ribbon knot (about 0.6x the first) pinned just outside and below the first knot at the top-left, still clear of the eyes, the crown, the prestige stars and the name. The grudge director's `tick` adds `grudge-knot-2` (same 0.2 s refresh) to each player whose feud partner is a double feud, alongside the usual `grudge-knot`; both knots come off together when the feud pays.
- The double pay: in the payoff branch of `onKill`, if the pair's `count` is 2 or more, pay double — +30 xp and +10 coins instead of +15 xp and +5 (a bot killer still gets no coins).
- What a player sees: when the same pair feuds a second time, a second smaller knot appears beside the first on both critters — the field tells a double feud (two knots) from a single one (one knot) at a glance. Ending a double feud pays double and both knots come off.
- With 6 players: a human and a bot can become a double feud; a human ending it gets +30 xp and no coins land in the bot's profile. With 60: many double feuds at once; the state is still one count per pair and one extra small knot per feuding player.

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| The grudge (T0130) | the red knot on both feuding players, paid on the ending knockout | the single grudge is one feud with one knot and a flat pay; the double knot is the same pair's repeat feud — a second knot and a doubled pay |
| The crown | a mark on the critter that moves and pays on a pvp knockout | the crown follows the top score of everyone; the double knot marks one pair's repeated duel and pays whichever of the two ends it |
| The mark | a timed target whose knockout pays a bonus | the mark is a random 15 s; the double knot is earned by two players feuding twice and lasts until it pays |

## Acceptance criteria
- [ ] When a pair forms a feud a second time this match, a second, smaller red knot appears beside the first on both critters; a first-time feud shows only the single knot.
- [ ] The next knockout between a double-feuding pair pays the killer +30 xp and +10 coins (a bot killer gets the xp, no coins), and both knots come off.
- [ ] A pair that has feuded twice stays a double feud for the rest of the match; a new match starts with no counts.
- [ ] The double knot never covers the eyes, the crown, the prestige stars or the name, and reads at a glance in a crowd as "two knots" versus "one knot".
- [ ] A monster knockout still clears nothing: a double-feuding player knocked out by a monster comes back still wearing both knots.
