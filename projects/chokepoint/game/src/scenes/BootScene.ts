import Phaser from 'phaser';
import { generateTextures } from '../art/generate';
import { Sfx } from '../audio/Sfx';
import { loadProfile } from '../core/profile';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { SCENES } from './keys';

/** Generates every texture, sets up shared services, then shows the menu (or starts a run). */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    hook.scene = SCENES.boot;
    generateTextures(this);
    const sfx = new Sfx();
    sfx.muted = !loadProfile(window.localStorage).sound;
    this.registry.set('sfx', sfx);
    // Browsers only allow audio after a user gesture: unlock on the first one.
    window.addEventListener('pointerdown', () => sfx.unlock(), { once: true });
    window.addEventListener('keydown', () => sfx.unlock(), { once: true });
    hook.ready = true;
    this.scene.start(flags.skipMenu ? SCENES.game : SCENES.menu);
  }
}
