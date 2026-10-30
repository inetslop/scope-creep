---
id: T0273
title: "The boss's death: the burst and the name card"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T09:46:01Z
epic: E5
---

## Goal
A boss death is a moment, not a pop: the corpse bursts big in the boss's own color and a card names it where the player is looking — E5's "a boss death is a moment: a big chip burst … and a card that names it". (Re-file of T0258, whose failure was an architect context overflow before any design; the design stands as written, tightened below.)

## Details
- **The trigger (a new enemy hook, the bossEscape / leakEcho / comboBreak pattern — T0269's bossEscape.ts is the closest example, read it first):** a new `src/systems/enemyHooks/bossDeath.ts`, registered in `src/systems/enemyHooks/index.ts` next to bossEscape. It fires on the **kill** of the enemy the current wave's plan declares as its boss — the plan's own boss id (T0269's pure `bossId` in `core/waves.ts` is the single source today; T0259's wave-20 plan will declare the Titan the same way). Data-driven off the plan and the def, never a hard-coded id. A kill, not a leak, not a split: the Orb's half-hp split (T0266) is a transformation, not a death — it must get neither burst nor card; a single hit from over half to zero is an ordinary boss kill and gets both.
- **The burst (FxSystem's own chip burst, T0034's milestone shape):** when a boss dies from any source (a Bolt shot, a Splash burst, a Lance pierce, a Chain leap, a Beam line already holding it, an Ember tick — all of them), its kill burst is **24 chips in the boss's own color** — twice the combo milestone's 12 (T0034) — instead of the normal 6. The kill gold pop (20 on a Colossus or the Orb), the combo counter and the coin slide to the tally (T0061) all play as usual; if the boss kill is also the ×10 milestone kill, the boss's 24-chip burst plays and the milestone's 12 does not.
- **The name card (the shared top-center card, topBanner — the last-stand banner's two-line pattern, T0060; there is no second card system):** slides in from above, holds, fades (~1 s, topBanner's own timing): the boss's name in bold ink over a muted "stopped". The name is read from the boss's def — the second boss (T0259's Titan) shows "Titan" with no change to this hook or card.
- **The collision:** at the moment of death the boss card (T0256) is already fading out (~200 ms) — the name card slides into the same top-center slot as it goes, so the two never hold the slot together for more than the boss card's fade. If the last-stand banner would take the card on the same frame, the boss death takes it (the rarer moment); at most one card at a time, topBanner's rule.
- No sound (the burst and the card are the moment, like the wave's last kill's ring, T0229). No new keys; the pause screen is unchanged.

## Acceptance criteria
- [ ] A boss kill on wave 10, from any damage source including an Ember tick, bursts 24 chips in the boss's own color and slides the two-line card: "Colossus" in bold ink over a muted "stopped", holding ~1 s.
- [ ] The boss's kill gold pop, the combo counter and the coin slide all play as usual with the burst; no other kill in the wave gets the 24-chip burst or the card.
- [ ] A boss kill that is the ×10 milestone kill plays the boss's 24-chip burst only, with the counter turning yellow as usual (T0034).
- [ ] The Orb's half-hp split on wave 30 gets neither burst nor card (the Shards keep walking); a one-shot kill of the Orb from over half health gets the 24-chip burst and the "Orb" card.
- [ ] Kills on non-boss waves are byte-identical to today: the normal burst, no card.
- [ ] A boss kill does not break the kill-combo chain (it is an ordinary kill for the combo, T0031).
- [ ] If the last-stand banner would show on the same frame, the boss death card takes the top-center card; at most one card at a time.
- [ ] The card fits at 412x915 and 1280x720 without overlapping the stats card (top left) or the wave card / pause button (top right).
