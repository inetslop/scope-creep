---
id: T0103
title: "The tech tree: the screen, spendable coins, and the run-start branch"
assignee: asus
size: L
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T07:23:51Z
claimed_at: 2026-10-29T08:02:14Z
epic: E2
---

## Goal
The foundation of E2 (the tech tree): a "Tech" button on the menu opens a white-card screen where the coins runs earn (E1) become spendable, and the first branch buys lasting run-start bonuses — the first reason to play one more run.

## Details
- Menu: a white "Tech" button under Play (the Resume button's shape, T0042) with one muted line "spend your coins". It is tappable even at 0 coins (the empty tree is readable). It is a menu button, shown where it is used; no new key, so nothing to list on the pause screen.
- Screen: the menu dimmed behind (the rewards card's pattern, T0003), one white card: title "Tech" (the menu card's title style), a coin-balance line under the title (the coin icon and bold number, the profile card's look, T0007), then one branch row: the muted small label "Run start" and four node cards. A "Menu" button at the bottom of the card (the rewards card's button) returns to the menu; tapping the dimmed background does nothing.
- Node cards, each a small white card: a bold name (16 px), one muted effect line, and a price line (number + coin glyph, the reroll button's language, T0036):
  1. "Gold +5" — 5 coins — "new runs start with 5 more gold"
  2. "Gold +5" — 10 coins — same effect line (needs node 1)
  3. "Gold +5" — 15 coins — same effect line (needs node 2)
  4. "Life +1" — 30 coins — "new runs start with one more life"
- Node states: affordable = full bright; unaffordable = dimmed with the price in red (the reroll look, T0036); locked (the previous node in the row not owned) = dimmed with a muted "needs the previous" line; owned = the price line replaced by a muted "owned" and the card wearing a thin yellow (the coin's color) border.
- Buying: one tap on an affordable node — the balance drops (the number pops, T0017's pop class), a two-note chime plays (the coin chime's shape, T0009: E5 then G5, 80 ms each, at the tier chime's quiet volume, T0032: 0.1 — quieter than a payout; silent with sound off, T0035), and the card turns owned. Buying never takes the balance below 0.
- The effect: a new run — a normal run or a ghost run — starts with its usual starting gold plus 5 per owned gold node, and its usual starting lives plus 1 per owned life node; a resumed run is untouched. The bonuses are read from a new pure module (the profile's purchased-node list → start bonuses) with unit tests; with no nodes owned the starting values are byte-identical to today.
- Profile: a new saved field for purchased nodes (a list of node ids, saved with the profile and parsed defensively, the T0001 pattern). The profile's coin field becomes the spendable balance: a run's payout adds to it exactly as today, a node purchase subtracts from it; the menu's profile card coin line (T0007) shows this balance — no new element.
- The screen shows only this branch for now; the other two branches (the draft, the pool) land as their own tasks, one row at a time (the claim card's growth pattern, T0075 → T0081).
- Layout: 1280x720 — the four node cards in one row; 412x915 — a 2×2 grid; no text below 12 px; the card fits both without scrolling.

## Acceptance criteria
- [ ] The menu shows a "Tech" button under Play with the muted "spend your coins" line; pressing it opens the tech card over the dimmed menu, and the "Menu" button returns.
- [ ] The balance line shows the profile's coins; after a run pays out the number has grown, and after buying a node it has dropped by exactly the node's price (the menu's profile card shows the same balance).
- [ ] A node dimmed with a red price cannot be bought; an affordable node buys with one tap: the balance drops, the pop and the two-note chime play, the card shows "owned" with the yellow border.
- [ ] Gold node 2/3 and the life node are locked (dimmed, "needs the previous") until the previous node in the row is owned.
- [ ] With all four nodes owned, a new run starts with +15 gold and +1 life over today's starting values; with none owned, starting values are byte-identical to today; a ghost run gets the bonuses, a resumed run does not.
- [ ] Purchases persist across a page reload: owned nodes stay owned and the balance stays reduced.
- [ ] No new hotkey; nothing new on the pause screen.

## Design (architect, desktop)

### Files
- create `src/core/tech.ts` - the tech tree's pure module: node data, start bonuses, purchase
- create `src/scenes/TechScene.ts` - the tech screen (white card over the dimmed menu)
- create `tests/core/tech.test.ts` - unit tests for the new rules
- edit `src/core/profile.ts` - add `purchased: string[]` to `Profile`; parse it defensively in `loadProfile`; carry `purchased: old.purchased` in `recordRun`'s new object; `purchased: []` in the catch fallback
- edit `src/scenes/keys.ts` - add `tech: 'Tech'` to `SCENES`, right after `menu: 'Menu'`
- edit `src/main.ts` - import `TechScene` and append it AFTER `RewardsScene` in the scene list (draw order: it must be last)
- edit `src/scenes/MenuScene.ts` - the Tech button under Play and the layout changes below
- edit `src/scenes/GameScene.ts` - apply the start bonus to new/ghost runs
- edit `src/audio/Sfx.ts` - one new method `techBuy()`, next to `chime()`
- edit `src/debug/runChecks.ts` - the `run.streak` line (it would fire with a life node)
- edit `tests/core/profile.test.ts` - add `purchased: []` to every full-profile expectation (lines ~18, 23, 33, 37, 45)

### Interfaces
```ts
// src/core/tech.ts
export interface TechNode { id: string; name: string; line: string; price: number; requires: string | null; gold: number; life: number }
// TECH_NODES: gold-1 (5c, requires null), gold-2 (10c, gold-1), gold-3 (15c, gold-2), life-1 (30c, gold-3) — one row, life needs node 3.
export function startBonuses(owned: readonly string[]): { gold: number; life: number } // per unique known id; [] → {0,0}
export function buyNode(store: KeyValueStore | undefined, id: string): boolean // load profile; false unless known, not owned, requirement owned, coins >= price; else subtract, push id, save (PROFILE_KEY, try/catch like saveSound)
// src/core/profile.ts: Profile gains `purchased: string[]`; loadProfile: Array.isArray ? [...new Set(parsed.purchased.filter((id): id is string => typeof id === 'string' && id.length > 0))] : []
// Sfx: techBuy(): void — tone(659,0.08,'sine',0.1); tone(784,0.08,'sine',0.1,undefined,0.08)
// GameScene: public field `techLife = 0`
```

### Steps
1. `core/tech.ts` as above (imports `PROFILE_KEY, loadProfile, KeyValueStore` from `./profile` — never the other way round).
2. `core/profile.ts` field (parse: keep non-empty strings, dedupe; `recordRun` keeps `old.purchased`).
3. Tests, then `npm run check`.
4. `Sfx.techBuy()` after `chime()`; `GameScene`: after `this.registry.set('run', this.run);` add `if (!saved) { const tech = startBonuses(loadProfile(window.localStorage).purchased); this.run.gold += tech.gold; this.run.lives += tech.life; this.techLife = tech.life; }` (a resumed run is untouched; ghost runs get it). Imports: `loadProfile` from `../core/profile`, `startBonuses` from `../core/tech`.
5. `runChecks.ts` line 16: `g.run.lives <= START.lives + 1 + g.techLife` (no per-frame storage read).
6. `keys.ts` + `main.ts` registration.
7. `MenuScene`: after the Ghost block create `const tech = makeButton(this, 0, 0, 'Tech', () => { this.scene.launch(SCENES.tech); this.scene.pause(); }, { width: 220, height: 60, fontSize: 24, radius: 30 });` and `const techLine = this.add.text(0, 0, 'spend your coins', textStyle(14, PALETTE.muted)).setOrigin(0.5);`. Push `tech.container, techLine` into `fadeIn` right after `button.container`. In `layout()`: `room = extra + 91 + (ghost ? 76 : 0)`; the `k` line's floor becomes `Math.max(0.35, ...)` (NOT 0.6 — see Pitfalls); positions: `tech` at `y + 366 + extra`, `techLine` at `y + 410 + extra`, ghost moves to `y + 442 + extra`, `ghostLine` to `y + 486 + extra`, `hint` to `y + (ghost ? 510 : 434) + extra`.
8. `TechScene.ts` (model: RewardsScene, but NO `setBackgroundColor` — the menu shows through the shade): `uiCamera(this)`, `hook.overlay = SCENES.tech`; full-screen interactive shade `PALETTE.ground` 0.78 with no pointer handler (taps do nothing); `this.profile = loadProfile(window.localStorage)`. Exit: `hook.overlay = ''; this.scene.start(SCENES.menu);` — this stops Tech and restarts the paused menu with the fresh balance (verified in Phaser 3.90: `SceneManager.start` shutdown+starts scenes in RUNNING..SLEEPING). Card content in a `box` container, rebuilt only when the width class flips (`width >= 740 ? 'wide' : 'narrow'`): wide panel 716x372, narrow 356x470 (`makeCard` radius 28); title 'Tech' `titleStyle(32)` at `-panelH/2+52`; balance line at `-panelH/2+96` (bold `textStyle(28, PALETTE.ink)` number, coin `artScale(..., 1.4)` at `-number.width/2 - 16`, re-centered whenever the number changes); label 'Run start' `textStyle(14, PALETTE.muted)` at `-panelH/2 + (wide ? 140 : 132)`; four node cards; Menu button `makeButton(..., 'Menu', exit, { width: 240, height: 52, radius: 26 })` at `panelH/2 - 54`. Node card = `makeButton(this, 0, 0, '', () => this.buy(node), { width: 160, height: 100, radius: 16, fadeWhenDisabled: false })` with content: name `textStyle(16, PALETTE.ink, {fontStyle:'bold'})` y -32, effect line `textStyle(13, PALETTE.muted, { align:'center', wordWrap:{width:140}, lineSpacing:2 })` y -4, price `textStyle(13, bold)` origin (0,0.5) + coin `artScale(..., 12/28)` y 34, row centered like the reroll: `w = 20 + price.width; coin.x = -w/2 + 6; price.x = -w/2 + 20`. Positions: wide x = [-258, -86, 86, 258] y -16; narrow x = [-86, 86], rows y [-30, 82]. Owned state: a `Graphics` sibling in `button.container` (cleared every refresh), `lineStyle(2, PALETTE.yellow, 1)` `strokeRoundedRect(-81, -51, 162, 102, 17)`. Refresh per node: owned → content alpha 1, price text 'owned' muted, coin hidden, border on; locked (requires not owned) → alpha 0.5, price text 'needs the previous' muted, coin hidden; else alpha `afford ? 1 : 0.6`, price = number, color `afford ? ink : red`, coin visible; `button.setEnabled(affordable && unlocked && !owned)`. Buy: `if (!buyNode(window.localStorage, node.id)) return; this.profile = loadProfile(window.localStorage); getSfx(this)?.techBuy(); pop; refresh;` where pop = two separate tweens, 75 ms yoyo `Quad.easeOut`: text to scale 1.15 (back to 1 in `onComplete`), icon to `base * 1.15` (back to its captured base). `layout()`: shade full screen + hit area, rebuild on class flip, `box.setPosition(w/2, h/2).setScale(Math.min(1, (w-24)/panelW, (h-24)/panelH))`; `onResize`.
9. `npm run check`, then `npm run smoke`.

### Pitfalls
- Menu at 1280x720 with Resume+Ghost+Tech: the old `k` floor 0.6 makes the block 810 px tall (clips the hint by ~65 px). The floor MUST become 0.35; all other menu layouts are unchanged (verified: every other case computes the same `k` as today).
- Exit via `this.scene.start(SCENES.menu)`, never `stop`+`resume` — resuming the paused menu would keep its stale coin number; `start` re-creates it fresh (ProfileCard relies on exactly this).
- Do not `setBackgroundColor` in TechScene, or the dimmed menu behind is gone.
- `makeButton`'s default `fadeWhenDisabled` fades locked cards to 0.45 — always pass `fadeWhenDisabled: false` and set `content` alpha yourself (the reroll's way).
- The effect line is 31 chars — it needs `wordWrap`, or it overflows the 160 px card.
- `graphics.clear()` before redrawing the owned border, or strokes accumulate; the border is a sibling of `content`, so it does not lift on hover (owned cards are disabled, so they never lift).
- The pop tweens the text (base scale 1) and the coin icon (base scale from `artScale`) SEPARATELY — one tween on both with one scale value blows up the icon.
- `profile.test.ts` full-object `toEqual`s fail until `purchased: []` is added to each.
- No `Math.random()`, no new hotkey, no `onKey` in TechScene; button ≥44 px (160x100, 240x52, 220x60).

### Tests
- `tests/core/tech.test.ts` (in-memory `KeyValueStore` like `profile.test.ts`): `startBonuses([])` = `{gold:0,life:0}`; all four = `{gold:15,life:1}`; repeats/unknown ids counted once; `buyNode` refuses unknown id, already-owned, locked (incl. life-1 before gold-3) and unaffordable (coins never below 0), otherwise deducts exactly the price and saves the id; a full chain of four from 60 coins leaves 10; defensive parse (`['gold-1','gold-1',7,null,'']` → `['gold-1']`, non-array → `[]`).
- `tests/core/profile.test.ts`: update existing expectations only.
