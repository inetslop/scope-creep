---
id: T0226
title: "A layout check in the smoke test: overlapping text and text leaving its card fail the gate"
size: L
priority: 2
status: todo
depends_on: [T0222, T0223, T0224, T0225]
attempts: 0
created: 2026-10-29T17:39:04Z
---

## Goal
Screens keep growing overlaps: on the Rewards card, the tech cards, the start screen and the wave preview, text ran past its card or into the next line, and nothing caught it. Each task added a line at a hand-picked offset, and the smoke test only checks the game's state, never what is on screen. Add a layout check that the smoke test runs at both of its sizes (1280x720 and 412x915), so a task that makes text overlap, or leave its card or the screen, fails its own gate with a message that says exactly what overlaps.

This task comes after T0222-T0225, which fix the four screens above, so the check lands passing.

## Details
- **The check (`src/debug/layoutCheck.ts`):** given a scene, it returns its problems as strings:
  - **Text leaves its card:** a visible text (visible, alpha above 0, inside a visible container) that belongs to a card reaches past the card's edge.
  - **Text overlaps text:** two visible texts on the same card overlap (bounding boxes intersecting by more than 1 px).
  - **A screen part overlaps another or leaves the screen:** on a full screen (the start screen, Tech, Rewards, Game over), two top-level parts overlap (cards, buttons and texts; not the decorative demo road or drifting shapes), or one reaches past the screen's edge. The exception is the Tech panel while it scrolls (it is taller than the screen on purpose). Inside the panel the rules still hold.
  - Each problem names the screen, the size, the state and the two texts by their first words, e.g. `Menu 412x915 four runs: "Recent W13 +64" overlaps "Build towers beside the road."`.
- **Finding cards:** `makeCard` (`src/ui/card.ts`) marks the image it makes as a card with its width and height (e.g. `setData`), so the check finds cards without guessing. A button's card counts as a card: its label must fit inside it.
- **A tour of the screens at boot, under `?smoke` only:**
  - Before the run starts, `BootScene` opens each full screen in turn, filled with prepared data, then runs the check and pushes every problem to `hook.errors` (prefix `layout: `). The smoke test already fails on `hook.errors`.
  - The states to visit:
    - the start screen with a fresh profile;
    - the start screen after four or more runs (3-digit coins, a best run so Ghost shows, a saved run so Resume shows);
    - Tech with nothing bought, and with everything bought;
    - Rewards after a long run (a 5-digit score, a 4-digit stopped count, 3-digit coins) and after a short one;
    - Game over.
  - Each screen's entrance tweens and count-ups are completed straight away (not waited for), so the check sees the final layout.
  - The screens' own `?smoke` auto-advance (the start screen's auto-Play, the Rewards and Game over timers) must not fire during the tour.
  - The tour leaves `localStorage` and the registry exactly as it found them, so the run that follows is the same seeded run as before. It must finish well inside the smoke test's 10 s wait for the Game scene (aim for under 3 s on a slow machine).
- **During the run:** an invariant in `src/debug/runChecks.ts` runs the check on the draft and pause overlays while they are open, and on the HUD's cards (the wave preview card and the others built with `makeCard`). Floating pops and other text that isn't on a card are left out: they overlap on purpose.
- **What the check finds in other screens:** if it finds a real problem in a screen outside T0222-T0225 (the draft, pause, Game over, the HUD), fix it in this task when the fix is small (a position or a size). Never weaken the check to pass. If a fix would be big, name it in your result.
- **Document it:** add the layout check to the contract comment at the top of `src/debug/testHook.ts`, next to the invariants.

## Acceptance criteria
- [ ] `npm run check` and the smoke test pass on the game as it is after T0222-T0225.
- [ ] Moving any line of the start screen's profile card 20 px down (a quick local test, then reverted) makes the smoke test fail with a `layout:` message naming both texts.
- [ ] The tour runs at both smoke sizes, covers every state listed above, and leaves the seeded run unchanged (same seed, same first wave).
- [ ] No problems are reported for floating pops, the demo road or the drifting shapes.

## Design (architect, desktop)

