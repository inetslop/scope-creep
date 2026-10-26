/**
 * Machine registration: suggests an entry for agents/machines.json from this PC's hardware and
 * its model, and edits the file in the same compact style humans write it in.
 */
import type { MachineConfig } from '../../loop/config.ts';
import type { TaskSize } from '../../loop/tasks.ts';

export interface Hardware {
  hostname: string;
  cpu: string;
  /** Empty when no NVIDIA GPU was found. */
  gpu: string;
  vramGb: number;
  ramGb: number;
}

/** What a GGUF file name says about the model, e.g. "Qwen3.8-27B-UD-IQ3_XXS.gguf". */
export interface ModelInfo {
  /** "Qwen 3.8 27B UD-IQ3_XXS" */
  label: string;
  /** Approximate bits per weight of the quant, from its name. */
  bits: number;
  /** "IQ3_XXS" */
  quant: string;
}

export const MACHINE_ID = /^[a-z][a-z0-9-]{1,23}$/;

/** Hostname -> a valid machine id ("Matt-Desktop.local" -> "matt-desktop"). */
export function suggestMachineId(hostname: string, taken: readonly string[]): string {
  let base = hostname
    .toLowerCase()
    .replace(/\..*$/, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^[^a-z]+|-+$/g, '')
    .slice(0, 20);
  if (!MACHINE_ID.test(base)) base = 'agent';
  let id = base;
  for (let n = 2; taken.includes(id) || id === 'archive'; n++) id = `${base}-${n}`;
  return id;
}

export function validateMachineId(id: string, taken: readonly string[]): string | null {
  if (!MACHINE_ID.test(id)) return 'use 2-24 characters: lowercase letters, digits and dashes, starting with a letter';
  if (id === 'archive') return '"archive" is reserved';
  if (taken.includes(id)) return `"${id}" is already in agents/machines.json`;
  return null;
}

/** Bits per weight for common llama.cpp quant names (close enough to pick a tier). */
const QUANT_BITS: [RegExp, number][] = [
  [/(^|[-_.])(BF16|F16)([-_.]|$)/i, 16],
  [/Q8_/i, 8.5],
  [/Q6_/i, 6.6],
  [/Q5_/i, 5.5],
  [/IQ4_|Q4_/i, 4.5],
  [/IQ3_|Q3_/i, 3.4],
  [/IQ2_|Q2_/i, 2.6],
  [/IQ1_/i, 1.8],
];

export function parseModelFile(fileName: string): ModelInfo {
  const stem = fileName.replace(/\\/g, '/').split('/').pop()!.replace(/(-\d{5}-of-\d{5})?\.gguf$/i, '');
  const quant = /((?:UD-)?I?Q\d_[A-Z0-9_]+|Q\d_\d|BF16|F16)$/i.exec(stem)?.[1] ?? '';
  const bits = QUANT_BITS.find(([re]) => re.test(quant || stem))?.[1] ?? 4.5;
  // "Qwen3.8-27B-UD-IQ3_XXS" -> "Qwen 3.8 27B UD-IQ3_XXS"
  const name = stem
    .slice(0, quant ? stem.length - quant.length : undefined)
    .replace(/-+$/, '')
    .replace(/^([A-Za-z]+)(\d)/, '$1 $2')
    .replace(/-/g, ' ');
  return { label: [name, quant].filter(Boolean).join(' '), bits, quant: quant.replace(/^UD-/i, '') };
}

/** "AMD Ryzen 7 7800X3D 8-Core Processor" + "NVIDIA GeForce RTX 4070 SUPER" -> "Ryzen 7 7800X3D + RTX 4070 SUPER (12 GB)" */
export function hardwareLabel(hw: Hardware): string {
  const cpu = hw.cpu
    .replace(/\(R\)|\(TM\)|®|™/g, '')
    .replace(/^(AMD|Intel)\s+/i, '')
    .replace(/\s+(\d+-Core|Processor|CPU).*$/i, '')
    .replace(/\s+/g, ' ')
    .trim();
  const gpu = hw.gpu.replace(/^NVIDIA\s+(GeForce\s+)?/i, '').trim();
  const parts = [cpu, gpu ? `${gpu} (${Math.round(hw.vramGb)} GB)` : `${Math.round(hw.ramGb)} GB RAM`].filter(Boolean);
  return parts.join(' + ');
}

export interface Suggestion {
  tier: string;
  maxTaskSize: TaskSize;
  targetQueue: number;
  notes: string;
}

