/**
 * Quick overview for humans: `npm run status` (from the repo root).
 * Shows what each machine is doing, the shared task pool, recent commits and the local model server.
 */
import fs from 'node:fs';
import path from 'node:path';
import { LOCAL_CONFIG_FILE, loadFleet, loadLocalConfig } from './config.ts';
import { run } from './exec.ts';
import { detectContextSize, isHealthy } from './llama.ts';
import { ARCHIVE_DIR, GAME_REL, PROJECT, REPO } from './paths.ts';
import { loadState } from './state.ts';
import { designedFiles, listTasks, unblockedTaskIds } from './tasks.ts';

const fleet = loadFleet();
const { tasks, invalid } = listTasks(true);
const unblocked = unblockedTaskIds(tasks);
const done = new Set(tasks.filter((t) => t.status === 'done').map((t) => t.id));
const open = tasks.filter((t) => path.dirname(t.file) !== ARCHIVE_DIR && t.status !== 'done' && t.status !== 'failed');

console.log(`\nMACHINES (project ${PROJECT})`);
for (const [id, m] of Object.entries(fleet.machines)) {
  const building = open.filter((t) => t.status === 'in-progress' && t.assignee === id).map((t) => `building ${t.id}`);
  const designing = open.filter((t) => t.status === 'designing' && t.extra.designer === id).map((t) => `designing ${t.id}`);
  const doing = [...building, ...designing].join(', ') || 'idle';
  console.log(`  ${id.padEnd(14)} ${(m.paused ? 'PAUSED' : m.model).padEnd(24)} up to ${m.maxTaskSize}  ${doing}`);
}

const marks: Record<string, string> = { 'in-progress': '▶', todo: '·', design: '✎', designing: '✍' };
const order: Record<string, number> = { 'in-progress': 0, designing: 1, todo: 2, design: 3 };
console.log(`\nPOOL  ${open.length} open: ${['in-progress', 'todo', 'designing', 'design'].map((s) => `${open.filter((t) => t.status === s).length} ${marks[s]}`).join('  ')}`);
for (const t of [...open].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9) || a.id.localeCompare(b.id))) {
  const who = t.status === 'in-progress' ? ` (${t.assignee})` : t.status === 'designing' ? ` (designing: ${t.extra.designer ?? '?'})` : t.assignee ? ` (${t.assignee}'s own)` : '';
  const epic = t.extra.epic ? ` ${t.extra.epic}` : '';
  const blocked = unblocked.has(t.id) ? '' : ` (blocked: waits on ${t.dependsOn.filter((d) => !done.has(d)).join(', ')})`;
  const waiting = t.status === 'todo' && t.dependsOn.some((d) => !done.has(d)) && unblocked.has(t.id) ? ` (after ${t.dependsOn.filter((d) => !done.has(d)).join(', ')})` : '';
  console.log(`  ${t.id} ${marks[t.status] ?? '?'} [${t.size}${epic}] ${t.title}${who}${blocked}${waiting}`);
  // What a task being built will touch, so a hand edit to the same files can wait for it.
  const files = t.status === 'in-progress' ? designedFiles(t) : [];
  if (files.length) console.log(`      touches ${files.map((f) => `${GAME_REL}${f}`).join(', ')}`);
}
console.log('  legend: ✎ waiting for design  ✍ being designed  · ready  ▶ in progress');

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
