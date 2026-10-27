import type Phaser from 'phaser';
import { TEX } from '../art/textures';
import { DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { CameraShake } from '../core/shake';
import { SLAM } from '../core/slam';
import { hook } from '../debug/testHook';
import { GAME_EVENTS } from '../scenes/keys';

const PLATEMARK_MAX = 12;
const PLATEMARK_LIFE_MS = 2000;
const PLATEMARK_COOLDOWN_MS = 500;

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
  private readonly slamRings: Phaser.GameObjects.Particles.ParticleEmitter;
  private readonly trail: Phaser.GameObjects.Particles.ParticleEmitter;
  /** Platemarks: stationary red ×s printed on the paper where the player took a hit. */
  private readonly platemarks: (Phaser.GameObjects.Image | undefined)[] = [];
  private platemarkCursor = 0;
  private lastPlatemarkAt = -Infinity;
  /** The camera shake state machine. Named `shakeState` (not `shake`) because the public method is `shake()`. */
  private readonly shakeState = new CameraShake();
  /** Camera jitter applied last frame, in world units; subtracted before a new one so it can't accumulate. */
  private lastShakeX = 0;
  private lastShakeY = 0;

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
    // The 26 -> 160 ripple is baked into the emitter: ParticleEmitter has no per-call setScale in 3.90.
    this.slamRings = scene.add.particles(0, 0, TEX.ringWide, {
      lifespan: 250,
      scale: { start: 26 / SLAM.radius, end: 1 },
      alpha: { start: 0.9, end: 0 },
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
    for (const e of [this.fragments, this.sparks, this.rings, this.critRings, this.slamRings]) e.setDepth(DEPTH.fx);
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

  /** A Platen slam: one ink ring rippling outward from the body to the slam radius. */
  slamRing(x: number, y: number): void {
    this.slamRings.explode(1, x, y);
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
    this.shake(4, 140);
    this.scene.events.emit(GAME_EVENTS.playerHit);
    this.printPlatemark(x, y);
  }

  /** ×s currently on screen (the platemark-pool invariant reads this). */
  get platemarkCount(): number {
    let n = 0;
    for (const s of this.platemarks) if (s && s.alpha > 0) n += 1;
    return n;
  }

  /** Prints a stationary red × at (x, y); at most one per cooldown, oldest dropped beyond the pool cap. */
  private printPlatemark(x: number, y: number): void {
    const now = this.scene.time.now;
    if (now - this.lastPlatemarkAt < PLATEMARK_COOLDOWN_MS) return; // already printed for this hit
    this.lastPlatemarkAt = now;
    const i = this.platemarkCursor;
    this.platemarkCursor = (i + 1) % PLATEMARK_MAX;
    let slot = this.platemarks[i];
    if (!slot) slot = this.scene.add.image(0, 0, TEX.platemark).setOrigin(0.5).setDepth(DEPTH.floor + 1);
    this.platemarks[i] = slot;
    this.scene.tweens.killTweensOf(slot);
    slot.setPosition(x, y).setAlpha(1).setVisible(true);
    this.scene.tweens.add({ targets: slot, alpha: 0, duration: PLATEMARK_LIFE_MS, ease: 'Linear', onComplete: () => slot.setVisible(false) });
  }

  /** Boss death: a shower of ink fragments. */
  shatter(x: number, y: number, count: number): void {
    this.fragments.setParticleTint(PALETTE.ink);
    this.fragments.explode(count, x, y);
  }

  /** Requests a screen shake. Amplitude is in screen px; adds to (and caps at) the shake in flight. */
  shake(amplitude: number, durationMs: number): void {
    if (!hook.stats.screenShake) return;
    this.shakeState.add(amplitude, durationMs);
  }

  /** How long the current shake has left to run (ms). The camera-shake invariant reads this. */
  get shakeMs(): number {
    return this.shakeState.remainingMs;
  }

  /**
   * Called from GameScene's POST_UPDATE, after the camera follow has run.
   * Removes last frame's jitter, then adds a fresh random offset scaled by zoom.
   */
  updateShake(dtMs: number): void {
    const cam = this.scene.cameras.main;
    cam.scrollX -= this.lastShakeX;
    cam.scrollY -= this.lastShakeY; // remove last frame's jitter so it can't accumulate
    this.lastShakeX = 0;
    this.lastShakeY = 0;
    const amp = this.shakeState.update(dtMs);
    if (amp === null) return; // scroll is now exactly the follow position
    this.lastShakeX = ((Math.random() * 2 - 1) * amp) / cam.zoom; // screen px -> world units
    this.lastShakeY = ((Math.random() * 2 - 1) * amp) / cam.zoom;
    cam.scrollX += this.lastShakeX;
    cam.scrollY += this.lastShakeY;
  }
}
