/** Console output and questions for the interactive setup scripts (same look as setup.ps1). */
import readline from 'node:readline/promises';

const color = (code: number, text: string): string => (process.stdout.isTTY ? `\x1b[${code}m${text}\x1b[0m` : text);
export const step = (text: string): void => console.log(`\n${color(36, `== ${text}`)}`);
export const ok = (text: string): void => console.log(color(32, `   ok  ${text}`));
export const note = (text: string): void => console.log(color(90, `   ..  ${text}`));
export const problem = (text: string): void => console.log(color(33, `   !!  ${text}`));

let midLine = false;
/** Progress on one line that rewrites itself (plain lines when not a terminal). */
export function progress(text: string, sameLine = false): void {
  if (sameLine && process.stdout.isTTY) {
    process.stdout.write(`\r   ..  ${text}\x1b[K`);
    midLine = true;
    return;
  }
  if (midLine) process.stdout.write('\n');
  midLine = false;
  console.log(`   ..  ${text}`);
}

let rl: readline.Interface | undefined;
const io = (): readline.Interface => (rl ??= readline.createInterface({ input: process.stdin, output: process.stdout }));

export function closePrompts(): void {
  rl?.close();
  rl = undefined;
}

export async function ask(question: string, fallback = ''): Promise<string> {
  const answer = (await io().question(`   ${question}${fallback ? ` [${fallback}]` : ''}: `)).trim().replace(/^"|"$/g, '');
  return answer || fallback;
}

/** Asks until `validate` returns null. */
export async function askValid(question: string, fallback: string, validate: (v: string) => string | null): Promise<string> {
  for (;;) {
    const answer = await ask(question, fallback);
    const error = validate(answer);
    if (!error) return answer;
    problem(error);
  }
}

export async function yesNo(question: string, fallback: boolean): Promise<boolean> {
  const answer = (await io().question(`   ${question} (${fallback ? 'Y/n' : 'y/N'}) `)).trim().toLowerCase();
  return answer ? answer.startsWith('y') : fallback;
}

export async function choose<T>(title: string, items: readonly T[], label: (item: T) => string, fallback = 0): Promise<T> {
  console.log(`   ${title}`);
  items.forEach((item, i) => console.log(`   ${i === fallback ? '*' : ' '} ${String(i + 1).padStart(2)}) ${label(item)}`));
  for (;;) {
    const answer = (await io().question(`   Choose 1-${items.length} [${fallback + 1}]: `)).trim();
    if (!answer) return items[fallback]!;
    const n = Number(answer);
    if (Number.isInteger(n) && n >= 1 && n <= items.length) return items[n - 1]!;
  }
}

/** `--name value` from argv. */
export function flag(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
