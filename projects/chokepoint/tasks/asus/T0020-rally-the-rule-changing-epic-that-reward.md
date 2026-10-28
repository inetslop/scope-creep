---
id: T0020
title: "Rally: the rule-changing Epic that rewards clusters"
assignee: asus
size: L
priority: 3
status: design
depends_on: [T0012]
attempts: 0
created: 2026-10-28T04:12:01Z
epic: E4
---

## Goal
The draft can roll a second rule-changing Epic augment, Rally, that makes one tower change another: clusters of towers attack faster. It is the first augment whose effect is on other towers, and it rewards building in tight groups beside the road.

## Details
- **Rally is Epic-only.** It never comes as Common or Rare; it can only be rolled as Epic, reusing the Epic-only flag that Mark (T0012) introduces.
- **Closest existing augment:** Frost. Both are support augments with no attack of their own — but Frost changes enemies (it slows them), while Rally changes other towers (a tower-to-tower interaction no current augment has).
- **As a tower's first augment (support role):** the tower does not attack. It radiates a rally: every other tower within 2 cells (a 5x5 square, Chebyshev distance <= 2) attacks 10% faster. The buff is flat and does not stack — a tower in range of several Rally towers still gains only 10%.
- **When added to a tower:** the tower keeps its attack and joins its own rally — it gains the +10% attack speed itself while still granting +10% to the other towers within 2 cells.
- **Show on the tower:** a Rally tower is a taller teal chunky rounded beacon (a pillar with a rounded cap), clearly distinct from the short, fat shapes of the attacking towers. While at least one other tower is within 2 cells, a soft teal ring pulses out to the 2-cell radius once per second. Every buffed tower shows a small yellow up-chevron tick floating just above it.
- **Values:** range 2 cells; +10% attack speed; does not stack; the pulse ring and the chevron are the only visual effects.
- **Card lines (draft):**
  - First: "Towers within 2 cells attack 10% faster. Does not attack itself."
  - Added: "Joins its own rally: this tower also attacks 10% faster."
- **Discoverability:** no new keys or buttons. The pulsing ring shows the range and the chevron shows exactly which towers are sped up, so a first-time player can read what Rally is doing on the board.

## Acceptance criteria
- [ ] The draft can roll Rally, only as an Epic card (Epic frame and gem row); it never appears as Common or Rare.
- [ ] A tower built with Rally first is the teal beacon and never fires at enemies.
- [ ] A lone Rally tower shows no ring; once another tower is built within 2 cells, the teal ring starts pulsing and that tower gets the yellow chevron.
- [ ] A buffed tower attacks 10% faster (its shots land 10% more often over a short window) and shows the chevron.
- [ ] A tower 3 or more cells away from the Rally tower gets no chevron and no speed change.
- [ ] Adding Rally to an existing attacking tower keeps that tower's attack, gives it the chevron, and still buffs the other towers within 2 cells.
- [ ] A tower within 2 cells of two different Rally towers gains only +10% (the buff does not stack).
- [ ] The game remains playable and readable for a first-time player: the ring and chevron show what Rally does without reading the card.
