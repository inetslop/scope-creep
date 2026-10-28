import fs from 'node:fs';
import path from 'node:path';
import type { Task } from './tasks.ts';

/**
 * What the PO knows about the game without reading code: a short inventory generated
 * from the content files and the source tree, plus the changelog of finished tasks.
 */

const quoted = (key: string): RegExp => new RegExp(`\\b${key}:\\s*(['"\`])((?:(?!\\1).)+)\\1`, 'g');

/** All `name: '...'` values in a content file, with their `description` when one follows. */
export function namesIn(source: string): { name: string; description?: string }[] {
  const out: { name: string; description?: string }[] = [];
  for (const m of source.matchAll(quoted('name'))) {
    const rest = source.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 300);
    const desc = /^\s*,\s*description:\s*(['"`])((?:(?!\1).)+)\1/.exec(rest)?.[2];
    out.push({ name: m[2]!, description: desc });
  }
  return out;
}

const tsFiles = (dir: string): string[] =>
  fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.ts') && f !== 'index.ts' && !f.endsWith('.d.ts')).sort() : [];

function oneItemNote(source: string): string | undefined {
  const behavior = /\bbehavior:\s*['"`]([\w-]+)['"`]/.exec(source)?.[1];
  const split = /\bsplitsInto:\s*\{\s*id:\s*['"`]([\w-]+)['"`]/.exec(source)?.[1];
  const notes = [behavior, split && `splits into ${split}`, /\bspawnWeight:\s*0\b/.test(source) && 'only spawned by another'];
  return notes.filter(Boolean).join(', ') || undefined;
}

function contentList(dir: string, withDescriptions: boolean): string[] {
  const items: string[] = [];
  const files = tsFiles(dir);
  // A folder may keep everything in index.ts (like upgrades) or one file per item (like enemies).
  const sources = files.length > 0 ? files.map((f) => path.join(dir, f)) : [path.join(dir, 'index.ts')];
  for (const file of sources) {
    if (!fs.existsSync(file)) continue;
    const source = fs.readFileSync(file, 'utf8');
    // One-item files (enemies, bosses) show their behavior, so the PO sees which behaviors exist
    // and which enemies only appear through another (they don't count toward the enemy cap).
    const names = namesIn(source);
    const behavior = names.length === 1 ? oneItemNote(source) : undefined;
    for (const { name, description } of names) {
      const note = withDescriptions ? description : behavior;
      items.push(note ? `${name} (${note})` : name);
    }
  }
  return items;
}

/** Markdown inventory of the game in `gameDir`, for the PO prompt. */
export function buildInventory(gameDir: string): string {
  const src = path.join(gameDir, 'src');
  const contentDir = path.join(src, 'content');
  const lines: string[] = [];
  if (fs.existsSync(contentDir)) {
    for (const folder of fs.readdirSync(contentDir).sort()) {
      const dir = path.join(contentDir, folder);
      if (!fs.statSync(dir).isDirectory()) continue;
      // Things the player picks or builds show their one-line description; enemies show their behavior.
      const items = contentList(dir, ['upgrades', 'weapons', 'towers', 'boons', 'augments'].includes(folder));
      if (items.length) lines.push(`- **${folder[0]!.toUpperCase()}${folder.slice(1)}** (${items.length}): ${items.join(', ')}`);
    }
  }
  const strip = (f: string, suffix: string): string => f.replace(/\.ts$/, '').replace(new RegExp(`${suffix}$`), '');
  const scenes = tsFiles(path.join(src, 'scenes')).filter((f) => f.endsWith('Scene.ts'));
  if (scenes.length) lines.push(`- **Scenes**: ${scenes.map((f) => strip(f, 'Scene')).join(', ')}`);
  const systems = tsFiles(path.join(src, 'systems'));
  if (systems.length) lines.push(`- **Systems**: ${systems.map((f) => strip(f, 'System')).join(', ')}`);
  const known = new Set(['content', 'scenes', 'systems']);
  const other = fs.existsSync(src)
    ? fs
        .readdirSync(src)
        .filter((d) => !known.has(d) && fs.statSync(path.join(src, d)).isDirectory())
        .sort()
        .map((d) => `${d}/ (${tsFiles(path.join(src, d)).map((f) => f.replace(/\.ts$/, '')).join(', ') || 'empty'})`)
    : [];
  if (other.length) lines.push(`- **Other code**: ${other.join('; ')}`);
  return lines.join('\n') || '(the game has no source yet)';
}

/** One changelog line for a finished task: id, title, machine, date and the dev's summary. */
export function changelogLine(t: Task): string {
  const result = /\n## Result \(attempt \d+, ([^)]+)\)\n+([\s\S]*?)(?:\n\s*\n|\n- |$)/.exec(`\n${t.body}`);
  const machine = result?.[1] ?? t.assignee;
  const summary = (result?.[2] ?? '').replace(/\s+/g, ' ').trim();
  const firstSentence = /^(.{20,220}?[.!?])(\s|$)/.exec(summary)?.[1] ?? summary.slice(0, 220);
  const date = (t.finishedAt ?? '').slice(0, 10);
  return `- ${t.id} ${t.title} (${machine}${date ? `, ${date}` : ''})${firstSentence ? `: ${firstSentence}` : ''}`;
}

export const CHANGELOG_HEADER = `# Changelog

What has been built, newest last. The runner appends a line for every finished task;
the PO reads this instead of the code.
`;
