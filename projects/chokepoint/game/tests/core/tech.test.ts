import { describe, expect, it } from 'vitest';
import { BOARD_NODES } from '../../src/content/tech/board';
import { CLAIM_NODES, cleanWavePay, flawlessPay, heldPay } from '../../src/content/tech/claim';
import { POOL_NODES } from '../../src/content/tech/pool';
import { WAVE_NODES } from '../../src/content/tech/wave';
import { TOWER_NODES } from '../../src/content/tech/tower';
import { EXIT_NODES } from '../../src/content/tech/exit';
import { loadProfile, type KeyValueStore } from '../../src/core/profile';
import { boardBends, boardChokes, boardFarGate, boardLengthMul, buyBoardNode, buyClaimNode, buyExitNode, buyNode, buyPoolNode, buyTowerNode, buyWaveNode, leakWarnLead, nodeCost, nodeInReach, nodePrice, startBonuses, TECH_NODES, waveWalkFactor } from '../../src/core/tech';

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
    const store = withCoins(150);
    for (const node of TECH_NODES) expect(buyNode(store, node.id)).toBe(true);
    expect(loadProfile(store).coins).toBe(10); // 5, then 15, 25, 40 and 55 at their depth
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
    expect(buyPoolNode(brokeM, 'momentum')).toBe(false); // unaffordable: 29 < 70
    expect(loadProfile(brokeM).coins).toBe(29);
    const ownedM = withCoins(60, ['momentum']);
    expect(buyPoolNode(ownedM, 'momentum')).toBe(false); // already owned
    expect(loadProfile(ownedM).coins).toBe(60);
    const brokeM2 = withCoins(29);
    expect(buyPoolNode(brokeM2, 'mend')).toBe(false); // unaffordable: 29 < 130
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
    const store2 = withCoins(100, ['haste']);
    expect(buyPoolNode(store2, 'momentum')).toBe(true);
    expect(loadProfile(store2).coins).toBe(30); // momentum at 70
    expect(loadProfile(store2).purchased).toEqual(['haste', 'momentum']);
    const store3 = withCoins(145, ['haste', 'momentum']);
    expect(buyPoolNode(store3, 'mend')).toBe(true);
    expect(loadProfile(store3).coins).toBe(15); // mend at 130
    expect(loadProfile(store3).purchased).toEqual(['haste', 'momentum', 'mend']);
  });

  it('a pool id counts for no run-start bonus', () => {
    expect(startBonuses(['haste'])).toEqual({ gold: 0, life: 0 });
  });

  it('the claim row is three nodes: Clean ×2 at 30, then Flawless, then Held paying 1 coin per life lost', () => {
    expect(CLAIM_NODES.map((n) => [n.id, n.name, n.price, n.pay, n.flawless, n.heldPerLife, n.requires])).toEqual([
      ['clean2', 'Clean ×2', 30, 2, 0, 0, null],
      ['flawless', 'Flawless', 30, 0, 10, 0, 'clean2'],
      ['held-pays', 'Held pays', 30, 0, 0, 1, 'flawless'],
    ]);
  });

  it('a clean wave pays one coin until the claim node is owned', () => {
    expect(cleanWavePay([])).toBe(1);
    expect(cleanWavePay(['gold-1', 'haste'])).toBe(1); // the other branches leave the pay alone
    expect(cleanWavePay(['clean2'])).toBe(2);
  });

  it('a flawless run pays 10 coins only while the Flawless node is owned', () => {
    expect(flawlessPay([])).toBe(0);
    expect(flawlessPay(['clean2'])).toBe(0); // the first node does not pay the flawless run
    expect(flawlessPay(['flawless'])).toBe(10);
  });

  it('a life lost pays 1 coin only while the Held pays node is owned', () => {
    expect(heldPay([])).toBe(0);
    expect(heldPay(['clean2', 'flawless'])).toBe(0); // the siblings do not pay the held wave
    expect(heldPay(['held-pays'])).toBe(1);
  });

  it('a claim node buys only when it is known, unowned, unlocked and affordable', () => {
    expect(buyClaimNode(withCoins(60), 'nope')).toBe(false);
    const broke = withCoins(29);
    expect(buyClaimNode(broke, 'clean2')).toBe(false); // unaffordable: 29 < 30
    expect(loadProfile(broke).coins).toBe(29);
    const owned = withCoins(60, ['clean2']);
    expect(buyClaimNode(owned, 'clean2')).toBe(false); // already owned
    expect(loadProfile(owned).coins).toBe(60);
    expect(buyClaimNode(withCoins(85), 'flawless')).toBe(false); // Clean ×2 is not owned
    const brokeF = withCoins(84, ['clean2']);
    expect(buyClaimNode(brokeF, 'flawless')).toBe(false); // unaffordable: 84 < 85
    expect(loadProfile(brokeF).coins).toBe(84);
    const storeF = withCoins(85, ['clean2']);
    expect(buyClaimNode(storeF, 'flawless')).toBe(true);
    expect(loadProfile(storeF).coins).toBe(0);
    expect(loadProfile(storeF).purchased).toEqual(['clean2', 'flawless']);
  });

  it('a claim purchase deducts exactly 30 and saves the id alongside the other branches', () => {
    const store = withCoins(60, ['gold-1', 'haste']);
    expect(buyClaimNode(store, 'clean2')).toBe(true);
    expect(loadProfile(store).coins).toBe(30);
    expect(loadProfile(store).purchased).toEqual(['gold-1', 'haste', 'clean2']);
  });

  it('the board row is four nodes: One more bend, The long way, Two chokes and The switchback', () => {
    expect(BOARD_NODES.map((n) => [n.id, n.price, n.bends, n.lengthMul, n.chokes, n.fold])).toEqual([
      ['one-more-bend', 10, 1, 1, 1, false],
      ['long-way', 30, 0, 1.25, 1, false],
      ['two-chokes', 30, 0, 1, 2, false],
      ['switchback', 10, 0, 1, 1, true],
    ]);
  });

  it('a board node buys only when it is known, unowned and affordable', () => {
    expect(buyBoardNode(withCoins(60), 'nope')).toBe(false);
    const broke = withCoins(9);
    expect(buyBoardNode(broke, 'one-more-bend')).toBe(false); // unaffordable: 9 < 10
    expect(loadProfile(broke).coins).toBe(9);
    const owned = withCoins(60, ['one-more-bend']);
    expect(buyBoardNode(owned, 'one-more-bend')).toBe(false); // already owned
    expect(loadProfile(owned).coins).toBe(60);
  });

  it('a board purchase deducts exactly 10 and saves the id alongside the other branches', () => {
    const store = withCoins(60, ['gold-1', 'haste']);
    expect(buyBoardNode(store, 'one-more-bend')).toBe(true);
    expect(loadProfile(store).coins).toBe(50);
    expect(loadProfile(store).purchased).toEqual(['gold-1', 'haste', 'one-more-bend']);
  });

  it('the third board node buys at the depth price: 50 coins with the other two owned, 49 refuses', () => {
    const store = withCoins(50, ['one-more-bend', 'long-way']);
    expect(buyBoardNode(store, 'two-chokes')).toBe(true);
    expect(loadProfile(store).coins).toBe(0);
    expect(loadProfile(store).purchased).toEqual(['one-more-bend', 'long-way', 'two-chokes']);
    const broke = withCoins(49, ['one-more-bend', 'long-way']);
    expect(buyBoardNode(broke, 'two-chokes')).toBe(false); // unaffordable: 49 < 50
    expect(loadProfile(broke).coins).toBe(49);
  });

  it('the second board node buys at the depth price: 30 coins with one owned, 29 refuses', () => {
    const store = withCoins(30, ['one-more-bend']);
    expect(buyBoardNode(store, 'long-way')).toBe(true);
    expect(loadProfile(store).coins).toBe(0);
    expect(loadProfile(store).purchased).toEqual(['one-more-bend', 'long-way']);
    const broke = withCoins(29, ['one-more-bend']);
    expect(buyBoardNode(broke, 'long-way')).toBe(false); // unaffordable: 29 < 30
    expect(loadProfile(broke).coins).toBe(29);
  });

  it('boardBends sums the owned board nodes once each; unknown and other-branch ids count for nothing', () => {
    expect(boardBends(['one-more-bend', 'one-more-bend', 'haste'])).toBe(1);
    expect(boardBends([])).toBe(0);
    expect(boardBends(['nope', 'gold-1', 'clean2'])).toBe(0);
  });

  it("boardLengthMul takes the biggest owned node's road length; duplicates and unknown ids count for nothing", () => {
    expect(boardLengthMul([])).toBe(1);
    expect(boardLengthMul(['one-more-bend'])).toBe(1);
    expect(boardLengthMul(['long-way'])).toBe(1.25);
    expect(boardLengthMul(['one-more-bend', 'long-way', 'long-way', 'haste', 'nope'])).toBe(1.25);
  });

  it("boardChokes takes the biggest owned node's choke count; duplicates and unknown ids count for nothing", () => {
    expect(boardChokes([])).toBe(1);
    expect(boardChokes(['one-more-bend', 'long-way'])).toBe(1);
    expect(boardChokes(['two-chokes'])).toBe(2);
    expect(boardChokes(['two-chokes', 'two-chokes', 'one-more-bend', 'haste', 'nope'])).toBe(2);
  });

  it('a board id counts for no run-start bonus', () => {
    expect(startBonuses(['one-more-bend'])).toEqual({ gold: 0, life: 0 });
  });

  it('the wave row is two nodes: The door at 30 with the far gate, The thin road at 30 walking 10% slower', () => {
    expect(WAVE_NODES.map((n) => [n.id, n.name, n.line, n.price, n.farGate, n.walkMul])).toEqual([
      ['door', 'The door', 'the far gate on every board', 30, true, undefined],
      ['thin-road', 'The thin road', 'every enemy walks 10% slower, for every run after', 30, false, 0.9],
    ]);
  });

  it('a wave node buys only when it is known, unowned and affordable', () => {
    expect(buyWaveNode(withCoins(60), 'nope')).toBe(false);
    const broke = withCoins(29);
    expect(buyWaveNode(broke, 'door')).toBe(false); // unaffordable: 29 < 30
    expect(loadProfile(broke).coins).toBe(29);
    const owned = withCoins(60, ['door']);
    expect(buyWaveNode(owned, 'door')).toBe(false); // already owned
    expect(loadProfile(owned).coins).toBe(60);
    const short = withCoins(84);
    expect(buyWaveNode(short, 'thin-road')).toBe(false); // unaffordable: 84 < 85, its depth-2 price
    expect(loadProfile(short).coins).toBe(84);
    const paid = withCoins(85);
    expect(buyWaveNode(paid, 'thin-road')).toBe(true);
    expect(loadProfile(paid).coins).toBe(0);
    expect(loadProfile(paid).purchased).toEqual(['thin-road']);
  });

  it('a wave purchase deducts exactly 30 and saves the id alongside the other branches', () => {
    const store = withCoins(60, ['gold-1', 'one-more-bend']);
    expect(buyWaveNode(store, 'door')).toBe(true);
    expect(loadProfile(store).coins).toBe(30);
    expect(loadProfile(store).purchased).toEqual(['gold-1', 'one-more-bend', 'door']);
  });

  it('boardFarGate is on while a wave node with the gate is owned; duplicates and other-branch ids count for nothing', () => {
    expect(boardFarGate([])).toBe(false);
    expect(boardFarGate(['gold-1', 'haste', 'one-more-bend', 'nope'])).toBe(false);
    expect(boardFarGate(['door'])).toBe(true);
    expect(boardFarGate(['door', 'door', 'gold-1'])).toBe(true);
  });

  it('waveWalkFactor is 0.9 while The thin road is owned; duplicates and other-branch ids count for nothing', () => {
    expect(waveWalkFactor([])).toBe(1);
    expect(waveWalkFactor(['door', 'gold-1', 'haste', 'nope'])).toBe(1);
    expect(waveWalkFactor(['thin-road'])).toBe(0.9);
    expect(waveWalkFactor(['door', 'thin-road', 'thin-road', 'gold-1'])).toBe(0.9);
  });

  it("the tower row is one node for now, Soft sell at 30: a sell pays 80% of the slots' cost, not 70%", () => {
    expect(TOWER_NODES.map((n) => [n.id, n.name, n.line, n.price, n.refund])).toEqual([
      ['soft-sell', 'Soft sell', "a sell pays 80% of its slots' cost, not 70%", 30, 8],
    ]);
  });

  it('a tower node buys only when it is known, unowned and affordable', () => {
    expect(buyTowerNode(withCoins(60), 'nope')).toBe(false);
    const broke = withCoins(29);
    expect(buyTowerNode(broke, 'soft-sell')).toBe(false); // unaffordable: 29 < 30
    expect(loadProfile(broke).coins).toBe(29);
    const owned = withCoins(60, ['soft-sell']);
    expect(buyTowerNode(owned, 'soft-sell')).toBe(false); // already owned
    expect(loadProfile(owned).coins).toBe(60);
  });

  it('a tower purchase deducts exactly 30 and saves the id alongside the other branches', () => {
    const store = withCoins(60, ['gold-1', 'door']);
    expect(buyTowerNode(store, 'soft-sell')).toBe(true);
    expect(loadProfile(store).coins).toBe(30);
    expect(loadProfile(store).purchased).toEqual(['gold-1', 'door', 'soft-sell']);
  });

  it('the exit row is one node for now, The long watch at 30: the leak warning starts 5 s out', () => {
    expect(EXIT_NODES.map((n) => [n.id, n.name, n.line, n.price, n.lead])).toEqual([
      ['long-watch', 'The long watch', 'the leak warning starts 5 s out', 30, 5],
    ]);
  });

  it('leakWarnLead is 3 with no, other-branch or unknown ids, 5 while The long watch is owned; duplicates count once', () => {
    expect(leakWarnLead([])).toBe(3);
    expect(leakWarnLead(['gold-1', 'door', 'soft-sell', 'nope'])).toBe(3);
    expect(leakWarnLead(['long-watch'])).toBe(5);
    expect(leakWarnLead(['gold-1', 'long-watch', 'long-watch'])).toBe(5);
  });

  it('an exit node buys only when it is known, unowned and affordable', () => {
    expect(buyExitNode(withCoins(60), 'nope')).toBe(false);
    const broke = withCoins(29);
    expect(buyExitNode(broke, 'long-watch')).toBe(false); // unaffordable: 29 < 30
    expect(loadProfile(broke).coins).toBe(29);
    const owned = withCoins(60, ['long-watch']);
    expect(buyExitNode(owned, 'long-watch')).toBe(false); // already owned
    expect(loadProfile(owned).coins).toBe(60);
  });

  it('an exit purchase deducts exactly 30 and saves the id alongside the other branches', () => {
    const store = withCoins(60, ['gold-1', 'door']);
    expect(buyExitNode(store, 'long-watch')).toBe(true);
    expect(loadProfile(store).coins).toBe(30);
    expect(loadProfile(store).purchased).toEqual(['gold-1', 'door', 'long-watch']);
  });

  it('nodePrice rounds base × depth^1.5 to the nearest multiple of 5 (halves up)', () => {
    expect(nodePrice(10, 1)).toBe(10);
    expect(nodePrice(10, 2)).toBe(30);
    expect(nodePrice(10, 3)).toBe(50);
    expect(nodePrice(10, 4)).toBe(80);
    expect(nodePrice(10, 5)).toBe(110);
    expect(nodePrice(25, 2)).toBe(70);
    expect(nodePrice(25, 3)).toBe(130);
    expect(nodePrice(30, 2)).toBe(85);
  });

  it('nodeCost: the first node is the base, later nodes scale by their position', () => {
    expect(nodeCost(TECH_NODES, 'gold-1')).toBe(5);
    expect(nodeCost(TECH_NODES, 'life-2')).toBe(55);
    expect(nodeCost(CLAIM_NODES, 'flawless')).toBe(85); // 30 at the claim branch's depth 2
    expect(nodeCost(CLAIM_NODES, 'held-pays')).toBe(155); // 30 at the claim branch's depth 3
    expect(nodeCost(WAVE_NODES, 'door')).toBe(30); // the wave branch's first node, at depth one
    expect(nodeCost(WAVE_NODES, 'thin-road')).toBe(85); // 30 at the wave branch's depth 2
    expect(nodeCost(TOWER_NODES, 'soft-sell')).toBe(30); // the tower branch's first node, at depth one
  });

  it('a later node buys at its depth price, deducted from the coins', () => {
    const s = withCoins(100, ['gold-1']);
    expect(buyNode(s, 'gold-2')).toBe(true);
    expect(loadProfile(s).coins).toBe(85); // gold-2 at 15
    const s2 = withCoins(60, ['gold-1', 'gold-2', 'gold-3']);
    expect(buyNode(s2, 'life-1')).toBe(true);
    expect(loadProfile(s2).coins).toBe(20); // life-1 at 40, its fourth depth
  });

  it("the Tech button's dot: in reach while some unowned node's price is within the coins", () => {
    expect(nodeInReach([], 0)).toBe(false);
    expect(nodeInReach([], 5)).toBe(true); // gold-1, the run-start branch's cheapest node
    expect(nodeInReach([], 4)).toBe(false); // a balance that reaches no unowned node
    expect(nodeInReach([...TECH_NODES, ...POOL_NODES, ...CLAIM_NODES, ...BOARD_NODES, ...WAVE_NODES, ...TOWER_NODES, ...EXIT_NODES].map((n) => n.id), 99999)).toBe(false); // every node owned
    const allButTwo = [...TECH_NODES, ...POOL_NODES, ...CLAIM_NODES, ...BOARD_NODES.filter((n) => n.id !== 'two-chokes'), ...WAVE_NODES, ...TOWER_NODES, ...EXIT_NODES].map((n) => n.id);
    expect(nodeInReach(allButTwo, 49)).toBe(false); // the last unowned node costs 50 at its depth
    expect(nodeInReach(allButTwo, 50)).toBe(true);
  });
});
