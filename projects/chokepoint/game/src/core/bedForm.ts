/** The wave bed's form, pure: which register and voices the 8-note loop wears and how fast it steps.
 * The normal form is the bed as it always was; the last-stand form drops it an octave, keeps the
 * same 0.4 s step in real audio seconds (2× fast-forward leaves it unchanged), and holds the loop's
 * root a further octave down as a quiet drone. The exit warning's quicken stacks on either. */

export const BED_NOTES = [164.81, 164.81, 196, 164.81, 130.81, 164.81, 196, 220]; // E3 E3 G3 E3 C3 E3 G3 A3

export interface BedForm {
  readonly notes: readonly number[];  // the 8-note loop in the form's register
  readonly stepSec: number;           // seconds per step, the quicken applied
  readonly vol: number;               // heartbeat pre-master volume
  readonly echoVol: number;           // the quicken's octave-up voice (0 = absent)
  readonly drone: number;             // held root frequency (0 = absent)
  readonly droneVol: number;          // drone pre-master volume (0 = absent)
  readonly realTime: boolean;         // step clock: real audio seconds (last stand) vs sim seconds (normal)
}

const STEP_SEC = 0.4, VOL = 0.04, DANGER_VOL = 0.03, DRONE_VOL = 0.02;
const LS_NOTES = BED_NOTES.map(f => f / 2); // E2 E2 G2 E2 C2 E2 G2 A2: the heartbeat an octave lower

/** (last stand on/off, quicken on/off) → the form's notes, step, volumes and clock. */
export function bedForm(lastStand: boolean, quicken: boolean): BedForm {
  return {
    notes: lastStand ? LS_NOTES : BED_NOTES,
    stepSec: quicken ? STEP_SEC / 2 : STEP_SEC,
    vol: VOL,
    echoVol: quicken ? DANGER_VOL : 0,
    drone: lastStand ? BED_NOTES[0]! / 4 : 0, // E1: one octave below the transposed heartbeat's root
    droneVol: lastStand ? DRONE_VOL : 0,
    realTime: lastStand,
  };
}
