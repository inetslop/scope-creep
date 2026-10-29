---
id: T0222
title: "The start screen: one column that fits, the profile card without repeats"
assignee: cachyos-x8664
size: M
priority: 1
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-29T17:00:35Z
claimed_at: 2026-10-29T18:00:50Z
---

## Goal
Seen at about 515x660 after a single lost run: the profile card touches the title above it; the Recent line ("Recent W13 +64") sits on the card's bottom edge and over the first how-to line; the "spend your coins" caption under Tech runs into the Ghost button; the card's coin and number sit top-left while every other line is centered. The card also says the same thing twice: after one run "Last: wave 13 · +64 coins" and "Recent W13 +64" are the same run, and "avg 13" repeats the best wave. Make the start screen one even column that fits, and show each fact once.

## Details
- **Why it broke:** in `src/scenes/MenuScene.ts` every part has a hand-placed y offset from the title (+104, +213, +290, +366, +410, +442, +486, +510) and a separate `room` formula for the height. The Recent line is placed from the card's edge, so it overlaps whatever is below. `src/scenes/menu/ProfileCard.ts` places its lines the same way.
- **Lay the screen out as one column, built from its parts in order:** the demo road, the title, the profile card, the how-to text, Resume (when there is a saved run), Play, Tech and its caption, Augments (T0221's codex button, always present) and its caption if it has one, Ghost and its caption (once there is a best run), the "Enter or Space" hint. Each part's y comes from the part above it (its height plus a gap). Use one gap between parts, and a smaller one between a button and its caption. T0221's Augments button is what pushed Ghost off-screen at 1280x720 with Resume present — it goes in this column like the others.
- **When the column is taller than the screen:** the demo road shrinks first (as it does now); if it still doesn't fit, the column scales down as a whole. Nothing may overlap or leave the screen.
- **The profile card as a centered column:** the coin icon beside the coin number (a small fixed gap) as a centered pair, then Best wave (with its star), then the runs line, then the Recent runs. Its height comes from its lines, with the same padding at the top and the bottom.
- **Each fact once:**
  - The Recent runs move inside the card, as its last line, in place of "Last: wave … · +… coins". The first Recent entry is the last run.
  - "avg" shows only once there are at least two recent runs.
  - The Recent line shrinks to fit the card's width (never below 11 px), as it now does for the screen.
- **Keep:** the entrances (the title drops in, the rest fades up), Play's breathing, the Tech button's yellow dot, the drifting shapes, Enter/Space to play, the `?smoke` auto-start.

## Acceptance criteria
- [ ] At 412x915, 1280x720 and 515x660, nothing overlaps and nothing leaves the screen. Check a fresh profile (no runs), one run, four or more runs with a saved run (so Resume shows), and a best run (so Ghost shows) — in every case the Augments button sits in the column between Tech and Ghost.
- [ ] The profile card's lines are centered, the coin sits beside its number, and the top and bottom padding match.
- [ ] After one run, the card shows that run once. "avg" appears only from two runs.
- [ ] Each caption sits under its own button, clear of the next button.

## Design (architect, desktop)

### Files
- edit `src/scenes/menu/ProfileCard.ts` - rebuild the card as a centered column with height derived from its lines; the Recent runs become its last line (replacing "Last:"); "avg" only from two recent runs; remove the `PROFILE_CARD_H` export
- edit `src/scenes/MenuScene.ts` - replace the hand-placed y offsets in `layout()` with one column built part-by-part from the part above; wrap the title and the Play button in outer containers so entrance/breathing tweens never fight the layout scale
- `src/scenes/menu/RecentLine.ts` is NOT touched — `ProfileCard.ts` imports `buildRecentLine` from it (MenuScene stops importing it)

### Interfaces
```ts
// src/scenes/menu/ProfileCard.ts  (replaces `export const PROFILE_CARD_H = 124`)
export const PROFILE_CARD_W = 300;
export interface ProfileCard { container: Phaser.GameObjects.Container; width: number; height: number; }
export function buildProfileCard(scene: Phaser.Scene, profile: Profile): ProfileCard;
// MenuScene module-level constants:
const MARGIN = 16; const GAP = 28; const CAPTION_GAP = 8; const BUTTON_H = 60;
```

### Steps
1. **Rewrite `ProfileCard.ts`** (full new body): after the imports, define `const PAD = 14; const LINE_GAP = 10; const COIN_GAP = 8;` and `runsText(profile)`:
```ts
function runsText(profile: Profile): string {
  let text = `runs ${profile.runsPlayed}`;
  if (profile.recent.length >= 2) {
    let sum = 0;
    for (const r of profile.recent) sum += r.wave;
    text += ` · avg ${Math.floor(sum / profile.recent.length)}`;
  }
  return text;
}
```
`buildProfileCard` builds, in order: (a) coin pair — `const coin = artScale(scene.add.image(0, 0, COIN_TEXTURE), 1.4); const coins = scene.add.text(0, 0, String(profile.coins), textStyle(30, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0.5); const pairW = coin.displayWidth + COIN_GAP + coins.width; coin.setX(-pairW / 2 + coin.displayWidth / 2); coins.setX(-pairW / 2 + coin.displayWidth + COIN_GAP + coins.width / 2); const h1 = Math.max(coin.displayHeight, coins.height);` (b) `const best = scene.add.text(0, 0, `Best wave ${profile.bestWave}`, textStyle(17, PALETTE.muted)).setOrigin(0.5);` plus `const star = artScale(scene.add.image(0, 0, STAR_TEXTURE)); star.setX(best.width / 2 + 13); star.setVisible(profile.lastRun !== null && profile.lastRun.wave === profile.bestWave); const h2 = best.height;` (c) `const runs = scene.add.text(0, 0, runsText(profile), textStyle(17, PALETTE.muted)).setOrigin(0.5); const h3 = runs.height;` (d) `const recent = buildRecentLine(scene, profile); const h4 = recent ? 16 : 0;` then:
```ts
const height = PAD * 2 + h1 + h2 + h3 + h4 + (recent ? 3 : 2) * LINE_GAP;
const card = makeCard(scene, 0, 0, PROFILE_CARD_W, height, 20);
let y = -height / 2 + PAD;
const put = (h: number): number => { const c = y + h / 2; y += h + LINE_GAP; return c; };
const c1 = put(h1); coin.setY(c1); coins.setY(c1);
const c2 = put(h2); best.setY(c2); star.setY(c2 + 1);
const c3 = put(h3); runs.setY(c3);
if (recent) {
  const c4 = put(h4);
  recent.container.setPosition(0, c4);
  recent.container.setScale(Math.max(Math.min(1, (PROFILE_CARD_W - PAD * 2) / recent.width), 11 / 12));
}
return {
  container: scene.add.container(0, 0, recent ? [card, coin, coins, best, star, runs, recent.container] : [card, coin, coins, best, star, runs]),
  width: PROFILE_CARD_W,
  height,
};
```
2. **MenuScene create()**: change the import to `import { buildProfileCard, PROFILE_CARD_W } from './menu/ProfileCard';` and delete the `buildRecentLine` import. Replace `const profileCard = buildProfileCard(this, p); const recent = buildRecentLine(this, p);` with `const card = buildProfileCard(this, p);`. Right after the title is created add `const titleBox = this.add.container(0, 0, [title]);` and add field `private titleBox!: Phaser.GameObjects.Container;`. Right after the Play button is made add `const playBox = this.add.container(0, 0, [button.container]);`. In the fadeIn list use `card.container` and `playBox` (instead of `profileCard` and `button.container`); delete the whole `if (recent) { ... }` fade block — the recent line now fades with the card.
3. **MenuScene layout()** — replace the whole function with:
```ts
const layout = (width: number, height: number): void => {
  const cx = width / 2;
  const avail = height - MARGIN * 2;
  const cardScale = Math.min(1, (width - 32) / PROFILE_CARD_W);
  const textScale = Math.min(1, (width - 32) / 420);
  const cardH = card.height * cardScale;
  const howH = how.height * textScale;
  // The column below the road, at full size: each part's height plus the gap that follows it.
  let below = title.height + GAP + cardH + GAP + howH + GAP;
  if (resume) below += BUTTON_H + GAP;
  below += 2 * (BUTTON_H + GAP) + techLine.height + CAPTION_GAP;
  if (ghost && ghostLine) below += BUTTON_H + GAP + ghostLine.height + CAPTION_GAP;
  below += hint.height;
  const kMax = Math.min(1.4, (width - 24) / MENU_ROAD_SIZE.width);
  const kMin = 0.35;
  const room = avail - below;
  let k: number;
  let s = 1;
  if (room >= MENU_ROAD_SIZE.height * kMax) k = kMax;
  else if (room >= MENU_ROAD_SIZE.height * kMin) k = room / MENU_ROAD_SIZE.height;
  else {
    // The road is at its smallest and the column still does not fit: scale the whole column.
    k = kMin;
    s = Math.min(1, avail / (below + MENU_ROAD_SIZE.height * kMin));
  }
  const block = below + MENU_ROAD_SIZE.height * k;
  const top = MARGIN + Math.max(0, (avail - block) / 2);
  this.demo.layout(cx, top, k * s);
  let y = top + MENU_ROAD_SIZE.height * k * s + GAP * s;
  const put = (h: number): number => { const c = y + (h * s) / 2; y += h * s; return c; };
  const gap = (g: number): void => { y += g * s; };
  titleBox.setScale(s);
  this.titleY = put(title.height);
  titleBox.setPosition(cx, this.titleY);
  gap(GAP);
  card.container.setScale(cardScale * s);
  card.container.setPosition(cx, put(cardH));
  gap(GAP);
  how.setScale(textScale * s);
  how.setPosition(cx, put(howH));
  gap(GAP);
  if (resume) {
    resume.container.setScale(s);
    resume.container.setPosition(cx, put(BUTTON_H));
    gap(GAP);
  }
  playBox.setScale(s);
  playBox.setPosition(cx, put(BUTTON_H));
  gap(GAP);
  tech.container.setScale(s);
  tech.container.setPosition(cx, put(BUTTON_H));
  gap(CAPTION_GAP);
  techLine.setScale(s);
  techLine.setPosition(cx, put(techLine.height));
  if (ghost && ghostLine) {
    gap(GAP);
    ghost.container.setScale(s);
    ghost.container.setPosition(cx, put(BUTTON_H));
    gap(CAPTION_GAP);
    ghostLine.setScale(s);
    ghostLine.setPosition(cx, put(ghostLine.height));
  }
  gap(GAP);
  hint.setScale(s);
  hint.setPosition(cx, put(hint.height));
};
```
4. **MenuScene update()**: the title bob line becomes `if (this.title.scale >= 0.999) this.titleBox.setY(this.titleY + Math.sin(this.clock * 1.6) * 3);`. Everything else (drifters, demo, key handler, `?smoke` auto-start, `addUpdateNotice`) is untouched.
5. Run `npm run check` and `npm run smoke`.

### Pitfalls
- The design's part list predates T0221: `MenuScene.ts` now also creates the Augments codex button (stacked under Tech, with a caption line if it has one). Place it in the column between Tech and Ghost exactly like the other parts (`put(BUTTON_H)` + its line) — leaving it at its hand-placed y is the 1280x720 overflow T0221's self-review flagged.
- Never call `setScale()` on an object a tween also animates: the title's drop-in (scale 0.6→1) and Play's breathing (scale →1.05) tween the inner objects (`this.title`, `button.container`); the layout scale `s` goes on the wrappers `titleBox`/`playBox` only. All other parts (resume, tech, ghost, card, texts) have no scale tweens — set their scale directly.
- The drop-in tween and breathing tween keep their existing targets/lines unchanged; do not retarget them at the wrappers.
- `card.height` must be read from the returned `ProfileCard` (it is dynamic now, ≈98–154 px); do not hardcode 124 anywhere. `PROFILE_CARD_H` is deleted — only `MenuScene` imported it.
- The recent line is now a child of the card container: it must not also be added to the menu fadeIn list or placed by `layout()`.
- The recent line's star comes from `buildRecentLine` and scales with the card — do not draw another star for it.
- `layout()` must stay idempotent (called on every resize): it re-derives everything from `width`/`height`; no state accumulates between calls.
- `makeCard` with a variable height creates a few cached card textures — that is fine, do not "fix" it.
- Keep the Tech yellow dot (`tech.container.add(dot)`) exactly as is; it scales with the Tech button.

### Tests
- none (UI/layout only; no rule in src/core changes)
