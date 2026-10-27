---
id: T0065
title: Crescendo — the streak turns your fire rate up
assignee: desktop
size: M
priority: 2
status: in-progress
depends_on: []
attempts: 1
created: 2026-10-27T03:07:33Z
claimed_at: 2026-10-27T03:40:35Z
---

## Goal
A kill streak stops being decorative: while the streak is 8 or higher, fire rate is +10% and the HUD streak tally turns red. Streaks become a real weapon, rewarding the exact play the "RHYTHM" flash already celebrates.

## Details
- While the run kill streak (T0014, tracked on RunState and locked by the T0057 tests) is 8 or higher, the player's fire rate is multiplied by 1.10. Apply it wherever the fire-rate stat already applies (Point, Line, Arc, and any future firing weapon) — the streak bonus is a temporary multiplier on top of that stat, not a new stat.
- The bonus drops the instant the streak falls below 8 (taking any damage resets the streak to 0, per the T0057-locked rules).
- Stacks multiplicatively with all fire-rate upgrades (Rhythm, Tempo, Allegro, Staccato, Pressure, Ostinato, Glissando, Trill, Pulse): at max Rhythm with streak ≥ 8, fire rate = Rhythm-modified rate × 1.10.
- HUD: while the streak is 8 or higher, the existing kill-streak tally changes from ink to red; it returns to ink when the streak drops below 8. The tally number itself is unchanged.
- No new SFX and no new flash — the existing "RHYTHM" flash at 8 stays exactly as it is.
- If the effective fire-rate multiplier is not already mirrored in the debug hook stats, expose it (same pattern as the T0054 debug stats) so the smoke test can confirm the ×1.10 while active and ×1.0 when the streak is below 8.
- Note: T0054 (score, on desktop-4070) is concurrently editing the HUD and debug hook files — re-read them right before editing and keep both features intact.

## Acceptance criteria
- [ ] After 8 consecutive kills without being hit, volleys fire 10% faster than they did at streak 7 (visible on Point: ~10% shorter time between shots).
- [ ] Taking one hit while streaked immediately returns fire rate to the sub-8 rate.
- [ ] The HUD kill-streak tally is red while the streak is 8 or higher and ink below 8.
- [ ] The bonus multiplies with fire-rate upgrades (e.g. Rhythm maxed: streak ≥ 8 rate = 1.10 × the Rhythm-modified rate, not a flat add).
- [ ] `npm run check` and `npm run smoke` pass.

## Design (architect, desktop)

### Files
- edit `src/core/stats.ts` - add the Crescendo threshold/bonus constants and two pure helpers (single source of truth)
- edit `src/systems/WeaponSystem.ts` - use the helper in the volley cooldown line (covers Point and Line)
- edit `src/systems/ArcSystem.ts` - same substitution in its cooldown line
- edit `src/debug/testHook.ts` - add one live field to `HookStats` (same pattern as the T0054 score stats)
- edit `src/scenes/GameScene.ts` - write the field every frame + register one cheap invariant
- edit `src/scenes/HudScene.ts` - streak tally turns red at 8+, back to ink below 8
- edit `tests/core/stats.test.ts` - unit tests for the new helpers

### Interfaces
Append to `src/core/stats.ts`:
```ts
/** Crescendo: a kill streak at or above this length earns a temporary fire-rate bonus. */
export const STREAK_FIRE_BONUS_STREAK = 8;
/** The bonus: multiplied on top of fireRateMul. It is not a stat. */
export const STREAK_FIRE_BONUS = 1.1;

/** 1.1 while the kill streak is at or above STREAK_FIRE_BONUS_STREAK, else 1. */
export function streakFireBonus(streak: number): number {
  return streak >= STREAK_FIRE_BONUS_STREAK ? STREAK_FIRE_BONUS : 1;
}

/** Total fire-rate multiplier weapons use: the upgrade stat times the temporary streak bonus. */
export function fireRateMultiplier(stats: PlayerStats, streak: number): number {
  return stats.fireRateMul * streakFireBonus(streak);
}
```
Add to `HookStats` live section in `testHook.ts` and to the `stats` object literal (value `1`):
```ts
/** Crescendo bonus actually applied this run: 1.1 while the kill streak is 8+, else 1. */
streakFireBonus: number;
```

