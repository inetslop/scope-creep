/**
 * CameraShake: a pure state machine that combines "heavy death" camera shakes.
 * Amplitudes add up (capped at `maxAmp`, screen px) and the longest duration
 * wins; `update()` returns the eased-out amplitude to apply this frame, or
 * null when idle. Owned by FxSystem, driven from GameScene's POST_UPDATE so
 * the jitter lands on the camera scroll after the follow pass.
 */
export class CameraShake {
  private amp = 0; // combined amplitude, screen px, capped at 20
  private totalMs = 0;
  private leftMs = 0;

  get remainingMs(): number {
    return this.leftMs;
  }

  add(amplitude: number, durationMs: number, maxAmp = 20): void {
    if (amplitude <= 0 || durationMs <= 0) return;
    this.amp = Math.min(maxAmp, this.amp + amplitude);
    this.totalMs = Math.max(this.totalMs, durationMs);
    this.leftMs = Math.max(this.leftMs, durationMs);
  }

  /** Advances dtMs; returns the current amplitude in screen px (eased out), or null when idle. */
  update(dtMs: number): number | null {
    if (this.leftMs <= 0) return null;
    this.leftMs -= dtMs;
    if (this.leftMs <= 0) {
      this.leftMs = 0;
      this.amp = 0;
      this.totalMs = 0;
      return null;
    }
    const t = this.leftMs / this.totalMs;
    return this.amp * t * t; // ease-out: full at the start, settling to zero
  }
}
