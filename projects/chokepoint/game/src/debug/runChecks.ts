import { CELL, START } from '../config';
import { AUGMENTS } from '../content/augments';
import { draftCardCount } from '../core/augments';
import { TIER_ORDER } from '../core/tiers';
import type { GameScene } from '../scenes/GameScene';
import { SCENES } from '../scenes/keys';
import { hook } from './testHook';

/**
 * The run's invariants for the smoke test, one line each: a name, and a check that returns what
 * is wrong (or nothing). A new system adds its line here, next to the related ones. Keep them cheap.
 */
const INVARIANTS: readonly [string, (g: GameScene) => string | null | undefined][] = [
  ['run.gold', (g) => (Number.isFinite(g.run.gold) && g.run.gold >= 0 ? null : `gold is ${g.run.gold}`)],
  ['run.lives', (g) => (Number.isInteger(g.run.lives) && g.run.lives >= 0 ? null : `lives is ${g.run.lives}`)],
  ['run.streak', (g) => (g.run.lives <= START.lives + 1 + g.techLife ? null : `lives ${g.run.lives} above start plus the streak's one`)],
  ['run.ledger', (g) => (Number.isInteger(g.run.goldEarned) && g.run.goldEarned >= 0 && g.run.cleanWaves >= 0 && g.run.cleanWaves <= g.run.wavesCleared ? null : 'ledger')],
  ['resume.taken', (g) => (g.registry.get('resumeRun') ? 'a saved run is waiting for the game that never took it' : null)],
  ['ghost.taken', (g) => (g.registry.get('ghostSeed') ? 'a ghost seed is waiting for the game that never took it' : null)],
  ['speed.value', (g) => (g.speed.speed === 1 || g.speed.speed === 2 ? null : `speed is ${g.speed.speed}`)],
  ['waves.next', (g) => (g.run.phase !== 'build' || g.waves.nextPlan?.number === g.run.wave + 1 ? null : `build phase plans wave ${g.waves.nextPlan?.number ?? 'nothing'}, not ${g.run.wave + 1}`)],
  ['waves.held', (g) => (Number.isInteger(g.waves.heldLost) && g.waves.heldLost >= 0 && g.waves.heldLost <= START.lives + 1 + g.techLife ? null : `held lost ${g.waves.heldLost}`)],
  ['send.countdown', (g) => (g.run.phase !== 'build' || (Number.isFinite(g.run.buildLeftSec) && g.run.buildLeftSec > 0) ? null : `build countdown is ${g.run.buildLeftSec}`)],
  ['enemies.valid', (g) => g.enemies.brokenEnemy()],
  ['enemies.count', (g) => (g.enemies.aliveCount > 400 ? `${g.enemies.aliveCount} enemies alive` : null)],
  ['enemies.root', (g) => g.enemies.brokenRoot()],
  ['enemies.speedCap', (g) => (g.enemies.all.some((e) => e.active && e.def.speedRamp && e.speed > e.def.speedRamp.max * CELL + 0.01) ? 'a ramping enemy is over its speed cap' : null)],
  ['enemies.mark', (g) => g.enemies.brokenMark()],
  ['enemies.burn', (g) => g.enemies.brokenBurn()],
  ['enemies.push', (g) => g.enemies.brokenPush()],
  ['enemies.onRoad', (g) => (g.enemies.all.some((e) => e.active && (e.distance < 0 || e.distance > g.board.path.length + 1)) ? 'an enemy is off its road' : null)],
  ['exitWarn.valid', (g) => g.exitWarn.broken()],
  ['projectiles.count', (g) => (g.projectiles.activeCount > 600 ? `${g.projectiles.activeCount} projectiles in flight` : null)],
  ['projectiles.stuck', (g) => g.projectiles.brokenProjectile()],
  ['towers.valid', (g) => g.towers.brokenTower()],
  ['towers.gold', (g) => {
    for (const t of g.towers.towers) if (!Number.isInteger(t.spec.goldPerKill) || t.spec.goldPerKill < 0 || t.spec.goldPerKill > t.augments.length) return `kill-gold ${t.spec.goldPerKill} at (${t.cell.col}, ${t.cell.row})`;
    return null;
  }],
  ['rally.valid', (g) => {
    for (const t of g.towers.towers) if (t.rallyRateMul < 1 - 1e-9 || t.rallyRateMul > 1.2) return `rally multiplier ${t.rallyRateMul}`;
    return null;
  }],
  ['beams.valid', (g) => g.beams.broken()],
  ['mute.jam', (g) => {
    const muted = g.enemies.all.some((e) => e.active && e.def.id === 'mute');
    if (!muted && g.towers.towers.some((t) => t.jammed)) return 'a tower is jammed with no Mute on the road';
    return null;
  }],
  ['ward.control', (g) => (g.enemies.all.some((e) => e.active && e.def.id === 'ward' && (e.slowPct > 0 || e.rootLeft > 0 || e.pushLeft > 0)) ? 'a Ward is slowed, rooted or pushed' : null)],
  ['pushWindup.valid', (g) => g.windup.broken()],
  ['hand.selection', (g) => g.building.brokenSelection()],
  // The clean wave's chip keeps phase 'draft' with an empty offer for a second, so check while the draft overlay is up (the offer is filled before it launches).
  ['draft.offer', (g) => (hook.overlay !== SCENES.draft || g.flow.offer.length === draftCardCount(g.flow.draftWave) ? null : `draft offers ${g.flow.offer.length} cards, expected ${draftCardCount(g.flow.draftWave)}`)],
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
  s.speed = game.speed.speed;
}
