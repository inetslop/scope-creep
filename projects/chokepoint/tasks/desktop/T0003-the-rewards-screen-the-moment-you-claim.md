---
id: T0003
title: "The rewards screen: the moment you claim what a run earned"
assignee: desktop
size: L
priority: 1
status: todo
depends_on: [T0001]
attempts: 0
created: 2026-10-28T01:07:07Z
epic: E1
---

## Goal
A run ends with a satisfying claim moment: after game over, the player opens a dedicated rewards screen that counts up what the run earned.

## Details
- The game-over card gains a new primary button "Claim rewards" (same visual weight as the existing restart button, placed first). The existing buttons stay.
- A new Rewards scene: the board behind is dimmed; one large white rounded card centered:
  - "Waves held" — the number counts up from 0 to the final value over ~0.6s
  - "Stopped" — counts up the same way, starting when the first does
  - a coin line: a yellow coin icon (rounded circle) and the coins-earned number counting up over ~1s, ending on the final value
  - a "Menu" button below
- The scene reads the stored run result from T0001's ledger; it never recomputes anything.
- No new keys; the Menu button (click or tap) is the only input and returns to the menu.

## Acceptance criteria
- [ ] From the game-over card, "Claim rewards" opens the rewards scene; "Menu" returns to the main menu with the profile updated.
- [ ] The three numbers match the game-over card lines exactly (waves held, stopped, +N coins).
- [ ] The numbers count up (not instant): mid-count the value is visibly lower.
- [ ] The card is centered and fully visible at 412x915 (portrait) and 1280x720; nothing overlaps the card.
- [ ] Restarting from the rewards scene is still possible via Menu → start.

## Design (architect, desktop)

### Files
- create `src/scenes/RewardsScene.ts` - overlay scene: dimmed board, one white card, count-up numbers, Menu button
- edit `src/scenes/keys.ts` - add `rewards: 'Rewards',` to `SCENES` after `gameOver`
- edit `src/main.ts` - import `RewardsScene` (after `PauseScene` import) and append it to the scene array, after `GameOverScene` (draws on top)
- edit `src/scenes/GameOverScene.ts` - new "Claim rewards" primary button (first) + taller card (apply to T0001's version of the file)
- edit `docs/ARCHITECTURE.md` - scene graph: `└─start──> GameOver -> Game | Menu` becomes `└─start──> GameOver -> Game | Menu` + new line `             └─claim-> Rewards -> Menu`

### Interfaces
No new types. RewardsScene uses T0001's ledger (imports from `core/profile`, which T0001 creates):
```ts
const lastRun = loadProfile(window.localStorage).lastRun; // { wave: number; coins: number } | null
```
`src/scenes/RewardsScene.ts`: `export class RewardsScene extends Phaser.Scene { constructor(); create(): void; update(_time: number, deltaMs: number): void; }`

### Steps
1. `keys.ts`: one line `rewards: 'Rewards',` after `gameOver`.
2. Create `RewardsScene.ts` modeled on `PauseScene.ts`. `create()`: `uiCamera(this)`; `hook.scene = SCENES.game; hook.overlay = SCENES.rewards`; `setBackgroundColor(cssColor(PALETTE.ground))`. Read the numbers, never recompute:
```ts
const run = getRun(this);
const lastRun = loadProfile(window.localStorage).lastRun;
const waves = lastRun ? lastRun.wave : run.wavesCleared;
const stopped = run.kills; // the ledger stores no stopped count; the card printed run.kills
const coins = lastRun ? lastRun.coins : coinsForRun({ waves: run.wavesCleared, stopped: run.kills, clean: run.cleanWaves });
```
Background: full-screen interactive shade `PALETTE.ground, 0.78` (setOrigin(0), like PauseScene) at depth 1; behind it, the run's board as a static image at depth 0 (GameScene is stopped at game over — never relaunch it, that starts a new run): `artScale(this.add.image(0, 0, Board.TEXTURE), k * ART)` with `k = Math.min((width - 16) * display.ratio / this.textures.get(Board.TEXTURE).width, (height - 16) * display.ratio / this.textures.get(Board.TEXTURE).height)`, origin 0.5, centered — refit inside `layout()`.
Card: `makeCard(this, 0, 0, 360, 300, 28)`; container depth 2 with children in order: panel, title `Rewards` (titleStyle(32), y -98), wavesText (y -44), stoppedText (y -8), both titleStyle(22) origin 0.5, coinText (y 44, titleStyle(28, PALETTE.goldText)) with `coinIcon = artScale(this.add.image(0, 44, COIN_TEXTURE), 1.5)`, and `menuButton = makeButton(this, 0, 108, 'Menu', menu, { width: 240, height: 52, radius: 26 })`. `menu`: `hook.overlay = ''; this.scene.stop(SCENES.hud); this.scene.stop(SCENES.game); this.scene.start(SCENES.menu);` (mirrors PauseScene.quit; the stops are no-ops but keep the pattern). `layout(w, h)`: shade size + hitArea, board refit, `box.setPosition(w/2, h/2).setScale(Math.min(1, (w - 24) / 360, (h - 24) / 300))`; call once + `onResize(this, layout)`. No `onKey` (Menu button is the only input). `if (flags.smoke) this.time.delayedCall(1500, menu);`
`update(_time, deltaMs)`: `elapsed += Math.min(deltaMs / 1000, 0.05)`; `k = Math.min(1, elapsed / 0.6)`, `kc = Math.min(1, elapsed / 1.0)`; `wavesText.setText(\`Waves held ${Math.round(waves * k)}\`)`, `stoppedText.setText(\`Stopped ${Math.round(stopped * k)}\`)`, `coinText.setText(\`+${Math.round(coins * kc)} coins\`)`, then `coinIcon.setX(-coinText.width / 2 - 33)` every frame (row stays centered as the number widens).
3. `main.ts`: import + one array entry, after `GameOverScene`.
4. `GameOverScene.ts` (T0001's version): `panelH` 380 → 480; y-positions: title -178, waveText -130, score -100, the four stat lines -71/-54/-37/-20, bestText 8, then `const claim = (): void => { this.scene.start(SCENES.rewards); };` + `makeButton(this, 0, 70, 'Claim rewards', claim, { width: 240, height: 56, radius: 28, fill: PALETTE.ink })` (same options as the restart button), 'Play again' at 134, 'Menu' at 196; add `claimButton.container` to the box before the other buttons. Keep the `flags.smoke` 1500 ms auto-restart and the Enter/Space hotkey as they are.
5. `docs/ARCHITECTURE.md`: the graph line.
6. `npm run check`.

### Pitfalls
- `scene.start(key)` stops the calling scene (why claim needs no self-stop, why the menu mirrors PauseScene.quit) — never use `scene.launch` here or the caller lingers underneath.
- The board is a static texture copy: towers are sprites, not in the texture — that is acceptable; the texture persists game-wide and is only repainted by a next run (unreachable while rewards is open).
- `lastRun` is null in private mode/corrupt storage → the fallback path must print the same three numbers the card printed (same inputs as `recordRun`).
- Count-up is dt-accumulated, never tweens or frame counts; at k=1 the value is exactly the final number.
- Both cards scale to exactly 1 at 412x915 and 1280x720 with these sizes (360x480, 360x300) — re-verify if you change any.
- No Sfx (coin chime is T0009), no new keys, no invariant (invariants are cleared when GameScene shuts down, before rewards is ever reachable), no new art (COIN_TEXTURE exists).
- GameOverScene is T0001's file — work from its post-merge state; if the four stat lines or `recordRun` call are missing, T0001 has not landed (the task must wait).

### Tests
none
