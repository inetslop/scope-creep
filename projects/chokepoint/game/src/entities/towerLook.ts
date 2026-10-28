import Phaser from 'phaser';
import { CELL } from '../config';
import { bolt } from '../content/augments/bolt';
import { getAugment } from '../content/augments';
import { PALETTE } from '../content/palette';
import type { Tier } from '../content/types';
import type { TowerSpec } from '../core/augments';
import type { BarrelLook } from '../art/barrels';
import { TOWER_BODY } from '../art/textures';
import { fillRing } from '../ui/ring';

/**
 * How a tower shows what its augments do, worked out from its spec (so a new augment that changes
 * the stats changes the look too). entities/Tower.ts draws it. A new visual is one more function in
 * DECORATIONS (things around the body) or one more field in the barrel look.
 */

/** At most this many barrels are drawn side by side (more shots still fire). */
export const MAX_BARRELS = 4;

/** Barrels, one per shot (Bolt); a pulse tower with Bolt added gets them for its bolts. */
export function barrelCount(spec: TowerSpec): number {
  if (!spec.attacks || spec.kind === 'rally') return 0; // a rally beacon has no barrels
  return Math.min(MAX_BARRELS, spec.kind === 'shot' ? spec.shots : spec.kind === 'pulse' ? spec.bolts : 0);
}

/** Speed-ups on top of the first augment's own rate: one per Rapid added (x1.5 each). */
export function speedUps(spec: TowerSpec): number {
  const firstRate = spec.firstId ? getAugment(spec.firstId).first.rate : spec.rate;
  return Math.round(Math.log(Math.max(1, spec.rate / firstRate)) / Math.log(1.5));
}

/**
 * The barrels' look, as multiples of a plain Bolt barrel: longer for more range (Reach), thinner
 * for fast light shots and thicker for heavy ones, a bulb when shots burst (Splash), a yellow band
 * per speed-up (Rapid added), a chevron tip and green ticks when the shots lead (Lead).
 */
export function barrelLook(spec: TowerSpec): BarrelLook {
  const plain = bolt.first;
  const damage = spec.kind === 'shot' ? spec.damage : spec.boltDamage;
  // A piercing shot shows as a long thin rod (fixed length: a range-scaled rod would reach past
  // the road's edge beside the tower); ~2x a standard barrel's visible part, ~1/3 its width.
  const rod = spec.pierce > 0;
  // A Lead first tower gets the thinnest, longest barrel in the game, like a Reach barrel.
  const leadFirst = spec.firstId === 'lead';
  return {
    length: rod ? 1.4 : leadFirst ? 2 : Phaser.Math.Clamp(spec.range / plain.range, 0.85, 2),
    width: rod ? 0.34 : leadFirst ? 0.32 : Phaser.Math.Clamp(Math.pow(damage / plain.damage, 0.3) / Math.pow(Math.max(1, spec.rate / plain.rate), 0.35), 0.55, 1.4),
    bulb: spec.splash > 0,
    bands: speedUps(spec),
    chevronTip: leadFirst,
    chevrons: Math.max(0, spec.leadCount - (leadFirst ? 1 : 0)),
  };
}

/** A slot's tier pip color, matching the card frame: light gray common, blue rare, purple epic. */
export function pipColor(tier: Tier): number {
  if (tier === 'rare') return PALETTE.blue;
  if (tier === 'epic') return PALETTE.purple;
  return PALETTE.faint;
}

/** Draws one decoration around a tower body (at 0, 0) if the spec calls for it. */
type Decoration = (g: Phaser.GameObjects.Graphics, spec: TowerSpec, barrels: number) => void;

const BODY = TOWER_BODY * CELL;

/** Things around the tower body, one per line. */
const DECORATIONS: readonly Decoration[] = [
  // Frost: an ice ring when its hits slow.
  (g, spec) => {
    if (spec.slow) fillRing(g, 0, 0, BODY * 1.45, 3, 0, Math.PI * 2, PALETTE.ice, 0.95);
  },
  // Mark: a thin ink ring at the base (below the pips), one small tick per Mark in the tower.
  (g, spec) => {
    if (spec.markCount === 0) return;
    fillRing(g, 0, 0, BODY * 1.95, 2, 0, Math.PI * 2, PALETTE.ink, 0.85);
    for (let i = 0; i < spec.markCount; i++) {
      const a = (i * Math.PI) / 2;
      fillRing(g, 0, 0, BODY * 1.95, 3, a - 0.14, a + 0.14, PALETTE.ink);
    }
  },
  // Rapid on a tower without barrels: yellow ticks around the body, six per speed-up.
  (g, spec, barrels) => {
    if (spec.kind === 'rally') return; // a beacon has no speed to show
    const ups = speedUps(spec);
    if (barrels > 0 || ups === 0) return;
    const ticks = 6 * Math.min(2, ups);
    for (let i = 0; i < ticks; i++) {
      const a = (i / ticks) * Math.PI * 2;
      fillRing(g, 0, 0, BODY * 1.8, 3, a, a + 0.28, PALETTE.yellow);
    }
  },
];

export function drawDecorations(g: Phaser.GameObjects.Graphics, spec: TowerSpec): void {
  g.clear();
  const barrels = barrelCount(spec);
  for (const draw of DECORATIONS) draw(g, spec, barrels);
}
