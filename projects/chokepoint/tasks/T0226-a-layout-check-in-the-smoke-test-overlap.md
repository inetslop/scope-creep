---
id: T0226
title: "A layout check in the smoke test: overlapping text and text leaving its card fail the gate"
size: L
priority: 2
status: designing
depends_on: [T0222, T0223, T0224, T0225]
attempts: 0
created: 2026-10-29T17:39:04Z
claimed_at: 2026-10-29T17:44:37Z
designer: desktop
---

## Goal
Screens keep growing overlaps: on the Rewards card, the tech cards, the start screen and the wave preview, text ran past its card or into the next line, and nothing caught it. Each task added a line at a hand-picked offset, and the smoke test only checks the game's state, never what is on screen. Add a layout check that the smoke test runs at both of its sizes (1280x720 and 412x915), so a task that makes text overlap, or leave its card or the screen, fails its own gate with a message that says exactly what overlaps.

This task comes after T0222-T0225, which fix the four screens above, so the check lands passing.

## Details
- **The check (`src/debug/layoutCheck.ts`):** given a scene, it returns its problems as strings:
  - **Text leaves its card:** a visible text (visible, alpha above 0, inside a visible container) that belongs to a card reaches past the card's edge.
  - **Text overlaps text:** two visible texts on the same card overlap (bounding boxes intersecting by more than 1 px).
  - **A screen part overlaps another or leaves the screen:** on a full screen (the start screen, Tech, Rewards, Game over), two top-level parts overlap (cards, buttons and texts; not the decorative demo road or drifting shapes), or one reaches past the screen's edge. The exception is the Tech panel while it scrolls (it is taller than the screen on purpose). Inside the panel the rules still hold.
  - Each problem names the screen, the size, the state and the two texts by their first words, e.g. `Menu 412x915 four runs: "Recent W13 +64" overlaps "Build towers beside the road."`.
- **Finding cards:** `makeCard` (`src/ui/card.ts`) marks the image it makes as a card with its width and height (e.g. `setData`), so the check finds cards without guessing. A button's card counts as a card: its label must fit inside it.
- **A tour of the screens at boot, under `?smoke` only:**
  - Before the run starts, `BootScene` opens each full screen in turn, filled with prepared data, then runs the check and pushes every problem to `hook.errors` (prefix `layout: `). The smoke test already fails on `hook.errors`.
  - The states to visit:
    - the start screen with a fresh profile;
    - the start screen after four or more runs (3-digit coins, a best run so Ghost shows, a saved run so Resume shows);
    - Tech with nothing bought, and with everything bought;
    - Rewards after a long run (a 5-digit score, a 4-digit stopped count, 3-digit coins) and after a short one;
    - Game over.
  - Each screen's entrance tweens and count-ups are completed straight away (not waited for), so the check sees the final layout.
  - The screens' own `?smoke` auto-advance (the start screen's auto-Play, the Rewards and Game over timers) must not fire during the tour.
  - The tour leaves `localStorage` and the registry exactly as it found them, so the run that follows is the same seeded run as before. It must finish well inside the smoke test's 10 s wait for the Game scene (aim for under 3 s on a slow machine).
- **During the run:** an invariant in `src/debug/runChecks.ts` runs the check on the draft and pause overlays while they are open, and on the HUD's cards (the wave preview card and the others built with `makeCard`). Floating pops and other text that isn't on a card are left out: they overlap on purpose.
- **What the check finds in other screens:** if it finds a real problem in a screen outside T0222-T0225 (the draft, pause, Game over, the HUD), fix it in this task when the fix is small (a position or a size). Never weaken the check to pass. If a fix would be big, name it in your result.
- **Document it:** add the layout check to the contract comment at the top of `src/debug/testHook.ts`, next to the invariants.

## Acceptance criteria
- [ ] `npm run check` and the smoke test pass on the game as it is after T0222-T0225.
- [ ] Moving any line of the start screen's profile card 20 px down (a quick local test, then reverted) makes the smoke test fail with a `layout:` message naming both texts.
- [ ] The tour runs at both smoke sizes, covers every state listed above, and leaves the seeded run unchanged (same seed, same first wave).
- [ ] No problems are reported for floating pops, the demo road or the drifting shapes.
