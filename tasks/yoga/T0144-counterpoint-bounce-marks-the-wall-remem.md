---
id: T0144
title: Counterpoint bounce marks — the wall remembers the bounce
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T21:17:36Z
claimed_at: 2026-10-27T21:33:44Z
designer: yoga
---

## Goal
The Counterpoint (T0055) ricochets off the arena walls, but the bounce is only felt in the shot's path. Each wall bounce prints a small ink × at the contact point, so the wall remembers where the point came off it — and a first-time player learns to aim bounces by seeing where they land.

## Details
- Every time a Counterpoint projectile bounces off an arena wall (up to 2 per shot, per T0055), a small flat ink × prints at the contact point — the platemark × (T0094) in size and stroke weight, but ink (not red) and at the wall instead of the player.
- Each mark fades linearly over 2 s and is pooled exactly like the platemark (at most ~16 live marks, oldest recycled), so sustained play never grows unbounded draw work.
- Marks are drawn on the paper, under the entities — so the crop-safe boundary (Crop, T0045) and the breathing edge (Tide, T0127) need no special-casing; a mark lands wherever the bounce already happens today.
- Only Counterpoint shots leave marks — no other weapon (Point, Line, Arc, Orbit, the Plumb), no enemy shot and no boss part. A shot that bounces twice leaves two marks (one per bounce); a shot that never bounces leaves none.
- No sound, key, HUD element, scene or gameplay number change.

## Acceptance criteria
- [ ] A Counterpoint shot that hits a wall leaves a small flat ink × at the contact point that fades over ~2 s; a shot that bounces twice leaves two marks, and a shot that never bounces leaves none.
- [ ] The mark matches the platemark × (T0094) in size and stroke weight, and is ink, not red.
- [ ] Marks are pooled (bounded draw work in sustained play) and sit on the paper under the entities.
- [ ] No other projectile kind (Point, Line, Arc, enemy shots, boss parts) leaves a mark.
- [ ] No new sound, key, HUD element, scene or gameplay number change.
