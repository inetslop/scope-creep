import { spawn, spawnSync } from 'node:child_process';

export interface ExecOptions {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  /** Written to stdin, then stdin is closed. */
  input?: string;
  timeoutMs?: number;
  /** Needed on Windows for .cmd shims like npm. Only use with trusted, fixed arguments. */
  shell?: boolean;
  onStdoutLine?: (line: string) => void;
  /** Keep at most this many characters of each stream (the tail). */
  maxChars?: number;
}

export interface ExecResult {
  code: number;
  stdout: string;
  stderr: string;
  timedOut: boolean;
  durationMs: number;
}

/** Kills a process and all of its children. */
export function killTree(pid: number): void {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore', windowsHide: true });
  } else {
    try {
      process.kill(-pid, 'SIGKILL');
    } catch {
      try {
        process.kill(pid, 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
}

export function run(cmd: string, args: readonly string[], opts: ExecOptions = {}): Promise<ExecResult> {
  const started = Date.now();
  const maxChars = opts.maxChars ?? 2_000_000;
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let pending = '';
    let timedOut = false;
    const spawnOpts = { cwd: opts.cwd, env: opts.env ?? process.env, windowsHide: true, detached: process.platform !== 'win32' };
    // With a shell, Node wants one command string (it would only concatenate args anyway).
    const child = opts.shell ? spawn([cmd, ...args].join(' '), { ...spawnOpts, shell: true }) : spawn(cmd, args, spawnOpts);
    const timer = opts.timeoutMs
      ? setTimeout(() => {
          timedOut = true;
          if (child.pid) killTree(child.pid);
        }, opts.timeoutMs)
      : undefined;

    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      stdout = (stdout + chunk).slice(-maxChars);
      if (opts.onStdoutLine) {
        pending += chunk;
        const lines = pending.split(/\r?\n/);
        pending = lines.pop() ?? '';
        for (const line of lines) opts.onStdoutLine(line);
      }
    });
    child.stderr.on('data', (chunk: string) => {
      stderr = (stderr + chunk).slice(-maxChars);
    });
    child.on('error', (err) => {
      stderr += `\n[spawn error] ${err.message}`;
    });
    child.on('close', (code) => {
      if (timer) clearTimeout(timer);
      if (opts.onStdoutLine && pending) opts.onStdoutLine(pending);
      resolve({ code: code ?? (timedOut ? 124 : 1), stdout, stderr, timedOut, durationMs: Date.now() - started });
    });
    if (opts.input !== undefined) child.stdin.end(opts.input);
    else child.stdin.end();
  });
}

/** Runs a command and throws if it fails. Returns trimmed stdout. */
export async function runOk(cmd: string, args: readonly string[], opts: ExecOptions = {}): Promise<string> {
  const r = await run(cmd, args, opts);
  if (r.code !== 0) {
    throw new Error(`${cmd} ${args.join(' ')} failed (exit ${r.code}${r.timedOut ? ', timed out' : ''}):\n${tail(r.stderr || r.stdout, 30)}`);
  }
  return r.stdout.trim();
}

/** The last `lines` lines of `text`, capped at `chars` characters. */
export function tail(text: string, lines = 80, chars = 6000): string {
  const t = text.split(/\r?\n/).slice(-lines).join('\n');
  return t.length > chars ? '…' + t.slice(-chars) : t;
}

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));
