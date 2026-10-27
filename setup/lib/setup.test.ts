import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { REPO } from '../../loop/paths.ts';
import { parseEnv, updateEnvText } from '../docker/env.ts';
import { addMachine, formatFleetJson, hardwareLabel, parseModelFile, setPaused, sizeForTier, suggestCapabilities, suggestMachineId, suggestNotes, validateMachineId, type FleetFile, type Hardware } from './fleet.ts';
import { formatGpuPlan, gpuPlan, gpuSplit, GPU_OVERHEAD_MIB, kvElementsPerToken, parseGguf, parseGgufMetadata } from './gguf.ts';
import { parseNvidiaSmi, parseVramOther } from './hardware.ts';
import { defaultChoice, fitOf, modelChoices, type HfFile } from './hf.ts';

const HW: Hardware = { hostname: 'Matt-Desktop.local', cpu: 'AMD Ryzen 7 7800X3D 8-Core Processor', gpu: 'NVIDIA GeForce RTX 4070 SUPER', vramGb: 12, ramGb: 31 };

describe('machine registration', () => {
  it('writes machines.json exactly in the hand-written style', () => {
    const text = fs.readFileSync(path.join(REPO, 'agents', 'machines.json'), 'utf8');
    assert.equal(formatFleetJson(JSON.parse(text)), text);
  });

  it('adds new machines paused and unpauses them without touching the rest', () => {
    const fleet: FleetFile = { machines: { yoga: { label: 'y', model: 'm', roles: ['dev'], tier: 'weak', maxTaskSize: 'S', targetQueue: 3, notes: '' } }, loop: { pollSeconds: 60 } };
    const entry = { label: 'L', model: 'M', roles: ['dev' as const], tier: 'weak', maxTaskSize: 'S' as const, targetQueue: 2, notes: 'n' };
    const added = addMachine(fleet, 'matt-desktop', entry);
    assert.deepEqual(Object.keys(added.machines), ['yoga', 'matt-desktop']);
    assert.deepEqual(added.machines['matt-desktop'], { paused: true, ...entry });
    assert.deepEqual(setPaused(added, 'matt-desktop', false).machines['matt-desktop'], entry);
    assert.equal(fleet.machines['matt-desktop'], undefined, 'input not mutated');
    assert.throws(() => addMachine(added, 'matt-desktop', entry));
    assert.ok(formatFleetJson(added).includes('"matt-desktop": {\n      "paused": true,\n      "label": "L",'));
  });

  it('suggests a valid, unused id from the hostname', () => {
    assert.equal(suggestMachineId('Matt-Desktop.local', []), 'matt-desktop');
    assert.equal(suggestMachineId('matt-desktop', ['matt-desktop']), 'matt-desktop-2');
    assert.equal(suggestMachineId('1234', []), 'agent');
    assert.equal(validateMachineId('Matt', []), 'use 2-24 characters: lowercase letters, digits and dashes, starting with a letter');
    assert.match(validateMachineId('yoga', ['yoga']) ?? '', /already/);
    assert.equal(validateMachineId('linux-box', ['yoga']), null);
  });

  it('reads the model and quant from GGUF file names', () => {
    assert.deepEqual(parseModelFile('/data/models/Qwen3.8-27B-UD-IQ3_XXS.gguf'), { label: 'Qwen 3.8 27B UD-IQ3_XXS', bits: 3.4, quant: 'IQ3_XXS' });
    assert.deepEqual(parseModelFile('C:\\models\\Qwen3.8-27B-Q4_0.gguf'), { label: 'Qwen 3.8 27B Q4_0', bits: 4.5, quant: 'Q4_0' });
    assert.equal(parseModelFile('Qwen3.8-27B-BF16-00001-of-00002.gguf').bits, 16);
    assert.equal(parseModelFile('Qwen3.8-27B-UD-Q8_K_XL.gguf').bits, 8.5);
  });

  it('labels the hardware and suggests capabilities from quant and fit', () => {
    assert.equal(hardwareLabel(HW), 'Ryzen 7 7800X3D + GeForce RTX 4070 SUPER (12 GB)'.replace('GeForce ', ''));
    const iq3 = suggestCapabilities(parseModelFile('Qwen3.8-27B-UD-IQ3_XXS.gguf'), 10.9, HW);
    assert.deepEqual([iq3.tier, iq3.maxTaskSize, iq3.targetQueue], ['weak', 'S', 2]);
    assert.match(iq3.notes, /Partly offloaded to CPU/);
    const q4 = suggestCapabilities(parseModelFile('Qwen3.8-27B-UD-Q4_K_XL.gguf'), 17.6, { ...HW, vramGb: 32 });
    assert.deepEqual([q4.tier, q4.maxTaskSize], ['fast', 'L']);
    const q8 = suggestCapabilities(parseModelFile('Qwen3.8-27B-UD-Q8_K_XL.gguf'), 31.5, { ...HW, vramGb: 108 });
    assert.deepEqual([q8.tier, q8.maxTaskSize], ['strong', 'L']);
  });

  it('writes the notes for the size that was chosen, not just the quant', () => {
    const iq3 = parseModelFile('Qwen3.8-27B-UD-IQ3_XXS.gguf');
    assert.equal(
      suggestNotes('L', iq3, 10.9, HW),
      'Heavily quantized (IQ3_XXS): expect more mistakes. Partly offloaded to CPU, so slow. Give it the hardest, design-heavy work: new systems, tricky bugs, cross-cutting changes.',
    );
    assert.match(suggestNotes('S', iq3, 10.9, HW), /Only small, precisely specified tasks/);
    assert.equal(suggestNotes('M', parseModelFile('Qwen3.8-27B-UD-Q4_K_XL.gguf'), 17.6, { ...HW, vramGb: 32 }), 'Mid quant (Q4_K_XL). Give it medium features: new mechanics, scenes, UI, juice, audio.');
    assert.deepEqual(['strong', 'strong-slow', 'medium', 'weak', 'fast', 'x'].map(sizeForTier), ['L', 'L', 'M', 'S', undefined, undefined]);
  });

  it('reads nvidia-smi, including several GPUs and unified memory', () => {
    assert.deepEqual(parseNvidiaSmi('NVIDIA GeForce RTX 4070 SUPER, 12282\n', 31), { gpu: 'NVIDIA GeForce RTX 4070 SUPER', vramGb: 12 });
    assert.deepEqual(parseNvidiaSmi('A, 24576\nA, 24576\n', 64), { gpu: '2x A', vramGb: 48 });
    assert.deepEqual(parseNvidiaSmi('NVIDIA GB10, [N/A]\n', 120), { gpu: 'NVIDIA GB10', vramGb: 102 });
    assert.deepEqual(parseNvidiaSmi('', 31), { gpu: '', vramGb: 0 });
  });
});

