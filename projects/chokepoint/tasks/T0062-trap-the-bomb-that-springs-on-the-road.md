---
id: T0062
title: "Trap: the bomb that springs on the road"
size: M
priority: 3
status: design
depends_on: [T0039, T0054, T0055]
attempts: 0
created: 2026-10-28T13:29:40Z
epic: E4
---

## Goal
A new pool augment with a new kind of attack: a trap that waits on the road and springs when an enemy steps on it — the game's first triggered attack, and the first augment whose added form leaves something on the board.

## Details
- Closest existing augment: **Splash** (a burst around a point). New: the burst is not fired by the tower — it is triggered by an enemy arriving at a fixed point on the road, so a trap's value is a placement decision (where the road passes the tower, where it bunches); and added, kills leave traps at their spots, which no added form does.
- Card lines (the draft card, both forms):
  - First: "Lays a trap on the road ahead: when an enemy comes within 0.6 cells, it springs — 14 damage to everything within 1.2 cells."
  - Added: "Kills by this tower leave a trap at the kill spot."
- **First form (its own attack):** a small red trap disc (flat, ~0.5 cell across, dark red ring) sits on the road on the nearest road cell to the tower. The tower re-lays the disc every 3.0 s (Common) / 2.5 s (Rare) / 2.0 s (Epic) whenever its home trap is missing (the timer runs continuously). When any enemy's center comes within 0.6 cells of the disc's center it springs: 14 (Common) / 18 (Rare) / 24 (Epic) damage to every enemy within 1.2 (1.3 / 1.4) cells of the disc — a white ring pulse, and the usual chips for the kills it causes — and the disc is consumed.
- **Added form:** on every kill the tower makes (whatever its attack), if the tower has fewer than 2 active traps, a trap disc appears at the kill spot with the same tier values. A kill-laid disc fades after 6 s if untriggered. A tower keeps at most 2 active traps: its home trap plus the newest kill-lay (a new kill-lay replaces an old one; the home trap is never replaced).
- The disc is an object on the board, not a projectile: it is not targeted, blocks nothing, and is unaffected by slows or roots — a rooted or slowed enemy standing on it still triggers the spring.
- On the tower: a trap-first tower is a low round red token with a small dark red disc on its face (the trap's shape); slots show their tier pips as usual (T0010); an added Trap in any tower shows as one small red tick on the token, the same tick language as the other added forms.
- Draft: Trap joins the pool at all three tiers, offered from the opening draft (like Lead, Ember, Push, Beam and Ricochet), rolling at the normal tier odds (T0002/T0011); the card's frame, gems and tier word are as usual.
- Closest example to model: Anchor (T0023) — a pool augment with a cadence and an added form on the host's attack; here the cadence pulse is a triggered spring and the added form is a kill-lay.

## Acceptance criteria
- [ ] A new tower with Trap first is red, shows the trap-disc shape, and lays a red disc on the nearest road cell; the disc springs (white ring pulse + chips) when an enemy comes within 0.6 cells, dealing 14/18/24 damage to everything within 1.2/1.3/1.4 cells by tier, and re-lays on the 3.0/2.5/2.0 s cadence.
- [ ] Any tower with an added Trap lays a disc at the kill spot when it makes kills (max 2 active per tower: home + newest kill-lay); a kill-laid disc fades after 6 s if untriggered and springs with the same values.
- [ ] A rooted or slowed enemy on a disc triggers the spring; the disc is not a projectile, is not targeted and blocks nothing.
- [ ] The draft offers Trap at normal tier odds from the opening draft; the card shows both lines; the tower shows one red tick per added copy; works at 412x915 and 1280x720.
