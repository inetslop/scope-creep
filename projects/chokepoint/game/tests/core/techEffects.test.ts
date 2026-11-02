import { describe, expect, it } from 'vitest';
import { MAX_SLOTS } from '../../src/config';
import { DRAFT_NODES } from '../../src/content/tech/draft';
import { draftCardCount, slotCost } from '../../src/core/augments';
import { loadProfile, type KeyValueStore } from '../../src/core/profile';
import { buyNode } from '../../src/core/tech';
import { draftCardsFor, draftTech, movePrice, moveRefund, sellPrice, sellRefund, slotPrice } from '../../src/core/techEffects';

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

  it('selling pays 70% of what the unlocked slots cost, floored, without the Soft sell node (the discount only touches the second slot)', () => {
    expect(sellPrice(1, 0, [])).toBe(28); // 70% of the 40 first slot
    expect(sellPrice(1, 5, [])).toBe(28); // the discount only touches the second slot
    expect(sellPrice(2, 0, [])).toBe(77); // 70% of 40 + 70
    expect(sellPrice(2, 10, [])).toBe(70); // 70% of 40 + 60
    expect(sellPrice(MAX_SLOTS, 0, [])).toBe(469); // 70% of 40 + 70 + 160 + 400
  });

  it('sellRefund is 7 per 10 without the node, 8 with Soft sell; other-branch and duplicate ids count for nothing', () => {
    expect(sellRefund([])).toBe(7);
    expect(sellRefund(['soft-sell'])).toBe(8);
    expect(sellRefund(['gold-1'])).toBe(7);
    expect(sellRefund(['soft-sell', 'soft-sell', 'nope'])).toBe(8);
  });

  it('with Soft sell, selling pays 80% of what the unlocked slots cost, floored', () => {
    expect(sellPrice(1, 0, ['soft-sell'])).toBe(32); // 80% of the 40 first slot
    expect(sellPrice(2, 10, ['soft-sell'])).toBe(80); // 80% of 40 + 60
    expect(sellPrice(MAX_SLOTS, 0, ['soft-sell'])).toBe(536); // 80% of 40 + 70 + 160 + 400
  });

  it('moveRefund is the sell per-10 rule at a lower base rate: 6 without a node, 8 with Soft sell; other-branch and duplicate ids count for nothing', () => {
    expect(moveRefund([])).toBe(6);
    expect(moveRefund(['soft-sell'])).toBe(8);
    expect(moveRefund(['gold-1'])).toBe(6);
    expect(moveRefund(['soft-sell', 'soft-sell', 'nope'])).toBe(8);
  });

  it('moving pays 60% of what the unlocked slots cost, floored at 5, without the Soft sell node (the discount only touches the second slot)', () => {
    expect(movePrice(1, 0, [])).toBe(24); // 60% of the 40 first slot
    expect(movePrice(1, 5, [])).toBe(24); // the discount only touches the second slot
    expect(movePrice(2, 0, [])).toBe(66); // 60% of 40 + 70
    expect(movePrice(2, 10, [])).toBe(60); // 60% of 40 + 60
    expect(movePrice(MAX_SLOTS, 0, [])).toBe(402); // 60% of 40 + 70 + 160 + 400
  });

  it('with Soft sell, moving pays 80% of what the unlocked slots cost (the node lifts the rate past the base 60%)', () => {
    expect(movePrice(1, 0, ['soft-sell'])).toBe(32); // 80% of the 40 first slot
    expect(movePrice(2, 10, ['soft-sell'])).toBe(80); // 80% of 40 + 60
    expect(movePrice(MAX_SLOTS, 0, ['soft-sell'])).toBe(536); // 80% of 40 + 70 + 160 + 400
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
