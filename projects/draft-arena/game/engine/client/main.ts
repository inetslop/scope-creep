/**
 * The browser entry: the start menu, a session, and the frame loop that samples input, steps the
 * session, draws and updates the HUD. Play goes online; bots fill the match to rules.bots.fillTo.
 * A page built without a server (VITE_SERVER_URL) plays the same match against bots in this tab.
 *
 * URL flags: ?offline plays in this tab at once; ?smoke is that for the smoke test (?seed=N fixes
 * the match); ?server=wss://host picks a server; ?lag=100 adds delay to the in-tab match (ms).
 *
 * Built for a server that serves the page itself (deploy/arena): VITE_SERVER_URL=same-origin, and
 * VITE_BUILD_ID set to the server's BUILD_ID, so a page from an older deploy reloads.
 */
// The Critters type face, bundled so the game never needs the network for it.
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import type { HudScore, HudTree, HudView, UpgradeDef } from '../api.ts';
import { DEFAULT_PORT } from '../config.ts';
import { buildRegistry } from '../registry.ts';
import type { WireSelf } from '../shared/protocol.ts';
import { canTake, missingFor, spentIn } from '../talents.ts';
import { CONTENT } from '../../src/content/index.ts';
import { HUD_PARTS } from '../../src/hud/index.ts';
import { MENU_PARTS } from '../../src/menu/index.ts';
import { HudHost } from './hud.ts';
import { Input } from './input.ts';
import { Menu } from './menu.ts';
import { ProfileStore } from './profile.ts';
import { Renderer } from './render.ts';
import { Session, type Frame } from './session.ts';
import { localServer, webSocket } from './socket.ts';
import { installTestHook } from './testHook.ts';

const registry = buildRegistry(CONTENT, import.meta.env.VITE_BUILD_ID ?? '');
// Canvas text doesn't make the browser fetch a font: ask for the faces the renderer uses.
document.fonts?.load('600 14px Fredoka').catch(() => undefined);
const rules = CONTENT.rules;
const params = new URLSearchParams(location.search);
const smoke = params.has('smoke');
const hook = installTestHook();

const sameOrigin = `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}`;
const builtFor = import.meta.env.VITE_SERVER_URL === 'same-origin' ? sameOrigin : import.meta.env.VITE_SERVER_URL;
const serverUrl = params.get('server') || builtFor || (import.meta.env.DEV ? `ws://${location.hostname}:${DEFAULT_PORT}` : undefined);

const canvas = document.getElementById('world') as HTMLCanvasElement;
const renderer = new Renderer(canvas, registry);
const input = new Input(canvas);
const hud = new HudHost(document.getElementById('hud')!, HUD_PARTS);
const profile = new ProfileStore(registry);
const menu = new Menu(document.getElementById('menu')!, (name) => start(serverUrl ? 'online' : 'offline', name), registry, profile, MENU_PARTS);
let session: Session | undefined;

/**
 * Behind the start screen: the match as it is, watched as a spectator (the camera follows the
 * leader). Without a server, or when it can't be reached, a match of bots in this tab instead.
 */
let background: Session | undefined;
function watch(where: 'online' | 'offline'): void {
  background?.close();
  if (where === 'online' && serverUrl) {
    background = new Session(registry, () => webSocket(serverUrl), '', 'online', true);
  } else {
    const local = localServer(registry, Date.now() & 0x7fffffff);
    background = new Session(registry, () => local.connect(), '', 'offline', true);
  }
}
function showMenu(message = ''): void {
  menu.show(message);
  watch(serverUrl ? 'online' : 'offline');
}

/**
 * The watched match closed. The server runs a newer build: reload the page (at most once per 30 s,
 * so a mismatch that a reload can't fix never loops). It went away (a restart for a deploy): watch
 * bots in the tab, and look for it again in 5 s, which finds the new build and reloads. It was
 * never reached: bots in the tab.
 */
let retryOnline: ReturnType<typeof setTimeout> | undefined;
function backgroundClosed(b: Session): void {
  if (b.outdated && reloadOnce()) return;
  const wasLive = b.mode === 'online' && !!b.welcome && !b.outdated;
  watch('offline');
  if (wasLive) {
    clearTimeout(retryOnline);
    retryOnline = setTimeout(() => {
      if (!session && background?.mode === 'offline') watch('online');
    }, 5000);
  }
}

function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem('draft-arena-reload')) || 0;
    if (Date.now() - last < 30_000) return false;
    sessionStorage.setItem('draft-arena-reload', String(Date.now()));
  } catch {
    return false;
  }
  location.reload();
  return true;
}

/** What you look like, from the profile: sent when joining. */
const look = (): { color: number | undefined; wear: ReturnType<ProfileStore['wire']> } => ({ color: profile.profile.color, wear: profile.wire() });

function start(mode: 'online' | 'offline', name: string): void {
  menu.hide();
  background?.close();
  background = undefined;
  if (mode === 'online' && serverUrl) {
    session = new Session(registry, () => webSocket(serverUrl), name, 'online', false, look());
  } else {
    const seed = Number(params.get('seed')) || (Date.now() & 0x7fffffff);
    const local = localServer(registry, seed, Number(params.get('lag')) || 0);
    session = new Session(registry, () => local.connect(), name, 'offline', false, look());
  }
}

// Esc leaves the match for the start screen (the talents panel takes Esc first while it is open).
input.onLeave = () => {
  if (!session || smoke) return;
  session.close();
  session = undefined;
  showMenu();
};

