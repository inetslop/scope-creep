import fs from 'node:fs';
import path from 'node:path';
import type { LocalConfig } from './config.ts';
import { run } from './exec.ts';
import { detectContextSize, MIN_CONTEXT } from './llama.ts';
import { info, warn } from './log.ts';
import { AGENT_DIR, CLAUDE_HOME, RUNS_DIR } from './paths.ts';
import { claudeSettings, type Profile } from './sandbox.ts';
import { shimFor } from './shim.ts';

export interface AgentRunOptions {
  /** Used for the transcript file name and logs, e.g. "T0042-dev". */
  label: string;
  /** Full instructions; piped to Claude Code on stdin. */
  prompt: string;
  cwd: string;
  profile: Profile;
  maxTurns: number;
  timeoutMin: number;
  /** Continue an earlier session (keeps the agent's context). */
  resumeSessionId?: string;
}

export interface AgentRunResult {
  sessionId?: string;
  /** The agent's final message. */
  result: string;
  /** True when Claude Code reported success (not max-turns, not an error). */
  ok: boolean;
  subtype: string;
  numTurns: number;
  timedOut: boolean;
  durationMs: number;
  transcript: string;
  exitCode: number;
}

const POINTER = 'Your complete instructions were piped in above. Follow them exactly.';

/**
 * Environment that points Claude Code at the local model. `ctx` is the context window the
 * server is really running with (detectContextSize), so compaction happens before overflow.
 */
export function agentEnv(local: LocalConfig, ctx: number, baseUrl: string = local.llama.baseUrl): Record<string, string> {
  const m = local.llama.model;
  return {
    ANTHROPIC_BASE_URL: baseUrl,
    ANTHROPIC_AUTH_TOKEN: local.llama.authToken || 'local',
    ANTHROPIC_MODEL: m,
    ANTHROPIC_DEFAULT_OPUS_MODEL: m,
    ANTHROPIC_DEFAULT_SONNET_MODEL: m,
    ANTHROPIC_DEFAULT_HAIKU_MODEL: m,
    ANTHROPIC_SMALL_FAST_MODEL: m,
    // Unknown models are assumed to have 200k context; tell Claude Code the truth so it compacts in time.
    CLAUDE_CODE_MAX_CONTEXT_TOKENS: String(ctx),
    CLAUDE_AUTOCOMPACT_PCT_OVERRIDE: '75',
    CLAUDE_CODE_MAX_OUTPUT_TOKENS: String(Math.min(16384, Math.floor(ctx / 4))),
    API_TIMEOUT_MS: '1800000',
    // The attribution header changes every request and destroys llama.cpp's prompt cache.
    CLAUDE_CODE_ATTRIBUTION_HEADER: '0',
    CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
    CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS: '1',
    // Agents can't write outside their sandbox, so the memory feature only wastes context.
    CLAUDE_CODE_DISABLE_AUTO_MEMORY: '1',
    DISABLE_AUTOUPDATER: '1',
  };
}

function processEnv(agent: Record<string, string>): NodeJS.ProcessEnv {
  // Start clean: never inherit credentials, provider switches or a parent Claude Code session's
  // context (e.g. when the runner itself is started from inside Claude Code).
  const env: NodeJS.ProcessEnv = {};
  for (const [key, value] of Object.entries(process.env)) {
    if (!/^(ANTHROPIC_|CLAUDE)/i.test(key)) env[key] = value;
  }
  return { ...env, ...agent, CLAUDE_CONFIG_DIR: CLAUDE_HOME };
}

/** The only built-in tools agents get. New Claude Code tools stay off unless added here. */
const TOOLS = 'Bash,Read,Edit,Write,Glob,Grep';

