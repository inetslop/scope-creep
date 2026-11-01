---
id: T0326
title: Wave 30 cheers, and offers to claim now or keep going
assignee: asus
size: M
priority: 1
status: done
depends_on: [T0325]
attempts: 1
created: 2026-10-31T23:37:22Z
claimed_at: 2026-11-01T07:22:17Z
finished_at: 2026-11-01T07:54:41Z
epic: E9
---

## Goal
The owner's call: reaching wave 30 is the game's big milestone (it unlocks the next level), so the game says so. When wave 30 is cleared, a card congratulates the player and asks: end the run now, claim the rewards and go on to the next level, or keep going?

## Details
- **When:** right after wave 30 is cleared, before the draft opens. Once per run: a resumed run past wave 30 never asks again (record it in the run save; older saves count as asked once their wave is past 30).
- **The card** (an overlay scene, a white card on the shade, like the pause):
  - Title "Wave 30!".
  - One line: when this run unlocks the next level (its level = the profile's slots and the slots are below the set size): "Level n+1 is yours. Claim now to play it." Otherwise: "30 waves held."
  - Two buttons: **Claim rewards** ends the run with its rewards, through the same deliberate end as the pause's Quit run (the `RunFlow` method from T0325; the end card titled "Run ended"), and **Keep going** closes the card and the draft opens as usual. Keep going is the default (Enter or Space); Claim has its own key (C). Key hints on both.
  - The tier chime (or the existing milestone sound) plays when it opens.
- **Keeping going never loses the unlock:** the slot is earned by reaching wave 30 (`levelSlotsAfter`, unchanged), whenever the run then ends.
- Every mode (normal, Iron, ghost) and every level.
- ?smoke: the card picks Keep going on its own.

## Acceptance criteria
- [ ] Clearing wave 30 opens the card once; a resumed run past wave 30 doesn't open it.
- [ ] The line names the next level only when this run unlocks it.
- [ ] Claim rewards opens the end card titled "Run ended" with this run's coins; the menu then has no Resume.
- [ ] Keep going opens the draft, and the run goes on as before.
- [ ] Works with mouse, keys (Enter/Space, C) and touch at 1280×720 and 412×915.

## Design (architect, desktop)

### Files
- create `src/scenes/MilestoneScene.ts` — the wave-30 overlay card (Claim rewards / Keep going), modeled on `PauseScene.ts`
- edit `src/scenes/keys.ts` — add `milestone: 'Milestone'` to `SCENES` (next to `pause`)
- edit `src/main.ts` — import + register `MilestoneScene` (right after `PauseScene`)
- edit `src/core/run.ts` — add `milestone30Asked` field to `RunState`
- edit `src/core/saveRun.ts` — add field to `SavedRun`, a load validation, and the older-save fallback
- edit `src/systems/RunSave.ts` — persist + restore the flag
- edit `src/systems/RunFlow.ts` — add `proceedToDraft()` and call it from `clearWave()`
- edit `tests/core/saveRun.test.ts` — `sample()` gains the field; test the older-save fallback
- edit `tests/systems/runFlow.test.ts` — wave 30 now opens the milestone, not the draft

### Interfaces
```ts
// core/run.ts (next to haulerTold)
milestone30Asked = false; // the wave-30 milestone card was shown once this run

// core/saveRun.ts — SavedRun gains:
milestone30Asked: boolean; // the wave-30 milestone card was shown; older saves predate the field
// in loadSavedRun's returned object:
milestone30Asked: p.milestone30Asked === true || p.wave > LEVEL_UNLOCK_WAVE,

// systems/RunFlow.ts
private proceedToDraft(): void // opens the milestone once at wave 30, else openDraft()
```

### Steps
1. `keys.ts`: after `pause: 'Pause',` add `milestone: 'Milestone',`.
2. `main.ts`: add `import { MilestoneScene } from './scenes/MilestoneScene';` after the `PauseScene` import; insert `MilestoneScene` into the `scene: [...]` array immediately after `PauseScene`.
3. `core/run.ts`: after the `haulerTold` field add `milestone30Asked = false; // the wave-30 milestone card was shown once this run`.
4. `core/saveRun.ts`: `import { LEVEL_UNLOCK_WAVE } from './levels';`; in `SavedRun` after `haulerTold` add the field above; after the `haulerTold` validation line add `if (p.milestone30Asked !== undefined && typeof p.milestone30Asked !== 'boolean') return undefined;`; in the returned object after `haulerTold: ...` add the `milestone30Asked:` line above.
5. `RunSave.ts`: in `persist()` after `haulerTold: run.haulerTold,` add `milestone30Asked: run.milestone30Asked,`; in `restore()` after `run.haulerTold = saved.haulerTold;` add `run.milestone30Asked = saved.milestone30Asked;`.
6. `RunFlow.ts`: `import { LEVEL_UNLOCK_WAVE } from '../core/levels';`; in `clearWave()` replace **both** `this.openDraft()` calls (the one inside the clean-wave `delayedCall`, and the `else` one) with `this.proceedToDraft()`; add:
```ts
  /** The wave-30 milestone opens in place of the draft, once per run; otherwise the draft opens. */
  private proceedToDraft(): void {
    if (this.run.wave === LEVEL_UNLOCK_WAVE && !this.run.milestone30Asked) {
      this.run.milestone30Asked = true;
      this.scene.scene.launch(SCENES.milestone);
      this.scene.scene.pause();
      return;
    }
    this.openDraft();
  }
```
7. `MilestoneScene.ts` (full file):
```ts
import Phaser from 'phaser';
import { LEVEL_AUGMENTS } from '../content/levels';
import { PALETTE } from '../content/palette';
import { LEVEL_UNLOCK_WAVE } from '../core/levels';
import { loadProfile } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { makeCard } from '../ui/card';
import { textStyle, titleStyle } from '../ui/text';
import { uiCamera, viewSize } from '../ui/display';
import { getGameScene, getSfx, onKey, onResize, SCENES } from './keys';

/** The wave-30 milestone: one card asking to claim the run now or keep going. In ?smoke it keeps going on its own. */
export class MilestoneScene extends Phaser.Scene {
  constructor() {
    super(SCENES.milestone);
  }

  create(): void {
    uiCamera(this);
    hook.overlay = SCENES.milestone;
    const game = getGameScene(this);
    let closed = false;
    const keepGoing = (): void => {
      if (closed || !this.scene.isActive()) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop();
      game.flow.openDraft();
    };
    const claim = (): void => {
      if (closed || !this.scene.isActive()) return;
      closed = true;
      hook.overlay = '';
      this.scene.stop();
      game.flow.quitRun(); // T0325's deliberate end: pays out and opens the "Run ended" card
    };

    const shade = this.add.rectangle(0, 0, 10, 10, PALETTE.ground, 0.78).setOrigin(0).setInteractive();
    const profile = loadProfile(window.localStorage);
    const slots = profile.levelSlots;
    // This run earns the next slot: every slot is switched on and the set is not full.
    const unlocks = game.run.level.length === slots && slots < LEVEL_AUGMENTS.length;
    const lineText = unlocks ? `Level ${slots + 1} is yours. Claim now to play it.` : `${LEVEL_UNLOCK_WAVE} waves held.`;

    const panelW = 360;
    const PAD = 28;
    const GAP_S = 10;
    const GAP_B = 22;
    const maxW = panelW - 32;

    const title = this.add.text(0, 0, `Wave ${LEVEL_UNLOCK_WAVE}!`, titleStyle(34)).setOrigin(0.5);
    const line = this.add.text(0, 0, lineText, textStyle(15, PALETTE.muted, { align: 'center' })).setOrigin(0.5);
    if (line.width > maxW) line.setStyle({ wordWrap: { width: maxW } });

    const claimButton = makeButton(this, 0, 0, 'Claim rewards', claim, { width: 240, height: 56, radius: 28, fill: PALETTE.ink });
    const keepButton = makeButton(this, 0, 0, 'Keep going', keepGoing, { width: 240, height: 52, radius: 26 });
    claimButton.content.add(this.add.text(-240 / 2 + 12, -56 / 2 + 12, 'C', textStyle(12, PALETTE.faint, { fontStyle: 'bold' })));
    keepButton.content.add(this.add.text(-240 / 2 + 12, -52 / 2 + 12, 'Space', textStyle(12, PALETTE.faint, { fontStyle: 'bold' })));

    // Card height from the content, then place everything top-down in one column.
    const panelH = Math.ceil(PAD + title.height + GAP_S + line.height + GAP_B + 56 + GAP_S + 52 + PAD);
    const panel = makeCard(this, 0, 0, panelW, panelH, 28);
    let y = -panelH / 2 + PAD;
    const cy = (hh: number): number => {
      const c = y + hh / 2;
      y += hh;
      return c;
    };
    title.setY(cy(title.height));
    y += GAP_S;
    line.setY(cy(line.height));
    y += GAP_B;
    claimButton.container.setY(cy(56));
    y += GAP_S;
    keepButton.container.setY(cy(52));

    const box = this.add.container(0, 0, [panel, title, line, claimButton.container, keepButton.container]);
    const layout = (width: number, height: number): void => {
      shade.setSize(width, height);
      shade.input?.hitArea.setTo(0, 0, width, height);
      box.setPosition(width / 2, height / 2).setScale(Math.min(1, (width - 24) / panelW, (height - 24) / panelH));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    onKey(this, (e) => {
      if (e.key === 'Enter' || e.key === ' ') keepGoing();
      if (e.key === 'c' || e.key === 'C') claim();
    });
    getSfx(this)?.tierChime('epic'); // the milestone chime as the card opens
    if (flags.smoke) this.time.delayedCall(1000, keepGoing);
  }
}
```
8. `tests/core/saveRun.test.ts`: add `milestone30Asked: false,` to `sample()` (after `haulerTold`); add a test mirroring the `streakPaid` one:
```ts
  it('round-trips the wave-30 flag, and an older save loads as asked once its wave is past 30', () => {
    const store = memory();
    saveRun(store, sample({ milestone30Asked: true, wave: 31 }));
    expect(loadSavedRun(store)).toEqual(sample({ milestone30Asked: true, wave: 31 }));
    const old = { ...sample({ wave: 31 }) } as Record<string, unknown>;
    delete old.milestone30Asked; // older saves predate the field
    store.setItem(SAVED_RUN_KEY, JSON.stringify(old));
    expect(loadSavedRun(store)).toEqual(sample({ wave: 31, milestone30Asked: true }));
    const old30 = { ...sample({ wave: 30 }) } as Record<string, unknown>;
    delete old30.milestone30Asked;
    store.setItem(SAVED_RUN_KEY, JSON.stringify(old30));
    expect(loadSavedRun(store)).toEqual(sample({ wave: 30, milestone30Asked: false }));
    broken({ milestone30Asked: 'x' });
  });
```
9. `tests/systems/runFlow.test.ts`: change the `for (const wave of [10, 20, 30])` loop to `[10, 20]`, and add two cases in the same `describe` (the fake records `launch:`/`pause` and `SCENES.milestone` is `'Milestone'`):
```ts
  it('clearing wave 30 cleanly opens the milestone card in place of the draft, once', () => {
    const { run, flow, calls, fireBeat } = fakeClearFlow(30);
    (flow as unknown as { clearWave(): void }).clearWave();
    expect(calls).toContain('cleanLines');
    expect(calls).not.toContain(`launch:${SCENES.milestone}`); // held for the beat
    fireBeat();
    expect(calls).toContain(`launch:${SCENES.milestone}`);
    expect(calls).not.toContain(`launch:${SCENES.draft}`);
    expect(run.milestone30Asked).toBe(true);
  });
  it('does not open the milestone a second time in the same run', () => {
    const { run, flow, calls, fireBeat } = fakeClearFlow(30);
    run.milestone30Asked = true;
    (flow as unknown as { clearWave(): void }).clearWave();
    fireBeat();
    expect(calls).toContain(`launch:${SCENES.draft}`);
    expect(calls).not.toContain(`launch:${SCENES.milestone}`);
  });
```

### Pitfalls
- The Claim button calls T0325's deliberate-end method. Read its **exact** name from `src/systems/RunFlow.ts` at implementation time (it is the method T0325 rewires the pause's "Quit run" to; referenced here as `quitRun()`). Stop the milestone scene *before* calling it.
- The "Run ended" end-card title and the menu-loses-Resume both come from T0325 — do **not** reimplement them or edit `GameOverScene` here.
- The "Level n+1" line shows only when `run.level.length === profile.levelSlots && profile.levelSlots < LEVEL_AUGMENTS.length`; otherwise it is "30 waves held."
- The milestone is an overlay: set `hook.overlay` on create and clear it on close; the Game is paused (launch+pause in `proceedToDraft`), so its hotkeys won't fire under the card.
- The TEMP wave-10 smoke freeze in `clearWave` (T0279) stops the smoke run before wave 30, so the auto-Keep-going is only exercised once that TEMP is removed. Do **not** touch that line.
- `runFlow.test.ts`'s wave-30 case must expect the milestone, not the draft, or the suite fails.

