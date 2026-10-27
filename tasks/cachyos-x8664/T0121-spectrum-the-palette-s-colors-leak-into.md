---
id: T0121
title: "Spectrum — the Palette's colors leak into your fire"
assignee: cachyos-x8664
size: M
priority: 2
status: todo
depends_on: [T0114, T0118, T0119, T0122]
attempts: 0
created: 2026-10-27T15:11:35Z
---

## Goal
The third in the boss-payout line: for 8 s after The Palette (T0097) dies, your volleys print in the five swatch colors — the boss's palette leaks into your fire.

## Details
- The moment The Palette dies: a small-caps "SPECTRUM" note flashes in the HUD in the style of the RHYTHM flash (T0014), and an 8-second window opens.
- While the window is open, every projectile your volleys fire prints in the five swatch colors — red, orange, yellow, green, blue — in the same order as the Palette's swatches, cycling one color per projectile fired: the first projectile after the death is red, the next orange, and so on, wrapping back to red.
- Color is a tint only: projectile size, damage, speed, pierce, knockback and lifetime are all unchanged; hit flashes and damage numbers stay as they are.
- The color is decided at fire time: a projectile already in flight keeps the color it was printed with. At exactly 8 s, newly fired projectiles print in normal ink again.
- A second Palette death in the same run (respawns come with the +50% HP scaling) restarts the 8 s window and reprints the note.
- No new HUD element beyond the one flash note; no keys, no scene, no sound. The other bosses' deaths change nothing.

## Acceptance criteria
- [ ] The moment The Palette dies, a "SPECTRUM" note flashes in the HUD and your volleys print in the five swatch colors (red, orange, yellow, green, blue, one per projectile, wrapping) for exactly 8 s, after which newly fired projectiles print in normal ink again.
- [ ] Colored projectiles behave exactly like normal ones: same size, damage, speed, pierce and lifetime.
- [ ] A second Palette death in the same run restarts the 8 s window and reprints the note; killing The Frame or The Grid does nothing.
- [ ] No new HUD element, key, scene or sound is added; `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- create `src/core/spectrum.ts` - pure 8 s window + per-projectile swatch-color cycle (no Phaser)
- create `tests/core/spectrum.test.ts` - pins duration, cycle order, restart-on-second-death
- edit `src/art/textures.ts` - `projectileSpectrumTextureKey` + white-based projectile texture per volley weapon
- edit `src/entities/Projectile.ts` - `tint?: number` on `ShotParams`; `fire()` picks texture + sets/clears tint
- edit `src/systems/WeaponSystem.ts` - takes the window; decides one color per projectile in `fireVolley`
- edit `src/scenes/keys.ts` - `GAME_EVENTS.paletteKilled`
- edit `src/systems/BossSystem.ts` - emit it in `killBoss()`'s palette branch (only the Palette, never Frame/Grid)
- edit `src/scenes/GameScene.ts` - own the window, age it, open it on the event, register invariant
- edit `src/scenes/HudScene.ts` - the "SPECTRUM" flash note, same slot and style as the RHYTHM flash

### Interfaces
```ts
// src/core/spectrum.ts
export const SPECTRUM_WINDOW_SEC = 8;
export class SpectrumWindow {
  open(): void;               // left = 8, nextIndex = 0 (a second death restarts window AND cycle)
  update(dt: number): void;   // left = Math.max(0, left - dt)
  get active(): boolean;      // left > 0
  nextColor(): number;        // PALETTE_BOSS.swatchColors[nextIndex++ % 5] — red, orange, yellow, green, blue, wrapping
}
```
`src/entities/Projectile.ts`: `ShotParams` gains `/** SPECTRUM window: swatch color the shot prints in; undefined = normal. */ tint?: number;`
`src/scenes/keys.ts`: `GAME_EVENTS` gains `/** The Palette died this run. GameScene opens the 8 s SPECTRUM window; HudScene flashes the note. */ paletteKilled: 'palette-killed',`

### Steps
1. Create `src/core/spectrum.ts` (imports only `PALETTE_BOSS` from `../content/bosses/palette`).
2. Create `tests/core/spectrum.test.ts` (see Tests).
3. `textures.ts`: after line 59 add `export const projectileSpectrumTextureKey = (weaponId: string): string => `projectile:${weaponId}:spectrum`;`. At the end of `drawProjectile()`, after the existing `graphicsTexture(...)` call:
```ts
  if (!def.arc) { // arc weapons never fire volleys
    graphicsTexture(scene, projectileSpectrumTextureKey(def.id), w, h, (g) => {
      g.fillStyle(0xffffff, 1); // white base so a runtime tint prints the exact swatch color
      g.fillRoundedRect(2, 2, length, width, width / 2);
      if (color !== PALETTE.ink) {
        g.lineStyle(1.5, PALETTE.ink, 1);
        g.strokeRoundedRect(2, 2, length, width, width / 2);
      }
    });
  }
