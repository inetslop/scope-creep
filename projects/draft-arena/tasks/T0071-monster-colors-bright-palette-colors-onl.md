---
id: T0071
title: "Monster colors: bright palette colors only, and no two monsters alike"
size: M
priority: 1
status: todo
depends_on: [T0073]
attempts: 0
created: 2026-10-31T12:51:01Z
---

## Goal
Every monster reads apart at a glance, in the game's bright candy colors. Today the Sleeper is a darkened pink that looks muddy next to everything else, and the Flee is a red circle like the Dot.

## Details
- A monster's body is a palette color as it is: never `shade(color, -x)` or any other darkened version.
- Sleeper: from its darkened pink to a bright warm color that no other monster uses.
- Flee: no longer red; a bright warm color that no other monster uses. Keep its shape, nose and faces.
- Once the Snail, Popper and Boing are gone (their removal is its own task) the monsters are Dot (red circle), Puff (purple pentagon), Zippy (pink triangle), Spitter (orange diamond), Sleeper (square) and Flee (circle with a nose). Four warm colors (red, orange, purple, pink) aren't enough for six: add warm candy colors to PALETTE, as light and bright as red, orange, purple and pink (not darker, and not yellow or green: those are rewards), and give every monster its own color.
- Anything drawn in a monster's color (its shots, its areas) follows it.

## Acceptance criteria
- [ ] No monster's body color is darkened: `grep -n "shade(" src/content/monsters/` finds no body color.
- [ ] Dot, Puff, Zippy, Spitter, Sleeper and Flee have six different colors, all from PALETTE.
- [ ] The Sleeper and the Flee look as bright as the Dot next to them.

## Design (architect, desktop)

### Files
- edit `src/content/palette.ts` - add two warm candy colors `magenta` and `coral` to `PALETTE`
- edit `src/content/monsters/sleeper.ts` - body color from `shade(PALETTE.pink, -0.35)` to `PALETTE.magenta`; drop the now-unused `shade` import
- edit `src/content/monsters/flee.ts` - body color from `PALETTE.red` to `PALETTE.coral`

### Interfaces
No new types or signatures. `Look.color` is a string; it will hold two new `PALETTE` entries. Exact palette lines, inserted after `  pink: '#f783ac',`:

```ts
  magenta: '#da77f2',
  coral: '#ffa8a8',
```

Both are bright (HSL lightness ~74-77%, same tier as red/orange/purple/pink), warm, not yellow/green. `magenta` (hue ~288) sits between purple (255) and pink (340); `coral` (hue 0, lighter than red) is the bright red a nose-circle can read against Dot's plain red.

### Steps
1. In `src/content/palette.ts`, insert the two lines above after `pink`, and change the header comment line "Monsters are warm (red, orange, purple, pink)" to "Monsters are warm (red, orange, purple, pink, magenta, coral)".
2. In `src/content/monsters/sleeper.ts`:
   - line 1 becomes `import { chase, drawCritter, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';` (remove `shade`).
   - line 13 becomes `const look: Look = { shape: 'square', color: PALETTE.magenta, face: CALM };`
   - line 14 comment: "A deep pink squashed cushion;" → "A magenta squashed cushion;".
3. In `src/content/monsters/flee.ts`, line 16 becomes `const look: Look = { shape: 'circle', color: PALETTE.coral, face: CALM };`. Nothing else in that file: the nose fill (line 45) already uses `look.color`, and Sleeper's eye patches (line 29) already use `look.color`, so both follow automatically.
4. Run `npm run check` (typecheck + lint + content tests), then `npm run smoke`.

### Pitfalls
- Do NOT touch `snail.ts`, `popper.ts` or `boing.ts`: T0073 removes them. Boing keeps its darkened red body until then — that is expected, and the acceptance grep passes once T0073 has landed (this task is sequenced after it). Do not "fix" Boing's color.
- Forgetting to remove the unused `shade` import in `sleeper.ts` fails lint.
- Hex values must be exactly `#rrggbb` lowercase; `content.test.ts` checks every `look.color` against a hex regex.
- Do not change Dot/Puff/Zippy/Spitter colors, `glob.ts`, or any area/status/effect/accessory color — Spitter keeps orange, so its orange glob stays correct.
- No registry changes, no new files, no engine changes, no CSS.

### Tests
none (no pure helpers added; every content item is tested automatically by engine/tests/).
