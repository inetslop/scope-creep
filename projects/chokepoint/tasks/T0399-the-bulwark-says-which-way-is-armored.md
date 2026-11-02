---
id: T0399
title: The Bulwark says which way is armored
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T03:05:38Z
claimed_at: 2026-11-02T03:06:14Z
designer: yoga
---

## Goal
The Bulwark's plate halves shots from the front and lets the back go through — but the token only shows a plate, not the rule. A first-time player wastes damage on the face without knowing it is directional. One quiet teach at the first Bulwark states the directional rule the look does not carry.

## Details
- Once per run, at the first Bulwark's spawn, one small muted line fades in just below the token for ~1.5 s and fades out: "front is halved" — the directional rule (front shots take half, back shots go full), which the plate's look does not state.
- It lands after the name tag's own ~1.5 s (T0085) so the two never overlap: the name chip is above the token, this line is a few px below it. Muted ink, the name tag's own small type. No sound, no new permanent mark — it fades and is gone.
- It reads the spawn the same way the name tag does (the once-per-type-per-run spawn hook, T0085's pattern): only the first Bulwark of the run shows it. A resumed run does not re-show it (the name tag's own once-per-run rule).
- No new key, button, HUD element or board mark; the pause screen is untouched.

## Acceptance criteria
- [ ] The first Bulwark to spawn in a run shows one muted "front is halved" line below it for ~1.5 s (after the name tag), then it is gone; later Bulwarks and the next run never show it
- [ ] The line sits below the token and does not overlap the name chip above it; it fits at 412x915 and 1280x720
- [ ] No sound, no persistent mark, no new key/button/HUD element; `npm run check` and the desktop + mobile smoke pass
