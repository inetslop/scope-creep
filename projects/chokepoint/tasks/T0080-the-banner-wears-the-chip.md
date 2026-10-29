---
id: T0080
title: The banner wears the chip
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-28T23:26:44Z
epic: E1
---

## Goal
A tagged wave is seen where it lands, not only in the preview: when the wave banner (T0067) slides in, it wears the wave's own chip.

## Details
- When the "Wave N" banner slides in at the start of a tagged wave, the banner shows the wave's chip to the right of the number — today the only tag is T0071's quiet wave, so wave 8, 12, 16, … read "Wave 8 · quiet", using the same muted-blue chip look and size as the preview card's (T0071).
- The chip slot is generic: the wave carries its tag(s) from the wave plan, the banner shows them if there are any, and shows none if there are not — an untagged wave's banner is byte-identical to today (same width, same motion).
- Reuse the shared top-center slide-and-fade card (T0067's topBanner) with its existing motion (~200 ms in, ~500 ms hold, ~300 ms out); the card grows by the chip width and nothing else.
- No sound, no input. Later tags (E5's boss wave) wear the same slot.
- Closest example: the preview card's chip row (T0071) for the chip's look, and T0067's WaveBanner part for where the text goes.

## Acceptance criteria
- [ ] When a quiet wave (4, 8, 12, …) starts, the top banner shows "Wave N" with the same muted-blue "quiet" chip the preview card uses.
- [ ] An untagged wave's banner is unchanged: no chip, same width, same timing.
- [ ] The banner's in/hold/out timing is unchanged by the chip.
- [ ] Desktop 1280x720 and mobile 412x915 smoke pass with a quiet wave and a plain wave.

## Design (architect, yoga)

### Files
- edit `src/core/waves.ts` — add `tags: string[]` to `WavePlan`; set it in `planWave`'s return.
- edit `src/systems/WaveSystem.ts` — add a one-line `currentPlan` getter next to `nextPlan`.
- edit `src/ui/hud/topBanner.ts` — `show()` gains an optional `tags` param that paints the preview card's chips right of the number; the card grows by the chips' width only. (Import is the lowercase `./topBanner`, as `WaveBanner` does. Do NOT touch the untouched duplicate `TopBanner.ts` — T0060's file.)
- edit `src/ui/hud/WaveBanner.ts` — pass `game.waves.currentPlan?.tags ?? []` to `show()`.
- edit `tests/core/waves.test.ts` — pin the new `tags` field.

### Interfaces
```ts
// core/waves.ts, on WavePlan:
  /** The wave's tags (the banner and the preview wear them): e.g. 'quiet'. */
  tags: string[];
// planWave's single return becomes:
  return { number: wave, spawns: finalSpawns, hpMul: waveHpMul(wave), tags: isQuietWave(wave) ? ['quiet'] : [] };

// systems/WaveSystem.ts, next to `get nextPlan()`:
  /** The wave the board is sending now (the banner reads its tags; the preview reads nextPlan). */
  get currentPlan(): WavePlan | undefined {
    return this.plan;
  }

// ui/hud/topBanner.ts:
  show(lines: string[], tags: string[] = []): void
// ui/hud/WaveBanner.ts update():
      this.banner.show([`Wave ${game.run.wave}`], game.waves.currentPlan?.tags ?? []);
```

### Steps
1. `planWave` return + interface field (exact lines above).
2. `WaveSystem` getter.
3. Replace `src/ui/hud/topBanner.ts` in full — keep every existing line except: add `private chips: Phaser.GameObjects.Container[] = [];` and a `const CHIP_GAP = 6;` at top; in `show(lines: string[], tags: string[] = [])`, after `this.playing = true;` add `for (const c of this.chips) c.destroy(); this.chips = [];`; after `this.text.setText(...)` add the chip build, before the card/tween lines:
```ts
let cursor = this.text.width / 2 + CHIP_GAP; // right of the number, 6 px of air
for (const tag of tags) {
  const label = this.scene.add.text(0, 0, tag, textStyle(11, PALETTE.card, { fontStyle: 'bold' })).setOrigin(0.5);
  const w = Math.ceil(label.width) + 14;
  const g = this.scene.add.graphics();
  g.fillStyle(PALETTE.blueDeep, 1);
  g.fillRoundedRect(-w / 2, -9, w, 18, 9);
  const c = this.scene.add.container(w / 2, 0, [g, label]);
  c.setPosition(cursor + w / 2, 0);
  cursor += w + CHIP_GAP;
  this.chips.push(c);
  this.box.add(c);
}
const row = cursor - CHIP_GAP + this.text.width / 2;
const w = W + (row - this.text.width); // same width as today when there are no tags
const left = -row / 2 + this.text.width / 2;
this.text.x = left;
for (const c of this.chips) c.x += left;
```
and `this.card.setTexture(cardTexture(this.scene, w, this.h, 24));`. The chip is built exactly like `NextWavePreview.build()`'s quiet chip (same `textStyle(11, PALETTE.card, {fontStyle:'bold'})`, same `fillRoundedRect(-w/2, -9, w, 18, 9)`, same `+14` padding).
4. `WaveBanner.update()` one-line change (exact above).
5. Test: in `tests/core/waves.test.ts`, inside `describe('planWave')`, add one `it`: `expect(planWave(8, new Rng(8), ENEMIES).tags).toEqual(['quiet']);` and `expect(planWave(5, new Rng(5), ENEMIES).tags).toEqual([]);` (`ENEMIES` is already imported there).

### Pitfalls
- Chips must be children of the sliding box (`this.box.add(c)`), or they stay put while the card slides; their `x` is box-local.
- Without tags `w` must come out exactly `W` (140) and `left` exactly 0 — the untagged banner is byte-identical: don't re-derive `W`, keep the `72`-tall two-line branch, keep tweens 200/700/300.
- Destroy the previous show's chips at the start of `show()`; chips are built per show (label width is measured), never kept module-level.
- `currentPlan` returns `this.plan` (set in `start()`), not `this.planned` (the build phase's plan).
- No `·` dot: the word rides in the chip only. Card with one chip is ~192 px wide — fits 412px portrait; no `fitScale` needed.

### Tests
- `tests/core/waves.test.ts`: the `tags` assertion above (a new field a later change could silently drop).
- Smoke (`npm run smoke`) desktop 1280x720 + mobile 412x915 with a quiet wave (banner wears the chip) and a plain wave (banner unchanged).