function quoteForShell(arg: string): string {
  return /[\s"&|<>^]/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg;
}

/** One-line description of a tool call for the live log, with paths relative to the agent's folder. */
function describeTool(name: string, input: Record<string, unknown>, cwd: string): string {
  const pick = String(input.file_path ?? input.command ?? input.pattern ?? input.path ?? '');
  const prefix = cwd.endsWith(path.sep) ? cwd : cwd + path.sep;
  const shown = pick.split(prefix).join('').split(prefix.replace(/\\/g, '/')).join('');
  return `${name} ${shown.replace(/\s+/g, ' ').slice(0, 110)}`;
}

export async function runAgent(local: LocalConfig, opts: AgentRunOptions): Promise<AgentRunResult> {
  fs.mkdirSync(RUNS_DIR, { recursive: true });
  fs.mkdirSync(CLAUDE_HOME, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const transcript = path.join(RUNS_DIR, `${stamp}-${opts.label}.jsonl`);
  const ctx = await detectContextSize(local);
  if (ctx < MIN_CONTEXT) warn(`model context is only ${ctx} tokens; Claude Code needs at least ${MIN_CONTEXT}. Expect failures.`);
  const env = agentEnv(local, ctx, await shimFor(local.llama.baseUrl));
  const settingsFile = path.join(AGENT_DIR, 'claude', `${opts.profile}.settings.json`);
  fs.mkdirSync(path.dirname(settingsFile), { recursive: true });
  fs.writeFileSync(settingsFile, JSON.stringify(claudeSettings(opts.profile, env), null, 2));

  const args = [
    '-p',
    POINTER,
    '--output-format',
    'stream-json',
    '--verbose',
    '--model',
    local.llama.model,
    '--max-turns',
    String(opts.maxTurns),
    '--tools',
    TOOLS,
    '--settings',
    settingsFile,
    '--setting-sources',
    'project,local',
    '--strict-mcp-config',
    '--permission-prompts',
    'none',
    '--permission-mode',
    opts.profile === 'dev' ? 'acceptEdits' : 'default',
    // Not --exclude-dynamic-system-prompt-sections: it moves the environment section into a
    // system message in the middle of the conversation, which Qwen's chat template rejects.
  ];
  if (opts.resumeSessionId) args.push('--resume', opts.resumeSessionId);

  const useShell = /\.(cmd|bat)$/i.test(local.claudePath);
  let sessionId: string | undefined;
  let final: Record<string, unknown> | undefined;
  info(`agent ${opts.label}: ${opts.profile} session in ${path.basename(opts.cwd) || opts.cwd} (max ${opts.maxTurns} turns, ${opts.timeoutMin} min, context ${ctx})`);

  const res = await run(useShell ? quoteForShell(local.claudePath) : local.claudePath, useShell ? args.map(quoteForShell) : args, {
    cwd: opts.cwd,
    env: processEnv(env),
    input: opts.prompt,
    shell: useShell,
    timeoutMs: opts.timeoutMin * 60_000,
    maxChars: 200_000,
    onStdoutLine: (line) => {
      if (!line.trim()) return;
      fs.appendFileSync(transcript, line + '\n');
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(line) as Record<string, unknown>;
      } catch {
        return;
      }
      if (msg.type === 'system' && typeof msg.session_id === 'string') sessionId = msg.session_id;
      if (msg.type === 'result') final = msg;
      if (msg.type === 'assistant') {
        const content = (msg.message as { content?: unknown[] } | undefined)?.content ?? [];
        for (const block of content as { type?: string; name?: string; input?: Record<string, unknown> }[]) {
          if (block.type === 'tool_use' && block.name) info(`    ↳ ${describeTool(block.name, block.input ?? {}, opts.cwd)}`);
        }
      }
    },
  });

  if (res.stderr.trim()) fs.appendFileSync(transcript, JSON.stringify({ type: 'stderr', text: res.stderr.slice(-20_000) }) + '\n');
  const subtype = String(final?.subtype ?? (res.timedOut ? 'timeout' : 'no_result'));
  const result: AgentRunResult = {
    sessionId: (final?.session_id as string | undefined) ?? sessionId,
    result: String(final?.result ?? ''),
    ok: res.code === 0 && final !== undefined && final.is_error !== true && subtype === 'success',
    subtype,
    numTurns: Number(final?.num_turns ?? 0),
    timedOut: res.timedOut,
    durationMs: res.durationMs,
    transcript,
    exitCode: res.code,
  };
  const mins = (res.durationMs / 60_000).toFixed(1);
  if (result.ok) info(`agent ${opts.label}: finished in ${mins} min, ${result.numTurns} turns`);
  else warn(`agent ${opts.label}: ${subtype} after ${mins} min (exit ${res.code})${res.stderr.trim() ? ` — ${res.stderr.trim().split('\n').slice(-1)[0]}` : ''}`);
  return result;
}
