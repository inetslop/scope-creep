---
id: T0114
title: "Targeting modes per tower: first, strongest, closest"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T09:55:07Z
---

## Goal
Every tower aims at the enemy furthest along by default; a small chip in the tower panel lets a player point a tower at the strongest (most hp) or the closest enemy instead — focus-fire the Hauler or clear the head of a pack, per tower, decided where the tower is managed.

## Details
- Three modes, one per tower:
  - **First** (the default) — exactly today's targeting: the enemy furthest along in range. Every fresh tower is First, and a resumed run keeps First unless it was changed, so existing play is byte-identical.
  - **Strongest** — the enemy in range with the most current hp; a tie goes to the furthest of those.
  - **Closest** — the enemy nearest the tower; a tie goes to the furthest of those.
- The mode applies to the tower's main target choice for every targeting augment: Bolt, Rapid, Reach, Lance, Splash (the blast center), Chain (the first strike), Beam (the main line), Spray (the first shot), Mark (the marked enemy) and Ember (the ignited enemy). It never applies to position-based auras (Frost's ring, Push's gust, Anchor's root, Pulse's ring, Rally, Mint) or to nearest-pick added forms (the Beam's second beam, Spray's needles, the Chain's leaps).
- Target selection is centralized where it lives today (the targeting core, `core/targeting.ts`, is the home): add the mode there so every attack's main choice goes through the one place that knows it; where an attack hard-codes "furthest" today, route it through the same helper.
- UI — the tower panel (T0008): one small chip on the panel's stats line reading "First" / "Strongest" / "Closest" in muted ink, tappable to cycle First → Strongest → Closest → First, with the existing soft button blip (no new sound). The chip shows on every tower, always — the mode is not an augment: no barrel, ring or tick on the tower (the small board-side marker is parked in IDEAS as a follow-up while the tower-look file is busy).
- Listed on the pause screen: "Targeting — tap the mode chip in the tower panel: First / Strongest / Closest."
- Persistence: the mode is part of the tower's resume save (the T0042 pattern) — absent means First, so a save written before this task loads as First. New runs: every tower First.
- It matters in play now: the Hauler (3× Block's hp, 10 gold) is worth focusing with Strongest; a Dart or Sprinter pack is worth clearing with Closest; First stays the default the waves are tuned around.

## Acceptance criteria
- [ ] A fresh tower is First and targets the enemy furthest along in range — byte-identical to today's targeting for every augment.
- [ ] Tapping the mode chip in the tower panel cycles First → Strongest → Closest → First with the soft blip; the chip's word updates in place.
- [ ] A Strongest-mode tower aims at the enemy in range with the most current hp (the Hauler over Darts and Dots); when it dies or leaves range, the next strongest; ties go to the furthest.
- [ ] A Closest-mode tower aims at the nearest enemy in range; ties go to the furthest.
- [ ] The mode applies to the main attack of Bolt, Rapid, Reach, Lance, Splash, Chain, Beam, Spray, Mark and Ember; position-based auras and nearest-pick added forms (the Beam's second beam, Spray's needles, the Chain's leaps) are unaffected.
- [ ] The mode survives a resume (the save carries it; a save without it loads as First).
- [ ] The pause screen lists the mode chip; no new key, no new sound.
