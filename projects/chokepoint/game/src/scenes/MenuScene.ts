import Phaser from 'phaser';
import { AUGMENTS } from '../content/augments';
import { cssColor, PALETTE } from '../content/palette';
import { loadProfile } from '../core/profile';
import { clearSavedRun, loadSavedRun } from '../core/saveRun';
import { nodeInReach } from '../core/tech';
import { MENU_ROAD_SIZE } from '../art/menu';
import { artScale, augmentTexture } from '../art/textures';
import { flags } from '../debug/flags';
import { boardsOn } from '../net/boards';
import { hook } from '../debug/testHook';
import { makeButton, type Button } from '../ui/button';
import { addUpdateNotice } from '../ui/updateNotice';
import { uiCamera, viewSize } from '../ui/display';
import { textStyle, titleStyle } from '../ui/text';
import { onKey, onResize, SCENES } from './keys';
import { MenuDemo } from './menu/MenuDemo';
import { buildProfileCard, PROFILE_CARD_W } from './menu/ProfileCard';

const MARGIN = 16;
const GAP = 28;
const CAPTION_GAP = 8;
const BUTTON_H = 60;

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
  private titleBox!: Phaser.GameObjects.Container;
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
    // A new run abandons a saved one for nothing.
    const play = (): void => {
      clearSavedRun(window.localStorage);
      this.scene.start(SCENES.game);
    };

    this.drifters = AUGMENTS.flatMap((a, i) =>
      [0, 1].map((j) => ({
        img: artScale(this.add.image(Math.random() * 1600, Math.random() * 1000, augmentTexture(a.id)), 2.4 + ((i + j) % 3) * 0.8).setAlpha(0.13),
        vx: (8 + Math.random() * 10) * (j === 0 ? 1 : -1),
        vy: -4 + Math.random() * 8,
      })),
    );
    const p = loadProfile(window.localStorage);
    this.demo = new MenuDemo(this, p.bestWave);
    this.title = this.add.text(0, 0, 'Chokepoint', titleStyle(60)).setOrigin(0.5);
    // A wrapper so the layout scale and the drop-in tween never fight over the same object.
    this.titleBox = this.add.container(0, 0, [this.title]);
    const how = this.add
      .text(0, 0, 'Build towers beside the road.\nCombine augments into new kinds of tower.\nHold as many waves as you can.', textStyle(18, PALETTE.muted, { align: 'center', lineSpacing: 6 }))
      .setOrigin(0.5);
    const card = buildProfileCard(this, p);
    const button = makeButton(this, 0, 0, 'Play', play, { width: 200, height: 60, fontSize: 24, radius: 30, fill: PALETTE.ink });
    const playBox = this.add.container(0, 0, [button.container]);
    const savedRun = loadSavedRun(window.localStorage);
    let resume: Button | undefined;
    if (savedRun) {
      resume = makeButton(
        this,
        0,
        0,
        `Resume · Wave ${savedRun.phase === 'build' ? savedRun.wave + 1 : savedRun.wave}`,
        () => {
          this.registry.set('resumeRun', savedRun);
          this.scene.start(SCENES.game);
        },
        { width: 220, height: 60, fontSize: 24, radius: 30, fill: PALETTE.ink },
      );
    }
    let ghost: Button | undefined;
    let ghostLine: Phaser.GameObjects.Text | undefined;
    if (p.bestSeed !== null) {
      const seed = p.bestSeed;
      ghost = makeButton(this, 0, 0, `Ghost · Wave ${p.bestWave}`, () => {
        clearSavedRun(window.localStorage); // a new run abandons a saved one for nothing
        this.registry.set('ghostSeed', seed);
        this.scene.start(SCENES.game);
      }, { width: 220, height: 60, fontSize: 24, radius: 30 }); // Resume's shape, white card: no fill
      ghostLine = this.add.text(0, 0, 'the board of your best run', textStyle(14, PALETTE.muted)).setOrigin(0.5);
    }
    const tech = makeButton(this, 0, 0, 'Tech', () => {
      this.scene.launch(SCENES.tech);
      this.scene.pause();
    }, { width: 220, height: 60, fontSize: 24, radius: 30 });
    const dot = this.add.circle(98, -18, 3, PALETTE.yellow).setVisible(nodeInReach(p.purchased, p.coins)); // top-right corner, while a node is in reach
    tech.container.add(dot);
    const techLine = this.add.text(0, 0, 'spend your coins', textStyle(14, PALETTE.muted)).setOrigin(0.5);
    const augments = makeButton(this, 0, 0, 'Augments', () => {
      this.scene.launch(SCENES.codex);
      this.scene.pause();
    }, { width: 220, height: 60, fontSize: 24, radius: 30 });
    // The leaderboards (scenes/BoardsScene.ts), only when the build has a server for them.
    const boards = boardsOn()
      ? makeButton(this, 0, 0, 'Boards', () => {
          this.scene.launch(SCENES.boards);
          this.scene.pause();
        }, { width: 220, height: 60, fontSize: 24, radius: 30 })
      : undefined;
    const hint = this.add.text(0, 0, 'Enter or Space', textStyle(14, PALETTE.faint)).setOrigin(0.5);

    // Entrances: the title drops in with a bounce, the rest fades up after it; Play breathes.
    this.title.setAlpha(0).setScale(0.6);
    this.tweens.add({ targets: this.title, alpha: 1, scale: 1, duration: 650, ease: 'Back.easeOut' });
    const fadeIn: (Phaser.GameObjects.Container | Phaser.GameObjects.Text)[] = [card.container, how];
    if (resume) fadeIn.push(resume.container);
    fadeIn.push(playBox);
    fadeIn.push(tech.container);
    fadeIn.push(techLine);
    fadeIn.push(augments.container);
    if (boards) fadeIn.push(boards.container);
    if (ghost && ghostLine) {
      fadeIn.push(ghost.container);
      fadeIn.push(ghostLine);
    }
    fadeIn.push(hint);
    for (const [i, obj] of fadeIn.entries()) {
      obj.setAlpha(0);
      this.tweens.add({ targets: obj, alpha: 1, duration: 400, delay: 350 + i * 120 });
    }
    this.tweens.add({ targets: button.container, scale: 1.05, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 900 });

    const title = this.title;
    const layout = (width: number, height: number): void => {
      const cx = width / 2;
      const avail = height - MARGIN * 2;
      const cardScale = Math.min(1, (width - 32) / PROFILE_CARD_W);
      const textScale = Math.min(1, (width - 32) / 420);
      const cardH = card.height * cardScale;
      const howH = how.height * textScale;
      // The column below the road, at full size: each part's height plus the gap that follows it.
      // The gap between the road and the column counts for the fit, too.
      let below = GAP + title.height + GAP + cardH + GAP + howH + GAP;
      if (resume) below += BUTTON_H + GAP;
      below += BUTTON_H + GAP + BUTTON_H + CAPTION_GAP + techLine.height + GAP + BUTTON_H;
      if (boards) below += GAP + BUTTON_H;
      if (ghost && ghostLine) below += GAP + BUTTON_H + CAPTION_GAP + ghostLine.height + GAP;
      below += (ghost && ghostLine ? 0 : GAP) + hint.height; // the gap above the hint (the ghost's line adds its own)
      const kMax = Math.min(1.4, (width - 24) / MENU_ROAD_SIZE.width);
      const kMin = 0.35;
      const room = avail - below;
      let k: number;
      let s = 1;
      if (room >= MENU_ROAD_SIZE.height * kMax) k = kMax;
      else if (room >= MENU_ROAD_SIZE.height * kMin) k = room / MENU_ROAD_SIZE.height;
      else {
        // The road is at its smallest and the column still does not fit: scale the whole column.
        k = kMin;
        s = Math.min(1, avail / (below + MENU_ROAD_SIZE.height * kMin));
      }
      const block = below + MENU_ROAD_SIZE.height * k;
      const top = MARGIN + Math.max(0, (avail - block) / 2);
      this.demo.layout(cx, top, k * s);
      let y = top + MENU_ROAD_SIZE.height * k * s + GAP * s;
      const put = (h: number): number => {
        const c = y + (h * s) / 2;
        y += h * s;
        return c;
      };
      const gap = (g: number): void => {
        y += g * s;
      };
      this.titleBox.setScale(s);
      this.titleY = put(title.height);
      this.titleBox.setPosition(cx, this.titleY);
      gap(GAP);
      card.container.setScale(cardScale * s);
      card.container.setPosition(cx, put(cardH));
      gap(GAP);
      how.setScale(textScale * s);
      how.setPosition(cx, put(howH));
      gap(GAP);
      if (resume) {
        resume.container.setScale(s);
        resume.container.setPosition(cx, put(BUTTON_H));
        gap(GAP);
      }
      playBox.setScale(s);
      playBox.setPosition(cx, put(BUTTON_H));
      gap(GAP);
      tech.container.setScale(s);
      tech.container.setPosition(cx, put(BUTTON_H));
      gap(CAPTION_GAP);
      techLine.setScale(s);
      techLine.setPosition(cx, put(techLine.height));
      gap(GAP);
      augments.container.setScale(s);
      augments.container.setPosition(cx, put(BUTTON_H));
      if (boards) {
        gap(GAP);
        boards.container.setScale(s);
        boards.container.setPosition(cx, put(BUTTON_H));
      }
      if (ghost && ghostLine) {
        gap(GAP);
        ghost.container.setScale(s);
        ghost.container.setPosition(cx, put(BUTTON_H));
        gap(CAPTION_GAP);
        ghostLine.setScale(s);
        ghostLine.setPosition(cx, put(ghostLine.height));
      }
      gap(GAP);
      hint.setScale(s);
      hint.setPosition(cx, put(hint.height));
    };
    layout(viewSize(this).width, viewSize(this).height);
    onResize(this, layout);
    addUpdateNotice(this);
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
    if (this.title.scale >= 0.999) this.titleBox.setY(this.titleY + Math.sin(this.clock * 1.6) * 3);
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
