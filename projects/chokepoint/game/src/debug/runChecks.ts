import { CELL, START } from '../config';
import { AUGMENTS } from '../content/augments';
import { getEnemy } from '../content/enemies';
import { getLevelAugment } from '../content/levels';
import { levelSpeedMul } from '../core/levels';
import { waveWalkFactor } from '../core/tech';
import { draftCardCount } from '../core/augments';
import { FEAST_CHAIN_BASE_MS } from '../core/feast';
import { chokeCells } from '../core/choke';
import { MARKED_DMG_MUL } from '../core/markedCell';
import { switchbackFold } from '../core/switchback';
import { TIER_ORDER } from '../core/tiers';
import { bossId, waveSpeedMul } from '../core/waves';
import { DraftScene } from '../scenes/DraftScene';
import { MenuScene } from '../scenes/MenuScene';
import { RewardsScene } from '../scenes/RewardsScene';
import type { GameScene } from '../scenes/GameScene';
import { SCENES } from '../scenes/keys';
import { SPLIT_TELEGRAPH_SEC } from '../systems/enemyHooks/midSplit';
import { hook } from './testHook';

/**
 * The run's invariants for the smoke test, one line each: a name, and a check that returns what
 * is wrong (or nothing). A new system adds its line here, next to the related ones. Keep them cheap.
 */
