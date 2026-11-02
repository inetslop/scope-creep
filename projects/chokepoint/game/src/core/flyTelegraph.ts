import type { WavePlan } from './waves';

/**
 * True only when the plan declares the Flyer as its boss (today: wave 50, exactly one Flyer):
 * the boss tag, one spawn, and it is the boss Flyer ('crosser' — the mix Flyer is 'flyer' and
 * never a boss). A pure read of the plan: no rng, no run state.
 */
export function isFlyerBossPlan(plan: WavePlan | undefined): boolean {
  return !!plan && plan.tags.includes('boss') && plan.spawns.length === 1 && plan.spawns[0]!.enemy === 'crosser';
}
