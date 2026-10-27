---
id: T0133
title: Haptics on mobile
assignee: narcissus
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T19:10:00Z
claimed_at: 2026-10-27T18:00:56Z
designer: yoga
---

## Goal
On a phone, the big moments are felt in the hand: a short buzz when you take a hit, a double tap when you pick a level-up card, a long low buzz when a boss lands. Touch players lose the screen shake under their thumbs; this gives it back.

## Details
- New `src/audio/Haptics.ts`: a small class with `hit()`, `levelUp()` and `boss()`, each one `navigator.vibrate(...)` call. Patterns: hit `30`, level-up `[20, 40, 20]`, boss `120`.
- It follows the existing mute: no vibration while the game is muted. Read the mute the same way `src/audio/Sfx.ts` does, so the M key and the pause-screen mute silence both sound and haptics.
- Guard every call: do nothing when `navigator.vibrate` is missing (desktop Safari, Firefox desktop, the headless smoke browser) and swallow any exception. Throttle `hit()` to at most one buzz every 150 ms so a swarm doesn't buzz continuously.
- Call sites: the player taking damage (where the Platemark from T0094 is printed), a level-up card being picked (where the level-up pulse from T0102 starts), and the boss landing (next to `this.sfx.bossSting()` in `src/systems/BossSystem.ts`).
- No new UI, no new setting.

## Acceptance criteria
- [ ] `src/audio/Haptics.ts` exists with `hit()`, `levelUp()` and `boss()` using exactly the patterns above
- [ ] Muted → no `navigator.vibrate` calls; missing `navigator.vibrate` → no errors
- [ ] `hit()` buzzes at most once per 150 ms
- [ ] A unit test covers the mute gate, the missing-API case and the throttle (stub `navigator.vibrate`)
- [ ] `npm run check` and `npm run smoke` pass
