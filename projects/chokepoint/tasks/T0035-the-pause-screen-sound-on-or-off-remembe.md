---
id: T0035
title: "The pause screen: sound on or off, remembered"
size: S
priority: 2
status: todo
depends_on: [T0019, T0030]
attempts: 0
created: 2026-10-28T08:43:02Z
epic: E1
---

## Goal
A player who wants the game quiet (or back on) can say so from the pause screen, and the choice sticks — the profile (E1) now keeps one more preference, across reloads and sessions.

## Details
- One new row at the bottom of the pause card, below the Quit button, in the card's white rounded look: a small chunky speaker glyph (rounded square with a triangle, no outline dressing), the word "Sound", and the state word — "On" in ink, "Off" in muted gray. Glyph and text are ink when On, muted gray when Off. The whole row is the target: one click or tap anywhere on the row toggles it (large touch target, no separate mini-button).
- Off silences every sound in the game: hits, kills, pops, the tier chime, the coin chime, the leak warning, UI blips — nothing plays. On plays everything exactly as today. (There is no music yet, so "all sound" is all of it.)
- Toggling to "On" plays one soft UI blip (the same soft volume class as the draft blips) so the player hears the switch work; toggling to "Off" is silent.
- The choice is kept in the profile as a new field (default: on, for a fresh profile), saved the moment it is toggled, and read at boot so a page reload — and the next session — keep it.
- No new key; the row is a mouse-and-touch button. No new sound effect beyond reusing the existing soft blip.
- Closest examples: the pause card's own buttons for the row's look and size, and the HUD coin line's On/Off-style state text (T0013) for a small muted-vs-ink state.

## Acceptance criteria
- [ ] The pause screen shows a "Sound" row (speaker glyph, word, On/Off state) at the bottom of the card; clicking or tapping it flips the state in place.
- [ ] With the row on "Off", no sound plays anywhere in the game (kills, hits, draft chime, coin chime, leak warning, UI clicks); with "On", everything plays as before.
- [ ] Toggling to "On" plays one soft blip; toggling to "Off" plays nothing.
- [ ] The choice survives a full page reload: set "Off", reload the page, pause — the row reads "Off" and the game stays silent.
- [ ] A fresh profile (no saved data) starts at "On".
- [ ] The row fits the pause card at 412x915 and 1280x720 without overlap or wrapping, in the card's existing white rounded style.

## Design (architect, yoga)

### Files
- edit `src/core/profile.ts` — `sound: boolean` on `Profile` (default on), parse in `loadProfile`, keep in `recordRun`, new `saveSound()`
- edit `src/audio/Sfx.ts` — one new method `blip()` (soft note, same class as the tier-chime notes)
- edit `src/scenes/BootScene.ts` — set `sfx.muted` from the profile after `const sfx = new Sfx();`
- edit `src/scenes/PauseScene.ts` — the Sound row (speaker glyph + two texts + row button), `panelH` 260 → 328
- edit `tests/core/profile.test.ts` — add `sound: true` to the 5 full-profile `toEqual` expectations (lines 18, 23, 33, 37, 45) and one new test
No new files.

### Interfaces
```ts
// core/profile.ts
interface Profile { /* ...existing... */ sound: boolean; } // true for a fresh profile
export function saveSound(store: KeyValueStore | undefined, on: boolean): void;
// audio/Sfx.ts
blip(): void; // this.tone(523, 0.08, 'sine', 0.1) — same note class as tierChime
```

