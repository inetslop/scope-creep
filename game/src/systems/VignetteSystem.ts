import type Phaser from 'phaser';
import { ARENA_SIZE, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { cropSafeFraction } from '../core/crop';
import type { RunState } from '../core/run';

const FADE_SEC = 0.2;        // fade in/out
const PULSE_MIN = 0.25;      // rule alpha range while fully faded in
const PULSE_MAX = 0.75;
const PULSE_PERIOD_SEC = 1;  // one 0.25 -> 0.75 -> 0.25 cycle
const BAND_UNITS = 40;       // band thickness at each paper edge

/**
 * The low-HP vignette (pure readability): when the player is close to being
 * erased the paper's edges fall into a flat warm shadow and a thin red rule
 * pulses along the crop-safe boundary, so danger is readable at a glance.
 * Latched with 25%/30% hysteresis (core/vignette.ts) and both layers fade in
 * and out over 200 ms. The rule rides the same crop-safe boundary as the
 * BossApproach red line (T0070), so it stays correct through the Crop shrink
 * (T0045) and the Tide breathing edge (T0127). Deals no damage and changes no
 * stat, spawn, hazard, weapon, clock or music.
 */
export class VignetteSystem {
  /** 0..1; public so the 'low-hp-vignette' invariant can read it. */
  fade = 0;
  private readonly run: RunState;
  private readonly bands: Phaser.GameObjects.Graphics;
  private readonly rule: Phaser.GameObjects.Graphics;
  private pulseAge = 0;

  constructor(scene: Phaser.Scene, run: RunState) {
    this.run = run;
    this.bands = scene.add.graphics().setDepth(DEPTH.floor + 3).setVisible(false); // above crop margin + gutter band, below arena walls
    this.rule = scene.add.graphics().setDepth(DEPTH.arena + 1).setVisible(false);  // same depth as the boss-approach rule
  }

  update(dt: number): void {
    const run = this.run;
    run.vignette.tick(run.hp / run.stats.maxHp);
    this.fade = Math.max(0, Math.min(1, this.fade + (run.vignette.on ? 1 : -1) * dt / FADE_SEC));
    if (this.fade <= 0) {
      this.bands.setVisible(false);
      this.rule.setVisible(false);
      return;
    }
    const a = ARENA_SIZE / 2;
    // Four non-overlapping rects (left/right strips span only the middle): filling a corner
    // twice at partial alpha would darken it.
    this.bands.clear().setVisible(true);
    this.bands.fillStyle(PALETTE.paperShade, this.fade);
    this.bands.fillRect(-a, -a, 2 * a, BAND_UNITS);
    this.bands.fillRect(-a, a - BAND_UNITS, 2 * a, BAND_UNITS);
    this.bands.fillRect(-a, -a + BAND_UNITS, BAND_UNITS, 2 * a - 2 * BAND_UNITS);
    this.bands.fillRect(a - BAND_UNITS, -a + BAND_UNITS, BAND_UNITS, 2 * a - 2 * BAND_UNITS);
    this.pulseAge += dt;
    const t = (this.pulseAge % PULSE_PERIOD_SEC) / PULSE_PERIOD_SEC;
    const pulse = PULSE_MIN + (PULSE_MAX - PULSE_MIN) * (1 - Math.abs(2 * t - 1)); // 0.25 -> 0.75 -> 0.25 over 1 s
    const half = (ARENA_SIZE / 2) * cropSafeFraction(run.timeSec); // the crop-safe boundary, exactly as BossApproachSystem
    this.rule.clear().setVisible(true);
    this.rule.lineStyle(2, PALETTE.red, this.fade * pulse);
    this.rule.strokeRect(-half, -half, 2 * half, 2 * half);
  }
}
