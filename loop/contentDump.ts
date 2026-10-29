/**
 * Prints one of the game's content registries as JSON: `node loop/contentDump.ts <content dir> <folder>`
 * loads <content dir>/<folder>/index.ts and prints its first exported array (AUGMENTS, ENEMIES, ...).
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
const mod = (await import(pathToFileURL(path.join(contentDir, folder, 'index.ts')).href)) as Record<string, unknown>;
const list = Object.values(mod).find(Array.isArray);
if (!list) throw new Error(`${folder}/index.ts exports no array`);
process.stdout.write(JSON.stringify(list));