const INVARIANTS: readonly [string, (g: GameScene) => string | null | undefined][] = [
  ['run.gold', (g) => (Number.isFinite(g.run.gold) && g.run.gold >= 0 ? null : `gold is ${g.run.gold}`)],
  ['run.lives', (g) => (Number.isInteger(g.run.lives) && g.run.lives >= 0 ? null : `lives is ${g.run.lives}`)],
  ['run.streak', (g) => (g.run.lives <= START.lives + 1 + g.techLife ? null : `lives ${g.run.lives} above start plus the streak's one`)],
  ['iron.lives', (g) => (g.run.mode !== 'iron' || (g.techLife === 0 && g.run.lives <= 2) ? null : `iron run at ${g.run.lives} lives with techLife ${g.techLife}`)],
  ['run.ledger', (g) => (Number.isInteger(g.run.goldEarned) && g.run.goldEarned >= 0 && g.run.cleanWaves >= 0 && g.run.cleanWaves <= g.run.wavesCleared ? null : 'ledger')],
  ['run.story', (g) => (g.run.story.every((r, i) => r.wave === i + 1) ? null : `story waves ${g.run.story.map((r) => r.wave).join(',')}`)],
  ['board.choke', (g) => (g.run.bgen < 2 || chokeCells(g.board.map).length > 0 ? null : 'a gen-2 board has no choke cell')],
  ['board.fold', (g) => (g.mapFold === 0 || switchbackFold(g.board.map) !== null ? null : 'a switchback board has no fold in its road')],
  ['board.fork', (g) => {
    const fork = g.board.map.fork;
    if (!fork) return g.enemies.all.some((e) => e.active && e.lane !== 0) ? 'an enemy is on a lane with no fork' : null;
    if (fork.laneB.length !== fork.rejoin - fork.split - 1) return `lane B has ${fork.laneB.length} cells, expected ${fork.rejoin - fork.split - 1}`;
    for (const c of fork.laneB) if (g.board.map.kinds[c.row]![c.col] !== 'path') return `a lane B cell is not road at (${c.col}, ${c.row})`;
    return null;
  }],
  ['board.loop', (g) => {
    const loop = g.board.map.loop;
    if (!loop) return null;
    const ring = loop.ring;
    if (ring.length < 12 || ring.length > 16) return `the loop's ring has ${ring.length} cells, expected 12-16`;
    const seen = new Set<string>();
    for (let i = 0; i < ring.length; i++) {
      const c = ring[i]!;
      const k = `${c.col},${c.row}`;
      if (seen.has(k)) return `the loop's ring crosses itself at (${c.col}, ${c.row})`;
      seen.add(k);
      if (g.board.map.kinds[c.row]![c.col] !== 'path') return `a loop ring cell is not road at (${c.col}, ${c.row})`;
      const prev = ring[(i - 1 + ring.length) % ring.length]!;
      if (Math.abs(c.col - prev.col) + Math.abs(c.row - prev.row) !== 1) return `the loop's ring jumps at (${c.col}, ${c.row})`;
    }
    return null;
  }],
  ['board.cove', (g) => {
    const cove = g.board.map.cove;
    if (!cove) return null;
    if (g.board.map.fork || g.board.map.loop) return 'a cove shares the board with the fork or the loop';
    if (cove.cells.length !== 3) return `the cove's pocket has ${cove.cells.length} cells, expected 3`;
    for (const c of cove.cells) if (g.board.map.kinds[c.row]![c.col] !== 'open') return `a cove pocket cell is not buildable at (${c.col}, ${c.row})`;
    return null;
  }],
  ['resume.taken', (g) => (g.registry.get('resumeRun') ? 'a saved run is waiting for the game that never took it' : null)],
  ['ghost.taken', (g) => (g.registry.get('ghostSeed') ? 'a ghost seed is waiting for the game that never took it' : null)],
  ['iron.taken', (g) => (g.registry.get('ironMode') ? 'an iron flag is waiting for the game that never took it' : null)],
  ['run.ended', (g) => (g.registry.get('runEnded') ? 'the run-ended flag was left behind for the next run' : null)],
  ['daily.taken', (g) => (g.registry.get('dailyPick') ? 'a daily pick is waiting for the game that never took it' : null)],
  ['bossDeath.name', (g) => {
    const name = g.registry.get('bossDeathName');
    if (name === undefined) return null;
    const boss = bossId(g.run.wave);
    return boss && getEnemy(boss).name === name ? null : `the name card says "${name}" on wave ${g.run.wave}`;
  }],
  ['board.path', (g) => {
    const p = g.board.map.path;
    const seen = new Set<string>();
    for (let i = 0; i < p.length; i++) {
      const c = p[i]!;
      const key = `${c.col},${c.row}`;
      if (seen.has(key)) return `the road crosses itself at (${c.col}, ${c.row})`;
      seen.add(key);
      if (i > 0 && Math.abs(c.col - p[i - 1]!.col) + Math.abs(c.row - p[i - 1]!.row) !== 1) return `the road jumps at (${c.col}, ${c.row})`;
    }
    return null;
  }],
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
  ['enemies.bossSlot', (g) => (g.run.wave === 20 || !g.enemies.all.some((e) => e.active && (e.def.id === 'titan' || e.def.id === 'guard')) ? null : 'a Titan or Guard alive off its wave 20')],
  ['enemies.reach', (g) => g.enemies.brokenReach()],
  ['enemies.fly', (g) => g.enemies.brokenFly()],
  ['enemies.orb', (g) => (g.enemies.all.filter((e) => e.active && e.def.id === 'orb').length <= 1 ? null : 'more than one Orb alive')],
  ['enemies.flyer', (g) => (g.enemies.all.filter((e) => e.active && e.def.behavior === 'fly').length <= 1 ? null : 'more than one Flyer alive')],
  ['enemies.hive', (g) => (g.enemies.all.filter((e) => e.active && e.def.id === 'hive').length <= 1 ? null : 'more than one Hive alive')],
  ['hive.pending', (g) => (Number.isInteger(g.run.pendingPops) && g.run.pendingPops >= 0 && g.run.pendingPops <= 5 ? null : `pending pops ${g.run.pendingPops}`)],
  ['enemies.orbSplit', (g) => (g.enemies.all.every((e) => !e.active || e.def.splitsAt === undefined || (Number.isFinite(e.splitClock) && e.splitClock >= -1 - 1e-9 && e.splitClock <= SPLIT_TELEGRAPH_SEC + 1e-9)) ? null : 'a split window out of its beat')],
  ['enemies.onRoad', (g) => (g.enemies.all.some((e) => e.active && e.def.behavior !== 'fly' && (e.distance < 0 || e.distance > e.path.length + 1)) ? 'an enemy is off its line' : null)],
  ['flyer.line', (g) => (g.enemies.all.some((e) => e.active && e.def.flies && ((!Number.isFinite(e.path.length) || e.path.length <= 0) || e.pushLeft > 0 || e.rootLeft > 0)) ? 'a flyer with a broken line, or pushed or rooted' : null)],
  ['exitWarn.valid', (g) => g.exitWarn.broken()],
  ['music.bed', (g) => g.music.broken()],
  ['buildBed.valid', (g) => g.buildBed.broken()],
  ['draftBed.valid', (g) => (g.scene.isActive(SCENES.draft) ? (g.scene.get(SCENES.draft) as DraftScene).bed.broken() : null)],
  ['menuBed.valid', (g) => (g.scene.isActive(SCENES.menu) ? (g.scene.get(SCENES.menu) as MenuScene).bed.broken() : null)],
  ['claimBed.valid', (g) => (g.scene.isActive(SCENES.rewards) ? (g.scene.get(SCENES.rewards) as RewardsScene).bed.broken() : null)],
  ['leakCost.valid', (g) => g.leakCost.broken()],
  ['projectiles.count', (g) => (g.projectiles.activeCount > 600 ? `${g.projectiles.activeCount} projectiles in flight` : null)],
  ['projectiles.stuck', (g) => g.projectiles.brokenProjectile()],
  ['towers.valid', (g) => g.towers.brokenTower()],
  ['towers.gold', (g) => {
    for (const t of g.towers.towers) if (!Number.isInteger(t.spec.goldPerKill) || t.spec.goldPerKill < 0 || t.spec.goldPerKill > t.augments.length) return `kill-gold ${t.spec.goldPerKill} at (${t.cell.col}, ${t.cell.row})`;
    return null;
  }],
  ['towers.targetMode', (g) => {
    for (const t of g.towers.towers) if (t.targetMode !== 'first' && t.targetMode !== 'strongest' && t.targetMode !== 'closest') return `target mode ${t.targetMode} at (${t.cell.col}, ${t.cell.row})`;
    return null;
  }],
  ['towers.toll', (g) => {
    for (const t of g.towers.towers) if (!Number.isInteger(t.spec.tollCount) || t.spec.tollCount < 0 || t.spec.tollCount > t.augments.length) return `toll ${t.spec.tollCount} at (${t.cell.col}, ${t.cell.row})`;
    return null;
  }],
  ['towers.crit', (g) => {
    for (const t of g.towers.towers) if (!Number.isFinite(t.spec.critChance) || t.spec.critChance < 0 || t.spec.critChance > 1) return `crit chance ${t.spec.critChance} at (${t.cell.col}, ${t.cell.row})`;
    return null;
  }],
  ['towers.damageLedger', (g) => {
    for (const t of g.towers.towers) if (!Number.isFinite(t.damageDealt) || t.damageDealt < 0) return `damage dealt ${t.damageDealt} at (${t.cell.col}, ${t.cell.row})`;
    return null;
  }],
  ['towers.quietDot', (g) => {
    for (const t of g.towers.towers) if (t.idleOn && (!t.spec.attacks || t.spec.kind === 'rally')) return `a ${t.spec.kind} tower shows its quiet dot`;
    return null;
  }],
  ['towers.markedCell', (g) => {
    for (const t of g.towers.towers) {
      const want = g.board.onMarked(t.cell) ? MARKED_DMG_MUL : 1;
      if (t.cellMul !== want) return `a tower at (${t.cell.col}, ${t.cell.row}) has cellMul ${t.cellMul}, expected ${want}`;
    }
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
  ['haste.aura', (g) => {
    const has = g.towers.towers.some((t) => t.spec.hasteCount > 0);
    if (!has && (g.towers.towers.some((t) => t.hasteRatePct > 0) || g.enemies.all.some((e) => e.active && e.hastePct > 0))) return 'haste working with no Haste tower';
    return null;
  }],
  ['ward.control', (g) => (g.enemies.all.some((e) => e.active && e.def.id === 'ward' && (e.slowPct > 0 || e.rootLeft > 0 || e.pushLeft > 0)) ? 'a Ward is slowed, rooted or pushed' : null)],
  ['pushWindup.valid', (g) => g.windup.broken()],
  ['comboBar.valid', (g) => g.comboBar.broken()],
  ['feast.window', (g) => (Number.isFinite(g.fx.comboWindowMs) && g.fx.comboWindowMs >= FEAST_CHAIN_BASE_MS ? null : `the chain window is ${g.fx.comboWindowMs} ms`)],
  ['hand.selection', (g) => g.building.brokenSelection()],
  ['building.pending', (g) => { const c = g.building.pendingCell; if (!c) return null; if (g.run.phase !== 'build') return `a placement waits in phase ${g.run.phase}`; return g.board.canBuild(c) ? null : `a placement waits on a taken or blocked cell (${c.col}, ${c.row})`; }],
  // The clean wave's chip keeps phase 'draft' with an empty offer for a second, so check while the draft overlay is up (the offer is filled before it launches).
  ['draft.offer', (g) => (hook.overlay !== SCENES.draft || g.flow.offer.length === draftCardCount(g.flow.draftWave) ? null : `draft offers ${g.flow.offer.length} cards, expected ${draftCardCount(g.flow.draftWave)}`)],
  ['level.choice', (g) => (new Set(g.run.level).size === g.run.level.length && g.run.level.every((id) => getLevelAugment(id) !== undefined) ? null : `level choice ${g.run.level.join(',')}`)],
  ['level.speed', (g) => (g.enemies.all.every((e) => !e.active || e.speedMul === levelSpeedMul(g.run.level) * waveWalkFactor(g.run.techOwned) * waveSpeedMul(g.run.wave)) ? null : 'an enemy walks at the wrong level, walk or wave speed factor')],
  ['walk.mul', (g) => (g.enemies.all.every((e) => !e.active || e.walkMul === waveWalkFactor(g.run.techOwned)) ? null : 'an enemy carries the wrong run walk factor')],
  ['level.bossPlan', (g) => { if (!bossId(g.run.wave) || !g.waves.currentPlan) return null; const want = g.run.wave === 20 ? 2 : 1; return g.waves.currentPlan.spawns.length === want ? null : `boss wave ${g.run.wave} sends ${g.waves.currentPlan.spawns.length}, not ${want}`; }],
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
