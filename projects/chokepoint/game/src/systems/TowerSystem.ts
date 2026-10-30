import type Phaser from 'phaser';
import { CELL } from '../config';
import { getAugment } from '../content/augments';
import { PALETTE } from '../content/palette';
import type { AugmentCopy, FirstForm } from '../content/types';
import { slotCost, splashHits, towerColor } from '../core/augments';
import type { Cell } from '../core/map';
import type { RunState } from '../core/run';
import { slotPrice } from '../core/techEffects';
import { tierFirst } from '../core/tiers';
import { hook } from '../debug/testHook';
import { Tower } from '../entities/Tower';
import type { Sfx } from '../audio/Sfx';
import type { Board } from './Board';
import { ATTACKS } from './attacks';
import type { EnemySystem } from './EnemySystem';
import type { FxSystem } from './FxSystem';
import { auraRing } from './fx/auraRing';
import type { ProjectileSystem } from './ProjectileSystem';
import { quietDot } from './towerIdle';

/** Why something didn't happen. */
export type Refusal = 'blocked' | 'gold' | 'full' | 'max';

/**
 * Builds towers, fills and unlocks their slots, and makes them attack the way their augments
 * combine (Tower.spec, core/augments.ts). Gold only ever buys slots: building a tower is buying
 * its first slot, and every further slot on the same tower costs more (SLOT_COSTS).
 */
export class TowerSystem {
  private readonly scene: Phaser.Scene;
  private readonly board: Board;
  private readonly run: RunState;
  private readonly enemies: EnemySystem;
  private readonly projectiles: ProjectileSystem;
  private readonly fx: FxSystem;
  private readonly sfx: Sfx | undefined;
  readonly towers: Tower[] = [];

  constructor(scene: Phaser.Scene, board: Board, run: RunState, enemies: EnemySystem, projectiles: ProjectileSystem, fx: FxSystem, sfx: Sfx | undefined) {
    this.scene = scene;
    this.board = board;
    this.run = run;
    this.enemies = enemies;
    this.projectiles = projectiles;
    this.fx = fx;
    this.sfx = sfx;
  }

  /** Range of a tower in board units (0 while idle). */
  rangeOf(tower: Tower): number {
    return tower.spec.range * CELL;
  }

  /** Gold for this tower's next slot, or undefined when it has them all. */
  nextSlotCost(tower: Tower): number | undefined {
    return slotPrice(tower.slots, this.run.slotDiscount);
  }

  /** Builds a tower on `cell` with `copy` in its first slot, paying for that slot. */
  build(cell: Cell, copy: AugmentCopy): Tower | Refusal {
    if (!this.board.canBuild(cell)) return 'blocked';
    if (!this.run.spend(slotCost(0)!)) return 'gold';
    const c = this.board.centerOf(cell);
    const tower = new Tower(this.scene, c.x, c.y, cell);
    this.board.place(cell, tower);
    this.towers.push(tower);
    hook.stats.towersBuilt += 1;
    this.sfx?.build();
    this.place(tower, copy);
    return tower;
  }

  /** Puts an augment copy into a free slot of `tower`. */
  place(tower: Tower, copy: AugmentCopy): true | Refusal {
    if (!tower.addAugment(copy)) return 'full';
    hook.stats.augmentsPlaced += 1;
    this.sfx?.tierChime(copy.tier);
    const color = towerColor(tower.augments);
    this.fx.ring(tower.x, tower.y, CELL * 0.55, color ? PALETTE[color] : PALETTE.faint);
    return true;
  }

  /** Buys `tower`'s next slot. */
  unlockSlot(tower: Tower): true | Refusal {
    const cost = slotPrice(tower.slots, this.run.slotDiscount);
    if (cost === undefined) return 'max';
    if (!this.run.spend(cost)) return 'gold';
    tower.unlockSlot();
    hook.stats.slotsUnlocked += 1;
    this.fx.ring(tower.x, tower.y, CELL * 0.45, PALETTE.yellow);
    this.sfx?.build();
    return true;
  }

