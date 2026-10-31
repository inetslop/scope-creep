/**
 * The authoritative simulation of one match: players, monsters, projectiles, areas, pickups.
 * Pure TypeScript with no I/O, so it runs the same in the Node server, in the browser (a match in
 * the tab, the smoke test) and in tests. Content hooks are called through the Ctx; a hook that
 * throws disables its item for the rest of the match (recorded in `errors`) instead of taking the
 * match down.
 */
import { chase } from '../api.ts';
import type { AreaOptions, Ctx, DirectorDef, LaunchOptions, MonsterDef, Point, Rules, Stats, TalentDef, UpgradeDef, Unit, Projectile, Area } from '../api.ts';
import { TICK_DT } from '../config.ts';
import { PLAYER_KIND, type Registry } from '../registry.ts';
import { decodeAngle16, decodePos, encodeAngle16, encodePos } from '../shared/protocol.ts';
import { createRng, type Rng } from '../shared/rng.ts';
import { canTake, takeable } from '../talents.ts';
import { makeBrain, thinkBot } from './bots.ts';
import { NO_WEAR, type SimArea, type SimMonster, type SimPickup, type SimPlayer, type SimProjectile, type SimUnit, type SimVisible, type WearIndexes } from './entities.ts';
import { Grid } from './grid.ts';

export interface EffectEvent {
  kind: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  value: number;
}

/** What happened this tick that clients learn about as events, not entities. */
export interface TickEvents {
  launches: SimProjectile[];
  removes: { id: number; x: number; y: number }[];
  effects: EffectEvent[];
}

const STAT_KEYS: readonly (keyof Stats)[] = ['maxHp', 'speed', 'regen', 'damage', 'cooldown', 'area', 'projectileSpeed', 'pickup', 'armor', 'pierce', 'shots'];
/** Angle between the copies Shots fans out. */
const SHOT_SPREAD = 0.16;
/** A kill is credited to the last player that hit within this many seconds. */
const CREDIT_SECONDS = 6;
const PICKUP_PULL_SPEED = 560;
/** Monsters keep this much of their combined radii between them. */
const SPACING = 1.25;

class IdPool {
  private last = 0;
  private readonly used = new Set<number>();

  /** 1..65535, counting up and wrapping, so a freed id isn't reused for a long while. */
  take(): number {
    for (let i = 0; i < 65535; i++) {
      this.last = (this.last % 65535) + 1;
      if (!this.used.has(this.last)) {
        this.used.add(this.last);
        return this.last;
      }
    }
    throw new Error('out of entity ids');
  }

  free(id: number): void {
    this.used.delete(id);
  }
}

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const errorText = (err: unknown): string => (err instanceof Error ? err.message : String(err));

export class Match {
  readonly registry: Registry;
  readonly rules: Rules;
  readonly rng: Rng;
  tick = 0;
  time = 0;
  readonly players = new Map<number, SimPlayer>();
  monsters: SimMonster[] = [];
  projectiles: SimProjectile[] = [];
  areas: SimArea[] = [];
  pickups: SimPickup[] = [];
  /** Living players and monsters, rebuilt after movement every tick. */
  readonly units = new Grid<SimUnit>(128);
  /** Everything a snapshot may contain, rebuilt at the end of every tick. */
  readonly visible = new Grid<SimVisible>(256);
  readonly events: TickEvents = { launches: [], removes: [], effects: [] };
  /** Content hook failures, "<id>: <message>". Each failing item is disabled for the rest of the match. */
  readonly errors: string[] = [];
  readonly counters = { monstersSpawned: 0, monstersKilled: 0, playersKilled: 0, projectilesFired: 0, damageDealt: 0 };
  readonly ctx: Ctx;
  private readonly disabled = new Set<object>();
  private readonly ids = new IdPool();
  private maxUnitRadius: number;
  private spawnTimer = 0;
  /** Monsters within spawn.maxDistance of each player, counted at the last spawn pass. */
  private readonly crowd = new Map<SimPlayer, number>();
  private readonly directors: { def: DirectorDef; mem: Record<string, number> }[];

  constructor(registry: Registry, seed: number) {
    this.registry = registry;
    this.rules = registry.content.rules;
    this.rng = createRng(seed);
    this.maxUnitRadius = Math.max(this.rules.player.radius, ...registry.content.monsters.map((m) => m.radius));
    this.directors = registry.content.directors.map((def) => ({ def, mem: {} }));
    this.ctx = this.makeCtx();
  }

  // -------------------------------------------------------------------------------------------
  // Players

  /**
   * A new player. `color` is their pick from rules.playerColors (else the least used one), `wear`
   * what they wear (indexes, checked here); bots dress at random.
   */
  addPlayer(name: string, bot: boolean, token: string, color?: number, wear?: WearIndexes): SimPlayer {
    const id = this.ids.take();
    const colors = this.rules.playerColors.length;
    const p: SimPlayer = {
      cat: 'player',
      type: 'player',
      id,
      kind: PLAYER_KIND,
      team: id,
      name,
      bot,
      token,
      color: color !== undefined && Number.isInteger(color) && color >= 0 && color < colors ? color : this.freeColor(),
      wear: bot ? this.botWear() : this.checkWear(wear ?? NO_WEAR),
      x: this.rules.world.width / 2,
      y: this.rules.world.height / 2,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: this.rules.player.radius,
      hp: 0,
      maxHp: 0,
      alive: false,
      dead: false,
      slots: [0, 0, 0, 0],
      mem: {},
      statuses: [],
      lastHitBy: 0,
      lastHitAt: -99,
      flashUntil: 0,
      level: 1,
      prestige: 0,
      coins: 0,
      xp: 0,
      xpNext: this.rules.xp.first,
      kills: 0,
      score: 0,
      stats: this.baseStats(),
      input: { moveX: 0, moveY: 0, aim: 0, buttons: 0 },
      upgrades: new Map(),
      talents: new Map(),
      pendingPicks: 0,
      respawnAt: 0,
      ackSeq: 0,
      connected: true,
      leftAt: 0,
      brain: bot ? makeBrain(this.rng) : undefined,
    };
    this.players.set(id, p);
    this.respawn(p);
    return p;
  }

