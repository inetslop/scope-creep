---
id: T0023
title: "Anchor: a rooting augment that stops the road"
size: L
priority: 3
status: todo
depends_on: [T0021, T0012]
attempts: 0
created: 2026-10-28T05:03:06Z
epic: E4
---

## Goal
A new support augment with a behavior nothing in the game has: a full timed stop (root), not a partial slow. The player can freeze a stretch of road to set up a kill, and any attacking tower can grow a stop on its hits.

## Details
- New pool augment (rolls at all tiers like Lance — not Epic-only). **Closest existing augment:** Frost — both are support augments with no attack of their own. **What is new:** Frost slows continuously and partially (40% on hits); Anchor stops completely for a timed window — a full stop no current augment does, and a timed pulse rather than a standing aura.
- **As a tower's first augment (support role, no attack, like Frost):** every 3.0 s it roots (fully stops) all enemies within 2.5 cells for 0.75 s. A rooted enemy does not move (slows cannot extend or override it — the stop wins while it lasts), can still be hit and killed, and resumes walking from exactly where it stood when the root expires.
- **When added to a tower:** "Hits root the enemy for 0.5 s." — applied on each hit, not on a timer. Every extra copy of Anchor in the same tower lengthens every root it applies by +0.25 s (a Bolt+Anchor+Anchor's hits root 0.75 s; an Anchor+Anchor tower's own pulse roots 1.0 s).
- New combinations it creates:
  - Rapid + Anchor: near-continuous single-target rooting (attacks 50% faster, each hit roots)
  - Splash + Anchor: a burst that roots the whole pocket for 0.5 s
  - Bolt + Anchor: every hit briefly stops the enemy furthest along
  - Reach + Anchor: the heavy sniper hit briefly roots its target
  - Frost + Anchor: slow and root both apply; while the root lasts, the stop wins
- Overlapping roots do not stack: the longest remaining root holds the enemy.
- **Tiers (E4):** Common: pulse 0.75 s, hit-root 0.5 s. Rare: pulse 1.0 s, hit-root 0.75 s. Epic: pulse 1.5 s, hit-root 1.0 s. The +0.25 s per extra copy is the same at every tier.
- Not offered in the opening draft — it comes for free from the same rule that keeps Frost and Mint out of the opening offers (the opening offers only attacking augments).
- **Look on the tower:** a flat slate ring (muted gray-blue) on the tower's base with four small tick marks around it; if that hue is already used by another augment's look, take the nearest unused muted color. On each pulse, a flat light-blue ring expands from the tower to the edge of its 2.5-cell range over roughly the first 0.2 s of the root, so the stop is visible coming. A rooted enemy shows a flat light-blue ring on the ground beneath it for the duration of its root.
- **Card lines (Common):** first: "Roots everything within 2.5 cells for 0.75s, every 3s." / added: "Hits root for 0.5s (+0.25s per extra Anchor)."

## Acceptance criteria
- [ ] The draft can roll Anchor as Common, Rare and Epic (frame and gem row per tier, as T0002 defines them); the card shows that tier's numbers; it never appears in the opening draft.
- [ ] A lone Anchor tower never fires; every 3.0 s the light-blue ring expands to its range and every enemy inside is fully stopped for 0.75 s (Common): a Dart mid-stride halts, shows the ground ring, and resumes exactly 0.75 s later.
- [ ] A Bolt tower with Anchor in a later slot roots its target on every hit — the ground ring appears on the hit, not on a timer.
- [ ] A second Anchor in the same tower lengthens every root that tower applies by +0.25 s.
- [ ] A rooted enemy takes full damage and can die while rooted; two overlapping roots do not stack durations.
- [ ] The tower shows the slate ring with four ticks at 1x zoom at 412x915 and 1280x720; the pulse ring and the ground ring are readable at both sizes.
- [ ] A first-time player sees what an Anchor tower does without reading the card: a ring, then everything inside it stops.

## Design (architect, desktop)

