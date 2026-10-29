import { describe, expect, it } from 'vitest';
import { CLAIM_NODES, cleanWavePay } from '../../src/content/tech/claim';
import { POOL_NODES } from '../../src/content/tech/pool';
import { loadProfile, type KeyValueStore } from '../../src/core/profile';
import { buyClaimNode, buyNode, buyPoolNode, nodeInReach, startBonuses, TECH_NODES } from '../../src/core/tech';

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
  it('the run-start row is one chain of five: three gold nodes, then two lives', () => {
    expect(TECH_NODES.map((n) => [n.id, n.price, n.requires, n.gold, n.life])).toEqual([
      ['gold-1', 5, null, 5, 0],
      ['gold-2', 10, 'gold-1', 5, 0],
      ['gold-3', 15, 'gold-2', 5, 0],
      ['life-1', 30, 'gold-3', 0, 1],
      ['life-2', 40, 'life-1', 0, 1],
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

  it('the two life nodes stack: owning both adds two lives', () => {
    expect(startBonuses(['life-1', 'life-2'])).toEqual({ gold: 0, life: 2 });
    expect(startBonuses(['gold-1', 'gold-2', 'gold-3', 'life-1', 'life-2'])).toEqual({ gold: 15, life: 2 });
  });

  it('a node buys only when it is known, unowned, unlocked and affordable', () => {
    expect(buyNode(withCoins(60), 'nope')).toBe(false);
    expect(buyNode(withCoins(60), 'gold-2')).toBe(false); // the previous node is not owned
    expect(buyNode(withCoins(60), 'life-1')).toBe(false); // the last gold node is not owned
    expect(buyNode(withCoins(60), 'life-2')).toBe(false); // the previous life node is not owned
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

  it('the full chain of five, bought in order, leaves the remainder', () => {
    const store = withCoins(110);
    for (const node of TECH_NODES) expect(buyNode(store, node.id)).toBe(true);
    expect(loadProfile(store).coins).toBe(10);
    expect(loadProfile(store).purchased).toEqual(['gold-1', 'gold-2', 'gold-3', 'life-1', 'life-2']);
  });

  it('the purchased list parses defensively', () => {
    const store = memory();
    store.setItem('chokepoint:profile', JSON.stringify({ purchased: ['gold-1', 'gold-1', 7, null, ''] }));
    expect(loadProfile(store).purchased).toEqual(['gold-1']);
    store.setItem('chokepoint:profile', JSON.stringify({ purchased: 'gold-1' }));
    expect(loadProfile(store).purchased).toEqual([]);
  });

  it('the pool row is three nodes: Haste at 25, Momentum and Mend at 30, each unlocking its augment', () => {
    expect(POOL_NODES.map((n) => [n.id, n.price, n.unlocks])).toEqual([
      ['haste', 25, 'haste'],
      ['momentum', 30, 'momentum'],
      ['mend', 30, 'mend'],
    ]);
  });

  it('a pool node buys only when it is known, unowned and affordable', () => {
    expect(buyPoolNode(withCoins(60), 'nope')).toBe(false);
    const broke = withCoins(24);
    expect(buyPoolNode(broke, 'haste')).toBe(false); // unaffordable: the coins never go below zero
    expect(loadProfile(broke).coins).toBe(24);
    const store = withCoins(60, ['haste']);
    expect(buyPoolNode(store, 'haste')).toBe(false); // already owned
    expect(loadProfile(store).coins).toBe(60);
    const brokeM = withCoins(29);
    expect(buyPoolNode(brokeM, 'momentum')).toBe(false); // unaffordable: 29 < 30
    expect(loadProfile(brokeM).coins).toBe(29);
    const ownedM = withCoins(60, ['momentum']);
    expect(buyPoolNode(ownedM, 'momentum')).toBe(false); // already owned
    expect(loadProfile(ownedM).coins).toBe(60);
    const brokeM2 = withCoins(29);
    expect(buyPoolNode(brokeM2, 'mend')).toBe(false); // unaffordable: 29 < 30
    expect(loadProfile(brokeM2).coins).toBe(29);
    const ownedM2 = withCoins(60, ['mend']);
    expect(buyPoolNode(ownedM2, 'mend')).toBe(false); // already owned
    expect(loadProfile(ownedM2).coins).toBe(60);
  });

  it('a pool purchase deducts exactly the price and saves the id alongside the run-start ones', () => {
    const store = withCoins(60, ['gold-1']);
    expect(buyPoolNode(store, 'haste')).toBe(true);
    expect(loadProfile(store).coins).toBe(35);
    expect(loadProfile(store).purchased).toEqual(['gold-1', 'haste']);
    const store2 = withCoins(55, ['haste']);
    expect(buyPoolNode(store2, 'momentum')).toBe(true);
    expect(loadProfile(store2).coins).toBe(25);
    expect(loadProfile(store2).purchased).toEqual(['haste', 'momentum']);
    const store3 = withCoins(85, ['haste', 'momentum']);
    expect(buyPoolNode(store3, 'mend')).toBe(true);
    expect(loadProfile(store3).coins).toBe(55);
    expect(loadProfile(store3).purchased).toEqual(['haste', 'momentum', 'mend']);
  });

  it('a pool id counts for no run-start bonus', () => {
    expect(startBonuses(['haste'])).toEqual({ gold: 0, life: 0 });
  });

  it('the claim row is one node: Clean ×2 at 30, paying two coins per clean wave', () => {
    expect(CLAIM_NODES.map((n) => [n.id, n.name, n.price, n.pay])).toEqual([['clean2', 'Clean ×2', 30, 2]]);
  });

  it('a clean wave pays one coin until the claim node is owned', () => {
    expect(cleanWavePay([])).toBe(1);
    expect(cleanWavePay(['gold-1', 'haste'])).toBe(1); // the other branches leave the pay alone
    expect(cleanWavePay(['clean2'])).toBe(2);
  });

  it('a claim node buys only when it is known, unowned and affordable', () => {
    expect(buyClaimNode(withCoins(60), 'nope')).toBe(false);
    const broke = withCoins(29);
    expect(buyClaimNode(broke, 'clean2')).toBe(false); // unaffordable: 29 < 30
    expect(loadProfile(broke).coins).toBe(29);
    const owned = withCoins(60, ['clean2']);
    expect(buyClaimNode(owned, 'clean2')).toBe(false); // already owned
    expect(loadProfile(owned).coins).toBe(60);
  });

  it('a claim purchase deducts exactly 30 and saves the id alongside the other branches', () => {
    const store = withCoins(60, ['gold-1', 'haste']);
    expect(buyClaimNode(store, 'clean2')).toBe(true);
    expect(loadProfile(store).coins).toBe(30);
    expect(loadProfile(store).purchased).toEqual(['gold-1', 'haste', 'clean2']);
  });

  it("the Tech button's dot: in reach while some unowned node's price is within the coins", () => {
    expect(nodeInReach([], 0)).toBe(false);
    expect(nodeInReach([], 5)).toBe(true); // gold-1, the run-start branch's cheapest node
    expect(nodeInReach([], 4)).toBe(false); // a balance that reaches no unowned node
    expect(nodeInReach([...TECH_NODES, ...POOL_NODES, ...CLAIM_NODES].map((n) => n.id), 99999)).toBe(false); // every node owned
  });
});
