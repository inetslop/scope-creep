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
    // Items the player never sees by name (projectiles, effects, pickups): the id and what the file says it is.
    const id = names.length === 0 && files.length > 0 ? /\bid:\s*['"`]([\w-]+)['"`]/.exec(source)?.[1] : undefined;
    if (id) {
      const doc = fileDoc(source, 120);
      items.push(doc ? `${id} (${doc.replace(/\.$/, '')})` : id);
    }
  }
  return items;
}

/**
 * A source file's doc comment (the one above its exported class or, without one, its first), as
 * whole sentences up to `max` characters: what the file is or shows. Empty when it has none.
 */
export function fileDoc(source: string, max = 260): string {
  const blocks = [...source.matchAll(/\/\*\*([\s\S]*?)\*\//g)];
  const aboveClass = blocks.find((b) => /^\s*export\s+(?:default\s+)?class\b/.test(source.slice((b.index ?? 0) + b[0].length)));
  const block = (aboveClass ?? blocks[0])?.[1] ?? '';
  const text = block.split('\n').map((l) => l.replace(/^\s*\*\s?/, '').trim()).join(' ').replace(/\s+/g, ' ').trim();
  // A sentence ends at . ! or ? followed by a space: a dot inside a code name (waves.nextPlan) doesn't end one.
  const sentences = text ? text.split(/(?<=[.!?])\s+/) : [];
  let out = '';
  for (const sentence of sentences) {
    if (out && out.length + 1 + sentence.length > max) break;
    out = out ? `${out} ${sentence}` : sentence;
  }
  return out.length > max ? `${out.slice(0, max - 1).replace(/\s+\S*$/, '')}…` : out;
}

/** One line per source file in `dir`: its name and what its doc comment says it is or shows. */
function describedFiles(dir: string, skip: readonly string[] = [], max = 260): string[] {
  return tsFiles(dir)
    .filter((f) => !skip.includes(f))
    .map((f) => {
      const doc = fileDoc(fs.readFileSync(path.join(dir, f), 'utf8'), max);
      return `  - ${f.replace(/\.ts$/, '')}${doc ? `: ${doc}` : ''}`;
    });
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
      // Things the player picks or builds show their one-line description (Draft Arena's monsters,
      // trees and events too); Chokepoint's enemies show their behavior.
      const items = contentList(dir, ['upgrades', 'weapons', 'towers', 'boons', 'augments', 'monsters', 'talents', 'directors'].includes(folder));
      if (items.length) lines.push(`- **${folder[0]!.toUpperCase()}${folder.slice(1)}** (${items.length}): ${items.join(', ')}`);
    }
  }
  const strip = (f: string, suffix: string): string => f.replace(/\.ts$/, '').replace(new RegExp(`${suffix}$`), '');
  const scenes = tsFiles(path.join(src, 'scenes')).filter((f) => f.endsWith('Scene.ts'));
  if (scenes.length) lines.push(`- **Scenes**: ${scenes.map((f) => strip(f, 'Scene')).join(', ')}`);
  // What the player already sees, element by element, so a new readout never repeats one.
  // Chokepoint keeps its HUD parts in ui/hud/, Draft Arena in hud/.
  const hudDir = [path.join(src, 'ui', 'hud'), path.join(src, 'hud')].find((d) => fs.existsSync(d)) ?? path.join(src, 'ui', 'hud');
  const hud = describedFiles(hudDir, ['hud.ts']);
  if (hud.length) lines.push(`- **On screen** (the HUD, each element and what it shows; a new one must show something none of these does):`, ...hud);
  const systems = describedFiles(path.join(src, 'systems'), [], 200);
  if (systems.length) lines.push(`- **Systems** (each and what it does; the board readouts live here too):`, ...systems);
  const known = new Set(['content', 'scenes', 'systems', 'hud']);
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