### Steps
1. profile.ts: interface line `sound: boolean;` after `recent`; in `loadProfile` return `sound: typeof parsed.sound === 'boolean' ? parsed.sound : true,` and add `sound: true` to the catch fallback; in `recordRun`'s profile literal add `sound: old.sound,` after `recent`; add the function (next to `recordRun`):
```ts
/** Saves the sound preference; the profile's other fields keep what they had. */
export function saveSound(store: KeyValueStore | undefined, on: boolean): void {
  const profile = loadProfile(store);
  profile.sound = on;
  try {
    store?.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    /* private mode or full storage: the preference just isn't kept */
  }
}
```
2. Sfx.ts: add `blip(): void { this.tone(523, 0.08, 'sine', 0.1); }` (doc: "One soft UI blip, the tier-chime note class.").
3. BootScene: import `loadProfile` from '../core/profile'; after `const sfx = new Sfx();` add `sfx.muted = !loadProfile(window.localStorage).sound;` — must be at boot, not in the pause, so a reloaded Off page is silent before the first pause.
4. PauseScene: imports — add `cssColor` to the palette import, `saveSound` from '../core/profile', `textStyle` from '../ui/text', `getSfx` to the './keys' import. `panelH` 260→328. Before `const box`, add (glyph pattern: `PauseButton.ts`'s bars in `button.content`):
```ts
const sfx = getSfx(this);
const glyph = this.add.graphics();
const paintGlyph = (isOn: boolean): void => {
  glyph.clear();
  glyph.fillStyle(isOn ? PALETTE.ink : PALETTE.muted, 1);
  glyph.fillRoundedRect(-12, -10, 14, 20, 5);
  glyph.fillTriangle(2, -8, 2, 8, 12, 0);
};
const wordText = this.add.text(-62, 0, 'Sound', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
const stateText = this.add.text(92, 0, '', textStyle(20, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(1, 0.5);
const refreshRow = (): void => {
  const isOn = !sfx.muted;
  paintGlyph(isOn);
  const color = cssColor(isOn ? PALETTE.ink : PALETTE.muted);
  wordText.setColor(color);
  stateText.setText(isOn ? 'On' : 'Off');
  stateText.setColor(color);
};
const toggleSound = (): void => {
  sfx.muted = !sfx.muted;
  saveSound(window.localStorage, !sfx.muted);
  refreshRow();
  if (!sfx.muted) sfx.blip();
};
const soundRow = makeButton(this, 0, -panelH / 2 + 268, '', toggleSound, { width: 280, height: 48, radius: 24 });
glyph.setPosition(-88, 0);
soundRow.content.add(glyph, wordText, stateText);
refreshRow();
```
   and add `soundRow.container` to the `box` children list. Layout: row is the last row, 22 px below the element above it, 36 px above the card bottom. If T0030/T0019 have already added rows below Quit, let `B` = top-offset of the lower edge of the element above the row; row y = `-panelH / 2 + B + 46`, `panelH = B + 106` (pre-existing B = 222 → 268/328).
5. Tests: `sound: true` into the five `toEqual` objects above; new test:
```ts
it('the sound preference defaults to on and sticks through runs', () => {
  const store = memory();
  expect(loadProfile(undefined).sound).toBe(true);
  saveSound(store, false);
  expect(loadProfile(store).sound).toBe(false);
  recordRun(store, { waves: 2, stopped: 0, clean: 0 });
  expect(loadProfile(store).sound).toBe(false);
  saveSound(store, true);
  expect(loadProfile(store).sound).toBe(true);
});
```
6. `npm run check` and `npm run smoke` both pass.

### Pitfalls
- `recordRun` rebuilds the profile from scratch — without `sound: old.sound` the preference silently resets after every run; the test pins it.
- `muted` is only honored inside `tone()`, so every Sfx call (kills, hits, chimes, leak, UI blips) goes dark at once; the Off→silent blip is guaranteed by the `if (!sfx.muted)` gate, not by `tone()`.
- Row interactivity comes from `makeButton` (pointerup + stopPropagation); never a raw pointerdown, or the shade/behind would misbehave; whole 280x48 row is the target (≥44 px).
- Glyph is Graphics fills (like `PauseButton` bars), repainted per state — no texture, no tint, no stroke.
- 328-tall panel still scales at min 1 at 412x915 and 1280x720; the row stays inside the card, no wrap (280 wide).
