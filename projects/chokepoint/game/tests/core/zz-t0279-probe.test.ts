import { it } from 'vitest';
import { GRID, ROCKS } from '../../src/config';
import { generateMap } from '../../src/core/map';
import { RunState } from '../../src/core/run';
import { draftPool, rollOffer } from '../../src/core/augments';
import { draftCardsFor } from '../../src/core/techEffects';

// TEMP T0279 probe: what does the seed-1234 opening draft offer (desktop layout), and what does
// the smoke playtest's beam-first swap produce? Deleted after the playtest.
it('probe the opening offers', () => {
  const run = new RunState(1234, [], 2);
  generateMap(run.rng, GRID.long, GRID.short, ROCKS, 0, 1, 2);
  const offer = rollOffer(run.rng, draftPool([]), draftCardsFor(1, false), 1, true);
  console.log('bolt-run opening offer:', JSON.stringify(offer));
  const swapped = offer.map((c) => c);
  const i = swapped.findIndex((c) => c.id === 'beam');
  if (i > 0) { const [c] = swapped.splice(i, 1); swapped.unshift(c); }
  else if (i < 0) swapped[0] = { id: 'beam', tier: 'common' };
  console.log('beam-run opening offer:', JSON.stringify(swapped));
});
