/**
 * Adds this PC to the fleet, or pauses/unpauses a machine. Used by setup.ps1 and the Docker setup;
 * also runnable by hand from an agent checkout:
 *
 *   node setup/machine.ts register --model-file <path to .gguf> [--out result.json]
 *   node setup/machine.ts register --model-name <model id> [--out result.json]   (model served elsewhere)
 *   node setup/machine.ts unpause <id>      (after its health check passed)
 *   node setup/machine.ts pause <id>
 *
 * New machines are pushed as `paused` (see agents/machines.json), so the PO plans nothing for them
 * until setup has seen the machine work end to end.
 */
import fs from 'node:fs';
import path from 'node:path';
import type { MachineConfig, Role } from '../loop/config.ts';
import { REPO } from '../loop/paths.ts';
import { TASK_SIZES, type TaskSize } from '../loop/tasks.ts';
import { addMachine, hardwareLabel, parseModelFile, setPaused, sizeForTier, suggestCapabilities, suggestMachineId, suggestNotes, validateMachineId, type Hardware } from './lib/fleet.ts';
import { modelBytes } from '../loop/gguf.ts';
import { detectHardware } from './lib/hardware.ts';
import { ask, askValid, closePrompts, flag, note, ok, step, yesNo } from './lib/prompt.ts';
import { readFleet, updateFleetAndPush } from './lib/publish.ts';

const ROLES: Role[] = ['po', 'architect', 'dev'];

/**
 * Asks for the new machine's details (with suggestions), then pushes it as a paused machine. Returns its id.
 * `model` is the GGUF path, or just a model name when the file isn't on this machine.
 */
export async function registerMachine(model: string, hw: Hardware = detectHardware()): Promise<string> {
  step('Register this PC as a new machine');
  const fleet = readFleet(REPO);
  const taken = Object.keys(fleet.machines);
  note(`detected: ${hw.cpu || 'unknown CPU'}, ${hw.gpu ? `${hw.gpu} (${hw.vramGb} GB VRAM)` : 'no NVIDIA GPU'}, ${hw.ramGb} GB RAM, host "${hw.hostname}"`);
  note(`existing machines: ${taken.join(', ') || 'none'}`);

  const id = await askValid('Machine id (also the task folder and git author agent-<id>)', suggestMachineId(hw.hostname, taken), (v) => validateMachineId(v, taken));
  const label = await ask('Label (hardware, shown to the PO and on the build log)', hardwareLabel(hw));
  const info = parseModelFile(model.endsWith('.gguf') ? model : `${model}.gguf`);
  const modelLabel = await ask('Model (as shown to the PO)', info.label);
  const sizeGb = fs.existsSync(model) ? modelBytes(model) / 1e9 : 0;
  const s = suggestCapabilities(info, sizeGb, hw);
  note(`suggested from the quant (${info.quant || '?'}, ~${info.bits} bits)${sizeGb ? ` and a ${sizeGb.toFixed(1)} GB model on ${hw.vramGb} GB VRAM` : ''}; press Enter to accept`);
  const tier = await ask('Tier (free text the PO sees, e.g. strong / fast / weak)', s.tier);
  const sizeDefault = tier === s.tier ? s.maxTaskSize : (sizeForTier(tier) ?? s.maxTaskSize);
  const maxTaskSize = (await askValid('Biggest task size it may get (S, M or L)', sizeDefault, (v) => (TASK_SIZES.includes(v.toUpperCase() as TaskSize) ? null : 'S, M or L'))).toUpperCase() as TaskSize;
  const targetQueue = Number(await askValid('Tasks to keep queued for it', String(maxTaskSize === s.maxTaskSize ? s.targetQueue : 2), (v) => (/^[1-9]$/.test(v) ? null : 'a number from 1 to 9')));
  const roles = (await askValid('Roles (comma-separated: dev, architect, po)', 'dev', (v) => {
    const list = v.split(',').map((r) => r.trim());
    return list.length && list.every((r) => ROLES.includes(r as Role)) ? null : `only ${ROLES.join(', ')}`;
  }))
    .split(',')
    .map((r) => r.trim() as Role);
  let architectMode: MachineConfig['architectMode'];
  if (roles.includes('architect') && roles.includes('dev')) {
    architectMode = (await askValid(
      'When should it design tasks? "idle" = only when it has nothing to build (own tasks first), "always" = every cycle, before building',
      'idle',
      (v) => (v === 'idle' || v === 'always' ? null : 'idle or always'),
    )) as MachineConfig['architectMode'];
  }
  const suggestedNotes = suggestNotes(maxTaskSize, info, sizeGb, hw);
  console.log(`   Suggested notes for the PO (from the model and the size you chose):\n     ${suggestedNotes}`);
  const notes = await ask('Notes (Enter keeps the suggestion)', suggestedNotes);

  const entry: Omit<MachineConfig, 'paused'> = { label, model: modelLabel, roles, ...(architectMode ? { architectMode } : {}), tier, maxTaskSize, targetQueue, notes };
  console.log(`\n   ${id}: ${JSON.stringify(entry, null, 2).replace(/\n/g, '\n   ')}`);
  if (!(await yesNo('Add it to agents/machines.json and push (paused until its health check passes)?', true))) throw new Error('registration cancelled');
  await updateFleetAndPush(REPO, `agent-${id}`, (f) => addMachine(f, id, entry), `Register machine "${id}": ${label}, ${modelLabel} (paused until its health check passes)`);
  ok(`"${id}" is in agents/machines.json (paused)`);
  return id;
}

export async function setMachinePaused(id: string, paused: boolean): Promise<void> {
  await updateFleetAndPush(
    REPO,
    `agent-${id}`,
    (f) => setPaused(f, id, paused),
    paused ? `Pause machine "${id}"` : `Unpause machine "${id}": its health check passed`,
  );
  ok(`"${id}" is ${paused ? 'paused' : 'active: the PO will start planning for it'}`);
}

async function main(): Promise<void> {
  const [command, arg] = process.argv.slice(2);
  try {
    if (command === 'register') {
      const model = flag('model-file') ?? flag('model-name');
      if (!model || (flag('model-file') && !fs.existsSync(model))) throw new Error('--model-file <existing .gguf> or --model-name <model id> is required');
      const id = await registerMachine(model);
      const out = flag('out');
      if (out) fs.writeFileSync(out, JSON.stringify({ machineId: id }));
    } else if ((command === 'pause' || command === 'unpause') && arg) {
      await setMachinePaused(arg, command === 'pause');
    } else {
      console.log('usage: node setup/machine.ts register (--model-file <gguf> | --model-name <id>) [--out file] | pause <id> | unpause <id>');
      process.exitCode = 2;
    }
  } catch (err) {
    console.error(`\n   !!  ${(err as Error).message}`);
    process.exitCode = 1;
  } finally {
    closePrompts();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) await main();
