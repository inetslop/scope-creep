import type Phaser from 'phaser';
import { CELL } from '../config';
import { AUGMENTS } from '../content/augments';
import { ENEMIES, getEnemy } from '../content/enemies';
import { deepOf, PALETTE, rgba, type Bright } from '../content/palette';
import type { Shape } from '../content/types';
import { paintBarrelMark } from './barrelMarks';
import { BOSS_MARKS, paintBossMark } from './bossMarks';
import { paintToken, roundRectPath, setShadow, shapePath } from './paint';
import { BOLT_TEXTURE, CHIP_TEXTURE, DISC_TEXTURE, EYE_TEXTURE, barrelMarkTexture, enemyTexture, LEECH_CLOSED_TEXTURE, markTexture, paintTexture, PLATE_TEXTURE, TOWER_BASE, TOWER_BODY, tokenDepth, tokenRoom, TRACER_TEXTURE, towerTexture } from './textures';

/** Enemies, tower plinths and bodies, bolts and chips: everything that stands or flies on the board. */
export function paintEntityTextures(scene: Phaser.Scene): void {
  for (const e of ENEMIES) {
    const r = e.look.size * CELL;
    const depth = tokenDepth(r);
    const size = tokenRoom(r, depth) * 2;
    paintTexture(scene, enemyTexture(e.id), size, size, (ctx) => {
      if (e.behavior === 'fly') {
        // The boss Flyer's triangle: flat (no side face, no shadow), so the token may turn with its flight.
        shapePath(ctx, e.look.shape, size / 2, size / 2, r);
        ctx.fillStyle = rgba(PALETTE[e.look.color], 1);
        ctx.fill();
        return;
      }
      if (e.behavior === 'blink') {
        // The Blinker's almond: flat (no side face, no shadow), so the token may turn with its walk.
        shapePath(ctx, e.look.shape, size / 2, size / 2, r);
        ctx.fillStyle = rgba(PALETTE[e.look.color], 1);
        ctx.fill();
        return;
      }
      if (e.look.shape === 'wings') {
        // The Flyer's wings: flat (no side face, no shadow), so the token may turn with its flight.
        shapePath(ctx, 'wings', size / 2, size / 2, r);
        ctx.fillStyle = rgba(PALETTE[e.look.color], 1);
        ctx.fill();
        return;
      }
      paintToken(ctx, e.look.shape, size / 2, size / 2 - depth / 2, r, PALETTE[e.look.color], deepOf(e.look.color), { depth });
      if (e.id === 'hauler') {
        // The Hauler wears its coin: the HUD's own coin shape, flat on the face, a third of the width.
        shapePath(ctx, 'circle', size / 2, size / 2 - depth / 2, r / 3);
        ctx.fillStyle = rgba(PALETTE.yellow, 1);
        ctx.fill();
      }
      if (e.id === 'ward') {
        // The Ward's armor: one thin ring around its edge, in the side-face red. Still: painted into the
        // texture, never tweened or rotated (its side face and shadow must stay at the bottom).
        ctx.strokeStyle = rgba(deepOf(e.look.color), 1);
        ctx.lineWidth = Math.max(1, r * 0.16);
        ctx.beginPath();
        ctx.arc(size / 2, size / 2 - depth / 2, r * 0.88, 0, Math.PI * 2);
        ctx.stroke();
      }
    });
  }
  // The marks (the Patterns toggle, off by default): one small muted-ink shape per regular token,
  // per boss (art/bossMarks.ts) and per split child (its parent's mark at 60%), so the type reads
  // by shape alone. Separate textures, never painted into the token: the white hit flash tints the
  // token image only, so the mark stays visible (entities/Enemy.ts shows it); the spawn-only pieces
  // without one (the Titan's Guard escort) keep their plain look.
  for (const e of ENEMIES) {
    const parent = e.spawnOnly === undefined ? undefined : ENEMIES.find((d) => d.splitsInto === e.id || d.splitsAt?.into === e.id);
    if (e.spawnOnly !== undefined && BOSS_MARKS[e.id] === undefined && parent === undefined) continue; // the Titan's Guard escort stays plain
    const r = e.look.size * CELL;
    const depth = tokenDepth(r);
    const size = tokenRoom(r, depth) * 2;
    const cx = size / 2;
    const cy = size / 2 - depth / 2;
    paintTexture(scene, markTexture(e.id), size, size, (ctx) => {
      if (e.spawnOnly === undefined) paintTypeMark(ctx, e.id, cx, cy, r);
      else if (BOSS_MARKS[e.id] !== undefined) paintBossMark(ctx, e.id, cx, cy, r);
      else { // a split child: the parent's mark at 60% of its size (the painters scale linearly with the radius given)
        const pr = parent!.look.size * CELL;
        if (BOSS_MARKS[parent!.id] !== undefined) paintBossMark(ctx, parent!.id, cx, cy, pr * 0.6);
        else paintTypeMark(ctx, parent!.id, cx, cy, pr * 0.6);
      }
    });
  }
  // The barrel marks for a tower's first augment (the Patterns toggle): one small muted-ink
  // shape per first augment, shown on the barrel face (entities/Tower.ts toggles its visibility).
  // Painted here, like the enemy type marks; a barrel-less tower (a rally or beam first) paints
  // none, so the loop paints all 16 even though two firsts never wear one.
  const mr = TOWER_BODY * CELL;
  const markSize = mr * 0.6;
  for (const a of AUGMENTS) {
    paintTexture(scene, barrelMarkTexture(a.id), markSize, markSize, (ctx) => paintBarrelMark(ctx, a.id, markSize / 2, markSize / 2, mr));
  }
  const plinth = CELL * 0.4;
  const base = tokenRoom(plinth, 5) * 2;
  paintTexture(scene, TOWER_BASE, base, base, (ctx) => {
    paintToken(ctx, 'square', base / 2, base / 2 - 3, plinth, PALETTE.card, PALETTE.cardDeep, { depth: 5 });
  });
  const r = TOWER_BODY * CELL;
  const bodySize = tokenRoom(r * 1.2, r * 0.16, 0.5) * 2;
  paintTexture(scene, towerTexture(undefined), bodySize, bodySize, (ctx) => paintTowerBody(ctx, 'circle', undefined, bodySize / 2));
  for (const a of AUGMENTS) paintTexture(scene, towerTexture(a.id), bodySize, bodySize, (ctx) => paintTowerBody(ctx, a.look.shape, a.look.color, bodySize / 2));
  paintTexture(scene, BOLT_TEXTURE, 16, 16, (ctx) => {
    shapePath(ctx, 'circle', 8, 8, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
  // The tracer: a thin, long capsule pointing up from its center; the projectile rotates it to
  // where it flies. Tinted to the tower's color, so it is flat (no shading) and may rotate.
  paintTexture(scene, TRACER_TEXTURE, 4, 16, (ctx) => {
    roundRectPath(ctx, 0.25, 2, 3.5, 12, 1.75);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
  paintTexture(scene, CHIP_TEXTURE, 14, 14, (ctx) => {
    roundRectPath(ctx, 2, 2, 10, 10, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
  });
  // The Bulwark's plate: a flat arc across the front third of its face, in the side-face red. Flat
  // (no shading), so it may rotate: Enemy turns it to face the travel every frame.
  const bR = getEnemy('bulwark').look.size * CELL;
  const bDepth = tokenDepth(bR);
  const plateSize = tokenRoom(bR, bDepth) * 2;
  paintTexture(scene, PLATE_TEXTURE, plateSize, plateSize, (ctx) => {
    ctx.strokeStyle = rgba(deepOf('red'), 1);
    ctx.lineWidth = bR * 0.34;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(plateSize / 2, plateSize / 2 - bDepth / 2, bR * 0.72, -Math.PI / 2 - Math.PI / 3, -Math.PI / 2 + Math.PI / 3);
    ctx.stroke();
  });
  // The Guard's shield disc: one flat circle on its road-facing front, in the coin's orange
  // (the Hauler's coin language: the shield is visible on the enemy that carries it). Flat (no
  // shading), so it may rotate: Enemy turns it to face the travel every frame; it dies with the Guard.
  const gR = getEnemy('guard').look.size * CELL;
  const gDepth = tokenDepth(gR);
  const discSize = tokenRoom(gR, gDepth) * 2;
  paintTexture(scene, DISC_TEXTURE, discSize, discSize, (ctx) => {
    ctx.fillStyle = rgba(PALETTE.orange, 1);
    ctx.beginPath();
    ctx.arc(discSize / 2, discSize / 2 - gDepth / 2 - gR * 0.55, gR * 0.42, 0, Math.PI * 2);
    ctx.fill();
  });
  // The Leech with its maw closed: the same token as a plain circle, in its own size — swapped in
  // after its eight drinks (systems/enemyHooks/leechDrink.ts), so the swap is seamless.
  const lR = getEnemy('leech').look.size * CELL;
  const lDepth = tokenDepth(lR);
  const leechClosedSize = tokenRoom(lR, lDepth) * 2;
  paintTexture(scene, LEECH_CLOSED_TEXTURE, leechClosedSize, leechClosedSize, (ctx) => {
    paintToken(ctx, 'circle', leechClosedSize / 2, leechClosedSize / 2 - lDepth / 2, lR, PALETTE.pink, deepOf('pink'), { depth: lDepth });
  });
  // The Blinker's eye: one small flat white dot near the back of its face (Enemy slides it forward
  // through the telegraph). Flat (no shading), so it may turn with the token.
  const bkR = getEnemy('blinker').look.size * CELL;
  const eyeR = bkR * 0.14;
  paintTexture(scene, EYE_TEXTURE, eyeR * 2, eyeR * 2, (ctx) => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeR, eyeR, eyeR, 0, Math.PI * 2);
    ctx.fill();
  });
}

/**
 * The body of a tower, on its plinth: its first augment's shape and color (a grey circle while
 * empty). It never rotates (its side face must stay at the bottom); barrels turn under it.
 */
function paintTowerBody(ctx: CanvasRenderingContext2D, shape: Shape, color: Bright | undefined, c: number): void {
  const r = TOWER_BODY * CELL;
  const fill = color ? PALETTE[color] : PALETTE.faint;
  const deep = color ? deepOf(color) : PALETTE.rockDeep;
  ctx.save();
  setShadow(ctx, 0.5);
  shapePath(ctx, shape, c, c + r * 0.16, r);
  ctx.fillStyle = rgba(deep, 1);
  ctx.fill();
  ctx.restore();
  shapePath(ctx, shape, c, c, r);
  ctx.fillStyle = rgba(fill, 1);
  ctx.fill();
  // A small light dot: the eye of the tower (on the cap for a pillar).
  shapePath(ctx, 'circle', c, shape === 'pillar' ? c - r * 0.78 : c - r * 0.05, r * 0.2);
  ctx.fillStyle = rgba(PALETTE.card, 0.95);
  ctx.fill();
}

/**
 * A type mark on a regular token's face (the Patterns toggle): one muted-ink shape per type —
 * the shape is the information, so every mark is the same color, and no mark copies its own
 * token's shape. Centered at (cx, cy) (the face, raised by half the side-face depth) in
 * fractions of the token radius r.
 */
function paintTypeMark(ctx: CanvasRenderingContext2D, id: string, cx: number, cy: number, r: number): void {
  const ink = rgba(PALETTE.muted, 1);
  ctx.fillStyle = ink;
  ctx.strokeStyle = ink;
  switch (id) {
    case 'dot': // bar
      roundRectPath(ctx, cx - r / 4, cy - r / 8, r / 2, r / 4, r / 8);
      ctx.fill();
      break;
    case 'block': // dot
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'dasher': // chevron
      shapePath(ctx, 'chevron', cx, cy, r * 0.3);
      ctx.fill();
      break;
    case 'sprinter': // X: the dot's bar twice, crossed
      for (const a of [Math.PI / 4, -Math.PI / 4]) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(a);
        roundRectPath(ctx, -r / 4, -r / 8, r / 2, r / 4, r / 8);
        ctx.fill();
        ctx.restore();
      }
      break;
    case 'splitter': // two bars
      roundRectPath(ctx, cx - 0.2 * r, cy - 0.22 * r, 0.4 * r, 0.12 * r, 0.06 * r);
      ctx.fill();
      roundRectPath(ctx, cx - 0.2 * r, cy + 0.1 * r, 0.4 * r, 0.12 * r, 0.06 * r);
      ctx.fill();
      break;
    case 'hauler': // triangle, to one side of the gold coin (its own radius r/3 at the center)
      shapePath(ctx, 'triangle', cx + r * 0.55, cy, r * 0.2);
      ctx.fill();
      break;
    case 'mute': // square, in the ring's hole
      shapePath(ctx, 'square', cx, cy, r * 0.24);
      ctx.fill();
      break;
    case 'flyer': // diamond
      shapePath(ctx, 'diamond', cx, cy, r * 0.25);
      ctx.fill();
      break;
    case 'ward': // ring, small and centered: clear of the armor ring at 0.88r, so it reads as a mark, not a target
      ctx.lineWidth = r * 0.14;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
      ctx.stroke();
      break;
    case 'bulwark': // arc, the top half: well inside the plate band, whose inner edge is 0.55r
      ctx.lineWidth = r * 0.14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.2, Math.PI, 2 * Math.PI);
      ctx.stroke();
      break;
  }
}

/** The regular types' mark names, mirroring paintTypeMark's case comments (tests/bossMarks.test.ts checks the vocabulary). */
export const REGULAR_MARKS: Record<string, string> = { dot: 'bar', block: 'dot', dasher: 'chevron', sprinter: 'x', splitter: 'two-bars', hauler: 'triangle', mute: 'square', flyer: 'diamond', ward: 'ring', bulwark: 'arc' };
