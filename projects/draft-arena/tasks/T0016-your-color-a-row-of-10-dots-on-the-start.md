---
id: T0016
title: "Your color: a row of 10 dots on the start screen"
assignee: desktop-4070
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-31T03:51:35Z
claimed_at: 2026-10-31T05:10:30Z
epic: E5
---

## Goal
A player makes their critter theirs: they pick one of the 10 colors on the start screen and keep it for their next visit. First slice of E5: the smallest version that works end to end — a pick, saved, seen by everyone in the match.

## Details
- The start card gets one of its own panels (a new menu part: its own file and its own .css, listed in MENU_PARTS, the same way the start screen's panels work): a white sticker card labeled **Color**, above Play.
- The card shows the current pick: a dot in the picked color, or the word **Random** if the player has not picked.
- Tapping it opens a bigger panel over the start screen (the start card's button-opens-panel pattern): the player's critter preview (the engine already previews the player's critter), and 11 choices — the 10 player colors from rules.playerColors as dots, plus a **Random** choice. Tapping a dot picks it at once: the preview updates and the pick is saved in the profile. Tapping the card again closes the panel.
- The pick is the player's own: it does not change any other player's or bot's color.
- In the match, the player's critter is that color for everyone in the match, every life. With **Random**, the game picks a color as it does today.
- The pick is kept in the profile (the player's own browser) and survives a reload and the next visit; a new browser or cleared data is **Random**.
- Layout: the card is at least 44 px tall on a phone; in the panel the dots wrap to at most 2 rows and the card sizes itself from its lines; the panel sits over the start screen without covering the name field or Play; it fits at 412x915 and 1280x720. Nothing new on the in-match HUD — the color shows on the critter itself, on the field (the screen shows the color nowhere today, so nothing is shown twice).

## Acceptance criteria
- [ ] The start card shows a new white sticker card labeled "Color" above Play: a dot in the picked color, or the word "Random".
- [ ] Tapping it opens a bigger panel with the player's critter preview, the 10 color dots and a Random choice; tapping a dot updates the preview and saves the pick; tapping the card again closes the panel.
- [ ] In the match, the player's critter is that color for everyone in the match, every life; with Random the game picks a color as today.
- [ ] Reload the page in the same browser: the pick is still there; in a fresh browser it is Random.
- [ ] It fits at 412x915 and 1280x720: the card is at least 44 px tall on a phone, the dots wrap to at most 2 rows, the panel does not cover the name field or Play, and no in-match HUD element is added or changed.

## Design (architect, cachyos-x8664)

### Files
- create `src/menu/color.ts` — `ColorPart` class + `export const color: MakeMenuPart`
- create `src/menu/color.css` — the part's own classes only (never edit `base.css` or another file)
- edit `src/menu/index.ts` — one import line + one registry line: `MENU_PARTS` becomes `[color]`

### Interfaces (frozen, in `engine/api.ts`)
- `MakeMenuPart = (root: HTMLElement) => MenuPart`; `root` is the `.menu-parts` slot div; `root.parentElement` is the `.menu-card` (parent `#menu`, which sets `--ink: #3b3355` and hides children on `[hidden]`).
- `MenuPart = { update(view: MenuView): void }` — runs on `show()` and after every buy/wear/color change.
- `MenuView`: `profile.color: number | undefined` (**0-based**; `undefined` = Random), `colors: readonly string[]` (the 10, 0-based), `setColor(i: number | undefined)` (saves to the profile + microtask refresh), `preview(canvas, wearing?, color?)` (`color` 0-based; omitted = use the profile's).
- Do NOT touch persistence or the server: `ProfileStore.setColor` already saves `draft-arena:profile`; join already sends `profile.color`; the server honors it and `respawn` keeps `p.color` every life. A fresh browser has `color: undefined` = Random.

### Steps
1. Write `src/menu/color.ts` exactly:
```ts
import './color.css';
import type { MakeMenuPart, MenuView } from '../../engine/api.ts';

class ColorPart {
  private built = false;
  private open = false;
  private view!: MenuView;
  private dot!: HTMLElement;
  private word!: HTMLElement;
  private panel!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  constructor(private readonly slot: HTMLElement) {}
  update(v: MenuView): void {
    this.view = v;
    if (!this.built) {
      this.built = true;
      const card = document.createElement('button');
      card.className = 'color-card';
      this.dot = document.createElement('span');
      this.dot.className = 'color-dot';
      this.word = document.createElement('span');
      this.word.className = 'color-word';
      this.word.textContent = 'Random';
      const name = document.createElement('span');
      name.className = 'color-name';
      name.textContent = 'Color';
      card.append(this.dot, this.word, name);
      card.addEventListener('click', () => {
        this.open = !this.open;
        this.panel.hidden = !this.open;
        if (this.open) this.view.preview(this.canvas);
      });
      this.slot.append(card);
      this.panel = document.createElement('div');
      this.panel.className = 'color-panel hud-card';
      this.panel.hidden = true;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'color-preview';
      this.canvas.width = 320;
      this.canvas.height = 140;
      const choices = document.createElement('div');
      choices.className = 'color-choices';
      v.colors.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'color-choice';
        b.style.background = c;
        b.setAttribute('aria-label', `Color ${i + 1}`);
        b.addEventListener('click', () => this.view.setColor(i));
        choices.append(b);
      });
      const random = document.createElement('button');
      random.className = 'color-choice color-random';
      random.textContent = 'Random';
      random.setAttribute('aria-label', 'Random color');
      random.addEventListener('click', () => this.view.setColor(undefined));
      choices.append(random);
      this.panel.append(this.canvas, choices);
      this.slot.parentElement?.append(this.panel);
    }
    const c = v.profile.color;
    this.dot.style.display = c === undefined ? 'none' : '';
    if (c !== undefined) this.dot.style.background = v.colors[c]!;
    this.word.style.display = c === undefined ? '' : 'none';
    if (this.open) v.preview(this.canvas);
  }
}
export const color: MakeMenuPart = (slot) => new ColorPart(slot);
```
2. Write `src/menu/color.css` exactly:
```css
.color-card { box-sizing: border-box; min-height: 44px; display: flex; align-items: center; gap: 8px; padding: 8px 14px; border: 3px solid #3b3355; border-radius: 14px; background: #fff; color: #3b3355; font: inherit; font-size: 16px; font-weight: 700; text-align: left; cursor: pointer; box-shadow: 3px 4px 0 #3b3355; transition: transform 0.08s, box-shadow 0.08s; }
.color-card:hover { transform: translate(-2px, -2px); box-shadow: 5px 6px 0 #3b3355; }
.color-card:active { transform: translate(2px, 3px); box-shadow: 1px 1px 0 #3b3355; }
.color-dot { display: inline-block; width: 18px; height: 18px; border: 2px solid #3b3355; border-radius: 50%; }
.color-word { color: #7a7193; }
.color-panel { position: fixed; top: 24px; left: 50%; transform: translateX(-50%); width: min(92vw, 360px); }
.color-preview { display: block; width: 100%; height: 140px; }
.color-choices { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; margin-top: 8px; }
.color-choice { width: 44px; height: 44px; border: 3px solid #3b3355; border-radius: 12px; cursor: pointer; box-shadow: 2px 3px 0 #3b3355; }
.color-choice:active { transform: translate(1px, 2px); box-shadow: 1px 1px 0 #3b3355; }
.color-random { width: 72px; font-size: 14px; font-weight: 700; color: #3b3355; }
```
3. Make `src/menu/index.ts` exactly: `import { color } from './color.ts';` (after the api import) and `export const MENU_PARTS: readonly MakeMenuPart[] = [color];`
4. `npm run check`.

### Pitfalls
- `this.view` is set as the first statement of `update`; every handler reads `this.view`, never a captured `v`, so a pick always lands on the latest profile.
- All indices 0-based: `profile.color`, `v.colors[i]`, `setColor(i)`; `undefined` = Random.
- Never redraw by hand: `setColor` triggers a microtask refresh that re-runs `update`, which re-syncs the card dot and redraws the open preview.
- Build the DOM once, guarded by `this.built`, inside the first `update` (a `MenuPart` is called only via `update`, so `view` exists only there).
- Append the panel to `slot.parentElement` (the `.menu-card`), not `document.body`: `#menu [hidden] { display: none !important }` hides it with the menu, and `.hud-card`'s `var(--ink)` (from `#menu`) resolves.
- `dot.style.display = ''` (not `'block'`) restores the CSS `inline-block`; a fresh browser shows the word "Random".
- Canvas buffer `320x140` (what `preview` reads); CSS stretches it to 100%/140px.
- Layout: panel is `fixed, top 24px, width min(92vw,360px)`; 11 choices (10 dots 44x44 + Random 72px) flex-wrap to 6+5 = at most 2 rows; card `min-height 44px`; panel bottom (~280px) never reaches the name field or Play at 412x915 or 1280x720.
- No in-match HUD change: the color already shows on the critter via the existing join/respawn pipeline.
- Ink is only `#3b3355` (the menu's `--ink`); solid offset shadows, no glow/gradient; Fredoka is inherited from `#menu`.

### Tests
none (DOM part; the store it uses is already covered by `engine/tests/profile.test.ts`).
