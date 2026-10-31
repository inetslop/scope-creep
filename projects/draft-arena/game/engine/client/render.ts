/**
 * Draws a Frame on a full-screen canvas in the Critters style: a mint field with a dot pattern,
 * then areas, pickups, monsters, players, projectiles, effects, and names and hp bars on top.
 * Every look is drawn with drawCritter() (an outlined, squishy body; a face on creatures) unless it
 * draws itself. The camera shows about VIEW_AREA world units at any screen shape.
 */
import { drawCritter, drawPlayerCritter, shade, type DrawView, type Face, type Look, type Worn } from '../api.ts';
import { VIEW_AREA } from '../config.ts';
import type { KindEntry, Registry } from '../registry.ts';
import type { RosterEntry } from '../shared/protocol.ts';
import { wornFrom } from './profile.ts';
import type { Frame, FrameEntity } from './session.ts';

const ORDER = { area: 0, pickup: 1, monster: 2, player: 3, projectile: 4 } as const;
const MONSTER_FACE: Face = { mood: 'angry' };
const FONT = 'Fredoka, system-ui, sans-serif';
const DOT_STEP = 40;

export interface Joystick {
  ox: number;
  oy: number;
  x: number;
  y: number;
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  private readonly g: CanvasRenderingContext2D;
  private readonly registry: Registry;
  private readonly ink: string;
  private readonly failed = new Set<object>();
  /** CSS pixels per world unit. */
  scale = 1;
  private cssW = 1;
  private cssH = 1;
  private camX = 0;
  private camY = 0;

  constructor(canvas: HTMLCanvasElement, registry: Registry) {
    this.canvas = canvas;
    this.g = canvas.getContext('2d', { alpha: false })!;
    this.registry = registry;
    this.ink = registry.content.rules.ink;
  }

  /** Where a world point is on screen (CSS pixels). */
  toScreen(x: number, y: number): { x: number; y: number } {
    return { x: (x - this.camX) * this.scale + this.cssW / 2, y: (y - this.camY) * this.scale + this.cssH / 2 };
  }

  private fit(): number {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    if (this.canvas.width !== Math.round(w * dpr) || this.canvas.height !== Math.round(h * dpr)) {
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
    }
    this.cssW = w;
    this.cssH = h;
    this.scale = Math.sqrt((w * h) / VIEW_AREA);
    return dpr;
  }

  draw(frame: Frame | undefined, roster: ReadonlyMap<number, RosterEntry>, joystick: Joystick | undefined, ground: string): void {
    const dpr = this.fit();
    const g = this.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.fillStyle = shade(ground, -0.1);
    g.fillRect(0, 0, this.canvas.width, this.canvas.height);
    if (frame) {
      this.camX = frame.camX;
      this.camY = frame.camY;
      const s = this.scale * dpr;
      g.setTransform(s, 0, 0, s, dpr * (this.cssW / 2 - this.camX * this.scale), dpr * (this.cssH / 2 - this.camY * this.scale));
      this.drawGround(ground);
      this.drawWorld(frame, roster);
    }
    if (joystick) {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.lineWidth = 3;
      g.strokeStyle = this.ink;
      g.fillStyle = 'rgba(255, 255, 255, 0.45)';
      g.beginPath();
      g.arc(joystick.ox, joystick.oy, 56, 0, Math.PI * 2);
      g.fill();
      g.stroke();
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(joystick.x, joystick.y, 24, 0, Math.PI * 2);
      g.fill();
      g.stroke();
    }
  }

  private viewBounds(margin: number): { x0: number; y0: number; x1: number; y1: number } {
    const hw = this.cssW / 2 / this.scale + margin;
    const hh = this.cssH / 2 / this.scale + margin;
    return { x0: this.camX - hw, y0: this.camY - hh, x1: this.camX + hw, y1: this.camY + hh };
  }

  /** The field: the ground color with a staggered dot pattern, and an ink-dashed edge. */
  private drawGround(ground: string): void {
    const g = this.g;
    const { width, height } = this.registry.content.rules.world;
    g.fillStyle = ground;
    g.fillRect(0, 0, width, height);
    const b = this.viewBounds(DOT_STEP);
    g.fillStyle = shade(ground, -0.08);
    g.beginPath();
    const row0 = Math.max(0, Math.floor(b.y0 / DOT_STEP));
    const row1 = Math.min(Math.floor(height / DOT_STEP), Math.ceil(b.y1 / DOT_STEP));
    for (let row = row0; row <= row1; row++) {
      const y = row * DOT_STEP;
      const offset = row % 2 ? DOT_STEP / 2 : 0;
      for (let x = Math.max(0, Math.floor(b.x0 / DOT_STEP)) * DOT_STEP + offset; x <= Math.min(width, b.x1); x += DOT_STEP) {
        g.moveTo(x + 3, y);
        g.arc(x, y, 3, 0, Math.PI * 2);
      }
    }
    g.fill();
    g.save();
    g.strokeStyle = this.ink;
    g.globalAlpha = 0.35;
    g.lineWidth = 6;
    g.setLineDash([24, 18]);
    g.lineCap = 'round';
    g.strokeRect(0, 0, width, height);
    g.restore();
  }

