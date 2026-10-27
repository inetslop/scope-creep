import fs from 'node:fs';
import path from 'node:path';
import { AGENT_DIR, AGENTS_DIR } from './paths.ts';
import type { TaskSize } from './tasks.ts';

/** What a machine does: plan (po), design tasks (architect), implement them (dev). */
export type Role = 'po' | 'architect' | 'dev';

/**
 * Reasoning effort passed to the model's chat template as `reasoning_effort`.
 * Qwen 3.8 supports exactly low, medium and xhigh ("high" is an alias of xhigh;
 * anything else makes the template throw). Check the template before using other models.
 */
export type Effort = 'low' | 'medium' | 'high' | 'xhigh';

/**
 * Sampling settings the shim sends with every model request; llama.cpp applies them per request,
 * over its startup defaults. loop.sampling is the fleet default; a machine's `sampling` overrides
 * single keys. Only these three: llama.cpp's /v1/messages endpoint (the one Claude Code uses) takes
 * the Anthropic API's sampling fields and drops the rest, so presence_penalty and min_p have to be
 * llama-server start-up arguments (`--presence-penalty 1.0`) in the machine's local config.
 */
export interface Sampling {
  temperature?: number;
  top_p?: number;
  top_k?: number;
}

/** The sampling fields llama.cpp honours on /v1/messages (checked against a live server). */
export const REQUEST_SAMPLING_KEYS = ['temperature', 'top_p', 'top_k'] as const;

/** One machine in the fleet (agents/machines.json, committed, human-owned). */
export interface MachineConfig {
  label: string;
  model: string;
  roles: Role[];
  /** Free-form capability tier shown to the PO, e.g. "strong" / "fast" / "weak". */
  tier: string;
  /** Biggest task size the PO may assign to this machine. */
  maxTaskSize: TaskSize;
  /** The PO keeps this many todo tasks queued for the machine. */
  targetQueue: number;
  /** Shown to the PO verbatim: strengths, weaknesses, what to assign. */
  notes: string;
  /** Per-machine override of loop.effort, e.g. { "dev": "medium" } for a weak machine. */
  effort?: Partial<Record<Role, Effort>>;
  /**
   * For machines with the architect role: "always" designs every iteration (up to
   * loop.architectMaxPerPass); "idle" designs one task at a time, own tasks first, only
   * when the machine has nothing ready to build. Default "always".
   */
  architectMode?: 'always' | 'idle';
  /**
   * For machines with the dev role: "always" builds a task every iteration (after planning and
   * designing); "idle" builds only when the iteration had nothing to plan or design, so a
   * PO/architect machine does that full time and develops in its downtime. "idle" makes the
   * architect role full time too (architectMode is then ignored). Default "always".
   */
  devMode?: 'always' | 'idle';
  /**
   * For machines with the architect role: the biggest task size it designs (default L: all).
   * Bigger architects leave tasks this size and smaller to it for loop.designGraceMinutes, so a
   * strong machine spends its time on big work and a small one designs the small tasks.
   */
  maxDesignSize?: TaskSize;
  /** Overrides loop.sampling key by key for this machine. */
  sampling?: Sampling;
  /**
   * Takes the machine out of the loop, e.g. while it's down: its runner keeps syncing but starts
   * no model server and does no work, and nobody plans, designs or assigns anything for it. Move
   * its open tasks to another machine's folder when pausing it. Default false.
   */
  paused?: boolean;
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
    architectMaxTurns: number;
    architectTimeoutMin: number;
    /** Designs per runner iteration, so the architect machine still gets to develop (or, as an idle dev, to plan). */
    architectMaxPerPass: number;
    /** Design attempts before a task is failed back to the PO. */
    architectMaxAttempts: number;
    /**
     * How long a bigger architect leaves a task to an architect whose maxDesignSize covers it,
     * before designing it itself (so small tasks never get stuck behind a busy small machine). Default 20.
     */
    designGraceMinutes?: number;
    smokeSeconds: number;
    /** Reasoning effort per role (see Effort). */
    effort: Record<Role, Effort>;
    /** Sampling sent with every request (see Sampling). Unset keys use the model server's defaults. */
    sampling?: Sampling;
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

/** Machines taking part in the loop (not `paused`). */
function activeMachines(fleet: FleetConfig): [string, MachineConfig][] {
  return Object.entries(fleet.machines).filter(([, m]) => !m.paused);
}

export function poMachineId(fleet: FleetConfig): string | undefined {
  return activeMachines(fleet).find(([, m]) => m.roles.includes('po'))?.[0];
}

/** True if some machine designs tasks; otherwise PO tasks go straight to the devs. */
export function hasArchitect(fleet: FleetConfig): boolean {
  return activeMachines(fleet).some(([, m]) => m.roles.includes('architect'));
}

export function samplingFor(fleet: FleetConfig, machineId: string): Sampling {
  return { ...fleet.loop.sampling, ...fleet.machines[machineId]?.sampling };
}

export function effortFor(fleet: FleetConfig, machineId: string, role: Role): Effort {
  return fleet.machines[machineId]?.effort?.[role] ?? fleet.loop.effort[role];
}

/** Active machines that design tasks. */
export function architectMachineIds(fleet: FleetConfig): string[] {
  return activeMachines(fleet)
    .filter(([, m]) => m.roles.includes('architect'))
    .map(([id]) => id);
}

/** Machines the PO plans for: dev role, not paused. */
export function devMachineIds(fleet: FleetConfig): string[] {
  return activeMachines(fleet)
    .filter(([, m]) => m.roles.includes('dev'))
    .map(([id]) => id);
}

export const SIZE_ORDER: Record<TaskSize, number> = { S: 1, M: 2, L: 3 };
