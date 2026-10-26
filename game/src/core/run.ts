import type { UpgradeDef } from '../content/types';
import { xpToNextLevel } from './progression';
import { Rng } from './rng';
import { computeStats, type PlayerStats, type StatMod } from './stats';

/**
 * Everything about the current run that is not a Phaser object: time, HP, XP,
 * level, upgrades and derived stats. Scenes read it; systems mutate it through
 * these methods. Pure TS, so it is fully unit-testable (see tests/core/run.test.ts).
 */
export class RunState {
  readonly rng: Rng;
  readonly seed: number;

  timeSec = 0;
  level = 1;
  xp = 0;
  xpToNext = xpToNextLevel(1);
  /** Level-ups earned but not yet spent on an upgrade choice. */
  pendingLevelUps = 0;
  kills = 0;
  hp: number;
  stats: PlayerStats;
  /** Weapon ids the player currently has (see src/content/weapons). */
  weapons: string[] = ['point'];
  /** Upgrade id -> times taken. */
  upgradeLevels: Record<string, number> = {};
  private mods: StatMod[] = [];

  constructor(seed: number) {
    this.seed = seed;
    this.rng = new Rng(seed);
    this.stats = computeStats(this.mods);
    this.hp = this.stats.maxHp;
  }

  get isDead(): boolean {
    return this.hp <= 0;
  }

  /** Adds XP (after xpMul). Returns how many levels were gained. */
  addXp(amount: number): number {
    this.xp += amount * this.stats.xpMul;
    let gained = 0;
    while (this.xp >= this.xpToNext) {
      this.xp -= this.xpToNext;
      this.level += 1;
      this.xpToNext = xpToNextLevel(this.level);
      gained += 1;
    }
    this.pendingLevelUps += gained;
    return gained;
  }

  /** Applies armor (min 1 damage). Returns the damage actually taken. */
  takeDamage(amount: number): number {
    if (amount <= 0 || this.isDead) return 0;
    const dealt = Math.max(1, amount - this.stats.armor);
    this.hp = Math.max(0, this.hp - dealt);
    return dealt;
  }

  heal(amount: number): void {
    if (this.isDead) return;
    this.hp = Math.min(this.stats.maxHp, this.hp + Math.max(0, amount));
  }

  upgradeLevel(id: string): number {
    return this.upgradeLevels[id] ?? 0;
  }

  /** Applies an upgrade: stat mods, granted weapon, and heals by any max HP gained. */
  applyUpgrade(def: UpgradeDef): void {
    const prevMax = this.stats.maxHp;
    this.upgradeLevels[def.id] = this.upgradeLevel(def.id) + 1;
    this.mods.push(...def.mods);
    if (def.grantsWeapon && !this.weapons.includes(def.grantsWeapon)) this.weapons.push(def.grantsWeapon);
    this.stats = computeStats(this.mods);
    const gainedMax = this.stats.maxHp - prevMax;
    if (gainedMax > 0) this.hp += gainedMax;
    this.hp = Math.min(this.hp, this.stats.maxHp);
    if (this.pendingLevelUps > 0) this.pendingLevelUps -= 1;
  }
}
