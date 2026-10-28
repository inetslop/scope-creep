import { AUGMENTS } from '../content/augments';
import { TIER_ORDER } from '../core/tiers';
import type { GameScene } from '../scenes/GameScene';
import { hook } from './testHook';

/**
 * The run's invariants for the smoke test, one line each: a name, and a check that returns what
 * is wrong (or nothing). A new system adds its line here, next to the related ones. Keep them cheap.
 */
const INVARIANTS: readonly [string, (g: GameScene) => string | null | undefined][] = [
  ['run.gold', (g) => (Number.isFinite(g.run.gold) && g.run.gold >= 0 ? null : `gold is ${g.run.gold}`)],
  ['run.lives', (g) => (Number.isInteger(g.run.lives) && g.run.lives >= 0 ? null : `lives is ${g.run.lives}`)],
  ['run.ledger', (g) => (Number.isInteger(g.run.goldEarned) && g.run.goldEarned >= 0 && g.run.cleanWaves >= 0 && g.run.cleanWaves <= g.run.wavesCleared ? null : 'ledger')],
  ['enemies.valid', (g) => g.enemies.brokenEnemy()],
  ['enemies.count', (g) => (g.enemies.aliveCount > 400 ? `${g.enemies.aliveCount} enemies alive` : null)],
  ['exitWarn.valid', (g) => g.exitWarn.broken()],
  ['projectiles.count', (g) => (g.projectiles.activeCount > 600 ? `${g.projectiles.activeCount} projectiles in flight` : null)],
  ['towers.valid', (g) => g.towers.brokenTower()],
  ['hand.selection', (g) => g.building.brokenSelection()],
  ['augments.valid', (g) => {
    for (const c of [...g.run.hand, ...g.towers.towers.flatMap((t) => t.augments)])
      if (!AUGMENTS.some((a) => a.id === c.id) || !TIER_ORDER.includes(c.tier)) return `unknown augment copy ${c.id}:${c.tier}`;
    return null;
  }],
  ['fx.count', (g) => (g.fx.count > 200 ? `${g.fx.count} effects alive` : null)],
];

/** Registers every invariant for this run (GameScene clears them on shutdown). */
export function registerRunChecks(game: GameScene): void {
  for (const [name, check] of INVARIANTS) hook.addInvariant(name, () => check(game));
}

/** The live values the smoke test reads, every frame. */
export function syncHookStats(game: GameScene): void {
  const s = hook.stats;
  s.wave = game.run.wave;
  s.gold = game.run.gold;
  s.lives = game.run.lives;
  s.enemiesAlive = game.enemies.aliveCount;
  s.towers = game.towers.towers.length;
  s.zoom = game.board.zoom;
}