describe('model download', () => {
  const files: HfFile[] = [
    { path: 'BF16/Qwen3.8-27B-BF16-00002-of-00002.gguf', size: 4.7e9 },
    { path: 'BF16/Qwen3.8-27B-BF16-00001-of-00002.gguf', size: 50e9 },
    { path: 'Qwen3.8-27B-UD-IQ3_XXS.gguf', size: 10.9e9, sha256: 'abc' },
    { path: 'Qwen3.8-27B-UD-IQ2_S.gguf', size: 8.4e9 },
    { path: 'Qwen3.8-27B-UD-Q4_K_XL.gguf', size: 17.6e9 },
    { path: 'mmproj-F16.gguf', size: 0.9e9 },
    { path: 'MTP/mtp-Qwen3.8-27B-Q4_0.gguf', size: 1.4e9 },
    { path: 'imatrix_unsloth.gguf', size: 1e6 },
    { path: 'README.md', size: 1e3 },
  ];

  it('lists model quants only, split parts as one, smallest first', () => {
    const choices = modelChoices(files);
    assert.deepEqual(
      choices.map((c) => [c.file, c.parts.length, Math.round(c.size / 1e8) / 10]),
      [
        ['Qwen3.8-27B-UD-IQ2_S.gguf', 1, 8.4],
        ['Qwen3.8-27B-UD-IQ3_XXS.gguf', 1, 10.9],
        ['Qwen3.8-27B-UD-Q4_K_XL.gguf', 1, 17.6],
        ['BF16/Qwen3.8-27B-BF16-00001-of-00002.gguf', 2, 54.7],
      ],
    );
  });

  it('rates the fit and defaults to the biggest model that fits in VRAM', () => {
    assert.deepEqual([8.4e9, 10.9e9, 17.6e9, 54.7e9].map((s) => fitOf(s, 12, 31)), ['gpu', 'gpu+cpu', 'gpu+cpu', 'too-big']);
    assert.equal(fitOf(10e9, 0, 64), 'cpu');
    const choices = modelChoices(files);
    assert.equal(choices[defaultChoice(choices, 12, 31)]!.file, 'Qwen3.8-27B-UD-IQ2_S.gguf');
    assert.equal(choices[defaultChoice(choices, 0, 31)]!.file, 'Qwen3.8-27B-UD-Q4_K_XL.gguf');
  });
});

