/** The "The bank" branch: nodes for how the run's bank pays. */
export interface BankNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** the bank's pay cap (core/bankInterest) while the node is owned (The deep vault: 20); absent when the node doesn't touch the cap */
  payCap?: number;
}

export const BANK_NODES: readonly BankNode[] = [
  { id: 'deep-vault', name: 'The deep vault', line: "the bank's pay is capped at +20, not +10", price: 30, payCap: 20 },
];
