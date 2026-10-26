/**
 * Downloads a model for this machine from Hugging Face. Used by setup.ps1 and the Docker setup;
 * also runnable by hand:
 *
 *   node setup/models.ts download --dir <models folder> [--repo <owner/name>] [--out result.json]
 *   node setup/models.ts context --model-file <gguf> [--cache q8_0|q4_0]
 *
 * `download` lists the repo's GGUF quants with their size and how well each fits this machine, then
 * downloads the one you pick (resumable, checksum-verified). `context` prints how big the context
 * cache gets per context size and how much of the model then stays on the GPU.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Hardware } from './lib/fleet.ts';
import { CONTEXT_CHOICES, gpuSplit, kvElementsPerToken, modelBytes, readGgufMetadata, type CacheType } from './lib/gguf.ts';
import { detectHardware } from './lib/hardware.ts';
import { defaultChoice, downloadModel, FIT_LABEL, fitOf, gb, listRepoFiles, modelChoices } from './lib/hf.ts';
import { ask, askValid, choose, closePrompts, flag, note, ok, problem, progress, step, yesNo } from './lib/prompt.ts';

/** What the fleet runs today; only a default for the question. */
export const DEFAULT_REPO = 'unsloth/Qwen3.8-27B-GGUF';

export interface Downloaded {
  modelPath: string;
  repo: string;
}

export async function pickAndDownload(dir: string, repoDefault = DEFAULT_REPO, hw: Hardware = detectHardware()): Promise<Downloaded> {
  step('Download a model from Hugging Face');
  note(`this machine: ${hw.gpu ? `${hw.gpu}, ${hw.vramGb} GB VRAM` : 'no NVIDIA GPU'}, ${hw.ramGb} GB RAM`);
  for (;;) {
    const repo = await ask('Hugging Face repo with GGUF files', repoDefault);
    let choices;
    try {
      choices = modelChoices(await listRepoFiles(repo));
    } catch (err) {
      problem((err as Error).message);
      continue;
    }
    if (choices.length === 0) {
      problem(`no GGUF model files in ${repo}`);
      continue;
    }
    const choice = await choose(
      `Quants in ${repo} (fit is approximate, assuming a 32k context):`,
      choices,
      (c) => `${path.basename(c.file).replace(/-00001-of-(\d{5})\.gguf$/, ' ($1 parts)')}  ${gb(c.size).padStart(8)}  ${FIT_LABEL[fitOf(c.size, hw.vramGb, hw.ramGb)]}`,
      defaultChoice(choices, hw.vramGb, hw.ramGb),
    );
    fs.mkdirSync(dir, { recursive: true });
    const free = fs.statfsSync(dir).bavail * fs.statfsSync(dir).bsize;
    if (free < choice.size * 1.02) {
      problem(`only ${gb(free)} free in ${dir}; ${gb(choice.size)} needed`);
      continue;
    }
    if (fitOf(choice.size, hw.vramGb, hw.ramGb) === 'too-big' && !(await yesNo('That probably will not fit in memory. Download anyway?', false))) continue;
    note(`downloading ${gb(choice.size)} to ${dir} (safe to interrupt: run setup again to resume)`);
    const modelPath = await downloadModel(repo, choice, dir, progress);
    ok(`model: ${modelPath}`);
    return { modelPath, repo };
  }
}

/** Minimum context Claude Code can work with (its instructions and tools alone take ~20k tokens). */
const MIN_CONTEXT = 32_768;
/** Below this share of the model on the GPU, generation is mostly waiting on the CPU. */
const SLOW_BELOW = 0.6;

export interface ContextPlan {
  /** Estimated share of the model on the GPU at `ctx` tokens; undefined when the model's shape is unknown. */
  estimate: (ctx: number, cache: CacheType) => number | undefined;
  /** Table lines for a cache type. */
  table: (cache: CacheType) => string[];
}

