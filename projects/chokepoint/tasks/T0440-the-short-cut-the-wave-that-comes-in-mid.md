---
id: T0440
title: "The short cut: the wave that comes in mid-road"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-02T19:42:29Z
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
