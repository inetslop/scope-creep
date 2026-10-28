import fs from 'node:fs';
import path from 'node:path';
import { run, runOk, sleep, tail, type ExecResult } from './exec.ts';
import { warn } from './log.ts';

/**
 * git errors that mean the network blinked (a DNS lookup or connection failed), not that the
 * command was wrong. A rejected push or a merge conflict never matches.
 */
export function isTransientGitError(stderr: string): boolean {
  return /Could not resolve host|Couldn't resolve host|Failed to connect|Connection (timed out|reset|refused)|Operation timed out|Recv failure|early EOF|remote end hung up unexpectedly|gnutls_handshake|SSL_(read|connect|ERROR)|HTTP\/2 stream \d+ was not closed|Temporary failure in name resolution/i.test(
    stderr,
  );
}

/** Waits between retries of a git command that hit a network error. */
const NETWORK_RETRY_MS = [5_000, 15_000, 30_000, 60_000];

export interface ChangedPath {
  /** Repo-relative POSIX path. */
  path: string;
  /** False for untracked (new) files. */
  tracked: boolean;
}

/** Thin wrapper around the git CLI for one working tree. All paths are repo-relative POSIX. */
export class Git {
  readonly cwd: string;
  /** Commit identity, e.g. "agent-desktop". */
  readonly author: string;

  constructor(cwd: string, author: string) {
    this.cwd = cwd;
    this.author = author;
  }

