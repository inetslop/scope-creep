// Must stay equal to Sfx's key (Sfx keeps its copy private; do not import from there).
const MUTE_STORAGE_KEY = 'scope-creep:muted';
const HIT_THROTTLE_MS = 150;

/**
 * Haptic feedback for phones: the big moments that screen shake signals to mouse+keyboard
 * players are felt in the hand by touch players instead. Every method is a silent no-op
 * when the game is muted or `navigator.vibrate` is missing (desktop browsers, smoke test).
 * One per process, no scene state — like `hook`, nothing to dispose on shutdown.
 */
export class Haptics {
  private lastHitAt = 0;

  /** A short buzz when the player takes a hit. At most one per 150 ms so a swarm doesn't buzz continuously. */
  hit(): void {
    if (Haptics.readMuted()) return;
    const now = performance.now();
    if (now - this.lastHitAt < HIT_THROTTLE_MS) return;
    this.lastHitAt = now;
    this.buzz(30);
  }

  /** A double tap when a level-up card is picked. */
  levelUp(): void {
    if (Haptics.readMuted()) return;
    this.buzz([20, 40, 20]);
  }

  /** A long low buzz when a boss lands. */
  boss(): void {
    if (Haptics.readMuted()) return;
    this.buzz(120);
  }

  private buzz(pattern: VibratePattern): void {
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // a locked device can throw: juice, never fatal
    }
  }

  /** Mute persists in localStorage (Sfx writes it); read per call because Sfx is recreated every run. */
  private static readMuted(): boolean {
    try {
      return localStorage.getItem(MUTE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  }
}

export const haptics = new Haptics();