### Files
- create `src/debug/layoutCheck.ts` — the layout check: `checkLayout(scene, ctx): string[]` plus exported `Rect`, `LayoutPart`, `LayoutContext`, `cardParts(scene)`.
- create `src/debug/layoutTour.ts` — the boot tour: `runLayoutTour(boot: Phaser.Scene): Promise<void>`; prepares data, opens each full screen, settles animations, checks, restores.
- edit `src/ui/card.ts` — add `markCard(img, w, h)` (sets data `card: true`, `cardW`, `cardH`); `makeCard` calls it on the image it makes.
- edit `src/ui/button.ts` — one line: `markCard(card, width, height)` after the card image is created (import `markCard` from `./card`).
- edit `src/debug/flags.ts` — add field `touring: false` with the comment "True while the boot layout tour has a screen open: the smoke auto-advance must not fire."; drop `as const` (the field must stay assignable).
- edit `src/scenes/BootScene.ts` — under `flags.smoke`: `void runLayoutTour(this).then(() => this.scene.start(SCENES.game));` instead of `this.scene.start(...)`; keep the non-smoke branch as is.
- edit `src/scenes/MenuScene.ts` — line 169: `if (flags.smoke && !flags.touring) this.time.delayedCall(500, play);`
- edit `src/scenes/RewardsScene.ts` — line 117: `if (flags.smoke && !flags.touring) this.time.delayedCall(1500, menu);`
- edit `src/scenes/GameOverScene.ts` — line 83: `if (flags.smoke && !flags.touring) this.time.delayedCall(1500, again);`
- edit `src/debug/runChecks.ts` — import `checkLayout` from `./layoutCheck`; add two invariant lines right after `['draft.offer', ...]` (line 53): `['layout.overlay', ...]` and `['layout.hud', ...]`.
- edit `src/debug/testHook.ts` — one sentence in the contract comment: under `?smoke` the boot tours the full screens with prepared data and adds `layout:` errors for overlapping text, text leaving its card, parts overlapping or leaving the screen; in a run the draft/pause overlays and the HUD cards are checked the same way (`debug/layoutCheck.ts`).

