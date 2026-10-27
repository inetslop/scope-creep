---
id: T0093
title: Weapon SFX timbres — Point, Line and Arc sound like themselves
assignee: yoga
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-10-27T08:45:39Z
claimed_at: 2026-10-27T08:52:03Z
designer: yoga
---

## Goal
Each firing weapon should sound like itself — Point a short high tick, Line a low thud, Arc a sharp snap — so the player can hear which weapon the run is built around without looking.

## Details
- In `src/audio/Sfx.ts` (T0003 — all SFX are synthesized from oscillators and gain envelopes, no audio files), give the three firing weapons distinct shoot timbres in the existing synthesis style:
  - Point: a short high tick — a brief, high-pitched blip, clearly higher than today's shared shoot sound.
  - Line: a low thud — a low, dull, brief knock.
  - Arc: a sharp snap — a very short, bright, percussive snap, distinct from the Point tick (crisper, or with a quick pitch drop).
- Firing the three weapons in sequence should give three clearly distinguishable sounds. Keep the existing gain/envelope discipline so rapid fire does not clip (the current shoot sound already throttles — preserve that behavior).
- Route the timbre by weapon at the shoot call site (the weapon system knows which weapon fired), so all three weapons get their own sound everywhere. If a new firing weapon (the Counterpoint wall-bounce, T0055, queued on desktop-4070) has landed before this task, include it with a mid-range woody knock; otherwise leave it to a follow-up.
- The Orbit weapon's contact-hit sound and every other SFX (hit, enemy death, pickup, player hurt, level up, boss sting) are unchanged.
- No new file, no content, no scene change.

## Acceptance criteria
- [ ] Firing the Point plays a short high tick, the Line a low thud and the Arc a sharp snap — three distinct sounds when fired in sequence, on desktop and mobile.
- [ ] The Orbit contact-hit sound and all other SFX are unchanged.
- [ ] Rapid fire stays within today's audio discipline (no new clipping or overlap beyond current behavior).
