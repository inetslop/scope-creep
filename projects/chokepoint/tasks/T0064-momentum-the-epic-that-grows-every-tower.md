---
id: T0064
title: "Momentum: the Epic that grows every tower on a clean wave"
size: L
priority: 3
status: designing
depends_on: [T0025]
attempts: 0
created: 2026-10-28T13:54:28Z
claimed_at: 2026-10-28T14:58:20Z
epic: E4
designer: desktop
---

## Goal
A run that holds the line grows: each clean wave makes every tower stronger. The fourth rule-changing Epic — the first whose power comes from how the run went, not from what is on the board.

## Details
- **Rolls only as an Epic card**, the same Epic-only roll as Mark, Rally and Mint (T0012, T0020, T0021). The draft's odds line and tier chime cover it with no change.
- **Card lines** (both forms, with their numbers):
  - First (a tower with no attack of its own, a support like Rally and Mint): "Each clean wave: every tower deals +5% more damage (for the run)."
  - Added: "Each clean wave: +5% more damage per Momentum."
- **The rule:** at the end of every clean wave (zero leaks — the same clean wave the chip T0005, the streak T0045 and the rewards line T0033 use), the run's momentum bonus grows by 5% × (the total number of Momentum copies on the board at that moment), and it stays for the rest of the run. The bonus multiplies every damage a tower deals (shots, Lance pierce, Beam per-second, Ember ticks, Trap springs, Ricochet bounces); slows, roots, marks and gold are untouched.
- **Stacking:** the bonus is additive per copy — two Momentum copies mean each clean wave adds +10%. No cap. A later leak never takes the bonus back. A tower built after a clean wave is at the bonus from its very first shot.
- **Look on the tower:** a tower with Momentum is a low wide yellow disc (a flattened standard token, roughly 40% of a normal token's height, sitting on the plinth) with one thin notch cut into its front face per Momentum copy — the tick language the other augments use.
- **Readable:**
  - The tower panel gains one small line while the bonus is above 0: "Bonus +N%" (N is the run's total bonus — the same number on every Momentum tower; no line at 0).
  - The moment a clean wave grants the bonus, a small muted-yellow "+N%" pop rises from each Momentum tower (the same pop motion as the kill-gold pop), N being what that wave just added.
- **Closest existing augment:** Mint (a passive Epic aura that never attacks). New: it changes damage instead of gold, and it grows from wave results — the first augment whose power comes from how the run went, not from what is on the board.

## Acceptance criteria
- [ ] The draft offers Momentum only as an Epic card (Epic frame, gem row, "· Epic" name line, tier chime); the odds line is unchanged.
- [ ] A first-time player reading the card lines learns both rules: a clean wave makes every tower deal +5% more, and each extra Momentum adds +5% per clean wave.
- [ ] After the first clean wave with one Momentum on the board, every tower deals 1.05× its previous damage (same tower, same target, same tier), the panel shows "Bonus +5%", and a muted-yellow "+5%" pop plays from the Momentum tower.
- [ ] With two Momentum copies the next clean wave adds +10% (total +15%), and the pop reads "+10%".
- [ ] A wave with any leak grants nothing; the bonus persists through a later leak; a tower built after a clean wave is at the bonus from its first shot.
- [ ] A Momentum tower shows the low wide yellow disc with one notch per copy; its slot pip is Epic purple as usual.
- [ ] Gold, lives, the clean streak (T0045) and the coin formula are unchanged by this task.