### Files
- create `src/content/augments/anchor.ts` — the anchor content: both forms, tiers, and `ANCHOR_EXTRA_ROOT_SEC`
- create `tests/core/anchor.test.ts` — unit tests for the root rules
- edit `src/content/types.ts` — `root?` on `FirstForm` and `AddedForm`; `rootSec?` and `asTower?` on `TierValues` (+ one doc line)
- edit `src/content/augments/index.ts` — `import { anchor } from './anchor';` (before bolt) and `anchor,` in `AUGMENTS` after `frost,`
- edit `src/core/tiers.ts` — carry `root` in `tierFirst`/`tierAdded` (all branches); new `tierTowerLine()` after `tierAddedLine`
- edit `src/core/augments.ts` — `TowerSpec.root` + `EMPTY`; root combining in `towerSpec`; root lines in `describeSpec`
- edit `src/entities/Enemy.ts` — `rootLeft` field, reset in `spawn()`, `root()`, movement gate in `advance()`
- edit `src/systems/EnemySystem.ts` — `HitPayload.root`, apply it in `strike()`, `brokenRoot()`
- edit `src/systems/TowerSystem.ts` — add `root: spec.root,` to the payload in `attack()`
- edit `src/systems/attacks/pulse.ts` — the root pulse ring (see Interfaces)
- edit `src/systems/FxSystem.ts` — `rootWave()` after `wave()`
- edit `src/systems/enemyMarks.ts` — ground ring for rooted enemies, new `MARKS` entry before the frost mark
- edit `src/entities/towerLook.ts` — `DECORATIONS` entry (slate ring + 4 ticks) after the frost entry
- edit `src/scenes/DraftScene.ts` — show `tierTowerLine(b, copy.tier)` instead of `b.asTower` (line 74 + the import on line 5)
- edit `src/debug/runChecks.ts` — `['enemies.root', (g) => g.enemies.brokenRoot()],` after the `enemies.count` line
- edit `tests/content.test.ts` — line 39 becomes `expect(a.first.damage > 0 || a.first.slow || a.first.root).toBeTruthy();`; in the tier loop add `if (t.rootSec !== undefined) expect(t.rootSec).toBeGreaterThan(0);` and the same 6–56-char/no-label checks for `t.asTower` when present

### Interfaces
```ts
// content/types.ts — after `slow` in FirstForm and AddedForm:
root?: { sec: number };
// TierValues — after `splash`:
rootSec?: number;      // replaces this copy's root duration in both forms
asTower?: string;      // the card's tower line at this tier (Common: def.asTower)

// src/content/augments/anchor.ts (whole file):
export const ANCHOR_EXTRA_ROOT_SEC = 0.25;
export const anchor: AugmentDef = {
  id: 'anchor', name: 'Anchor',
  description: 'Roots everything around it. Added: hits root enemies.',
  asTower: 'Roots everything within 2.5 cells for 0.75s, every 3s.',
  asAdded: 'Hits root for 0.5s (+0.25s per extra Anchor).',
  look: { shape: 'square', color: 'pink', size: 0.22 }, // pink and square are the unused bright/shape
  first: { kind: 'pulse', damage: 0, range: 2.5, rate: 1 / 3, root: { sec: 0.75 } },
  added: { root: { sec: 0.5 } },
  tiers: {
    rare: { rootSec: 1, asTower: 'Roots everything within 2.5 cells for 1s, every 3s.', asAdded: 'Hits root for 0.75s (+0.25s per extra Anchor).' },
    epic: { rootSec: 1.5, asTower: 'Roots everything within 2.5 cells for 1.5s, every 3s.', asAdded: 'Hits root for 1s (+0.25s per extra Anchor).' },
  },
};

// core/augments.ts towerSpec: next to the spec init and the added-copy loop
let rootSec = 0;
const addRoot = (id: string, sec: number): void => {
  if (id !== anchor.id) return;
  rootSec += rootSec > 0 ? ANCHOR_EXTRA_ROOT_SEC : sec; // first Anchor sets the duration, each extra one +0.25
};
if (f.root) addRoot(first.id, f.root.sec);
// inside the for-loop over augments.slice(1), after the slow line:
if (e.root) addRoot(a.id, e.root.sec);
// after the loop, before the pulse-splash fixup: if (rootSec > 0) spec.root = { sec: rootSec };
// TowerSpec gains `root: { sec: number } | undefined;` (EMPTY: `root: undefined`)
// describeSpec: const root = spec.root ? `, and roots them for ${spec.root.sec}s` : ''; append it after the slow line
// in the shot and blast branches; the support branch (damage <= 0) becomes
//   line = spec.root ? `Roots everything around it for ${spec.root.sec}s` : `Slows everything around it by ${slow}%`;

// core/tiers.ts: tierFirst/tierAdded copy the root like the slow — common branch `root: f.root ? { ...f.root } : undefined`,
// tiered branch `root: f.root ? { ...f.root, sec: t.rootSec ?? f.root.sec } : undefined` (same in tierAdded).
export function tierTowerLine(def: AugmentDef, tier: Tier): string {
  return tier === 'common' ? def.asTower : def.tiers[tier].asTower ?? def.asTower;
}

// entities/Enemy.ts: `rootLeft = 0;` field (+ `this.rootLeft = 0;` in spawn()); in advance(), after the slowLeft block:
if (this.rootLeft > 0) { this.rootLeft -= dt; if (this.rootLeft <= 0) this.rootLeft = 0; }
const speed = this.rootLeft > 0 ? 0 : this.speed * (1 - this.slowPct); // replaces the existing speed line
root(sec: number): void { this.rootLeft = Math.max(this.rootLeft, sec); } // after slow()

// EnemySystem: HitPayload gains `root: { sec: number } | undefined;`; strike() adds `if (payload.root) e.root(payload.root.sec);`
// after the slow line. brokenRoot() mirrors brokenEnemy(): first active e with !Number.isFinite(e.rootLeft) || e.rootLeft < 0 || e.rootLeft > 10.
// systems/attacks/pulse.ts, replacing the bare fx.wave line:
if (spec.damage > 0 || !spec.root) fx.wave(tower.x, tower.y, range, payload.color);
if (spec.root) fx.rootWave(tower.x, tower.y, range);
// FxSystem.rootWave: like wave() but only fillRing(g,0,0,radius,4,0,2π,PALETTE.ice,0.9), start scale 0.2, track 200ms Cubic.easeOut.
// enemyMarks.ts new first entry: if (e.rootLeft > 0) fillRing(g, e.x, e.y + 2, e.def.look.size * 64 + 12, 3.5, 0, Math.PI*2, PALETTE.ice, 0.95);
// towerLook.ts new DECORATIONS entry: if (!spec.root) return; fillRing(g,0,0,BODY*1.6,3,0,2π,PALETTE.muted,0.95); then 4 ticks
// at a = π/4 + i·π/2: fillRing(g,0,0,BODY*1.6,6,a-0.12,a+0.12,PALETTE.muted,1);
```
No GameScene/HudScene/Sfx/hotkey changes; icon and tower body paint automatically from `AUGMENTS`.

