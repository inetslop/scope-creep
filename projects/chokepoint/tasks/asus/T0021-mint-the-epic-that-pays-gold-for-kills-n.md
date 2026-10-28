---
id: T0021
title: "Mint: the Epic that pays gold for kills near it"
assignee: asus
size: L
priority: 3
status: design
depends_on: [T0020]
attempts: 0
created: 2026-10-28T04:43:01Z
epic: E4
---

## Goal
The draft's third rule-changing Epic: a tower that turns kills into extra gold, so where you build becomes an economy decision, not just a combat one — a chokepoint where your towers do most of the killing now pays for itself.

## Details
- New augment, Epic-only (never rolled Common or Rare), reusing the Epic-only flag that Mark (T0012) introduces.
- **Not offered in the opening draft** (like Rally, T0020): the opening offers only attacking augments, so the first tower always attacks.
- **Closest existing augment:** Frost — both are support augments with no attack of their own. What is new: Frost changes enemies (it slows them), while Mint changes the economy (kills pay more gold), which no current augment touches.
- **As a tower's first augment (support role):** the tower does not attack. Every enemy killed within 2 cells of a Mint tower (a 5x5 square, Chebyshev distance <= 2, like Rally) drops **+1 extra gold** on top of its normal kill gold.
- **When added to a tower:** that tower's own kills drop **+1 extra gold**. Only killing towers (Bolt, Rapid, Reach, Splash) earn it; a Frost or Rally tower with Mint added earns nothing extra from its own hits, because it does not kill.
- Copies stack: two Mints in one tower make its kills drop +2; a Mint-added Bolt inside another Mint tower's 2-cell radius earns both, +2 on the same kill.
- **Look on the tower:** body color yellow (gold's color; if another augment already uses yellow, the nearest bright unused color), and a small coin disc (about 10 px, styled like the HUD's coin icon: a flat circle with a darker side face) riding on the side of the tower's base. The disc always contrasts the body color and is the first thing that says "gold" at a glance.
- The extra gold shows in the existing gold pop where the kill happens (the pop's number is just bigger by 1). No new HUD element, no new input, no new sound.
- **Card lines (the card is always Epic; no Common/Rare values exist):**
  - First: "Kills within 2 cells drop +1 gold. Does not attack."
  - Added: "This tower's kills drop +1 gold."
- **Values:** +1 gold per kill per Mint copy; aura radius 2 cells (5x5 square). No other numbers.

## Acceptance criteria
- [ ] The draft can roll Mint, only as an Epic card (Epic frame and gem row); it never appears as Common or Rare, and never in the opening draft.
- [ ] A tower built with Mint first shows the coin disc and never fires at enemies; an enemy killed within its 2 cells drops +1 more gold than the same kill with the tower absent (the gold pop shows the extra).
- [ ] An enemy killed 3 or more cells away from the Mint tower drops the normal kill gold.
- [ ] A Bolt tower with Mint added drops +1 more gold per kill of its own; a Frost tower with Mint added drops none extra.
- [ ] Two Mints in one tower make that tower's kills drop +2; a Mint-added Bolt inside a Mint tower's 2 cells earns +2 on one kill.
- [ ] The tower panel shows Mint's card lines like the other augments, and the coin disc is visible on the tower at 1x zoom at 412x915 and 1280x720.
- [ ] The game remains playable and readable for a first-time player: the coin disc and the bigger gold pop say what Mint does without reading the card.
