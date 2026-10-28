---
id: T0038
title: "Ricochet: the shot that bounces off the board's rocks"
size: L
priority: 3
status: design
depends_on: [T0004]
attempts: 0
created: 2026-10-28T09:35:22Z
epic: E4
---

## Goal
The board's shape joins the fight: the draft can roll a new augment, Ricochet — a shot that deflects off the board's rocks and strikes the enemy behind them. Every run is a new board; with Ricochet, that board is something to build around, not just look at.

## Details
- New pool augment (rolls at all tiers; offered from the opening draft). **Closest existing:** Bolt (a straight shot at the furthest). **What is new:** the board's rocks take part in the attack — the first augment that uses the board's shape in combat; a shot that would cross a rock deflects off it and can strike an enemy the tower cannot reach directly.
- **As a tower's first augment (its own attack):** a mid-tempo shot at the enemy furthest along. Common: 7 damage every 0.8 s. Rare: 9 every 0.7 s. Epic: 12 every 0.6 s. Range 4.5 cells (mid-long: longer than a Bolt's, shorter than Reach's common). If the shot's path crosses a rock before reaching the target, it bounces off that rock once — a true deflection off the rock's round face, no damage to the rock, a small white pop at the impact point — and continues straight until it strikes the first enemy it touches. With no rock in the way it is a plain shot at the target.
- **A bounced strike is a normal hit:** full per-hit damage, plus the per-hit effects of any other augments in the tower (Frost added slows the struck enemy, Ember added ignites it, a Marked struck enemy pays +25%). The deflected shot strikes the first enemy it touches and stops — no piercing (that is Lance's).
- **When added to a tower:** the tower's shots bounce off one more rock per Ricochet — a shot bounces off up to N rocks, N = the Ricochets in the tower (a lone Ricochet tower bounces once; a Bolt with one Ricochet in a later slot bounces once, with two Ricochets twice). After the last allowed bounce the shot strikes the first enemy it touches, or fizzles in a small white puff if it meets none.
- **No falloff:** the shot deals the same damage after a bounce as before it; rocks are never damaged, moved or consumed.
- **Card lines:** first: "Shots bounce off a rock and hit the enemy behind." — the per-tier damage and rate (7 / 0.8 s, 9 / 0.7 s, 12 / 0.6 s) show on the card's numbers line the way Bolt's numbers do. Added: "Shots bounce off one more rock."
- **The tower-panel line** (the same place Ember's and Mark's live): a Ricochet tower reads "Shots bounce off a rock: 7 damage, every 0.8 s" with its tier's numbers; a tower with Ricochet added appends ", and its shots bounce off N rocks".
- **Look on the tower:** a body shape and bright color no other augment uses (check the content folder; if the obvious pair is taken by an in-flight or queued augment, take the next free one). Ricochet first: the barrel ends in a small angled arrowhead tip, kinked as if the shot has already turned. Every Ricochet added to another tower: one small tick near that tower's barrel tip in Ricochet's color. If T010's tier pips have landed, they stay visible — the ticks never sit on top of the pips.
- **Sound:** one new Sfx method, a short soft "tink" (a high blip at the soft UI-blip volume, never above the hit blip), played once per rock a shot deflects off; a shot that meets no rock, and the fizzle, are silent.
- **Spec-test coverage** (close to the projectile tests): bounce count equals the Ricochet copies (1 for a Ricochet tower, +1 per added), no damage falloff over bounces, no rock ever takes damage, the added form through a Bolt tower, the fizzle (a deflected shot with no enemy behind the rock strikes nothing and despawns cleanly), and the card lines per tier. One invariant line in the debug run checks next to the other projectile invariants (no live shot with more bounces than its source tower's Ricochet copies).
- No new input, no new HUD element; the pause screen is unchanged.

## Acceptance criteria
- [ ] The draft can roll Ricochet as Common, Rare and Epic (frame and gem row per T0002, name line per T0026); the card shows that tier's damage and rate; the added line reads "Shots bounce off one more rock."
- [ ] A lone Common Ricochet tower fires 7 damage at the enemy furthest along every 0.8 s; with no rock in the way the shot behaves like a plain shot.
- [ ] With a rock between tower and target, the visible shot deflects off the rock (a small white pop at the impact, one soft tink) and strikes the first enemy it touches behind it for full damage.
- [ ] A bounced strike is a normal hit: a Ricochet tower with Frost added slows the struck enemy, and a struck marked enemy dies faster than the same unmarked one (Mark's +25%).
- [ ] A second Ricochet in a tower lets its shots bounce off two rocks in one flight; the tower shows one Ricochet tick per copy and the tower panel says the shots bounce off 2 rocks.
- [ ] Damage never drops after a bounce; rocks are never damaged, moved or consumed; a deflected shot that meets no enemy fizzles in a small white puff.
- [ ] A first-time player can read it from the board alone: the deflection is visible mid-flight, and the struck enemy is the one behind the rock.
