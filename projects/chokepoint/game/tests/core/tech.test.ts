import { describe, expect, it } from 'vitest';
import { POOL_NODES } from '../../src/content/tech/pool';
import { loadProfile, type KeyValueStore } from '../../src/core/profile';
import { buyNode, buyPoolNode, startBonuses, TECH_NODES } from '../../src/core/tech';

const memory = (): KeyValueStore => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

const withCoins = (coins: number, purchased: string[] = []): KeyValueStore => {
  const store = memory();
  store.setItem('chokepoint:profile', JSON.stringify({ coins, purchased }));
  return store;
};

describe('tech', () => {
  it('the run-start row is one chain of four: three gold nodes, then the life', () => {
    expect(TECH_NODES.map((n) => [n.id, n.price, n.requires, n.gold, n.life])).toEqual([
      ['gold-1', 5, null, 5, 0],
      ['gold-2', 10, 'gold-1', 5, 0],
      ['gold-3', 15, 'gold-2', 5, 0],
      ['life-1', 30, 'gold-3', 0, 1],
    ]);
  });

  it('no owned nodes leave the starting values alone', () => {
    expect(startBonuses([])).toEqual({ gold: 0, life: 0 });
  });

  it('every owned node adds its bonus, counted once each, unknown ids count for nothing', () => {
    expect(startBonuses(['gold-1', 'gold-2', 'gold-3', 'life-1'])).toEqual({ gold: 15, life: 1 });
    expect(startBonuses(['gold-1', 'gold-1', 'life-1', 'life-1'])).toEqual({ gold: 5, life: 1 });
    expect(startBonuses(['nope', 'gold-3'])).toEqual({ gold: 5, life: 0 });
  });

  it('a node buys only when it is known, unowned, unlocked and affordable', () => {
    expect(buyNode(withCoins(60), 'nope')).toBe(false);
    expect(buyNode(withCoins(60), 'gold-2')).toBe(false); // the previous node is not owned
    expect(buyNode(withCoins(60), 'life-1')).toBe(false); // the last gold node is not owned
    const broke = withCoins(4);
    expect(buyNode(broke, 'gold-1')).toBe(false); // unaffordable: the coins never go below zero
    expect(loadProfile(broke).coins).toBe(4);
    const store = withCoins(60, ['gold-1']);
    expect(buyNode(store, 'gold-1')).toBe(false); // already owned
    expect(loadProfile(store).coins).toBe(60);
  });

  it('a purchase deducts exactly the price and saves the id', () => {
    const store = withCoins(60);
    expect(buyNode(store, 'gold-1')).toBe(true);
    expect(loadProfile(store).coins).toBe(55);
    expect(loadProfile(store).purchased).toEqual(['gold-1']);
  });

  it('the full chain of four, bought in order, leaves the remainder', () => {
    const store = withCoins(70);
    for (const node of TECH_NODES) expect(buyNode(store, node.id)).toBe(true);
    expect(loadProfile(store).coins).toBe(10);
    expect(loadProfile(store).purchased).toEqual(['gold-1', 'gold-2', 'gold-3', 'life-1']);
  });

  it('the purchased list parses defensively', () => {
    const store = memory();
    store.setItem('chokepoint:profile', JSON.stringify({ purchased: ['gold-1', 'gold-1', 7, null, ''] }));
    expect(loadProfile(store).purchased).toEqual(['gold-1']);
    store.setItem('chokepoint:profile', JSON.stringify({ purchased: 'gold-1' }));
    expect(loadProfile(store).purchased).toEqual([]);
  });

  it('the pool row is one node: Haste at 25 coins, unlocking the haste augment', () => {
    expect(POOL_NODES.map((n) => [n.id, n.price, n.unlocks])).toEqual([['haste', 25, 'haste']]);
  });

  it('a pool node buys only when it is known, unowned and affordable', () => {
    expect(buyPoolNode(withCoins(60), 'nope')).toBe(false);
    const broke = withCoins(24);
    expect(buyPoolNode(broke, 'haste')).toBe(false); // unaffordable: the coins never go below zero
    expect(loadProfile(broke).coins).toBe(24);
    const store = withCoins(60, ['haste']);
    expect(buyPoolNode(store, 'haste')).toBe(false); // already owned
    expect(loadProfile(store).coins).toBe(60);
  });

  it('a pool purchase deducts exactly the price and saves the id alongside the run-start ones', () => {
    const store = withCoins(60, ['gold-1']);
    expect(buyPoolNode(store, 'haste')).toBe(true);
    expect(loadProfile(store).coins).toBe(35);
    expect(loadProfile(store).purchased).toEqual(['gold-1', 'haste']);
  });

  it('a pool id counts for no run-start bonus', () => {
    expect(startBonuses(['haste'])).toEqual({ gold: 0, life: 0 });
  });
});
