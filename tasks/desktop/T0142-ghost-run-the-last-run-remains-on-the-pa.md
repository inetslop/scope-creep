---
id: T0142
title: Ghost run — the last run remains on the page
assignee: desktop
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T20:19:39Z
---

## Goal
Every run carries a ghost: a faint pencil outline tracing where your last run's circle actually was, in sync with the run clock. You race your own last performance, and the moment you outlive it is marked with a "PAST YOU" flash while the ghost holds at the spot where you died.

## Details
- At the moment a normal run ends (the game-over moment), the run's player path is saved: the player's center sampled every **150 ms** of the run clock (positions rounded to integers, first sample at 0:00), plus the run's total survival time. The save **replaces** the previous one and persists in localStorage (the bestScore pattern, its own key), so it survives a page reload. A run that never reaches game over saves nothing.
- The record is capped at **20:00** (13,333 samples); a longer run saves the first 20:00 and the true survival time, so the flash can still fire past the cap.
- The next run draws the ghost: a flat **pencil-grey circle** — the same grey as the Underdrawing stroke (T0100), **2 u stroke, no fill, no eye, no shadow**, at **50% alpha**, the player's base radius (no build rings, T0131, no swell) — drawn under the entities on the layer the puddles and ink trails use (T0111/T0126). It starts at the first sample at 0:00 and replays the path in sync with the run clock, linearly interpolated between samples.
- The ghost is a memory, not a shape: no hitbox — it deals no damage, takes no damage, is not targetable, is not pushed, and is ignored in both directions by enemy steering, bullets, weapons, hazards and shards. It is drawn on the paper, so Crop (T0045) and Tide (T0127) need no special-casing — an old position in a shrunken margin is just memory on the page.
- The moment the run clock **strictly passes** the saved survival time, once: a small-caps **"PAST YOU"** note prints in the HUD for 2 s (the nameplate idiom, T0064), and the ghost stops moving and **holds at its last position** for the rest of the run — the place you died last time stays on the page.
- Teaching: the first run in which a ghost appears, a run-start note **"THE LAST RUN REMAINS"** prints for 2 s (the nameplate idiom, T0064, the way Warm Start's does, T0114); a persisted flag (bestScore pattern) keeps it to once per player.
- A run with no saved path yet (the first run ever) has no ghost. When the Gallery studies (T0129) land, study runs neither record nor show a ghost — studies have their own rules and their paths are not comparable; until then every run is a normal run.
- Purely visual: no new key, sound, HUD element (beyond the two notes) or scene; no stat, spawn, hazard, weapon, clock or music change.
- A new **pure module in `src/core/`** (the crop/rest pattern) owns: the recorder buffer (150 ms sampling against the run clock, the 20:00 cap), the compact encode/decode of the saved path (integer positions; a full 20:00 record stays in the low tens of KB), and the replay rules (sample index + linear interpolation, the hold at the last sample after the survival time, the single outlived crossing). Unit tests lock: encode/decode round-trips; the replayed position is continuous across sample boundaries; the crossing fires exactly once at the survival time and never again; a 20:00+ record caps at 13,333 samples while the crossing still uses the true survival time; a missing path replays nothing.

## Acceptance criteria
- [ ] The first run in a fresh profile shows no ghost; after that run ends, the next run shows a faint grey circle (2 u stroke, no fill, no shadow, 50% alpha) tracing the previous run's path in sync with the run clock.
- [ ] The ghost and everything pass through each other: enemies, bullets, weapons, hazards and shards ignore it, and it affects none of them.
- [ ] The moment the clock passes the previous run's survival time, "PAST YOU" prints in small caps for 2 s (once per run) and the ghost holds still at its last position for the rest of the run.
- [ ] The first run that contains a ghost prints "THE LAST RUN REMAINS" at run start for 2 s, and never again.
- [ ] The saved path survives a page reload and each ended run replaces it with its own.
- [ ] No new key, sound, HUD element beyond the two notes, or scene; the full gate (typecheck, lint, unit tests, desktop + mobile smoke) passes.
