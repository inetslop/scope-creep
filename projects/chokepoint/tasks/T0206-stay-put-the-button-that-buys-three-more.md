---
id: T0206
title: "Stay put: the button that buys three more build seconds"
size: S
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T12:51:15Z
---

## Goal
A player who is still placing towers can buy time: during the build phase a "Stay put · 5" button spends 5 gold to add 3 seconds to the build countdown — the mirror of Send-them-early (T0077): a player who is ready sells the seconds for gold, one who is not buys them back.

## Details
- A small white card button in the Send button's (T0077) own card look, labeled "Stay put · 5" (coin glyph and label, same language as "Send · +N"), sitting directly under the Send button. Shown only while the build phase runs (including before wave 1) and hidden whenever the Send button is hidden.
- Tap: pays 5 gold and adds 3 seconds to the remaining build time. Everything that reads the countdown follows the new total with no special cases: the teal countdown ring on the next-wave button, the Send button's "+N" (2 gold per whole second left), and the last-three-seconds tick blips (T0090).
- On paying, a small red "−5" pop rises from the button — the Hauler's red "−5" pop look (T0057).
- Once per build phase: after its one use the button stays in place but dims and reads "Stay put · used", untappable — the reroll button's "used" look (T0036). A new build phase shows it fresh.
- While the run's gold is under 5: the price "5" is drawn red and the button is dimmed and untappable — the Send button's short-gold look.
- It composes with Send as normal: the added seconds count in Send's "+N", so a player who buys the three seconds and sends at once nets +1 gold over sending right away. That is the intended trade, not a bug to close.
- No new key: click/tap only. The pause screen's controls list gains one line naming the button and what it does (5 gold, +3 s of build, once per build phase).
- Layout: at 412x915 and 1280x720, the Send and Stay put buttons both fit under the wave preview card without overlapping it, each other or the next-wave button; the tap target matches the Send button's.
- Resume: the save is written when a run enters the build phase (T0042), so a resumed build phase starts with its full countdown and a fresh Stay put; no save field is added.

## Acceptance criteria
- [ ] In every build phase (including before wave 1) a "Stay put · 5" button shows under the Send button in the same card look; between build phases it is hidden with the Send button.
- [ ] Tapping with 5 or more gold: gold drops by 5 with the red "−5" pop at the button, and the countdown grows by 3 seconds — the teal ring, the Send "+N" and the tick blips all reflect the new total.
- [ ] After its one use the button dims, reads "used" and is untappable; the next build phase shows it fresh.
- [ ] With less than 5 gold the price is red, the button dimmed and untappable.
- [ ] The pause screen's controls list the button and its effect in one line; no new key exists.
- [ ] At 412x915 and 1280x720 the two buttons and the wave preview card do not overlap; a resumed run has a fresh Stay put.
