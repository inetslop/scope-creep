/** The docker compose .env file in the agent's folder: KEY=value lines, values quoted when needed. */
import fs from 'node:fs';

export function parseEnv(text: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (!m) continue;
    const raw = m[2]!;
    out[m[1]!] = /^(["']).*\1$/.test(raw) ? raw.slice(1, -1).replace(/\\"/g, '"') : raw;
  }
  return out;
}

export function readEnv(file: string): Record<string, string> {
  return fs.existsSync(file) ? parseEnv(fs.readFileSync(file, 'utf8')) : {};
}

/** Updates `values` in place, keeps every other line (and comment) as it was. */
export function updateEnvText(text: string, values: Record<string, string>): string {
  const quote = (v: string): string => (/^[\w./:@-]*$/.test(v) ? v : `"${v.replace(/"/g, '\\"')}"`);
  const pending = new Map(Object.entries(values));
  const lines = text.split(/\r?\n/).map((line) => {
    const key = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=/.exec(line)?.[1];
    if (!key || !pending.has(key)) return line;
    const value = pending.get(key)!;
    pending.delete(key);
    return `${key}=${quote(value)}`;
  });
  while (lines.length && lines.at(-1) === '') lines.pop();
  for (const [key, value] of pending) lines.push(`${key}=${quote(value)}`);
  return `${lines.join('\n')}\n`;
}

export function writeEnv(file: string, values: Record<string, string>): void {
  fs.writeFileSync(file, updateEnvText(fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '', values));
}
