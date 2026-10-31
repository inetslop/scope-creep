import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { resolveStatic } from '../server/static.ts';

const root = path.resolve('/srv/arena/dist');

describe('resolveStatic', () => {
  it('serves index.html for / and checks it again on every load', () => {
    expect(resolveStatic(root, '/')).toEqual({ file: path.join(root, 'index.html'), type: 'text/html; charset=utf-8', cache: 'no-cache' });
    expect(resolveStatic(root, '/?server=x')?.file).toBe(path.join(root, 'index.html'));
  });

  it('caches hashed assets for good, with their type', () => {
    expect(resolveStatic(root, '/assets/index-abc123.js')).toEqual({ file: path.join(root, 'assets', 'index-abc123.js'), type: 'text/javascript; charset=utf-8', cache: 'public, max-age=31536000, immutable' });
    expect(resolveStatic(root, '/assets/fredoka-latin-600-normal.woff2')?.type).toBe('font/woff2');
    expect(resolveStatic(root, '/assets/../index.html')?.cache).toBe('no-cache');
  });

  it('never leaves the root', () => {
    expect(resolveStatic(root, '/../etc/passwd')).toBeUndefined();
    expect(resolveStatic(root, '/%2e%2e/%2e%2e/etc/passwd')).toBeUndefined();
    expect(resolveStatic(root, '/assets/..%2f..%2f..%2fsecret.json')).toBeUndefined();
    expect(resolveStatic(root, '/%00.html')).toBeUndefined();
    expect(resolveStatic(root, 'index.html')).toBeUndefined();
  });

  it('refuses malformed paths and types the game does not ship', () => {
    expect(resolveStatic(root, '/%E0%A4%A')).toBeUndefined();
    expect(resolveStatic(root, '/server.ts')).toBeUndefined();
    expect(resolveStatic(root, '/.env')).toBeUndefined();
  });
});
