import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import type { LocalConfig } from './config.ts';
import { sleep } from './exec.ts';
import { gpuPlan, readGguf, type GpuPlan } from './gguf.ts';
import { info, warn } from './log.ts';
import { AGENT_DIR, LOG_DIR } from './paths.ts';

const PID_FILE = path.join(AGENT_DIR, 'llama-server.pid');
const LOAD_TIMEOUT_MS = 20 * 60_000;
/** Claude Code's system prompt + tools alone take ~20k tokens; below this agents can't work. */
export const MIN_CONTEXT = 32_768;
/** VRAM left free for the desktop and allocation spikes when the runner places the model. */
const GPU_MARGIN_MIB = 640;
/** llama-server flags that decide where the model goes: in extraArgs, the machine's config has the say. */
const PLACEMENT_FLAGS = new Set(['-ngl', '--gpu-layers', '--n-gpu-layers', '-ot', '--override-tensor', '-fit', '--fit', '-cmoe', '--cpu-moe', '-ncmoe', '--n-cpu-moe']);

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

/**
 * Where the model goes for the VRAM free now, as setup/docker/llama-start.sh does for the Docker
 * agent: all of it on the GPU if it fits, else just enough of the largest feed-forward weights on the
 * CPU. Undefined when even all of them there would not make room (llama.cpp's --fit decides then).
 */
export function gpuPlacement(plan: GpuPlan, freeMib: number, marginMib: number): { args: string[]; cpuBlocks: number[]; cpuMib: number } | undefined {
  const spill = plan.needMib + marginMib - freeMib;
  const cpuBlocks: number[] = [];
  let cpuMib = 0;
  for (const [block, mib] of plan.ffn) {
    if (cpuMib >= spill) break;
    cpuBlocks.push(block);
    cpuMib += mib;
  }
  if (cpuMib < spill) return undefined;
  const args = ['--fit', 'off', '-ngl', '99'];
  if (cpuBlocks.length) args.push('-ot', `^blk\\.(${cpuBlocks.join('|')})\\.ffn_(up|gate|down)\\.weight$=CPU`);
  return { args, cpuBlocks, cpuMib };
}

/**
 * With a fixed context and one NVIDIA GPU, the llama-server arguments that keep every layer and the
 * whole context cache on the GPU (gpuPlacement). llama.cpp's own --fit moves whole layers, cache
 * included, which is far slower. Undefined, so --fit decides, with auto context, placement flags in
 * extraArgs, a context cache other than q8_0/q4_0, no or several NVIDIA GPUs, or too little VRAM.
 */
function placeModel(local: LocalConfig): string[] | undefined {
  const { ctxSize, modelPath, extraArgs = [] } = local.llama;
  if (!ctxSize || !modelPath || extraArgs.some((a) => PLACEMENT_FLAGS.has(a))) return undefined;
  const k = extraArgs.findIndex((a) => a === '-ctk' || a === '--cache-type-k');
  const cache = k >= 0 ? extraArgs[k + 1] : 'f16';
  if (cache !== 'q8_0' && cache !== 'q4_0') {
    info(`context cache ${cache}: llama.cpp's --fit places the model (the runner plans for q8_0 and q4_0)`);
    return undefined;
  }
  const smi = spawnSync('nvidia-smi', ['--query-gpu=memory.free', '--format=csv,noheader,nounits'], { encoding: 'utf8', windowsHide: true });
  const free = smi.status === 0 ? smi.stdout.split(/\r?\n/).filter((l) => l.trim()).map(Number) : [];
  if (free.length !== 1 || !(free[0]! >= 0)) {
    info(`${free.length > 1 ? 'several GPUs' : 'no free VRAM reading from nvidia-smi'}: llama.cpp's --fit places the model`);
    return undefined;
  }
  let plan: GpuPlan | undefined;
  try {
    const { meta, tensors } = readGguf(modelPath);
    plan = gpuPlan(meta, tensors, ctxSize, cache);
  } catch (err) {
    warn(`could not read the model's layout (${(err as Error).message}); llama.cpp's --fit places the model`);
    return undefined;
  }
  if (!plan) {
    info("no dense feed-forward layers in this model: llama.cpp's --fit places it");
    return undefined;
  }
  const head = `${free[0]} MiB free, ${plan.needMib} MiB needed`;
  const placed = gpuPlacement(plan, free[0]!, local.llama.gpuMarginMib ?? GPU_MARGIN_MIB);
  if (!placed) {
    info(`${head}: too little VRAM even with every feed-forward weight on the CPU; llama.cpp's --fit places the model`);
    return undefined;
  }
  info(
    placed.cpuMib
      ? `${head}: ${placed.cpuMib} MiB of feed-forward weights on the CPU (layers ${placed.cpuBlocks.join('|')}), the rest and the whole context cache on the GPU`
      : `${head}: the whole model fits on the GPU`,
  );
  // As in the Docker agent: the plan's overhead was measured with -ub 256, and weights on the CPU
  // are read faster loaded than memory-mapped.
  return [...placed.args, '-ub', '256', '--load-mode', 'none'];
}

/** Starts llama-server detached; with `place`, the runner places the model itself. Returns whether it did. */
function startServer(local: LocalConfig, place: boolean): boolean {
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
  const placement = place ? placeModel(local) : undefined;
  // extraArgs last, so the machine's own settings win over the placement's -ub and --load-mode.
  const args = ['-m', modelPath, '--alias', local.llama.model, '--host', url.hostname, '--port', url.port || '8080', ...ctxArgs, ...(placement ?? []), ...extra];
  fs.mkdirSync(LOG_DIR, { recursive: true });
  const out = fs.openSync(path.join(LOG_DIR, 'llama-server.log'), 'a');
  // Detached so the model stays loaded when the runner restarts itself.
  const child = spawn(serverPath, args, { detached: true, stdio: ['ignore', out, out], windowsHide: true });
  child.unref();
  fs.writeFileSync(PID_FILE, String(child.pid ?? ''));
  info(`started llama-server (pid ${child.pid}): ${path.basename(modelPath)}, context ${local.llama.ctxSize || 'auto'}`);
  return placement !== undefined;
}

/** Makes sure the model server is up, starting it if we manage it. Returns false if it never became healthy. */
export async function ensureLlama(local: LocalConfig): Promise<boolean> {
  if (await isHealthy(local)) return true;
  if (local.llama.mode !== 'managed') {
    warn(`model server at ${local.llama.baseUrl} is not answering (external mode, not starting it)`);
    return false;
  }
  const pid = fs.existsSync(PID_FILE) ? Number(fs.readFileSync(PID_FILE, 'utf8')) : 0;
  let placed = false;
  if (!pid || !pidAlive(pid)) placed = startServer(local, true);
  else info(`waiting for llama-server (pid ${pid}) to finish loading…`);
  const deadline = Date.now() + LOAD_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(5000);
    if (await isHealthy(local)) {
      info(`model server is ready (context ${await detectContextSize(local)} tokens)`);
      return true;
    }
    const current = Number(fs.readFileSync(PID_FILE, 'utf8'));
    // An older build without --load-mode, or VRAM taken while loading: let llama.cpp place it instead.
    if (!pidAlive(current) && placed) {
      warn("llama-server exited while loading the model as the runner placed it; retrying with llama.cpp's --fit (see .agent/logs/llama-server.log)");
      placed = startServer(local, false);
      continue;
    }
    if (!pidAlive(current)) {
      warn('llama-server exited while loading; see .agent/logs/llama-server.log');
      return false;
    }
  }
  return false;
}
