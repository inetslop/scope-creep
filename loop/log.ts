import fs from 'node:fs';
import path from 'node:path';
import { LOG_DIR } from './paths.ts';

type Level = 'info' | 'warn' | 'error' | 'step';

const ICON: Record<Level, string> = { info: ' ', warn: '!', error: 'x', step: '>' };

function logFile(): string {
  return path.join(LOG_DIR, `${new Date().toISOString().slice(0, 10)}.log`);
}

/** Logs to the console and to .agent/logs/<date>.log. */
export function log(level: Level, message: string): void {
  const line = `${new Date().toISOString().slice(11, 19)} ${ICON[level]} ${message}`;
  if (level === 'error') console.error(line);
  else console.log(line);
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    fs.appendFileSync(logFile(), line + '\n');
  } catch {
    // logging must never crash the runner
  }
}

export const info = (m: string): void => log('info', m);
export const warn = (m: string): void => log('warn', m);
export const error = (m: string): void => log('error', m);
export const step = (m: string): void => log('step', m);
