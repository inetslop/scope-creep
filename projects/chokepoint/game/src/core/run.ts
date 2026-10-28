import { START, WAVE_BONUS } from '../config';
import { Rng } from './rng';

/**
 * What a run is doing:
 *   build  between waves: place towers, the countdown runs
 *   wave   enemies are coming
 *   draft  the wave is cleared, the player picks an augment
 *   over   lives ran out
 */
export type RunPhase = 'build' | 'wave' | 'draft' | 'over';

/** Everything about the current run that isn't an engine object. Shared through the registry as 'run'. */
export class RunState {
  readonly seed: number;
  readonly rng: Rng;
  gold: number = START.gold;
  lives: number = START.lives;
  /** The wave being fought, or the last one fought (0 before the first). */
  wave = 0;
  phase: RunPhase = 'build';
  /** Build time left before the next wave starts on its own. */
  buildLeftSec = 0;
  /** Augment ids picked but not put into a tower yet. */
  hand: string[] = [...START.hand];
  kills = 0;

  constructor(seed: number) {
    this.seed = seed;
    this.rng = new Rng(seed);
  }

  /** The lives ran out. (A getter, so a check after calls that may end the run isn't narrowed away.) */
  get over(): boolean {
    return this.phase === 'over';
  }

  /** Waves fully cleared. */
  get wavesCleared(): number {
    return this.phase === 'wave' || this.phase === 'over' ? Math.max(0, this.wave - 1) : this.wave;
  }

  /** The run's score: waves cleared, then kills as the tie-break. */
  get score(): number {
    return this.wavesCleared * 100 + this.kills;
  }

  canAfford(cost: number): boolean {
    return this.gold >= cost;
  }

  /** Takes `cost` gold if there is enough. Returns whether it did. */
  spend(cost: number): boolean {
    if (cost < 0 || this.gold < cost) return false;
    this.gold -= cost;
    return true;
  }

  /** An enemy died: its gold. Returns the gold paid. */
  addKill(gold: number): number {
    const paid = Math.max(0, gold);
    this.gold += paid;
    this.kills += 1;
    return paid;
  }

  /** An enemy got through. Returns true when that ended the run. */
  leak(livesCost: number): boolean {
    if (this.phase === 'over') return true;
    this.lives = Math.max(0, this.lives - livesCost);
    if (this.lives === 0) this.phase = 'over';
    return this.phase === 'over';
  }

  /** Gold for clearing wave `wave`. */
  static waveBonus(wave: number): number {
    return WAVE_BONUS.base + WAVE_BONUS.perWave * wave;
  }

  startWave(): void {
    this.wave += 1;
    this.phase = 'wave';
  }

  /** All of the wave's enemies are gone and the run is still alive: pay the bonus and go to the draft. */
  clearWave(): number {
    const bonus = RunState.waveBonus(this.wave);
    this.gold += bonus;
    this.phase = 'draft';
    return bonus;
  }

  /** The draft's pick goes into the hand. */
  takeAugment(id: string): void {
    this.hand.push(id);
  }

  /** Takes the augment at `index` out of the hand (to put it into a tower). */
  useAugment(index: number): string | undefined {
    if (index < 0 || index >= this.hand.length) return undefined;
    return this.hand.splice(index, 1)[0];
  }

  startBuild(seconds: number): void {
    this.phase = 'build';
    this.buildLeftSec = seconds;
  }
}
