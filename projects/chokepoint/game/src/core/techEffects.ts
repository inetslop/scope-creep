import { DRAFT_NODES } from '../content/tech/draft';
import { draftCardCount, slotCost } from './augments';

/** What the owned "The draft" tech nodes change for a new run. */
export interface DraftTech {
  /** Gold off a tower's second slot: 5 per owned "Slot II" node. */
  slotDiscount: number;
  /** The pre-wave-1 draft offers a fourth card. */
  fourthCard: boolean;
}

/** What the owned "The draft" nodes give a new run; each node counts once, unknown ids count for nothing. */
export function draftTech(owned: readonly string[]): DraftTech {
  let slotDiscount = 0;
  let fourthCard = false;
  const seen = new Set<string>();
  for (const id of owned) {
    if (seen.has(id)) continue;
    seen.add(id);
    const node = DRAFT_NODES.find((n) => n.id === id);
    if (!node) continue;
    if (node.kind === 'slot2') slotDiscount += 5;
    if (node.kind === 'fourth') fourthCard = true;
  }
  return { slotDiscount, fourthCard };
}

/**
 * What a tower's slot at `index` costs after the owned "Slot II" nodes: the second slot drops
 * by `discount` gold, floored at 5; every other slot keeps its base price.
 */
export function slotPrice(index: number, discount: number): number | undefined {
  const base = slotCost(index);
  if (base === undefined) return undefined;
  return index === 1 ? Math.max(5, base - discount) : base;
}

/** How many cards the draft at `draftNumber` offers, with the "Fourth card" node owned or not. */
export function draftCardsFor(draftNumber: number, fourthCard: boolean): number {
  return fourthCard && draftNumber === 1 ? 4 : draftCardCount(draftNumber);
}