  /** Only what exists and fits its slot. */
  private checkWear(w: WearIndexes): WearIndexes {
    const { accessories, patterns } = this.registry.content;
    const slot = (i: number, want: string): number => (Number.isInteger(i) && i > 0 && accessories[i - 1]?.slot === want ? i : 0);
    return {
      head: slot(w.head, 'head'),
      face: slot(w.face, 'face'),
      back: slot(w.back, 'back'),
      pattern: Number.isInteger(w.pattern) && w.pattern > 0 && w.pattern <= patterns.length ? w.pattern : 0,
    };
  }

  /** Bots show off the wardrobe: each slot filled now and then, at random. */
  private botWear(): WearIndexes {
    const { accessories, patterns } = this.registry.content;
    const pick = (slot: string): number => {
      const options = accessories.flatMap((a, i) => (a.slot === slot ? [i + 1] : []));
      return options.length && this.rng.chance(0.4) ? this.rng.pick(options) : 0;
    };
    return { head: pick('head'), face: pick('face'), back: pick('back'), pattern: patterns.length && this.rng.chance(0.3) ? 1 + this.rng.int(patterns.length) : 0 };
  }

  removePlayer(id: number): void {
    if (!this.players.delete(id)) return;
    this.ids.free(id);
  }

  setInput(p: SimPlayer, seq: number, moveX: number, moveY: number, aim: number, buttons: number): void {
    p.ackSeq = seq;
    p.input.moveX = clamp(moveX, -1, 1);
    p.input.moveY = clamp(moveY, -1, 1);
    p.input.aim = aim;
    p.input.buttons = buttons;
  }

  /** Gives a player an upgrade at a level, as if taken that many times (tests use it). */
  grant(p: SimPlayer, def: UpgradeDef, level: number): void {
    p.upgrades.set(def, { level: Math.max(1, Math.min(level, def.maxLevel)), timer: 0 });
    this.recomputeStats(p);
  }

  /** The talents a player could take a rank of now. */
  takeableTalents(p: SimPlayer): TalentDef[] {
    return takeable(this.registry, (t) => p.talents.get(t) ?? 0, (u) => p.upgrades.get(u)?.level ?? 0, p.prestige);
  }

  /** Spends a banked point on talent `index` (registry order), if its needs are met. */
  pick(p: SimPlayer, index: number): void {
    if (!p.alive || p.pendingPicks <= 0) return;
    const t = this.registry.talentList[index];
    if (!t || !canTake(this.registry, t, (x) => p.talents.get(x) ?? 0, (u) => p.upgrades.get(u)?.level ?? 0, p.prestige)) return;
    this.takeTalent(p, t);
    p.pendingPicks--;
  }

  /** One rank of a talent: one level of its upgrade. */
  private takeTalent(p: SimPlayer, t: TalentDef): void {
    const def = this.registry.upgrades.get(t.upgrade)!;
    p.talents.set(t, (p.talents.get(t) ?? 0) + 1);
    const held = p.upgrades.get(def);
    if (held) held.level = Math.min(def.maxLevel, held.level + 1);
    else p.upgrades.set(def, { level: 1, timer: 0.3 });
    this.recomputeStats(p);
  }

  private baseStats(): Stats {
    const r = this.rules.player;
    return { maxHp: r.maxHp, speed: r.speed, regen: r.regen, damage: 1, cooldown: 1, area: 1, projectileSpeed: 1, pickup: r.pickup, armor: 0, pierce: 0, shots: 0 };
  }

  private freeColor(): number {
    const count = this.rules.playerColors.length;
    const used = new Array<number>(count).fill(0);
    for (const p of this.players.values()) used[p.color % count]!++;
    let best = 0;
    for (let i = 1; i < count; i++) if (used[i]! < used[best]!) best = i;
    return best;
  }

  private respawn(p: SimPlayer): void {
    p.prestige = 0;
    p.level = 1;
    p.xp = 0;
    p.xpNext = this.rules.xp.first;
    p.kills = 0;
    p.score = 0;
    p.upgrades.clear();
    p.talents.clear();
    p.pendingPicks = 0;
    p.statuses.length = 0;
    for (const k of Object.keys(p.mem)) delete p.mem[k];
    p.slots.fill(0);
    p.maxHp = 0;
    p.hp = 0;
    // Everyone starts as a nomad: the free start ranks (the Bolt).
    for (const t of this.registry.talentList) for (let i = 0; i < (t.start ?? 0); i++) this.takeTalent(p, t);
    p.hp = p.maxHp;
    p.lastHitBy = 0;
    p.alive = true;
    // Of a few random spots, the one farthest from other players.
    const margin = 200;
    let best = { x: p.x, y: p.y, d: -1 };
    for (let i = 0; i < 8; i++) {
      const x = this.rng.range(margin, this.rules.world.width - margin);
      const y = this.rng.range(margin, this.rules.world.height - margin);
      let d = Infinity;
      for (const q of this.players.values()) if (q !== p && q.alive) d = Math.min(d, Math.hypot(q.x - x, q.y - y));
      if (d > best.d) best = { x, y, d };
    }
    p.x = best.x;
    p.y = best.y;
  }

