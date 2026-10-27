import type Phaser from 'phaser';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { GAME_EVENTS } from '../scenes/keys';

/**
 * Visual juice: particles, rings, screen shake. Purely cosmetic — gameplay code
 * calls these methods and never reads anything back. Flat style: normal blending,
 * solid colors, no glow. All emitters are created once and reused via explode().
 */
export class FxSystem {
  private readonly scene: Phaser.Scene;
  private readonly sparks: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly fragments: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly rings: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly critRings: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly trail: Phaser.GameObjects.Particles.ParticleEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.sparks = scene.add.particles(0, 0, TEX.dot, {
      lifespan: { min: 120, max: 260 },
      speed: { min: 80, max: 220 },
      scale: { start: 0.8, end: 0 },
      emitting: false,
    });
    this.fragments = scene.add.particles(0, 0, TEX.fragment, {
      lifespan: { min: 300, max: 600 },
      speed: { min: 60, max: 240 },
      rotate: { min: 0, max: 360 },
      scale: { start: 1.1, end: 0.2 },
      alpha: { start: 1, end: 0 },
      emitting: false,
    });
    this.rings = scene.add.particles(0, 0, TEX.ring, {
      lifespan: 260,
      scale: { start: 0.3, end: 1.3 },
      alpha: { start: 0.9, end: 0 },
      emitting: false,
    });
    this.critRings = scene.add.particles(0, 0, TEX.ring, {
      lifespan: 300,
      scale: { start: 0.5, end: 0.75 },
      alpha: { start: 1, end: 0 },
      tint: PALETTE.ink,
      emitting: false,
    });
    this.trail = scene.add.particles(0, 0, TEX.dot, {
      lifespan: { min: 400, max: 700 },
      speed: { min: 0, max: 12 },
      scale: { start: 0.7, end: 0 },
      alpha: { start: 0.45, end: 0 },
      tint: PALETTE.gray,
      emitting: false,
    });
    this.trail.setDepth(DEPTH.pickups - 1);
    for (const e of [this.fragments, this.sparks, this.rings, this.critRings]) e.setDepth(DEPTH.fx);
  }

  /** Small burst where a projectile hits. */
  hit(x: number, y: number, color: number): void {
    this.sparks.setParticleTint(color);
    this.sparks.explode(4, x, y);
  }

  /** Small ink ring at a crit impact point. */
  critRing(x: number, y: number): void {
    this.critRings.explode(1, x, y);
  }

  /** Enemy destroyed: a ring and fragments in its color. `extraRings` adds rings (elites). */
  death(x: number, y: number, body: number, accent: number, size: number, extraRings = 0): void {
    this.rings.setParticleTint(body);
    this.rings.explode((size >= 24 ? 2 : 1) + extraRings, x, y);
    this.fragments.setParticleTint(body);
    this.fragments.explode(Math.min(14, 4 + Math.round(size / 4)), x, y);
    this.fragments.setParticleTint(accent);
    this.fragments.explode(2, x, y);
  }

  muzzle(x: number, y: number, color: number): void {
    this.sparks.setParticleTint(color);
    this.sparks.explode(2, x, y);
  }

  /** Fading dots behind the moving player. */
  trailAt(x: number, y: number): void {
    this.trail.explode(1, x, y);
  }

  pickup(x: number, y: number): void {
    this.sparks.setParticleTint(PALETTE.yellow);
    this.sparks.explode(2, x, y);
  }

  /** Player took damage: blue chips knocked off it, a red ring, a small shake. No full-screen flash: it's hard on the eyes. */
  playerHit(x: number, y: number): void {
    this.rings.setParticleTint(PALETTE.red);
    this.rings.explode(1, x, y);
    this.fragments.setParticleTint(PALETTE.blue);
    this.fragments.explode(6, x, y);
    this.scene.cameras.main.shake(140, 0.006);
    this.scene.events.emit(GAME_EVENTS.playerHit);
  }

  /** Boss death: a shower of ink fragments. */
  shatter(x: number, y: number, count: number): void {
    this.fragments.setParticleTint(PALETTE.ink);
    this.fragments.explode(count, x, y);
  }

  shake(durationMs: number, intensity: number): void {
    this.scene.cameras.main.shake(durationMs, intensity);
  }
}
