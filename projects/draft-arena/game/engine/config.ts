/**
 * Engine constants. The network format, the tick loop and the camera depend on these, so they live
 * in the engine (owner-only), not in content. Gameplay numbers are in src/content/rules.ts.
 */

/** Bumped whenever the binary format changes: a client and server with different versions refuse each other. */
export const PROTOCOL_VERSION = 5;

/** Simulation steps (and snapshots) per second. */
export const TICK_RATE = 20;
export const TICK_DT = 1 / TICK_RATE;
export const TICK_MS = 1000 / TICK_RATE;

/** Positions travel as uint16 of (x * POS_SCALE): quarter-unit precision, worlds up to MAX_WORLD units. */
export const POS_SCALE = 4;
export const MAX_WORLD = Math.floor(65535 / POS_SCALE);

/**
 * World area on screen (units²): the camera shows about this much at any screen shape. Close enough
 * that a critter's face reads on a phone; the farthest visible point stays inside spawn.minDistance
 * (half-diagonal ~690 at 16:9, ~740 on a phone in portrait), so monsters still arrive from off-screen.
 */
export const VIEW_AREA = 1250 * 700;

/**
 * How far from a player the server sends entities. Covers the view at every screen shape (the
 * half-diagonal is ~860 at 16:9 and ~920 on a phone in portrait) plus a margin.
 */
export const INTEREST_RADIUS = 1150;

/** Path projectiles and effects are announced a bit further out, so ones flying into view are already known. */
export const EVENT_RADIUS = INTEREST_RADIUS + 400;

/** Humans in one match. Bots don't count. */
export const MAX_PLAYERS = 60;

/** Generic synced numbers per entity that content may set (whole numbers, -32768..32767). */
export const SLOT_COUNT = 4;

/** Statuses sent per entity (the rest still apply on the server, they just aren't drawn). */
export const MAX_STATUSES_SENT = 4;

/** Other entities are drawn this far in the past, so there is a snapshot on each side to interpolate between. */
export const INTERP_DELAY_MS = 110;

/** How long a disconnected player stays in the match, waiting for the same client to reconnect. */
export const RECONNECT_GRACE_S = 30;

/** Skip snapshots to a client whose socket has this much unsent data (a slow connection catches up instead of piling up). */
export const MAX_BACKLOG_BYTES = 256 * 1024;

/** Not 8787: that is wrangler's (Cloudflare Workers) default, often already running on the same machine. */
export const DEFAULT_PORT = 8790;

/** What the load test (engine/tests/load.test.ts) allows with 60 players in one match. */
export const BUDGET = {
  /** Snapshot bytes one player receives per second (~0.36 Mbit/s; 60 players ≈ 22 Mbit/s of upload). */
  bytesPerPlayerPerSecond: 45_000,
  /** Mean simulation time per tick. The tick has 50 ms; this leaves room for slow machines and sending. */
  meanTickMs: 20,
};