### Steps
1. types.ts fields → 2. anchor.ts → 3. index.ts registration → 4. core/tiers.ts → 5. core/augments.ts → 6. Enemy.ts → 7. EnemySystem.ts → 8. TowerSystem.ts payload → 9. pulse.ts → 10. FxSystem.rootWave → 11. enemyMarks.ts → 12. towerLook.ts → 13. DraftScene.ts → 14. runChecks.ts → 15. tests → 16. `npm run check`.

### Pitfalls
- The slow timer must keep counting down WHILE rooted (both blocks run, don't `else` them), or a Frost+Anchor enemy comes off un-slowed.
- Reset `rootLeft` in `spawn()` or recycled enemies reappear rooted; `despawn()` needs nothing.
- The +0.25 is per extra Anchor copy: Bolt+Anchor+Anchor = 0.75 (not 1.0); the second copy's own tiered value is ignored.
- `tierFirst`/`tierAdded` must fresh-copy `root` in BOTH the common and tiered branches (the "never mutate the def" test).
- The pulse.ts guard keeps Frost/Splash exactly as they are: only a damage-0 rooting pulse drops its color wave.
- Card lines are hard-limited to 56 chars by `tests/content.test.ts`; the tier lines above already fit.
- T0012 (Mark, in progress on this same machine) edits types.ts, index.ts, core/augments.ts, Enemy.ts, EnemySystem.ts; T010 (yoga) edits towerLook.ts. Re-read each file immediately before editing, insert only the lines/entries above next to the frost-related ones, and never reformat or move existing code.
- A lone Anchor tower only pulses when an enemy is in range (existing tower behavior, same as Frost) — that is intended; the 3 s cadence then holds.

### Tests
- `tests/core/anchor.test.ts`: lone Anchor spec is pulse/0 damage/2.5 range/rate 1/3/root 0.75; Anchor+Anchor roots 1.0; Bolt+Anchor+Anchor roots 0.75; rare/epic first roots 1.0/1.5, epic added root 1.0, Epic Anchor first + extra copy = 1.75; Frost+Anchor spec has both slow 0.4 and root 0.5; `tierTowerLine(anchor,'rare')` and `tierAddedLine(anchor,'epic')` show the tier numbers; `describeSpec` of a lone Anchor matches /Roots everything around it for 0.75s/ and of Bolt+Anchor matches /roots them for 0.5s/.
- `tests/content.test.ts`: the two validation edits above (no new rule tests there).
