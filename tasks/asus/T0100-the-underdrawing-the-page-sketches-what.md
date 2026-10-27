---
id: T0100
title: The Underdrawing — the page sketches what is coming
assignee: asus
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-27T10:32:47Z
---

## Goal
After 8:00 the page warns of what is coming: about 1.5 s before a normal enemy spawns, a faint grey pencil outline of its shape is sketched at the spawn point and fades as the enemy lands — the dense late-run swarm stays legible, and you can see what is arriving and where, instead of shapes popping into existence on top of you.

## Details
- From 8:00 (480 s) of a run onward, every normal enemy the spawn director is about to place — Wedge, Dart, Block, Sentry, Splitter, and anything that joins later (e.g. the Platen, T0091) — is announced by a sketch: a flat grey "pencil" outline (2 u stroke, PALETTE pencil-grey, no fill, no eye, no shadow, no paper-cut) of that enemy's shape, at the size it will actually appear — elites are announced at their 1.8× scale (T0005).
- The sketch is drawn at T−1.5 s, at the exact spot the enemy will occupy, and fades linearly to zero by the moment the enemy appears — it never lingers over a live enemy and never moves (it stays where it was sketched).
- Bosses get no underdrawing — they keep their own warning and nameplate (T0070, T0064). Elite enemies do get one.
- The director must preview, not guess: it has to be able to report what it is about to spawn and where, for the next ~1.5 s, without changing what, when or where anything actually spawns. The real spawn schedule stays identical — the spawn-unlock tests (T0030) and elite-schedule tests (T0066) must stay green.
- If a previewed spawn never materializes (spawn cap, scene change), its outline simply fades out with no enemy appearing.
- No gameplay effect: outlines deal no damage, have no hitbox, attract or repel nothing, and block no input. Pure legibility, rendered below the gameplay art (nearest examples: the marginalia paper layer from T0027 and the platemark ×s from T0094).
- The 8:00 gate is a single named constant; before it, the game looks exactly as it does today. Desktop and mobile are identical — it is rendering tied to the same spawn events.

## Acceptance criteria
- [ ] Before 8:00 no underdrawing is ever visible; the early game looks exactly as it does today.
- [ ] After 8:00, ~1.5 s before a normal enemy appears, a faint grey pencil outline of its shape is sketched at its exact spawn point and is fully faded by the moment the enemy lands.
- [ ] Elites are announced at their 1.8× scale; bosses are never underdrawn.
- [ ] Outlines deal no damage, have no hitbox, attract no enemies and block no input; the real spawn schedule is unchanged and the T0030/T0066 tests stay green.
- [ ] A previewed spawn that never materializes leaves an outline that fades out with no enemy appearing.
- [ ] `npm run check` and `npm run smoke` pass.
