/**
 * Picks and downloads a GGUF model from Hugging Face: lists a repo's quants with their sizes and
 * how well each fits this machine, and downloads with resume and a SHA-256 check.
 * Gated or private repos need HF_TOKEN in the environment.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

export interface HfFile {
  path: string;
  size: number;
  /** SHA-256 of the file (Hugging Face stores GGUFs in LFS). */
  sha256?: string;
}

/** One downloadable model: a single GGUF or all parts of a split one. */
export interface ModelChoice {
  /** The file llama-server is pointed at (the first part of a split model). */
  file: string;
  parts: HfFile[];
  size: number;
}

export type Fit = 'gpu' | 'gpu+cpu' | 'cpu' | 'too-big';

const auth = (): Record<string, string> => (process.env.HF_TOKEN ? { authorization: `Bearer ${process.env.HF_TOKEN}` } : {});

export async function listRepoFiles(repo: string): Promise<HfFile[]> {
  const res = await fetch(`https://huggingface.co/api/models/${repo}/tree/main?recursive=true`, { headers: auth() });
  if (!res.ok) throw new Error(`Hugging Face: ${repo} -> HTTP ${res.status}${res.status === 401 ? ' (gated or private: set HF_TOKEN)' : ''}`);
  const tree = (await res.json()) as { type: string; path: string; size?: number; lfs?: { oid?: string; size?: number } }[];
  return tree.filter((f) => f.type === 'file').map((f) => ({ path: f.path, size: f.lfs?.size ?? f.size ?? 0, sha256: f.lfs?.oid }));
}

/** Model GGUFs only (no vision projectors, MTP drafts or imatrix files), split parts grouped, smallest first. */
export function modelChoices(files: readonly HfFile[]): ModelChoice[] {
  const ggufs = files.filter((f) => /\.gguf$/i.test(f.path) && !/(^|\/)(mmproj|mtp-|imatrix|dflash-)/i.test(f.path));
  const groups = new Map<string, HfFile[]>();
  for (const f of ggufs) {
    const key = f.path.replace(/-\d{5}-of-(\d{5})\.gguf$/i, '-of-$1');
    groups.set(key, [...(groups.get(key) ?? []), f]);
  }
  return [...groups.values()]
    .map((parts) => {
      const sorted = [...parts].sort((a, b) => a.path.localeCompare(b.path));
      return { file: sorted[0]!.path, parts: sorted, size: sorted.reduce((s, p) => s + p.size, 0) };
    })
    .sort((a, b) => a.size - b.size);
}

/** Rough fit: weights plus ~3 GB for a 32k-token context and buffers. */
export function fitOf(sizeBytes: number, vramGb: number, ramGb: number): Fit {
  const needGb = sizeBytes / 1e9 + 3;
  if (vramGb > 0 && needGb <= vramGb) return 'gpu';
  // Keep ~8 GB of system RAM for the OS, the agent, the build and the browser.
  const spareRam = Math.max(0, ramGb - 8);
  if (vramGb > 0 && needGb <= vramGb + spareRam) return 'gpu+cpu';
  if (vramGb === 0 && needGb <= spareRam) return 'cpu';
  return 'too-big';
}

export const FIT_LABEL: Record<Fit, string> = {
  gpu: 'fits in VRAM',
  'gpu+cpu': 'partly on CPU (slower)',
  cpu: 'CPU only (slow)',
  'too-big': 'too big for this machine',
};

/** Default pick: the biggest model that fits in VRAM, else the biggest that fits at all. */
export function defaultChoice(choices: readonly ModelChoice[], vramGb: number, ramGb: number): number {
  const order: Fit[] = ['gpu', 'gpu+cpu', 'cpu'];
  for (const fit of order) {
    const idx = choices.map((c, i) => [c, i] as const).filter(([c]) => fitOf(c.size, vramGb, ramGb) === fit).at(-1)?.[1];
    if (idx !== undefined) return idx;
  }
  return 0;
}

export const gb = (bytes: number): string => `${(bytes / 1e9).toFixed(1)} GB`;

async function sha256Of(file: string): Promise<string> {
  const hash = createHash('sha256');
  await pipeline(fs.createReadStream(file), hash);
  return hash.digest('hex');
}

/**
 * Downloads every part of `choice` into `dir` (resuming `.part` files), verifies each against the
 * SHA-256 Hugging Face publishes, and returns the local path of the file to load.
 */
export async function downloadModel(repo: string, choice: ModelChoice, dir: string, log: (line: string, sameLine?: boolean) => void): Promise<string> {
  fs.mkdirSync(dir, { recursive: true });
  for (const part of choice.parts) {
    const target = path.join(dir, path.basename(part.path));
    if (fs.existsSync(target) && fs.statSync(target).size === part.size) {
      log(`already downloaded: ${path.basename(target)}`);
      continue;
    }
    const partial = `${target}.part`;
    const have = fs.existsSync(partial) ? fs.statSync(partial).size : 0;
    const url = `https://huggingface.co/${repo}/resolve/main/${part.path.split('/').map(encodeURIComponent).join('/')}`;
    const res = await fetch(url, { headers: { ...auth(), ...(have > 0 && have < part.size ? { range: `bytes=${have}-` } : {}) } });
    if (!res.ok || !res.body) throw new Error(`download ${part.path}: HTTP ${res.status}`);
    const resuming = res.status === 206;
    let done = resuming ? have : 0;
    if (resuming) log(`resuming ${path.basename(target)} at ${gb(have)}`);
    const started = Date.now();
    let lastPrint = 0;
    const body = Readable.fromWeb(res.body as import('node:stream/web').ReadableStream);
    body.on('data', (chunk: Buffer) => {
      done += chunk.length;
      const now = Date.now();
      if (now - lastPrint < 1000) return;
      lastPrint = now;
      const rate = (done - (resuming ? have : 0)) / Math.max(1, (now - started) / 1000);
      const eta = rate > 0 ? Math.round((part.size - done) / rate / 60) : 0;
      log(`${path.basename(target)}: ${gb(done)} / ${gb(part.size)}  ${(rate / 1e6).toFixed(0)} MB/s  ~${eta} min left`, true);
    });
    await pipeline(body, fs.createWriteStream(partial, { flags: resuming ? 'a' : 'w' }));
    log(`${path.basename(target)}: ${gb(done)} downloaded`);
    if (fs.statSync(partial).size !== part.size) throw new Error(`${part.path}: got ${fs.statSync(partial).size} bytes, expected ${part.size}; run setup again to resume`);
    if (part.sha256) {
      log(`verifying ${path.basename(target)} (SHA-256)…`);
      if ((await sha256Of(partial)) !== part.sha256) {
        fs.rmSync(partial);
        throw new Error(`${part.path}: checksum mismatch, deleted the download; run setup again`);
      }
    }
    fs.renameSync(partial, target);
  }
  return path.join(dir, path.basename(choice.file));
}