  private drawWorld(frame: Frame, roster: ReadonlyMap<number, RosterEntry>): void {
    const g = this.g;
    const b = this.viewBounds(120);
    const kinds = this.registry.kinds;
    const colors = this.registry.content.rules.playerColors;
    const visible = frame.entities.filter((e) => e.x > b.x0 && e.x < b.x1 && e.y > b.y0 && e.y < b.y1 && kinds[e.kind]);
    visible.sort((p, q) => ORDER[kinds[p.kind]!.type] - ORDER[kinds[q.kind]!.type] || p.y - q.y);

    for (const e of visible) {
      const k = kinds[e.kind]!;
      if (k.type === 'area') this.drawArea(e, k.look, frame.time);
      else if (k.type === 'player') this.drawPlayer(e, colors[(roster.get(e.id)?.color ?? 0) % colors.length]!, this.worn(roster.get(e.id)), frame.time);
      else this.drawThing(e, k, frame.time);
    }
    for (const s of frame.shots) {
      if (s.x < b.x0 || s.x > b.x1 || s.y < b.y0 || s.y > b.y1) continue;
      const view: DrawView = { x: s.x, y: s.y, angle: s.angle, radius: s.def.radius, hp: 1, slots: NO_SLOTS, flash: false, speed: s.speed, time: frame.time, seed: s.seed, color: s.def.look.color };
      this.drawLook(s.def.look, view, s.def, s.def.look.face || undefined, false);
    }
    for (const fx of frame.effects) {
      if (this.failed.has(fx.def)) continue;
      g.save();
      try {
        fx.def.draw(g, fx.view);
      } catch (err) {
        this.report(fx.def, `effect ${fx.def.id}`, err);
      }
      g.restore();
    }
    this.drawLabels(visible, roster, kinds);
  }

  private view(e: FrameEntity, look: Look, time: number): DrawView {
    return { x: e.x, y: e.y, angle: e.angle, radius: e.radius, hp: e.hp, slots: e.slots, flash: e.flash, speed: e.speed, time, seed: e.id, color: look.color };
  }

  private drawThing(e: FrameEntity, k: KindEntry, time: number): void {
    const look = k.look;
    const face = look.face === false ? undefined : (look.face ?? (k.type === 'monster' ? MONSTER_FACE : undefined));
    this.drawLook(look, this.view(e, look, time), look, face, k.type === 'pickup');
    if (e.statuses.length) this.drawStatuses(e, time, -e.radius);
  }

  private drawLook(look: Look, v: DrawView, owner: object, face: Face | undefined, glint: boolean): void {
    const g = this.g;
    g.save();
    g.translate(v.x, v.y);
    try {
      if (look.draw && !this.failed.has(owner)) look.draw(g, v);
      else drawCritter(g, look, v, { ink: this.ink, face, glint });
    } catch (err) {
      this.report(owner, 'look.draw', err);
    }
    g.restore();
  }

  private drawArea(e: FrameEntity, look: Look, time: number): void {
    const g = this.g;
    if (look.draw) {
      this.drawLook(look, this.view(e, look, time), look, undefined, false);
      return;
    }
    // hp is the life left: fade out over the last fifth. A tinted pool with a dotted ink rim.
    const fade = Math.min(1, e.hp * 5);
    g.save();
    g.fillStyle = look.color;
    g.globalAlpha = 0.18 * fade;
    g.beginPath();
    g.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 0.4 * fade;
    g.strokeStyle = this.ink;
    g.lineWidth = 3;
    g.lineCap = 'round';
    g.setLineDash([2, 10]);
    g.lineDashOffset = -time * 12;
    g.stroke();
    g.restore();
  }

  /** What a player wears, without anything whose draw() has failed. */
  private worn(entry: RosterEntry | undefined): Worn {
    const w = wornFrom(this.registry, entry?.wear);
    const ok = <T extends object>(d: T | undefined): T | undefined => (d && !this.failed.has(d) ? d : undefined);
    return { head: ok(w.head), face: ok(w.face), back: ok(w.back), pattern: ok(w.pattern) };
  }

