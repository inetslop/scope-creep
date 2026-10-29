---
id: T0140
title: Settings — the pause screen gets a SETTINGS card
size: M
priority: 2
status: todo
depends_on: [T0119, T0121, T0122, T0126, T0127, T0132, T0137]
attempts: 0
created: 2026-10-27T19:37:42Z
---

## Goal
The game should fit the room and the thumbs: music on or off, sound effects on or off, screen shake on or off, and hold-to-fire or always-fire — all remembered between runs. This is the "Settings" line of roadmap M4.

## Details
- A SETTINGS card on the pause screen in the ink idiom of The Index and the controls card (T0104/T0123): a small-caps "SETTINGS" header, 200 px wide, four rows. Each row: a small-caps label on the left and two small flat ink toggle buttons on the right — the active one filled ink with paper-color text, the inactive one outlined. At 1280x720 the card sits in the left column beside the buttons (below The Index / the controls card, wherever it fits without overlap); at 412x915 the pause cards stack between the title and Resume and everything still fits without scrolling.
- Rows:
  1. "MUSIC" — OFF / ON: the generative score (T0011). The existing M key toggles the same state, and the row and the key always stay in sync in both directions.
  2. "SFX" — OFF / ON: all sound effects. A new key N toggles the same state; the N line is listed on the pause controls card (T0123) the way M is.
  3. "SHAKE" — OFF / ON: ON (the default) is today's screen shake (T0040); OFF makes the camera completely still — no jolt on heavy deaths, nothing else changes.
  4. "FIRE" — MANUAL / AUTO: MANUAL (the default) is today's hold-aim-to-fire. AUTO fires continuously as soon as the volley cooldown allows, in the current aim direction — the mouse on desktop, the right stick on gamepad and touch (with the aim stick released, the last aim direction holds).
- Persistence: all four states in localStorage (the bestScore/warmStart try/catch pattern, one key per setting), surviving restarts and page reloads. First-launch defaults: MUSIC ON, SFX ON, SHAKE ON, FIRE MANUAL.
- Toggling a row plays the existing menu button tick (no new sound).
- No new scene.

## Acceptance criteria
- [ ] The pause screen shows a SETTINGS card with MUSIC, SFX, SHAKE and FIRE rows, each with two flat ink toggle buttons (active filled, inactive outlined), laid out for 1280x720 and 412x915 without overlap or scrolling.
- [ ] Toggling a row takes effect immediately (the score stops/starts, SFX gate, camera still, fire mode) and is remembered after a restart and a page reload.
- [ ] First launch defaults to MUSIC ON, SFX ON, SHAKE ON, FIRE MANUAL; with FIRE AUTO the player fires continuously without holding the aim input, and MANUAL requires the aim hold exactly as before.
- [ ] The M key and the MUSIC row toggle the same state in both directions; the new N key toggles SFX and is listed on the pause controls card the way M is.
- [ ] No new scene and no new sound (the existing button tick plays on a toggle).

## Design (architect, desktop)

### Files
- create `src/core/settings.ts` — the four persisted settings (MUSIC, SFX, SHAKE, FIRE); pure module, one localStorage key per setting, session singleton
- create `src/ui/toggle.ts` — `makeToggle()`: flat ink toggle pair (active = ink fill + paper text, inactive = ink outline), 72×44 px buttons
- create `tests/core/settings.test.ts` — persistence rule tests
- edit `src/core/shake.ts` — add `CameraShake.clear()`
- edit `src/audio/Sfx.ts` — SFX gate reads settings; delete legacy `scope-creep:muted` storage, `toggleMute()`, `readMuted()`; add `setMuted()`
- edit `src/audio/Music.ts` — gate `update()` and `bossSwell()` on the MUSIC setting
- edit `src/systems/FxSystem.ts` — `updateShake()` clears any in-flight shake while `hook.stats.screenShake` is false
- edit `src/scenes/GameScene.ts` — AUTO fire in `update()`, `screenShake` sync in `updateHookStats()`, M→music + N→sfx key handlers, one invariant
- edit `src/scenes/PauseScene.ts` — SETTINGS card below CONTROLS (left column / portrait stack), `N` line on the controls card
- edit `docs/ARCHITECTURE.md` — Audio paragraph: M/N and `core/settings.ts` replace “M toggles mute”; “follows the SFX mute” → SFX and MUSIC settings