describe('docker .env', () => {
  it('updates keys in place, appends new ones, keeps comments, quotes values with spaces', () => {
    const text = '# settings\nAGENT_HOME="/home/m/scope-creep-agent"\nMODEL_FILE=old.gguf\n';
    const next = updateEnvText(text, { MODEL_FILE: 'Qwen3.8-27B-UD-IQ3_XXS.gguf', LLAMA_ARGS: '--fit-ctx 32768 --temp 0.6', HOST_GPU: 'RTX "4070", 12282' });
    assert.equal(
      next,
      '# settings\nAGENT_HOME="/home/m/scope-creep-agent"\nMODEL_FILE=Qwen3.8-27B-UD-IQ3_XXS.gguf\nLLAMA_ARGS="--fit-ctx 32768 --temp 0.6"\nHOST_GPU="RTX \\"4070\\", 12282"\n',
    );
    assert.deepEqual(parseEnv(next), {
      AGENT_HOME: '/home/m/scope-creep-agent',
      MODEL_FILE: 'Qwen3.8-27B-UD-IQ3_XXS.gguf',
      LLAMA_ARGS: '--fit-ctx 32768 --temp 0.6',
      HOST_GPU: 'RTX "4070", 12282',
    });
  });
});

/** A minimal GGUF header: magic, version, tensor count, then typed key/values. */
function gguf(kv: [string, number, unknown][]): Buffer {
  const parts: Buffer[] = [Buffer.from('GGUF'), u32(3), u64(0), u64(kv.length)];
  const str = (s: string): Buffer => Buffer.concat([u64(Buffer.byteLength(s)), Buffer.from(s)]);
  for (const [key, type, value] of kv) {
    parts.push(str(key), u32(type));
    if (type === 4) parts.push(u32(value as number));
    else if (type === 8) parts.push(str(value as string));
    else if (type === 9) parts.push(u32(8), u64((value as string[]).length), ...(value as string[]).map(str));
  }
  return Buffer.concat(parts);
}
function u32(n: number): Buffer {
  const b = Buffer.alloc(4);
  b.writeUInt32LE(n);
  return b;
}
function u64(n: number): Buffer {
  const b = Buffer.alloc(8);
  b.writeBigUInt64LE(BigInt(n));
  return b;
}

