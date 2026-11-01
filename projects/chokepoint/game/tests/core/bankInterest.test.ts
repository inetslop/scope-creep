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
});
