import type Phaser from 'phaser';
import { CELL, DEPTH } from '../config';
import { PALETTE } from '../content/palette';
import { flyRouteFor } from '../core/flyRoute';
import { isFlyerBossPlan } from '../core/flyTelegraph';
import type { RunState } from '../core/run';
import type { Board } from './Board';
import type { WaveSystem } from './WaveSystem';

/** The fade once the wave starts — the same 0.3 s as T0317's wave-start line (flyLine). */
const FADE_SEC = 0.3;
/** The line's alpha — the Flyer's own 50% (T0317's flyLine telegraph alpha): the show holds it, the fade runs it to 0. */
const ALPHA = 0.5;

/**
 * The Flyer's first line during the build: when the next wave declares the Flyer as its boss
 * (core/flyTelegraph.ts), the board's seeded crossing — spawn to exit (core/flyRoute.ts) — is on
 * the board in the telegraph's own shape (T0317's wave-start line: 2 px, the Flyer's red, 50%
 * alpha, the preview depth), so the cover for the crossing is chosen in the build, not learned at
 * the wave's door. The moment the wave starts the line fades out over 0.3 s and is destroyed;
 * T0317's wave-start telegraph continues the same line for its 3 s, so the route reads from the
 * build through the crossing's start and leaves no mark. The bank's line is not shown: the bank
 * is the wave's own beat, telegraphed in-wave.
 */
export class FlyTelegraph {
  private readonly scene: Phaser.Scene;
  private readonly run: RunState;
  private readonly waves: WaveSystem;
  /** The two ends of the first line, board units (spawn off the island's edge, the exit gate). */
  private readonly points: { x: number; y: number }[];
  private line: Phaser.GameObjects.Line | undefined;
  private fadeT = 0;

  constructor(scene: Phaser.Scene, board: Board, run: RunState, waves: WaveSystem) {
    this.scene = scene;
    this.run = run;
    this.waves = waves;
    // The board's own seeded route (the same flyRouteFor the Flyer flies): the spawn point to
    // the exit gate. A resumed run's board regrows identically from the seed, so so does this.
    const route = flyRouteFor(board.map, CELL);
    this.points = [route.spawn, route.exit];
  }

  update(dt: number): void {
    const show = this.run.phase === 'build' && isFlyerBossPlan(this.waves.nextPlan);
    if (show) {
      if (!this.line || !this.line.active) this.makeLine();
      this.fadeT = 0;
      this.line!.setAlpha(ALPHA);
      this.line!.setVisible(true);
      return;
    }
    if (this.line && this.line.active && this.line.visible) {
      this.fadeT += dt;
      this.line.setAlpha(ALPHA * Math.max(0, 1 - this.fadeT / FADE_SEC));
      if (this.fadeT >= FADE_SEC) {
        this.line.destroy();
        this.line = undefined;
      }
    }
  }

  /**
   * The first line is exactly two points, so the scene's own two-point Line is the shape. Its
   * own alpha is 1 and the show's 50% comes from setAlpha: the renderers apply the two alphas
   * differently (WebGL multiplies, Canvas takes the object's), so only one of them may carry it.
   */
  private makeLine(): void {
    this.line = this.scene.add.line(0, 0, this.points[0]!.x, this.points[0]!.y, this.points[1]!.x, this.points[1]!.y, PALETTE.red, 1)
      .setLineWidth(2)
      .setDepth(DEPTH.preview);
  }

  /** Invariant: a visible line has finite points. */
  broken(): string | undefined {
    if (!this.line?.visible) return undefined;
    return this.points.every((p) => Number.isFinite(p.x) && Number.isFinite(p.y))
      ? undefined
      : 'the fly line has a non-finite point';
  }
}
