---
id: T0066
title: "Combo gold: quick kills pay extra"
size: S
priority: 3
status: design
depends_on: [T0039, T0054]
attempts: 0
created: 2026-10-28T13:54:28Z
epic: E1
---

## Goal
The kill-combo milestone (T0034) pays back in gold: a chain that reaches ×5 pays +2 gold and a chain that reaches ×10 pays +4 — quick kills are worth more than slow ones.

## Details
- **The rule:** when the kill-combo chain (T0031) reaches exactly ×5, that fifth kill pays 2 extra gold; when it reaches exactly ×10, that tenth kill pays 4 extra gold. The extra is normal run gold — it buys slots like any gold — and it lands at the moment of the kill.
- **The look:** the extra shows as its own small gold pop at the kill spot (the same small pop as Mint's "+1", T0039) about 100 ms after the normal kill-gold pop; the normal pop and its number are unchanged.
- **Once per chain per milestone:** a chain that passes ×10 keeps the yellow chain color (T0034) but pays no more combo gold — only the fifth and the tenth kill of a chain pay. A broken chain (T0031's 1.5 s rule) that rebuilds pays again on the new chain's fifth kill.
- **Last stand interaction:** while last stand (T0054) is on, combo gold is not doubled — it pays on top of the doubled kill gold, exactly like Mint's +1.
- **No coin:** the kill-gold trail (T0061) covers normal kill gold only; combo gold gets its pop, not a coin.

## Acceptance criteria
- [ ] The fifth kill of a chain pops a small "+2" gold at the kill spot ~100 ms after the normal kill-gold pop, and the tenth pops "+4"; kills 1–4, 6–9 and 11+ pop nothing extra.
- [ ] The extra gold lands in the HUD's gold tally (+2 / +4) and can buy slots like any gold.
- [ ] With last stand on, a ×5 kill shows the doubled kill-gold pop and the separate "+2" pop, and the tally gains both.
- [ ] A chain that breaks and rebuilds pays ×5 gold again on the new chain's fifth kill.
- [ ] The coin formula (T0001), the score, "stopped" and the rewards card are unchanged; works at 412x915 and 1280x720.
