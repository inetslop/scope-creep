---
id: T0256
title: "The boss card: the Colossus's health and phase, pinned to the top edge"
size: M
priority: 2
status: designing
depends_on: [T0253]
attempts: 0
created: 2026-10-30T04:48:47Z
claimed_at: 2026-10-30T05:08:47Z
epic: E5
designer: cachyos-x8664
---

## Goal
The run's peak is readable from anywhere on the board: while the Colossus (T0253) is alive, a small white card pinned to the top edge carries its token, its name and its health — with a notch at 50% where it goes out of reach, and the card itself dimming through each untargetable beat, so the phase is read on the card before it happens. (E5's "when done": "under its own health bar (a small white card pinned to the top edge, counting down as it is hit)".)

## Details
- **The card (a new HUD part, the WaveCard / NextWavePreview pattern):** one white rounded card, pinned top-center at the top edge — below the wave banner's slide (the banner's ~1 s slide above it at wave start plays as usual; at most one banner at a time is unchanged). It pops in with a ~200 ms scale-in the moment the Colossus spawns and fades out over ~200 ms the moment it dies or leaks. It blocks nothing and takes no input.
- **Its contents, in order:** the Colossus's on-board token at the preview's ~16 px size (its purple square), "Colossus" in bold ink, and a thin hp bar — a ~160×6 px rounded fill in the Colossus's own purple over a ~20%-alpha muted-ink track (the ComboBar's track language) — with one small notch (a 2 px tick) at the 50% mark. The bar carries no number; it is the only boss readout, and the notch is where the phase starts.
- **The bar is live:** it holds the Colossus's current hp (the same value its on-board bar shows) and drains as it is hit.
- **The phase is on the card:** while the Colossus is in its untargetable leg (T0253: 2.5 s out, every 8 s from its first drop to 50%), the token and the bar dim to 50% alpha — the same 50% as the board's token — and return to full for the rest of the 8 s cycle. The dim is the phase read at a distance: the notch says where it starts, the dim says that it is on.
- **Data-driven off the boss's def** (the way the enemies reference is off the enemy content, T0252): the token, the name and the notch's position (its `outOfReach.hpFrac`) come from the def — the second boss (E5's later slice) shows here with no change to this file. One boss on the board at a time (the boss wave sends exactly one, T0253), so the card is one.
- **Why the screen has room:** the on-board bar over a 0.45-size token is unreadable at a distance and says nothing about the phase; the card is the first place the boss's name, its 50% trigger and its dim cycle are seen together, and nothing else on screen shows them (E5's "when done" names this card). No new keys; the pause screen's controls are unchanged.

## Acceptance criteria
- [ ] During a boss wave (a multiple of 10), the moment the Colossus spawns the card pops in (~200 ms) pinned top-center: its ~16 px token, "Colossus" in bold ink, and the thin hp bar with one notch at the 50% mark; no card on any non-boss wave.
- [ ] The bar drains with the Colossus's live hp (the same value as its on-board bar) in its own purple over the muted track.
- [ ] While the Colossus is in its untargetable leg the token and the bar dim to 50% alpha, returning to full for the rest of each 8 s cycle — in lockstep with the board through 2× fast-forward (T0019).
- [ ] The card fades out (~200 ms) the moment the Colossus dies or leaks; it blocks nothing and takes no input, and the wave banner still slides above it at wave start.
- [ ] The card fits at 412x915 and 1280x720 without overlapping the stats card (top left) or the wave card / pause button (top right).
- [ ] The token, the name and the notch position are read from the boss's def (the notch at its `outOfReach.hpFrac`), not hard-coded.
