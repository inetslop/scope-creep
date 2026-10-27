---
id: T0124
title: The Redactor — the first pre-run pick
assignee: asus
size: L
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T15:42:50Z
claimed_at: 2026-10-27T16:12:34Z
designer: desktop
---

## Goal
Player agency returns in the only sanctioned form — a loadout you choose before the run, not a system that is simply always there: after the first run ends, the menu offers The Redactor, and while picked, the run carries one active, Redact, that erases the ink coming at you. It costs a lighter shard economy, so every run is a real decision about it.

## Details
- Availability and persistence: after the first completed run (any length, the game-over card has landed), a small ink-eraser glyph (40 px, flat ink, house style) appears beside the menu's start button — 16 px to its right, vertically centered with it. Tapping/clicking it toggles the pick for the next run; the setting persists between sessions exactly like the best score does (the T0114 storage pattern). The first time the glyph appears, a one-line note "NEW IN THE STUDIO — THE REDACTOR" fades in under it over 3 s (the marginalia idiom). While marked, the glyph fills with ink.
- The label, one line in small caps at The Index's type size (T0104), sits under the start-button row without overlapping the start button or the Warm Start hint line (T0114): "REDACTOR — ERASES THE INK · SHARDS HALF". Build on the menu layout T0114 adds; if it has not landed when this is built, place the line where its description says it lands.
- The cost: while the Redactor is picked, every shard you pick up is worth half XP (rounded down) — normal, gilt (3× before halving) and boss-death shards alike; the XP pops show the halved value. An unpicked run's economy is byte-identical to today.
- The active — Redact: Space (desktop), Y (gamepad), or a 64 px touch button in the bottom-right corner beside the existing touch pause button (12 px gap, not overlapping it or the Inkwell meter; a proper thumb target). Triggering Redact: every enemy bullet within 140 units of the player is erased — each dies in a small flat ink ring at its position (the existing ring FX); every normal enemy and elite within 140 units is slowed to 60% speed for 2.5 s, each flashing pale blue once (100 ms) at the moment of Redact. Bosses and their parts (swatches, arms, the Press's wall and blocks) are never slowed. A retrigger refreshes the slow timer on already-slowed enemies. Enemy bullets are not restored.
- Cooldown: 12 s from each trigger; it burns even if nothing is in range; a trigger during cooldown is rejected. The cooldown is the only new HUD element and it is the button itself: a flat 64 px ink circle with the input's glyph in small caps inside (the letter on desktop, the gamepad button letter on a pad, a small eraser glyph on touch) and a thin (2 px) ink ring around it that drains clockwise from full as the cooldown recovers — full ring means ready. It must sit cleanly in the bottom-right corner at 412x915 and 1280x720, never overlapping the pause button or the Inkwell meter.
- Teaching: while the Redactor is picked, the first second of every run prints a small-caps note in the HUD that fades over 2 s in the nameplate idiom (T0064) — "THE REDACTOR ERASES — SPACE" on desktop, "THE REDACTOR ERASES — Y" on gamepad, "THE REDACTOR ERASES" on touch. The pause controls card (T0123) lists the Redactor's input with the other inputs, but only while the loadout is picked.
- One new SFX: a ~120 ms filtered paper-swipe noise at about half the gain of a hit, on each trigger (the T0109 filtered-noise idiom) — the page being cleaned.
- Redact is only usable while the game is running — not while paused, in a level-up overlay, or in the menu.
- A pure rule module in `src/core/` with unit tests in the underexposure pattern (T0105): the half-XP rounding (including the gilt 3×-then-half case), the cooldown timing, the slow-and-refresh rule, and the 140 u radius membership.
- The upgrade pool and the enemy pool are untouched (no card, no enemy); no new scene; no new keys beyond the one active's.

## Acceptance criteria
- [ ] After the first completed run, the eraser glyph appears beside the start button with the "REDACTOR — ERASES THE INK · SHARDS HALF" label; toggling it persists across a page reload; the "NEW IN THE STUDIO — THE REDACTOR" note plays exactly once.
- [ ] In a picked run, the 64 px ink circle (key glyph inside, 2 px ring) sits in the bottom-right corner on desktop, gamepad and touch without overlapping the pause button or the Inkwell meter at 1280x720 or 412x915; the ring drains clockwise over 12 s from each trigger and is full when ready.
- [ ] Triggering Redact (Space / Y / touch) erases every enemy bullet within 140 u of the player, each in a small flat ink ring, and slows every normal enemy and elite within 140 u to 60% speed for 2.5 s with a one-shot 100 ms pale blue flash; bosses and their parts are unaffected; a trigger during the 12 s cooldown is rejected; a retrigger refreshes existing slows.
- [ ] While the Redactor is picked, every shard pickup is worth half XP (rounded down; a gilt shard is 3× before halving) and the XP pop shows the halved value; an unpicked run's economy is unchanged.
- [ ] At the start of a picked run, "THE REDACTOR ERASES — SPACE" (or the device's own key name) fades over 2 s; the pause controls card lists the Redactor's input only while the loadout is picked.
- [ ] The pure rule module is unit-tested (half-XP rounding including gilt, cooldown timing, slow refresh, radius membership); `npm run check` and `npm run smoke` pass on desktop and mobile.
