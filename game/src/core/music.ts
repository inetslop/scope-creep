export const MUSIC_BASE_BPM = 80;
export const MUSIC_BPM_PER_MIN = 4;
export const MUSIC_MAX_BPM = 120;
export const MUSIC_SECOND_VOICE_BPM = 100;

/** Tempo of the generative score: 80 BPM at the start, +4 BPM per minute, capped at 120. */
export function bpmForTime(timeSec: number): number {
  return Math.min(MUSIC_BASE_BPM + MUSIC_BPM_PER_MIN * (timeSec / 60), MUSIC_MAX_BPM);
}

/** The higher off-beat voice joins once the pulse reaches 100 BPM. */
export function secondVoiceActive(timeSec: number): boolean {
  return bpmForTime(timeSec) >= MUSIC_SECOND_VOICE_BPM;
}

export const BOSS_BPM = 64;
export const BOSS_GLIDE_SEC = 1.5;

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function clamp01(t: number): number { return t < 0 ? 0 : t > 1 ? 1 : t; }

/**
 * Boss tempo hold for the score: while a boss is alive the tempo holds at
 * BOSS_BPM, gliding down over BOSS_GLIDE_SEC on spawn and gliding back to the
 * run curve over BOSS_GLIDE_SEC on death. BossSystem owns the writes,
 * mirroring how it owns BossTimer.
 */
export class BossTempo {
  private phase: 'off' | 'entering' | 'leaving' = 'off';
  private enteredAtSec = 0;
  private enterFromBpm = MUSIC_BASE_BPM;
  private leftAtSec = 0;
  private leaveToBpm = MUSIC_BASE_BPM;

  /** Boss spawn: glide from the current tempo down to BOSS_BPM. A call during a
   *  return glide re-targets it from the tempo at that moment. */
  bossEnter(timeSec: number): void {
    this.enterFromBpm = this.bpmFor(timeSec);
    this.enteredAtSec = timeSec;
    this.phase = 'entering';
  }

  /** Boss death: glide back to the run curve's value at that moment. */
  bossLeave(timeSec: number): void {
    if (this.phase === 'off') return;
    this.leaveToBpm = bpmForTime(timeSec);
    this.leftAtSec = timeSec;
    this.phase = 'leaving';
  }

  /** True once the 64 BPM hold is in effect: after the spawn glide, until bossLeave. */
  holding(timeSec: number): boolean {
    if (this.phase === 'off' || this.phase === 'leaving') return false;
    return timeSec >= this.enteredAtSec + BOSS_GLIDE_SEC;
  }

  /** The score's tempo at run time `timeSec`, honoring the hold and both glides. */
  bpmFor(timeSec: number): number {
    if (this.phase === 'entering') {
      return lerp(this.enterFromBpm, BOSS_BPM, clamp01((timeSec - this.enteredAtSec) / BOSS_GLIDE_SEC));
    }
    if (this.phase === 'leaving') {
      const t = (timeSec - this.leftAtSec) / BOSS_GLIDE_SEC;
      if (t > 1) return bpmForTime(timeSec); // glide done: back on the moving curve, no 64 residue
      return lerp(BOSS_BPM, this.leaveToBpm, clamp01(t));
    }
    return bpmForTime(timeSec);
  }
}
