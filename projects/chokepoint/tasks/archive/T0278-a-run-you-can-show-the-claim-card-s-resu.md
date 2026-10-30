---
id: T0278
title: "A run you can show: the claim card's result becomes a copyable line"
size: M
priority: 2
status: failed
depends_on: []
attempts: 0
created: 2026-10-30T10:09:05Z
epic: E8
---

## Goal
A finished run is a line you can keep and share (E8's first slice): the claim card gains a "Copy" control that puts the whole result on the clipboard — "Chokepoint · Wave N · Board SEED · +C coins" (and "· Iron" for an Iron run) — so a player can paste it where runs are shared and a friend can replay the exact board from the seed (the ghost run, T0078).

## Details
- **The control (the claim card, RewardsScene):** under the card's "Board SEED" line (T0056), one small "Copy" control — a compact rounded button in the card's own muted-ink language, no wider than the line already uses. It is the only thing added to the card; every existing line (waves, score + breakdown, coins + recipe, clean, stopped, best combo, the seed line, Flawless) is untouched.
- **What it copies:** exactly one line, "Chokepoint · Wave N · Board SEED · +C coins", where N is the run's last wave, SEED the board seed (T0056's own value) and C the run's coin tally — the same three numbers the card already shows. For an Iron run (T0241) the line appends " · Iron" after the coins, so the mode travels with it. One tap, no dialog, no input.
- **The "Copied" beat:** on tap the control's label swaps to "Copied" for ~1 s (the name-tag chip's transient, T0085) then back to "Copy". No sound. Where the clipboard is unsupported (a guarded navigator.clipboard, the haptics pattern T0265) the tap still shows "Copied" but writes nothing — it never throws and never blocks the card.
- **Fits:** the claim card (T0224's tidy column) absorbs the control's row at 412x915 and 1280x720 with the longest numbers (a wave in the hundreds, a seed, a large coin total); the column re-derives its height from its parts as T0224 does.
- **The split with what already shows:** the seed, the wave and the coins are already shown as readouts on the card; this adds an ACTION (one tap → clipboard), not a fourth readout, and a new control where none existed (one control per action). It is the bridge from the card to the leaderboard and the ghost replay, both of which already read the seed.
- **Why it matters now:** today the seed is shown (T0056) "so a run can be shared and replayed," but a player retypes the wave, the seed and the coins by hand to share one result; a finished run is the game's loudest moment and it has nothing to hand a friend.

## Acceptance criteria
- [ ] The claim card shows a small "Copy" control under the "Board SEED" line, in the card's muted-ink language, and it is the only thing added to the card.
- [ ] Tapping it copies exactly "Chokepoint · Wave N · Board SEED · +C coins" (with " · Iron" appended for an Iron run) to the clipboard — the run's own last wave, board seed and coin tally, the three numbers the card already shows.
- [ ] On tap the label reads "Copied" for ~1 s then returns to "Copy"; it is silent with sound on and off; where the clipboard is unsupported the tap still shows "Copied" and never throws or blocks the card.
- [ ] No existing claim-card line changes; the card's tidy column (T0224) re-derives its height and fits at 412x915 and 1280x720 with a wave in the hundreds, a seed and a large coin total.
- [ ] No in-game HUD element, key, sound or on-board readout is added; the game-over card and the menu are unchanged.

## Design (architect, desktop)

### Files
- edit `src/scenes/RewardsScene.ts` — add the small "Copy" control under the "Board XXXX" line of the claim card; one tap copies the run line to the clipboard and the label swaps to "Copied" for ~1 s. No other file changes; no sound, no hotkey, no HUD part.

### Interfaces
None new — everything is local to `RewardsScene.create()`. Reuses existing `makeButton` (`src/ui/button.ts`), `boardCode` (already imported), `this.waves` / `this.coins` / `run.seed` / `run.mode`, and the scene's existing `stack()` column.

### Steps
1. In `RewardsScene.create()`, just before `let closed = false;` (line ~82) add:
```ts
let restore: Phaser.Time.TimerEvent | undefined; // the "Copied" → "Copy" timer
```
and inside `menu()`, right after `closed = true;` add:
```ts
restore?.remove();
```
2. Just before `const menuButton = makeButton(...)` (line ~130) add the control and its action:
```ts
// One tap puts the whole result on the clipboard so a run can be shared and replayed from the seed.
const copyLine = `Chokepoint · Wave ${this.waves} · Board ${boardCode(run.seed)} · +${this.coins} coins${run.mode === 'iron' ? ' · Iron' : ''}`;
const copyButton = makeButton(this, 0, 0, 'Copy', () => {
  const clip = navigator.clipboard;
  if (clip && clip.writeText) clip.writeText(copyLine).catch(() => {}); // guarded: the beat still shows where the clipboard is off
  copyButton.label.setText('Copied');
  restore?.remove();
  restore = this.time.delayedCall(1000, () => { restore = undefined; if (!closed) copyButton.label.setText('Copy'); });
}, { width: 96, height: 44, radius: 22, fontSize: 16 });
```
Button = default white card fill with ink label (the card's own language, not the ink primary), pill shape, 44 px (touch minimum), 96 px wide — the "Board XXXX" line at 22 px is ~100 px, so it is no wider than the line it sits under.
3. In the `rows` array (lines 141–147), change the board row's `after` to `gapSmall` and add the button row after it:
```ts
      { height: boardText.height, after: gapSmall },
      { height: copyButton.container.height, after: flawlessText ? gapSmall : gapBig },
```
(`stack()` re-derives the card height from these rows; the box scale-down in `layout()` already guarantees fit at 412x915 and 1280x720 — the added 44 px + 12 px gap still leaves the fullest column under 696 px at 720 p, and well under 891 px at 915 p.)
4. In the placement block, after `boardText.setY(top + col.ys[i++]);` (line ~172) add:
```ts
    copyButton.container.setY(top + col.ys[i++]);
```
5. Add the button to the card's parts (line ~184): `parts.push(this.scoreText, scoreRecipe, this.coinText, this.coinIcon, coinRecipe, boardText, copyButton.container);`
Do not touch any existing line object, `update()`, the count-up, `centerCoins()`, or `menuButton`.

### Pitfalls
- **Timer outliving the scene:** if the user taps Copy then Menu within 1 s, the old timer fires after shutdown on the destroyed label. Hence `restore?.remove()` in `menu()` and the `if (!closed)` guard in the callback — both are required.
- **Double tap:** the second tap must `restore?.remove()` first, or the first timer reverts "Copied" early.
- **Clipboard:** `writeText` rejects (denied, non-secure context) and `navigator.clipboard` may be absent — the `if (clip && clip.writeText)` guard plus `.catch(() => {})` means it never throws, never blocks, and the "Copied" beat shows regardless. No `await`, no sound (do not touch `Sfx`).
- **Values:** the line must use the same values the card shows — `this.waves` (which honors the saved ledger), `this.coins`, `boardCode(run.seed)`, and iron via `run.mode === 'iron'` — not recomputed ones.
- **Column order:** the button row goes between `boardText` and the Flawless row in both `rows` and the `ys` placement (`i++`), or the Flawless/menu rows shift onto it.

### Tests
None (UI only; no core rule added).

## Dropped (by hand, 2026-10-30)

Cancelled by the player with the whole of E8 (a run you can show). Do not re-task it or the shared-seed replay.
