/**
 * What this machine has, for naming it and picking a model. Inside the Docker agent the host's
 * name, GPU and VRAM use come from SC_HOST_* variables (the container sees the host's CPU and RAM).
 */
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import type { Hardware } from './fleet.ts';

/** "NVIDIA GeForce RTX 4070 SUPER, 12282" lines from nvidia-smi -> name and total VRAM in GB. */
export function parseNvidiaSmi(out: string, ramGb: number): { gpu: string; vramGb: number } {
  const gpus = out
    .split(/\r?\n/)
    .map((l) => l.split(',').map((s) => s.trim()))
    .filter(([name]) => name);
  if (gpus.length === 0) return { gpu: '', vramGb: 0 };
  // Unified-memory GPUs (e.g. DGX Spark) report no dedicated memory: they can use most of the RAM.
  const vram = gpus.reduce((sum, [, mib]) => sum + (Number(mib) > 0 ? Number(mib) / 1024 : ramGb * 0.85), 0);
  const name = gpus.length > 1 ? `${gpus.length}x ${gpus[0]![0]}` : gpus[0]![0]!;
  return { gpu: name, vramGb: Math.round(vram * 10) / 10 };
}

/**
 * VRAM other programs use: total used minus any llama-server (which setup may be about to restart).
 * `apps` is nvidia-smi's "process_name, used_memory" list; Windows often reports [N/A] per process.
 */
export function parseVramOther(usedMib: string, apps: string): number | undefined {
  const used = usedMib
    .split(/\r?\n/)
    .map(Number)
    .filter((n) => Number.isFinite(n))
    .reduce((s, n) => s + n, 0);
  if (!(used >= 0) || !usedMib.trim()) return undefined;
  const llama = apps
    .split(/\r?\n/)
    .filter((l) => /llama-server/i.test(l))
    .reduce((s, l) => s + (Number(l.split(',').pop()) || 0), 0);
  return Math.round((Math.max(0, used - llama) / 1024) * 10) / 10;
}

function nvidiaSmi(args: string[]): string | undefined {
  const r = spawnSync('nvidia-smi', args, { encoding: 'utf8', windowsHide: true });
  return r.status === 0 ? r.stdout : undefined;
}

export function detectHardware(): Hardware {
  const ramGb = Math.round((Number(process.env.SC_HOST_RAM_GB) || os.totalmem() / 1024 ** 3) * 10) / 10;
  const smi = process.env.SC_HOST_GPU || nvidiaSmi(['--query-gpu=name,memory.total', '--format=csv,noheader,nounits']) || '';
  const otherMib = Number(process.env.SC_HOST_VRAM_OTHER_MIB);
  let vramOtherGb = Number.isFinite(otherMib) && process.env.SC_HOST_VRAM_OTHER_MIB ? Math.round((otherMib / 1024) * 10) / 10 : undefined;
  if (vramOtherGb === undefined && smi) {
    const used = nvidiaSmi(['--query-gpu=memory.used', '--format=csv,noheader,nounits']);
    const apps = nvidiaSmi(['--query-compute-apps=process_name,used_memory', '--format=csv,noheader,nounits']) ?? '';
    if (used) vramOtherGb = parseVramOther(used, apps);
  }
  return {
    hostname: process.env.SC_HOST_NAME || os.hostname(),
    cpu: process.env.SC_HOST_CPU || os.cpus()[0]?.model || '',
    ramGb,
    ...parseNvidiaSmi(smi, ramGb),
    vramOtherGb,
  };
}
