import type { Task, TaskSize } from './tasks.ts';

/** Who built a task and how many minutes it took, from its last Result section (written by the runner). */
export function buildMinutes(t: Task): { machine: string; minutes: number } | undefined {
  const all = [...`\n${t.body}`.matchAll(/\n## Result \(attempt \d+, ([^)]+)\)\n([\s\S]*?)(?=\n## |$)/g)];
  const last = all.at(-1);
  const minutes = last ? Number(/\n- Time: ([\d.]+) min/.exec(last[2] ?? '')?.[1]) : Number.NaN;
  return last && Number.isFinite(minutes) ? { machine: last[1]!.trim(), minutes } : undefined;
}

function median(values: readonly number[]): number {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/**
 * How fast each machine builds, as a pace: each of its builds' minutes over the fleet's median
 * for that task size, then the median of those. 1 is typical, 0.5 twice as fast, 4 four times as
 * slow. It compares machines that build different sizes: a slow machine that only built L tasks
 * still reads as slow next to one that only built S ones. Machines with no builds have no pace.
 */
export function buildPace(all: readonly Task[]): Map<string, number> {
  const builds = all.filter((t) => t.status === 'done').flatMap((t) => {
    const b = buildMinutes(t);
    return b && b.minutes > 0 ? [{ ...b, size: t.size }] : [];
  });
  const typical = new Map<TaskSize, number>();
  for (const size of new Set(builds.map((b) => b.size))) typical.set(size, median(builds.filter((b) => b.size === size).map((b) => b.minutes)));
  const ratios = new Map<string, number[]>();
  for (const b of builds) ratios.set(b.machine, [...(ratios.get(b.machine) ?? []), b.minutes / typical.get(b.size)!]);
  return new Map([...ratios].map(([machine, r]) => [machine, median(r)]));
}
