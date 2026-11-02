import type Phaser from 'phaser';
import { DEPTH } from '../../config';
import { PALETTE } from '../../content/palette';
import { LEECH_CLOSED_TEXTURE } from '../../art/textures';
import { drinkLeg } from '../../core/drink';
import type { Enemy } from '../../entities/Enemy';
import { leechTell } from '../fx/leechTell';
import type { MakeEnemyHook } from './hook';

/**
 * The Leech's drink (content/enemies/leech.ts, core/drink.ts): on its own clock, every
 * `everySec` after it spawned, it flashes white for `telegraphSec`, then drinks `drinkPct` of
 * its own max hp from the nearest living Hauler over `drinkSec` — a thin pink line from its
 * maw to the escort, the escort's bar draining, a green "+N" over the Leech when the drink
 * lands. The drink is damage: a kill it makes pays as a normal death (EnemySystem.drain).
 * After `maxDrinks` drinks — or the moment the last escort is gone — its maw closes: the wedge
 * fills in and the token reads as a plain circle for the rest of its life (the dry readout).
 */
export const leechDrink: MakeEnemyHook = ({ enemies, fx }) => {
  let leechSerial = -1; // the live Leech's spawn serial (the pool reuses objects)
  let age = 0; // the Leech's own clock, like the Mender's: it drinks even while slowed or rooted
  let drinksDone = 0;
  let mawClosed = false;
  let told = false; // the teach is once per run, not per Leech
  let drinking = false; // inside the drink leg right now (the transition flags, not per frame)
  let drinkTarget: Enemy | undefined;
  let drinkTotal = 0;
  let drinkRemaining = 0;
  let drinkGained = 0;
  let toldX = 0;
  let toldY = 0; // the maw-to-escort midpoint of the first drink, for the teach's chip
  let line: Phaser.GameObjects.Graphics | null = null; // per-frame, never fx.track (track tweens once)

  const clearLine = (): void => {
    if (line === null) return;
    line.destroy();
    line = null;
  };

  const drawLine = (L: Enemy, t: Enemy): void => {
    if (line === null) line = fx.scene.add.graphics().setDepth(DEPTH.fx);
    line.clear();
    line.lineStyle(2, PALETTE.pink, 0.85);
    line.lineBetween(L.x, L.y, t.x, t.y);
  };

  const closeMaw = (L: Enemy): void => {
    if (mawClosed) return; // a one-time texture swap
    mawClosed = true;
    L.setTexture(LEECH_CLOSED_TEXTURE); // the wedge fills in: the full readout, no chip
  };

  const resetFor = (): void => {
    age = 0;
    drinksDone = 0;
    mawClosed = false;
    drinking = false;
    drinkTarget = undefined;
    drinkTotal = 0;
    drinkRemaining = 0;
    drinkGained = 0;
    clearLine();
  };

  return {
    update(dt: number): void {
      const L = enemies.all.find((e) => e.active && e.def.drinks !== undefined);
      if (L === undefined) { clearLine(); return; }
      if (L.serial !== leechSerial) { leechSerial = L.serial; resetFor(); } // a recycled slot starts fresh (told stays)
      age += dt;
      const spec = L.def.drinks!;
      const escorts = enemies.all.filter((e) => e.active && e.def.id === spec.escort);
      if (escorts.length === 0 && !mawClosed) closeMaw(L); // the dry readout: the maw closes at once
      const canDrink = !mawClosed && drinksDone < spec.maxDrinks && escorts.length > 0;
      L.drinkReady = canDrink; // arms the white telegraph in the Leech's own advance (entities/Enemy.ts)
      const inDrink = drinkLeg(spec, age) === 'drink' && canDrink;
      if (inDrink && !drinking) {
        // The drink begins: the nearest escort, its total, and the line from maw to escort.
        drinking = true;
        let nearest: Enemy | undefined;
        for (const e of escorts) if (nearest === undefined || Math.hypot(e.x - L.x, e.y - L.y) < Math.hypot(nearest.x - L.x, nearest.y - L.y)) nearest = e;
        drinkTarget = nearest;
        drinkTotal = spec.drinkPct * L.maxHp;
        drinkRemaining = drinkTotal;
        drinkGained = 0;
        if (nearest !== undefined) {
          toldX = (L.x + nearest.x) / 2;
          toldY = (L.y + nearest.y) / 2;
          drawLine(L, nearest);
        }
      }
      if (inDrink && drinking && drinkTarget !== undefined && drinkTarget.active) {
        const target = drinkTarget;
        const amount = Math.min(drinkRemaining, (drinkTotal / spec.drinkSec) * dt);
        const before = target.hp;
        const died = enemies.drain(target, amount); // the drink is damage: its kill is a normal death
        const after = target.active ? target.hp : 0;
        const added = Math.min(before - after, L.maxHp - L.hp); // the Leech never overfills
        L.hp = Math.min(L.maxHp, L.hp + added);
        drinkGained += added;
        drinkRemaining = died ? 0 : drinkRemaining - amount;
        if (died) drinkTarget = undefined; // its death cleared the line (onKill)
        else drawLine(L, target);
      }
      if (!inDrink && drinking) {
        drinking = false;
        drinksDone += 1; // once per drink leg, not per frame
        if (drinkGained > 0) fx.popText(L.x, L.y - 20, `+${Math.round(drinkGained)}`, PALETTE.green); // the streak life-pop's green
        if (!told) { leechTell(fx, toldX, toldY); told = true; } // the one-time teach, at the line's midpoint
        if (drinksDone >= spec.maxDrinks) closeMaw(L); // the maw closes after its last drink
        drinkTarget = undefined;
        drinkTotal = 0;
        drinkRemaining = 0;
        drinkGained = 0;
        clearLine();
      }
    },
    onKill(kill) { if (kill.enemy.def.drinks !== undefined || kill.enemy === drinkTarget) clearLine(); },
    onLeak(enemy) { if (enemy.def.drinks !== undefined || enemy === drinkTarget) clearLine(); },
  };
};
