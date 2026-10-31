---
id: T0017
title: "Two starter hats: a Hats card on the start screen"
assignee: desktop-4070
size: M
priority: 2
status: done
depends_on: []
attempts: 1
created: 2026-10-31T03:51:35Z
claimed_at: 2026-10-31T05:41:34Z
finished_at: 2026-10-31T07:23:50Z
epic: E5
---

## Goal
A player puts a hat on their critter on the start screen and keeps it: two free starter hats for E5 — the first things to wear while the shop (E6) does not exist yet.

## Details
Two new accessories, slot **head**, price 0 (free: everyone owns them, no buying yet):
- **Cone** — a yellow party cone: a tall yellow triangle sitting tilted on the top-right of the head, a red ball at the tip. Description: "A yellow party cone with a red tip."
- **Beanie** — a purple beanie: a purple band and fold across the top of the head, a small pink ball on top. Description: "A purple beanie with a pink pom."
- Both: a clear silhouette at a player's size (36 units across), they never cover the eyes, they reach at most one radius (18 units) above the top of the head (the player's name sits above that), candy colors with ink outlines, no glow.
- The head slot is empty today: there is no existing hat to compare with or recolor.

A new menu part (its own file and its own .css, listed in MENU_PARTS): a white sticker card labeled **Hats**, above Play.
- The card shows what the player is wearing: a small drawing of the hat, or **None** to start.
- Tapping it opens a bigger panel over the start screen: the player's critter preview (the engine already previews the player's critter wearing things), and 3 choices — **None**, **Cone**, **Beanie**, each a small drawing with its name. Tapping a choice wears it at once (preview updates, saved in the profile's "what they wear"); tapping the worn hat takes it off. All three are owned, so the panel shows no prices and no buying.
- In the match, the player's critter wears the hat for everyone in the match, every life. Bots wear the new hats at random, so they show up on the field at once.
- The pick is kept in the profile and survives a reload and the next visit; a new browser is **None**.
- Layout: the card is at least 44 px tall on a phone; the 3 choices fit in one row; the panel sits over the start screen without covering the name field or Play; it fits at 412x915 and 1280x720. Nothing new on the in-match HUD — the hat shows on the critter, on the field.

## Acceptance criteria
- [ ] The start card shows a new white sticker card labeled "Hats" above Play: what the player is wearing, "None" to start.
- [ ] Tapping it opens a panel with the critter preview and the choices None, Cone, Beanie; tapping Cone puts a yellow cone with a red tip on the critter in the preview and saves it; tapping the worn hat takes it off.
- [ ] In the match, the player's critter wears the hat for everyone in the match, every life; at least one bot on the field wears a hat.
- [ ] Reload the page in the same browser: the hat is still worn; in a fresh browser it is "None".
- [ ] The cone and the beanie never cover the eyes, reach at most one radius above the head, and read clearly on a critter at 412x915 and 1280x720.
- [ ] A hat changes nothing in play: the player's hp, speed, radius and pickup range are the same with and without it.

## Design (architect, desktop)

### Files
- create `src/content/accessories/cone.ts` — accessory `id: 'cone'` (yellow party cone, red tip, slot head, price 0)
- create `src/content/accessories/beanie.ts` — accessory `id: 'beanie'` (purple beanie, pink pom, slot head, price 0)
- edit `src/content/accessories/index.ts` — add the two imports and two registry lines (list is currently empty)
- create `src/menu/hats.ts` — the Hats card + picker panel (a `MakeMenuPart`)
- create `src/menu/hats.css` — all styles for that part
- edit `src/menu/index.ts` — add the import and one line to `MENU_PARTS` (currently `[]`)

### Interfaces
No new types: the two files implement the existing `AccessoryDef` (`engine/api.ts:558`) and `MakeMenuPart` (`engine/api.ts:705`). Everything else (persistence in the profile, join wire, roster broadcast, bot dressing) already exists in the engine: `ProfileStore.wear` saves to localStorage, `Menu.preview(canvas, wearing?)` paints the player's critter in their own color, and `botWear()` in `engine/sim/match.ts:177` dresses each bot in a random head accessory with 40% chance (6 bots ⇒ a hat shows up on the field with no content work).

### Compared with what exists
Head slot: empty (no accessory file exists); face: empty; back: empty; patterns: empty. Cone and Beanie are the first two wardrobe items — nothing is recolored, duplicated, or stat-changed; both are pure cosmetic (acceptance: hp/speed/radius/pickup untouched — accessories have no stats in `AccessoryDef`).

### Steps
1. Create `src/content/accessories/cone.ts` exactly:
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A party cone tilted on the top-right of the head, the tip leaning out to the right. */
export const cone: AccessoryDef = {
  id: 'cone',
  name: 'Cone',
  description: 'A yellow party cone with a red tip.',
  slot: 'head',
  price: 0,
  draw(g, w) {
    const r = w.radius;
    g.lineJoin = 'round';
    g.lineWidth = 0.14 * r;
    g.strokeStyle = w.ink;
    // The cone: a tall triangle whose base sits on the rim of the top-right of the head.
    g.beginPath();
    g.moveTo(0.05 * r, -0.998 * r);
    g.lineTo(0.5 * r, -0.866 * r);
    g.lineTo(0.82 * r, -1.75 * r);
    g.closePath();
    g.fillStyle = PALETTE.yellow;
    g.fill();
    g.stroke();
    // The red ball at the tip.
    g.beginPath();
    g.arc(0.84 * r, -1.78 * r, 0.14 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.red;
    g.fill();
    g.stroke();
  },
};
```
2. Create `src/content/accessories/beanie.ts` exactly:
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A beanie over the top of the head: a purple dome and a folded band, a pink pom on top. */
export const beanie: AccessoryDef = {
  id: 'beanie',
  name: 'Beanie',
  description: 'A purple beanie with a pink pom.',
  slot: 'head',
  price: 0,
  draw(g, w) {
    const r = w.radius;
    g.lineJoin = 'round';
    g.lineWidth = 0.14 * r;
    g.strokeStyle = w.ink;
    // The dome, a little wider than the head, over its top.
    g.beginPath();
    g.arc(0, 0, 0.98 * r, Math.PI + 0.7, Math.PI * 2 - 0.7);
    g.closePath();
    g.fillStyle = PALETTE.purple;
    g.fill();
    g.stroke();
    // The folded band across the bottom of the dome.
    g.beginPath();
    g.rect(-0.72 * r, -0.84 * r, 1.44 * r, 0.3 * r);
    g.fillStyle = PALETTE.purple;
    g.fill();
    g.stroke();
    // Ribs in the band.
    g.lineWidth = 0.06 * r;
    for (const x of [-0.45, -0.15, 0.15, 0.45]) {
      g.beginPath();
      g.moveTo(x * r, -0.8 * r);
      g.lineTo(x * r, -0.58 * r);
      g.stroke();
    }
    // The pom on top.
    g.lineWidth = 0.14 * r;
    g.beginPath();
    g.arc(0, -1.25 * r, 0.32 * r, 0, Math.PI * 2);
    g.fillStyle = PALETTE.pink;
    g.fill();
    g.stroke();
  },
};
```
3. Edit `src/content/accessories/index.ts` — full new content:
```ts
import type { AccessoryDef } from '../../../engine/api.ts';
import { beanie } from './beanie.ts';
import { cone } from './cone.ts';

/** Everything players can wear on their head, face or back (hats and more). One per line. */
export const ACCESSORIES: readonly AccessoryDef[] = [
  cone,
  beanie,
];
```
4. Create `src/menu/hats.ts` exactly:
```ts
import type { MakeMenuPart, MenuView } from '../../engine/api.ts';
import './hats.css';

/** The Hats card on the start screen and its picker panel (None, Cone, Beanie). */
export const hats: MakeMenuPart = (root) => {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'hats-card';
  card.innerHTML = '<span class="hats-card-label">Hats</span><span class="hats-card-current">None</span><canvas class="hats-card-mini" width="44" height="44"></canvas>';
  root.append(card);
  const mini = card.querySelector<HTMLCanvasElement>('.hats-card-mini')!;
  const current = card.querySelector<HTMLElement>('.hats-card-current')!;

  const panel = document.createElement('div');
  panel.className = 'hats-panel';
  panel.hidden = true;
  panel.innerHTML =
    '<div class="hats-panel-head"><span>Hats</span><button class="hats-close" type="button" aria-label="Close">×</button></div>' +
    '<canvas class="hats-preview" width="140" height="140"></canvas>' +
    '<div class="hats-choices">' +
    '<button class="hats-choice" type="button" data-id=""><canvas width="56" height="56"></canvas><span>None</span></button>' +
    '<button class="hats-choice" type="button" data-id="cone"><canvas width="56" height="56"></canvas><span>Cone</span></button>' +
    '<button class="hats-choice" type="button" data-id="beanie"><canvas width="56" height="56"></canvas><span>Beanie</span></button>' +
    '</div>';
  root.append(panel);
  const preview = panel.querySelector<HTMLCanvasElement>('.hats-preview')!;
  const choiceEls = Array.from(panel.querySelectorAll<HTMLButtonElement>('.hats-choice'));

  let view: MenuView | undefined;
  let shown = '';

  const draw = (v: MenuView): void => {
    v.preview(preview);
    v.preview(mini);
    for (const c of choiceEls) v.preview(c.querySelector<HTMLCanvasElement>('canvas')!, { head: c.dataset.id || undefined });
  };

  card.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
  });
  panel.querySelector('.hats-close')!.addEventListener('click', () => {
    panel.hidden = true;
  });
  for (const c of choiceEls) {
    c.addEventListener('click', () => view?.wear('head', c.dataset.id || undefined));
  }

  return {
    update(v) {
      view = v;
      const worn = v.profile.wearing.head ?? '';
      current.textContent = worn === 'cone' ? 'Cone' : worn === 'beanie' ? 'Beanie' : 'None';
      mini.hidden = !worn;
      for (const c of choiceEls) c.classList.toggle('worn', c.dataset.id !== '' && c.dataset.id === worn);
      const key = `${worn}:${v.profile.color ?? -1}`;
      if (key === shown) return;
      shown = key;
      draw(v);
    },
  };
};
```
5. Create `src/menu/hats.css` exactly:
```css
/* The Hats card (start screen) and its picker panel, in the Critters sticker look. */
.hats-card {
  font: inherit;
  color: #3b3355;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 8px 14px;
  background: #fff;
  border: 3px solid #3b3355;
  border-radius: 14px;
  box-shadow: 3px 4px 0 #3b3355;
  cursor: pointer;
  text-align: left;
}
.hats-card:active { transform: translate(2px, 3px); box-shadow: 1px 1px 0 #3b3355; }
.hats-card-label { font-size: 20px; font-weight: 700; }
.hats-card-current { font-size: 16px; color: #7a7193; }
.hats-card-mini { width: 44px; height: 44px; flex: none; }
.hats-panel {
  position: absolute;
  top: max(16px, 6vh);
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  width: min(340px, calc(100vw - 32px));
  box-sizing: border-box;
  background: #fff;
  border: 3px solid #3b3355;
  border-radius: 22px;
  box-shadow: 5px 6px 0 #3b3355;
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
@media (max-width: 899px) { .hats-panel { top: 12px; } }
.hats-panel-head { width: 100%; display: flex; align-items: center; justify-content: space-between; }
.hats-panel-head > span { font-size: 24px; font-weight: 700; }
.hats-close {
  font: inherit;
  font-size: 22px;
  font-weight: 700;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 3px solid #3b3355;
  background: #fff;
  color: #3b3355;
  box-shadow: 2px 3px 0 #3b3355;
  cursor: pointer;
}
.hats-close:active { transform: translate(2px, 2px); box-shadow: 0 1px 0 #3b3355; }
.hats-preview { width: 140px; height: 140px; }
.hats-choices { width: 100%; display: flex; gap: 8px; }
.hats-choice {
  font: inherit;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-height: 84px;
  padding: 8px 2px;
  background: #fff;
  border: 3px solid #3b3355;
  border-radius: 12px;
  box-shadow: 2px 3px 0 #3b3355;
  cursor: pointer;
}
.hats-choice:active { transform: translate(1px, 2px); box-shadow: 1px 1px 0 #3b3355; }
.hats-choice canvas { width: 56px; height: 56px; }
.hats-choice span { font-size: 14px; font-weight: 600; color: #3b3355; }
.hats-choice.worn { box-shadow: 0 0 0 4px #ffd43b, 2px 3px 0 #3b3355; }
```
6. Edit `src/menu/index.ts` — full new content:
```ts
import type { MakeMenuPart } from '../../engine/api.ts';
import { hats } from './hats.ts';

/** The game's parts of the start screen (above Play), top to bottom. One per line. */
export const MENU_PARTS: readonly MakeMenuPart[] = [
  hats,
];
```
7. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Head accessories draw **after the face** (`drawPlayerCritter`, api.ts:962) — the numbers above are verified against the eye tops at −0.38r: beanie band bottom ink reaches −0.61r, cone base ink ≈ −0.9r. Do not "improve" the band lower or the cone base wider; that covers the eyes.
- Everything stays within two radii (cone tip-ball top at −1.92r, pom top at −1.57r) — the player's name renders above −2r.
- No `Math.random`/`Date`/`performance` in the accessory files (lint, src/content); the hats are static — don't animate with `w.time`. A `draw()` that throws disables the item for the match and fails the content tests.
- All wearing goes through `view.wear('head', id | undefined)` — never touch `localStorage`; the engine's profile store persists it (that is what makes the pick survive reloads and a fresh browser show None).
- The panel is `position: absolute` relative to `#menu` (the nearest positioned ancestor, engine/client/menu.css). Do not add `position` to `.menu-card`/`.menu-parts`, and don't use fixed pixels for the panel: at 1280x720 it sits x≈480–820, y≈43–370 (the menu card ends at x≈470); at 412x915 it sits y≈12–340 while the menu card's name field starts below y≈520 — it never covers the name field or Play, and stays clear as T0016/T0019 grow the card.
- "At least one bot wears a hat" is the engine's `botWear()` (40% per bot, 6 bots ≈ 94% that some bot is hatted) — no content code for it; don't add any.
- Don't edit `base.css`, `engine/client/menu.css`, or another part's files; don't reorder registry lines (registry order is wire order).

### Tests
- none (engine/tests/ validates both accessories' data, draw and registration, and every talent/upgrade in a real match; the smoke test exercises the start screen part, which the Menu builds and updates once at construction).

## Result (attempt 1, desktop-4070)

Added the two free head accessories (Cone, a yellow party cone with a red tip ball; Beanie, a purple dome and band with a pink pom) as one file each in `src/content/accessories/`, registered with one import and one line per accessory, plus a "Hats" card on the start screen whose panel previews all three choices (None, Cone, Beanie) and wears them at once, with tapping the worn hat taking it off. Two deviations from the design's literal text, both because the repo already had content: the registries were not empty, so my import/registry lines were appended next to the existing entries rather than written as full-file content, and the design's exact click handler (`view?.wear('head', c.dataset.id || undefined)`) cannot remove a hat since `MenuView.wear()` is set-only (only `undefined` takes a slot off), so the choice handler toggles — clicking the currently worn hat passes `undefined`. Hats persist in the profile, are worn in-match for everyone every life via the engine's existing draw order and bot-wear, and change no stats.

- Self-review: APPROVE
- Time: 102.3 min

```
.../game/src/content/accessories/beanie.ts         | 45 +++++++++++++++
 .../game/src/content/accessories/cone.ts           | 32 +++++++++++
 .../game/src/content/accessories/index.ts          |  4 ++
 projects/draft-arena/game/src/menu/hats.css        | 19 +++++++
 projects/draft-arena/game/src/menu/hats.ts         | 64 ++++++++++++++++++++++
 projects/draft-arena/game/src/menu/index.ts        |  3 +-
 6 files changed, 166 insertions(+), 1 deletion(-)
```

## Merge (attempt 1, desktop-4070)

- Conflicts in: projects/draft-arena/game/src/menu/index.ts
- Auto-resolved 1 spot(s) where both sides only added lines.
- The conflict agent resolved them.
