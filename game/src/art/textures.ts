import type Phaser from 'phaser';
import { PLAYER_RADIUS } from '../config';
import { FRAME } from '../content/bosses/frame';
import { GRID } from '../content/bosses/grid';
import { PALETTE_BOSS } from '../content/bosses/palette';
import { ENEMIES } from '../content/enemies';
import { PALETTE } from '../content/palette';
import type { EnemyDef, WeaponDef } from '../content/types';
import { WEAPONS } from '../content/weapons';
import { drawBar, drawShape, SHADOW_OFFSET } from './shapes';

/**
 * All art is procedural: every texture is drawn here once at boot (BootScene).
 * House style (Bauhaus flat): flat primary colors, ink outlines, a hard offset
 * shadow, on warm paper. No gradients, no glow, no additive blending.
 * To give something a new look, add a draw function and a key, never image files.
 */
export const TEX = {
  /** White circle outline; tint it. Used for impact rings. */
  ring: 'ring',
  /** Thin white ring at radius 160 in a 320x320 texture; tint it. The Platen's slam telegraph and ripple. */
  ringWide: 'ringWide',
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
  /** XP pickup, gilt variant: ink fill with yellow outline + center dot, worth 3× XP. */
  shardGilt: 'shardGilt',
  /** Enemy ink point (Sentry). */
  enemyShot: 'enemyShot',
  /** Orbit weapon circle. */
  orbit: 'orbit',
  /** Small red square; the badge riding on an elite's ring. */
  badge: 'badge',
  floor: 'floor',
  /** The Frame boss: the ink square outline. */
  bossFrame: 'bossFrame',
  /** The Frame boss: the red square core. */
  bossCore: 'bossCore',
  /** The Grid boss: the ink compass disc. */
  bossGrid: 'bossGrid',
  /** The Grid boss: the red circle core. */
  bossGridCore: 'bossGridCore',
  /** The Grid boss: one sweeping ink bar, centered so it spans two opposite arms. */
  bossGridArm: 'bossGridArm',
  /** Small red ×; the platemark printed on the paper where the player takes a hit. */
  platemark: 'platemark',
  /** Flat pale blue puddle (128 px = 120 u across); the Wash wets the paper with these. No shadow: it is wet, not paper. */
  puddle: 'puddle',
} as const;

export const enemyTextureKey = (enemyId: string): string => `enemy:${enemyId}`;
export const projectileTextureKey = (weaponId: string): string => `projectile:${weaponId}`;
/** The Palette's swatch tile textures, one per dock position. */
export const paletteSwatchTextureKey = (i: number): string => `bossPaletteSwatch${i}`;

/** Padding around shapes inside their texture (outline + shadow). */
const PAD = SHADOW_OFFSET + 3;

export function generateTextures(scene: Phaser.Scene): void {
  graphicsTexture(scene, TEX.ring, 64, 64, (g) => {
    g.lineStyle(5, 0xffffff, 1);
    g.strokeCircle(32, 32, 28);
  });
  graphicsTexture(scene, TEX.ringWide, 320, 320, (g) => {
    g.lineStyle(3, 0xffffff, 1);
    g.strokeCircle(160, 160, 160);
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
  graphicsTexture(scene, TEX.shardGilt, 18, 18, (g) => {
    drawShape(g, 'diamond', 8, 8, 7, PALETTE.ink, { outline: PALETTE.yellow, outlineWidth: 2, shadow: true });
    drawShape(g, 'circle', 8, 8, 2.8, PALETTE.yellow, { outlineWidth: 1.5, shadow: false }); // dot = 40% of body radius 7
  });
  drawFloor(scene);
  for (const enemy of ENEMIES) drawEnemy(scene, enemy);
  drawBoss(scene);
  drawBossGrid(scene);
  drawBossPalette(scene);
  graphicsTexture(scene, TEX.enemyShot, 24, 24, (g) => drawShape(g, 'circle', 10.5, 10.5, 6, PALETTE.ink, { outlineWidth: 0 }));
  graphicsTexture(scene, TEX.badge, 28, 28, (g) => drawShape(g, 'square', 12.5, 12.5, 8, PALETTE.red, { outlineWidth: 2 }));
  graphicsTexture(scene, TEX.platemark, 22, 22, (g) => {
    g.lineStyle(3, PALETTE.red, 1);
    g.lineBetween(3, 3, 19, 19);
    g.lineBetween(3, 19, 19, 3);
  });
  // Raw fill/stroke, not drawShape: drawShape forces alpha 1 and the paper-cut shadow, and a wet patch is neither.
  // 128 px = 128 u, so the 2 px line is a 2 u ink outline and the 60 u radius is 120 u across.
  graphicsTexture(scene, TEX.puddle, 128, 128, (g) => {
    g.fillStyle(PALETTE.blue, 0.25);
    g.fillCircle(64, 64, 60);
    g.lineStyle(2, PALETTE.ink, 1);
    g.strokeCircle(64, 64, 60);
  });
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
    if (look.bar) drawBar(g, c, c, look.bar.length, look.bar.thickness, look.body, { outlineWidth: look.outlineWidth });
    else drawShape(g, look.shape, c, c, look.radius, look.body, { points: look.points, outlineWidth: look.outlineWidth });
    const eyeR = look.bar ? Math.max(2.5, look.bar.thickness * 0.22) : Math.max(2.5, look.radius * 0.22);
    drawShape(g, 'circle', c, c, eyeR, look.accent, { outlineWidth: look.accent === PALETTE.ink ? 0 : 1.5, shadow: false });
  });
}

