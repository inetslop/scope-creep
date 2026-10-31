import type { MakeHudPart } from '../../engine/api.ts';
import './coin.css';
import { coinTick } from '../audio/sfx.ts';

/**
 * The coin tick: one bright clink the moment coins land on the player (a kill coin or an
 * event coin), and several collected at once a quick little roll — one tick each, 30 ms apart.
 * No DOM, no card: sound only.
 */
export const coin: MakeHudPart = () => {
  let last: number | undefined;
  return {
    update(view) {
      const c = view.me?.coins;
      if (c === undefined) { last = undefined; return; } // menu/connecting: forget
      if (last === undefined) { last = c; return; }      // first match frame: no tick
      const d = c - last; last = c;
      if (d > 0) { coinTick(); for (let i = 1; i < d; i++) setTimeout(coinTick, 30 * i); }
    },
  };
};
