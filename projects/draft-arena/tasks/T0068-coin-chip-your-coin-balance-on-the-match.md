---
id: T0068
title: "Coin chip: your coin balance on the match HUD"
assignee: desktop
size: M
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-31T12:44:22Z
claimed_at: 2026-10-31T13:49:14Z
finished_at: 2026-10-31T13:52:52Z
---

## Goal
The shop's numbers are hidden while you play: coins tick in (the clink, the pop) but nothing says how many you have. A small chip on the match HUD shows the balance, so a life's earning is visible while it happens and a shop goal (Bloom 150, Chef Hat 300) reads as "close" or "not yet".

## Details
- What it shows: the player's coin balance — the same number the start card's coin line shows, live during the match. It ticks up the moment a kill coin, an event coin or a prestige pay lands, at the same instant the coin clink plays. Nothing else: no label — the coin says it.
- What it looks like: one small white sticker chip, one line: a yellow coin (the pickup's coin look, drawn small) and the balance, ink text in Fredoka.
- Where: top left, just under the connection card, on desktop and on the phone (412x915). It never grows past one line: the coin, then up to 5 digits without separators (99999). It must not cover the connection card, the xp bar, the middle of the screen or the thumb's drag path.
- When it shows: the whole time the match is shown — online or in this tab — including while you are down (the knockout card is centred; the chip stays top left). It is HUD, not start screen: the start card's coin line stays the place to see it between matches.
- What it replaces, or why the screen has room: it replaces nothing. Top left under the connection card is empty on both layouts, and the chip is one small line.
- A first-time player reads it in a second: the same coin that pops where a kill happens, with the number the shop spends.

## Acceptance criteria
- [ ] During a match, a small white chip under the connection card shows a yellow coin and the player's coin balance, updating at the moment coins land (a kill, an event gem, a prestige pay).
- [ ] The chip fits one line at 412x915 and 1280x720 with a 5-digit balance, covering nothing already on screen.
- [ ] It shows while online, in this tab, and while the player is down; it is not shown on the start screen.
- [ ] The start card's coin line still shows the balance between matches, unchanged.

## Design (architect, inet-racing)

### Files
- create `src/hud/coinChip.ts` — the chip: a small white HUD card, one line, yellow coin + live balance
- create `src/hud/coinChip.css` — its position and the coin dot
- edit `src/hud/index.ts` — add `import { coinChip } from './coinChip.ts';` after the `coin` import (line 4), and one line `coinChip,` in `HUD_PARTS` right after `coin,` (line 16)

### Interfaces
No new types. The part is the standard `MakeHudPart` from `engine/api.ts`:
```ts
import type { MakeHudPart } from '../../engine/api.ts';
export const coinChip: MakeHudPart = (root: HTMLElement) => { /* builds DOM, returns { update(view: HudView) } */ };
```
Data source, already existing — no engine work: `HudView.me.coins` (`engine/api.ts:606`, "coins in your profile (in this browser), coins earned in this match included"; built in `engine/client/main.ts:173` from the profile, defined the whole time the session has a self — including while down, `alive: false`). The HUD host already hides the whole `#hud` on the start screen (`engine/client/main.ts:221`), so "not on the start screen" is free.

### Steps
1. Create `src/hud/coinChip.ts` exactly:
```ts
import type { MakeHudPart } from '../../engine/api.ts';
import './coinChip.css';

/** Top left, under the connection card: the coin balance, live while it ticks in. */
export const coinChip: MakeHudPart = (root) => {
  const el = document.createElement('div');
  el.className = 'hud-card hud-coin-chip';
  el.hidden = true;
  const dot = document.createElement('span');
  dot.className = 'hud-coin-dot';
  const num = document.createElement('span');
  el.append(dot, num);
  root.append(el);
  let shown: number | undefined;
  return {
    update(view) {
      const c = view.me?.coins;
      if (c === undefined) { el.hidden = true; shown = undefined; return; }
      el.hidden = false;
      if (c === shown) return;
      shown = c;
      num.textContent = String(c);
    },
  };
};
```
(Do NOT put this in `src/hud/coin.ts` — that part is deliberately sound-only, "No DOM, no card".)
2. Create `src/hud/coinChip.css` exactly:
```css
/* coinChip.ts: top left, just under the connection card. */
.hud-coin-chip {
  position: absolute;
  left: calc(12px + env(safe-area-inset-left));
  top: calc(58px + env(safe-area-inset-top));
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
}
.hud-coin-dot {
  flex: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #ffd43b; /* PALETTE.yellow, the pickup's coin */
  border: 2px solid var(--ink);
  box-sizing: border-box;
  position: relative;
}
.hud-coin-dot::after {
  content: '';
  position: absolute;
  top: 1px;
  left: 2px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
}

/* Phones (narrow screens): the connection card sits at 64px there. */
@media (max-width: 520px) {
  .hud-coin-chip {
    top: calc(110px + env(safe-area-inset-top));
  }
}
```
3. Edit `src/hud/index.ts` as above (one import line, one registry line, next to `coin`).
4. `npm run check`.

Fullest state (must fit one line): a 14 px coin dot + "99999" (5 digits, no separators, no label) — card ≈ 90 × 38 px. Desktop 1280×720: under the connection card (12, 12, ends ~y50), clear of the centred xp bar (460–820 px) and the centred prestige chip (top 56 px). Phone 412×915: under the connection card (12, 64), clear of the full-width xp bar (top 12), the scoreboard (top 64, right) and the prestige chip (top 182, centred); far above the thumb drag path.

### Pitfalls
- Editing `src/hud/coin.ts`, `src/menu/coins.ts` or `src/menu/coins.css` — the sound part stays sound-only, and T0069 owns the menu coin files right now.
- The top offsets (58/110 px) mirror how every other part sits under a fixed-height card (connection is one 14 px line + 12 px padding + 6 px borders ≈ 38 px). Keep the `env(safe-area-inset-*)` calcs in both rules.
- Don't add thousands separators, a "coins" label, or any DOM churn: `update()` runs every frame — only touch the DOM when `shown` changes (the `el.hidden` toggle is the exception, and it only flips between states).
- No `Math.random`/`Date` — none needed; this part is pure display.

### Tests
- none (no pure helpers; the engine content tests and smoke test cover it).

## Result (attempt 1, desktop)

Added a coin chip to the match HUD: `src/hud/coinChip.ts` + `src/hud/coinChip.css` — a small white sticker card under the connection card (top-left, 58px desktop / 110px phone) showing a 14px yellow coin and the player's live coin balance (`view.me.coins`), updating the same frame coins land; registered in `src/hud/index.ts` right after the sound-only `coin` part, which was left untouched.

- Self-review: APPROVE
- Time: 3.6 min

```
projects/draft-arena/game/src/hud/coinChip.css | 39 ++++++++++++++++++++++++++
 projects/draft-arena/game/src/hud/coinChip.ts  | 25 +++++++++++++++++
 projects/draft-arena/game/src/hud/index.ts     |  2 ++
 3 files changed, 66 insertions(+)
```
