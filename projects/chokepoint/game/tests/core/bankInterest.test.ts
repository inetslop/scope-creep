import { describe, expect, it } from 'vitest';
import { bankInterest } from '../../src/core/bankInterest';

describe('bankInterest', () => {
  it('pays 5% of the bank, floored', () => {
    expect(bankInterest(100)).toBe(5);
    expect(bankInterest(120)).toBe(6);
    expect(bankInterest(101)).toBe(5); // floor, not round
  });

  it('is paid only from 1 up: a bank under 20 gold pays nothing', () => {
    expect(bankInterest(20)).toBe(1);
    expect(bankInterest(19)).toBe(0);
    expect(bankInterest(0)).toBe(0);
  });

  it('is capped at +10 per wave', () => {
    expect(bankInterest(200)).toBe(10);
    expect(bankInterest(500)).toBe(10);
    expect(bankInterest(10000)).toBe(10);
  });

  it('takes its cap from the argument: with The deep vault (20), +15 at 300, +20 at 400 and past, unchanged below the old cap', () => {
    expect(bankInterest(300, 20)).toBe(15);
    expect(bankInterest(400, 20)).toBe(20);
    expect(bankInterest(500, 20)).toBe(20);
    expect(bankInterest(100, 20)).toBe(5); // the cap never binds below 200
    expect(bankInterest(200, 20)).toBe(10);
  });

  it('takes its rate from the argument: with The high rate (8), +8 at 100 where +5 used to pay, the old cap binds at 200', () => {
    expect(bankInterest(100, 10, 8)).toBe(8);
    expect(bankInterest(101, 10, 8)).toBe(8); // floor, not round
    expect(bankInterest(13, 10, 8)).toBe(1); // the +1-up floor
    expect(bankInterest(12, 10, 8)).toBe(0); // 96 cents: nothing, not one
    expect(bankInterest(200, 10, 8)).toBe(10); // the old cap binds
    expect(bankInterest(200, 20, 8)).toBe(16);
    expect(bankInterest(250, 20, 8)).toBe(20); // the deep cap binds
  });
});