  private recomputeStats(p: SimPlayer): void {
    const s = this.baseStats();
    for (const [def, held] of p.upgrades) {
      if (!def.stats) continue;
      for (const key of STAT_KEYS) {
        const bonus = def.stats[key];
        if (bonus) s[key] += bonus * held.level;
      }
    }
    s.cooldown = Math.max(0.25, s.cooldown);
    s.damage = Math.max(0.1, s.damage);
    s.area = Math.max(0.2, s.area);
    s.projectileSpeed = Math.max(0.2, s.projectileSpeed);
    s.speed = Math.max(40, s.speed);
    s.pierce = Math.max(0, Math.round(s.pierce));
    s.shots = Math.max(0, Math.round(s.shots));
    s.maxHp = Math.max(1, s.maxHp);
    const gained = s.maxHp - p.maxHp;
    p.stats = s;
    p.maxHp = s.maxHp;
    if (gained > 0) p.hp += gained;
    p.hp = Math.min(p.hp, p.maxHp);
  }

  giveXp(p: SimPlayer, amount: number): void {
    if (!p.alive || !(amount > 0)) return;
    p.xp += amount;
    while (p.xp >= p.xpNext) {
      p.xp -= p.xpNext;
      p.level++;
      p.xpNext = Math.ceil(p.xpNext * this.rules.xp.growth);
      p.pendingPicks++;
      if (p.level >= this.rules.prestige.level) {
        this.prestige(p);
        return;
      }
      this.addEffect(this.rules.effects.levelUp, p, p, p.level);
    }
    // Points bank; only when nothing at all can be taken any more are they dropped.
    if (p.pendingPicks > 0 && this.takeableTalents(p).length === 0) p.pendingPicks = 0;
  }

  /** Back to level 1, keeping score, kills and hp (up to the new max); then the directors' rewards. */
  private prestige(p: SimPlayer): void {
    p.prestige++;
    p.level = 1;
    p.xp = 0;
    p.xpNext = this.rules.xp.first;
    p.upgrades.clear();
    p.talents.clear();
    p.pendingPicks = 0;
    for (const t of this.registry.talentList) for (let i = 0; i < (t.start ?? 0); i++) this.takeTalent(p, t);
    this.recomputeStats(p);
    this.addEffect(this.rules.effects.prestige ?? this.rules.effects.levelUp, p, p, p.prestige);
    for (const d of this.directors) {
      if (!d.def.onPrestige || this.disabled.has(d.def)) continue;
      try {
        d.def.onPrestige(this.ctx, d.mem, p, p.prestige);
      } catch (err) {
        this.fail(d.def, err);
      }
    }
  }

  givePoints(p: SimPlayer, amount: number): void {
    const n = Math.floor(amount);
    if (!p.alive || !(n > 0)) return;
    p.pendingPicks = Math.min(255, p.pendingPicks + n);
    if (this.takeableTalents(p).length === 0) p.pendingPicks = 0;
  }

  // -------------------------------------------------------------------------------------------
  // The tick

  step(): void {
    this.tick++;
    this.time = this.tick * TICK_DT;
    const dt = TICK_DT;
    this.events.launches.length = 0;
    this.events.removes.length = 0;
    this.events.effects.length = 0;

    for (const p of this.players.values()) this.updatePlayer(p, dt);
    this.updateMonsters(dt);
    this.rebuildUnits();
    this.separateMonsters();
    this.fireWeapons(dt);
    this.updateProjectiles(dt);
    this.updateAreas(dt);
    this.contactDamage(dt);
    this.updateStatuses(dt);
    this.updatePickups(dt);
    this.resolveDeaths();
    this.spawnMonsters(dt);
    this.runDirectors(dt);
    this.compact();
    this.rebuildVisible();
  }

  /** Movement multiplier from statuses. */
  speedMul(u: SimUnit): number {
    let mul = 1;
    for (const s of u.statuses) if (s.def.speedMul !== undefined) mul *= s.def.speedMul;
    return mul;
  }

  private updatePlayer(p: SimPlayer, dt: number): void {
    if (!p.alive) {
      if (this.time >= p.respawnAt && (p.connected || p.bot)) this.respawn(p);
      return;
    }
    if (p.brain) thinkBot(this, p, dt);
    let mx = p.input.moveX;
    let my = p.input.moveY;
    const len = Math.hypot(mx, my);
    if (len > 1) {
      mx /= len;
      my /= len;
    }
    const speed = p.stats.speed * this.speedMul(p);
    p.vx = mx * speed;
    p.vy = my * speed;
    p.x = clamp(p.x + p.vx * dt, p.radius, this.rules.world.width - p.radius);
    p.y = clamp(p.y + p.vy * dt, p.radius, this.rules.world.height - p.radius);
    p.angle = p.input.aim;
    if (p.stats.regen > 0) p.hp = Math.min(p.maxHp, p.hp + p.stats.regen * dt);
  }

  private nearestPlayer(x: number, y: number): [SimPlayer | undefined, number] {
    let best: SimPlayer | undefined;
    let bestD2 = Infinity;
    for (const p of this.players.values()) {
      if (!p.alive) continue;
      const d2 = (p.x - x) ** 2 + (p.y - y) ** 2;
      if (d2 < bestD2) {
        best = p;
        bestD2 = d2;
      }
    }
    return [best, Math.sqrt(bestD2)];
  }

