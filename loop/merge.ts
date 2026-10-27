/**
 * Resolves the easy kind of rebase conflict without an agent: both sides only ADDED lines at the
 * same spot (two tasks appending a field, an import, an update() call or a test at the end of the
 * same block). Git can't order two insertions, but keeping both is almost always right, and the
 * gate that runs after every rebase catches the rare case where it isn't.
 *
 * Needs conflict markers with the base section (merge.conflictStyle diff3 or zdiff3).
 */

export interface AutoResolveResult {
  /** The file with every resolvable hunk resolved; other hunks are left exactly as they were. */
  text: string;
  resolved: number;
  /** Hunks that need an agent (both sides changed existing lines). */
  remaining: number;
}

const OPEN = /^<{7}(?:\s|$)/;
const BASE = /^\|{7}(?:\s|$)/;
const MID = /^={7}$/;
const CLOSE = /^>{7}(?:\s|$)/;

/** During a rebase "ours" is main (already landed) and "theirs" is the commit being replayed. */
export function autoResolveAdditions(text: string): AutoResolveResult {
  const eol = text.includes('\r\n') ? '\r\n' : '\n';
  const lines = text.split(/\r?\n/);
  const out: string[] = [];
  let resolved = 0;
  let remaining = 0;
  for (let i = 0; i < lines.length; i++) {
    if (!OPEN.test(lines[i]!)) {
      out.push(lines[i]!);
      continue;
    }
    const start = i;
    const ours: string[] = [];
    const base: string[] = [];
    const theirs: string[] = [];
    let section: string[] = ours;
    let hasBase = false;
    let closed = false;
    for (i++; i < lines.length; i++) {
      const line = lines[i]!;
      if (BASE.test(line) && section === ours) {
        section = base;
        hasBase = true;
      } else if (MID.test(line) && section !== theirs) section = theirs;
      else if (CLOSE.test(line) && section === theirs) {
        closed = true;
        break;
      } else section.push(line);
    }
    if (!closed) {
      // Malformed hunk: leave the rest of the file untouched for the agent.
      out.push(...lines.slice(start));
      remaining++;
      break;
    }
    if (!hasBase || base.some((l) => l.trim() !== '')) {
      out.push(...lines.slice(start, i + 1));
      remaining++;
      continue;
    }
    out.push(...mergeAdditions(ours, theirs));
    resolved++;
  }
  return { text: out.join(eol), resolved, remaining };
}

/** Main's lines first, then ours; a block both sides added identically, or a repeated import, appears once. */
function mergeAdditions(ours: string[], theirs: string[]): string[] {
  const same = (a: string[], b: string[]): boolean => a.length === b.length && a.every((l, k) => l.trimEnd() === b[k]!.trimEnd());
  if (same(ours, theirs)) return ours;
  const ourImports = new Set(ours.filter((l) => /^\s*import\s/.test(l)).map((l) => l.trim()));
  return [...ours, ...theirs.filter((l) => !(/^\s*import\s/.test(l) && ourImports.has(l.trim())))];
}

/** Files the add/add resolver may touch: code and docs, not JSON (a concatenation there breaks commas). */
export function autoResolvable(file: string): boolean {
  return /\.(ts|tsx|js|mjs|css|md)$/.test(file);
}
