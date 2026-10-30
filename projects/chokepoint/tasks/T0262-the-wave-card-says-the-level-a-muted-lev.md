---
id: T0262
title: "The wave card says the level: a muted \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\"level N · w/10\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\" line"
assignee: yoga
size: S
priority: 2
status: in-progress
depends_on: [T0260]
attempts: 1
created: 2026-10-30T05:49:22Z
claimed_at: 2026-10-30T10:14:50Z
epic: E3
---

## Goal
The run's shape is readable at a glance: the wave card (top right) says which level the run is in and where the wave sits in it — E3's one HUD line.

## Details
- The wave card gains one small muted line under the wave number, the "held · N" chip's style (T0218): "level N · w/10", N the run's level and w the wave the card shows inside its level (wave 13 reads "level 2 · 3/10"; during the build phase the line refers to the wave about to start, like the number above it).
- The line shows from wave 1 ("level 1 · 1/10") until the run ends; while the card reads "Ready" (before wave 1) it is hidden. It is display-only: no input, no sound, nothing else on the card or the screen moves, and the "held · N" chip stays where it is.
- Nothing shown twice: no other element shows the level or the wave's place in it (the next-wave button shows the wave's enemies left, the stats card the lives and gold, the pause line the run so far).
- The card fits with the line and the chip at once, at 412x915 and 1280x720 (the longest line is "level 3 · 10/10").
- The file is the wave card's own file (src/ui/hud/WaveCard.ts if that is where it lives — the one that draws the top-right wave number and T0218's "held · N" chip); the closest example is T0218's held line in the same card.

## Acceptance criteria
- [ ] From wave 1 on, the wave card shows the muted "level 1 · 1/10" line under the number; it advances with the wave and reads "level 2 · 1/10" at wave 11.
- [ ] The line is hidden while the card reads "Ready", and it shows in both the build phase (referring to the next wave) and the wave phase.
- [ ] With the "held · N" chip showing, the line and the chip both fit the card at 412x915 and 1280x720.
- [ ] No other HUD element, scene or the pause screen changes.

## Design (architect, yoga)

### Files
- edit `src/ui/hud/WaveCard.ts` — add the muted "level N · w/10" line under the wave number; nothing else changes (no registration: the card is already in HudScene's parts).

### Interfaces
None new. Only `WaveCard`'s private surface: two fields and one changed method each.

### Steps
1. Fields: next to `private teach: ...` add `private line: Phaser.GameObjects.Text | undefined;` and next to `private shownTeach = false;` add `private shownLine = '';`.
2. Replace `update()` with exactly:
```ts
  update(game: GameScene): void {
    const lost = game.waves.heldLost;
    const teach = lost > 0 && game.run.wavesCleared - game.run.cleanWaves === 1; // the run's first held wave
    const wave = game.run.wave;
    this.wave.setText(wave > 0 ? `Wave ${wave}` : 'Ready');
    const lineWave = wave > 0 && game.run.phase === 'build' ? wave + 1 : wave; // in build, the wave about to start
    const line = lineWave > 0 ? `level ${Math.floor((lineWave - 1) / 10) + 1} · ${((lineWave - 1) % 10) + 1}/10` : '';
    if (lost !== this.shownLost || teach !== this.shownTeach || line !== this.shownLine) this.wear(lost, teach, line);
  }
```
3. Replace `wear()` with the current body plus: destroy `this.line` alongside chip/teach (`this.line?.destroy(); this.line = undefined;`); compute `const hasLine = line !== '';` and `this.h = H_NUM + (hasLine ? GAP + LINE : 0) + (hasTag ? GAP + CHIP + (teach ? GAP + LINE * 2 : 0) : 0);` (signature `wear(lost: number, teach: boolean, line: string): void`); after the number's `setY`, before the `if (hasTag)` block add:
```ts
    if (hasLine) {
      this.line = scene.add.text(0, -this.h / 2 + H_NUM + GAP + LINE / 2, line, textStyle(11, PALETTE.muted)).setOrigin(0.5);
      this.box.add(this.line);
    }
```
then add `+ GAP + LINE` to the chip's y offset (it becomes `-this.h / 2 + H_NUM + GAP + LINE + GAP + CHIP / 2`) and to the teach text's y offset (it becomes `-this.h / 2 + H_NUM + GAP + LINE + GAP + CHIP + GAP + LINE`); and at the end, before `this.place();`, set `this.shownLine = line;`.
4. Docstring: state the card now shows, from wave 1, the muted "level N · w/10" line under the number (hidden while it reads "Ready"; in the build phase it is the wave about to start).

### Pitfalls
- The line is plain text, not a chip: no graphics, no background, not bold — `textStyle(11, PALETTE.muted)` exactly like the teach line. The "held · N" chip keeps its own label and is untouched.
- `w` is `(lineWave - 1) % 10 + 1` and N is `Math.floor((lineWave - 1) / 10) + 1`; compute inline — core has no level function yet (T0260 designs it; don't import one).
- `wave > 0` in `lineWave` keeps the line hidden in the pre-wave-1 build ("Ready"); during "Ready" `h` stays `H_NUM` and no line object exists.
- Destroy the line text on every `wear` (it is a Text, destroyed directly, not a container) or a second line lingers; `shownLine` must end at its new value or `update` re-wears every frame.
- Do not change `W` (120): "level 3 · 10/10" is the longest line and fits like the teach line; the card only grows down (h 48→70 at least), so nothing at the top right is pushed or overlapped.

### Tests
none
