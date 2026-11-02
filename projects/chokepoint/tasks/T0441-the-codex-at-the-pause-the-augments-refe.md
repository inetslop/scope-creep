---
id: T0441
title: "The codex at the pause: the augments reference row"
assignee: asus
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-02T19:42:29Z
claimed_at: 2026-11-02T20:40:45Z
---

## Goal
The pause's reference set covers enemies, waves, bosses, coins, boards and the run's loop — but the only reference for the game's core pick, the augments (the codex), is menu-only: a player mid-run checking what a held card combines with must end the run. The pause gains an "Augments" row that opens the existing codex over the dimmed pause, in the How row's cross-context pattern (How is on the menu and on the pause) — the reference set gets the family the draft is about.

## Details
- **The row:** a new "Augments" row in the pause card's reference rows, the Enemies/Waves/Bosses/Coins/Boards/How rows' own pattern (T0252: its own row, plus a matching line in the controls list). Word "Augments" — the rows' own single-noun vocabulary.
- **From the pause:** the codex opens over the dimmed pause (the pause reference scenes' pattern, T0252's EnemiesScene) and its back returns to the pause — the run exactly as it was (a mid-wave pause and a mid-build countdown both survive the round trip). The scene takes where it was opened from (a scene parameter, not a global flag); the menu's path stays byte-identical to today: dimmed menu, back to the menu.
- **The content is unchanged:** the codex's cards, order, tier reads and fit are exactly T0221's (and T0248's lock on the gated cards, once it lands) — this task adds a door, not a new screen.
- **Nothing shown twice:** the pause has no augments reference today; the row is that reference in-run, and the menu's codex stays (one content, two contexts — the How row's own precedent, not a second button in one screen).
- **It fits:** one more row in the pause card's even column (the column grows the way T0245's does); the codex card is the menu's card, already fitted at 412x915 and 1280x720.
- No new HUD element, sound, key or board mark; no change to the codex's content or to the menu.

## Acceptance criteria
- [ ] The pause card wears an "Augments" row with a matching line in the controls list; tapping it opens the codex over the dimmed pause, and its back returns to the pause with the run exactly as it was (a mid-wave pause and a mid-build countdown both survive the round trip).
- [ ] The menu's codex button behaves exactly as before (dimmed menu, back to the menu, the same cards in the same order).
- [ ] The codex's cards, tier reads and fit are byte-identical in both contexts; with the gated-augment lock present (T0248) it shows there too.
- [ ] The pause card fits at 412x915 and 1280x720 with the new row (the column grows, nothing overlaps — the layout check).
- [ ] A run that never opens the row is byte-identical to before; `npm run check` and the desktop + mobile smoke pass.

## Design (architect, desktop)

### Files
- edit `src/scenes/PauseScene.ts` — the "Augments" reference row: one line in `CONTROLS`, one button + callback in the row column, card height, placement, `boxKids`
- edit `src/scenes/CodexScene.ts` — `create` takes the opening context as a scene parameter; `doBack` returns to the pause when opened from there, byte-identical menu path otherwise

No new files, no registry lines, no `main.ts` change (CodexScene is already registered). MenuScene.ts is NOT touched.

### Interfaces
`src/scenes/CodexScene.ts` — the only signature change:
```ts
create(data?: { from?: string }): void   // was: create(): void; data.from is the scene opened over (SCENES.pause); the menu opens with no data
```
`src/scenes/PauseScene.ts` — no signatures change; `this.scene.launch(SCENES.codex, { from: SCENES.pause })` (launch's data param is untyped, no import needed).

### Steps
1. **CodexScene.ts line 34**: change `create(): void {` to `create(data?: { from?: string }): void {`. Touch nothing else in the file (build/rebuild/layout/shade/smoke 800 ms back all stay; T0248 also edits this file — keep the diff to this step and step 2).
2. **CodexScene.ts lines 40-46**, replace `doBack` with:
```ts
    const doBack = (): void => {
      if (this.closed) return;
      this.closed = true;
      getSfx(this)?.blip();
      // Opened from the pause's Augments row: back to the pause, the run staying paused —
      // GameScene is paused, not the pause card. The menu opens with no data, and Phaser keeps
      // a scene's last launch data across launches, so a stale pause data from an earlier
      // in-run visit must not send a menu open back to a stopped run: the pause counts only
      // while it is actually paused under the codex.
      if (data?.from === SCENES.pause && this.scene.isPaused(SCENES.pause)) {
        hook.overlay = SCENES.pause;
        this.scene.start(SCENES.pause); // the run stays paused: GameScene is paused, not the pause card
      } else {
        hook.overlay = '';
        this.scene.start(SCENES.menu);
      }
    };
```
The `else` branch is today's two lines, unchanged.
3. **PauseScene.ts `CONTROLS`**: add one line after `'Boards — the gates, chokes and folds a board can have',`: `'Augments — the cards and what they combine',`.
4. **PauseScene.ts**: after the `boardsButton` line (line 226), insert the row, copying the other rows' exact shape:
```ts
    const showAugments = (): void => {
      if (closed) return;
      this.scene.launch(SCENES.codex, { from: SCENES.pause });
      this.scene.pause(); // the pause card's Escape key must not fire under the reference
    };
    const augmentsButton = makeButton(this, 0, 0, 'Augments', showAugments, { width: 240, height: 52, radius: 26 });
```
5. **PauseScene.ts line 233** (card height): the row column is `56 + 9×(GAP_S + 52)`; add one more `+ GAP_S + 52` before the final `+ PAD` (10× now).
6. **PauseScene.ts placement**: after `boardsButton.container.setY(cy(52));` (line 274) add:
```ts
    y += GAP_S;
    augmentsButton.container.setY(cy(52));
```
7. **PauseScene.ts line 276 `boxKids`**: append `augmentsButton.container` after `boardsButton.container` (one item, same style as the others).

### Pitfalls
- **Stale scene data**: `Phaser.Scenes.Systems.start` only writes `settings.data` when the passed data is truthy and `shutdown` never clears it. Sequence pause→codex→quit to menu→menu→codex would otherwise hand the menu-open codex the old `{ from: 'Pause' }` and send back to a stopped run's pause. That is why the check is `data?.from === SCENES.pause && this.scene.isPaused(SCENES.pause)`.
- **Check in `doBack`, not `create`**: `launch` is queued before the pause's `this.scene.pause()`, so at codex `create` time the pause scene is not paused yet; an `isPaused` check there always fails.
- **Menu path stays byte-identical**: do not reformat or "simplify" the else branch; MenuScene.ts keeps its data-less `this.scene.launch(SCENES.codex)`.
- **`boxKids`**: forgetting `augmentsButton.container` leaves the button outside the centered/scaled box (it renders off-card when the box scales down).
- **Order**: the CONTROLS line and the button both go after Boards so the list order and the card column stay in sync and no existing row moves.
- **Run survival** comes for free: GameScene pauses itself in `openPause()`, so the rebuilt pause card (the `scene.start` restart pattern every reference row uses) never touches run state — mid-wave and mid-build countdowns survive.
- **Smoke**: nothing new needed — the codex's existing 800 ms smoke back-out (`flags.smoke`) works in both contexts, and the restart re-arms the pause's 1000 ms smoke resume.

### Tests
none (scene/UI wiring only; no core rule added or changed)