  private drawPlayer(e: FrameEntity, color: string, worn: Worn, time: number): void {
    const g = this.g;
    const look: Look = { shape: 'circle', color };
    if (e.me) {
      // You: a soft white disc under you, so you find yourself in a crowd.
      g.fillStyle = 'rgba(255, 255, 255, 0.55)';
      g.beginPath();
      g.arc(e.x, e.y + e.radius * 0.2, e.radius + 10, 0, Math.PI * 2);
      g.fill();
    }
    g.save();
    g.translate(e.x, e.y);
    drawPlayerCritter(g, this.view(e, look, time), color, worn, this.ink, (def, err) => this.report(def, 'draw', err));
    g.restore();
    // A hat may reach a radius above the head: what a status draws over the head goes above it.
    if (e.statuses.length) this.drawStatuses(e, time, worn.head ? -2 * e.radius : -e.radius);
  }

  private drawStatuses(e: FrameEntity, time: number, top: number): void {
    const g = this.g;
    const statuses = this.registry.content.statuses;
    let ring = 0;
    for (const index of e.statuses) {
      const def = statuses[index];
      if (!def || this.failed.has(def)) continue;
      if (def.draw) {
        // Drawn with the unit, at the position the unit is shown at: it never trails.
        g.save();
        g.translate(e.x, e.y);
        try {
          def.draw(g, { radius: e.radius, top, color: def.color, ink: this.ink, time, seed: e.id });
        } catch (err) {
          this.report(def, 'draw', err);
        }
        g.restore();
        continue;
      }
      g.save();
      g.lineWidth = 3.5;
      g.lineCap = 'round';
      g.setLineDash([3, 7]);
      g.strokeStyle = def.color;
      g.beginPath();
      g.arc(e.x, e.y, e.radius + 6 + ring * 5, 0, Math.PI * 2);
      g.stroke();
      g.restore();
      ring++;
    }
  }


  private drawLabels(visible: FrameEntity[], roster: ReadonlyMap<number, RosterEntry>, kinds: Registry['kinds']): void {
    const g = this.g;
    const px = 1 / this.scale;
    g.textAlign = 'center';
    g.textBaseline = 'bottom';
    g.font = `600 ${14 * px}px ${FONT}`;
    g.lineJoin = 'round';
    for (const e of visible) {
      const type = kinds[e.kind]!.type;
      if (type === 'player') {
        const entry = roster.get(e.id);
        const name = entry?.name ?? '';
        // A hat may reach a radius above the head: the name goes above it.
        // Above the hat (a hat reaches a radius over the head) and above what statuses draw there.
        let above = 0;
        for (const index of e.statuses) above = Math.max(above, this.registry.content.statuses[index]?.above ?? 0);
        const y = e.y - e.radius * (entry?.wear.head ? 2 : 1) - above - 10 * px;
        g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        g.lineWidth = 4 * px;
        g.strokeText(name, e.x, y);
        g.fillStyle = this.ink;
        g.fillText(name, e.x, y);
        this.bar(e.x, e.y + e.radius + 9 * px, 46 * px, 8 * px, e.hp, e.me ? '#51cf66' : '#ff6b6b', px);
      } else if (type === 'monster' && e.hp < 0.999) {
        this.bar(e.x, e.y + e.radius + 7 * px, Math.max(24 * px, e.radius * 1.8), 6 * px, e.hp, '#ff6b6b', px);
      }
    }
  }

  /** A white pill with an ink rim, filled from the left. */
  private bar(cx: number, y: number, w: number, h: number, fill: number, color: string, px: number): void {
    const g = this.g;
    const x = cx - w / 2;
    g.fillStyle = '#ffffff';
    g.strokeStyle = this.ink;
    g.lineWidth = 2 * px;
    pill(g, x, y, w, h);
    g.fill();
    g.stroke();
    const inset = 2 * px;
    const inner = Math.max(0, (w - inset * 2) * Math.max(0, Math.min(1, fill)));
    if (inner > 0) {
      g.fillStyle = color;
      pill(g, x + inset, y + inset, inner, h - inset * 2);
      g.fill();
    }
  }

  private report(def: object, what: string, err: unknown): void {
    if (this.failed.has(def)) return;
    this.failed.add(def);
    console.error(`content error in ${what}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

const NO_SLOTS: readonly number[] = [0, 0, 0, 0];

function pill(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  const r = Math.min(h / 2, w / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
