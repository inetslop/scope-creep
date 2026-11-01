import { describe, expect, it } from 'vitest';
import { BED_NOTES, bedForm } from '../../src/core/bedForm';

describe('bedForm', () => {
  it('normal, no quicken: the loop in its own register, 0.4 s steps, no voices under it', () => {
    const f = bedForm(false, false);
    expect(f.notes).toEqual([164.81, 164.81, 196, 164.81, 130.81, 164.81, 196, 220]);
    expect(f.stepSec).toBe(0.4);
    expect(f.vol).toBe(0.04);
    expect(f.echoVol).toBe(0);
    expect(f.drone).toBe(0);
    expect(f.droneVol).toBe(0);
    expect(f.realTime).toBe(false);
  });

  it('normal with the quicken: the same loop twice as fast, with the octave-up voice', () => {
    const f = bedForm(false, true);
    expect(f.notes).toEqual(BED_NOTES);
    expect(f.stepSec).toBe(0.2);
    expect(f.vol).toBe(0.04);
    expect(f.echoVol).toBe(0.03);
    expect(f.drone).toBe(0);
    expect(f.droneVol).toBe(0);
    expect(f.realTime).toBe(false);
  });

  it('last stand, no quicken: the loop an octave lower on the real-time clock, with the held root', () => {
    const f = bedForm(true, false);
    expect(f.notes).toEqual(BED_NOTES.map(n => n / 2));
    expect(f.stepSec).toBe(0.4);
    expect(f.vol).toBe(0.04);
    expect(f.echoVol).toBe(0);
    expect(f.drone).toBe(BED_NOTES[0]! / 4); // E1: one octave below the transposed heartbeat's root
    expect(f.droneVol).toBe(0.02);
    expect(f.realTime).toBe(true);
  });

  it('last stand with the quicken: the lower register, the quickened step and the drone together', () => {
    const f = bedForm(true, true);
    expect(f.notes).toEqual(BED_NOTES.map(n => n / 2));
    expect(f.stepSec).toBe(0.2);
    expect(f.vol).toBe(0.04);
    expect(f.echoVol).toBe(0.03);
    expect(f.drone).toBe(BED_NOTES[0]! / 4);
    expect(f.droneVol).toBe(0.02);
    expect(f.realTime).toBe(true);
  });
});
