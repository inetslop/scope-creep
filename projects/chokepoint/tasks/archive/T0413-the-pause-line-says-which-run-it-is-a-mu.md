---
id: T0413
title: "The pause line says which run it is: a muted mode word on the run line"
assignee: yoga
size: S
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-11-02T08:58:13Z
claimed_at: 2026-11-02T09:05:36Z
finished_at: 2026-11-02T09:17:49Z
---

## Goal
A player who pauses — or resumes the next day — sees which mode the run is in: the pause card's run line wears a muted word for the run's mode, so an Iron run (double coins, no last stand) is recognized where the run is read, not only on the claim card.

## Details
- The pause card's run-so-far line ("Wave N · X lives · Y gold · +Z coins") gains one muted word after the wave number while an Iron run is on: "Wave N · iron · X lives · …" — the muted ink the profile's "Iron wave N" line and the "held · N" chip use, the line's own size and weight.
- A normal run's line is byte-identical to today (no word, no extra space); the line still reads "Ready" before wave 1, with no word.
- No new card, button, key or sound; the line keeps fitting its card at 412x915 and 1280x720 with the longest numbers.

## Acceptance criteria
- [ ] In an Iron run the pause card's run line reads "Wave N · iron · X lives · Y gold · +Z coins"; in a normal run it reads exactly today's line.
- [ ] The word is muted (the "held · N" chip's ink), the line's own size, and the pause card's fit is unchanged at 412x915 and 1280x720.
- [ ] Before the first wave the line reads "Ready" with no mode word; every other pause line, the keys and the sound are untouched.

## Design (architect, yoga)

### Files
- edit `src/scenes/PauseScene.ts` — the stats line gains a conditional " · iron" word between the wave number (and star) and " · X lives · Y gold"

### Interfaces
None.

### Steps
1. In `create()`, right after line 89 (`const lineStyle = textStyle(13, PALETTE.muted);`), add:
```ts
const ironText = game.run.wave > 0 && game.run.mode === 'iron' ? this.add.text(0, 0, ' · iron', lineStyle).setOrigin(0, 0.5) : undefined;
```
2. Replace line 108, `fitTo([waveText, restText], 13, starred ? 21 : 0);`, with:
```ts
fitTo(ironText ? [waveText, ironText, restText] : [waveText, restText], 13, starred ? 21 : 0);
```
3. In the kids assembly, between the `if (starred) { … x += 21; }` block and `restText.setX(x);`, insert:
```ts
if (ironText) {
  kids.push(ironText);
  ironText.setX(x);
  x += ironText.width;
}
```
The leading space in `' · iron'` is the separator (exactly how `restText`'s own leading ` · ` works); `restText`'s string is untouched, so a normal run and the "Ready" line are byte-identical to today.

### Pitfalls
- The word goes in the `stats` container (via `kids`), never in `boxKids` — it moves and scales with the card for free; do not push it to `boxKids` or `worthText` (a separate line, unchanged).
- The word must sit after the star block so a starred wave reads "Wave N★ · iron · …", not "Wave N · iron★".
- Longest case "Wave 999★ · iron · 99 lives · 99999 gold" is ~270 px < `maxW` 328 at 13 px, so `fitTo` never fires; if it ever does, the loop already handles it. Card height is unchanged (same font size, `statsH` = `waveText.height`).
- No new key, sound or listener; scene lifecycle untouched.

### Tests
none

## Result (attempt 1, yoga)

The pause card's run line now shows a muted "iron" word after the wave number whenever an Iron run is under way ("Wave N · iron · X lives · Y gold"), so a player resuming the next day can see the mode where the run is read. It is one conditional text in PauseScene.ts, placed in the stats line's container between the wave number (and star) and the lives/gold text, using the line's own 13 px muted style; a normal run and the pre-wave "Ready" line are byte-identical to before, and the card fit at 412x915 and 1280x720 is unchanged.

- Self-review: APPROVE
- Time: 12.2 min

```
projects/chokepoint/game/src/scenes/PauseScene.ts | 8 +++++++-
 1 file changed, 7 insertions(+), 1 deletion(-)
```