/** How context size and cache precision split this model between GPU and CPU on this machine. */
export function planContext(modelPath: string, hw: Hardware): ContextPlan {
  let kv: number | undefined;
  try {
    kv = kvElementsPerToken(readGgufMetadata(modelPath));
  } catch {
    kv = undefined;
  }
  const bytes = modelBytes(modelPath);
  // Unknown desktop use: assume a desktop session (~1 GiB) rather than an empty GPU.
  const other = hw.vramOtherGb ?? 1;
  const split = (ctx: number, cache: CacheType) =>
    kv && hw.vramGb > 0 ? gpuSplit({ modelBytes: bytes, kvElementsPerToken: kv, ctx, cache, vramGib: hw.vramGb, vramOtherGib: other }) : undefined;
  return {
    estimate: (ctx, cache) => split(ctx, cache)?.onGpu,
    table: (cache) => {
      if (!split(MIN_CONTEXT, cache)) return ['(no estimate: unknown model layout or no NVIDIA GPU)'];
      return [
        `context    ${cache} cache   model on the GPU (est., with ${other} GB VRAM in use by other programs)`,
        ...CONTEXT_CHOICES.map((ctx) => {
          const s = split(ctx, cache)!;
          const pct = Math.round(s.onGpu * 100);
          const label = ctx % 1024 === 0 ? `${ctx / 1024}k` : `${Math.round(ctx / 1000)}k`;
          return `${label.padEnd(10)} ${`${s.cacheGib.toFixed(1)} GB`.padEnd(13)} ~${pct}%${s.onGpu < SLOW_BELOW ? '  (slow: mostly waiting on the CPU)' : s.onGpu >= 1 ? '  (all of it)' : ''}`;
        }),
      ];
    },
  };
}

/**
 * Asks for the context cache precision and the context size, showing the GPU/CPU split for each.
 * Returns ctxSize 0 for "auto" (llama.cpp sizes the context so as much of the model as possible stays
 * on the GPU, never below 32k).
 */
export async function askCacheAndContext(modelPath: string, hw: Hardware, previous: { ctxSize?: number; cache?: CacheType } = {}): Promise<{ ctxSize: number; cache: CacheType }> {
  step('Context');
  const plan = planContext(modelPath, hw);
  const fitsFully = (plan.estimate(MIN_CONTEXT, 'q8_0') ?? 1) >= 1;
  const cache = await choose<CacheType>(
    'Context cache precision:',
    ['q8_0', 'q4_0'],
    (c) => (c === 'q8_0' ? 'q8_0: full-quality cache' : 'q4_0: half the memory, so more of the model fits on the GPU (slightly lower quality)'),
    (previous.cache ?? (fitsFully ? 'q8_0' : 'q4_0')) === 'q8_0' ? 0 : 1,
  );
  for (const line of plan.table(cache)) console.log(`     ${line}`);
  note('auto = as much of the model on the GPU as possible, context sized to fit (at least 32k)');
  for (;;) {
    const answer = await askValid('Context size: "auto" or a number of tokens', previous.ctxSize ? String(previous.ctxSize) : 'auto', (v) =>
      v === 'auto' || (Number.isInteger(Number(v)) && Number(v) >= MIN_CONTEXT) ? null : `"auto" or at least ${MIN_CONTEXT}`,
    );
    const ctxSize = answer === 'auto' ? 0 : Number(answer);
    const share = ctxSize ? plan.estimate(ctxSize, cache) : undefined;
    if (share !== undefined && share < SLOW_BELOW) {
      problem(`only ~${Math.round(share * 100)}% of the model fits on the GPU at ${ctxSize} tokens: generation will be slow, mostly waiting on the CPU`);
      if (!(await yesNo('Use it anyway?', false))) continue;
    }
    ok(`context ${answer}, ${cache} cache${share !== undefined ? `, ~${Math.round(share * 100)}% of the model on the GPU` : ''}`);
    return { ctxSize, cache };
  }
}

async function main(): Promise<void> {
  const dir = flag('dir');
  try {
    if (process.argv[2] === 'context') {
      const modelFile = flag('model-file');
      if (!modelFile || !fs.existsSync(modelFile)) throw new Error('--model-file <existing .gguf> is required');
      const cache = flag('cache') === 'q4_0' ? 'q4_0' : 'q8_0';
      for (const line of planContext(modelFile, detectHardware()).table(cache)) console.log(`     ${line}`);
      return;
    }
    if (process.argv[2] !== 'download' || !dir) {
      console.log('usage: node setup/models.ts download --dir <models folder> [--repo owner/name] [--out result.json]');
      console.log('       node setup/models.ts context --model-file <gguf> [--cache q8_0|q4_0]');
      process.exitCode = 2;
      return;
    }
    const result = await pickAndDownload(path.resolve(dir), flag('repo') || DEFAULT_REPO);
    const out = flag('out');
    if (out) fs.writeFileSync(out, JSON.stringify(result));
  } catch (err) {
    console.error(`\n   !!  ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    closePrompts();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) await main();
