import { CELL } from '../config';
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
  ['waves.next', (g) => (g.run.phase !== 'build' || g.waves.nextPlan?.number === g.run.wave + 1 ? null : `build phase plans wave ${g.waves.nextPlan?.number ?? 'nothing'}, not ${g.run.wave + 1}`)],
  ['enemies.valid', (g) => g.enemies.brokenEnemy()],
  ['enemies.count', (g) => (g.enemies.aliveCount > 400 ? `${g.enemies.aliveCount} enemies alive` : null)],
  ['enemies.root', (g) => g.enemies.brokenRoot()],
  ['enemies.speedCap', (g) => (g.enemies.all.some((e) => e.active && e.def.speedRamp && e.speed > e.def.speedRamp.max * CELL + 0.01) ? 'a ramping enemy is over its speed cap' : null)],
  ['enemies.mark', (g) => g.enemies.brokenMark()],
  ['enemies.push', (g) => g.enemies.brokenPush()],
  ['exitWarn.valid', (g) => g.exitWarn.broken()],
  ['projectiles.count', (g) => (g.projectiles.activeCount > 600 ? `${g.projectiles.activeCount} projectiles in flight` : null)],
  ['projectiles.stuck', (g) => g.projectiles.brokenProjectile()],
  ['projectiles.aim', (g) => g.projectiles.brokenAim()],
  ['towers.valid', (g) => g.towers.brokenTower()],
  ['towers.gold', (g) => {
    for (const t of g.towers.towers) if (!Number.isInteger(t.spec.goldPerKill) || t.spec.goldPerKill < 0 || t.spec.goldPerKill > t.augments.length) return `kill-gold ${t.spec.goldPerKill} at (${t.cell.col}, ${t.cell.row})`;
    return null;
  }],
  ['rally.valid', (g) => {
    for (const t of g.towers.towers) if (t.rallyRateMul < 1 - 1e-9 || t.rallyRateMul > 1.2) return `rally multiplier ${t.rallyRateMul}`;
    return null;
  }],
  ['pushWindup.valid', (g) => g.windup.broken()],
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
