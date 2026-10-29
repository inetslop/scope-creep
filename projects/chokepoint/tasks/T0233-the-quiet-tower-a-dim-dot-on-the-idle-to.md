---
id: T0233
title: "The quiet tower: a dim dot on the idle tower"
size: S
priority: 1
status: designing
depends_on: []
attempts: 0
created: 2026-10-29T22:31:19Z
claimed_at: 2026-10-29T22:32:10Z
designer: yoga
---

## Goal
A tower that has work to do but nothing in range says so: a first-time player stops wondering whether a silent tower is broken, and nothing changes about how the game plays.

## Details
- During a wave, an **attack-first tower** (a tower whose first form fires or acts on a cadence: shot, spray, pulse, burn, mark, beam or trap) shows one small muted-gray dot (radius ~3 px, the HUD's own muted ink) centered just above its token while both hold: at least one enemy is alive on the road, and the tower has had no attack event for **4 s or more**.
- An **attack event** is the tower doing its thing: a shot fired, a pulse landing (splash, slow, root or gust), a burn or mark applied, a beam holding an enemy (a beam counts as firing continuously while it holds one; holding no enemy is idle), a trap disc laid.
- The dot fades in over ~200 ms and is cleared (a ~150 ms fade) the moment the tower next has an attack event. It is never shown in the build phase, and never while the road has no enemy alive.
- **Pure-passive first forms never dot**: Mint, Rally and the other supports whose first form has no on-board action of its own (Haste, Momentum, Mend, and Toll when it lands) show no dot, ever.
- The dot rides on the tower token (well clear of the tier pips on the plinth and the what-if ghost on the slots — T0096), not on a cell: no board mark, no cell decoration.
- Why the screen has room for it (one in, one out): it replaces the player's private guessing about a dead tower. It is a 6 px dot that exists only while a tower is idle and disappears the instant the tower works; nothing on screen shows tower idleness today (the panel's kills line is a run total, the working-aura ring T0055 shows supports *working*, not towers standing idle). It matters from wave 1 and matters more when E5's boss goes untargetable (every tower idles on purpose and the dot says why).
- Display only: derived live each frame, nothing saved, a resumed run behaves identically from its next wave; no sound, no input, no card, no pause-screen line.

## Acceptance criteria
- [ ] In a wave, a Bolt tower with no enemy in range shows a small muted-gray dot above its token ~4 s after its last shot; a Bolt tower with an enemy in range never does.
- [ ] The moment the tower next fires (or a beam grabs its target, or a support pulse lands), the dot is gone within ~150 ms.
- [ ] In the build phase and on an empty road, no tower shows the dot.
- [ ] Passive-first towers (Mint, Rally and the other no-attack supports) never show the dot; a slow-cadence pulse tower (Anchor, 3 s) never flickers one.
- [ ] The dot sits on the token, clear of the tier pips and the what-if ghost; no board cell gains any mark; no sound, input or HUD change; works at 412x915 and 1280x720.