### Interfaces
```ts
// src/core/settings.ts (exact file: export everything, keep DEFAULT_SETTINGS { music:true, sfx:true, shake:true, fire:'manual' })
export type FireMode = 'manual' | 'auto';
export interface Settings { music: boolean; sfx: boolean; shake: boolean; fire: FireMode; }
export const DEFAULT_SETTINGS: Settings;
export function loadSettings(): Settings;
export function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]): void;
export function getSettings(): Settings;   // module singleton: let current = loadSettings() at import
export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): Settings; // { …current } , persist, return
// keys: music→'scope-creep:muted' (EXISTING M-key key: '1'=off, so an old mute carries over), sfx→'scope-creep:sfx',
// shake→'scope-creep:shake' (boolean: '1'=off, '0'=on), fire→'scope-creep:fire' ('auto' = AUTO, anything else = MANUAL)
// every read: try/catch, absent or garbage → default. setSetting: const next = { …current }; next[key] = value; saveSetting; current = next
// src/ui/toggle.ts
export const TOGGLE_W = 72, TOGGLE_H = 44, TOGGLE_GAP = 4, TOGGLE_PAIR_W = TOGGLE_W * 2 + TOGGLE_GAP;
export function makeToggle(scene: Phaser.Scene, x: number, y: number, options: readonly [string, string], active: 0 | 1, onChange: (a: 0 | 1) => void): Phaser.GameObjects.Container;
// container centered at (x,y), size TOGGLE_PAIR_W×TOGGLE_H; button i: left = -PAIR/2 + i*(W+GAP), fill ink (active) / paperLight (inactive), 2px ink stroke;
// two Texts (13px bold, ink or paper via setColor(cssColor(...))); pointerup: next = pointer.x < container.x ? 0 : 1 (gap is centered on container.x), skip if same, redraw, onChange(next)
```

### Steps
1. Write `src/core/settings.ts` exactly as Interfaces. No Phaser import.
2. Write `src/ui/toggle.ts` exactly as Interfaces (`import type Phaser`, `cssColor/PALETTE`, `textStyle` only).
3. `src/core/shake.ts`: after `add()` add `clear(): void { this.amp = 0; this.totalMs = 0; this.leftMs = 0; }` with a doc line (SHAKE setting off mid-shake).
4. `src/audio/Sfx.ts`: import `getSettings` from `../core/settings`; line 34 → `this.muted = !getSettings().sfx;`; replace `toggleMute()` with `setMuted(muted: boolean): void { if (this.muted === muted) return; this.muted = muted; if (this.master) this.master.gain.value = muted ? 0 : MASTER_VOLUME; }`; delete `MUTE_STORAGE_KEY` and `readMuted()`; class doc “or the game is muted” → “or SFX is off (core/settings.ts)”.
5. `src/audio/Music.ts`: import `getSettings`; add `!getSettings().music ||` to the `update()` early-return (line 69) and the `bossSwell()` guard (line 91); doc: follows the SFX and MUSIC settings.
6. `src/systems/FxSystem.ts` `updateShake()`: right after `this.lastShakeY = 0;` insert `if (!hook.stats.screenShake) { this.shakeState.clear(); return; }` (kill in-flight shake, camera holds the follow position).
7. `src/scenes/GameScene.ts`: import `getSettings, setSetting`. In `update()`: after `const input = this.controls.read(playerScreen);` add `const firing = getSettings().fire === 'auto' || input.firing; // FIRE AUTO: the volley cooldown is the only gate` and change `this.weapons.update(dt, input.firing);` / `this.arc.update(dt, input.firing);` to `…(dt, firing);`. In `updateHookStats()`: after `s.inkwell = …` add `s.screenShake = getSettings().shake;`. In `bindSceneEvents()`: replace `onMute` with `onMusicToggle = (): void => { setSetting('music', !getSettings().music); }` and `onSfxToggle = (): void => { const on = !getSettings().sfx; setSetting('sfx', on); this.sfx.setMuted(!on); };`; register `keydown-N` → `onSfxToggle` on the line after `keydown-M`, and `off` both in the SHUTDOWN block beside the M lines. After the `'camera-shake'` invariant add `hook.addInvariant('shake-setting', () => (!getSettings().shake && this.fx.shakeMs > 0 ? 'shake running with SHAKE off' : null));`.
8. `src/scenes/PauseScene.ts`: controls-card keyboard list: `'M — mute'` → `'M — music'` plus `'N — SFX'` on the next line. Add module const `const SETTINGS_HEADER_H = 16, SETTINGS_HEADER_GAP = 8, SETTINGS_ROW_H = TOGGLE_H;` (import `TOGGLE_H, TOGGLE_PAIR_W, makeToggle`, `getSfx`). In `create()` replace the last two card calls with:
```ts
const layout = this.layoutCards(title, width, height, picksColTop);
this.buildControlsCard(layout.controlsTop, layout.centerX);
this.buildSettingsCard(layout.settingsTop, layout.centerX);
```
Replace `buildControlsCard(title, width, height, picksColTop)` with `buildControlsCard(top: number, centerX: number)` (body unchanged except positions use `top`/`centerX`, `colLeft = centerX - 100`). Add:
```ts
private layoutCards(title: Phaser.GameObjects.Text, width: number, height: number, picksColTop: number): { controlsTop: number; settingsTop: number; centerX: number } {
  const lines = CONTROLS_BY_DEVICE[getControls(this)?.device ?? 'keyboard'];
  const MARGIN = 12;
  const controlsH = 16 + 8 + 18 * lines.length;
  const settingsH = SETTINGS_HEADER_H + SETTINGS_HEADER_GAP + SETTINGS_ROW_H * 4;
  const horizontal = width >= 760;
  const centerX = horizontal ? width / 2 - 110 - 28 - 200 / 2 : width / 2;
  let controlsTop = picksColTop;
  if (!horizontal) {
    const resumeTop = height * 0.52 - 26;
    controlsTop = Math.min(title.y + title.height / 2 + MARGIN, resumeTop - MARGIN - settingsH - MARGIN - controlsH);
    title.setY(Math.max(height * 0.12, controlsTop - MARGIN - title.height / 2)); // title yields, never above 12%
  }
  const settingsTop = horizontal ? Math.min(controlsTop + controlsH + MARGIN, height - MARGIN - settingsH) : controlsTop + controlsH + MARGIN;
  return { controlsTop, settingsTop, centerX };
}
```
Add `buildSettingsCard(top: number, centerX: number)`: 'SETTINGS' header + underline exactly like the CONTROLS card (`colLeft = centerX - 100`, `colRight = centerX + 100`), then rows `[{label:'MUSIC', options:['OFF','ON'], active: s.music?1:0, apply: a=>setSetting('music', a===1)}, {label:'SFX', …, apply: a=>{ setSetting('sfx', a===1); getSfx(this)?.setMuted(a===0); }}, {label:'SHAKE', …, apply: a=>setSetting('shake', a===1)}, {label:'FIRE', options:['MANUAL','AUTO'], active: s.fire==='auto'?1:0, apply: a=>setSetting('fire', a===1?'auto':'manual')}]` with `s = getSettings()`; row i at `y = top + HEADER_H + HEADER_GAP + ROW_H*i + ROW_H/2` (`ROW_H = SETTINGS_ROW_H`): label Text at `colLeft` (origin 0,0.5, 13px bold ink) + `makeToggle(this, colRight - TOGGLE_PAIR_W/2, y, row.options, row.active, (a) => { row.apply(a); getSfx(this)?.cardFlip(); })`.
9. Write `tests/core/settings.test.ts`: stub `localStorage` with a `Map` via `Object.defineProperty(globalThis, 'localStorage', { value: stub, configurable: true, writable: true })` in `beforeEach`, restore the saved descriptor in `afterEach`; tests: `loadSettings()` === `DEFAULT_SETTINGS` on empty storage; `saveSetting` writes the four keys (`'1'` for booleans off, `'auto'` for fire) and `loadSettings()` reads them back; pre-set `scope-creep:muted='1'` → music false, sfx still true; garbage values (`scope-creep:fire='turbo'`) → defaults; `setSetting('fire','auto')` updates `getSettings()` and the store.
10. `docs/ARCHITECTURE.md`: in the Audio section replace the “M toggles mute…” sentence with: “M toggles the MUSIC setting and N the SFX setting; all four (MUSIC, SFX, SHAKE, FIRE) are persisted one-key-per-setting in `core/settings.ts` and shown on the pause screen's SETTINGS card.”; “it follows the SFX mute” → “it follows the SFX and MUSIC settings”.
11. `npm run check`.

