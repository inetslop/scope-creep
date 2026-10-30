import { CELL } from '../config';
import { getAugment } from '../content/augments';
import { PALETTE } from '../content/palette';
import type { AugmentCopy, Burn } from '../content/types';
import type { TowerSpec } from './augments';

/**
 * What the lines of a Beam-first tower do to the enemy they hold (T0132, T0281, applied per tick
 * by systems/BeamSystem.ts through EnemySystem.beamEffects): every tick of the hold (one per
 * TICK_SEC, core/beamHold.ts) carries the tick effects (Frost's slow, Mark's mark, Ember's
 * ablaze), and every 4th tick — once per second of contact — the tick is also a pulse (Anchor's
 * root, Push's push). The values come straight from the tower's spec, which for a Beam-first
 * tower only ever holds these from ADDED augments (Beam's first form has none).
 */

/** What one line of a Beam-first tower does to the enemy it holds. */
export interface BeamFx {
  /** The slow it holds the enemy under (Frost added), refreshed for 2 s on every tick; undefined: none. */
  slow: { pct: number; sec: number } | undefined;
  /** The mark it holds the enemy under (Mark added), for as long as the beam holds it; 0: none. */
  markPct: number;
  /** The burn it keeps the enemy ablaze with (Ember added), refreshed while held; undefined: none. */
  burn: Burn | undefined;
  /** The root its pulse applies (Anchor added); undefined: none. */
  root: { sec: number } | undefined;
  /** Board units its pulse pushes the enemy back (Push added); 0: none. */
  push: number;
}

/** The effects the tower's beam lines carry, from its spec; undefined when it is not a
 * Beam-first tower, or when its spec carries none of the effect augments. */
export function beamFx(spec: TowerSpec): BeamFx | undefined {
  if (spec.kind !== 'beam') return undefined;
  if (!spec.slow && spec.markPct <= 0 && !spec.burn && !spec.root && spec.pushPerHit <= 0) return undefined;
  return {
    slow: spec.slow ? { ...spec.slow } : undefined,
    markPct: spec.markPct,
    burn: spec.burn ? { ...spec.burn } : undefined,
    root: spec.root ? { ...spec.root } : undefined,
    push: spec.pushPerHit * CELL,
  };
}

/** How many thin effect lines ride beside a beam line (one per shown effect). */
export const BEAM_EFFECT_LINE_MAX = 2;

/** The effect augments: the ones a beam can carry. */
const EFFECT_IDS = new Set(['frost', 'mark', 'ember', 'anchor', 'push']);

/** The effect colors that ride the beam: the effect augments in tower order, one per augment
 * (duplicates dropped), each in its own color, at most BEAM_EFFECT_LINE_MAX. */
export function beamEffectLines(augments: readonly AugmentCopy[]): { id: string; color: number }[] {
  const lines: { id: string; color: number }[] = [];
  for (const a of augments) {
    if (!EFFECT_IDS.has(a.id) || lines.some((l) => l.id === a.id)) continue;
    lines.push({ id: a.id, color: PALETTE[getAugment(a.id).look.color] });
    if (lines.length >= BEAM_EFFECT_LINE_MAX) break;
  }
  return lines;
}
