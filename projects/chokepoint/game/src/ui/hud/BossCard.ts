import type Phaser from 'phaser';
import { CELL, HUD } from '../../config';
import { artScale, enemyTexture } from '../../art/textures';
import type { Enemy } from '../../entities/Enemy';
import { PALETTE } from '../../content/palette';
import { mendsDue } from '../../core/mendClock';
import { bossId } from '../../core/waves';
import type { GameScene } from '../../scenes/GameScene';
import { makeCard } from '../card';
import { textStyle } from '../text';
import { isNarrow, type HudPart } from './hud';

const BAR_W = 160;
const BAR_H = 6;
const PAD = 12;
const H = 54;

/**
 * Top center, pinned below where the banner rests: while the run's boss — the enemy its wave's plan
 * declares (core/waves.ts): the Colossus, the Titan on wave 20, the Orb on wave 30 — is alive, its
 * ~16 px token, its name in bold ink, and its live hp on a thin bar: its own color over a
 * ~20%-alpha muted-ink track, with one 2 px ink notch at def.outOfReach.hpFrac, where it first goes
 * out of reach (the Colossus only: the notch renders only for a boss with a timed phase). Pops in
 * (~200 ms scale-in) the moment it spawns and fades out (~200 ms) the moment it dies or leaks; no
 * card on non-boss waves. For a boss with a mend clock (the Mender) the hp row also wears one
 * small pip in muted ink per mend remaining, under the bar: a pip fades as each mend is used (the
 * bar alone can't show it — a mended bar looks like a fresh one), derived from the same pure
 * clock (core/mendClock.ts). Blocks nothing, takes no input; the wave banner still slides above it.
 * The token and bar dim to the board token's alpha (boss.alpha) for the untargetable leg, lockstep
 * through 2× fast-forward — never timed here; the name stays full alpha.
 */
export class BossCard implements HudPart {
  private readonly scene: Phaser.Scene;
  private box: Phaser.GameObjects.Container | undefined;
  private token: Phaser.GameObjects.Image | undefined;
  private bar: Phaser.GameObjects.Graphics | undefined;
  private pips: Phaser.GameObjects.Graphics | undefined;
  private width = 0;
  private fading = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  layout(width: number): void {
    this.width = width;
    if (this.box) this.place();
  }

  update(game: GameScene): void {
    const bossDef = bossId(game.run.wave); // the enemy this wave's plan declares as its boss
    const boss = bossDef !== undefined ? game.enemies.all.find((e) => e.active && e.def.id === bossDef) : undefined;
    if (!boss) {
      this.fadeOut();
      return;
    }
    if (this.fading) return; // the old card is still fading out; the next frame rebuilds for this boss
    if (!this.box) {
      this.box = this.build(boss);
      this.place();
      const box = this.box;
      box.setScale(0.4); // pop in like a preview card does
      this.scene.tweens.add({ targets: box, scale: 1, duration: 200, ease: 'Back.easeOut' });
    }
    this.refresh(boss);
  }

  /** Centered, below the banner's resting place: clear of the stats card (left) and the wave card and pause button (right). */
  private place(): void {
    this.box?.setPosition(this.width / 2, (isNarrow(this.width) ? HUD.top + 24 : 12) + 48 + 8 + H / 2);
  }

  /** The bar redrawn every frame: track, the boss's own color fill at its live hp, and the notch. Token and bar
   *  dim with boss.alpha for the untargetable leg; the name stays full alpha. */
  private refresh(boss: Enemy): void {
    if (this.token) this.token.setAlpha(boss.alpha);
    const g = this.bar;
    if (!g) return;
    g.clear();
    g.fillStyle(PALETTE.muted, 0.2);
    g.fillRoundedRect(-BAR_W / 2, -BAR_H / 2, BAR_W, BAR_H, BAR_H / 2); // track
    const frac = Math.min(1, Math.max(0, boss.hp / boss.maxHp));
    if (frac > 0.001) {
      g.fillStyle(PALETTE[boss.def.look.color], 1);
      g.fillRoundedRect(-BAR_W / 2, -BAR_H / 2, BAR_W * frac, BAR_H, Math.min(BAR_H / 2, (BAR_W * frac) / 2)); // fill
    }
    if (boss.def.outOfReach !== undefined) {
      const off = boss.def.outOfReach.hpFrac;
      g.fillStyle(PALETTE.ink, 1);
      g.fillRect(-BAR_W / 2 + BAR_W * off - 1, -4, 2, 8); // the notch where it first goes out of reach
    }
    g.setAlpha(boss.alpha);
    const pips = this.pips;
    const mends = boss.def.mends;
    if (pips !== undefined && mends !== undefined) {
      pips.clear();
      const used = mendsDue(boss.age, mends);
      for (let i = 0; i < mends.count; i++) {
        pips.fillStyle(PALETTE.muted, i < mends.count - used ? 0.9 : 0.18);
        pips.fillCircle((i - (mends.count - 1) / 2) * 10, 0, 3); // one pip per mend remaining: full until it is spent
      }
    }
    const feeds = boss.def.feeds;
    if (pips !== undefined && feeds !== undefined) {
      pips.clear();
      for (let i = 0; i < feeds.max; i++) {
        pips.fillStyle(PALETTE.muted, i < feeds.max - boss.feedsUsed ? 0.9 : 0.18);
        pips.fillCircle((i - (feeds.max - 1) / 2) * 10, 0, 3); // one pip per feed remaining: full until it is spent
      }
    }
  }

  private build(boss: Enemy): Phaser.GameObjects.Container {
    const scene = this.scene;
    const name = scene.add.text(0, 0, boss.def.name, textStyle(14, PALETTE.ink, { fontStyle: 'bold' })).setOrigin(0, 0.5);
    const w = Math.max(BAR_W, 16 + 6 + name.width) + PAD * 2;
    const token = artScale(scene.add.image(0, 0, enemyTexture(boss.def.id)), 8 / (boss.def.look.size * CELL));
    const bar = scene.add.graphics();
    const card = makeCard(scene, 0, 0, w, H, 12);
    token.setPosition(-w / 2 + PAD + 8, -7);
    name.setPosition(-w / 2 + PAD + 22, -7);
    bar.setPosition(0, 12);
    this.token = token;
    this.bar = bar;
    const parts: Phaser.GameObjects.GameObject[] = [card, token, name, bar];
    if (boss.def.mends !== undefined || boss.def.feeds !== undefined) {
      const pips = scene.add.graphics().setPosition(0, 20); // under the bar, inside the card: one per mend or feed remaining
      this.pips = pips;
      parts.push(pips);
    }
    return scene.add.container(0, 0, parts);
  }

  private fadeOut(): void {
    if (this.fading || !this.box) return;
    const box = this.box;
    this.fading = true;
    this.scene.tweens.killTweensOf(box);
    this.scene.tweens.add({
      targets: box,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        box.destroy(true); // with children: token, name, bar and pips go with it
        this.box = undefined;
        this.token = undefined;
        this.bar = undefined;
        this.pips = undefined;
        this.fading = false;
      },
    });
  }
}
