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
export const MAX_BARRELS = 5;

/** Barrels, one per shot (Bolt); a pulse tower with Bolt added gets them for its bolts. */
export function barrelCount(spec: TowerSpec): number {
  if (!spec.attacks || spec.kind === 'rally') return 0; // a rally beacon has no barrels
  if (spec.gust > 0) return 1; // a gust: one short, wide mouth the wind comes out of
  if (spec.kind === 'spray') return 1; // a spray: one flat wide head the blast comes out of
  if (spec.kind === 'burn') return 1; // a burn: one barrel, the ember at its mouth
  if (spec.kind === 'beam') return 1; // a beam: one orb on a post, the line leaves its centre
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
 * per speed-up (Rapid added), and orange ticks with a muzzle ember when its hits set ablaze (Ember).
 */
export function barrelLook(spec: TowerSpec): BarrelLook {
  // A gust throws nothing: a short, wide flat mouth, wider than the body reads "wind, not a shot".
  if (spec.gust > 0) return { length: 1.2, width: 2.2, bulb: false, bands: 0, emberTicks: spec.burnCount, emberMuzzle: false, beamTicks: spec.beamExtras.length };
  // A spray blasts a cone of pellets from one flat wide head like the gust mouth, one tick per Spray copy.
  if (spec.kind === 'spray') return { length: 1.2, width: 2.2, bulb: spec.splash > 0, bands: speedUps(spec), emberTicks: spec.burnCount, emberMuzzle: false, sprayTicks: spec.sprayCount };
  // A beam never fires: a post with an orb on top, one tick per Beam added.
  if (spec.kind === 'beam') return { length: 1, width: 1, bulb: false, bands: 0, beamTicks: spec.beamExtras.length };
  const plain = bolt.first;
  const damage = spec.kind === 'shot' ? spec.damage : spec.boltDamage;
  // A piercing shot shows as a long thin rod (fixed length: a range-scaled rod would reach past
  // the road's edge beside the tower); ~2x a standard barrel's visible part, ~1/3 its width.
  const rod = spec.pierce > 0;
  return {
    length: rod ? 1.4 : Phaser.Math.Clamp(spec.range / plain.range, 0.85, 2),
    width: rod ? 0.34 : Phaser.Math.Clamp(Math.pow(damage / plain.damage, 0.3) / Math.pow(Math.max(1, spec.rate / plain.rate), 0.35), 0.55, 1.4),
    bulb: spec.splash > 0,
    bands: speedUps(spec),
    emberTicks: spec.burnCount - (spec.kind === 'burn' ? 1 : 0), // the first Ember is the muzzle dot; each added one is a tick
    emberMuzzle: spec.kind === 'burn',
    beamTicks: spec.beamExtras.length, // a Beam added to any tower ticks its barrels
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
  // Anchor: a flat slate ring at the base with four ticks — it stops everything in range.
  (g, spec) => {
    if (!spec.root) return;
    fillRing(g, 0, 0, BODY * 1.6, 3, 0, Math.PI * 2, PALETTE.muted, 0.95);
    for (let i = 0; i < 4; i++) {
      const a = Math.PI / 4 + i * (Math.PI / 2);
      fillRing(g, 0, 0, BODY * 1.6, 6, a - 0.12, a + 0.12, PALETTE.muted, 1);
    }
  },
  // Mint: a small gold coin on the plinth's right side — kills near it (or by it) drop extra gold.
  (g, spec) => {
    if (spec.goldPerKill === 0) return;
    const r = 0.1 * CELL;
    g.fillStyle(PALETTE.yellowDeep, 1); g.fillCircle(16.5, 14, r);
    g.fillStyle(PALETTE.yellow, 1); g.fillCircle(16.5, 12, r);
  },
  // Toll: a flat muted-gray disc at the base with one short ink tick per copy (Toll first);
  // an added Toll shows one small muted-gray tick, the tick language of the other added forms.
  (g, spec) => {
    if (spec.tollCount === 0) return;
    if (spec.firstId === 'toll') {
      g.fillStyle(PALETTE.muted, 1); g.fillCircle(0, 4, BODY * 1.5);
      for (let i = 0; i < spec.tollCount; i++) {
        const a = -Math.PI / 2 + (i / spec.tollCount) * Math.PI * 2;
        fillRing(g, 0, 4, BODY * 1.5, 3, a - 0.14, a + 0.14, PALETTE.ink);
      }
    } else {
      for (let i = 0; i < spec.tollCount; i++) {
        const a = Math.PI / 2 + (i / spec.tollCount) * Math.PI * 2;
        fillRing(g, 0, 0, BODY * 1.8, 3, a - 0.12, a + 0.12, PALETTE.muted);
      }
    }
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
  // Push: one small outward-pointing arrowhead per Push in the tower, around the base (below the pips).
  (g, spec) => {
    for (let i = 0; i < spec.pushCount; i++) {
      drawArrowhead(g, BODY * 2.4, Math.PI / 2 + (i / spec.pushCount) * Math.PI * 2, PALETTE.ink);
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

/** A small arrowhead pointing out along angle `a`: tip at radius R + 5, base at R - 3 (±0.34 rad). */
function drawArrowhead(g: Phaser.GameObjects.Graphics, R: number, a: number, color: number): void {
  g.fillStyle(color, 1);
  g.fillTriangle(
    Math.cos(a) * (R + 5), Math.sin(a) * (R + 5),
    Math.cos(a - 0.34) * (R - 3), Math.sin(a - 0.34) * (R - 3),
    Math.cos(a + 0.34) * (R - 3), Math.sin(a + 0.34) * (R - 3),
  );
}

/**
 * Haste: the flat wide red ring at the tower's base, one tick per copy in it. It lives on its own
 * Graphics (the tower's `hasteRing`) so systems/HasteSystem.ts can dim it per tower — the shared
 * decorations graphics cannot take a per-object alpha.
 */
export function drawHasteRing(g: Phaser.GameObjects.Graphics, spec: TowerSpec): void {
  g.clear();
  if (spec.hasteCount === 0) return;
  const r = BODY * 1.7;
  fillRing(g, 0, 0, r, 6, 0, Math.PI * 2, PALETTE.red);
  for (let i = 0; i < spec.hasteCount; i++) {
    const a = (i / spec.hasteCount) * Math.PI * 2;
    fillRing(g, 0, 0, r, 9, a - 0.14, a + 0.14, PALETTE.red);
  }
}

export function drawDecorations(g: Phaser.GameObjects.Graphics, spec: TowerSpec): void {
  g.clear();
  const barrels = barrelCount(spec);
  for (const draw of DECORATIONS) draw(g, spec, barrels);
}
