---
id: T0024
title: The draft cards flip over when the draft opens
assignee: yoga
size: S
priority: 3
status: designing
depends_on: []
attempts: 0
created: 2026-10-28T05:03:06Z
claimed_at: 2026-10-28T05:29:24Z
epic: E4
designer: yoga
---

## Goal
The draft gets a moment: the three offered cards flip face-up when the draft opens, and the Epic card holds its flip a beat longer — the rarest card is the last one the eye finishes.

## Details
- In the draft scene (the scene that shows the three offered augment cards; T0008's notes call it `DraftScene`, and T0002 is what gave those cards their frames and gem rows), when the draft opens the three cards turn from face-down to face-up, in the order they are shown:
  - Common and Rare cards: ~200 ms each, ~60 ms stagger between cards.
  - Epic cards (purple frame, 3 gems): ~350 ms — visibly longer, so the special card finishes last.
- Face-down: the same white card at the same size and position, blank, with one small muted-gray gem in its center — the same gem shape as the tier gem row (T0002), a neutral "unknown" mark, no theme. Nothing on the card is readable while it is face-down.
- The flip is a plain horizontal turn (the card narrows to a line and widens back to face-up). Closest existing example of the short scale animation idiom: the coin-tally pop (T0017, `src/ui/hud/StatsCard.ts`) — a brief scale-out-and-back over ~150 ms.
- A card is tappable the moment its own flip finishes. The flip plays on every draft open (before wave 1 and after each wave). No sound, no new input, no new button; the pause screen is unchanged; card sizes, positions, frames and gem rows are exactly T0002's.

## Acceptance criteria
- [ ] Opening the draft, a player sees the three cards face-down for a beat, then flipping face-up one after another (~200 ms each, ~60 ms stagger) — not an instant pop-in.
- [ ] An Epic card flips in ~350 ms, visibly longer than its Common/Rare neighbors in the same draft.
- [ ] A face-down card is plain white with one small muted-gray gem in the center: no name, numbers, frame or gem row visible.
- [ ] Cards are tappable the instant their flip ends, and the flip plays on every draft open including the first one.
- [ ] Card layout is unchanged from T0002 at 412x915 and 1280x720.
