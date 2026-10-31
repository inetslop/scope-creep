---
id: T0011
title: "Gem rush: a line of 12 gems across the field, first touch takes all"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T03:16:43Z
epic: E3
---

## Goal
A moving prize: a line of twelve gems lays itself across the field, and the first player to collect any one of them takes all twelve at once — a race where players chase the line across each other.

## Details
- New director file `src/content/directors/gem-rush.ts` (closest example: `src/content/directors/gem-rain.ts`, the only director). No new pickup: it drops the existing gem (the pickup every monster drops, `src/content/pickups/`), each worth 1 xp like a Dot's gem.
- When it comes: 50 s in, and every 100 s after. Where: a random straight line across the field — 12 points 75 units apart (a line 825 units long), placed so the whole line is at least 200 units inside the field's edges.
- What it adds: the gems appear one by one along the line — the first immediately, then one every 0.5 s (all 12 in 6 s) — so the line visibly lays itself across the field. Nothing moves: each gem sits where it appears.
- The race: the moment any player collects the first gem of the line, every gem of that line — already appeared or not — flies to that player at once, and the line is over. One grab takes all twelve (12 xp, a good share of a level) in a single touch. If no one collects a gem, the twelve simply sit as ordinary 1-xp gems until someone walks past.
- What players see: twelve yellow gems appearing one after another along a visible straight line — the line itself is the announcement; nothing is added to the HUD.
- With 6 players: one player (or a bot) usually takes the line with little contest — the reward for being in the right place. With 60: a race across the field through other players; the line's path becomes a corridor players run along, and a slow runner can be intercepted before the line is done.
- It doesn't swamp the field: 12 gems per rush, every 100 s, all of them either collected or sitting as ordinary gems (far under the match's 1500-pickup cap).

## Compared with what exists
| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Gem rain | drops gems for players to collect | Rain drops everything at once around a random player — you are either there when it lands or you miss it; the rush lays a line across the field for anyone — a race where the first collection takes all twelve, and the chase is the event |

## Acceptance criteria
- [ ] At 50 s (and every 100 s after), 12 gems worth 1 xp each appear one by one along a straight line 825 units across the field — one every 0.5 s, the whole line at least 200 units inside the edges.
- [ ] The first player to collect any gem of the line collects all twelve at once (not-yet-appeared gems appear and fly to them): 12 xp in one grab, and the line is over.
- [ ] Two players racing the same line: the first to collect a gem takes all twelve; the other takes nothing from that line.
- [ ] Magnet (longer pickup range) does not change the rule: a gem another player already collected is not stolen by a longer pull; first collection wins.
- [ ] An unclaimed line leaves twelve ordinary 1-xp gems on the field.
- [ ] Gem rain still runs unchanged; the match starts and plays normally with 6 and with 60 players.
