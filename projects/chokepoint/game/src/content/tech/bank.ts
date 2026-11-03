/** The "The bank" branch: nodes for how the run's bank pays. */
export interface BankNode {
  id: string;
  name: string;
  line: string;
  price: number;
  /** the bank's pay cap (core/bankInterest) while the node is owned (The deep vault: 20); absent when the node doesn't touch the cap */
  payCap?: number;
  /** the bank's rate (core/tech's bankRate) while the node is owned (The high rate: 8); absent when the node doesn't touch the rate */
  rate?: number;
  /** the bank's pay is doubled while the last stand is on (core/tech's bankLastStand): true on The last stand's vault */
  lastStand?: boolean;
}

export const BANK_NODES: readonly BankNode[] = [
  { id: 'deep-vault', name: 'The deep vault', line: "the bank's pay is capped at +20, not +10", price: 30, payCap: 20 },
  { id: 'high-rate', name: 'The high rate', line: "the bank's rate is 8%, not 5%", price: 85, rate: 8 },
  { id: 'last-stand-vault', name: "The last stand's vault", line: "the bank's pay is doubled at one life", price: 155, lastStand: true },
];