describe('context planning', () => {
  // Qwen3.8-27B: 64 layers + 1 multi-token-prediction layer, full attention every 4th layer.
  const qwen = gguf([
    ['general.architecture', 8, 'qwen35'],
    ['tokenizer.ggml.tokens', 9, Array.from({ length: 300 }, (_, i) => `t${i}`)],
    ['qwen35.block_count', 4, 65],
    ['qwen35.nextn_predict_layers', 4, 1],
    ['qwen35.full_attention_interval', 4, 4],
    ['qwen35.attention.head_count', 4, 24],
    ['qwen35.attention.head_count_kv', 4, 4],
    ['qwen35.attention.key_length', 4, 256],
    ['qwen35.attention.value_length', 4, 256],
  ]);

  it('reads the model layout from the GGUF header, skipping the vocabulary', () => {
    const meta = parseGgufMetadata(qwen);
    assert.equal(meta['tokenizer.ggml.tokens'], '<300 items>');
    assert.equal(kvElementsPerToken(meta), 16 * 4 * 512);
    assert.equal(kvElementsPerToken({ 'general.architecture': 'llama', 'llama.block_count': 32, 'llama.attention.head_count': 32, 'llama.attention.head_count_kv': 8, 'llama.embedding_length': 4096 }), 32 * 8 * 256);
    assert.equal(kvElementsPerToken({}), undefined);
  });

  it('estimates the GPU share close to what llama.cpp chose on an RTX 4070 SUPER', () => {
    // Measured: 12 GiB card, ~1.1 GiB used by the desktop, 10.9 GB model. At 64k with a q4_0 cache
    // llama-server held 9.47 GiB, about 75% of the weights; at 100k with q8_0 about half.
    const base = { modelBytes: 10.9e9, kvElementsPerToken: 16 * 4 * 512, vramGib: 12, vramOtherGib: 1.1 };
    const at64q4 = gpuSplit({ ...base, ctx: 65_536, cache: 'q4_0' });
    assert.ok(Math.abs(at64q4.cacheGib - 1.125) < 0.01, String(at64q4.cacheGib));
    assert.ok(at64q4.onGpu > 0.72 && at64q4.onGpu < 0.82, String(at64q4.onGpu));
    const at100q8 = gpuSplit({ ...base, ctx: 100_000, cache: 'q8_0' });
    assert.ok(at100q8.onGpu > 0.45 && at100q8.onGpu < 0.6, String(at100q8.onGpu));
    assert.equal(gpuSplit({ ...base, modelBytes: 5e9, ctx: 32_768, cache: 'q8_0' }).onGpu, 1);
  });

  it('counts VRAM used by other programs, not by a running llama-server', () => {
    assert.equal(parseVramOther('11102\n', 'brave, 604\n/app/llama-server, 9466\nsunshine, 187\n'), 1.6);
    assert.equal(parseVramOther('900\n', 'C:\\llama\\llama-server.exe, [N/A]\n'), 0.9);
    assert.equal(parseVramOther('', ''), undefined);
  });
});

describe('GPU placement plan', () => {
  it('reads tensor sizes from the tensor table', () => {
    const header = Buffer.concat([Buffer.from('GGUF'), u32(3), u64(2), u64(0)]);
    const info = (name: string, offset: number): Buffer => Buffer.concat([u64(name.length), Buffer.from(name), u32(1), u64(4), u32(0), u64(offset)]);
    const head = Buffer.concat([header, info('blk.0.ffn_up.weight', 0), info('output.weight', 96)]);
    const dataStart = Math.ceil(head.length / 32) * 32;
    const { tensors } = parseGguf(head, dataStart + 96 + 40);
    assert.deepEqual(tensors, [
      { name: 'blk.0.ffn_up.weight', bytes: 96 },
      { name: 'output.weight', bytes: 40 },
    ]);
  });

  it('counts everything llama-server puts on the GPU, and lists dense FFN weights largest first', () => {
    const MIB = 1024 * 1024;
    const meta = { 'general.architecture': 'qwen35', 'qwen35.block_count': 3, 'qwen35.nextn_predict_layers': 1, 'qwen35.attention.head_count': 2, 'qwen35.attention.head_count_kv': 1, 'qwen35.attention.key_length': 128 };
    const tensors = [
      { name: 'token_embd.weight', bytes: 500 * MIB }, // stays on the CPU
      { name: 'output.weight', bytes: 100 * MIB },
      { name: 'blk.0.attn_q.weight', bytes: 50 * MIB },
      { name: 'blk.0.ffn_up.weight', bytes: 30 * MIB },
      { name: 'blk.0.ffn_down.weight', bytes: 30 * MIB },
      { name: 'blk.1.ffn_gate.weight', bytes: 80 * MIB },
      { name: 'blk.2.ffn_up.weight', bytes: 999 * MIB }, // multi-token-prediction layer: not loaded
    ];
    const plan = gpuPlan(meta, tensors, 1024 * 1024, 'q4_0')!;
    // 290 MiB of weights; cache: 1 Mi tokens x 2 layers (the third is MTP) x 1 head x 256 x 18/32 bytes = 288 MiB
    assert.equal(plan.needMib, 290 + 288 + GPU_OVERHEAD_MIB);
    assert.deepEqual(plan.ffn, [[1, 80], [0, 60]]);
    assert.equal(formatGpuPlan(plan), `need=${290 + 288 + GPU_OVERHEAD_MIB};ffn=1:80,0:60`);
    assert.equal(gpuPlan(meta, [{ name: 'blk.0.attn_q.weight', bytes: MIB }], 4096, 'q4_0'), undefined);
  });
});
