/**
 * Still Life timing: the bubble's life and the ability's cooldown. Pure logic.
 *
 * The cooldown counts from the moment of trigger (BUBBLE_COOLDOWN_SEC), so the
 * ability is ready again BUBBLE_COOLDOWN_SEC - BUBBLE_LIFE_SEC after the bubble ends.
 */
export const BUBBLE_LIFE_SEC = 5;
export const BUBBLE_COOLDOWN_SEC = 12;
export const BUBBLE_RADIUS = 160;
export const SLOW_FACTOR = 0.5;

export class StillLife {
  private lifeLeft = 0;
  private cooldownLeft = 0;

  /** True while the bubble is up. */
  get active(): boolean {
    return this.lifeLeft > 0;
  }

  /** True when the ability can be triggered again. */
  get ready(): boolean {
    return this.cooldownLeft <= 0;
  }

  /** 0 right after a trigger, 1 when ready. */
  get cooldownFrac(): number {
    return 1 - this.cooldownLeft / BUBBLE_COOLDOWN_SEC;
  }

  /** Triggers the bubble. False while on cooldown. */
  trigger(): boolean {
    if (!this.ready) return false;
    this.lifeLeft = BUBBLE_LIFE_SEC;
    this.cooldownLeft = BUBBLE_COOLDOWN_SEC;
    return true;
  }

  /** Ages life and cooldown by `dt` seconds. True on the tick the bubble ends. */
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