```
4. `Projectile.ts`: add `tint` to `ShotParams`; import `projectileSpectrumTextureKey` alongside `projectileTextureKey`; in `fire()` replace the `setTexture` line with `this.setTexture(p.tint === undefined ? projectileTextureKey(p.weapon.id) : projectileSpectrumTextureKey(p.weapon.id));` and after `this.hitSerials.clear();` add `if (p.tint === undefined) this.clearTint(); else this.setTint(p.tint);`
5. `WeaponSystem.ts`: append `spectrum: SpectrumWindow` as the last constructor param + `private readonly spectrum: SpectrumWindow;` field + assign in the constructor. In `fireVolley()`'s per-projectile loop, before `p.fire({` add `const tint = this.spectrum.active ? this.spectrum.nextColor() : undefined;` and add `tint,` as the last field of the `p.fire({...})` object.
6. `keys.ts`: add the `paletteKilled` entry inside `GAME_EVENTS`, after `bossNameplate`.
7. `BossSystem.ts`: in `killBoss()`, in the `else if (def.behavior === 'palette')` branch, after `this.stains.length = 0;` add `this.scene.events.emit(GAME_EVENTS.paletteKilled);` (`GAME_EVENTS` is already imported).
8. `GameScene.ts`: field `private spectrum!: SpectrumWindow;` after the `weapons` field; in `create()` before the `weapons` line add `this.spectrum = new SpectrumWindow();` and append `this.spectrum` to the `new WeaponSystem(...)` call; in `update()` before `this.weapons.update(dt, input.firing);` add `this.spectrum.update(dt);`; in `bindSceneEvents()` add `const onPaletteKilled = (): void => { this.spectrum.open(); };`, register with `.on(GAME_EVENTS.paletteKilled, onPaletteKilled)` beside the `pauseRequest` `.on`, and `this.events.off(...)` beside the `pauseRequest` `.off` in the SHUTDOWN block; in `registerInvariants()` after the `'projectile-count'` invariant add `hook.addInvariant('spectrum-window', () => (this.spectrum.active && hook.stats.paletteKills === 0 ? 'spectrum window open without a palette kill' : null));`.
9. `HudScene.ts`: field `private spectrumText!: Phaser.GameObjects.Text;` after the `cropText` field, and `private spectrumUntil = 0;` after `cropUntil` (declaration AND the `create()` reset block); in `create()` after the `cropText` line add `this.spectrumText = this.add.text(0, 0, 'SPECTRUM', textStyle(13, PALETTE.red, { fontStyle: 'bold' })).setOrigin(1, 0.5).setVisible(false);`; after the `bossNameplate` listener add:
```ts
    const onPaletteKilled = (): void => {
      this.spectrumUntil = this.time.now + 800;
      this.tweens.killTweensOf(this.spectrumText);
      this.spectrumText.setScale(1).setAlpha(1);
      this.tweens.add({ targets: this.spectrumText, alpha: 0.35, scale: 1.2, duration: 200, yoyo: true, repeat: 1, ease: 'Sine.easeInOut' });
    };
    gameEvents.on(GAME_EVENTS.paletteKilled, onPaletteKilled);
```
plus `gameEvents.off(GAME_EVENTS.paletteKilled, onPaletteKilled);` in the SHUTDOWN handler; in `update()` after the two `cropText` position/visible lines add:
```ts
    this.spectrumText.setPosition(width - PAD - this.streakText.width - 8, PAD + 60); // same slot as RHYTHM
    this.spectrumText.setVisible(this.time.now < this.spectrumUntil);
```
10. `npm run check`, then `npm run smoke`.

### Pitfalls
- Tinting the existing weapon textures prints muddy dark colors (textures are ink/blue and Phaser tint multiplies) — colored shots must use the white `:spectrum` texture; normal shots must keep the original texture plus `clearTint()` so their look stays bit-identical.
- Both branches of `fire()` must set the tint (set or clear): pooled projectiles otherwise reuse the previous shot's color/texture.
- Color is decided per projectile inside the loop, not per volley: a 3-projectile volley prints three consecutive swatches; in-flight shots keep their printed color because nothing re-tints them.
- Age the window with the clamped `dt` in `GameScene.update` (before `weapons.update`) so it freezes on pause and lasts exactly 8 s of run time; at `left = 0` the very next shot prints ink.
- The note is event-driven like `bossNameplate` (edge flash, 800 ms) — do not add window state to `RunState` and do not add any sound, key, or second HUD element.
- `killBoss()` increments `hook.stats.paletteKills` before the emit, so the invariant reads a consistent value; a second Palette death re-`open()`s the window (back to 8 s, cycle back to red) and re-emits, reprinting the note.
- T0119 (Plumb) edits `WeaponSystem`/`GameScene` and T0122 (Boss shatter) edits `killBoss`; build on their merged code and keep insertions exactly at the lines above.

### Tests
`tests/core/spectrum.test.ts` (vitest, mirror `tests/core/swatchCascade.test.ts`): window is inactive until `open()`; after `open()`, `nextColor()` yields red, orange, yellow, green, blue, red, … for 12 calls, matching `PALETTE_BOSS.swatchColors` cyclically; `update(7.9)` stays active, further `update(0.1)` closes it; a second `open()` mid-window restarts the full 8 s and the first color back to red.