/** What the PO is told to give a machine, by the biggest task size it may get. */
const WORK: Record<TaskSize, string> = {
  L: 'Give it the hardest, design-heavy work: new systems, tricky bugs, cross-cutting changes.',
  M: 'Give it medium features: new mechanics, scenes, UI, juice, audio.',
  S: 'Only small, precisely specified tasks: new content data files copied from an existing example, tuning numbers, small unit tests, tiny single-function changes. Always name the exact file and the example to copy.',
};

/** Rough fit: the weights plus ~3 GB for a 32k context. A model size of 0 (not on this machine) counts as fitting. */
const fitsInVram = (modelGb: number, hw: Hardware): boolean => hw.vramGb > 0 && modelGb + 3 <= hw.vramGb;

/** The size that goes with a tier, when the tier is one of the usual words. */
export function sizeForTier(tier: string): TaskSize | undefined {
  if (/strong/i.test(tier)) return 'L';
  if (/medium/i.test(tier)) return 'M';
  if (/weak/i.test(tier)) return 'S';
  return undefined;
}

/** Notes for the PO: what the model is like, how fast it runs here, and the work that fits the chosen size. */
export function suggestNotes(size: TaskSize, model: ModelInfo, modelGb: number, hw: Hardware): string {
  const quality =
    model.bits >= 6
      ? `High-precision quant (${model.quant || '8-bit'}): good reasoning.`
      : model.bits >= 4
        ? `Mid quant (${model.quant || '4-bit'}).`
        : `Heavily quantized (${model.quant || `${model.bits}-bit`}): expect more mistakes.`;
  const speed = fitsInVram(modelGb, hw) ? '' : hw.vramGb > 0 ? 'Partly offloaded to CPU, so slow.' : 'Runs on the CPU, so very slow.';
  return [quality, speed, WORK[size]].filter(Boolean).join(' ');
}

/**
 * Starting point for the PO's view of a new machine, from the quant and whether the model fits
 * in VRAM. The person running setup confirms or edits each value; the notes follow their choice.
 */
export function suggestCapabilities(model: ModelInfo, modelGb: number, hw: Hardware): Suggestion {
  const fits = fitsInVram(modelGb, hw);
  const [tier, maxTaskSize]: [string, TaskSize] = model.bits >= 6 ? [fits ? 'strong' : 'strong-slow', 'L'] : model.bits >= 4 ? (fits ? ['fast', 'L'] : ['medium', 'M']) : ['weak', 'S'];
  const targetQueue = maxTaskSize === 'S' && model.bits < 3 ? 3 : 2;
  return { tier, maxTaskSize, targetQueue, notes: suggestNotes(maxTaskSize, model, modelGb, hw) };
}

export interface FleetFile {
  machines: Record<string, MachineConfig>;
  [key: string]: unknown;
}

/**
 * JSON with 2-space indents, where objects and arrays holding only plain values stay on one line
 * (`"roles": ["dev"]`, `"S": { "maxTurns": 50, "timeoutMin": 60 }`), like the hand-written file.
 */
export function formatFleetJson(value: unknown): string {
  const flat = (v: unknown): boolean => v === null || typeof v !== 'object';
  const fmt = (v: unknown, indent: string): string => {
    if (flat(v)) return JSON.stringify(v);
    const inner = `${indent}  `;
    if (Array.isArray(v)) {
      if (v.every(flat)) return `[${v.map((x) => JSON.stringify(x)).join(', ')}]`;
      return `[\n${v.map((x) => inner + fmt(x, inner)).join(',\n')}\n${indent}]`;
    }
    const entries = Object.entries(v as Record<string, unknown>);
    if (entries.length === 0) return '{}';
    if (entries.every(([, x]) => flat(x))) return `{ ${entries.map(([k, x]) => `${JSON.stringify(k)}: ${JSON.stringify(x)}`).join(', ')} }`;
    return `{\n${entries.map(([k, x]) => `${inner}${JSON.stringify(k)}: ${fmt(x, inner)}`).join(',\n')}\n${indent}}`;
  };
  return `${fmt(value, '')}\n`;
}

/** Adds a machine, paused until its health check passes (so the PO plans nothing for it yet). */
export function addMachine(fleet: FleetFile, id: string, entry: Omit<MachineConfig, 'paused'>): FleetFile {
  if (fleet.machines[id]) throw new Error(`machine "${id}" already exists`);
  return { ...fleet, machines: { ...fleet.machines, [id]: { paused: true, ...entry } } };
}

export function setPaused(fleet: FleetFile, id: string, paused: boolean): FleetFile {
  const current = fleet.machines[id];
  if (!current) throw new Error(`machine "${id}" is not in agents/machines.json`);
  const rest: MachineConfig = { ...current };
  delete rest.paused;
  return { ...fleet, machines: { ...fleet.machines, [id]: paused ? { paused: true, ...rest } : rest } };
}
