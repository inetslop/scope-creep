---
id: T0264
title: "The waves reference: the tags and what they do, off the pause"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T06:24:50Z
---

## Goal
A first-time player meets the wave tags one at a time — quiet at wave 4, tight at wave 8, boss at wave 10 — each taught once at its first preview; the pause screen gains a "Waves" screen (the enemies reference's pattern, T0252) that lists all three tags with what each means and when it comes, so the wave you haven't faced is readable at any pause, the way the shape you haven't met already is.

## Details
- The pause card gets a new "Waves" row in the "Enemies" row's pattern (T0252): its own row on the card, plus a matching line in the controls list (pillar 8). It opens a new scene over the dimmed pause (the EnemiesScene pattern: dim shade, one white rounded card) and closes back to the pause.
- One row per tag, in the order the run meets them: quiet, tight, boss. Each row shows the tag's own chip (the exact chip the preview wears, T0092), the tag's name, and its meaning in the preview's own tag-teach wording (T0092's table, grown by T0108's tight line) — the reference never calls a tag anything the preview doesn't. Boss's meaning line: "one big shape, instead of a crowd".
- Under each, a muted second line: when it comes — "every 4th wave" (quiet, T0071), "every 8th, from 6" (tight, T0108), "every 10th wave" (boss, E5) — and the next one in this run: "next: wave N".
- "next: wave N" is derived, never hardcoded: the first wave after the current one that the game's own wave rules tag with that tag (the same pure functions the preview and the banner use, in core/waves.ts), so the reference can never disagree with what actually comes. From a fresh run, next quiet is wave 4. Put the three rows' data (chip, name, meaning, when) in one small content file next to the tag rules so it is read in one place.
- Boss row while no boss is on the board yet (the Colossus is being built, T0253): the row still ships with chip, name, meaning and when/next; it shows the boss's own on-board token only once the boss exists in the content — no placeholder art before then.
- If the level rule (T0260) lands before this task is built, the boss row's when/next reads the wave rules like the other two rows (the bosses then end the levels) — the row data lives in the one content file, so that is a one-line switch, decided at build time.
- The reference is read-only: nothing on it is tappable except back to the pause; it plays no sound and paints nothing on the board. It teaches with what the preview already shows — no new teach line, no permanent mark.
- Fit: the card holds a heading and three two-line rows; it fits at 412x915 and 1280x720, and the pause card with the extra row still fits its tidy column (T0245).

## Acceptance criteria
- [ ] The pause card offers a "Waves" row (the Enemies row's look) with a matching controls line; it opens the waves reference over the dimmed pause and closes back to the pause.
- [ ] The reference shows exactly three rows — quiet, tight, boss — each with the tag's own chip, the preview's own teach wording, its "when" line, and a "next: wave N" that matches the game's wave rules (fresh run: next quiet is wave 4; a run resumed at a deep wave: every next column still matches the rules).
- [ ] While no boss exists in the content, the boss row shows no shape token; quiet and tight rows are unaffected.
- [ ] Nothing on the reference is tappable except back to the pause; it plays no sound and paints nothing on the board.
- [ ] The reference card fits at 412x915 and 1280x720, and the pause card with the new row fits its column.