  private updateMonsters(dt: number): void {
    const { width, height } = this.rules.world;
    for (const m of this.monsters) {
      if (!m.alive) continue;
      m.retargetIn -= dt;
      if (m.target && !m.target.alive) m.retargetIn = 0;
      if (m.retargetIn <= 0) {
        m.retargetIn = 0.5;
        const [target, d] = this.nearestPlayer(m.x, m.y);
        if (!target) {
          // Nobody left alive: removed quietly (no kill, no drop).
          m.alive = false;
          m.dead = true;
          continue;
        }
        if (d > this.rules.spawn.relocateDistance) {
          // Out of everyone's sight: back in front of its player if that crowd is short, else gone.
          const crowd = this.crowd.get(target) ?? 0;
          if (crowd >= this.wantAround(target) || !this.relocate(m, target)) {
            m.alive = false;
            m.dead = true;
            continue;
          }
          this.crowd.set(target, crowd + 1);
        }
        m.target = target;
      }
      const think = m.def.think;
      if (think && !this.disabled.has(m.def)) {
        try {
          think(this.ctx, m, dt);
        } catch (err) {
          this.fail(m.def, err);
          chase(m);
        }
      } else {
        chase(m);
      }
      const mul = this.speedMul(m);
      m.x = clamp(m.x + m.vx * mul * dt, m.radius, width - m.radius);
      m.y = clamp(m.y + m.vy * mul * dt, m.radius, height - m.radius);
      if (!Number.isFinite(m.x) || !Number.isFinite(m.y)) {
        this.fail(m.def, new Error('moved to a position that is not a number'));
        m.alive = false;
        m.dead = true;
      }
    }
  }

  private rebuildUnits(): void {
    this.units.clear();
    for (const p of this.players.values()) if (p.alive) this.units.insert(p);
    for (const m of this.monsters) if (m.alive) this.units.insert(m);
  }

  /**
   * Monsters push each other apart and keep a little personal space (SPACING), so a crowd reads as
   * separate shapes instead of one solid pile.
   */
  private separateMonsters(): void {
    const reach = this.maxUnitRadius * 2 * SPACING;
    for (const m of this.monsters) {
      if (!m.alive) continue;
      this.units.each(m.x, m.y, reach, (o) => {
        if (o === m || o.cat !== 'monster' || !o.alive) return;
        const dx = m.x - o.x;
        const dy = m.y - o.y;
        const min = (m.radius + o.radius) * SPACING;
        const d2 = dx * dx + dy * dy;
        if (d2 >= min * min) return;
        if (d2 < 0.0001) {
          m.x += 0.5;
          return;
        }
        const d = Math.sqrt(d2);
        const push = ((min - d) * 0.25) / d;
        m.x += dx * push;
        m.y += dy * push;
        o.x -= dx * push;
        o.y -= dy * push;
      });
    }
  }

  private fireWeapons(dt: number): void {
    for (const p of this.players.values()) {
      if (!p.alive) continue;
      for (const [def, held] of p.upgrades) {
        if (!def.fire || !def.cooldown || this.disabled.has(def)) continue;
        held.timer -= dt;
        if (held.timer > 0) continue;
        held.timer = Math.max(held.timer + def.cooldown * p.stats.cooldown, dt * 0.5);
        try {
          def.fire(this.ctx, p, held.level);
        } catch (err) {
          this.fail(def, err);
        }
      }
    }
  }

  private killProjectile(p: SimProjectile): void {
    if (p.dead) return;
    p.dead = true;
    if (p.scripted) this.events.removes.push({ id: p.id, x: p.x, y: p.y });
  }

