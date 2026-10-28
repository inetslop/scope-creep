---
id: T0027
title: "Push: the augment that moves enemies back along the road"
assignee: asus
size: L
priority: 3
status: designing
depends_on: [T0020]
attempts: 0
created: 2026-10-28T05:51:38Z
claimed_at: 2026-10-28T05:51:42Z
epic: E4
designer: desktop
---

## Goal
The draft can roll a new augment, Push: a gust that shoves enemies back along the road — the first thing in the game that moves an enemy instead of only slowing or stopping it. It buys time, not damage, so a chokepoint can be held back, not just through.

## Details
- New pool augment (rolls at all tiers; offered from the opening draft — a support role, like Frost and Mark). **Closest existing:** Frost (the only other support pulse: affects everything in a radius without dealing damage — Frost slows). **What is new:** no existing augment changes an enemy's **position along the road**. Frost and Anchor change how fast an enemy walks; Mark changes what its hits cost; Push moves it *back* — an enemy pushed back near the exit is bought real time, and the road behind it is struck again. As an added form, "hits push back" is the first added form that changes an enemy's position: it combines with every attack in the game in a way no other added form does (damage, slow, mark, leap, pierce, extra shots).
- **As a tower's first augment (support role, no damage):** a gust that pushes **everything** within 2.5 cells back along the road. Common: 0.8 cells back, every 2.4 s. Rare: 1.0 cells back, every 2.0 s. Epic: 1.2 cells back, every 1.8 s. The slide takes ~180 ms along the white road (never a teleport), and the gust plays a soft whoosh (one new Sfx method, quieter than the hit blip). A push deals no damage: an enemy's health, slow and mark are exactly unchanged by it.
- **When added to a tower:** every enemy this tower hits is also pushed back 0.4 cells; +0.4 cells per extra Push in the tower (two Pushes: 0.8 per hit). The same numbers at every tier. Per-hit pushes are silent (a Rapid host would spam the sound); only the support gust plays the whoosh.
- **The push is a position change, not a speed change:** the enemy's remaining road distance shrinks. A slowed enemy pushed back is still slowed when it walks on. An enemy at the road's start never slides before it (the push clamps at the start). Sprinter (T0006) speeds an enemy up when it is hit — the two coexist: a hit may speed an enemy up *and* push it back, and the push never touches speed.
- **Card lines:** Common first: "Pushes everything back 0.8 cells, every 2.4 s." / added: "Hits push back 0.4 cells, +0.4 per Push." The Rare and Epic cards show their own distance and cadence in the same first line (1.0 cells / 2.0 s; 1.2 cells / 1.8 s); the added line is the same at every tier.
- **Look on the tower:** a body shape and bright color no other augment uses (check the content folder; if the obvious pair is taken by an in-flight augment, take the next free one). A short, wide, flat barrel (the gust comes out of it; it throws nothing), and one small outward-pointing tick on the base ring per Push in the tower (a small arrowhead pointing away from the base, in the existing tick style). If T0010's tier pips have landed, they stay visible — the ticks sit around/below the pips, never on top of them.
- **The tower-panel line** (the tower's described spec, the same place Mark's mark line lives) reads the push numbers: e.g. "Pushes everything back 0.8 cells", and for a tower with a Push added to another first augment, "...and its hits push back 0.4 cells".
- The gust values (distance, cadence, per-hit push) get spec-test coverage closest to Frost's slow values in the augment tests, and the push clamp (no enemy ever before the road's start) is one invariant line in the debug run checks next to the existing enemy invariants.
- No new input, no new HUD element; the pause screen is unchanged. The only new sound is the gust whoosh.

## Acceptance criteria
- [ ] The draft can roll Push as Common, Rare and Epic (frame and gem row per T0002); the card shows that tier's distance and cadence; the added line reads "Hits push back 0.4 cells, +0.4 per Push." at every tier.
- [ ] A lone Common Push tower pushes every enemy within 2.5 cells back 0.8 cells every 2.4 s: enemies visibly slide back along the road over ~180 ms and a soft whoosh plays; an enemy's health after the gust is exactly what it was before.
- [ ] An enemy at the road's start does not slide before it; a slowed enemy pushed back is still slowed when it walks on.
- [ ] A Bolt tower with Push in a later slot pushes each hit enemy back 0.4 cells on every shot; with two Pushes it pushes back 0.8 per shot.
- [ ] A Rare Push tower pushes 1.0 cells every 2.0 s and an Epic pushes 1.2 cells every 1.8 s — visibly stronger and faster than the Common one.
- [ ] The tower shows the free shape/color body, the short flat barrel and one outward tick per Push copy, visible at 1x zoom at 412x915 and 1280x720.
- [ ] A first-time player can read what a Push tower does from the board alone: enemies slide back when it fires.
