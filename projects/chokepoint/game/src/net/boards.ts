import { flags } from '../debug/flags';

/**
 * The leaderboard client: today's board (each name's best run of the last 24 hours) and the
 * forever board, kept by a small server (leaderboard/ at the repo root, a Cloudflare Worker).
 * Its address comes from the build (VITE_BOARDS_URL); without one, and always in ?smoke mode,
 * the boards are off: no button, no submission, no network (boardsOn).
 */

const BASE = String(import.meta.env.VITE_BOARDS_URL ?? '').replace(/\/+$/, '');
const TIMEOUT_MS = 6000;

/** The boards are on: the build names a server, and this is not the smoke test. */
export const boardsOn = (): boolean => BASE !== '' && !flags.smoke;

export interface BoardEntry {
  rank: number;
  name: string;
  score: number;
  waves: number;
  /** The run's level-augment multiplier; older boards don't echo it, and 1 wears no tag. */
  mul?: number;
}

export type BoardName = 'today' | 'forever';

export interface Board {
  board: BoardName;
  total: number;
  entries: BoardEntry[];
  /** The asked-for name's place, when it is on this board. */
  me: (BoardEntry & { name: string }) | null;
}

export interface Place {
  rank: number;
  total: number;
  /** The name's best score on that board (this run's, or a better earlier one). */
  score: number;
  /** This run is the name's best on that board. */
  best: boolean;
}

export interface Submitted {
  today: Place;
  forever: Place;
}

/** A run as the server takes it: the score is computed there from waves and kills. */
export interface RunForBoards {
  name: string;
  waves: number;
  kills: number;
  seed: number;
  /** The run's level-augment multiplier: the score it wears on the board (1 with none on). */
  mul: number;
}

/** Why a call failed: the server refused the name, a rate limit, or anything else (offline, server down). */
export type BoardError = 'name' | 'rate' | 'offline';

async function call<T>(path: string, init?: RequestInit): Promise<T | BoardError> {
  if (!boardsOn()) return 'offline';
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE}${path}`, { ...init, signal: abort.signal });
    if (res.status === 429) return 'rate';
    const body = (await res.json()) as T & { error?: string };
    if (!res.ok) return body.error === 'name' ? 'name' : 'offline';
    return body;
  } catch {
    return 'offline';
  } finally {
    clearTimeout(timer);
  }
}

/** The top of a board, and `me`'s place on it. */
export function fetchBoard(which: BoardName, me: string): Promise<Board | BoardError> {
  const q = new URLSearchParams({ b: which, limit: '10' });
  if (me) q.set('me', me);
  return call<Board>(`/board?${q.toString()}`);
}

/** Posts a finished run. Sent as text/plain so the browser needs no preflight request. */
export function submitRun(run: RunForBoards): Promise<Submitted | BoardError> {
  return call<Submitted>('/submit', { method: 'POST', headers: { 'Content-Type': 'text/plain' }, body: JSON.stringify(run) });
}

export const isBoardError = (v: unknown): v is BoardError => typeof v === 'string';