  private updateProjectiles(dt: number): void {
    const { width, height } = this.rules.world;
    const count = this.projectiles.length;
    for (let i = 0; i < count; i++) {
      const p = this.projectiles[i]!;
      if (p.dead) continue;
      p.age = (this.tick - p.born) * dt;
      if (p.age >= p.life) {
        // Clients drop path projectiles at the same age by themselves: no remove event needed.
        p.dead = true;
        if (p.def.onEnd && !this.disabled.has(p.def)) {
          try {
            p.def.onEnd(this.ctx, p);
          } catch (err) {
            this.fail(p.def, err);
          }
        }
        continue;
      }
      try {
        if (!p.scripted) p.def.step!(this.ctx, p, dt);
        else if (p.def.path) {
          const at = p.def.path(p.launch, p.age, p.owner);
          p.x = at.x;
          p.y = at.y;
        } else {
          p.x = p.launch.x + Math.cos(p.launch.angle) * p.launch.speed * p.age;
          p.y = p.launch.y + Math.sin(p.launch.angle) * p.launch.speed * p.age;
        }
      } catch (err) {
        this.fail(p.def, err);
        this.killProjectile(p);
        continue;
      }
      if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) {
        this.fail(p.def, new Error('moved to a position that is not a number'));
        this.killProjectile(p);
        continue;
      }
      if (p.x < -300 || p.y < -300 || p.x > width + 300 || p.y > height + 300) {
        this.killProjectile(p);
        continue;
      }
      this.units.each(p.x, p.y, p.radius + this.maxUnitRadius, (u) => {
        if (!u.alive || u.team === p.team || p.hits.has(u.id)) return;
        const r = p.radius + u.radius;
        if ((u.x - p.x) ** 2 + (u.y - p.y) ** 2 > r * r) return;
        p.hits.add(u.id);
        this.strike(p, u);
        p.pierce--;
        if (p.pierce <= 0) {
          this.killProjectile(p);
          return true;
        }
      });
    }
  }

  private updateAreas(dt: number): void {
    const count = this.areas.length;
    for (let i = 0; i < count; i++) {
      const a = this.areas[i]!;
      if (a.dead) continue;
      if (a.follow) {
        if (!a.owner.alive) {
          a.dead = true;
          continue;
        }
        a.x = a.owner.x;
        a.y = a.owner.y;
      }
      a.age += dt;
      if (a.age >= a.life) {
        a.dead = true;
        continue;
      }
      a.timer -= dt;
      if (a.timer > 0) continue;
      a.timer += a.def.interval;
      if (this.disabled.has(a.def)) continue;
      try {
        a.def.pulse(this.ctx, a);
      } catch (err) {
        this.fail(a.def, err);
        a.dead = true;
      }
    }
  }

  private contactDamage(dt: number): void {
    for (const p of this.players.values()) {
      if (!p.alive) continue;
      this.units.each(p.x, p.y, p.radius + this.maxUnitRadius, (u) => {
        if (u.cat !== 'monster' || !u.alive || u.damage <= 0) return;
        const r = p.radius + u.radius;
        if ((u.x - p.x) ** 2 + (u.y - p.y) ** 2 > r * r) return;
        this.damage(p, u.damage * dt, u);
      });
    }
  }

  private updateStatuses(dt: number): void {
    const tickUnit = (u: SimUnit): void => {
      for (let i = u.statuses.length - 1; i >= 0; i--) {
        const s = u.statuses[i]!;
        s.left -= dt;
        if (s.def.tick && !this.disabled.has(s.def)) {
          try {
            s.def.tick(this.ctx, u, dt, s.stacks);
          } catch (err) {
            this.fail(s.def, err);
          }
        }
        if (s.left <= 0) u.statuses.splice(i, 1);
      }
    };
    for (const p of this.players.values()) if (p.alive && p.statuses.length) tickUnit(p);
    for (const m of this.monsters) if (m.alive && m.statuses.length) tickUnit(m);
  }

  private updatePickups(dt: number): void {
    for (const k of this.pickups) {
      k.target = undefined;
      k.targetD2 = Infinity;
    }
    // Last tick's visible grid has the pickups: each player claims the ones in its reach.
    for (const p of this.players.values()) {
      if (!p.alive) continue;
      const r = p.stats.pickup;
      this.visible.each(p.x, p.y, r, (e) => {
        if (e.cat !== 'pickup' || e.dead) return;
        const d2 = (e.x - p.x) ** 2 + (e.y - p.y) ** 2;
        if (d2 <= r * r && d2 < e.targetD2) {
          e.target = p;
          e.targetD2 = d2;
        }
      });
    }
    for (const k of this.pickups) {
      if (k.dead) continue;
      k.age += dt;
      if (k.age >= k.life) {
        k.dead = true;
        continue;
      }
      const p = k.target;
      if (!p || !p.alive) continue;
      const d = Math.hypot(p.x - k.x, p.y - k.y);
      if (d <= p.radius + k.radius) {
        k.dead = true;
        if (this.disabled.has(k.def)) continue;
        try {
          k.def.collect(this.ctx, p, k.value);
        } catch (err) {
          this.fail(k.def, err);
        }
        continue;
      }
      const stepLen = Math.min(d, PICKUP_PULL_SPEED * dt);
      k.x += ((p.x - k.x) / d) * stepLen;
      k.y += ((p.y - k.y) / d) * stepLen;
    }
  }

  private creditFor(u: SimUnit): SimPlayer | undefined {
    if (!u.lastHitBy || this.time - u.lastHitAt > CREDIT_SECONDS) return undefined;
    const p = this.players.get(u.lastHitBy);
    return p && p.alive ? p : undefined;
  }

  private runDirectors(dt: number): void {
    for (const d of this.directors) {
      if (!d.def.tick || this.disabled.has(d.def)) continue;
      try {
        d.def.tick(this.ctx, d.mem, dt);
      } catch (err) {
        this.fail(d.def, err);
      }
    }
  }

  private directorsOnKill(killer: SimPlayer | undefined, victim: Unit): void {
    for (const d of this.directors) {
      if (!d.def.onKill || this.disabled.has(d.def)) continue;
      try {
        d.def.onKill(this.ctx, d.mem, killer, victim);
      } catch (err) {
        this.fail(d.def, err);
      }
    }
  }

  private onKillHooks(killer: SimPlayer, victim: Unit): void {
    for (const [def, held] of killer.upgrades) {
      if (!def.onKill || this.disabled.has(def)) continue;
      try {
        def.onKill(this.ctx, killer, held.level, victim);
      } catch (err) {
        this.fail(def, err);
      }
    }
  }

  private resolveDeaths(): void {
    for (const m of this.monsters) {
      if (!m.alive || m.hp > 0) continue;
      m.alive = false;
      m.dead = true;
      this.counters.monstersKilled++;
      const killer = this.creditFor(m);
      if (killer) {
        killer.kills++;
        killer.score += this.rules.score.monsterKill;
        this.onKillHooks(killer, m);
      }
      if (m.def.onDeath && !this.disabled.has(m.def)) {
        try {
          m.def.onDeath(this.ctx, m);
        } catch (err) {
          this.fail(m.def, err);
        }
      }
      this.directorsOnKill(killer, m);
      this.addEffect(this.rules.effects.death, m, m, m.radius);
      if (m.def.xp > 0) this.addPickup(this.rules.gem, m.x, m.y, m.def.xp);
    }
    for (const p of this.players.values()) {
      if (!p.alive || p.hp > 0) continue;
      const killer = this.creditFor(p);
      p.alive = false;
      p.respawnAt = this.time + this.rules.respawnSeconds;
      p.pendingPicks = 0;
      p.statuses.length = 0;
      this.counters.playersKilled++;
      this.addEffect(this.rules.effects.playerDeath, p, p, p.radius);
      if (killer && killer !== p) {
        killer.kills++;
        killer.score += this.rules.score.playerKill;
        this.giveXp(killer, this.rules.pvp.bountyXpPerLevel * p.level);
        this.onKillHooks(killer, p);
      }
      this.directorsOnKill(killer && killer !== p ? killer : undefined, p);
    }
  }

  /**
   * A spot just out of sight of a player to bring a monster in: mostly ahead of where the player is
   * heading (a running player meets monsters instead of growing a tail), else anywhere around.
   */
  private spawnSpot(p: SimPlayer, radius: number, ahead: number): Point | undefined {
    const s = this.rules.spawn;
    const { width, height } = this.rules.world;
    const moving = Math.hypot(p.vx, p.vy) > 20;
    for (let attempt = 0; attempt < 6; attempt++) {
      const a = moving && this.rng.chance(ahead) ? Math.atan2(p.vy, p.vx) + this.rng.range(-1.2, 1.2) : this.rng.next() * Math.PI * 2;
      const d = this.rng.range(s.minDistance, s.maxDistance);
      const x = p.x + Math.cos(a) * d;
      const y = p.y + Math.sin(a) * d;
      if (x >= radius && y >= radius && x <= width - radius && y <= height - radius) return { x, y };
    }
    return undefined;
  }

  /**
   * Moves a monster that fell far behind to a spot ahead of its player. It gets a new id, so clients
   * see one monster leave and another arrive instead of one streaking across the map.
   */
  private relocate(m: SimMonster, p: SimPlayer): boolean {
    const spot = this.spawnSpot(p, m.radius, 1);
    if (!spot) return false;
    const id = this.ids.take();
    this.ids.free(m.id);
    (m as { id: number }).id = id;
    m.x = spot.x;
    m.y = spot.y;
    return true;
  }

  /** How many monsters a player should have around them: more as they level up. */
  private wantAround(p: SimPlayer): number {
    const s = this.rules.spawn;
    return Math.min(s.max, s.base + s.perLevel * (p.level - 1));
  }

  private spawnMonsters(dt: number): void {
    this.spawnTimer -= dt;
    if (this.spawnTimer > 0) return;
    const s = this.rules.spawn;
    this.spawnTimer += s.every;
    let alive = 0;
    for (const m of this.monsters) if (m.alive) alive++;
    // A player's crowd is what is around them, whoever it chases: players close together share one.
    this.crowd.clear();
    const r2 = s.maxDistance * s.maxDistance;
    for (const p of this.players.values()) {
      if (!p.alive) continue;
      let near = 0;
      this.units.each(p.x, p.y, s.maxDistance, (u) => {
        if (u.cat === 'monster' && u.alive && (u.x - p.x) ** 2 + (u.y - p.y) ** 2 <= r2) near++;
      });
      this.crowd.set(p, near);
    }
    for (const p of this.players.values()) {
      if (!p.alive) continue;
      if (alive >= s.maxMonsters) return;
      let n = Math.min(this.wantAround(p) - (this.crowd.get(p) ?? 0), s.burst, s.maxMonsters - alive);
      if (n <= 0) continue;
      const pool = this.registry.content.monsters.filter((d) => d.weight > 0 && d.fromLevel <= p.level && !this.disabled.has(d));
      if (pool.length === 0) continue;
      const total = pool.reduce((sum, d) => sum + d.weight, 0);
      for (; n > 0; n--) {
        let roll = this.rng.next() * total;
        let def = pool[0]!;
        for (const d of pool) {
          roll -= d.weight;
          if (roll < 0) {
            def = d;
            break;
          }
        }
        const spot = this.spawnSpot(p, def.radius, 0.7);
        if (!spot) continue;
        this.addMonster(def, spot.x, spot.y, p.level);
        this.crowd.set(p, (this.crowd.get(p) ?? 0) + 1);
        alive++;
      }
    }
  }

  private compact(): void {
    const keep = <T extends { dead: boolean; id: number }>(list: T[]): T[] => {
      let w = 0;
      for (let i = 0; i < list.length; i++) {
        const e = list[i]!;
        if (e.dead) this.ids.free(e.id);
        else list[w++] = e;
      }
      list.length = w;
      return list;
    };
    keep(this.monsters);
    keep(this.projectiles);
    keep(this.areas);
    keep(this.pickups);
  }

  private rebuildVisible(): void {
    this.visible.clear();
    for (const p of this.players.values()) if (p.alive) this.visible.insert(p);
    for (const m of this.monsters) this.visible.insert(m);
    for (const p of this.projectiles) if (!p.scripted) this.visible.insert(p);
    for (const a of this.areas) this.visible.insert(a);
    for (const k of this.pickups) this.visible.insert(k);
  }

  // -------------------------------------------------------------------------------------------
  // What hooks can do (the Ctx calls these)

  private fail(def: { id: string }, err: unknown): void {
    if (this.disabled.has(def)) return;
    this.disabled.add(def);
    const message = `${def.id}: ${errorText(err)}`;
    this.errors.push(message);
    console.error(`content error (disabled for this match): ${message}`);
  }

  addMonster(def: MonsterDef, x: number, y: number, level = 1): SimMonster {
    const hp = def.hp * (1 + this.rules.monsterHpPerLevel * (level - 1));
    const m: SimMonster = {
      cat: 'monster',
      type: 'monster',
      id: this.ids.take(),
      kind: this.registry.kindOf.get(def)!,
      def,
      x,
      y,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: def.radius,
      hp,
      maxHp: hp,
      team: 0,
      alive: true,
      dead: false,
      // A little variety, so a crowd moving the same way doesn't move as one rigid mass.
      speed: def.speed * this.rng.range(0.9, 1.1),
      damage: def.damage,
      target: this.nearestPlayer(x, y)[0],
      retargetIn: this.rng.next() * 0.5,
      slots: [0, 0, 0, 0],
      mem: {},
      statuses: [],
      lastHitBy: 0,
      lastHitAt: -99,
      flashUntil: 0,
    };
    this.monsters.push(m);
    this.counters.monstersSpawned++;
    return m;
  }

  private addPickup(pickupId: string, x: number, y: number, value: number): void {
    const def = this.registry.pickups.get(pickupId);
    if (!def) throw new Error(`no pickup "${pickupId}"`);
    if (this.pickups.length >= this.rules.maxPickups) {
      const oldest = this.pickups.find((k) => !k.dead);
      if (oldest) oldest.dead = true;
    }
    const { width, height } = this.rules.world;
    this.pickups.push({
      cat: 'pickup',
      id: this.ids.take(),
      kind: this.registry.kindOf.get(def)!,
      def,
      x: clamp(x, def.radius, width - def.radius),
      y: clamp(y, def.radius, height - def.radius),
      angle: 0,
      radius: def.radius,
      value,
      age: 0,
      life: def.life,
      dead: false,
      slots: [0, 0, 0, 0],
      target: undefined,
      targetD2: Infinity,
    });
  }

  private addEffect(effectId: string, a: Point, b: Point, value: number): void {
    const def = this.registry.effects.get(effectId);
    if (!def) throw new Error(`no effect "${effectId}"`);
    this.events.effects.push({ kind: this.registry.effectIndex.get(def)!, ax: a.x, ay: a.y, bx: b.x, by: b.y, value: Math.round(value) });
  }

  damage(target: SimUnit, amount: number, by?: SimUnit): number {
    if (!target.alive || !(amount > 0)) return 0;
    let a = amount;
    if (target.cat === 'player') {
      if (by && by.cat === 'player') a *= this.rules.pvp.damageMul;
      a = Math.max(a * 0.25, a - target.stats.armor);
    }
    target.hp -= a;
    target.flashUntil = this.tick + 2;
    if (by && by.cat === 'player' && by !== target) {
      target.lastHitBy = by.id;
      target.lastHitAt = this.time;
    }
    this.counters.damageDealt += a;
    return a;
  }

  private strike(source: SimProjectile | SimArea, target: SimUnit): void {
    if (!target.alive) return;
    const dealt = this.damage(target, source.damage, source.owner);
    if (source.cat === 'projectile' && source.def.onHit && !this.disabled.has(source.def)) {
      try {
        source.def.onHit(this.ctx, source, target);
      } catch (err) {
        this.fail(source.def, err);
      }
    }
    const owner = source.owner;
    if (owner.cat !== 'player') return;
    const hit = { target, damage: dealt, x: target.x, y: target.y, projectile: source.cat === 'projectile' ? source : undefined, area: source.cat === 'area' ? source : undefined };
    for (const [def, held] of owner.upgrades) {
      if (!def.onHit || this.disabled.has(def)) continue;
      try {
        def.onHit(this.ctx, owner, held.level, hit);
      } catch (err) {
        this.fail(def, err);
      }
    }
  }

  /** A player's Shots stat fans every launch out into extra copies around its angle. */
  private fire(owner: SimUnit, projectileId: string, opts: LaunchOptions): void {
    const extra = owner.cat === 'player' ? owner.stats.shots : 0;
    for (let i = 0; i <= extra; i++) {
      const offset = (i - extra / 2) * SHOT_SPREAD;
      this.fireOne(owner, projectileId, offset ? { ...opts, angle: opts.angle + offset } : opts);
    }
  }

  private fireOne(owner: SimUnit, projectileId: string, opts: LaunchOptions): void {
    const def = this.registry.projectiles.get(projectileId);
    if (!def) throw new Error(`no projectile "${projectileId}"`);
    const isPlayer = owner.cat === 'player';
    // Quantized exactly as the launch travels, so the server's path() and every client's agree.
    const x = decodePos(encodePos(opts.x ?? owner.x));
    const y = decodePos(encodePos(opts.y ?? owner.y));
    const angle = decodeAngle16(encodeAngle16(opts.angle));
    const speed = Math.round((opts.speed ?? 400) * (isPlayer ? owner.stats.projectileSpeed : 1));
    const life = Math.round((opts.life ?? def.life) * 100) / 100;
    const launch = { x, y, angle, speed, seed: this.rng.int(65536), p1: Math.round(opts.p1 ?? 0), p2: Math.round(opts.p2 ?? 0) };
    const p: SimProjectile = {
      cat: 'projectile',
      id: this.ids.take(),
      kind: this.registry.kindOf.get(def)!,
      def,
      owner,
      team: owner.team,
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      angle,
      radius: def.radius,
      damage: opts.damage * (isPlayer ? owner.stats.damage : 1),
      speed,
      pierce: (opts.pierce ?? def.pierce ?? 1) + (isPlayer ? owner.stats.pierce : 0),
      life,
      age: 0,
      born: this.tick,
      launch,
      scripted: !def.step,
      hits: new Set(),
      dead: false,
      slots: [0, 0, 0, 0],
      mem: {},
    };
    this.projectiles.push(p);
    this.counters.projectilesFired++;
    if (p.scripted) this.events.launches.push(p);
  }

  private area(owner: SimUnit, areaId: string, opts: AreaOptions = {}): void {
    const def = this.registry.areas.get(areaId);
    if (!def) throw new Error(`no area "${areaId}"`);
    const isPlayer = owner.cat === 'player';
    this.areas.push({
      cat: 'area',
      id: this.ids.take(),
      kind: this.registry.kindOf.get(def)!,
      def,
      owner,
      team: owner.team,
      x: opts.x ?? owner.x,
      y: opts.y ?? owner.y,
      vx: 0,
      vy: 0,
      angle: 0,
      radius: (opts.radius ?? def.radius) * (isPlayer ? owner.stats.area : 1),
      damage: (opts.damage ?? 0) * (isPlayer ? owner.stats.damage : 1),
      life: opts.life ?? def.life,
      age: 0,
      timer: 0,
      follow: opts.follow ?? def.follow ?? false,
      dead: false,
      slots: [0, 0, 0, 0],
      mem: {},
    });
  }

  private makeCtx(): Ctx {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const match = this;
    // Hooks get the API types; underneath they are always this match's Sim objects.
    const unit = (u: Unit): SimUnit => u as SimUnit;
    const enemiesNear = (of: { team: number }, x: number, y: number, radius: number): Unit[] => {
      const out: Unit[] = [];
      this.units.each(x, y, radius + this.maxUnitRadius, (u) => {
        if (!u.alive || u.team === of.team) return;
        const r = radius + u.radius;
        if ((u.x - x) ** 2 + (u.y - y) ** 2 <= r * r) out.push(u);
      });
      return out;
    };
    return {
      get time() {
        return match.time;
      },
      rng: this.rng,
      rules: this.rules,
      isEnemy: (a, b) => a.team !== b.team,
      nearestEnemy: (of, range) => {
        let best: Unit | undefined;
        let bestD2 = range * range;
        this.units.each(of.x, of.y, range, (u) => {
          if (!u.alive || u.team === of.team) return;
          const d2 = (u.x - of.x) ** 2 + (u.y - of.y) ** 2;
          if (d2 <= bestD2) {
            best = u;
            bestD2 = d2;
          }
        });
        return best;
      },
      enemiesNear,
      unitsNear: (x, y, radius) => {
        const out: Unit[] = [];
        this.units.each(x, y, radius + this.maxUnitRadius, (u) => {
          const r = radius + u.radius;
          if (u.alive && (u.x - x) ** 2 + (u.y - y) ** 2 <= r * r) out.push(u);
        });
        return out;
      },
      fire: (owner, projectileId, opts) => this.fire(unit(owner), projectileId, opts),
      area: (owner, areaId, opts) => this.area(unit(owner), areaId, opts),
      damage: (target, amount, by) => this.damage(unit(target), amount, by ? unit(by) : undefined),
      strike: (source: Projectile | Area, target) => this.strike(source as SimProjectile | SimArea, unit(target)),
      heal: (target, amount) => {
        const t = unit(target);
        if (t.alive && amount > 0) t.hp = Math.min(t.maxHp, t.hp + amount);
      },
      addStatus: (target, statusId, seconds, stacks = 1) => {
        const def = this.registry.statuses.get(statusId);
        if (!def) throw new Error(`no status "${statusId}"`);
        const t = unit(target);
        if (!t.alive) return;
        const max = def.maxStacks ?? 1;
        const held = t.statuses.find((s) => s.def === def);
        if (held) {
          held.left = Math.max(held.left, seconds);
          held.stacks = Math.min(max, held.stacks + stacks);
        } else {
          t.statuses.push({ def, index: this.registry.statusIndex.get(def)!, stacks: Math.min(max, stacks), left: seconds });
        }
      },
      statusOf: (target, statusId) => unit(target).statuses.find((s) => s.def.id === statusId)?.stacks ?? 0,
      effect: (effectId, a, b, value = 0) => this.addEffect(effectId, a, b ?? a, value),
      players: () => [...this.players.values()].filter((p) => p.alive),
      playerById: (id) => {
        const p = this.players.get(id);
        return p?.alive ? p : undefined;
      },
      spawnMonster: (monsterId, x, y) => {
        const def = this.registry.monsters.get(monsterId);
        if (!def) throw new Error(`no monster "${monsterId}"`);
        const { width, height } = this.rules.world;
        return this.addMonster(def, clamp(x, def.radius, width - def.radius), clamp(y, def.radius, height - def.radius));
      },
      dropPickup: (pickupId, x, y, value) => this.addPickup(pickupId, x, y, value),
      giveXp: (player, amount) => this.giveXp(player as SimPlayer, amount),
      giveCoins: (player, amount) => {
        const p = player as SimPlayer;
        const n = Math.floor(amount);
        if (!p.bot && n > 0) p.coins = Math.min(0xffffffff, p.coins + n);
      },
      givePoints: (player, amount) => this.givePoints(player as SimPlayer, amount),
    };
  }
}
