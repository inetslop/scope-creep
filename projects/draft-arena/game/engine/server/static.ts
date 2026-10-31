/**
 * The built game page, served by the game server itself (STATIC_DIR), so a box serves the page
 * and the match from one build. Only the path logic lives here, pure, so it can be tested.
 */
import path from 'node:path';

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

export interface StaticFile {
  /** Absolute path inside the root. */
  file: string;
  type: string;
  cache: string;
}

/**
 * The file a request path names inside `root` (absolute), or undefined: outside the root, a
 * malformed path, or a type the game doesn't ship. `/` is index.html. Vite's hashed /assets/
 * never change; everything else is checked again on every load.
 */
export function resolveStatic(root: string, urlPath: string): StaticFile | undefined {
  let p: string;
  try {
    p = decodeURIComponent(urlPath.split(/[?#]/)[0] ?? '/');
  } catch {
    return undefined;
  }
  if (p.includes('\0') || !p.startsWith('/')) return undefined;
  if (p.endsWith('/')) p += 'index.html';
  const base = path.resolve(root);
  const file = path.resolve(base, `.${p}`);
  if (!file.startsWith(base + path.sep)) return undefined;
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return undefined;
  const rel = path.relative(base, file).split(path.sep).join('/');
  const cache = rel.startsWith('assets/') ? 'public, max-age=31536000, immutable' : 'no-cache';
  return { file, type, cache };
}
