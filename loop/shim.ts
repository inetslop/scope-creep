import http from 'node:http';
import https from 'node:https';
import type { AddressInfo } from 'node:net';
import { warn } from './log.ts';

/**
 * Compatibility shim between Claude Code and the local model server, running inside the
 * runner process (agents get its URL as ANTHROPIC_BASE_URL). One shim per (server, effort).
 *
 * 1. Claude Code sends a `system`-role message INSIDE `messages` (its environment section).
 *    Anthropic's API accepts that; local chat templates such as Qwen's raise
 *    "System message must be at the beginning". The shim moves such messages into the
 *    top-level `system` field.
 * 2. llama.cpp ignores Claude Code's `output_config.effort`, but passes a request's
 *    `chat_template_kwargs` to the chat template. The shim sets `reasoning_effort` there,
 *    so each role gets its configured effort per request.
 * Everything else, including SSE streams, passes through untouched.
 */

interface Block {
  type?: string;
  text?: string;
}
interface Message {
  role?: string;
  content?: string | Block[];
}
interface MessagesBody {
  system?: string | Block[];
  messages?: Message[];
  chat_template_kwargs?: Record<string, unknown>;
}

/** Moves system/developer messages from `messages` into `system`. Returns true if it changed anything. */
export function hoistSystemMessages(body: MessagesBody): boolean {
  if (!Array.isArray(body.messages)) return false;
  const hoisted: string[] = [];
  body.messages = body.messages.filter((m) => {
    if (m?.role !== 'system' && m?.role !== 'developer') return true;
    if (typeof m.content === 'string') hoisted.push(m.content);
    else for (const b of m.content ?? []) if (b.type === 'text' && b.text) hoisted.push(b.text);
    return false;
  });
  if (hoisted.length === 0) return false;
  const system: Block[] = typeof body.system === 'string' ? [{ type: 'text', text: body.system }] : Array.isArray(body.system) ? body.system : [];
  body.system = [...system, ...hoisted.map((text) => ({ type: 'text', text }))];
  return true;
}

/** Everything the shim does to a /v1/messages body. */
export function rewriteRequest(body: MessagesBody, effort?: string): void {
  hoistSystemMessages(body);
  if (effort) body.chat_template_kwargs = { ...(body.chat_template_kwargs ?? {}), reasoning_effort: effort };
}

const shims = new Map<string, Promise<string>>();

/** Starts (once per server + effort) a shim on a random localhost port and returns its base URL. */
export function shimFor(upstreamBase: string, effort?: string): Promise<string> {
  const key = `${upstreamBase}|${effort ?? ''}`;
  let url = shims.get(key);
  if (!url) {
    url = startShim(upstreamBase, effort);
    shims.set(key, url);
  }
  return url;
}

function startShim(upstreamBase: string, effort?: string): Promise<string> {
  const upstream = new URL(upstreamBase);
  const client = upstream.protocol === 'https:' ? https : http;
  const basePath = upstream.pathname.replace(/\/+$/, '');

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      let body = Buffer.concat(chunks);
      if (req.method === 'POST' && req.url?.startsWith('/v1/messages') && body.length > 0) {
        try {
          const parsed = JSON.parse(body.toString('utf8')) as MessagesBody;
          rewriteRequest(parsed, effort);
          body = Buffer.from(JSON.stringify(parsed));
        } catch {
          /* not JSON: forward as-is */
        }
      }
      const headers = { ...req.headers, host: upstream.host, 'content-length': String(body.length) };
      const proxied = client.request(
        { protocol: upstream.protocol, hostname: upstream.hostname, port: upstream.port, method: req.method, path: basePath + (req.url ?? '/'), headers },
        (upstreamRes) => {
          res.writeHead(upstreamRes.statusCode ?? 502, upstreamRes.headers);
          upstreamRes.pipe(res);
        },
      );
      proxied.on('error', (err) => {
        warn(`shim: upstream error: ${err.message}`);
        if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
        res.end(JSON.stringify({ type: 'error', error: { type: 'api_error', message: `model server unreachable: ${err.message}` } }));
      });
      proxied.end(body);
    });
  });

  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      server.unref(); // never keeps the runner alive on its own
      resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
    });
  });
}
