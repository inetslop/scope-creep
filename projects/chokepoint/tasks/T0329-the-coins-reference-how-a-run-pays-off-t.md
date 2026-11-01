---
id: T0329
title: "The coins reference: how a run pays, off the pause"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: [T0313]
attempts: 1
created: 2026-11-01T01:46:07Z
claimed_at: 2026-11-01T04:09:16Z
epic: E9
---

## Goal
The coin payout is three layers deep now — the base rates, the claim branch's nodes, and the run's multipliers (E9's level augments and Iron) — and no single screen shows how a run pays. A "Coins" reference off the pause, the fifth of the pause's reference pages, puts the payout math in one card: the rates, this run's terms so far, and the run's multipliers — so the player sees what a clean wave is really worth before spending.

## Details
- **The entry:** one new row on the pause card, "Coins", in the exact pattern of the other reference rows (T0252's Enemies, T0264's Waves, T0277's Bosses, T0306's Summary), plus one line in the pause's controls list ("Coins — how a run pays"). The pause card's column keeps fitting at 412x915 and 1280x720 (its own fit decides; the rows are the established size). The screen has room: the pause is the reference hub, the row is the established size, and the payout — E9's long-term ladder — is the one number a player saves toward and can't yet read the math of.
- **The screen:** a new scene in the references' pattern — the dimmed pause behind, one white rounded card, title "Coins", closed by the references' own close (a tap on the dim shade).
- **Section "Pays"** (muted ink, the current rates, one line each):
  - "each wave held · +1"
  - "every 10 stopped · +1"
  - "each clean wave · +N" — N from the claim branch's clean-pay (the same read the stats card uses, T0313's `cleanWavePay`: 1, or 2 while "Clean ×2" is owned)
  - "a flawless run · +N" — N the Flawless node's own pay (T0313's `flawlessPay`, 10), shown only while that node is owned, absent otherwise
