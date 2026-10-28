---
id: T0028
title: "Ember: the burn that keeps dealing damage"
assignee: asus
size: L
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T06:24:55Z
claimed_at: 2026-10-28T06:24:58Z
epic: E4
designer: desktop
---

## Goal
The draft can roll a new augment, Ember — the first damage over time in the game. Every combo hits twice: the shot, and the burn that keeps ticking after it, so a slow sniper and a fast volley both leave enemies burning.

## Details
- New pool augment (rolls at all tiers; offered from the opening draft). **Closest existing:** Mark (a cadence effect on the enemy furthest along). **What is new:** no existing augment deals damage over time — the burn is a second damage source that keeps ticking after the attack ends, and its ticks are the source tower's damage, so Mark amplifies them and the tick that kills is the source tower's kill (gold, stats and Mint's +1 all apply to it).
- **As a tower's first augment (its own attack):** sets ablaze the enemy furthest along within range, every 1.5 s. The burn deals its rate continuously (the engine may tick it every 0.5 s). Common: 3 damage per second for 3 s. Rare: 4 per second for 3 s. Epic: 5 per second for 3 s. An untouched enemy takes about 9/12/15 over the burn's life.
- **Re-ignition:** setting ablaze an enemy that is already ablaze refreshes the 3 s duration and keeps the higher per-second rate — two Common Embers never add to 6/s, a Rare over a Common burns at 4/s. The burn never stacks additively.
- **When added to a tower:** every enemy this tower hits is also set ablaze with the tower's tier burn (3/4/5 per second for 3 s), refreshed on every hit. The new way no added form has: any attack pattern can ignite — Bolt's volley, Splash's burst, Lance's line, Reach's heavy shot — and the damage keeps working after the shot stops.
- **Card lines:** Common first: "Sets ablaze the enemy furthest along: 3 per second for 3 s." / added: "Hits set ablaze: 3 per second for 3 s." Rare and Epic show their own rate in both lines (4, 5); the duration is 3 s at every tier.
- **Look on the tower:** the burn's color is orange everywhere (the tower's look, the mark on the enemy, the ticks). A body shape and bright color no other augment uses (check the content folder; if the obvious pair is taken by an in-flight augment, take the next free one). Ember first: a small orange dot at the muzzle of the barrel. Every added Ember: one short orange tick on the barrel, the existing tick style. If T0010's tier pips have landed, they stay visible — the ticks never sit on top of the pips.
- **The mark on an ablaze enemy:** a small orange dash (6 px, rounded) orbits the enemy, one full turn in about 1 s, for as long as the burn is active.
- **The tower-panel line** (the same place Mark's mark line lives): "Sets ablaze the furthest enemy: 3 per second for 3 s", and for a tower with Ember added to another first augment, "...and its hits set ablaze".
- **Sound:** one new Sfx method, a soft low whoosh, played only when an enemy that is not already ablaze is set ablaze (a refresh, or a Rapid host re-igniting the same enemy, is silent — a Rapid host must not spam it). The ticks are silent.
- **Spec-test coverage** closest to Mark's (`tests/core/mark.test.ts`): the burn's total over its life per tier, refresh keeping the higher rate (never additive), Mark's +25% on the ticks, the killing tick crediting the source tower's kill gold, the added form through a Bolt tower, and the card lines per tier. One invariant line in the debug run checks next to the other enemy invariants (no active enemy with a negative burn time).
- No new input, no new HUD element; the pause screen is unchanged.

## Acceptance criteria
- [ ] The draft can roll Ember as Common, Rare and Epic (frame and gem row per T0002); the card shows that tier's per-second rate; the added line reads "Hits set ablaze: N per second for 3 s."
- [ ] A lone Common Ember tower sets ablaze the enemy furthest along within range every 1.5 s: an orange dash orbits the enemy and it takes 3 damage per second for 3 s (an untouched enemy takes about 9 from the burn).
- [ ] Re-ignition refreshes the 3 s and keeps the higher rate: two Common Embers on one enemy never deal 6/s; a Rare Ember over a Common burns at 4/s.
- [ ] A marked, ablaze enemy takes +25% from the burn's ticks — visibly faster death than the same unmarked ablaze enemy.
- [ ] The tick that kills an enemy is a normal kill for the tower that lit the burn: gold pops where the enemy died, the run's stopped count grows, and a Mint within 2 cells pays its +1.
- [ ] A Bolt tower with Ember in a later slot ignites every enemy its shots hit, and the tower shows one short orange tick per Ember in it.
- [ ] A first-time player can read it from the board alone: enemies with the orbiting orange dash keep taking damage after the last shot.
