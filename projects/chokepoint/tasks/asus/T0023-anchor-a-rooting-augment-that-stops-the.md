---
id: T0023
title: "Anchor: a rooting augment that stops the road"
assignee: asus
size: L
priority: 3
status: design
depends_on: [T0021]
attempts: 0
created: 2026-10-28T05:03:06Z
epic: E4
---

## Goal
A new support augment with a behavior nothing in the game has: a full timed stop (root), not a partial slow. The player can freeze a stretch of road to set up a kill, and any attacking tower can grow a stop on its hits.

## Details
- New pool augment (rolls at all tiers like Lance — not Epic-only). **Closest existing augment:** Frost — both are support augments with no attack of their own. **What is new:** Frost slows continuously and partially (40% on hits); Anchor stops completely for a timed window — a full stop no current augment does, and a timed pulse rather than a standing aura.
- **As a tower's first augment (support role, no attack, like Frost):** every 3.0 s it roots (fully stops) all enemies within 2.5 cells for 0.75 s. A rooted enemy does not move (slows cannot extend or override it — the stop wins while it lasts), can still be hit and killed, and resumes walking from exactly where it stood when the root expires.
- **When added to a tower:** "Hits root the enemy for 0.5 s." — applied on each hit, not on a timer. Every extra copy of Anchor in the same tower lengthens every root it applies by +0.25 s (a Bolt+Anchor+Anchor's hits root 0.75 s; an Anchor+Anchor tower's own pulse roots 1.0 s).
- New combinations it creates:
  - Rapid + Anchor: near-continuous single-target rooting (attacks 50% faster, each hit roots)
  - Splash + Anchor: a burst that roots the whole pocket for 0.5 s
  - Bolt + Anchor: every hit briefly stops the enemy furthest along
  - Reach + Anchor: the heavy sniper hit briefly roots its target
  - Frost + Anchor: slow and root both apply; while the root lasts, the stop wins
- Overlapping roots do not stack: the longest remaining root holds the enemy.
- **Tiers (E4):** Common: pulse 0.75 s, hit-root 0.5 s. Rare: pulse 1.0 s, hit-root 0.75 s. Epic: pulse 1.5 s, hit-root 1.0 s. The +0.25 s per extra copy is the same at every tier.
- Not offered in the opening draft — it comes for free from the same rule that keeps Frost and Mint out of the opening offers (the opening offers only attacking augments).
- **Look on the tower:** a flat slate ring (muted gray-blue) on the tower's base with four small tick marks around it; if that hue is already used by another augment's look, take the nearest unused muted color. On each pulse, a flat light-blue ring expands from the tower to the edge of its 2.5-cell range over roughly the first 0.2 s of the root, so the stop is visible coming. A rooted enemy shows a flat light-blue ring on the ground beneath it for the duration of its root.
- **Card lines (Common):** first: "Roots everything within 2.5 cells for 0.75s, every 3s." / added: "Hits root for 0.5s (+0.25s per extra Anchor)."

## Acceptance criteria
- [ ] The draft can roll Anchor as Common, Rare and Epic (frame and gem row per tier, as T0002 defines them); the card shows that tier's numbers; it never appears in the opening draft.
- [ ] A lone Anchor tower never fires; every 3.0 s the light-blue ring expands to its range and every enemy inside is fully stopped for 0.75 s (Common): a Dart mid-stride halts, shows the ground ring, and resumes exactly 0.75 s later.
- [ ] A Bolt tower with Anchor in a later slot roots its target on every hit — the ground ring appears on the hit, not on a timer.
- [ ] A second Anchor in the same tower lengthens every root that tower applies by +0.25 s.
- [ ] A rooted enemy takes full damage and can die while rooted; two overlapping roots do not stack durations.
- [ ] The tower shows the slate ring with four ticks at 1x zoom at 412x915 and 1280x720; the pulse ring and the ground ring are readable at both sizes.
- [ ] A first-time player sees what an Anchor tower does without reading the card: a ring, then everything inside it stops.