### Steps
1. Re-read `stats.ts`, `testHook.ts`, `GameScene.ts`, `HudScene.ts`, `WeaponSystem.ts`, `ArcSystem.ts` right before editing each — T0040 and T0054 are concurrently editing testHook/GameScene/HudScene. Anchor on the snippets below, not line numbers; only insert, never reformat or move existing members.
2. `stats.ts`: append the block above.
3. `WeaponSystem.update` (line 37): `cd += 1 / (def.fireRate * fireRateMultiplier(this.run.stats, this.run.streak));` + import `fireRateMultiplier` from `../core/stats`. If T0055 (Counterpoint) has landed and added another `1 / (def.fireRate * ...)` line, make the same substitution there too.
4. `ArcSystem.update` (line 57): identical substitution.
5. `testHook.ts`: add the field to `HookStats` and `streakFireBonus: 1,` to the literal.
6. `GameScene`: in `updateHookStats()` add `s.streakFireBonus = streakFireBonus(this.run.streak);`; import `streakFireBonus, STREAK_FIRE_BONUS_STREAK, STREAK_FIRE_BONUS` from `../core/stats`; in `registerInvariants()` add and append `'streak-fire-bonus'` to the module-level `INVARIANTS` array:
```ts
hook.addInvariant('streak-fire-bonus', () => {
  const expected = this.run.streak >= STREAK_FIRE_BONUS_STREAK ? STREAK_FIRE_BONUS : 1;
  return hook.stats.streakFireBonus === expected ? null : `streakFireBonus ${hook.stats.streakFireBonus} at streak ${this.run.streak}`;
});
```
7. `HudScene.updateStreak`: change `const red = now < this.flashUntil;` to `const red = now < this.flashUntil || s >= STREAK_FIRE_BONUS_STREAK;` and import `STREAK_FIRE_BONUS_STREAK` from `../core/stats`. Nothing else in `updateStreak` changes.
8. `tests/core/stats.test.ts`: add the tests below.
9. Run `npm run check`, then `npm run smoke`.

### Pitfalls
- Do NOT add anything to `PlayerStats`/`BASE_STATS`/`STAT_LIMITS` or `computeStats` — the bonus must stay out of `run.stats` so it drops the instant `takeDamage`/`drain` resets the streak and is never clamped by the fireRateMul limit.
- Leave the RHYTHM flash block (`Math.floor(s / 8)` comparison, 800 ms `flashUntil`) untouched; the only HUD change is the `red` expression. At the 8th kill the flash and the 8+ rule coincide; after the flash ends the `s >= 8` term keeps the tally red.
- The hook field must be the bonus factor exactly (1.1 / 1), NOT `fireRateMul * bonus` — the smoke test asserts those exact values.
- No new SFX, flash, scene, system, listener, or pooled object: no cleanup work, no touch-layout work. Cooldowns are already `dt`-based; max possible rate (8 × 1.1 × 4/s) stays far inside the 400-projectile pool.

### Tests
Append to `tests/core/stats.test.ts` (import `streakFireBonus, fireRateMultiplier` from `../../src/core/stats`):
```ts
describe('streak fire bonus (Crescendo)', () => {
  it('is 1 below the threshold and 1.1 at 8 and above', () => {
    expect(streakFireBonus(7)).toBe(1);
    expect(streakFireBonus(8)).toBe(1.1);
    expect(streakFireBonus(16)).toBe(1.1);
  });

  it('multiplies on top of fire-rate upgrades, not a flat add', () => {
    const run = new RunState(1);
    for (let i = 0; i < 5; i++) run.applyUpgrade(UPGRADE_BY_ID.get('rhythm')!);
    expect(fireRateMultiplier(run.stats, 7)).toBeCloseTo(1.2 ** 5, 12);
    expect(fireRateMultiplier(run.stats, 8)).toBeCloseTo(1.2 ** 5 * 1.1, 12);
  });

  it('drops to 1 the moment damage resets the streak', () => {
    const run = new RunState(1);
    for (let i = 0; i < 8; i++) run.registerKill();
    expect(streakFireBonus(run.streak)).toBe(1.1);
    run.takeDamage(1);
    expect(streakFireBonus(run.streak)).toBe(1);
  });
});
```