/** Every tree and where you stand with each talent in it. Rebuilt only when a new snapshot arrives. */
let treeCache: { self: WireSelf; trees: HudTree[] } | undefined;
function treesOf(self: WireSelf): HudTree[] {
  if (treeCache?.self === self) return treeCache.trees;
  const ranks = new Map(self.talents.flatMap((t) => (registry.talentList[t.index] ? [[registry.talentList[t.index]!, t.rank] as const] : [])));
  const levels = new Map<UpgradeDef, number>(self.upgrades.flatMap((u) => (upgradeDefs[u.index] ? [[upgradeDefs[u.index]!, u.level] as const] : [])));
  const rankOf = (t: (typeof registry.talentList)[number]): number => ranks.get(t) ?? 0;
  const levelOf = (u: UpgradeDef): number => levels.get(u) ?? 0;
  const trees = CONTENT.trees.map((def): HudTree => ({
    def,
    spent: spentIn(def, rankOf),
    talents: def.talents.map((t) => {
      const upgrade = registry.upgrades.get(t.upgrade)!;
      const missing = missingFor(registry, t, rankOf, self.prestige);
      const rank = rankOf(t);
      const state = missing.length ? 'locked' : rank >= t.max || levelOf(upgrade) >= upgrade.maxLevel ? 'maxed' : self.alive && self.pendingPicks > 0 && canTake(registry, t, rankOf, levelOf, self.prestige) ? 'can' : 'open';
      return { def: t, upgrade, rank, state, missing };
    }),
  }));
  treeCache = { self, trees };
  return trees;
}

const upgradeDefs = CONTENT.upgrades;

function hudView(s: Session): HudView {
  const colors = rules.playerColors;
  const myId = s.welcome?.playerId;
  const colorOf = (id: number): string => colors[(s.roster.get(id)?.color ?? 0) % colors.length]!;
  const self = s.self;
  const me =
    self && myId !== undefined
      ? {
          name: s.roster.get(myId)?.name ?? '',
          color: colorOf(myId),
          alive: self.alive,
          hp: self.hp,
          maxHp: self.maxHp,
          level: self.level,
          xp: self.xp,
          xpNext: self.xpNext,
          kills: self.kills,
          score: self.score,
          respawnIn: self.respawnIn,
          pendingPicks: self.pendingPicks,
          prestige: self.prestige,
          coins: profile.profile.coins,
          trees: treesOf(self),
          upgrades: self.upgrades.flatMap((u) => (upgradeDefs[u.index] ? [{ def: upgradeDefs[u.index]!, level: u.level }] : [])),
        }
      : undefined;
  const scores: HudScore[] = s.scores
    .map((sc) => ({ name: s.roster.get(sc.id)?.name ?? '?', color: colorOf(sc.id), score: sc.score, level: sc.level, kills: sc.kills, prestige: sc.prestige, me: sc.id === myId, bot: s.roster.get(sc.id)?.bot ?? false }))
    .sort((a, b) => b.score - a.score);
  const status = s.state === 'connecting' ? 'Connecting…' : s.state === 'reconnecting' ? 'Reconnecting…' : '';
  return {
    mode: s.mode,
    status,
    touch: input.touch,
    me,
    scores,
    playerCount: s.roster.size,
    pick: (id) => {
      const t = registry.talents.get(id);
      if (t) s.pick(registry.talentIndex.get(t)!);
    },
  };
}

const IDLE = { moveX: 0, moveY: 0, aim: 0, buttons: 0 };
let last = performance.now();
let missingFrames = 0;
let lastFrame: Frame | undefined;

function frame(now: number): void {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  let f: Frame | undefined;
  if (session) {
    const inp = input.sample({ x: canvas.clientWidth / 2, y: canvas.clientHeight / 2 });
    f = session.update(dt, inp, performance.now());
    // Coins and prestiges the server gave you go into the profile at once.
    profile.addEarnings(session.takeEarnings());
    if (session.state === 'closed') {
      const reason = session.reason;
      session = undefined;
      f = undefined;
      showMenu(reason);
    }
  } else if (background) {
    f = background.update(dt, IDLE, performance.now());
    if (background.state === 'closed') backgroundClosed(background);
  }
  renderer.draw(f, (session ?? background)?.roster ?? new Map(), session ? input.joystick : undefined, rules.ground);
  hud.show(!!session);
  if (session) hud.update(hudView(session));

  const s = session;
  lastFrame = f;
  missingFrames = s?.state === 'playing' && s.self?.alive && f && !f.entities.some((e) => e.me) ? missingFrames + 1 : 0;
  hook.scene = s?.state === 'playing' && s.self ? 'Game' : 'Menu';
  hook.frame++;
  hook.ready = true;
  if (s) {
    hook.stats = {
      ...s.stats,
      level: s.self?.level ?? 0,
      kills: s.self?.kills ?? 0,
      score: s.self?.score ?? 0,
      players: s.roster.size,
      enemiesAlive: s.stats.monstersInView,
    };
  }
  requestAnimationFrame(frame);
}

hook.invariants = () => {
  const out: string[] = [];
  if (missingFrames > 120) out.push('the server says you are alive, but your player has been missing from the snapshots for 2 seconds');
  if (lastFrame && (!Number.isFinite(lastFrame.camX) || !Number.isFinite(lastFrame.camY))) out.push('the camera position is not a number');
  return out;
};

if (smoke) start('offline', 'Smoke');
else if (params.has('offline')) start('offline', '');
else showMenu();
requestAnimationFrame(frame);