  raw(args: readonly string[], env?: NodeJS.ProcessEnv): Promise<ExecResult> {
    return run('git', args, { cwd: this.cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0', ...env } });
  }

  ok(args: readonly string[]): Promise<string> {
    return runOk('git', args, { cwd: this.cwd, env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } });
  }

  head(): Promise<string> {
    return this.ok(['rev-parse', 'HEAD']);
  }

  /** Every modified, deleted or untracked path (ignored files excluded). */
  async changedPaths(): Promise<ChangedPath[]> {
    // Not ok(): its trim() would eat the leading space of the first " M path" status code.
    const res = await this.raw(['status', '--porcelain=v1', '-z', '--untracked-files=all']);
    if (res.code !== 0) throw new Error(`git status failed: ${res.stderr.trim()}`);
    const entries = res.stdout.split('\0').filter(Boolean);
    const result: ChangedPath[] = [];
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i]!;
      const xy = entry.slice(0, 2);
      result.push({ path: entry.slice(3), tracked: xy !== '??' });
      if (xy[0] === 'R' || xy[0] === 'C') {
        // Renames/copies are followed by the original path as a separate entry.
        result.push({ path: entries[++i]!, tracked: true });
      }
    }
    return result;
  }

  async isClean(): Promise<boolean> {
    return (await this.changedPaths()).length === 0;
  }

  /** Throws away every change (tracked and untracked) under the given repo-relative paths. */
  async discard(paths: readonly string[]): Promise<void> {
    if (paths.length === 0) return;
    await this.raw(['reset', '-q', 'HEAD', '--', ...paths]);
    await this.raw(['checkout', 'HEAD', '--', ...paths]);
    await this.raw(['clean', '-fdq', '--', ...paths]);
  }

  /** Reverts a single path to HEAD, or deletes it if it didn't exist at HEAD. */
  async revertPath(p: ChangedPath): Promise<void> {
    if (await this.existsAtHead(p.path)) {
      await this.raw(['checkout', 'HEAD', '--', p.path]);
      return;
    }
    await this.raw(['rm', '-q', '--cached', '--force', '--ignore-unmatch', '--', p.path]);
    fs.rmSync(path.join(this.cwd, p.path), { force: true, recursive: true });
  }

  async existsAtHead(p: string): Promise<boolean> {
    return (await this.raw(['cat-file', '-e', `HEAD:${p}`])).code === 0;
  }

  /** Contents of a file at HEAD, or undefined if it doesn't exist there. */
  async showAtHead(p: string): Promise<string | undefined> {
    const r = await this.raw(['show', `HEAD:${p}`]);
    return r.code === 0 ? r.stdout : undefined;
  }

  /** Stages exactly these paths (additions, edits and deletions) and commits. Returns false if nothing to commit. */
  async commitPaths(paths: readonly string[], message: string): Promise<boolean> {
    if (paths.length === 0) return false;
    await this.ok(['add', '-A', '--', ...paths]);
    const staged = await this.raw(['diff', '--cached', '--quiet']);
    if (staged.code === 0) return false;
    const who = this.author;
    await this.ok(['-c', `user.name=${who}`, '-c', `user.email=${who}@scope-creep.local`, 'commit', '-q', '--no-verify', '-m', message]);
    return true;
  }

  async amendPaths(paths: readonly string[]): Promise<void> {
    await this.ok(['add', '-A', '--', ...paths]);
    const who = this.author;
    await this.ok(['-c', `user.name=${who}`, '-c', `user.email=${who}@scope-creep.local`, 'commit', '-q', '--no-verify', '--amend', '--no-edit']);
  }

  /**
   * A git command that talks to GitHub, retried while it fails with a network error, so a flaky
   * DNS server or a dropped connection doesn't crash the runner or throw away finished work.
   */
  private async network(args: readonly string[]): Promise<ExecResult> {
    let r = await this.raw(args);
    for (const wait of NETWORK_RETRY_MS) {
      if (r.code === 0 || !isTransientGitError(r.stderr)) break;
      warn(`git ${args[0]}: network error (${r.stderr.trim().split('\n').pop()}); retrying in ${wait / 1000}s`);
      await sleep(wait);
      r = await this.raw(args);
    }
    return r;
  }

  async fetch(): Promise<void> {
    const r = await this.network(['fetch', '--quiet', '--prune', 'origin']);
    if (r.code !== 0) throw new Error(`git fetch --quiet --prune origin failed (exit ${r.code}):\n${tail(r.stderr || r.stdout, 30)}`);
  }

  /** Commits on HEAD that are not on origin/main. */
  async aheadCount(): Promise<number> {
    return Number(await this.ok(['rev-list', '--count', 'origin/main..HEAD']));
  }

  async behindCount(): Promise<number> {
    return Number(await this.ok(['rev-list', '--count', 'HEAD..origin/main']));
  }

  async fastForward(): Promise<boolean> {
    return (await this.raw(['merge', '--ff-only', '--quiet', 'origin/main'])).code === 0;
  }

  /** Rebases onto origin/main. `prefer: 'upstream'` auto-resolves conflicts in favor of origin/main. */
  private conflictStyleArg?: string;

  /**
   * Conflict markers that include the common ancestor: zdiff3 (git 2.35+) or diff3. With the base
   * visible, add/add conflicts resolve without an agent (merge.ts) and the agent sees what changed.
   */
  private async conflictStyle(): Promise<string> {
    if (!this.conflictStyleArg) {
      const [major = 0, minor = 0] = ((await this.raw(['--version'])).stdout.match(/(\d+)\.(\d+)/) ?? []).slice(1).map(Number);
      this.conflictStyleArg = `merge.conflictStyle=${major > 2 || (major === 2 && minor >= 35) ? 'zdiff3' : 'diff3'}`;
    }
    return this.conflictStyleArg;
  }

  async rebase(prefer?: 'upstream'): Promise<'ok' | 'conflict'> {
    const args = ['-c', `user.name=${this.author}`, '-c', `user.email=${this.author}@scope-creep.local`, '-c', await this.conflictStyle(), 'rebase', '--quiet'];
    // During a rebase "ours" is the upstream we are replaying onto.
    if (prefer === 'upstream') args.push('-X', 'ours');
    args.push('origin/main');
    const r = await this.raw(args, { GIT_EDITOR: 'true' });
    return r.code === 0 ? 'ok' : 'conflict';
  }

  /** Continues a rebase. `output` is git's message when it stops again (a new conflict, or why it can't go on). */
  async continueRebase(): Promise<{ status: 'ok' | 'conflict'; output: string }> {
    const r = await this.raw(['-c', `user.name=${this.author}`, '-c', `user.email=${this.author}@scope-creep.local`, '-c', await this.conflictStyle(), 'rebase', '--continue'], { GIT_EDITOR: 'true' });
    return { status: r.code === 0 ? 'ok' : 'conflict', output: `${r.stderr}\n${r.stdout}`.trim() };
  }

  async abortRebase(): Promise<void> {
    if (this.isRebasing()) await this.raw(['rebase', '--abort']);
  }

  isRebasing(): boolean {
    return fs.existsSync(path.join(this.cwd, '.git', 'rebase-merge')) || fs.existsSync(path.join(this.cwd, '.git', 'rebase-apply'));
  }

  async conflictedFiles(): Promise<string[]> {
    const out = await this.ok(['diff', '--name-only', '--diff-filter=U']);
    return out.split(/\r?\n/).filter(Boolean);
  }

  async push(): Promise<ExecResult> {
    return this.network(['push', '--quiet', 'origin', 'HEAD:main']);
  }

  async resetHard(ref: string): Promise<void> {
    await this.ok(['reset', '--hard', '--quiet', ref]);
  }

  async diffNames(from: string, to: string): Promise<string[]> {
    const out = await this.ok(['diff', '--name-only', from, to]);
    return out.split(/\r?\n/).filter(Boolean);
  }

  /** Unified diff of the working tree vs `base`, limited to `paths`. */
  async diff(base: string, paths: readonly string[], maxChars = 60_000): Promise<string> {
    await this.raw(['add', '-A', '--intent-to-add', '--', ...paths]);
    const out = await this.ok(['diff', base, '--', ...paths]);
    return out.length > maxChars ? out.slice(0, maxChars) + '\n… (diff truncated)' : out;
  }

  async diffStat(base: string, paths: readonly string[]): Promise<string> {
    await this.raw(['add', '-A', '--intent-to-add', '--', ...paths]);
    return this.ok(['diff', '--stat', base, '--', ...paths]);
  }

  async logOneline(count: number, paths: readonly string[] = []): Promise<string> {
    return this.ok(['log', `-${count}`, '--format=%h %ad %an: %s', '--date=short', '--', ...paths]);
  }
}
