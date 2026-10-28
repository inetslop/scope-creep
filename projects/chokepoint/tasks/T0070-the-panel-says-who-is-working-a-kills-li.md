---
id: T0070
title: "The panel says who is working: a kills line per tower"
assignee: desktop
size: S
priority: 3
status: done
depends_on: []
attempts: 1
created: 2026-10-28T13:54:28Z
claimed_at: 2026-10-28T19:19:14Z
finished_at: 2026-10-28T19:38:40Z
epic: E1
---

## Goal
A player can see which towers are doing the work this run: every tower's panel gains a small "kills N" line — the first step toward a run summary.

## Details
- The tower panel (the card that opens when a tower is selected, with its row of augment cards, T0008) gains one small muted-gray line at the bottom, under the augment rows: "kills N" — N is the number of enemies this particular tower killed this run with damage the tower itself dealt (its shots, its Beam, its Ember ticks, its Trap springs).
- **Attribution** follows the existing source-of-kill rule: the tower whose damage dealt the killing blow counts it (an Ember killing tick counts for the source tower, T0028; Mark's amplification does not move the kill).
- A pure support tower (Rally, Mint, a Momentum with no attack, T0064) shows "kills 0" — Rally's boost never lends kills to the boosted tower.
- "kills 0" is shown (an idle tower reads as idle). N resets on a new run and on a resumed run (T0042) — the line is a display stat, not part of the save.
- No rule change: gold, combo, score, coins and "stopped" are all untouched by this task.
- Chained in the kill-flow chain (behind T0061; cycle 35) on purpose: it inserts at the same line of the kill block in EnemySystem as the trail, so the kill block takes one edit at a time.

## Acceptance criteria
- [ ] Selecting a tower shows a small muted-gray "kills N" line at the bottom of its panel; a freshly built tower shows "kills 0".
- [ ] N grows by 1 for each enemy the tower's own damage kills, including Beam kills and Ember killing ticks (counted for the source tower); a kill by another tower does not grow it.
- [ ] A pure support tower (Rally, Mint, Momentum) shows "kills 0" even while it works; a tower boosted by Rally counts the kills it lands itself.
- [ ] A new run and a resumed run start every tower at "kills 0"; no other number on the panel, the HUD or the rewards card changes.

## Design (architect, desktop)

### Files
- edit `src/entities/Tower.ts` - one new public field `kills` (run-scoped counter, not saved)
- edit `src/systems/EnemySystem.ts` - one line in `strike()`: credit the kill to `payload.source`
- edit `src/ui/hud/TowerPanel.ts` - the muted "kills N" line under the augment rows, refreshed live

### Interfaces
```ts
// src/entities/Tower.ts — new public field, no other signature changes:
kills = 0;
```

### Steps
1. `src/entities/Tower.ts`, right after `rallyRateMul = 1;` (line 42):
   ```ts
   /** Enemies this tower killed with its own damage this run (the panel's "kills N" line). */
   kills = 0;
   ```
2. `src/systems/EnemySystem.ts`, in `strike()`, the line directly after `hook.stats.enemiesKilled += 1;` (line 118):
   ```ts
   payload.source.kills += 1; // its own damage dealt the killing blow: the kill is its
   ```
   If T0054 landed first and the block shifted, find the anchor line `hook.stats.enemiesKilled += 1;` and insert directly under it.
3. `src/ui/hud/TowerPanel.ts`:
   a. New field after `private unlock: ...` (line 30): `private killsText: Phaser.GameObjects.Text | undefined;`
   b. In `build()`, after `this.unlock = undefined;` (line 58) add: `this.killsText = undefined;`
   c. Line 66: `const H = (ROW_H + ROW_GAP) * n + 146;` → `const H = (ROW_H + ROW_GAP) * n + 146 + 18; // room for the kills line`
   d. Directly above `items.push(...this.slots(game, tower, left, w, H));` (line 94) add:
   ```ts
   // This run's kills by this tower, in the gap between the augment rows and the slot row.
   this.killsText = scene.add.text(left, H / 2 - 79, `kills ${tower.kills}`, textStyle(11, PALETTE.muted)).setOrigin(0, 0);
   items.push(this.killsText);
   ```
   e. In `update()`, between the rebuild `if` block and the `if (this.unlock)` block:
   ```ts
   const tower = game.building.selectedTower;
   if (this.killsText && tower) this.killsText.setText(`kills ${tower.kills}`); // no-op while unchanged
   ```
4. Run `npm run check`.

### Pitfalls
- The panel rebuilds only when `uiVersion` changes; kills happen mid-wave with the panel open, so step 3e is required (Phaser `setText` early-returns when the string is unchanged, so per-frame cost is a string compare). Never bump `uiVersion` on a kill.
- Keep step 3b: `build()` destroys the whole box, so a stale `killsText` would point at destroyed objects.
- Do not move the increment to TowerSystem or a new system: `strike()` is the one kill path for all attacks now and later (Beam, Ember ticks call it with `source` = the source tower), and Mark amplification happens inside `Enemy.hit()`, so attribution is already correct there.
- `kills` must not go into any save/ledger data — fresh `Tower` objects on a new or resumed run start at 0 by the field initializer.
- Do not add an `INVARIANTS` line (display stat, no rule change; `debug/runChecks.ts` is hot under several open tasks).
- Don't "tidy" the `+ 18` / `H / 2 - 79` numbers: they put the 11px line's baseline in the 32px gap between the last augment row and the slot row; the panel's bottom stays anchored above the hand bar.

### Tests
- none (no `src/core` rule changed; counter lives in a system, display in a HUD part)

## Note (by hand, 2026-10-28)

No longer waits on T0061: that only kept the tasks from editing the same files at once, and the runner now does that itself (a task can't start while another task that edits one of its files is being built). Where this task's text says another task lands first, it may land before or after: build against the code as it is when you start.

## Result (attempt 1, desktop)

(no summary)

- Self-review: APPROVE
- Time: 19.4 min
- Gate failed at "smoke"; fix round 1.
- Self-review made fixes (kept; checks pass).

```
projects/chokepoint/game/src/entities/Tower.ts      | 2 ++
 projects/chokepoint/game/src/systems/EnemySystem.ts | 1 +
 projects/chokepoint/game/src/ui/hud/TowerPanel.ts   | 9 ++++++++-
 3 files changed, 11 insertions(+), 1 deletion(-)
```
