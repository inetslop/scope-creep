/**
 * The interactive part of the Linux/Docker setup. Runs INSIDE the agent container (started by
 * setup/docker/agent.sh setup), with the agent's folder mounted at /data:
 *
 *   /data/repo     this checkout (the runner's own clone)
 *   /data/models   GGUF files, also mounted read-only into the llama container
 *   /data/.env     docker compose settings: which model llama-server loads, with which arguments
 *
 * Picks the machine (an existing one, or registers this PC as a new, paused machine), picks or
 * downloads the model, writes .agent/local.json and /data/.env, and installs dependencies.
 * Writes /data/setup-result.json for agent.sh: { machineId, isNew, paused }.
 */
import fs from 'node:fs';
import path from 'node:path';
import { LOCAL_CONFIG_FILE, type LocalConfig } from '../../loop/config.ts';
import { run } from '../../loop/exec.ts';
import { MIN_CONTEXT } from '../../loop/llama.ts';
import { GAME_DIR, REPO } from '../../loop/paths.ts';
import { detectHardware } from '../lib/hardware.ts';
import { askValid, choose, closePrompts, note, ok, problem, step } from '../lib/prompt.ts';
import { readFleet } from '../lib/publish.ts';
import { modelBytes, registerMachine } from '../machine.ts';
import { DEFAULT_REPO, pickAndDownload } from '../models.ts';
import { readEnv, writeEnv } from './env.ts';

const DATA = '/data';
const MODELS = path.join(DATA, 'models');
const ENV_FILE = path.join(DATA, '.env');
/** Same sampling and KV-cache settings the Windows machines use (setup.ps1). */
const DEFAULT_LLAMA_EXTRA = '--cache-type-k q8_0 --cache-type-v q8_0 --temp 0.6 --top-p 0.95 --top-k 20 --min-p 0';

function localGgufs(): string[] {
  if (!fs.existsSync(MODELS)) return [];
  return fs
    .readdirSync(MODELS)
    .filter((f) => f.endsWith('.gguf') && !/^(mmproj|mtp-|imatrix|dflash-)/i.test(f) && (!/-\d{5}-of-\d{5}\.gguf$/.test(f) || /-00001-of-\d{5}\.gguf$/.test(f)))
    .sort()
    .map((f) => path.join(MODELS, f));
}

async function sh(cmd: string, args: string[], cwd: string): Promise<void> {
  note(`${cmd} ${args.join(' ')}  (in ${path.relative(DATA, cwd) || '.'})`);
  const r = await run(cmd, args, { cwd, timeoutMs: 30 * 60_000, onStdoutLine: (l) => l.trim() && console.log(`       ${l}`) });
  if (r.code !== 0) throw new Error(`${cmd} ${args.join(' ')} failed (exit ${r.code}):\n${r.stderr.slice(-2000)}`);
}

