---
id: T0273
title: "The boss's death: the burst and the name card"
size: M
priority: 2
status: todo
depends_on: []
attempts: 0
created: 2026-10-30T09:46:01Z
epic: E5
design_attempts: 1
---

## Goal
A boss death is a moment, not a pop: the corpse bursts big in the boss's own color and a card names it where the player is looking — E5's "a boss death is a moment: a big chip burst … and a card that names it". (Re-file of T0258, whose failure was an architect context overflow before any design; the design stands as written, tightened below.)

## Details
- **The trigger (a new enemy hook, the bossEscape / leakEcho / comboBreak pattern — T0269's bossEscape.ts is the closest example, read it first):** a new `src/systems/enemyHooks/bossDeath.ts`, registered in `src/systems/enemyHooks/index.ts` next to bossEscape. It fires on the **kill** of the enemy the current wave's plan declares as its boss — the plan's own boss id (T0269's pure `bossId` in `core/waves.ts` is the single source today; T0259's wave-20 plan will declare the Titan the same way). Data-driven off the plan and the def, never a hard-coded id. A kill, not a leak, not a split: the Orb's half-hp split (T0266) is a transformation, not a death — it must get neither burst nor card; a single hit from over half to zero is an ordinary boss kill and gets both.
- **The burst (FxSystem's own chip burst, T0034's milestone shape):** when a boss dies from any source (a Bolt shot, a Splash burst, a Lance pierce, a Chain leap, a Beam line already holding it, an Ember tick — all of them), its kill burst is **24 chips in the boss's own color** — twice the combo milestone's 12 (T0034) — instead of the normal 6. The kill gold pop (20 on a Colossus or the Orb), the combo counter and the coin slide to the tally (T0061) all play as usual; if the boss kill is also the ×10 milestone kill, the boss's 24-chip burst plays and the milestone's 12 does not.
- **The name card (the shared top-center card, topBanner — the last-stand banner's two-line pattern, T0060; there is no second card system):** slides in from above, holds, fades (~1 s, topBanner's own timing): the boss's name in bold ink over a muted "stopped". The name is read from the boss's def — the second boss (T0259's Titan) shows "Titan" with no change to this hook or card.
- **The collision:** at the moment of death the boss card (T0256) is already fading out (~200 ms) — the name card slides into the same top-center slot as it goes, so the two never hold the slot together for more than the boss card's fade. If the last-stand banner would take the card on the same frame, the boss death takes it (the rarer moment); at most one card at a time, topBanner's rule.
- No sound (the burst and the card are the moment, like the wave's last kill's ring, T0229). No new keys; the pause screen is unchanged.

## Acceptance criteria
- [ ] A boss kill on wave 10, from any damage source including an Ember tick, bursts 24 chips in the boss's own color and slides the two-line card: "Colossus" in bold ink over a muted "stopped", holding ~1 s.
- [ ] The boss's kill gold pop, the combo counter and the coin slide all play as usual with the burst; no other kill in the wave gets the 24-chip burst or the card.
- [ ] A boss kill that is the ×10 milestone kill plays the boss's 24-chip burst only, with the counter turning yellow as usual (T0034).
- [ ] The Orb's half-hp split on wave 30 gets neither burst nor card (the Shards keep walking); a one-shot kill of the Orb from over half health gets the 24-chip burst and the "Orb" card.
- [ ] Kills on non-boss waves are byte-identical to today: the normal burst, no card.
- [ ] A boss kill does not break the kill-combo chain (it is an ordinary kill for the combo, T0031).
- [ ] If the last-stand banner would show on the same frame, the boss death card takes the top-center card; at most one card at a time.
- [ ] The card fits at 412x915 and 1280x720 without overlapping the stats card (top left) or the wave card / pause button (top right).

## Design (architect, desktop)

### Files
- create `src/systems/enemyHooks/bossDeath.ts` — enemy hook: on a **kill** of the enemy the plan declares as the wave's boss (`bossId(run.wave)`, core/waves.ts), sets the game-registry flag `bossDeathName` to `enemy.def.name` for the HUD to show
- create `src/ui/hud/BossDeathBanner.ts` — `HudPart`: consumes that flag once per death and shows the shared top-center card `topBanner.show([name, 'stopped'])`
- edit `src/systems/enemyHooks/index.ts` — import `bossDeath` next to the `bossEscape` import; one line `bossDeath,` right after `bossEscape,` in `ENEMY_HOOKS`
- edit `src/systems/FxSystem.ts` — `burst()` signature: `double: boolean = false` → `chips: number = 6` (doc comment: 6 normal, 12 the ×10 milestone kill, 24 a boss kill); replace `const n = double ? 12 : 6;` with `const n = chips;`
- edit `src/systems/EnemySystem.ts` — extend the existing `core/waves` import to `import { bossId, quietGoldMul } from '../core/waves';`; in `kill()` (the single choke point: Bolt/Splash/Lance/Chain/Beam/Ember all end here) compute the boss and pass the count to the burst
- edit `src/ui/hud/topBanner.ts` — the "at most one card at a time" slot: a timestamp self-healing lock, taken in `show()`
- edit `src/scenes/HudScene.ts` — import `BossDeathBanner` (alphabetically, before `LastStandBanner`) and one parts-list line before `new LastStandBanner(this),`
- edit `src/debug/runChecks.ts` — imports `getEnemy` (content/enemies) and `bossId` (core/waves); one invariant next to the `iron.taken` line

### Interfaces
```ts
// FxSystem.ts (changed)
burst(x: number, y: number, color: number, chips: number = 6): void;

// topBanner.ts (new module-private, after the constants)
const SLOT_HOLD_MS = 1300; // the card plays 1000 ms; hold a touch past it so a shutdown-cut card frees itself
let slotHeldUntil = 0;
const takeSlot = (now: number): boolean => {
  if (now < slotHeldUntil) return false;
  slotHeldUntil = now + SLOT_HOLD_MS;
  return true;
};
// in show(), replace the playing guard:
if (this.playing || !takeSlot(this.scene.time.now)) return;
```

### Steps
1. `bossDeath.ts` (model on `bossEscape.ts`):
```ts
import { bossId } from '../../core/waves';
import type { MakeEnemyHook } from './hook';

/**
 * The boss's death: the kill (not a leak, not the Orb's mid-life split, which has no kill at all)
 * of the enemy the current wave's plan declares as its boss (core/waves.ts's bossId) sets the
 * name card's flag, shown by ui/hud/BossDeathBanner.ts: its name in bold ink over a muted
 * "stopped". The 24-chip burst is the kill's own (EnemySystem.kill makes the same check); the
 * gold pop, the combo and the coin slide all play as usual. A resumed run sets nothing.
 */
export const bossDeath: MakeEnemyHook = ({ run, scene }) => ({
  onKill({ enemy }) {
    if (bossId(run.wave) !== enemy.def.id) return;
    scene.registry.set('bossDeathName', enemy.def.name);
  },
});
```
2. Register it in `enemyHooks/index.ts` (import + one line after `bossEscape,`).
3. `FxSystem.burst`: the signature change from Interfaces; nothing else in the method moves (the `this.live < FxSystem.MAX` guards already cap the 24 chips). `MenuDemo.ts:216` calls `burst` with 3 args and keeps working via the default.
4. `EnemySystem.kill()`: replace `this.fx.burst(e.x, e.y, PALETTE[e.def.look.color], milestone);` with
```ts
    // A boss kill (the plan's own boss, core/waves.ts) is its moment: 24 chips in its own color,
    // never the milestone's 12; its name card comes from systems/enemyHooks/bossDeath.ts.
    const boss = bossId(this.run.wave) === e.def.id;
    this.fx.burst(e.x, e.y, PALETTE[e.def.look.color], boss ? 24 : milestone ? 12 : 6);
```
5. `BossDeathBanner.ts` (model on `LastStandBanner.ts`):
```ts
import type Phaser from 'phaser';
import type { GameScene } from '../../scenes/GameScene';
import type { HudPart } from './hud';
import { TopBanner } from './topBanner';

/**
 * The boss's name card: the moment the boss dies (systems/enemyHooks/bossDeath.ts sets the flag)
 * the shared top-center card names it — its name in bold ink over a muted "stopped" (~1 s,
 * topBanner's own timing). Listed before the other banners in HudScene, so on the same frame it
 * takes the top card over the last stand and the level clear. A resumed run shows none: the flag
 * is cleared here.
 */
export class BossDeathBanner implements HudPart {
  private readonly banner: TopBanner;

  constructor(scene: Phaser.Scene) {
    this.banner = new TopBanner(scene);
    scene.registry.delete('bossDeathName'); // a flag left by the run that ended never shows
  }

  layout(width: number): void {
    this.banner.layout(width);
  }

  update(game: GameScene): void {
    const name = game.registry.get('bossDeathName') as string | undefined;
    if (name === undefined) return;
    game.registry.delete('bossDeathName'); // consumed: one card per death
    this.banner.show([name, 'stopped']);
  }
}
```
6. `topBanner.ts`: add the slot from Interfaces and the guard in `show()`. No other change (timing, layout, sizes stay exactly as they are).
7. `HudScene.ts`: parts list becomes `new BossDeathBanner(this), // before the banners it beats: the boss death takes the top card` on the line above `new LastStandBanner(this), // last on purpose...`. Parts update in list order, so the boss death calls `show()` first and wins the slot on a collision frame.
8. `runChecks.ts`, after the `iron.taken` line:
```ts
  ['bossDeath.name', (g) => {
    const name = g.registry.get('bossDeathName');
    if (name === undefined) return null;
    const boss = bossId(g.run.wave);
    return boss && getEnemy(boss).name === name ? null : `the name card says "${name}" on wave ${g.run.wave}`;
  }],
```

### Pitfalls
- Do **not** fire the 24-chip burst from the hook: `EnemySystem.kill()` shows the normal burst *before* the hooks run, so a hook-side burst would double up. That is why the chip count is decided in `kill()` (one check) and the hook only sets the card flag.
- The Orb's half-hp split needs no code: `midSplit.ts` despawns it with **no kill** (no `onKill`), so neither burst nor card fires; a one-shot kill from over half health goes through `kill()` and gets both. Don't "fix" it.
- Delete the registry flag **before** `show()` (step 5): leaving it means the card retries every frame for 1.3 s and re-shows after the fade.
- The slot must be the timestamp lock, not a boolean with a release in the fade's `onComplete`: a scene shutdown mid-tween never runs the complete callback, and a stuck boolean would silence every banner of the next run.
- The registry is the game-wide one shared across scenes — that is how the hook (GameScene) reaches the part (HudScene), the same way `statsGold` and `waves` are shared.
- Keep the parts-list order: `BossDeathBanner` before `LastStandBanner` and `LevelClearBanner` or the boss death loses the same-frame card.
- Don't touch `TopBanner`'s geometry: the two-line card (W=140, h=72, top `HUD.top + 24` narrow / 12 wide) is exactly what the last-stand banner already fits at 412x915 and 1280x720; "Colossus" at 20 px bold fits the 140 px card.
- The burst count change is the only `FxSystem`/`EnemySystem` edit; don't reformat or move anything else in those files (other tasks touch them).

### Tests
- none — no `src/core` rule changes (`bossId` pre-exists); everything else is juice, HUD and wiring.
