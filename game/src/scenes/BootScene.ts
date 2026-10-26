import Phaser from 'phaser';
import { generateTextures } from '../art/textures';
import { flags } from '../debug/flags';
import { hook } from '../debug/testHook';
import { SCENES } from './keys';

/** Generates all procedural textures, then hands off to the menu (or straight into a run). */
export class BootScene extends Phaser.Scene {
  constructor() {
    super(SCENES.boot);
  }

  create(): void {
    hook.scene = SCENES.boot;
    generateTextures(this);
    hook.ready = true;
    this.scene.start(flags.skipMenu ? SCENES.game : SCENES.menu);
  }
}