### Interfaces
```ts
// layoutCheck.ts
export interface Rect { left: number; top: number; right: number; bottom: number }
export interface LayoutPart { obj: Phaser.GameObjects.GameObject; kind: 'card' | 'text'; rect: Rect; name: string }
export interface LayoutContext {
  screen: string;          // 'Menu' | 'Tech' | 'Rewards' | 'GameOver' | 'Hud' | 'Draft' | 'Pause'
  state: string;           // 'a fresh profile', 'four runs', 'wave 5', ...
  fullScreen?: boolean;    // also check part-vs-part overlap and leaving the screen
  ignoreOffscreen?: (part: LayoutPart) => boolean; // the Tech panel while it scrolls
}
export function checkLayout(scene: Phaser.Scene, ctx: LayoutContext): string[];
export function cardParts(scene: Phaser.Scene): LayoutPart[]; // card images (makeCard/makeButton marks), world rects
// layoutTour.ts
export function runLayoutTour(boot: Phaser.Scene): Promise<void>; // never rejects
// runChecks.ts, after the 'draft.offer' line:
['layout.overlay', (g) => {
  if (hook.overlay !== SCENES.draft && hook.overlay !== SCENES.pause) return null;
  const s = g.scene.get(hook.overlay);
  if (!s.sys.isActive()) return null;
  return checkLayout(s, { screen: hook.overlay, state: `wave ${g.run.wave}` }).join('; ');
}],
['layout.hud', (g) => {
  const hud = g.scene.get(SCENES.hud);
  if (!hud.sys.isActive()) return null;
  return checkLayout(hud, { screen: 'Hud', state: `wave ${g.run.wave}` }).join('; ');
}],
```
Messages: `` `${screen} ${w}x${h} ${state}: ${detail}` `` with detail `"A" overlaps "B"`, `"A" leaves its card ("B")`, `"A" leaves the screen"; w/h from `viewSize(scene)`, rounded. Part name: first line of the text, first 4 words, max 40 chars (fallback `text@x,y`); a card is named by the first text inside it (fallback `card@x,y`).

### Steps
1. **`ui/card.ts` / `ui/button.ts`:** `markCard(img, w, h)` = `img.setData('card', true).setData('cardW', w).setData('cardH', h)`; call it in `makeCard` and once in `makeButton` (the button's background image).
2. **`layoutCheck.ts`:** walk `scene.children.list` recursively (a `Container`'s children are in `.list`; button labels sit two levels deep — `children.getAll()` does not recurse). Parts: visible (`visible && worldAlpha > 0`) non-empty `Text` objects, and `Image`s with `getData('card')`. World rect = the 4 corners of the local rect through `getWorldTransformMatrix()` — texts use local `(-originX * width, -originY * height, width, height)`; cards use `(-cardW/2, -cardH/2, cardW, cardH)` — never `displayWidth` (the card texture carries 18 px of shadow pad per side at 3x). Text "belongs to" the smallest-area card whose rect contains its center; un-owned texts are free-standing. Rules: (a) owned text past its card edge by > 2 px → leaves-its-card; (b) two texts on the same card intersecting by > 1 px on both axes → overlaps; (c) only when `fullScreen`: among parts (cards + free texts), two rects intersecting by > 1 px on both axes and neither center inside the other → overlaps; a part past the screen rect by > 1 px and not `ignoreOffscreen(part)` → leaves the screen. Decorations (demo road, drifters, icons, graphics) are never parts: only marked images and texts are.
3. **`layoutTour.ts`:** `flags.touring = true`; snapshot all `localStorage` keys and all `boot.registry` entries (by reference). Steps in order, each `prepare()` writes data, then `boot.scene.launch(key)`, await `Phaser.Scenes.Events.CREATE` (attach the listener in the same synchronous block as `launch`), settle, `checkLayout` with `fullScreen: true` (plus the Tech exemption), push problems to `hook.errors` with prefix `layout: `, `boot.scene.stop(key)`. Then in `finally`: restore storage and registry, `flags.touring = false`. Wrap the whole loop in try/catch: on throw push `layout: the tour failed: ${err}` — the game must still start.
   - Settle without waiting: `const t = performance.now() + 300_000; scene.tweens.update(t, 60_000); scene.tweens.update(t + 60_000, 60_000);` (the large `time` gets pending tweens past their delays; the second pass finishes yoyo legs and complete callbacks), then 20× `(scene as ... & { update?: (t: number, d: number) => void }).update?.(0, 50)` (the Rewards count-up clamps to 50 ms/call, so 20 calls reach its 1.0 s end).
   - Data (exact): profile under `PROFILE_KEY`, saved run under `SAVED_RUN_KEY`. Fresh: remove both. Four runs: `{ bestWave: 21, bestSeed: 7, runsPlayed: 5, coins: 143, purchased: [], lastRun: { wave: 9, coins: 34 }, recent: [{ wave: 9, coins: 34 }, { wave: 13, coins: 57 }, { wave: 21, coins: 88 }, { wave: 7, coins: 29 }], sound: true }` + saved run `{ v: 1, seed: 7, cols: 14, rows: 8, gold: 40, lives: 20, wave: 6, phase: 'build', hand: [], kills: 31, cleanWaves: 2, rerollUsed: false, towers: [] }` (shows Ghost, Resume, 3-digit coins). Tech: that profile with `purchased: []` ("nothing bought"), then with `purchased` = every id from `TECH_NODES`, `DRAFT_NODES`, `POOL_NODES`, `CLAIM_NODES` and `coins: 27` ("everything bought"). Rewards: profile `lastRun: { wave: 104, coins: 245 }` + registry `'run'` = `new RunState(7)` with `phase = 'over'`, `wave = 105`, `kills = 1234`, `cleanWaves = 18`, `bestCombo = 12` (5-digit score, 4-digit stopped, 3-digit coins); short: `lastRun: { wave: 3, coins: 5 }`, run `wave = 4, kills = 24`. GameOver: profile `{ bestWave: 40, coins: 60, lastRun: { wave: 9, coins: 31 }, ... }`, run `wave = 13, kills = 87, cleanWaves = 5`, registry `'towerKills'` = `[{ first: 'frost', kills: 41 }, { first: 'bolt', kills: 17 }, { first: 'spray', kills: 9 }]`.
   - Tech exemption: `ignoreOffscreen = (part) => { const cards = cardParts(part.obj.scene as Phaser.Scene); const panel = cards.reduce((a, b) => (area(a.rect) > area(b.rect) ? a : b)); return panel === part || centerOf(part.rect) inside panel.rect; }` (the panel is the biggest card; node cards and the Menu button sit inside it).
   - State labels: `a fresh profile`, `four runs`, `nothing bought`, `everything bought`, `a long run`, `a short run`, `after a lost run`.
4. **`BootScene.ts`, `flags.ts`, the three scene lines** as in Files.
5. **`runChecks.ts` + `testHook.ts`** as in Files.
6. **Negative test:** in `ProfileCard.ts` move the `runs` line 20 px down (y 24 → 44), run `npm run smoke`, confirm it fails with a `layout: Menu ... four runs:` message naming both texts, revert.

### Pitfalls
- Use the stored `cardW`/`cardH` for card rects, not `displayWidth` (shadow pad makes it ~6 px too permissive per side).
- Recursive walk only: button labels live in `container > content > label`; a non-recursive `getAll()` misses them and the check goes blind.
- `tweens.update(t, ...)` needs `t > performance.now()` or pending tweens' delay test (`time - startAt >= delay`) never passes; call it twice for yoyo/repeat legs. The Play button's infinite breathing tween is left as-is — its state after the two fixed passes is deterministic.
- The Draft's flip tween is safe: card and its texts scale together and `button.content` is hidden until the card is face-up, so the in-run check is valid from the first frame — do not delay the invariant.
- Restore in `finally` and by reference (the registry's `sfx` instance): the GameOver step calls `recordRun`, which rewrites the profile mid-tour.
- RewardsScene reads `Board.TEXTURE`, which does not exist before the first run: that is a `console.warn` (not an error) and the missing 1 px texture behind the 0.78 shade is neither card nor text — do not "fix" it.
- Never weaken the check to pass. If the smoke run reports a `layout:` problem in a screen this task does not tour (draft, pause, HUD), fix that screen's position or size (one line) and say so in your result; name any fix that is not small.
- Keep the tour under ~3 s: 7 steps × (1 wait-frame + synchronous work); do not add real-time waits.

### Tests
- none (debug/UI; no `src/core` rule changes). Acceptance is `npm run check`, the smoke test at both sizes, and the 20-px negative test in Step 6.
