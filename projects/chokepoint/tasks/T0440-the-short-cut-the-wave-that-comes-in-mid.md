---
id: T0440
title: "The short cut: the wave that comes in mid-road"
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-11-02T19:42:29Z
claimed_at: 2026-11-02T20:59:28Z
---

## Goal
A fourth wave tag — the short cut: on its waves the walkers come in 40% down their own road, so the wave's front stretch is a no-fight and the fight lives in the back half. The tag's answer is placement (cover the back stretch, move or sell the front row) where the rush's answer is none — a new placement decision on roughly one wave in nine from mid-run (Pillar 1, Pillar 2).

## Details
- **The rule (pure, seeded, tested — the rush's own pattern, T0337):** from wave 16, every 9th wave that is not quiet, not tight, not rush and not a boss wave (the rush's own exclusion chain). Eligible waves carry a new tag in the plan's tag vocabulary (`core/waveTags`), chip word "short cut".
- **The effect:** the wave's road walkers spawn at 40% of the length of the path they walk, measured from the entrance they walk in from (a walker coming in through the far gate takes the 40% of its own path). The offset is read at the wave's spawn site — the same place the rush's 1.5× speed factor already applies (T0337) — so how an enemy walks, is hit, leaks and pays is untouched.
- **Unchanged:** the wave's size, mix, hp scaling, gold, clear bonus and the next-wave button's count (the plan sends exactly the enemies the untagged rule would; only the spawn distance differs); the flyer's straight crossing (its own route, the road doesn't hold it) is exempt; split children spawn at the split spot as usual; boss waves are excluded from the tag; the exit warning, the combo and every leak rule work as they do.
- **The chip and the teach (the existing tag display — no new element):** the preview card wears the muted "short cut" chip on its own line under the token row (the tight/rush chips' look, T0422), and the preview's own teach line under it while the run has not yet faced its first short cut wave — derived exactly like T0092 (`wavesCleared` below the rule's first eligible wave, never a run flag): "short cut — they come in mid-road". The wave banner wears "Wave N · short cut" the way the other tagged waves do (T0080's pattern; the T0257 boss chip if the banner's chips are per-tag).
- **Not the rush's mirror (the run module's bar):** rush compresses the wave's clock and can't be answered by placement — 1.5× walkers beat any tower. The short cut compresses the wave's road and can be answered by placement: the front stretch idles (the quiet tower's dot, T0233, names which towers) and the back stretch carries the wave, so the player answers over the run with back-road coverage, a move (E15) or a sell-and-rebuild (E7). It punishes the habit of building only at the first choke.
- **Not the "Short fuse" level:** different word, different screen (a level chip under the stats card vs the wave's tag chip and banner) and different rule (the build clock vs the road the wave walks).
- No new HUD element, sound, key or board mark; no run flag or save field (the teach derives, T0092).

## Acceptance criteria
- [ ] The rule's pure: from wave 16, every 9th non-quiet, non-tight, non-rush, non-boss wave carries the "short cut" tag and its spawn offset; every other wave's plan is byte-identical (tests over a seeded wave range, including the exclusions).
- [ ] In a short cut wave the road walkers appear 40% down their own path (test: the spawn distance ≈ 0.4 × the path length, within rounding); the wave's mix, hp, gold, bonus and the next-wave button's count read exactly as the untagged rule gives that wave, and a leaked short cut walker costs exactly as usual.
- [ ] The build phase before a short cut wave shows the muted "short cut" chip under the preview's token row, and the one-time teach line "short cut — they come in mid-road" while the run has not yet faced its first short cut wave (derived, never a run flag); the wave banner reads "Wave N · short cut".
- [ ] The flyer's crossing, the far gate's own send, split children and boss waves are untouched; non-short-cut waves are byte-identical (smoke on desktop and mobile).
- [ ] No new HUD element, sound, key or permanent mark; `npm run check` and the desktop + mobile smoke pass.

## Design (architect, cachyos-x8664)

Add a new wave tag to the existing `quiet`/`tight`/`boss`/`rush` family — a pure predicate + plan tag in `core/waves.ts`, one row in `WAVE_TAG_ROWS` in `core/waveTags.ts`, one teach line in `ui/hud/NextWavePreview.ts`, the banner + waves-reference wear it automatically from `plan.tags`, and a per-tag test. Everything stays in `core/` (no Phaser) and display; nothing grows `WaveSystem`/`EnemySystem`/`GameScene`.

### Files

- `src/core/waves.ts` — the predicate and the plan tag (always):
  - `export function isShortCutWave(wave: number): boolean` — mirrors `isRushWave`'s shape: `wave >= M && (wave - M) % N === 0 && !isQuietWave(wave) && !isTightWave(wave) && !isBossWave(wave)` (M/N are the spec's cadence; keep the exclusions so the cascade stays mutually exclusive).
  - Extend `planNormalWave`'s `tags` expression (currently `isQuietWave ? ['quiet'] : isTightWave ? ['tight'] : isRushWave ? ['rush'] : []`) by inserting `isShortCutWave ? ['<tagid>'] :` in the correct priority position (the spec says which existing tags it yields to). `planWave` already routes non-boss waves through `planNormalWave`, so no `planWave` change; boss waves keep `['boss']` and are untouched.
  - (Only if the twist is plan-speed, like rush) add `export function waveShortCutMul(wave: number): number` and fold it into `WaveSystem.update`'s speed — not needed if the twist is count/gaps only.
