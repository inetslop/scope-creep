import Phaser from 'phaser';
import { AUGMENTS } from '../content/augments';
import { cssColor, PALETTE } from '../content/palette';
import { loadProfile } from '../core/profile';
import { MENU_ROAD_SIZE } from '../art/menu';
import { artScale, augmentTexture } from '../art/textures';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { makeButton } from '../ui/button';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { onKey, onResize, SCENES } from './keys';
import { MenuDemo } from './menu/MenuDemo';

/** A faint augment shape drifting across the background. */
interface Drifter {
  img: Phaser.GameObjects.Image;
  vx: number;
  vy: number;
}

/**
 * The title screen: a live little demo of the game (scenes/menu/MenuDemo.ts), the title, how to
 * play, the best run, and Play. Faint shapes drift behind it all.
 */
export class MenuScene extends Phaser.Scene {
  private demo!: MenuDemo;
  private title!: Phaser.GameObjects.Text;
  private titleY = 0;
  private drifters: Drifter[] = [];
  private clock = 0;

  constructor() {
    super(SCENES.menu);
  }

  create(): void {
    uiCamera(this);
    hook.scene = SCENES.menu;
    hook.overlay = '';
    this.clock = 0;
    this.cameras.main.setBackgroundColor(cssColor(PALETTE.ground));
    const play = (): void => {
      this.scene.start(SCENES.game);
    };

    this.drifters = AUGMENTS.flatMap((a, i) =>
      [0, 1].map((j) => ({
        img: artScale(this.add.image(Math.random() * 1600, Math.random() * 1000, augmentTexture(a.id)), 2.4 + ((i + j) % 3) * 0.8).setAlpha(0.13),
        vx: (8 + Math.random() * 10) * (j === 0 ? 1 : -1),
        vy: -4 + Math.random() * 8,
      })),
    );
    this.demo = new MenuDemo(this);

    const p = loadProfile(window.localStorage);
    this.title = this.add.text(0, 0, 'Chokepoint', titleStyle(60)).setOrigin(0.5);
    const how = this.add
      .text(0, 0, 'Build towers beside the road.\nCombine augments into new kinds of tower.\nHold as many waves as you can.', textStyle(18, PALETTE.muted, { align: 'center', lineSpacing: 6 }))
      .setOrigin(0.5);
    const bestLine = [p.bestWave > 0 ? `Best: wave ${p.bestWave}` : '', p.runsPlayed > 0 ? `${p.runsPlayed} runs` : ''].filter(Boolean).join(' · ');
    const bestText = this.add.text(0, 0, bestLine, textStyle(16, PALETTE.muted, { fontStyle: 'bold' })).setOrigin(0.5);
    const button = makeButton(this, 0, 0, 'Play', play, { width: 200, height: 60, fontSize: 24, radius: 30, fill: PALETTE.ink });
    const hint = this.add.text(0, 0, 'Enter or Space', textStyle(14, PALETTE.faint)).setOrigin(0.5);

    // Entrances: the title drops in with a bounce, the rest fades up after it; Play breathes.
    this.title.setAlpha(0).setScale(0.6);
    this.tweens.add({ targets: this.title, alpha: 1, scale: 1, duration: 650, ease: 'Back.easeOut' });
    for (const [i, obj] of [how, button.container, hint, bestText].entries()) {
      obj.setAlpha(0);
      this.tweens.add({ targets: obj, alpha: 1, duration: 400, delay: 350 + i * 120 });
    }
    this.tweens.add({ targets: button.container, scale: 1.05, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 900 });

    const layout = (width: number, height: number): void => {
      const cx = width / 2;
      const k = Math.min(1.4, (width - 24) / MENU_ROAD_SIZE.width);
      const block = MENU_ROAD_SIZE.height * k + 330;
      const top = Math.max(16, (height - block) / 2);
      this.demo.layout(cx, top, k);
      const y = top + MENU_ROAD_SIZE.height * k + 40;
      const textScale = Math.min(1, (width - 32) / 420);
      this.titleY = y;
      this.title.setPosition(cx, y);
      how.setPosition(cx, y + 78).setScale(textScale);
      button.container.setPosition(cx, y + 172);
      hint.setPosition(cx, y + 218);
      bestText.setPosition(cx, y + 250);
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    onKey(this, (e) => {
      if (e.key === 'Enter' || e.key === ' ') play();
    });
    if (flags.smoke) this.time.delayedCall(500, play);
  }

  update(_time: number, deltaMs: number): void {
    const dt = Math.min(deltaMs / 1000, 0.05);
    this.clock += dt;
    this.demo.update(dt);
    // The title bobs gently once it has landed.
    if (this.title.scale >= 0.999) this.title.setY(this.titleY + Math.sin(this.clock * 1.6) * 3);
    const { width, height } = viewSize(this);
    for (const d of this.drifters) {
      d.img.x += d.vx * dt;
      d.img.y += d.vy * dt;
      if (d.img.x > width + 80) d.img.x = -80;
      if (d.img.x < -80) d.img.x = width + 80;
      if (d.img.y > height + 80) d.img.y = -80;
      if (d.img.y < -80) d.img.y = height + 80;
    }
  }
}
