---
id: T0492
title: "The claim's remembered line: the road-remembers run says how often the leakers came back"
size: M
priority: 2
status: todo
depends_on: [T0473]
attempts: 0
created: 2026-11-03T11:18:16Z
epic: E27
---

## Goal
The road remembers (T0473) folds a run's leakers back into later waves; on the claim card the run should say how often that happened, so a player can see at a glance whether a run was punished for leaking or held the road clean.

## Details
- A muted "remembered · N" line on the claim card (the rewards card's own column, the other muted lines' style), where N is the number of waves in which the memory fired (leakers came back) this run.
- The line shows only when the memory fired at least once (N ≥ 1); a run the memory never touched shows no line — the card's column is unchanged for those runs.
- It reads the run's per-type leak ledger that T0473 keeps (how many of the run's waves the memory added leakers to); it does not re-derive or re-count, and it shows on the main claim card, not the run's last page.

## Acceptance criteria
- [ ] In a run where the memory fired in at least one wave, the claim card shows a muted "remembered · N" line with N the count of waves the memory fired.
- [ ] In a run the memory never fired (every wave held clean, or the run never leaked a different regular type), no "remembered" line appears and the claim card's column is otherwise unchanged.
- [ ] The line fits its card at 412x915 and 1280x720 with the other muted lines; it shows nothing the screen already shows.

## Design (architect, desktop)

### Files
- edit `src/scenes/RewardsScene.ts` — one muted "remembered · N" line in the claim card's column, read from T0473's per-type leak ledger; no other file changes.

### Interfaces
No new types or exports. The only input is the per-type leak ledger field that T0473 adds to `RunState` in `src/core/run.ts` (written by `src/core/remember.ts`): per enemy type, how many waves the memory added that type's leakers to. Read it — never declare or write it here.

### Steps
1. Locate the ledger (T0473 is merged before this task): read `src/core/remember.ts` and the new `RunState` field it writes in `src/core/run.ts` (its doc comment says the memory added that type's leakers / how many waves). Note the exact field name and shape. If no such field exists, stop and report — do not invent one.
2. In `RewardsScene.create()`, right after the `levelLine` const (~line 142), add a create()-local (exactly the `levelLine` pattern):
   ```ts
   // The road-remembers line (T0473): the run's per-type leak ledger, summed — how often the
   // leakers came back. A create()-local like levelLine: a run the memory never touched shows no line.
   const rememberedN = <sum of the ledger's per-type counts>;
   const rememberedText = rememberedN >= 1 ? recipe(`remembered · ${rememberedN}`) : undefined;
   ```
   - Ledger is a record/map (type id → wave count): `const rememberedN = Object.values(run.<ledger>).reduce((a, b) => a + b, 0);`
   - Ledger is an array of `{ type: string; waves: number }`: `const rememberedN = run.<ledger>.reduce((a, r) => a + r.waves, 0);`
   Use whichever matches the field you found. Summing the ledger is reading it; do not re-count from `run.story` or wave data.
3. Insert it into the column as its own group between the coins group and the board line — replace:
   ```ts
   rows.push(
     { height: coinRecipe.height, after: gapBig },
     { height: boardText.height, after: flawlessText ? gapSmall : gapBig },
   );
   ```
   with:
   ```ts
   rows.push({ height: coinRecipe.height, after: gapBig });
   if (rememberedText) rows.push({ height: rememberedText.height, after: gapBig });
   rows.push({ height: boardText.height, after: flawlessText ? gapSmall : gapBig });
   ```
4. Place it: immediately after `coinRecipe.setY(top + col.ys[i++]);`, before `boardText.setY(...)`, add `if (rememberedText) rememberedText.setY(top + col.ys[i++]);`.
5. Container: immediately after `if (levelLine) parts.push(levelLine);`, add `if (rememberedText) parts.push(rememberedText);`.
6. Change nothing else: no class fields, no `update()` entry, no `layout()`/`stack()` change, no story-card change, no GameOver/Summary scene change.

### Pitfalls
- N = 0 must yield `undefined` (no line) — the column stays byte-identical to today for runs the memory never touched.
- Keep `rememberedText` a create()-local like `levelLine`: the scene instance is reused between runs; do not make it a class field, and add no shutdown listener (`scene.start` disposes the objects).
- Static line, like the other recipe lines — no count-up in `update()`.
- Its y comes from `stack()`; never a hand-picked offset. The box already scales to fit: fullest state (all stats, both recipes, level line, remembered, board, Flawless, slot, Menu, plus the story card with several mark rows and the loudest line) puts the card at ~660 px, so at 412x915 the scale stays at ~1 and at 1280x720 ~0.8 — it fits with no overlap.
- If the text is missing from `parts`, it renders unscaled at (0,0) — check the container list.
- Use the existing `recipe()` helper (16 px `PALETTE.muted`, shrinks to `maxW`); the text is short enough that it never shrinks.

### Tests
- none (UI-only; the ledger and its counting are T0473's, tested by T0473).

Fullest-state check: every line can show at once — title, Waves held, Stopped, Clean, Best combo, Score + recipe, +N coins, level line, coin recipe, `remembered · N`, Board XXXX, Flawless, level-slot line, Menu button, plus the Waves card (title, up to many mark rows, legend, loudest line); at 412x915 the box scale is ≈1, at 1280x720 ≈0.8, so the new line sits between the coin recipe and the board line in both.
