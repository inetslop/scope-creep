---
id: T0069
title: The pause line stars your record
assignee: asus
size: S
priority: 3
status: done
depends_on: [T0030]
attempts: 1
created: 2026-10-28T13:54:28Z
claimed_at: 2026-10-28T23:17:57Z
finished_at: 2026-10-28T23:34:25Z
epic: E1
---

## Goal
A record attempt is seen where a run is paused: the moment the run's wave equals the saved best wave, the pause screen's run line wears the best-run star.

## Details
- The run-so-far line on the pause screen (T0030: wave, lives, gold, the run's coins) shows the small yellow star — the same star, size and color as the profile card's (T0016) and the Recent line's (T0037) — next to the wave number from the moment the current wave equals the saved best wave, and it stays for the rest of the run (at or past the record).
- The star appears live: a pause opened after the run passes the best wave shows it with no extra step. A run that starts at or above the saved best (a resumed run, T0042) shows the star from its first pause.
- No other change to the pause screen: the sound row (T0035) is its own task, the run line's numbers are T0030's, and the profile card's own star (T0016) is untouched.
- Chained behind T0035 on purpose: the pause card grows one element at a time, never two tasks editing it at once.

## Acceptance criteria
- [ ] With the saved best wave at 12: pausing at wave 11 shows the run line with no star; pausing at wave 12 or 13 shows the yellow star next to the wave number.
- [ ] The star is the same texture, size and yellow as the profile card's "Best wave" star.
- [ ] A run resumed at or above its saved best wave shows the star on its first pause.
- [ ] The rest of the pause screen (the key list, the sound row once T0035 is in, the run line's numbers) is unchanged.

## Design (architect, yoga)

### Files
- edit `src/scenes/PauseScene.ts` — the run line (T0030's `stats`) wears the best-run star. Only file.
### Interfaces
None — no types or signatures; the star is one `STAR_TEXTURE` image inside the existing line.
### Steps
1. Imports: add `import { artScale, STAR_TEXTURE } from '../art/textures';` after the `PALETTE` import; extend T0030's profile import to `import { coinsForRun, loadProfile } from '../core/profile';`.
2. In `create()`, replace T0030's `waveWord`/`coins`/`stats` block with (keep the `stats` text's exact y — whatever T0030 chose in the file, do not re-derive or move it):
```ts
const profile = loadProfile(window.localStorage);
const starred = profile.bestWave > 0 && game.run.wave >= profile.bestWave;
const waveWord = game.run.wave > 0 ? `Wave ${game.run.wave}` : 'Ready';
const coins = coinsForRun({ waves: game.run.wavesCleared, stopped: game.run.kills, clean: game.run.cleanWaves });
const lineStyle = textStyle(13, PALETTE.muted);
const kids: (Phaser.GameObjects.Text | Phaser.GameObjects.Image)[] = [];
let x = 0;
const waveText = this.add.text(0, 0, waveWord, lineStyle).setOrigin(0, 0.5);
kids.push(waveText);
x += waveText.width;
if (starred) { kids.push(artScale(this.add.image(x + 13, 1, STAR_TEXTURE))); x += 21; }
const restText = this.add.text(x, 0, ` · ${game.run.lives} lives · ${game.run.gold} gold · +${coins} coins`, lineStyle).setOrigin(0, 0.5);
kids.push(restText);
x += restText.width;
const stats = this.add.container(-x / 2, /* T0030's y */, kids);
```
3. Done — `stats` keeps its name, so the box-children line (`[panel, title, stats, …]`) is unchanged and the star rides in the line's container.
### Pitfalls
- Star geometry is the copy-paste precedent: centre 13 px past the wave text's right edge, 1 px below line centre, `artScale` size 1 — exactly `ProfileCard.ts` (`best.width / 2 + 13, 1`) and `RecentLine.ts` (`x + 13, 1`), same 16 px yellow `STAR_TEXTURE` painted at boot. It must sit between `Wave N` and `·`, never after `+Z coins` (criterion: "next to the wave number").
- `starred` needs the `bestWave > 0` guard: a fresh profile (best 0) must not star "Ready" (wave 0 ≥ 0).
- Longest starred line ≈ 321 px < 360 px card: still one line at 412x915 and 1280x720 (box scale is min 1 at both); nothing else on the card moves, resizes or rewaps.
- `run.wave` reads "the wave being fought, or the last one fought (0 before the first)" (`core/run.ts:21`): it is 12 during wave 12 and in the build/draft after clearing 12, so the star appears at the record and stays; a resumed run (T0042) starts at its saved wave and shows it from its first pause — no T0042 wiring needed. Computed once in `create()` like T0030's values: the run is frozen while paused, the profile only changes at run-over (`recordRun`), and the scene is re-created on every open — no `update()`, no listeners, nothing to clean up.
### Tests
none

## Note (by hand, 2026-10-28)

No longer waits on T0035: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Result (attempt 1, asus)

The pause screen's run line now wears the best-run star: when the run's wave has reached the saved best wave (and stays there, including for resumed runs), a small yellow star — same texture, size and color as the profile card's and Recent line's — appears right after "Wave N" in `src/scenes/PauseScene.ts`, computed once from `loadProfile()` at scene creation. No other part of the pause card moved or changed.

- Self-review: APPROVE
- Time: 16.5 min

```
projects/chokepoint/game/src/scenes/PauseScene.ts | 17 +++++++++++++++--
 1 file changed, 15 insertions(+), 2 deletions(-)
```
