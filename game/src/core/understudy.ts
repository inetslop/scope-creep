/**
 * Understudy timing: the decoy's life and the ability's cooldown. Pure logic.
 *
 * The cooldown counts from the moment of the drop (DECOY_COOLDOWN_SEC), so the
 * ability is ready again DECOY_COOLDOWN_SEC - DECOY_LIFE_SEC after the pop.
 */
export const DECOY_LIFE_SEC = 3;
export const DECOY_COOLDOWN_SEC = 8;

export class Understudy {
  private lifeLeft = 0;
  private cooldownLeft = 0;

  /** True while the decoy is on the field. */
  get active(): boolean {
    return this.lifeLeft > 0;
  }

  /** True when the ability can be dropped again. */
  get ready(): boolean {
    return this.cooldownLeft <= 0;
  }

  /** 0 right after a drop, 1 when ready. */
  get cooldownFrac(): number {
    return 1 - this.cooldownLeft / DECOY_COOLDOWN_SEC;
  }

  /** Drops the decoy. False while on cooldown. */
  drop(): boolean {
    if (!this.ready) return false;
    this.lifeLeft = DECOY_LIFE_SEC;
    this.cooldownLeft = DECOY_COOLDOWN_SEC;
    return true;
  }

  /** Ages life and cooldown by `dt` seconds. True on the tick the decoy pops. */
  update(dt: number): boolean {
    if (this.cooldownLeft > 0) this.cooldownLeft = Math.max(0, this.cooldownLeft - dt);
    if (this.lifeLeft <= 0) return false;
    this.lifeLeft -= dt;
    if (this.lifeLeft <= 0) {
      this.lifeLeft = 0;
      return true;
    }
    return false;
  }
}
