import { chase, drawCritter, drawFace, type Face, type Look, type MonsterDef } from '../../../engine/api.ts';
import { PALETTE } from '../palette.ts';

/** A player within 300 starts the cycle: telegraph 0.8 s, pop, three births 4 s apart, then 8 s rest. */
const NEAR = 300;
const TELE = 0.8;
const BEAT = 0.3;
const GAP = 2.9; // pop-to-pop is exactly TELE + BEAT + GAP = 4 s
const REST = 8;
const BIRTHS = 3;
const POP_OFFSET = 42;
const POP_RADIUS = 12;

const CALM: Face = { mood: 'calm', eyes: 3, mouth: 'o' };
const TEETH: Face = { mood: 'calm', eyes: 3, mouth: 'teeth' };

const look: Look = { shape: 'circle', color: PALETTE.violet, face: CALM };
/** The biggest body in the field: three eyes in a row, a wide mouth that snaps to teeth before each birth. */
look.draw = (g, e) => {
  const ph = e.slots[0] ?? 0; // 0 shuffling/resting, 1 telegraphing, 2 pop beat
  g.save();
  if (ph === 1) { const fill = (e.slots[1] ?? 0) / 100; g.scale(1 + 0.1 * fill, 1 + 0.1 * fill); } // belly fills over the 0.8 s telegraph
  else if (ph === 2) g.scale(1.1, 0.88); // squashed flat for the beat as the Dot pops out
  drawCritter(g, look, e, { ink: PALETTE.ink });
  g.restore();
  drawFace(g, ph === 0 ? CALM : TEETH, e.radius, e.angle, PALETTE.ink);
};

/** The menagerie's 10th type: a slow sac that keeps birthing Dots while a player stays close. */
export const brood: MonsterDef = {
  id: 'brood',
  name: 'Brood',
  description: 'Keeps birthing Dots while you stay close.',
  hp: 70,
  speed: 25,
  radius: 24,
  damage: 8,
  xp: 6,
  weight: 3,
  fromLevel: 6,
  look,
  think(ctx, m, dt) {
    const mem = m.mem;
    let ph = mem.ph ?? 0; // 0 shuffling/resting, 1 telegraphing, 2 pop beat
    let tm = (mem.tm ?? 0) - dt;
    if (!ctx.nearestEnemy(m, NEAR)) { // nobody within 300: the cycle resets, it just shuffles
      ph = 0; tm = 0; mem.bi = 0; m.slots[0] = 0; m.slots[1] = 0;
      chase(m); mem.ph = ph; mem.tm = tm; return;
    }
    if (ph === 0 && tm <= 0) { ph = 1; tm = TELE; m.slots[1] = 0; } // rest/gap over: start the telegraph
    else if (ph === 1) {
      if (tm <= 0) { // pop: a plain Dot from a random flank
        const a = ctx.rng.next() * Math.PI * 2;
        const x = m.x + Math.cos(a) * POP_OFFSET, y = m.y + Math.sin(a) * POP_OFFSET;
        ctx.spawnMonster('dot', x, y);
        ctx.effect('pop', { x, y }, undefined, POP_RADIUS);
        mem.bi = (mem.bi ?? 0) + 1; ph = 2; tm = BEAT; m.slots[1] = 0;
      } else m.slots[1] = Math.min(100, Math.round((1 - tm / TELE) * 100));
    } else if (ph === 2 && tm <= 0) { // beat over: next birth in 4 s, or 8 s rest after the third
      ph = 0; m.slots[1] = 0;
      if ((mem.bi ?? 0) >= BIRTHS) { mem.bi = 0; tm = REST; } else tm = GAP;
    }
    m.slots[0] = ph; mem.ph = ph; mem.tm = tm;
    chase(m); // it keeps shuffling through every phase
  },
};
