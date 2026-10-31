/**
 * Prints one of the game's content registries as JSON: `node loop/contentDump.ts <content dir> <folder>`
 * loads <content dir>/<folder>/index.ts and prints its first exported array (AUGMENTS, ENEMIES, ...).
 * A file instead of a folder (`rules.ts`) prints its first exported value, as a list of one.
 * Functions print as "(code)".
 * Run in its own process (modules.ts), so every PO cycle sees the content as it is now and game code
 * never runs inside the runner. The game imports without extensions (Vite); Node needs them.
 */
import fs from 'node:fs';
import { registerHooks } from 'node:module';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && context.parentURL?.endsWith('.ts') && !/\.\w+$/.test(specifier)) {
      for (const ext of ['.ts', '/index.ts']) {
        const url = new URL(specifier + ext, context.parentURL);
        if (fs.existsSync(fileURLToPath(url))) return nextResolve(url.href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});

const [contentDir, folder] = process.argv.slice(2);
if (!contentDir || !folder) throw new Error('usage: contentDump.ts <content dir> <folder>');
const file = folder.endsWith('.ts');
const mod = (await import(pathToFileURL(file ? path.join(contentDir, folder) : path.join(contentDir, folder, 'index.ts')).href)) as Record<string, unknown>;
const value = file ? Object.values(mod)[0] : Object.values(mod).find(Array.isArray);
if (value === undefined) throw new Error(file ? `${folder} exports nothing` : `${folder}/index.ts exports no array`);
// Hooks show as "(code)", so a doc says which items have one (a weapon's fire, an onHit).
process.stdout.write(JSON.stringify(Array.isArray(value) ? value : [value], (_k, v: unknown) => (typeof v === 'function' ? '(code)' : v)));
