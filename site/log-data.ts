/**
 * Data for the public build log: what got built, by which machine, and how long it took.
 * Pure functions over runner-written records (finished task files + the runner's own commit
 * messages), so nothing an agent writes during a session can change the numbers.
 */
import type { Task } from '../loop/tasks.ts';

export interface Feature {
  id: string;
  title: string;
  size: Task['size'];
  /** Machine whose attempt shipped it. */
  builtBy: string;
  /** Machine that wrote the design, if the task was designed. */
  designedBy?: string;
  /** Wall-clock minutes of the successful attempt, as measured by the runner (build, checks, review, merge). */
  buildMin?: number;
  /** Minutes from design claim to design ready. */
  designMin?: number;
  /** Minutes from the PO writing the task to it being merged. */
  leadMin?: number;
  attempts: number;
  createdAt?: string;
  finishedAt?: string;
  /** First sentence of the builder's summary. */
  summary: string;
  /** The task's game commit on main. */
  commit?: string;
}

/** A game change made outside the loop (by a person, possibly with an assistant). */
export interface HandChange {
  sha: string;
  author: string;
  coAuthors: string[];
  date: string;
  subject: string;
}

export interface Commit {
  sha: string;
  author: string;
  /** Committer date (ISO): when it landed in this shape on main. */
  date: string;
  subject: string;
  body: string;
}

/** Separators for `git log --format`, so subjects and bodies can contain anything. */
export const GIT_LOG_FORMAT = '%H%x1f%an%x1f%cI%x1f%s%x1f%b%x1e';

export function parseGitLog(out: string): Commit[] {
  return out
    .split('\x1e')
    .map((rec) => rec.replace(/^\n+/, ''))
    .filter((rec) => rec.includes('\x1f'))
    .map((rec) => {
      const [sha = '', author = '', date = '', subject = '', body = ''] = rec.split('\x1f');
      return { sha, author, date, subject, body: body.trim() };
    });
}

const isAgent = (author: string): boolean => author.startsWith('agent-');
const minutesBetween = (from?: string, to?: string): number | undefined => {
  if (!from || !to) return undefined;
  const ms = Date.parse(to) - Date.parse(from);
  return Number.isFinite(ms) && ms >= 0 ? ms / 60_000 : undefined;
};

/** Shortens at a word boundary. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max / 2)).replace(/[\s,;:(—-]+$/, '')}…`;
}

/** The last "## Result (attempt N, machine)" section: who shipped it, their summary and the measured time. */
export function parseResult(body: string): { machine?: string; summary: string; buildMin?: number } {
  const all = [...`\n${body}`.matchAll(/\n## Result \(attempt \d+, ([^)]+)\)\n([\s\S]*?)(?=\n## |$)/g)];
  const last = all.at(-1);
  if (!last) return { summary: '' };
  const section = last[2] ?? '';
  const prose = section.split(/\n- |\n```/)[0]!.replace(/\s+/g, ' ').trim();
  const summary = /^(.{20,240}?[.!?])(\s|$)/.exec(prose)?.[1] ?? clip(prose, 200);
  const time = /\n- Time: ([\d.]+) min/.exec(section)?.[1];
  return { machine: last[1]!.trim(), summary, buildMin: time !== undefined ? Number(time) : undefined };
}

export function parseDesigner(body: string): string | undefined {
  return /\n## Design \(architect, ([^)]+)\)/.exec(`\n${body}`)?.[1]?.trim();
}

/** Minutes the successful design took: last "design claimed" before the first "design ready". */
export function designMinutes(id: string, commits: readonly Commit[]): number | undefined {
  const own = commits.filter((c) => c.subject.startsWith(`${id}: design `)).sort((a, b) => a.date.localeCompare(b.date));
  const ready = own.find((c) => c.subject === `${id}: design ready`);
  if (!ready) return undefined;
  const claim = own.filter((c) => c.subject.startsWith(`${id}: design claimed`) && c.date <= ready.date).at(-1);
  return minutesBetween(claim?.date, ready.date);
}

/**
 * Done tasks as features, newest first. `commits` is the full history (task status commits);
 * `gameCommits` only the commits that touched game/ (to link each task to its code).
 */
export function collectFeatures(tasks: readonly Task[], commits: readonly Commit[], gameCommits: readonly Commit[]): Feature[] {
  const codeFor = new Map<string, string>();
  for (const c of gameCommits) {
    const id = /^(T\d{3,}): /.exec(c.subject)?.[1];
    if (id && isAgent(c.author)) codeFor.set(id, c.sha);
  }
  const seen = new Set<string>();
  return tasks
    .filter((t) => t.status === 'done' && !seen.has(t.id) && seen.add(t.id))
    .map((t) => {
      const result = parseResult(t.body);
      return {
        id: t.id,
        title: t.title,
        size: t.size,
        builtBy: result.machine ?? t.assignee,
        designedBy: parseDesigner(t.body),
        buildMin: result.buildMin,
        designMin: designMinutes(t.id, commits),
        leadMin: minutesBetween(t.created, t.finishedAt),
        attempts: Math.max(1, t.attempts),
        createdAt: t.created,
        finishedAt: t.finishedAt,
        summary: result.summary,
        commit: codeFor.get(t.id),
      };
    })
    .sort((a, b) => (b.finishedAt ?? '').localeCompare(a.finishedAt ?? '') || b.id.localeCompare(a.id));
}

/** Game commits not made by the loop's agents, newest first. */
export function collectHandChanges(gameCommits: readonly Commit[]): HandChange[] {
  return gameCommits
    .filter((c) => !isAgent(c.author))
    .map((c) => ({
      sha: c.sha,
      author: c.author,
      coAuthors: [...c.body.matchAll(/^Co-Authored-By:\s*(.+?)\s*<[^>]*>\s*$/gim)].map((m) => m[1]!),
      date: c.date,
      subject: c.subject,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Stable ids for "seen" tracking in the viewer's browser: task ids, and hand changes by commit. */
export function itemIds(features: readonly Feature[], hand: readonly HandChange[]): string[] {
  return [...features.map((f) => f.id), ...hand.map((h) => `hand:${h.sha.slice(0, 12)}`)];
}

export interface MachineStats {
  id: string;
  features: number;
  totalBuildMin: number;
  medianBuildMin?: number;
  /** Share of features shipped on the first attempt (0..1). */
  firstTry: number;
}

export function machineStats(features: readonly Feature[], machineIds: readonly string[]): MachineStats[] {
  const ids = [...new Set([...machineIds, ...features.map((f) => f.builtBy)])];
  return ids.map((id) => {
    const mine = features.filter((f) => f.builtBy === id);
    const times = mine.map((f) => f.buildMin).filter((m): m is number => m !== undefined).sort((a, b) => a - b);
    const mid = Math.floor(times.length / 2);
    return {
      id,
      features: mine.length,
      totalBuildMin: times.reduce((s, m) => s + m, 0),
      medianBuildMin: times.length === 0 ? undefined : times.length % 2 ? times[mid] : (times[mid - 1]! + times[mid]!) / 2,
      firstTry: mine.length ? mine.filter((f) => f.attempts === 1).length / mine.length : 0,
    };
  });
}

/** "7 min", "1 h 05 min", "2 d 3 h". */
export function formatMinutes(min: number | undefined): string {
  if (min === undefined) return '—';
  if (min < 1) return '<1 min';
  const m = Math.round(min);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ${String(m % 60).padStart(2, '0')} min`;
  return `${Math.floor(h / 24)} d ${h % 24} h`;
}
