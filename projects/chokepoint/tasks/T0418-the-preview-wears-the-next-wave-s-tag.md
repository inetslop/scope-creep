---
id: T0418
title: "The preview wears the next wave's tag"
size: S
priority: 2
status: designing
depends_on: []
attempts: 0
created: 2026-11-02T10:34:56Z
claimed_at: 2026-11-02T10:35:23Z
designer: yoga
---

## Goal
During the build phase the player sees the next wave's own form — quiet, tight, rush or boss — on the wave preview card, so the wave's pace is planned where a tower can still be placed, not learned on the banner at the wave's door. Today the tag is said once (the one-time teach, T0092) and on the ~1 s banner at wave start; in between, the build knows nothing of it.

## Details
- While the build phase runs and the next wave's plan is tagged (quiet, tight, rush, boss — the plan's own tag, the same data the banner chip (T0080) and the teach (T0092) already read), the preview card wears one muted chip under the token row: the tag's word in the banner chip's own muted style (same muted ink chip, same word, the banner chip's own size — no new color).
- The next wave untagged: the card is exactly as it is today — no chip, no empty room, byte-identical.
- A boss wave next wears "boss" under its token row (the token already shows the boss; the chip names the wave's form).
- The card grows one line of height only while a tagged wave is next; with the longest word ("quiet"), every line fits its card at 412x915 and 1280x720, and nothing below it (the next-wave button) moves or clips.
- One in, one out: the chip takes one line on a card that exists only during the build phase and replaces nothing, because the tag is shown nowhere during the build today — the banner chip is a 1 s flash at wave start (too late to place a tower) and the teach fires once and fades.
- No new HUD part: the line is drawn inside the existing card's own render (the card is already on screen during the build phase), comes and goes with the card, leaves no mark on the board, and needs no new key, button or sound.
- The one-time tag teach (T0092) fires exactly as it does today — the chip states the label, the teach explains the meaning.
- When the storm mode (T0403) lands, its rush-tagged plans wear this chip automatically — no storm-specific mark on the card; its "chip on the preview" requirement is met by this line.
- Unit test for the chip's word: one per tag (quiet, tight, rush, boss) and none for an untagged plan, beside the tags' existing tests.

## Acceptance criteria
- [ ] In a seeded run, a build phase whose next wave's plan is tagged quiet / tight / rush / boss shows exactly one muted chip under the preview card's token row, with that word.
- [ ] A build phase whose next wave is untagged shows the card exactly as it does today (no chip, no extra space).
- [ ] The chip's word and muted style match the banner chip at the start of the same wave (T0080's language).
- [ ] The chip lives on the preview card only: it appears and disappears with the card, leaves nothing on the board, and adds no key, button or sound.
- [ ] The one-time tag teach (T0092) still fires as it does today.
- [ ] At 412x915 and 1280x720 the card with the chip line fits: one line taller, the next-wave button and the rest of the HUD in place.
