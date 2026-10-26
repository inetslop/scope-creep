import fs from 'node:fs';
import path from 'node:path';
import { warn } from './log.ts';
import { AGENTS_DIR } from './paths.ts';

/** Renders agents/prompts/<name>.md, replacing {{KEY}} placeholders. Re-read every time so edits apply live. */
export function renderPrompt(name: string, vars: Record<string, string | number>): string {
  const file = path.join(AGENTS_DIR, 'prompts', `${name}.md`);
  const template = fs.readFileSync(file, 'utf8');
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_m, key: string) => {
    if (key in vars) return String(vars[key]);
    warn(`prompt ${name}: no value for {{${key}}}`);
    return '';
  });
}
