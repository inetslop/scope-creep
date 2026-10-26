/**
 * End-to-end health check for this machine: `npm run doctor` (add `-- --gate` to also run the merge gate).
 * Setup runs it at the end. Every step prints PASS/FAIL with a hint.
 */
import { runAgent } from './claude.ts';
import { ensureGameDeps, runGate } from './checks.ts';
import { loadFleet, loadLocalConfig, type LocalConfig } from './config.ts';
import { run } from './exec.ts';
import { detectContextSize, ensureLlama, MIN_CONTEXT } from './llama.ts';
import { GAME_DIR, REPO } from './paths.ts';

let failures = 0;
const pass = (m: string): void => console.log(`  PASS  ${m}`);
const fail = (m: string, hint: string): void => {
  failures++;
  console.log(`  FAIL  ${m}\n        -> ${hint}`);
};

async function messagesApi(local: LocalConfig): Promise<string> {
  const started = Date.now();
  const res = await fetch(`${local.llama.baseUrl.replace(/\/+$/, '')}/v1/messages`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': local.llama.authToken, authorization: `Bearer ${local.llama.authToken}`, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: local.llama.model, max_tokens: 400, messages: [{ role: 'user', content: 'Reply with the single word OK.' }] }),
    signal: AbortSignal.timeout(300_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const body = (await res.json()) as { content?: { type: string; text?: string }[] };
  const text = (body.content ?? []).filter((c) => c.type === 'text').map((c) => c.text).join('').trim();
  return `${JSON.stringify(text.slice(0, 60))} in ${((Date.now() - started) / 1000).toFixed(1)}s`;
}

async function main(): Promise<void> {
  console.log('\nScope Creep doctor\n');
  const local = loadLocalConfig();
  const fleet = loadFleet();
  const machine = fleet.machines[local.machineId];
  if (machine) pass(`machine "${local.machineId}": ${machine.label} (${machine.roles.join(' + ')})`);
  else fail(`machine "${local.machineId}" is not in agents/machines.json`, 'Re-run setup and pick a listed machine.');

  const git = await run('git', ['remote', 'get-url', 'origin'], { cwd: REPO });
  if (git.code === 0) pass(`git remote ${git.stdout.trim()}`);
  else fail('no git remote "origin"', 'Clone the repo with git clone instead of downloading a zip.');
  const push = await run('git', ['push', '--dry-run', '--quiet', 'origin', 'HEAD:main'], { cwd: REPO, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  if (push.code === 0) pass('git can push to origin');
  else fail('git cannot push to origin', `Run "gh auth login" then "gh auth setup-git". (${push.stderr.trim().split('\n')[0]})`);

  const version = await run(local.claudePath, ['--version'], { shell: /\.(cmd|bat)$/i.test(local.claudePath) });
  if (version.code === 0) pass(`Claude Code ${version.stdout.trim()}`);
  else fail(`Claude Code not runnable at ${local.claudePath}`, 'Re-run setup (it installs Claude Code).');

  if (await ensureLlama(local)) {
    pass(`model server ${local.llama.baseUrl} is up (model id "${local.llama.model}")`);
    const ctx = await detectContextSize(local);
    if (ctx >= MIN_CONTEXT) pass(`context window: ${ctx} tokens (${local.llama.ctxSize ? 'fixed' : 'auto'})`);
    else fail(`context window is only ${ctx} tokens`, `Claude Code needs at least ${MIN_CONTEXT}. Free memory, use a smaller quant, or set llama.ctxSize.`);
  } else {
    fail(`model server ${local.llama.baseUrl} is not healthy`, 'Check .agent\\logs\\llama-server.log and the paths in .agent\\local.json.');
  }

  try {
    pass(`Anthropic Messages API answered ${await messagesApi(local)}`);
  } catch (err) {
    fail(`POST /v1/messages failed: ${(err as Error).message}`, 'llama-server must be a recent build (Anthropic API support landed Jan 2026).');
  }

  const agent = await runAgent(local, {
    label: 'doctor',
    prompt: 'This is a connectivity test. Do not use any tools. Reply with exactly: DOCTOR OK',
    cwd: GAME_DIR,
    profile: 'dev',
    maxTurns: 2,
    timeoutMin: 10,
  });
  if (agent.result.includes('DOCTOR OK')) pass(`Claude Code -> local model round trip (${(agent.durationMs / 1000).toFixed(0)}s)`);
  else fail(`Claude Code session did not answer as expected (${agent.subtype}): ${agent.result.slice(0, 200)}`, `See the transcript: ${agent.transcript}`);

  if (process.argv.includes('--gate')) {
    await ensureGameDeps();
    const gate = await runGate(fleet.loop.smokeSeconds);
    if (gate.ok) pass('merge gate (npm run check + browser smoke test)');
    else fail(`merge gate failed at ${gate.stage}`, gate.output.split('\n').slice(-8).join('\n        '));
  }

  console.log(failures === 0 ? '\nAll good. Start the loop with: npm run agent\n' : `\n${failures} problem(s) found.\n`);
  process.exit(failures === 0 ? 0 : 1);
}

void main();
