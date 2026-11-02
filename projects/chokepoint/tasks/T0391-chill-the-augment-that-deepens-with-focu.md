---
id: T0391
title: "Chill: the augment that deepens with focus"
size: M
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T00:02:34Z
claimed_at: 2026-11-02T00:29:37Z
designer: desktop
---

## Goal
The pool is about to lose every slow and root (Frost and Anchor retire with the 16-cap churn), which would leave the game no way to slow a fast enemy at all (Sprinter 2.52 cells/s, the Dasher's dash, the Flyer at 2.0). Chill is a new pool augment whose slow is not flat but stacked: the harder the player keeps hitting the same enemy, the slower it gets — focus fire deepens it, spread fire doesn't.

## Details
A pool card (Common/Rare/Epic, `opening: true` so it can be offered in the pre-wave-1 draft, no tech gate, no minTier). As a tower it is a `shot` at the enemy furthest along whose hits add **chill stacks** to that enemy; added to any tower, its hits add stacks too.

- **The stack rule (one pure module, the `core/burn.ts` pattern):** an enemy carries up to **5 chill stacks**; each stack slows it **10%**; each hit that adds a stack refreshes the whole stack set for **2.0 s** from that hit (when the timer expires, all stacks fade at once). Stacks are **not** subject to the control fatigue (T0301 covers pushes and roots only). The chill slow adds to other slows; the enemy's total slow caps at **75%**. The Ward ignores the chill (its own `ignoresControl` covers it; its immunity ring shows when a stack is refused, T0335's pattern).
- **The stack shows where a slow already shows** — no new mark, chip or number on the enemy: the depth is read in the enemy's speed, the way Frost's slow reads today.
- **The Flyer:** a chilled Flyer flies slower — the slow applies to the enemy's speed, the fly route is untouched. The sky can be slowed, not just shot.
- **Per attack kind (the added form, one line per kind):** a shot's hit adds the copies' stacks; each pellet of a Spray that lands adds them (a 5-pellet burst can reach the 5-stack cap in one shot); a Beam line adds them while it holds the enemy, once per 0.25 s tick (T0132's beam-carries-hits pattern); a burn's tick adds them (a tick is a hit, T0281); a pulse's hit adds them to each enemy it hits; on a support-first tower (Rally, Haste, Mint, Toll, Mark — and the pending Mend, Feast, Herd) it never lands, because the tower never hits — the slot is spent the same way an added Frost is there.
- **Look:** icon shape **circle**, color **ice**, size 0.21 (Frost is the diamond/ice; this pair is free). On the tower: a small flat ice disc on the muzzle of the barrel (the Beam orb's flat-disc language) and **one thin tick per extra Chill copy** on the disc's edge. The what-if ghost (T0096) wears its own compact marker (a small ice disc, the ghost's marker language).
- **Registration and the 16-cap:** the task registers Chill and **retires Toll** — after Chill is registered, if the pool is over 16, remove Toll from the index (delete its content file, index entry, the `goldPerLeak` spec field and its leak-pay path, and its leak hook with its blip, T0255). No other pending registration names Toll (the five in flight name Frost, Rally, Mint, Mark, Anchor), so the removal is order-independent with all of them. The leak itself is untouched: it still costs lives (and the Hauler's 5 gold). The codex, hand, panel, draft fit row and coins reference read the pool and pick the change up with no screen work.

**Card lines (exact, per tier):**
- asTower: Common "Shoots the enemy furthest along: 8 damage every 0.8 s. Each hit adds a chill stack: 10% slow, up to 5 stacks (50%)." · Rare "…Each hit adds 2 chill stacks: 10% slow each, up to 5 (50%)." · Epic "…Each hit adds 3 chill stacks: 10% slow each, up to 5 (50%)."
- asAdded: Common "Hits add a chill stack: 10% slow for 2 s, up to 5 stacks (50%) on an enemy." · Rare "Hits add 2 chill stacks: 10% slow each, for 2 s, up to 5 (50%)." · Epic "Hits add 3 chill stacks: 10% slow each, for 2 s, up to 5 (50%)."
- One-line description: "Shoots the enemy furthest along: each hit adds a chill stack — 10% slow per stack, up to five. Added: hits add stacks."

First-form numbers: damage 8, range 2.4, rate 1.25 (every 0.8 s), projectileSpeed 12 (a homing shot, the Bolt class).

## Compared with what exists

| Existing | What it shares | What the new one does that it can't (not numbers) |
| --- | --- | --- |
| Bolt | `kind shot`, shoots the furthest | Bolt's hit only deals damage; a Chill hit also adds a slow stack that deepens the more the same enemy is hit — Bolt has no slow at all |
| Lance | `kind shot`, a straight line | Lance's shot keeps going through the line; a Chill shot stays on one enemy and deepens its slow, and never passes through |
| Rapid | `kind shot`, hits often | Rapid's added form trades damage for hit rate (a DPS call); a Chill hit is small damage that adds stacks — together, Rapid's rate feeds more stacks per second onto the focused target |
| Reach | `kind shot`, the sniper | Reach stretches the range and the hit; a Chill hit is short and light and its power is not the hit at all — it holds the near road, it never snipes |
| Frost | added `slow` (hits slow 40%) | Frost's slow is flat per application — the same 40% whether one tower or five keep hitting; a Chill slow is stacked: 10% per hit, refreshed while the hits continue, up to 5 — the more a build concentrates, the deeper that one enemy's slow |
| Anchor | control (root) | Anchor's root is a binary stop (0.75 s, fatigued, then shrugged off); a Chill stack is partial and continuous (up to 50% while the hits keep coming) — it never fully stops, and never fully wears off while the focus holds |
| Push | control (moves enemies) | Push shoves the enemy back along the road in a gust (a burst, fatigued); a Chill stack slows it in place (continuous, not fatigued) |
| Haste | changes enemy speed in a ring | Haste speeds the enemy up (a risk traded for tower rate, on everything in the ring); a Chill slows it per hit, on the one enemy the player keeps aiming at |

## Acceptance criteria
- [ ] Chill offers in the draft as a pool card (Common/Rare/Epic, the first-draft Bolt floor untouched) and shows in the codex with the card lines above; after registration the pool is 17 and **Toll is removed** in the same registration if still present (codex, panel, hand and fit row show Toll's line gone and Chill's present)
- [ ] A Chill-first tower shoots a homing bolt in Chill's ice color, 8 damage every 0.8 s, range 2.4; each hit adds 1/2/3 stacks by tier; a chilled enemy walks 10% slower per stack up to 5 (50%), the whole set fading 2.0 s after the last hit that added stacks
- [ ] Added Chill on a Bolt/Splash/Rapid/Reach/Beam/Ember/Spray tower: hits add stacks per the per-kind lines (a beam holds the stacks through its ticks; spray pellets each add; a support-first tower with Chill shows the ghost marker but never applies one)
- [ ] The Ward ignores the chill (its immunity ring plays when a stack is refused); the control fatigue does not touch stacks; total slow caps at 75% with other slows; no new mark or chip appears on any enemy
- [ ] A chilled regular Flyer flies slower along its unchanged route; the wave-50 boss Flyer slows the same way its speed is slowed
- [ ] The Chill tower wears the ice disc (one tick per extra copy); tier pips, tier word, draft flip/chime, what-if marker and resume all carry the new augment like the others
- [ ] A new pure module carries the stack rule (apply/refresh/fade, the cap, the fatigue exemption) with unit tests; the content entry passes the content bar in tests; `npm run check` and the desktop + mobile smoke pass
