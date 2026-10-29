import { START, WAVE_BONUS } from '../config';
import type { AugmentCopy } from '../content/types';
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
  /** Gold off a tower's second slot from the owned "Slot II" tech nodes (0 in resumed runs). */
  slotDiscount = 0;
  /** The pre-wave-1 draft offers a fourth card (the "Fourth card" node, off in resumed runs). */
  fourthCard = false;
  /** The wave being fought, or the last one fought (0 before the first). */
  wave = 0;
  phase: RunPhase = 'build';
  /** Build time left before the next wave starts on its own. */
  buildLeftSec = 0;
  /** Augment copies (id + tier) picked but not put into a tower yet. */
  hand: AugmentCopy[] = [...START.hand];
  kills = 0;
  bestCombo = 0; // the longest kill chain the run reached (the ×N counter's high mark)
  goldEarned = 0; // gold earned this run: kill gold + wave bonuses
  cleanWaves = 0; // waves that ended without a leak
  rerollUsed = false; // the run's one draft reroll was spent
  cleanStreak = 0; // clean waves in a row; a leak resets it to 0
  streakPaid = false; // the run's one +1 life for a streak of 3 was paid
  private leaksThisWave = 0;

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

  /** Pays for the run's one reroll: takes the gold and marks it spent. */
  reroll(cost: number): boolean {
    if (this.rerollUsed) return false;
    if (!this.spend(cost)) return false;
    this.rerollUsed = true;
    return true;
  }

  /** An enemy died: its gold. Returns the gold paid. */
  addKill(gold: number): number {
    const paid = Math.max(0, gold);
    this.gold += paid;
    this.kills += 1;
    this.goldEarned += paid;
    return paid;
  }

  /** The chain counter rose to `n`: the ledger keeps the longest one the run reached. */
  noteCombo(n: number): void {
    if (n > this.bestCombo) this.bestCombo = n;
  }

  /** An enemy got through. Returns true when that ended the run. */
  leak(livesCost: number): boolean {
    if (this.phase === 'over') return true;
    this.lives = Math.max(0, this.lives - livesCost);
    this.leaksThisWave += 1;
    this.cleanStreak = 0;
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
    this.leaksThisWave = 0;
  }

  /** All of the wave's enemies are gone and the run is still alive: pay the bonus and go to the draft. */
  clearWave(): number {
    const bonus = RunState.waveBonus(this.wave);
    this.gold += bonus;
    this.goldEarned += bonus;
    if (this.leaksThisWave === 0) {
      this.cleanWaves += 1;
      this.cleanStreak += 1;
      if (this.cleanStreak === 3 && !this.streakPaid) {
        this.lives += 1;
        this.streakPaid = true;
      }
    }
    this.leaksThisWave = 0;
    this.phase = 'draft';
    return bonus;
  }

  /** The clean wave's second line under the wave-cleared text: how the streak builds toward a
   * life, or the life it just pays. `paidNow` is true when this wave was the run's one +1-life pay. */
  cleanStreakLine(paidNow: boolean): string | undefined {
    if (paidNow) return '3 in a row: +1 life';
    if (this.streakPaid) return undefined; // the streak already paid this run: only the coin
    return `${this.cleanStreak} of 3 in a row for +1 life`;
  }

  /** The draft's pick goes into the hand. */
  takeAugment(copy: AugmentCopy): void {
    this.hand.push(copy);
  }

  /** Takes the augment copy at `index` out of the hand (to put it into a tower). */
  useAugment(index: number): AugmentCopy | undefined {
    if (index < 0 || index >= this.hand.length) return undefined;
    return this.hand.splice(index, 1)[0];
  }

  startBuild(seconds: number): void {
    this.phase = 'build';
    this.buildLeftSec = seconds;
  }

  /** "Send" the wave early: bank the build countdown, 2 gold per whole second left. Returns the gold banked. */
  bankSend(): number {
    if (this.phase !== 'build') return 0;
    const secs = Math.floor(this.buildLeftSec);
    const banked = (Number.isFinite(secs) && secs > 0 ? secs : 0) * 2;
    this.gold += banked;
    this.buildLeftSec = 0;
    return banked;
  }
}
