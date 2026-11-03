import { drinkLeg } from '../../core/drink';
import type { MakeEnemyHook } from './hook';

export const leechDrinkNote: MakeEnemyHook = ({ enemies, sfx }) => {
  let leechSerial = -1; // the live Leech's spawn serial (the pool reuses objects)
  let wasFlashing = false;
  return {
    update(): void {
      const L = enemies.all.find((e) => e.active && e.def.drinks !== undefined);
      if (L === undefined) { wasFlashing = false; return; }
      if (L.serial !== leechSerial) { leechSerial = L.serial; wasFlashing = false; } // a recycled slot starts fresh
      const flashing = L.drinkReady && drinkLeg(L.def.drinks!, L.age) === 'flash';
      if (flashing && !wasFlashing) sfx?.leechDrink(); // at the flash's start, once per drink
      wasFlashing = flashing;
    },
  };
};
