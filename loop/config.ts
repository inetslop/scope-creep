import fs from 'node:fs';
import path from 'node:path';
import { AGENT_DIR, AGENTS_DIR } from './paths.ts';
import type { TaskSize } from './tasks.ts';

/** One machine in the fleet (agents/machines.json, committed, human-owned). */
export interface MachineConfig {
  label: string;
  model: string;
  roles: ('po' | 'dev')[];
  /** Free-form capability tier shown to the PO, e.g. "strong" / "fast" / "weak". */
  tier: string;
  /** Biggest task size the PO may assign to this machine. */
  maxTaskSize: TaskSize;
  /** The PO keeps this many todo tasks queued for the machine. */
  targetQueue: number;
  /** Shown to the PO verbatim: strengths, weaknesses, what to assign. */
  notes: string;
}

export interface SizeLimits {
  maxTurns: number;
  timeoutMin: number;
}

export interface FleetConfig {
  machines: Record<string, MachineConfig>;
  sizes: Record<TaskSize, SizeLimits>;
  loop: {
    pollSeconds: number;
    /** Attempts per task (across machines restarts) before it is marked failed. */
    maxAttempts: number;
    /** How many times the dev agent gets the failing output back to fix it. */
    fixRounds: number;
    /** Run a fresh-context self-review pass before pushing. */
    review: boolean;
    reviewMaxTurns: number;
    poMaxTurns: number;
    poTimeoutMin: number;
    /** Never run the PO more often than this. */
    poMinGapMinutes: number;
    /** Always run the PO at least this often (to keep the scope creeping). */
    poMaxGapMinutes: number;
    smokeSeconds: number;
  };
}

/** Per-machine settings written by setup/setup.ps1 to .agent/local.json (git-ignored). */
export interface LocalConfig {
  machineId: string;
  /** Path to claude.exe. */
  claudePath: string;
  llama: {
    /** managed: the runner starts llama-server itself. external: something else serves the model. */
    mode: 'managed' | 'external';
    baseUrl: string;
    /** Model id sent to the server (llama-server --alias). */
    model: string;
    authToken: string;
    /**
     * Context window in tokens. 0 or missing = auto: llama-server picks the largest context
     * that fits in memory (--fit), and the runner asks the server for the real value before
     * every agent session (see detectContextSize). A number forces `-c N`.
     */
    ctxSize?: number;
    serverPath?: string;
    modelPath?: string;
    /** Folder setup searched for models (remembered for re-runs). */
    modelsDir?: string;
    /** Extra llama-server args, e.g. ["--temp", "0.6"]. */
    extraArgs?: string[];
  };
}

export const LOCAL_CONFIG_FILE = path.join(AGENT_DIR, 'local.json');
const FLEET_FILE = path.join(AGENTS_DIR, 'machines.json');

export function loadLocalConfig(): LocalConfig {
  if (!fs.existsSync(LOCAL_CONFIG_FILE)) {
    throw new Error(`Missing ${LOCAL_CONFIG_FILE}. Run setup\\setup.ps1 on this machine first.`);
  }
  const cfg = JSON.parse(fs.readFileSync(LOCAL_CONFIG_FILE, 'utf8').replace(/^﻿/, '')) as LocalConfig;
  if (!cfg.machineId || !cfg.claudePath || !cfg.llama?.baseUrl) throw new Error(`${LOCAL_CONFIG_FILE} is incomplete; re-run setup.`);
  return cfg;
}

/** Re-read every cycle, so edits to agents/machines.json apply without a restart. */
export function loadFleet(): FleetConfig {
  return JSON.parse(fs.readFileSync(FLEET_FILE, 'utf8')) as FleetConfig;
}

export function poMachineId(fleet: FleetConfig): string | undefined {
  return Object.entries(fleet.machines).find(([, m]) => m.roles.includes('po'))?.[0];
}

export function devMachineIds(fleet: FleetConfig): string[] {
  return Object.entries(fleet.machines)
    .filter(([, m]) => m.roles.includes('dev'))
    .map(([id]) => id);
}

export const SIZE_ORDER: Record<TaskSize, number> = { S: 1, M: 2, L: 3 };