- **Section "This run"** (bold ink, the run's terms so far — the claim card's recipe parts, T0075/T0313's own values, so the mid-run card and the end card agree): "waves +A · stopped +B · clean +C", A the waves held so far, B floor(stopped so far ÷ 10), C the clean waves so far; each part × the run's Iron ×2 when it runs; plus a "flawless +D" part (D the node's pay, × the Iron ×2) while the run is flawless so far (every wave held so far clean, at least one held) and the node is owned. Wraps within the card like the claim recipe.
- **Section "Multipliers"** (shown only when present — the factors behind the parts): "×2 Iron" in an Iron run; "×N level augments" when this run's level multiplier is above 1, N the menu's own number (e.g. "×1.25"). The total is never on the card — the pause's worth line keeps it (T0306's rule: nothing on the page repeats the pause's own run line or worth line; no wave number, lives, gold or tally either).
- Everything is read from what the run and the profile already carry (the ledger, the Iron flag, the purchased nodes, the run's level set) — no new run or profile field, and a resumed run shows the same card.
- No sound, no input beyond the close, no marks on the board or the HUD: one row in, one page behind it.

## Acceptance criteria
- [ ] The pause card has the "Coins" row in the references' pattern and its line in the controls; opening it shows the dimmed pause behind one white card titled "Coins"; the references' own close returns to the pause.
- [ ] "Pays" lists the three base rates; the clean line reads "+2" with the Clean ×2 node owned and "+1" without; the flawless line appears only with the Flawless node owned, and its number is the node's own pay.
- [ ] "This run" reads the run's live terms — for the same ledger and mode, the same parts the claim card's recipe line shows at the end (Iron's ×2 in each part); before wave 1 the parts read +0.
- [ ] "Multipliers" shows "×2 Iron" in Iron runs and "×N level augments" only when the run's level multiplier is above 1; a plain run with no level augments shows no multipliers section.
- [ ] The card shows no wave number, lives, gold, coin tally or total; the pause's own run line and worth line are untouched.
- [ ] No new save field: a resumed run mid-wave shows the same card, and the card's text fits at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- create `src/scenes/CoinsScene.ts` - the "Coins" reference page off the pause (models `SummaryScene.ts` exactly: dim shade + white card + round ink back button + top-down content, scaled to fit).
- edit `src/scenes/keys.ts` - add `coins: 'Coins'` to `SCENES` (after `summary: 'Summary'`).
- edit `src/main.ts` - add `import { CoinsScene } from './scenes/CoinsScene';` and add `CoinsScene` to the `scene:` array right after `SummaryScene`.
- edit `src/scenes/PauseScene.ts` - add one CONTROLS line, one reference row button, its card-height term, its placement and its boxKids entry.

### Interfaces
No new types. `CoinsScene` reads, once, exactly what already exists:
- `run = getGameScene(this).run`; `profile = loadProfile(window.localStorage)`; `owned = profile.purchased`.
- `cleanPay = cleanWavePay(owned)` (1 or 2) — exists in `src/content/tech/claim.ts`.
- `flawPay = flawlessPay(owned)` — **added by T0313** in the same file; the Flawless node's pay (10) once owned, 0 otherwise.
- `iron = run.mode === 'iron' ? 2 : 1`; `flawlessSoFar = run.wavesCleared === run.cleanWaves && run.wavesCleared > 0`; `run.levelHpMul`, `levelMultiplierLabel(run.level)`.

### Steps
1. `src/scenes/keys.ts`: after `summary: 'Summary',` add `  coins: 'Coins',`.
2. `src/main.ts`: add the import (after `CodexScene`), and in the `scene:` array insert `CoinsScene` after `SummaryScene` (draw order: on top of pause, under GameOver).
3. Create `src/scenes/CoinsScene.ts` (class `CoinsScene`, key `SCENES.coins`, `private panelW = 340`). `create()`: `uiCamera(this)`; `hook.overlay = SCENES.coins`; `this.shade = this.add.rectangle(0,0,10,10,PALETTE.ground,0.78).setOrigin(0).setInteractive()`; `doBack()` = guard `this.closed`, `getSfx(this)?.blip()`, `hook.overlay = SCENES.pause`, `this.scene.start(SCENES.pause)`; bind `this.shade.on('pointerdown', doBack)`; build the round ink back button (48x48, `PALETTE.ink`) with a white `arrow.fillTriangle(3,-7, 3,7, -8,0)` in `this.back.content` → `doBack`; call `this.build()`; `layout(w,h)` = shade.setSize+hitArea, `this.box` center scaled by `Math.min(1,(w-24)/panelW,(h-24)/panelH)`, `this.back.container.setPosition(width-EDGE-24, 40)`; `layout(viewSize(...))`; `onResize`; `if (flags.smoke) this.time.delayedCall(1000, doBack)`.

   `build()`: compute `cleanPay, flawPay, hasFlawless = flawPay > 0, iron, flawlessSoFar`. Constants `PAD=28, GAP=10, GAP_BIG=20, innerW = panelW - PAD*2`.
   - `title = this.add.text(0,0,'Coins', titleStyle(28))`.
   - "Pays" heading `textStyle(13, PALETTE.ink, {fontStyle:'bold'})`; lines `textStyle(12, PALETTE.muted)`: `'each wave held · +1'`, `'every 10 stopped · +1'`, `` `each clean wave · +${cleanPay}` ``; plus (only if `hasFlawless`) `` `a flawless run · +${flawPay}` ``.
   - "This run" heading (same bold style); `parts = [waves +${run.wavesCleared*iron}, stopped +${Math.floor(run.kills/10)*iron}, clean +${run.cleanWaves*iron}]`; if `hasFlawless && flawlessSoFar` push `` `flawless +${flawPay*iron}` ``; `recipe` = `parts.join(' · ')` as `textStyle(14, PALETTE.ink, {fontStyle:'bold', wordWrap:{width:innerW}})`.
   - "Multipliers": `multFacts = (run.mode==='iron'?['×2 Iron']:[]).concat(run.levelHpMul>1?[`${levelMultiplierLabel(run.level)} level augments`]:[])`; heading only if `multFacts.length>0`; lines `textStyle(12, PALETTE.muted)`.
   - Height `h = PAD + title.height + GAP_BIG + paysHeading.height + Σ(GAP+line.height) [+ flawlessLine] + GAP_BIG + runHeading.height + GAP + recipe.height + (if mult: GAP_BIG + multHeading.height + Σ multLines) + PAD`; `panelH = Math.ceil(h)`; `makeCard(panelW, panelH, 28)`; place top-down with a `cy(hh)` cursor (title → each section: `y+=GAP_BIG` then heading, then `y+=GAP` before each line). Put every created object (card, title, headings, all lines, recipe) into `this.box` container. Create `flawlessLine`/`multHeading`/`multLines` **only** when shown (no unused text at 0,0).
4. `src/scenes/PauseScene.ts`:
   - In `CONTROLS`, after `'Summary — the run so far: score, combo, by tower',` add `'Coins — how a run pays',`.
   - After `summaryButton` (line 186): `const showCoins = (): void => { if (closed) return; this.scene.launch(SCENES.coins); this.scene.pause(); };` then `const coinsButton = makeButton(this, 0, 0, 'Coins', showCoins, { width: 240, height: 52, radius: 26 });`
   - Line 193 card-height: append `+ GAP_S + 52` immediately before the trailing `+ PAD`.
   - After `summaryButton.container.setY(cy(52));` (line 228) add `y += GAP_S;` and `coinsButton.container.setY(cy(52));`.
   - In `boxKids` (line 230) add `coinsButton.container`.

### Pitfalls
- **flawlessPay behavior**: T0313 lands first — read `flawlessPay` in `content/tech/claim.ts`. The owned-test `flawPay > 0` is only valid if it returns 0 when the node is absent. If it returns 10 regardless, instead read the Flawless node's `id` from `CLAIM_NODES` and test `owned.includes(id)`.
- **clean part is the COUNT, not the pay**: "This run" clean part = `run.cleanWaves * iron`. Do NOT multiply by `cleanPay` — the clean rate (`+1`/`+2`) lives in the "Pays" section by design; the two sections multiply to the clean total.
- **No totals/ledger on the card**: never show a coin total, wave number, lives, gold or tally. The pause's `worthText`/stats line are untouched (you only add a row + a controls line + a height term).
- **Close**: the references' close is the round ink back button; the brief also says "a tap on the dim shade" — bind both the shade and the back button to the same idempotent `doBack` (guarded by `this.closed`), so it works either way. `doBack` restarts the pause via `scene.start(SCENES.pause)` (GameScene stays paused), exactly like the other references.
- **Wrap/measure**: set `wordWrap` in the `recipe` text's style (not a post-hoc `setStyle`) and read `.height` before computing `panelH`, or the card under-sizes when the line wraps at big numbers.
- **Fit**: the card scales via `Math.min(1,(w-24)/panelW,(h-24)/panelH)` so it always fits at 412x915 and 1280x720; the pause card already scales the same way, so the added row keeps fitting.

### Tests
- none (read-only UI page; no new/changed `src/core` rule).