/** The Frame boss: an ink square outline with a paper-cut shadow, plus its red core. */
function drawBoss(scene: Phaser.Scene): void {
  const s = FRAME.frameSize;
  const t = FRAME.frameThickness;
  const size = s + t + SHADOW_OFFSET * 2;
  const c = size / 2;
  graphicsTexture(scene, TEX.bossFrame, size, size, (g) => {
    g.lineStyle(t, PALETTE.ink, 0.18);
    g.strokeRect(c - s / 2 + SHADOW_OFFSET, c - s / 2 + SHADOW_OFFSET, s, s);
    g.lineStyle(t, PALETTE.ink, 1);
    g.strokeRect(c - s / 2, c - s / 2, s, s);
  });
  const r = FRAME.coreSize / Math.SQRT2;
  const coreSize = Math.ceil((r + PAD) * 2);
  const coreC = coreSize / 2 - SHADOW_OFFSET / 2;
  graphicsTexture(scene, TEX.bossCore, coreSize, coreSize, (g) => {
    drawShape(g, 'square', coreC, coreC, r, FRAME.look.core, { outlineWidth: 3 });
  });
}

/** The Grid boss: a paper-cut ink compass disc, its red circle core, and one arm bar (two opposite arms). */
function drawBossGrid(scene: Phaser.Scene): void {
  const r = GRID.bodyRadius;
  const size = (r + PAD) * 2;
  const c = size / 2 - SHADOW_OFFSET / 2;
  graphicsTexture(scene, TEX.bossGrid, size, size, (g) => {
    g.fillStyle(PALETTE.ink, 0.18);
    g.fillCircle(c + SHADOW_OFFSET, c + SHADOW_OFFSET, r);
    g.fillStyle(GRID.look.body, 1);
    g.fillCircle(c, c, r);
    g.lineStyle(8, PALETTE.ink, 1);
    g.strokeCircle(c, c, r - 4);
    g.lineStyle(6, PALETTE.ink, 1);
    g.lineBetween(c - 30, c, c + 30, c);
    g.lineBetween(c, c - 30, c, c + 30);
    g.lineStyle(4, PALETTE.ink, 1);
    g.lineBetween(c + (r - 4), c, c + (r - 14), c);
    g.lineBetween(c - (r - 4), c, c - (r - 14), c);
    g.lineBetween(c, c + (r - 4), c, c + (r - 14));
    g.lineBetween(c, c - (r - 4), c, c - (r - 14));
  });
  const coreR = GRID.coreSize / 2;
  const coreSize = Math.ceil((coreR + PAD) * 2);
  const coreC = coreSize / 2 - SHADOW_OFFSET / 2;
  graphicsTexture(scene, TEX.bossGridCore, coreSize, coreSize, (g) => {
    drawShape(g, 'circle', coreC, coreC, coreR, GRID.look.core, { outlineWidth: 2 });
  });
  const armW = GRID.armLength * 2 + PAD * 2;
  const armH = GRID.armThickness + PAD * 2;
  graphicsTexture(scene, TEX.bossGridArm, armW, armH, (g) => {
    g.fillStyle(PALETTE.ink, 0.18);
    g.fillRect(PAD + SHADOW_OFFSET, PAD + SHADOW_OFFSET, GRID.armLength * 2, GRID.armThickness);
    g.fillStyle(PALETTE.ink, 1);
    g.fillRect(PAD, PAD, GRID.armLength * 2, GRID.armThickness);
  });
}

/** The Palette boss: five flat color tiles (2:1, the rect language), one texture per swatch. */
function drawBossPalette(scene: Phaser.Scene): void {
  const w = PALETTE_BOSS.swatchWidth;
  const h = PALETTE_BOSS.swatchHeight;
  for (let i = 0; i < PALETTE_BOSS.swatchColors.length; i++) {
    const color = PALETTE_BOSS.swatchColors[i]!;
    graphicsTexture(scene, paletteSwatchTextureKey(i), w + PAD * 2, h + PAD * 2, (g) => {
      drawShape(g, 'rect', PAD + w / 2, PAD + h / 2, w / 2, color, { outlineWidth: 3 });
    });
  }
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
