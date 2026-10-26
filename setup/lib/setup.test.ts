import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { REPO } from '../../loop/paths.ts';
import { parseEnv, updateEnvText } from '../docker/env.ts';
import { addMachine, formatFleetJson, hardwareLabel, parseModelFile, setPaused, suggestCapabilities, suggestMachineId, validateMachineId, type FleetFile, type Hardware } from './fleet.ts';
import { parseNvidiaSmi } from './hardware.ts';
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
