/** Smoke play for Scope Creep (twin-stick): move and shoot, then prove something got shot and something spawned. */
import { keyboardMouseDriver, twoThumbDriver } from '../drivers.ts';
import type { SmokeGame } from '../game.ts';

const game: SmokeGame = {
  playScene: 'Game',
  desktop: keyboardMouseDriver,
  mobile: twoThumbDriver,
  check(s) {
    const errors: string[] = [];
    if (!s.shotsFired) errors.push('no shots were fired: aiming/firing input or the weapon system is broken');
    if (!s.enemiesSpawned) errors.push('no enemies spawned: the spawn system is broken');
    return errors;
  },
  describe: (s) => `${s.shotsFired} shots, ${s.enemiesSpawned} spawned, ${s.enemiesKilled} killed, ${s.upgradesTaken} upgrades, ${s.deaths} deaths`,
};

export default game;
