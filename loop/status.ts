/**
 * Quick overview for humans: `npm run status` (from the repo root).
 * Shows each machine's queue, recently finished tasks and the local model server.
 */
import fs from 'node:fs';
import path from 'node:path';
import { LOCAL_CONFIG_FILE, loadFleet, loadLocalConfig } from './config.ts';
import { run } from './exec.ts';
import { detectContextSize, isHealthy } from './llama.ts';
import { ARCHIVE_DIR, REPO } from './paths.ts';
import { loadState } from './state.ts';
import { designedFiles, listTasks, unblockedTaskIds } from './tasks.ts';

const fleet = loadFleet();
const ids = Object.keys(fleet.machines);
const { tasks, invalid } = listTasks(ids, true);
const unblocked = unblockedTaskIds(tasks);
const done = new Set(tasks.filter((t) => t.status === 'done').map((t) => t.id));

console.log('\nQUEUES');
for (const id of ids) {
  const m = fleet.machines[id]!;
  const mine = tasks.filter((t) => path.basename(path.dirname(t.file)) === id);
  const count = (s: string): number => mine.filter((t) => t.status === s).length;
  console.log(
    `  ${id.padEnd(9)} ${(m.paused ? 'PAUSED' : m.model).padEnd(24)} design ${count('design') + count('designing')}  todo ${count('todo')}  in-progress ${count('in-progress')}  done ${count('done')}  failed ${count('failed')}`,
  );
  const marks: Record<string, string> = { 'in-progress': '▶', todo: '·', design: '✎', designing: '✍' };
  for (const t of mine.filter((x) => x.status in marks).sort((a, b) => a.id.localeCompare(b.id))) {
    const who = t.status === 'designing' ? ` (designing: ${t.extra.designer ?? '?'})` : '';
    const blocked = unblocked.has(t.id) ? '' : ` (blocked: waits on ${t.dependsOn.filter((d) => !done.has(d)).join(', ')})`;
    console.log(`      ${t.id} ${marks[t.status]} [${t.size}] ${t.title}${who}${blocked}`);
    // What a task being built will touch, so a hand edit to the same files can wait for it.
    const files = t.status === 'in-progress' ? designedFiles(t) : [];
    if (files.length) console.log(`          touches ${files.map((f) => `game/${f}`).join(', ')}`);
  }
  console.log('      legend: ✎ waiting for design  ✍ being designed  · ready  ▶ in progress');
}

const archived = tasks.filter((t) => path.dirname(t.file) === ARCHIVE_DIR);
console.log(`\nARCHIVE  ${archived.filter((t) => t.status === 'done').length} done, ${archived.filter((t) => t.status === 'failed').length} failed`);
if (invalid.size) {
  console.log('\nINVALID TASK FILES');
  for (const [f, e] of invalid) console.log(`  ${path.relative(REPO, f)}: ${e}`);
}

const log = await run('git', ['log', '-12', '--format=%h %ar  %an: %s'], { cwd: REPO });
console.log(`\nRECENT COMMITS\n${log.stdout.replace(/^/gm, '  ').trimEnd()}`);

if (fs.existsSync(LOCAL_CONFIG_FILE)) {
  const local = loadLocalConfig();
  const state = loadState();
  console.log(`\nTHIS MACHINE  ${local.machineId}`);
  const healthy = await isHealthy(local);
  console.log(`  model server ${local.llama.baseUrl} (${local.llama.model}): ${healthy ? `healthy, context ${await detectContextSize(local)}` : 'NOT RESPONDING'}`);
  if (state.lastPoRunAt) console.log(`  last PO cycle: ${state.lastPoRunAt} (#${state.poCycles})`);
} else {
  console.log('\nTHIS MACHINE  not set up (no .agent/local.json)');
}
console.log('');
