import { describe, expect, it } from 'vitest';
import { MAX_SLOTS } from '../../src/config';
import { DRAFT_NODES } from '../../src/content/tech/draft';
import { draftCardCount, slotCost } from '../../src/core/augments';
import { loadProfile, type KeyValueStore } from '../../src/core/profile';
import { buyNode } from '../../src/core/tech';
import { draftCardsFor, draftTech, slotPrice } from '../../src/core/techEffects';

const memory = (): KeyValueStore => {
  const data = new Map<string, string>();
  return { getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
};

const withCoins = (coins: number, purchased: string[] = []): KeyValueStore => {
  const store = memory();
  store.setItem('chokepoint:profile', JSON.stringify({ coins, purchased }));
  return store;
};

describe('techEffects', () => {
  it('the draft row is one branch: two −5 slot nodes, then the fourth card', () => {
    expect(DRAFT_NODES.map((n) => [n.id, n.name, n.price, n.requires, n.kind])).toEqual([
      ['slot2-1', 'Slot II −5', 10, null, 'slot2'],
      ['slot2-2', 'Slot II −5', 20, 'slot2-1', 'slot2'],
      ['fourth-card', 'Fourth card', 15, null, 'fourth'],
    ]);
  });

  it('no owned nodes change slot prices or draft card counts', () => {
    expect(draftTech([])).toEqual({ slotDiscount: 0, fourthCard: false });
    for (let i = 0; i < MAX_SLOTS; i++) expect(slotPrice(i, 0)).toBe(slotCost(i)!);
    for (let n = 1; n <= 10; n++) expect(draftCardsFor(n, false)).toBe(draftCardCount(n));
  });

  it('each owned Slot II node takes 5 gold off the second slot, floored at 5; other slots keep their price', () => {
    expect(slotPrice(1, 0)).toBe(70);
    expect(slotPrice(1, 5)).toBe(65);
    expect(slotPrice(1, 10)).toBe(60);
    expect(slotPrice(1, 65)).toBe(5); // the floor
    expect(slotPrice(1, 1000)).toBe(5);
    for (const i of [0, 2, 3]) expect(slotPrice(i, 10)).toBe(slotCost(i)!);
    expect(slotPrice(MAX_SLOTS, 10)).toBeUndefined(); // no slot beyond the last: no price
  });

  it('draftTech counts each node once, unknown ids count for nothing', () => {
    expect(draftTech(['slot2-1'])).toEqual({ slotDiscount: 5, fourthCard: false });
    expect(draftTech(['slot2-1', 'slot2-2'])).toEqual({ slotDiscount: 10, fourthCard: false });
    expect(draftTech(['fourth-card'])).toEqual({ slotDiscount: 0, fourthCard: true });
    expect(draftTech(['slot2-1', 'slot2-1', 'fourth-card', 'fourth-card', 'nope'])).toEqual({ slotDiscount: 5, fourthCard: true });
  });

  it('only the pre-wave-1 draft gets the fourth card; wave-2+ drafts keep their count', () => {
    expect(draftCardsFor(1, true)).toBe(4);
    expect(draftCardsFor(1, false)).toBe(3);
    expect(draftCardsFor(5, true)).toBe(4); // the every-fifth rule already offers four there
    expect(draftCardsFor(6, true)).toBe(3);
  });

  it('a draft node buys only when it is known, unowned, unlocked and affordable', () => {
    expect(buyNode(withCoins(60), 'nope')).toBe(false);
    expect(buyNode(withCoins(60), 'slot2-2')).toBe(false); // the previous node is not owned
    const broke = withCoins(9);
    expect(buyNode(broke, 'slot2-1')).toBe(false); // unaffordable: the coins never go below zero
    expect(loadProfile(broke).coins).toBe(9);
    const store = withCoins(60, ['slot2-1']);
    expect(buyNode(store, 'slot2-1')).toBe(false); // already owned
    expect(loadProfile(store).coins).toBe(60);
  });

  it('a draft-node purchase deducts exactly the price and saves the id', () => {
    const store = withCoins(95);
    expect(buyNode(store, 'slot2-1')).toBe(true);
    expect(loadProfile(store).coins).toBe(85);
    expect(buyNode(store, 'slot2-2')).toBe(true); // unlocked by the first slot node now
    expect(loadProfile(store).coins).toBe(55); // slot2-2 at 30
    expect(buyNode(store, 'fourth-card')).toBe(true);
    expect(loadProfile(store).coins).toBe(5); // fourth-card at 50
    expect(loadProfile(store).purchased).toEqual(['slot2-1', 'slot2-2', 'fourth-card']);
  });

  it('both branches buy from the same coin balance and purchased list', () => {
    const store = withCoins(5, ['slot2-1']);
    expect(buyNode(store, 'gold-1')).toBe(true);
    expect(loadProfile(store).coins).toBe(0);
    expect(loadProfile(store).purchased).toEqual(['slot2-1', 'gold-1']);
  });
});