### Pitfalls
- M no longer mutes SFX — never reintroduce a master mute; the master gain follows only the SFX setting, Music only the two settings.
- The pause SFX row MUST call `getSfx(this)?.setMuted(a === 0)` — `setSetting` alone does not move the per-run gain node.
- Shake OFF must also `clear()` an in-flight shake (FxSystem guard) or a 400 ms hit shake outlives the toggle; the `shake-setting` invariant only runs while the game scene updates, so a toggle under the pause overlay is fine.
- In `GameScene.update()` keep the `firing` const directly after `controls.read()` and keep the weapons/arc lines where they are — several in-flight tasks add system calls in that function; do not append to function end.
- AUTO needs no aim changes: `Controls.read()` already holds `lastAim` when sticks release; just pass `firing=true` through.
- Portrait: title floor drops 18%→12%; at 412×915 (touch, 3 control rows) expect title ≈110, CONTROLS 148→226, SETTINGS 238→438, Resume 450 — verify both reference layouts visually; a keyboard-last device in a 412 px desktop window is out of scope (same degradation class as the existing layout).
- Toggling SFX off silences its own tick (gate applied before `cardFlip()`) — intentional; do not “fix” it.

### Tests
- `tests/core/settings.test.ts` as in step 9 (first-launch defaults, one-key-per-setting persistence, legacy `scope-creep:muted` carry-over, garbage fallback, `setSetting` session state).
