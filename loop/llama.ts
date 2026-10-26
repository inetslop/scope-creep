import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { LocalConfig } from './config.ts';
import { sleep } from './exec.ts';
import { info, warn } from './log.ts';
import { AGENT_DIR, LOG_DIR } from './paths.ts';

const PID_FILE = path.join(AGENT_DIR, 'llama-server.pid');
const LOAD_TIMEOUT_MS = 20 * 60_000;
/** Claude Code's system prompt + tools alone take ~20k tokens; below this agents can't work. */
export const MIN_CONTEXT = 32_768;

const baseUrl = (local: LocalConfig): string => local.llama.baseUrl.replace(/\/+$/, '');

async function get(url: string, token: string): Promise<Response | undefined> {
  try {
    return await fetch(url, { headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(5000) });
  } catch {
    return undefined;
  }
}

async function getJson(url: string, token: string): Promise<unknown> {
  const res = await get(url, token);
  if (!res?.ok) return undefined;
  try {
    return await res.json();
  } catch {
    return undefined;
  }
}

/** True when the model server answers and has finished loading the model. */
export async function isHealthy(local: LocalConfig): Promise<boolean> {
  const health = await get(`${baseUrl(local)}/health`, local.llama.authToken);
  if (health?.status === 200) return true;
  if (health?.status === 503) return false; // llama-server: still loading the model
  return (await get(`${baseUrl(local)}/v1/models`, local.llama.authToken))?.status === 200;
}

/**
 * The context window the server is ACTUALLY running with, so Claude Code compacts in time.
 * llama-server: /slots (per-request limit) or /props. Ollama: /api/ps. Otherwise the configured value.
 */
export async function detectContextSize(local: LocalConfig): Promise<number> {
  const token = local.llama.authToken;
  const slots = await getJson(`${baseUrl(local)}/slots`, token);
  if (Array.isArray(slots)) {
    const n = Number((slots[0] as { n_ctx?: number } | undefined)?.n_ctx);
    if (n > 0) return n;
  }
  const props = (await getJson(`${baseUrl(local)}/props`, token)) as { default_generation_settings?: { n_ctx?: number } } | undefined;
  const fromProps = Number(props?.default_generation_settings?.n_ctx);
  if (fromProps > 0) return fromProps;
  const ps = (await getJson(`${baseUrl(local)}/api/ps`, token)) as { models?: { name?: string; model?: string; context_length?: number }[] } | undefined;
  const loaded = ps?.models?.find((m) => m.name === local.llama.model || m.model === local.llama.model);
  if (loaded?.context_length) return loaded.context_length;
  return local.llama.ctxSize || MIN_CONTEXT;
}

function pidAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function startServer(local: LocalConfig): void {
  const { serverPath, modelPath } = local.llama;
  if (!serverPath || !modelPath) throw new Error('llama.mode is "managed" but serverPath/modelPath are missing in .agent/local.json');
  const url = new URL(local.llama.baseUrl);
  const extra = local.llama.extraArgs ?? [];
  const ctxArgs = local.llama.ctxSize
    ? ['-c', String(local.llama.ctxSize)]
    : // Auto: no -c, so llama-server starts from the model's max context and --fit shrinks it to
      // what fits in memory, but never below what Claude Code needs.
      extra.some((a) => a === '-fitc' || a === '--fit-ctx')
      ? []
      : ['--fit-ctx', String(MIN_CONTEXT)];
  const args = ['-m', modelPath, '--alias', local.llama.model, '--host', url.hostname, '--port', url.port || '8080', ...ctxArgs, ...extra];
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const out = fs.openSync(path.join(LOG_DIR, 'llama-server.log'), 'a');
  // Detached so the model stays loaded when the runner restarts itself.
  const child = spawn(serverPath, args, { detached: true, stdio: ['ignore', out, out], windowsHide: true });
  child.unref();
  fs.writeFileSync(PID_FILE, String(child.pid ?? ''));
  info(`started llama-server (pid ${child.pid}): ${path.basename(modelPath)}, context ${local.llama.ctxSize || 'auto'}`);
}

/** Makes sure the model server is up, starting it if we manage it. Returns false if it never became healthy. */
export async function ensureLlama(local: LocalConfig): Promise<boolean> {
  if (await isHealthy(local)) return true;
  if (local.llama.mode !== 'managed') {
    warn(`model server at ${local.llama.baseUrl} is not answering (external mode, not starting it)`);
    return false;
  }
  const pid = fs.existsSync(PID_FILE) ? Number(fs.readFileSync(PID_FILE, 'utf8')) : 0;
  if (!pid || !pidAlive(pid)) startServer(local);
  else info(`waiting for llama-server (pid ${pid}) to finish loading…`);
  const deadline = Date.now() + LOAD_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(5000);
    if (await isHealthy(local)) {
      info(`model server is ready (context ${await detectContextSize(local)} tokens)`);
      return true;
    }
    const current = Number(fs.readFileSync(PID_FILE, 'utf8'));
    if (!pidAlive(current)) {
      warn('llama-server exited while loading; see .agent/logs/llama-server.log');
      return false;
    }
  }
  return false;
}
