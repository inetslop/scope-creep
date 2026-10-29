import fs from 'node:fs';
import path from 'node:path';
import type { Git } from './git.ts';
import { info, warn } from './log.ts';
import { INBOX_DIR, TASKS_DIR, TASKS_REL } from './paths.ts';
import { commitAndPush } from './sync.ts';
import { formatTaskId, listTasks, maxTaskNumber, parseTask, taskFileName, writeTask, type Task } from './tasks.ts';

/**
 * The task inbox: <project>/tasks/inbox/*.md, tasks without an id that anyone (a human, a script)
 * can drop in. The PO machine's runner numbers them every loop, before it plans (importInbox): it
 * is the only place ids are handed out (its PO cycles take the next ids after these), so no two
 * tasks ever get the same number. Each one goes into the pool as tasks/<id>-<slug>.md, status
 * `design`, and its inbox file is removed.
 *
 * An inbox file is a task file without the runner's fields; everything but the body is optional:
 *
 *   ---
 *   title: The exit shows what is left     (else the first "# " heading, else the file name)
 *   size: S                                (S, M or L; default M)
 *   priority: 1                            (1 most urgent to 3; default 2)
 *   depends_on: [T0103]                    (ids of tasks that exist; unknown ones are dropped)
 *   epic: E2
 *   ---
 *
 *   ## Goal
 *   ...
 *
 * README.md in the folder explains this and is never imported.
 */

/** Fields the runner owns: ignored in an inbox file, set by the import. */
const RUNNER_FIELDS = /^(id|status|assignee|attempts|created|claimed_at|finished_at|commit|designer|design_attempts)\s*:/i;

/** An inbox file as a task with no id yet (`id` is a placeholder). Throws on a malformed file. */
export function parseInboxFile(text: string, fileName: string): Task {
  const normalized = text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const fm = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/.exec(normalized);
  let front = (fm?.[1] ?? '')
    .split('\n')
    .filter((l) => !RUNNER_FIELDS.test(l.trim()))
    .join('\n');
  let body = fm ? fm[2]! : normalized;
  if (!/^\s*title\s*:/im.test(front)) {
    const heading = /^#\s+(.+)$/m.exec(body);
    const title = heading ? heading[1]!.trim() : fileName.replace(/\.md$/i, '').replace(/[-_]+/g, ' ').trim();
    if (heading) body = body.replace(heading[0], '');
    front += `\ntitle: ${JSON.stringify(title)}`;
  }
  return parseTask(`---\nid: T0000\n${front.trim()}\n---\n${body.replace(/^\n+/, '')}`, path.join(TASKS_DIR, 'T0000-inbox.md'));
}

export interface InboxResult {
  /** The numbered tasks, ready to write into the pool (in inbox file name order). */
  tasks: Task[];
  /** Inbox files that could not be read, and why (they stay in the inbox). */
  skipped: { name: string; reason: string }[];
  /** Dependencies dropped because no such task exists, per new task id. */
  dropped: { id: string; deps: string[] }[];
}

/**
 * Numbers inbox files after every task in `all` (the pool and the archive): ids from the highest
 * one + 1, in file name order. Pure: the caller writes the tasks and removes the files.
 */
export function numberInbox(files: readonly { name: string; text: string }[], all: readonly Task[], nowIso: string): InboxResult {
  const known = new Set(all.map((t) => t.id));
  let next = maxTaskNumber(all) + 1;
  const result: InboxResult = { tasks: [], skipped: [], dropped: [] };
  for (const f of [...files].sort((a, b) => a.name.localeCompare(b.name))) {
    let t: Task;
    try {
      t = parseInboxFile(f.text, f.name);
    } catch (err) {
      result.skipped.push({ name: f.name, reason: (err as Error).message });
      continue;
    }
    const id = formatTaskId(next++);
    const unknown = t.dependsOn.filter((d) => !known.has(d));
    if (unknown.length) result.dropped.push({ id, deps: unknown });
    const task: Task = { ...t, id, status: 'design', assignee: '', attempts: 0, created: nowIso, dependsOn: t.dependsOn.filter((d) => known.has(d)) };
    task.file = path.join(TASKS_DIR, taskFileName(task));
    known.add(id);
    result.tasks.push(task);
  }
  return result;
}

/** The inbox files waiting to be numbered (not README.md). */
function inboxFiles(): string[] {
  if (!fs.existsSync(INBOX_DIR)) return [];
  return fs.readdirSync(INBOX_DIR).filter((f) => f.toLowerCase().endsWith('.md') && f.toLowerCase() !== 'readme.md');
}

/**
 * Numbers what waits in the inbox and pushes it into the pool, in one commit. Run by the PO
 * machine only (see the module comment). Returns the new ids. A file that can't be read stays in
 * the inbox, with a warning.
 */
export async function importInbox(git: Git): Promise<string[]> {
  const names = inboxFiles();
  if (names.length === 0) return [];
  const files = names.map((name) => ({ name, text: fs.readFileSync(path.join(INBOX_DIR, name), 'utf8') }));
  const result = numberInbox(files, listTasks(true).tasks, new Date().toISOString().slice(0, 19) + 'Z');
  for (const s of result.skipped) warn(`inbox: ${s.name} left in the inbox: ${s.reason}`);
  for (const d of result.dropped) warn(`inbox: ${d.id} depended on ${d.deps.join(', ')}, which don't exist; dropped`);
  if (result.tasks.length === 0) return [];
  for (const t of result.tasks) writeTask(t);
  for (const f of files) {
    if (!result.skipped.some((s) => s.name === f.name)) fs.rmSync(path.join(INBOX_DIR, f.name));
  }
  const list = result.tasks.map((t) => `${t.id} ${t.title}`);
  const pushed = await commitAndPush(git, [TASKS_REL], `tasks: numbered ${list.length} from the inbox\n\n${list.map((l) => `- ${l}`).join('\n')}`);
  if (pushed) info(`inbox: numbered ${list.join('; ')}`);
  return pushed ? result.tasks.map((t) => t.id) : [];
}
