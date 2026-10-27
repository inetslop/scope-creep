---
id: T0146
title: Second Wind — the last heart forgives once
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T21:50:56Z
---

## Goal
The last heart is a moment, not an ending. The first time your HP falls to 1 or below in a run, the page forgives you the way Rest forgives the quiet: a one-time heal that turns the near-death into a comeback.

## Details
- A new run rule, owned by a **pure rule module in `src/core/`** (the rest/crop pattern) with unit tests: `SecondWindState` + constants, per run, not persisted.
- The rule: the moment the player's current HP, after any damage (enemy contact, enemy bullet, or a continuous burn — Gutter, Crop, Tide, The Press), falls to **1 or below** without killing, and the wind is unused in this run:
  - the wind is consumed (never again this run);
  - the player is healed by **25% of max HP**, rounded down, minimum 1 HP, capped at max HP.
- A hit that kills (HP to 0 or below) never triggers — the page forgives the near-death, not the death.
- At the trigger, once per run, at the player's position:
  - a flat **paper-light** (PALETTE.paperLight) ring growing ~8→24 u, fading over 300 ms (the first-light ring idiom, T0138, paperLight instead of ink) — the dark page brightens at you;
  - a small-caps **"SECOND WIND"** note in ink in the HUD, fading over 2 s (the nameplate idiom, T0064), laid out for 412×915 and 1280×720;
  - the existing low blip (T0101);
  - the level-up pulse swell (T0102) plays on your circle.
- It composes with everything and changes nothing else: a Rest (T0134) negation deals no damage so it never triggers; the Varnish coat (T0139) can still leave you at 1 after the halving and the trigger fires on the final HP; the low-HP vignette (T0141) stays on until you heal above 30%.
- No new key, scene, always-visible HUD element, marginalia, or change to stat, spawn, hazard, weapon, clock or music.
- The pure module exposes the trigger decision and heal amount given (used, currentHp, maxHp); unit tests lock: no trigger above 1 HP, trigger at exactly 1, trigger below 1 while alive (0.5), no trigger on a killing blow (hp ≤ 0), once per run (no second trigger even after dropping to 1 again), heal = max(1, floor(0.25 × maxHp)), the cap at max HP, and a fresh run unused.

## Acceptance criteria
- [ ] In a run, the first time your HP falls to 1 or below without dying, you are healed 25% of max HP (floor, min 1, capped at max); a paper-light ring pops at you, an ink small-caps "SECOND WIND" note prints for 2 s, the low blip plays, and your circle swells.
- [ ] A second fall to 1 HP later in the same run does nothing — no heal, no ring, no note, no sound.
- [ ] A hit that kills never triggers the wind.
- [ ] The trigger works from continuous burns (Gutter, Crop, Tide, The Press) as well as from discrete hits.
- [ ] A fresh run starts unused; nothing persists between runs; no new key, scene or always-visible HUD element.
- [ ] A pure rule module with unit tests (threshold, killing-blow exclusion, once-per-run, heal amount, cap); the full gate (typecheck, lint, unit tests, desktop + mobile smoke) passes.
