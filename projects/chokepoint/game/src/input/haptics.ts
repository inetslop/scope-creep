/**
 * Haptics (T0265): the board's loud moments, felt as well as seen. On a phone that can
 * vibrate, a tower landing, a leak getting through and a boss dying buzz the hand. A total no-op on desktop
 * and in unsupported browsers: nothing prints, nothing changes. The buzz is a browser call in
 * real time (not the simulation clock), so at 2× fast-forward a leak still vibrates exactly once.
 */

/** Which moment the phone buzzes for: a tower committed to the board, a leak getting through, a boss dying. */
export type HapticKind = 'place' | 'leak' | 'boss';

/** The buzz per moment, in ms: a tower lands, a leak gets through, a boss dies. */
export const PATTERNS: Record<HapticKind, number[]> = {
  place: [20],
  leak: [80],
  boss: [200],
};

/**
 * Buzzes `kind` where the phone can vibrate; a no-op on desktop and unsupported browsers. Only
 * the board's celebrations call it, at the exact moment they already chime and jolt.
 */
export function haptic(kind: HapticKind): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(PATTERNS[kind]);
  } catch {
    /* The phone refused the buzz (vibration locked, or the call threw): the run goes on without it */
  }
}

/**
 * A tagged wave's tag (T0449): a wave wearing a tag other than "quiet" (tight, rush, short cut,
 * boss — double and clumps when they land) buzzes 30 ms once, as it starts, so a phone player
 * feels the special wave coming without reading the chip. The same guarded no-op as `haptic`:
 * nothing on a desktop or a haptics-less browser.
 */
export function tagHaptic(): void {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(30);
  } catch {
    /* The phone refused the buzz (vibration locked, or the call threw): the run goes on without it */
  }
}
