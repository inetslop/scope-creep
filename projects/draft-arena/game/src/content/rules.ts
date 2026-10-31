import type { Rules } from '../../engine/api.ts';
import { PALETTE, PLAYER_COLORS } from './palette.ts';

/** The match's numbers. Tuning lives here. */
export const RULES: Rules = {
  world: { width: 4000, height: 4000 },
  ground: PALETTE.ground,
  ink: PALETTE.ink,
  player: { maxHp: 100, speed: 210, radius: 18, pickup: 90, regen: 0.5 },
  respawnSeconds: 3,
  xp: { first: 5, growth: 1.3 },
  spawn: {
    every: 0.5,
    base: 14,
    perLevel: 3,
    max: 60,
    burst: 4,
    minDistance: 820,
    maxDistance: 1000,
    relocateDistance: 1100,
    maxMonsters: 2400,
  },
  monsterHpPerLevel: 0.12,
  gem: 'gem',
  maxPickups: 1500,
  effects: { death: 'pop', levelUp: 'ring', playerDeath: 'burst' },
  score: { monsterKill: 1, playerKill: 25 },
  pvp: { damageMul: 0.5, bountyXpPerLevel: 4 },
  bots: { fillTo: 6, names: ['Ada', 'Bix', 'Cato', 'Dee', 'Eli', 'Fen', 'Gus', 'Hal', 'Ivy', 'Jo'] },
  playerColors: PLAYER_COLORS,
};
