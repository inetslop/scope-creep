/** The kill chain's base window in ms: the ×N counter lives this long after its last kill. */
export const FEAST_CHAIN_BASE_MS = 1500;

/**
 * The kill chain's window in ms for `copies` Feast on the board: the base 1.5 s, plus 0.4 s per
 * copy beyond the first (content/augments/feast.ts). Additive, no cap.
 */
export function feastChainWindowMs(copies: number): number {
  return FEAST_CHAIN_BASE_MS + 400 * Math.max(0, copies - 1);
}

/**
 * Whether the run's kill chain is alive at `now`: its level is up AND its last kill is still
 * inside the window. FxSystem resets its counter lazily (at the next kill) and arms no timer for
 * a level-1 chain, so after a break the count can sit stale — the window check is what keeps the
 * bonus from riding a dead chain.
 */
export function chainAlive(chain: number, now: number, lastKill: number, windowMs: number): boolean {
  return chain >= 1 && now - lastKill < windowMs;
}

/**
 * The damage multiplier one damage event takes while `feastCopies` Feast stand on the board and
 * the chain is at `chain`: 1 + 4% per chain level (×2 → 1.08, ×10 → 1.40), 1 the moment the chain
 * breaks or no Feast stands (a feast-less run is byte-identical to before Feast existed).
 */
export function feastDamageMul(feastCopies: number, chain: number, now: number, lastKill: number, windowMs: number): number {
  if (feastCopies <= 0 || !chainAlive(chain, now, lastKill, windowMs)) return 1;
  return 1 + 0.04 * chain;
}
