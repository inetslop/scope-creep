import type Phaser from 'phaser';
import { SHADOW_OFFSET } from '../art/shapes';
import type { Sfx } from '../audio/Sfx';
import { ARENA_SIZE, DEPTH, PLAYER_RADIUS } from '../config';
import { PALETTE } from '../content/palette';
import { cropSafeFraction } from '../core/crop';
import { GUTTER, gutterAt } from '../core/gutter';
import type { RunState } from '../core/run';
import type { Player } from '../entities/Player';
import type { DamageNumbers } from './DamageNumbers';
import type { Marginalia } from './Marginalia';

/**
 * First arena hazard: after 14:00 a 40-unit band of flat ink sweeps across the
 * crop-safe area every 20 s, taking 4.0 s to cross the safe width, direction
 * alternating. A thin red rule pulses at the entering edge 1.5 s before each
 * entry, and standing in the band burns for 4 per second — the same continuous
 * drain as the crop margin (no invulnerability, no shake, no SFX). The first
 * sweep in a run gets the "THE PAGE INKS" marginalia note. One soft paper
 * slap (Sfx.gutterSlap) plays when each band sweeps into the safe area; the burn
 * stays silent. The band is a plain
 * Graphics object: it does not touch enemies, bullets, shards or knockback.
 * Everything derives from run.timeSec each frame, so pausing freezes it
 * mid-sweep and resuming continues without a jump. See src/core/gutter.ts for
 * the schedule.
 */
export class GutterSystem {
  /** Total burn dealt this run. */
  totalDamage = 0;
  /** Band center in world X while active; NaN when the band is not on the page. */
  bandX = Number.NaN;
  bandActive = false;
  private readonly run: RunState;
  private readonly player: Player;
  private readonly damageNumbers: DamageNumbers;
  private readonly marginalia: Marginalia;
  private readonly sfx: Sfx;
  private readonly g: Phaser.GameObjects.Graphics;
  private numberTimer = 0;
  private taught = false;
  private lastSlapSweep = -1;

  constructor(scene: Phaser.Scene, run: RunState, player: Player, marginalia: Marginalia, damageNumbers: DamageNumbers, sfx: Sfx) {
    this.run = run;
    this.player = player;
    this.damageNumbers = damageNumbers;
    this.marginalia = marginalia;
    this.sfx = sfx;
    this.g = scene.add.graphics().setDepth(DEPTH.floor + 2); // above the crop margin, below the arena walls
  }

  private safeHalf(): number { return (ARENA_SIZE / 2) * cropSafeFraction(this.run.timeSec); }

  update(dt: number): void {
    const ph = gutterAt(this.run.timeSec);
    this.bandActive = ph.active;
    this.bandX = ph.active ? this.safeHalf() * (2 * ph.centerFraction - 1) : Number.NaN;
    if (ph.active && ph.sweep !== this.lastSlapSweep) {
      this.lastSlapSweep = ph.sweep;
      this.sfx.gutterSlap();
    }
    this.g.clear();
    if (!ph.active && !ph.telegraph) return;
    const half = this.safeHalf();
    if (ph.telegraph) {
      const x = ph.direction === 1 ? -half : half - 2;   // 2 u red rule, full safe height, at the entering edge
      this.g.fillStyle(PALETTE.red, ph.telegraphAlpha).fillRect(x, -half, 2, 2 * half);
      if (!this.taught) {
        this.taught = true;
        this.marginalia.freeNote('THE PAGE INKS', x + (ph.direction === 1 ? 70 : -70), -half + 60);
      }
      return;
    }
    const cx = half * (2 * ph.centerFraction - 1), w = GUTTER.widthUnits / 2;
    const x0 = Math.max(cx - w, -half), x1 = Math.min(cx + w, half);  // clipped to the crop-safe rect
    if (x1 <= x0) return;
    const dx = ph.direction * SHADOW_OFFSET;                          // hard paper-cut shadow on the leading edge
    const s0 = Math.max(x0 + dx, -half), s1 = Math.min(x1 + dx, half);
    if (s1 > s0) this.g.fillStyle(PALETTE.ink, 0.18).fillRect(s0, -half + SHADOW_OFFSET, s1 - s0, 2 * half - SHADOW_OFFSET);
    this.g.fillStyle(PALETTE.ink, 0.85).fillRect(x0, -half, x1 - x0, 2 * half);
    const p = this.player, R = PLAYER_RADIUS;
    const inside = p.x + R > x0 && p.x - R < x1 && p.y + R > -half && p.y - R < half;
    if (inside && !this.run.isDead) {
      this.totalDamage += this.run.drain(GUTTER.burnPerSec * dt);
      this.numberTimer -= dt;
      if (this.numberTimer <= 0) {
        this.numberTimer = 0.5;
        this.damageNumbers.show(p.x, p.y - 24, GUTTER.burnPerSec * 0.5, false, true);
      }
    } else this.numberTimer = 0;
  }
}
