/// <reference types="node" />
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/debug/flags', () => ({ flags: { smoke: false, skipMenu: false, debug: false, seed: undefined } }));

describe('the boards post', () => {
  it('posts the run with its level and multiplier', async () => {
    const fetchSpy = vi.fn(async (_url: string, _init: RequestInit) => ({ ok: true, status: 200, json: async () => ({}) }));
    vi.stubGlobal('fetch', fetchSpy);
    process.env.VITE_BOARDS_URL = 'http://boards.test'; // BASE is read once, on the module's first import
    const { submitRun } = await import('../../src/net/boards');
    const run = { name: 'WREN', waves: 5, kills: 40, seed: 7, mul: 1.5, level: 2 };
    await submitRun(run);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toBe('http://boards.test/submit');
    expect(JSON.parse(String(init.body))).toEqual(run);
  });
});
