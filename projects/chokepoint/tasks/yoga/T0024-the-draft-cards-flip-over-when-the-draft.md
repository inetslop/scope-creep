---
id: T0024
title: The draft cards flip over when the draft opens
assignee: yoga
size: S
priority: 3
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-28T05:03:06Z
claimed_at: 2026-10-28T05:44:49Z
epic: E4
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

## Design (architect, yoga)

### Files
- edit `src/scenes/DraftScene.ts` - cards show face-down (plain white, one muted-gray gem in the center), flip face-up in display order with a stagger, and each card only picks after its own flip ends.

### Interfaces
none — all local to `DraftScene.create()`.

### Steps
1. In `src/scenes/DraftScene.ts`, before `const pick =` (line 36) add:
   `const flipped: boolean[] = offer.map(() => false);`
   and change pick's first line to `if (this.picked || !flipped[i]) return;`
   (taps, keys 1–3 and the `?smoke` auto-pick all go through `pick`, so this one guard covers them).
2. In the `cards` map, after the frame block (after line 86) and before `return { button, frame };` add exactly:
```ts
      // The card's back: one muted-gray gem in the center; hidden when face-up.
      const back = artScale(this.add.image(0, 0, GEM_TEXTURE)).setTint(PALETTE.faint);
      button.content.setVisible(false);
      frame?.setVisible(false);
      button.container.add(back);
      // The flip: the card narrows to a line and widens back face-up; the Epic card's is a bit longer.
      const leg = (copy.tier === 'epic' ? 350 : 200) / 2;
      this.tweens.add({
        targets: [button.container, ...(frame ? [frame] : [])],
        scaleX: 0.03,
        delay: 100 + i * 60,
        duration: leg,
        ease: 'Quad.easeIn',
        yoyo: true,
        repeat: 1,
        onYoyo: () => { back.setVisible(false); button.content.setVisible(true); frame?.setVisible(true); },
        onComplete: () => { button.container.setScale(1); frame?.setScale(1); flipped[i] = true; },
      });
```
   (`artScale` and `GEM_TEXTURE` are already imported; `i` is the map index = display order, so flips run 1→2→3.)
3. Nothing else: no changes to `CARD_W`/`CARD_H`, `layout()`, `place()`, the `makeButton` options, the frame drawing or the gem rows — card sizes, positions, frames and gem rows stay exactly T0002's.

### Pitfalls
- `back` must be a child of `button.container`, not `button.content` — into `content` it would be hidden with the face-up stuff.
- `frame` stays in the tween's `targets` and hidden until `onYoyo` — otherwise a face-down card would show its purple/blue frame (must be plain white: no name, frame or gem row).
- The flip is scaleX-only: all card children (content, back) follow the container automatically; never touch positions in the flip.
- Latest flip ends at 100 + 120 + 350 = 570 ms, before the `?smoke` auto-pick at 800 ms — keep the stagger at 60 ms so this holds.
- Durations are milliseconds in the tween manager — no frame-count assumptions.

### Tests
none
