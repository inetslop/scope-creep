import type Phaser from 'phaser';
import type { Sfx } from '../audio/Sfx';
import { inRedactRadius, RedactClock, REDACT_COOLDOWN_SEC } from '../core/redactor';
import type { Enemy } from '../entities/Enemy';
import type { EnemyBullet } from '../entities/EnemyBullet';
import type { Player } from '../entities/Player';
import type { FxSystem } from './FxSystem';

/**
 * The Redactor's active "Redact": erases every enemy bullet within REDACT_RADIUS
 * of the player and slows every enemy and elite in range to 60% for 2.5 s, on a
 * 12 s cooldown. Bosses and their parts live outside the enemy/bullet groups, so
 * they are never slowed. Only usable while the game scene is running (GameScene
 * stops calling update while paused or under an overlay).
 */
export class RedactSystem {
  private readonly clock = new RedactClock();
  private readonly player: Player;
  private readonly enemies: Phaser.GameObjects.Group;
  private readonly shots: Phaser.GameObjects.Group;
  private readonly fx: FxSystem;
  private readonly sfx: Sfx;
  private readonly picked: boolean;
  /** Edge-trigger state: the previous frame's redact input, and a pending touch request. */
  private redactHeld = false;
  private touchRequested = false;

  constructor(player: Player, enemies: Phaser.GameObjects.Group, shots: Phaser.GameObjects.Group, fx: FxSystem, sfx: Sfx, picked: boolean) {
    this.player = player;
    this.enemies = enemies;
    this.shots = shots;
    this.fx = fx;
    this.sfx = sfx;
    this.picked = picked;
  }

  /** Ring fraction for the HUD button: 1 (full ring) when ready, draining while cooling. */
  get ringFrac(): number {
    return this.clock.ready ? 1 : this.clock.cdLeft / REDACT_COOLDOWN_SEC;
  }

  /** Seconds left on the cooldown (the redact-cooldown invariant reads this). */
  get cdLeft(): number {
    return this.clock.cdLeft;
  }

  /** Edge from the HUD's touch button; keyboard and gamepad flow through `update`. */
  request(): void {
    this.touchRequested = true;
  }

  /**
   * Seeds the edge-trigger state with the redact input already held at run start:
   * the menu starts a run on Space keydown / any gamepad button, so a press made
   * in the menu must not fire the Redact on the first frame.
   */
  seedHeld(held: boolean): void {
    this.redactHeld = held;
  }

  /** Called on resume: a stale touch from before the pause must not fire the Redact. */
  reset(): void {
    this.redactHeld = false;
    this.touchRequested = false;
  }

  update(dtSec: number, redactInput: boolean): void {
    this.clock.update(dtSec);
    const edge = (redactInput && !this.redactHeld) || this.touchRequested;
    this.redactHeld = redactInput;
    this.touchRequested = false;
    if (!edge || !this.picked) return;
    if (!this.clock.trigger()) return; // a trigger during the cooldown is rejected
    this.redact();
  }

  private redact(): void {
    const px = this.player.x;
    const py = this.player.y;
    for (const obj of this.shots.getChildren()) {
      const b = obj as EnemyBullet;
      if (!b.active || !inRedactRadius(px, py, b.x, b.y)) continue;
      this.fx.critRing(b.x, b.y); // each bullet dies in a small flat ink ring
      b.despawn(); // enemy bullets are not restored
    }
    for (const obj of this.enemies.getChildren()) {
      const e = obj as Enemy;
      if (!e.active || !inRedactRadius(px, py, e.x, e.y)) continue;
      e.redact();
    }
    this.sfx.redact();
  }
}
