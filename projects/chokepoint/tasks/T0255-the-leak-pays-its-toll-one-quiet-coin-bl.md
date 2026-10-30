---
id: T0255
title: "The leak pays its Toll: one quiet coin blip at the exit"
size: S
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T04:48:47Z
epic: E4
---

## Goal
Toll — the first augment whose income comes from losing (T0234) — gets its own note: the moment a leak pays its gold, one small muted coin blip plays at the exit, so the payout on the loss is heard where the gold pop already shows it.

## Details
- One 60 ms sine at the coin chime's low note (E5, T0009), volume 0.08 (just under the tier chime's quiet class, T0032). A new one-note method in the Sfx module (`src/audio/Sfx.ts`) next to the coin chime.
- Played once per leak that pays — from the same code path that pays the Toll gold (T0234's rule in `src/core/toll.ts` and its call in the leak flow), so the blip and the gold pop at the exit are one event. A leak with three Toll towers pays the summed gold (T0234) but plays one blip; a leak with no Toll tower on the board plays none.
- A Hauler's own leak cost (a life plus 5 gold, T0057) plays exactly as today; the blip marks only the Toll's payment on top of it.
- Silent when sound is off (T0035). Procedural, no sound file. No new HUD or board mark: the gold pop already says the amount.

## Acceptance criteria
- [ ] A leak that pays Toll gold (at least one Toll tower standing) plays one 60 ms blip (volume 0.08) at the exit, together with T0234's gold pop.
- [ ] A leak with no Toll tower on the board plays no blip (and no gold pop, as today).
- [ ] Two or more Toll towers: still one blip per leak, and the gold pop pays the summed amount as today (T0234).
- [ ] A Hauler's leak plays its own cost as today; the blip plays only when a Toll also stands.
- [ ] With sound off (T0035) the gold pop still shows and the blip is silent.

## Design (architect, yoga)

### Files
- edit `src/audio/Sfx.ts` - add one new method `coinBlip()` directly after `techBuy()` (line 91).
- edit `src/systems/enemyHooks/tollLeak.ts` - pull `sfx` from the hook context and play the blip inside the existing 100 ms `delayedCall`, next to the gold pop.

### Interfaces
```ts
// in Sfx, after techBuy():
/** A leak pays its Toll at the exit: the coin chime's low note (E5) for 60 ms, just under the tier-chime's quiet class. */
coinBlip(): void {
  this.tone(659, 0.06, 'sine', 0.08);
}
```

### Steps
1. In `src/audio/Sfx.ts`, insert the `coinBlip()` method above between `techBuy()` (ends line 91) and `blip()` (line 93). Exact body: `this.tone(659, 0.06, 'sine', 0.08);` — 659 Hz is the coin chime's E5 from `chime()` (line 83); 0.06 = 60 ms; 0.08 is just under the tier-chime's 0.1 quiet class.
2. In `src/systems/enemyHooks/tollLeak.ts`: change line 10's destructuring `({ run, fx, towers })` to `({ run, fx, towers, sfx })`, and replace line 16's one-line `delayedCall` with:
```ts
    fx.scene.time.delayedCall(100, () => {
      fx.popText(x - 40, y - 20, `+${pay}`);
      sfx?.coinBlip();
    });
```
The blip must go inside the `delayedCall` callback, after the `popText`, so blip and gold pop are one event. Use `sfx?.` (context type is `Sfx | undefined`).
3. Optionally extend line 6 of tollLeak's doc comment to mention the coin blip lands with the pop.

### Pitfalls
- Do not destructure without the `?.` — `sfx` is `Sfx | undefined`; a bare `sfx.coinBlip()` fails the typecheck.
- Do not move the blip out of the `delayedCall` or before the `pay <= 0` guard: it must play only when a Toll tower stands, and at the same moment as the gold pop.
- Muting needs no work: `tone()` already returns early when `muted`; the gold pop (text) is unaffected.
- No positional audio: Sfx sounds are global; "at the exit" means tied to this event, nothing to place.
- Do not touch `haulerLeak.ts` or `EnemySystem` — the Hauler's −5 pop is a separate hook that already fires for the same leak.

### Tests
- none (audio/juice).
