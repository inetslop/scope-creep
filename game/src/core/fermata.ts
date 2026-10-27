/**
 * The fermata: the held breath after a level-up pick. Armed the moment a card
 * is confirmed (LevelUpScene.choose), ticked down by the run clock in
 * GameScene.update, the shapes hold still for the whole window and resume
 * exactly where they left off. See tests/core/fermata.test.ts.
 */

/** Seconds every enemy, enemy bullet and boss shape holds still after a pick. */
export const FERMATA_SEC = 0.6;

export class Fermata {
  private left = 0;

  /** True while the hold is running. */
  get active(): boolean {
    return this.left > 0;
  }

  /** Seconds remaining, clamped at 0. */
  get leftSec(): number {
    return Math.max(0, this.left);
  }

  /** (Re)starts the FULL window — never adds to what is left, so two quick picks give one fresh hold. */
  arm(): void {
    this.left = FERMATA_SEC;
  }

  /** Advances by dt seconds. Returns true exactly on the frame the hold expires. */
  update(dt: number): boolean {
    if (this.left <= 0) return false;
    this.left -= dt;
    if (this.left < 0) this.left = 0;
    return this.left <= 0;
  }
}