### Tests
- `saveRun`: older save without the key loads as asked iff its wave is past 30; round-trips the flag; rejects a non-boolean.
- `runFlow`: clearing wave 30 cleanly opens the milestone (not the draft) exactly once; a run already asked opens the draft.

## Result (attempt 1, asus)

Clearing wave 30 now opens a new "Wave 30!" overlay card (src/scenes/MilestoneScene.ts, registered after PauseScene) that plays the tier chime and offers **Claim rewards** (C) — ending the run through the pause's existing deliberate end (`endRunIntentionally`, so the "Run ended" card and no-Resume menu come from T0325 — or **Keep going** (Enter/Space, the default, and the ?smoke auto-pick) which opens the draft as usual. The line reads "Level n+1 is yours. Claim now to play it." only when this run earns the next slot (all slots on, set not full), otherwise "30 waves held."; keeping going never loses the unlock. The once-per-run flag (`milestone30Asked`) lives on `RunState`, persists in the run save, and older saves count as asked once their wave is past 30. Tests added for the save round-trip/older-save fallback and for wave 30 opening the milestone (not the draft) exactly once; `npm run check` and `npm run smoke` both pass.

- Self-review: APPROVE
- Time: 32.4 min

```
projects/chokepoint/game/src/core/run.ts           |  1 +
 projects/chokepoint/game/src/core/saveRun.ts       |  4 +
 projects/chokepoint/game/src/main.ts               |  3 +-
 .../chokepoint/game/src/scenes/MilestoneScene.ts   | 94 ++++++++++++++++++++++
 projects/chokepoint/game/src/scenes/keys.ts        |  1 +
 projects/chokepoint/game/src/systems/RunFlow.ts    | 17 +++-
 projects/chokepoint/game/src/systems/RunSave.ts    |  2 +
 .../chokepoint/game/tests/core/saveRun.test.ts     | 16 ++++
 .../chokepoint/game/tests/systems/runFlow.test.ts  | 22 ++++-
 9 files changed, 155 insertions(+), 5 deletions(-)
```