- `src/core/waveTags.ts` — add one row to `WAVE_TAG_ROWS`, in first-appearance order: `{ tag: '<tagid>', chip: PALETTE.<someDeep>, name: '<word>', meaning: '<one line>', when: 'every Nth, from M', rule: isShortCutWave }`. `tagChip(tag)` and `nextTaggedWave(current, rule)` already resolve it by `tag` — no change there.
- `src/ui/hud/NextWavePreview.ts` — add one entry to the local `TEACH` const: `{ tag: '<tagid>', first: <first wave>, text: '<tagid>: <one line>' }`. The preview's chip (`plan.tags[0]` → `tagChip`) and the waves-reference (`WavesScene` reading `WAVE_TAG_ROWS`) then wear it with no change.
- `src/core/farGate.ts` — (ONLY if the spec's twist is literally "enemies spawn mid-road / take the shortcut"): extend `isFarGateSpawn(index, plan, hasFarGate)` — it already receives `plan`, so add the short-cut condition (e.g. on a short-cut wave the split / all `index`es start at `farGateDistance`), reading `isShortCutWave(plan.number)`. `WaveSystem.update`'s spawn distance (`isFarGateSpawn(...) ? this.farGateDistance : 0`) then carries it with no change. If the twist is instead a plan change (count/gaps/speed), this file is not touched.
- `tests/core/shortCutWaves.test.ts` (new) — modeled on `tests/core/rushWaves.test.ts`.
- `tests/core/waveTags.test.ts` — extend the two assertions (see below).
- `src/debug/runChecks.ts` — one cheap invariant only if the twist is structural (e.g. a short-cut wave's plan is non-empty and its spawns are ordered); a pure cadence tag adds none (mirror rush).

### Interfaces

- One kebab-case id for the tag (`shortcut` or `mid-road` — the spec's) used in exactly: `isShortCutWave`'s tag, `planNormalWave`'s `['<tagid>']`, the `TEACH` entry's `tag`, the `WAVE_TAG_ROWS` row's `tag`, and the tests.
- `isShortCutWave: (wave: number) => boolean` — the SAME function referenced as `WAVE_TAG_ROWS[].rule`, so `nextTaggedWave` (the reference's "next: wave N") can't drift.
- The `WAVE_TAG_ROWS` row is plain `WaveTagRow` data (`{tag, chip, name, meaning, when, rule}`) — no new type; `chip` must be a `PALETTE.*Deep` color.
- `TEACH` is a local const in `NextWavePreview.ts` — no interface change.
- `isFarGateSpawn(index: number, plan: WavePlan, hasFarGate: boolean): boolean` — branch B extends the body, not the signature.

### Steps

1. Fix the spec's values: tag id, cadence (first wave + every-Nth + which tags it yields to), chip color, teach/meaning text, and which twist — plan-only (count/gaps/speed) vs. mid-road spawn.
2. `core/waves.ts`: add `isShortCutWave` (+ `waveShortCutMul` only if the twist is speed).
3. `core/waves.ts`: extend `planNormalWave`'s `tags` cascade in priority order.
4. `core/waveTags.ts`: add the row, positioned by when it first appears.
5. `ui/hud/NextWavePreview.ts`: add the `TEACH` line.
6. (mid-road branch only) `core/farGate.ts`: extend `isFarGateSpawn`.
7. Tests: new `tests/core/shortCutWaves.test.ts`; extend `tests/core/waveTags.test.ts`.
8. `debug/runChecks.ts`: add the invariant if warranted.
9. `npm run check` (typecheck + lint + unit tests) and `npm run smoke` (browser, desktop + phone) — both must pass.

### Pitfalls

- The `planNormalWave` `tags` expression is a priority cascade that must stay mutually exclusive: if the new cadence lands on an existing tag's slot, `isShortCutWave` must exclude it exactly like `isRushWave` does, or the wave carries two tags and the `plan.tags` `.toEqual(['<tagid>'])` tests fail.
- `nextTaggedWave` does `while (!rule(n)) n += 1` from `current + 1`; a predicate that never fires hangs it — keep `isShortCutWave` reachable (it is, by construction).
- The preview reads `plan.tags[0]` for its chip; a tagged wave's `tags` must be exactly `['<tagid>']` (single), else the chip/teach show the wrong tag.
- `WAVE_TAG_ROWS` is ordered "the order the run meets them"; `tests/core/waveTags.test.ts` asserts `WAVE_TAG_ROWS.map(r => r.tag)` equals `['quiet','tight','boss','rush']` and aligns `first = [4,6,10,11]` by row index — insert the row in first-appearance order and append to both, or that test breaks.
- Branch B's `isFarGateSpawn` is gated on the board having a far gate (`hasFarGate`); on boards without one, "mid-road" has no distance. Decide with the spec whether the tag's distance is independent of the board's far gate (then it needs its own distance source, not `this.farGateDistance`).
- `core/` must not import Phaser (lint enforced); the new code is pure. Do not add a method to `WaveSystem`/`EnemySystem`/`GameScene` — the twist lives in `core/waves.ts` (plan) or `core/farGate.ts` (spawn rule), read by `WaveSystem`.
- Don't drive-by-rename; one concern per file, one line per registry entry.

### Tests

- `tests/core/shortCutWaves.test.ts` (new) — `isShortCutWave`'s cadence array; a short-cut wave's `plan.tags` `.toEqual(['<tagid>'])` with `plan.spawns[0].delaySec === 0` and non-negative gaps; and "a short-cut wave that collides keeps its own tag" at the spec's colliding waves (mirror rush's `32/46/60` pattern).
- `tests/core/waveTags.test.ts` (extend) — `WAVE_TAG_ROWS.map(r => r.tag)` equals the five tags in order, `first` gains the new tag's first wave, and `nextTaggedWave(<start>, isShortCutWave)` is asserted.
- `npm run check` (lint: core/ no Phaser; all unit tests) + `npm run smoke` (the banner's chip, the preview's teach line, and the waves-reference row all render at the tag's waves, desktop + phone).

The spec's exact values (tag id, cadence, chip color, teach text, and whether the twist is plan-only or a mid-road spawn) are the only inputs the developer holds; every file, code shape, and test above is pinned.