async function main(): Promise<void> {
  if (!fs.existsSync(path.join(DATA, 'repo')) || path.resolve(REPO) !== path.join(DATA, 'repo')) {
    throw new Error('run this through setup/docker/agent.sh setup (it expects the agent folder at /data)');
  }
  const hw = detectHardware();
  const existing = fs.existsSync(LOCAL_CONFIG_FILE) ? (JSON.parse(fs.readFileSync(LOCAL_CONFIG_FILE, 'utf8')) as LocalConfig) : undefined;
  const env = readEnv(ENV_FILE);

  // ------------------------------------------------------------ model
  step('Model');
  const local = localGgufs();
  const current = existing?.llama.modelPath && fs.existsSync(existing.llama.modelPath) ? existing.llama.modelPath : undefined;
  const options = [...(current ? [current] : []), ...local.filter((f) => f !== current), 'download'];
  const picked = await choose(
    `Which model should this machine run? (GGUF files in ${MODELS} on the host: ${path.join(env.AGENT_HOME ?? '~/scope-creep-agent', 'models')})`,
    options,
    (o) => (o === 'download' ? 'Download one from Hugging Face' : `${path.basename(o)}  (${(modelBytes(o) / 1e9).toFixed(1)} GB)${o === current ? '  [current]' : ''}`),
    0,
  );
  let modelPath = picked;
  let hfRepo = env.HF_REPO || DEFAULT_REPO;
  if (picked === 'download') ({ modelPath, repo: hfRepo } = await pickAndDownload(MODELS, hfRepo, hw));
  const alias = path.basename(modelPath).replace(/(-00001-of-\d{5})?\.gguf$/i, '').toLowerCase();

  const ctxAnswer = await askValid(
    'Context size: "auto" = largest that fits in memory (recommended), or a number of tokens',
    existing?.llama.ctxSize ? String(existing.llama.ctxSize) : 'auto',
    (v) => (v === 'auto' || (Number.isInteger(Number(v)) && Number(v) >= MIN_CONTEXT) ? null : `"auto" or at least ${MIN_CONTEXT}`),
  );
  const ctxSize = ctxAnswer === 'auto' ? 0 : Number(ctxAnswer);
  ok(`model ${path.basename(modelPath)} served as "${alias}", context ${ctxAnswer}`);

  // ------------------------------------------------------------ identity
  step('Machine identity');
  const fleet = readFleet(REPO);
  const ids = Object.keys(fleet.machines);
  const NEW = '+new';
  const previous = existing?.machineId && ids.includes(existing.machineId) ? existing.machineId : undefined;
  const machineChoice = await choose(
    'Which machine is this?',
    [...(previous ? [] : [NEW]), ...ids, ...(previous ? [NEW] : [])],
    (id) => (id === NEW ? 'A new machine: register this PC' : `${id} - ${fleet.machines[id]!.label} (${fleet.machines[id]!.model})${fleet.machines[id]!.paused ? ' [paused]' : ''}`),
    previous ? ids.indexOf(previous) : 0,
  );
  const isNew = machineChoice === NEW;
  const machineId = isNew ? await registerMachine(modelPath, hw) : machineChoice;
  await run('git', ['config', 'user.name', `agent-${machineId}`], { cwd: REPO });
  await run('git', ['config', 'user.email', `agent-${machineId}@scope-creep.local`], { cwd: REPO });
  ok(`this is "${machineId}"`);

  // ------------------------------------------------------------ config files
  const config: LocalConfig = {
    machineId,
    claudePath: 'claude',
    llama: { mode: 'external', baseUrl: 'http://llama:8080', model: alias, authToken: 'local', ctxSize, modelPath, modelsDir: MODELS },
  };
  fs.mkdirSync(path.dirname(LOCAL_CONFIG_FILE), { recursive: true });
  fs.writeFileSync(LOCAL_CONFIG_FILE, JSON.stringify(config, null, 2));
  const ctxArgs = ctxSize ? `-c ${ctxSize}` : `--fit-ctx ${MIN_CONTEXT}`;
  writeEnv(ENV_FILE, {
    MACHINE_ID: machineId,
    MODEL_FILE: path.relative(MODELS, modelPath),
    MODEL_ALIAS: alias,
    HF_REPO: hfRepo,
    LLAMA_ARGS: `${ctxArgs} ${env.LLAMA_EXTRA_ARGS || DEFAULT_LLAMA_EXTRA}`,
  });
  ok(`wrote ${LOCAL_CONFIG_FILE} and ${ENV_FILE}`);

  // ------------------------------------------------------------ dependencies
  step('Dependencies');
  await sh('npm', ['ci', '--no-audit', '--no-fund'], REPO);
  await sh('npx', ['playwright', 'install', 'chromium'], REPO);
  await sh('npm', ['ci', '--no-audit', '--no-fund'], GAME_DIR);
  ok('npm packages and Chromium installed');

  fs.writeFileSync(path.join(DATA, 'setup-result.json'), JSON.stringify({ machineId, isNew, paused: Boolean(readFleet(REPO).machines[machineId]?.paused) }));
}

main()
  .catch((err: Error) => {
    problem(err.message);
    process.exitCode = 1;
  })
  .finally(closePrompts);
