import type Phaser from 'phaser';
import { PLAYER_RADIUS } from '../config';
import { ENEMIES } from '../content/enemies';
import { PALETTE } from '../content/palette';
import type { EnemyDef, WeaponDef } from '../content/types';
import { WEAPONS } from '../content/weapons';
import { drawShape, SHADOW_OFFSET } from './shapes';

/**
 * All art is procedural: every texture is drawn here once at boot (BootScene).
 * House style (Bauhaus flat): flat primary colors, ink outlines, a hard offset
 * shadow, on warm paper. No gradients, no glow, no additive blending.
 * To give something a new look, add a draw function and a key, never image files.
 */
export const TEX = {
  /** White circle outline; tint it. Used for impact rings. */
  ring: 'ring',
  /** Small white dot; tint it. Sparks and trails. */
  dot: 'dot',
  /** Small white triangle; tint it. Debris when something is destroyed. */
  fragment: 'fragment',
  player: 'player',
  /** The player in red, shown for a moment after a hit. */
  playerHurt: 'playerHurt',
  barrel: 'barrel',
  /** XP pickup. */
  shard: 'shard',
  /** Enemy ink point (Sentry). */
  enemyShot: 'enemyShot',
  /** Orbit weapon circle. */
  orbit: 'orbit',
  floor: 'floor',
} as const;

export const enemyTextureKey = (enemyId: string): string => `enemy:${enemyId}`;
export const projectileTextureKey = (weaponId: string): string => `projectile:${weaponId}`;

/** Padding around shapes inside their texture (outline + shadow). */
const PAD = SHADOW_OFFSET + 3;

export function generateTextures(scene: Phaser.Scene): void {
  graphicsTexture(scene, TEX.ring, 64, 64, (g) => {
    g.lineStyle(5, 0xffffff, 1);
    g.strokeCircle(32, 32, 28);
  });
  graphicsTexture(scene, TEX.dot, 8, 8, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillCircle(4, 4, 4);
  });
  graphicsTexture(scene, TEX.fragment, 10, 10, (g) => {
    g.fillStyle(0xffffff, 1);
    g.fillTriangle(0, 10, 5, 0, 10, 10);
  });
  drawPlayer(scene);
  graphicsTexture(scene, TEX.barrel, 34, 10, (g) => {
    g.fillStyle(PALETTE.ink, 1);
    g.fillRoundedRect(0, 1, 34, 8, 3);
  });
  graphicsTexture(scene, TEX.shard, 18, 18, (g) => drawShape(g, 'diamond', 8, 8, 7, PALETTE.yellow, { outlineWidth: 2, shadow: true }));
  drawFloor(scene);
  for (const enemy of ENEMIES) drawEnemy(scene, enemy);
  graphicsTexture(scene, TEX.enemyShot, 24, 24, (g) => drawShape(g, 'circle', 10.5, 10.5, 6, PALETTE.ink, { outlineWidth: 0 }));
  for (const weapon of WEAPONS) {
    if (weapon.orbit) drawOrbit(scene, weapon);
    else drawProjectile(scene, weapon);
  }
}

function graphicsTexture(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void): void {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

function drawPlayer(scene: Phaser.Scene): void {
  const size = 64;
  const c = size / 2 - SHADOW_OFFSET / 2;
  for (const [key, body] of [
    [TEX.player, PALETTE.blue],
    [TEX.playerHurt, PALETTE.red],
  ] as const) {
    graphicsTexture(scene, key, size, size, (g) => {
      drawShape(g, 'circle', c, c, PLAYER_RADIUS + 2, body, { outlineWidth: 3 });
      drawShape(g, 'circle', c, c, 7, PALETTE.yellow, { outlineWidth: 2, shadow: false });
    });
  }
}

/** Graph paper: faint lines every 32 units, a stronger line every 128. */
function drawFloor(scene: Phaser.Scene): void {
  const s = 128;
  graphicsTexture(scene, TEX.floor, s, s, (g) => {
    g.fillStyle(PALETTE.paper, 1);
    g.fillRect(0, 0, s, s);
    g.lineStyle(1, PALETTE.paperDark, 0.7);
    for (const p of [32, 64, 96]) {
      g.lineBetween(p, 0, p, s);
      g.lineBetween(0, p, s, p);
    }
    g.lineStyle(2, PALETTE.paperDark, 1);
    g.lineBetween(0, 0, s, 0);
    g.lineBetween(0, 0, 0, s);
  });
}

function drawEnemy(scene: Phaser.Scene, def: EnemyDef): void {
  const { look } = def;
  const size = Math.ceil((look.radius + PAD) * 2);
  const c = size / 2 - SHADOW_OFFSET / 2;
  graphicsTexture(scene, enemyTextureKey(def.id), size, size, (g) => {
    drawShape(g, look.shape, c, c, look.radius, look.body, { points: look.points });
    drawShape(g, 'circle', c, c, Math.max(2.5, look.radius * 0.22), look.accent, { outlineWidth: look.accent === PALETTE.ink ? 0 : 1.5, shadow: false });
  });
}

/** One orbit circle: a flat primary-color disc with ink outline and paper-cut shadow. */
function drawOrbit(scene: Phaser.Scene, def: WeaponDef): void {
  const r = def.orbit?.circleRadius ?? 8;
  const size = Math.ceil((r + PAD) * 2);
  const c = size / 2 - SHADOW_OFFSET / 2;
  graphicsTexture(scene, TEX.orbit, size, size, (g) => drawShape(g, 'circle', c, c, r, def.look.color, { outlineWidth: 2 }));
}

function drawProjectile(scene: Phaser.Scene, def: WeaponDef): void {
  const { length, width, color } = def.look;
  const w = Math.ceil(length + 4);
  const h = Math.ceil(width + 4);
  graphicsTexture(scene, projectileTextureKey(def.id), w, h, (g) => {
    g.fillStyle(color, 1);
    g.fillRoundedRect(2, 2, length, width, width / 2);
    if (color !== PALETTE.ink) {
      g.lineStyle(1.5, PALETTE.ink, 1);
      g.strokeRoundedRect(2, 2, length, width, width / 2);
    }
  });
}
