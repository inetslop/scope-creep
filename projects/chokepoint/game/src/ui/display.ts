import type Phaser from 'phaser';
import { flags } from '../debug/flags';

/**
 * The game renders at the screen's pixel density, so it is sharp on phones and scaled desktops:
 * the canvas is sized in device pixels (main.ts) and every camera zooms by `display.ratio`.
 * All layout and input code works in CSS pixels: use viewSize() instead of scene.scale.width,
 * pointerCss() instead of pointer.x, and uiCamera() in every screen-space scene.
 */
export const display = { ratio: 1 };

/** At most this many canvas pixels, so a big fullscreen window stays fast. */
const MAX_PIXELS = 16_000_000;

/**
 * Canvas pixels per CSS pixel. At least 2 even on 1x screens: WebGL draws shapes without
 * antialiasing, so the game renders at twice the size and the browser scales it down, which
 * smooths every edge and all text (supersampling). Up to 3 on denser screens, within MAX_PIXELS.
 * The smoke test (?smoke) renders at 1: it checks the gameplay, and its browser draws in software.
 */
export function pixelRatio(cssWidth: number, cssHeight: number): number {
  if (flags.smoke) return 1;
  const wanted = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  const budget = Math.sqrt(MAX_PIXELS / Math.max(1, cssWidth * cssHeight));
  return Math.max(1, Math.min(wanted, budget));
}

/** The screen in CSS pixels. */
export function viewSize(scene: Phaser.Scene): { width: number; height: number } {
  return { width: scene.scale.width / display.ratio, height: scene.scale.height / display.ratio };
}

/** A pointer's screen position in CSS pixels. */
export function pointerCss(p: Phaser.Input.Pointer): { x: number; y: number } {
  return { x: p.x / display.ratio, y: p.y / display.ratio };
}

/** Makes a screen-space scene's camera draw in CSS pixels, now and after every resize. */
export function uiCamera(scene: Phaser.Scene): void {
  const apply = (): void => {
    scene.cameras.main.setOrigin(0, 0).setZoom(display.ratio);
  };
  apply();
  scene.scale.on('resize', apply);
  scene.events.once('shutdown', () => scene.scale.off('resize', apply));
}
