/**
 * The wave's speed: 1x or 2x (fast-forward). GameScene scales the simulation dt through scale()
 * so everything in the wave phase runs twice as fast at once.
 */
export class WaveSpeed {
  /** 1 or 2. */
  speed = 1;

  /** Toggle 1x/2x; only honoured while the wave phase runs (build/draft/over ignore it). */
  toggle(inWave: boolean): void {
    if (!inWave) return;
    this.speed = this.speed === 1 ? 2 : 1;
  }

  /** The dt to simulate this frame; outside the wave phase the speed resets to 1. */
  scale(dt: number, inWave: boolean): number {
    if (!inWave) this.speed = 1;
    return dt * this.speed;
  }
}
