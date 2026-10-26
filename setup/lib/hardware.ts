/**
 * What this machine has, for naming it and picking a model. Inside the Docker agent the host's
 * name and GPU come from SC_HOST_* variables (the container sees the host's CPU and RAM itself).
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

export function detectHardware(): Hardware {
  const ramGb = Math.round((Number(process.env.SC_HOST_RAM_GB) || os.totalmem() / 1024 ** 3) * 10) / 10;
  let smi = process.env.SC_HOST_GPU ?? '';
  if (!smi) {
    const r = spawnSync('nvidia-smi', ['--query-gpu=name,memory.total', '--format=csv,noheader,nounits'], { encoding: 'utf8', windowsHide: true });
    if (r.status === 0) smi = r.stdout;
  }
  return {
    hostname: process.env.SC_HOST_NAME || os.hostname(),
    cpu: process.env.SC_HOST_CPU || os.cpus()[0]?.model || '',
    ramGb,
    ...parseNvidiaSmi(smi, ramGb),
  };
}
