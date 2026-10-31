import { beforeEach, describe, expect, it } from 'vitest';
import { CONTENT } from '../../src/content/index.ts';
import type { AccessoryDef, PatternDef } from '../api.ts';
import { ProfileStore } from '../client/profile.ts';
import { buildRegistry } from '../registry.ts';

const draw = (): void => undefined;
const cap: AccessoryDef = { id: 'test-cap', name: 'Cap', description: 'A cap.', slot: 'head', price: 0, draw };
const crown: AccessoryDef = { id: 'test-crown', name: 'Crown', description: 'A crown.', slot: 'head', price: 30, draw };
const halo: AccessoryDef = { id: 'test-halo', name: 'Halo', description: 'A halo.', slot: 'head', price: 0, prestige: 2, draw };
const dots: PatternDef = { id: 'test-dots', name: 'Dots', description: 'Dots.', price: 20, draw };
const registry = buildRegistry({ ...CONTENT, accessories: [cap, crown, halo], patterns: [dots] });

const memory = new Map<string, string>();
beforeEach(() => {
  memory.clear();
  (globalThis as { localStorage?: unknown }).localStorage = {
    getItem: (k: string) => memory.get(k) ?? null,
    setItem: (k: string, v: string) => void memory.set(k, v),
  };
});

describe('the profile in the browser', () => {
  it('buys with coins, wears only what it owns, and is there on the next visit', () => {
    const store = new ProfileStore(registry);
    expect(store.owns('test-cap'), 'free things are owned').toBe(true);
    expect(store.cantBuy('test-crown')).toBe('Costs 30 coins');
    expect(store.buy('test-crown')).toBe(false);
    store.wear('head', 'test-crown');
    expect(store.profile.wearing.head, 'not owned: not worn').toBeUndefined();
    store.addEarnings({ coins: 45, prestiges: 0 });
    expect(store.buy('test-crown')).toBe(true);
    expect(store.profile.coins).toBe(15);
    expect(store.cantBuy('test-crown')).toBe('Owned');
    store.wear('head', 'test-crown');
    store.wear('pattern', 'test-cap');
    expect(store.profile.wearing, 'a hat is not a pattern').toEqual({ head: 'test-crown' });
    store.setColor(3);
    expect(store.wire()).toEqual({ head: 2, face: 0, back: 0, pattern: 0 });
    const again = new ProfileStore(registry);
    expect(again.profile).toEqual(store.profile);
  });

  it('prestige items wait for enough prestiges', () => {
    const store = new ProfileStore(registry);
    expect(store.owns('test-halo')).toBe(false);
    expect(store.cantBuy('test-halo')).toBe('Needs 2 prestiges');
    store.addEarnings({ coins: 0, prestiges: 2 });
    expect(store.owns('test-halo')).toBe(true);
  });

  it('a broken or edited profile loads as something sane', () => {
    memory.set('draft-arena:profile', '{"coins":-5,"owned":[1,"test-dots"],"wearing":{"hat":"x","pattern":"test-dots"},"color":99}');
    const store = new ProfileStore(registry);
    expect(store.profile.coins).toBe(0);
    expect(store.profile.owned).toEqual(['test-dots']);
    expect(store.profile.wearing).toEqual({ pattern: 'test-dots' });
    expect(store.profile.color).toBeUndefined();
    expect(store.wire().pattern).toBe(1);
    memory.set('draft-arena:profile', 'not json');
    expect(new ProfileStore(registry).profile.coins).toBe(0);
  });
});
