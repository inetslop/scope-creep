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
