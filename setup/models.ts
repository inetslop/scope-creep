/**
 * Downloads a model for this machine from Hugging Face. Used by setup.ps1 and the Docker setup;
 * also runnable by hand:
 *
 *   node setup/models.ts download --dir <models folder> [--repo <owner/name>] [--out result.json]
 *
 * Lists the repo's GGUF quants with their size and how well each fits this machine, then
 * downloads the one you pick (resumable, checksum-verified).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { Hardware } from './lib/fleet.ts';
import { detectHardware } from './lib/hardware.ts';
import { defaultChoice, downloadModel, FIT_LABEL, fitOf, gb, listRepoFiles, modelChoices } from './lib/hf.ts';
import { ask, choose, closePrompts, flag, note, ok, problem, progress, step, yesNo } from './lib/prompt.ts';

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

async function main(): Promise<void> {
  const dir = flag('dir');
  try {
    if (process.argv[2] !== 'download' || !dir) {
      console.log('usage: node setup/models.ts download --dir <models folder> [--repo owner/name] [--out result.json]');
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