  update(dt: number): void {
    const enemies = this.enemies.all;
    const road = this.enemies.aliveCount > 0;
    for (const t of this.towers) {
      // The dot is for a first form that acts on the board on a cadence (or holds a beam line): a
      // passive first (Mint, Rally, the future Haste/Momentum/Mend/Toll) never dots, even when an
      // added augment gives the tower an attack (a Mint+Bolt that does shoot).
      const firstAttacks = t.spec.attacks && t.spec.kind !== 'rally' && firstActs(tierFirst(getAugment(t.augments[0]!.id), t.augments[0]!.tier));
      let attacked = false;
      if (t.spec.kind !== 'beam' && !t.jammed && t.spec.attacks) {
        // A pure support (no damage, slow, root, gust, burn, bolts or marks, like a bare Mint) never attacks:
        // pulse.ts would only fire its wave fx, kick and sound around a tower that does nothing.
        if (!(t.spec.damage <= 0 && !t.spec.slow && !t.spec.root && t.spec.gust === 0 && !t.spec.burn && t.spec.bolts === 0 && t.spec.markPct === 0)) {
          t.cooldown -= dt;
          if (t.cooldown <= 0) {
            attacked = this.attack(t, enemies);
            // Rally and haste are additive on the attack-speed stat (10% + 30% = 1.4), not a product.
            if (attacked) t.cooldown += 1 / (t.spec.rate * (t.rallyRateMul + t.hasteRatePct));
            else t.cooldown = 0; // nothing in range: ready the moment something walks in
          }
        }
      }
      if (firstAttacks) quietDot(t, road, attacked || t.beamHolding, dt);
    }
  }

  /** One attack, the way the tower's augments combine (systems/attacks/). False when nothing was in range. */
  private attack(t: Tower, enemies: EnemySystem['all']): boolean {
    const spec = t.spec;
    if (spec.kind === 'none') return false;
    const color = towerColor(t.augments);
    const attacked = ATTACKS[spec.kind]({
      tower: t,
      enemies,
      range: spec.range * CELL,
      payload: {
        damage: spec.damage,
        splash: spec.splash * CELL,
        splashCap: Math.max(0, splashHits(spec.splashCount) - 1),
        slow: spec.slow,
        root: spec.root,
        pierce: spec.pierce,
        push: (spec.gust + spec.pushPerHit) * CELL,
        mark: spec.markPct > 0 ? { pct: spec.markPct, x: t.x, y: t.y } : undefined,
        burn: spec.burn,
        color: color ? PALETTE[color] : PALETTE.faint,
        source: t,
      },
      fireBolt: (n, target, payload) => {
        const m = t.muzzle(n);
        // A piercing bolt flies straight: out to 1.5 × the tower's range (from the muzzle, like the pellets).
        this.projectiles.fire(m.x, m.y, target, payload, spec.projectileSpeed * CELL, 1.5 * spec.range * CELL, t.aimOffset(n));
      },
      firePellets: (target, count, payload, maxDist) => {
        const m = t.muzzle(0);
        this.projectiles.fireCone(m.x, m.y, target, count, payload, spec.projectileSpeed * CELL, maxDist);
      },
      strike: (target, payload) => this.enemies.strike(target, payload),
      fx: this.fx,
      sfx: this.sfx,
    });
    if (attacked) {
      hook.stats.shotsFired += 1;
      // The quiet aura ring: a tower whose first augment is Anchor shows its root pulse working (systems/fx/auraRing.ts).
      if (t.spec.firstId === 'anchor') auraRing(this.fx, t.x, t.y, color ? PALETTE[color] : PALETTE.faint);
    }
    return attacked;
  }

  /** Invariant: every tower stands on an open cell and holds no more augments than slots. */
  brokenTower(): string | undefined {
    for (const t of this.towers) {
      const kind = this.board.map.kinds[t.cell.row]?.[t.cell.col];
      if (kind !== 'open') return `tower on a ${kind ?? 'missing'} cell (${t.cell.col}, ${t.cell.row})`;
      if (t.augments.length > t.slots) return `tower at (${t.cell.col}, ${t.cell.row}) has ${t.augments.length} augments in ${t.slots} slots`;
    }
    return undefined;
  }
}

/** Whether a first form has an on-board action of its own: a strike, a slow, a root, a gust, a burn, a mark or a held beam line. */
function firstActs(f: FirstForm): boolean {
  return f.damage > 0 || f.slow !== undefined || f.root !== undefined || (f.push ?? 0) > 0 || f.burn !== undefined || f.mark !== undefined || f.beam !== undefined;
}
