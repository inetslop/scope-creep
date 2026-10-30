---
id: T0259
title: "The second boss: wave 20 sends the Titan and its Guard, and the Guard carries the shield"
assignee: asus
size: L
priority: 2
status: in-progress
depends_on: [T0256]
attempts: 1
created: 2026-10-30T05:08:57Z
claimed_at: 2026-10-30T12:06:38Z
epic: E5
---

## Goal
The run's second peak swaps the mechanic (E5: "later bosses swap the mechanic"): wave 20 sends the Titan with its Guard, and the Titan's damage resistance is carried by another living enemy — so the wave's decision is where the fire goes, not just how much of it.

## Details
**The enemies** (two new content files, like the others in src/content/enemies/; both spawnOnly in the Colossus's sense — never in a normal mix, the regular 10-cap untouched):

- **The Titan** (the wave's boss):
  - Description: "A bigger wall of Block: while its Guard lives, every hit on it is halved."
  - Behavior walk, steady on the road. No timed phase — T0253's outOfReach is the Colossus's mechanic; the Titan swaps it for the shield.
  - Numbers: hp 720 (the Colossus's 6× Block, wave-scaled like everything — at wave 20 the scaling makes it the run's biggest shape by far), speed 0.9 (Block's), gold 20 (the boss bounty, the Colossus's), livesCost 1, threat 95, fromWave 20, size 0.5.
  - Look: a red square at 0.5 — the Colossus's wall in the family's other color. No new marks; the mechanic lives on the Guard.
  - The shield: while a Guard is alive on the board, every damage the Titan takes is halved — the Bulwark plate's 0.5, but from every direction and every source (a Bolt shot, a Splash burst, a Lance pierce, a Chain leap, a Beam's per-second rate, an Ember tick), with the 0.5 landing after every other damage modifier. It is a damage rule, not a target rule: the Titan is always an ordinary target and fully controllable (slow, root and push all apply).
- **The Guard** (the Titan's escort):
  - Description: "Carries the Titan's shield: kill it to make the Titan take full damage."
  - Behavior walk. Numbers: hp 60, speed 0.9 (the Titan's, so the two hold their gap), gold 8, livesCost 1, threat 5, fromWave 20, size 0.2.
  - Look: a red diamond at 0.2 carrying one flat orange disc on its road-facing front — the shield is visible on the enemy that carries it (the Hauler's coin language, T0098); when the Guard dies, the disc dies with it.

**The wave rule (core/waves.ts):** wave 20's plan is exactly the Guard and the Titan — the Guard at 0 s, the Titan 1.2 s behind, walking about one cell closer to the exit with the shield in front of the boss. The wave-20 plan declares which of its spawns is the boss (the Titan) the way the boss-death hook (T0273) and the boss card (T0256) read it: if T0256's card picks the boss as "the plan's single spawn" or by a def field, that rule becomes "the plan's declared boss spawn" as part of this task. Waves 10 and 40 keep sending the Colossus (T0253's rule); wave 30 sends the Orb (T0266). The preview (T0257's chip, if it has landed) shows the two tokens and the "boss" tag straight from the plan with no change to that file.

**Everything else is automatic:** the name tags say "Titan" and "Guard" on their first spawn in a run (T0085); a Guard leak is an ordinary 1-life leak (the warning, the jolt scaled to its size, the combo break, the Toll pay) and leaves the Titan shielded; a Titan leak is an ordinary 1-life leak; kills are ordinary kills (20 / 8 gold, chips, the combo, the Mint, the by-tower count); a boss wave held clean counts clean; the save writes at the start of the wave, before spawns, so a mid-fight Titan is never in a save; the enemies reference (T0252) lists both with no change to that screen.

**What it punishes:** the spread-the-damage habit — while the Guard lives, every point of damage the board deals is worth half against the boss. **What counters it:** concentrated fire on the small shape (a Reach's heavy shots, a Bolt stack, a Chain's leap) and then the full-damage Titan — or the area build that chews the Guard down while a Splash and a Lance line clean the Titan.

## Compared with what exists — the Titan
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Dot | `walk` | the steady basic walker; no mechanic at all |
| Dart | `walk` | speed and fragility only; always full-damage |
| Block | `walk`, slow and heavy, the square | soaks damage on its own; always full-damage |
| Sprinter | `walk` | gets faster when hit; no resistance |
| Splitter | `walk` | its threat is the pieces it leaves; no resistance |
| Hauler | `walk`, big and slow | a bigger bank of gold on the road; no resistance |
| Mute | `walk` | silences the towers around it — a debuff on the run, not its own survival |
| Ward | `walk`, "do not touch it" | ignores control for its whole life — a defense against aim, not against damage |
| Bulwark | `walk`, the tough front | halves shots into its face — its own plate, one direction |
| Splinter | `walk` | a fast fragment; no mechanic of its own |
| Colossus | `walk`, the boss shape | goes out of reach in timed beats — its own survival, on a clock; the Titan is always targetable and fully controllable, and its half-damage is carried by another living enemy until that enemy is killed |

## Compared with what exists — the Guard
| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Dot | `walk`, the small shape | walks alone; its death is its own |
| Dart | `walk`, the small shape | speed and fragility only; no mechanic |
| Block | `walk`, the square family | soaks damage; no one else benefits from its life |
| Sprinter | `walk` | ramps when hit; no one else benefits from its life |
| Splitter | `walk` | splits into its own pieces on death — never a shield for anyone |
| Hauler | `walk`, the gold on the road | carries a fortune for the killer; never for another enemy |
| Mute | `walk` | spends its life silencing towers; the Guard spends its life arming the Titan's defense |
| Ward | `walk` | ignores control — a self-defense; the Guard's body is someone else's defense |
| Bulwark | `walk`, the plate language | the plate is its own and works only against shots into the face; the Guard carries a separate shield for another enemy, from every direction |
| Splinter | `walk`, the small fast piece | a fragment with no role; the Guard's whole role is the Titan's |
| Colossus | `walk`, the boss wave's shape | is the boss itself; the Guard is the escort that walks ahead of it and carries its damage resistance |

## Acceptance criteria
- [ ] The wave-20 build-phase preview shows exactly two tokens — the Guard's and the Titan's — and nothing else; the wave sends the Guard at 0 s and the Titan about one cell behind it.
- [ ] The Titan is a red square (size 0.5) walking at 0.9 with wave-20 scaled hp; the Guard is a red diamond at 0.2 with one flat orange disc on its road-facing front.
- [ ] While the Guard is alive, every source of damage to the Titan lands at half (a Bolt shot, a Splash burst, a Lance pierce, a Chain leap, a Beam's rate, an Ember tick); the Titan stays an ordinary target and fully controllable the whole time.
- [ ] The moment the Guard dies (any source), the Titan takes full damage from every source; the disc is gone.
- [ ] A Guard leak costs exactly 1 life (the ordinary leak: warning, size-scaled jolt, combo break, Toll pay) and leaves the Titan shielded; a Titan leak costs exactly 1 life.
- [ ] Kills pay 20 (Titan) and 8 (Guard) with the ordinary kill (chips, combo, Mint, by-tower count); a boss wave held clean counts clean; the boss card (T0256) shows the Titan — no notch on the bar, the fill in the Titan's own red — and the boss death moment (T0273) fires on the Titan.
- [ ] The first Titan and the first Guard spawn in a run each pop their name tag; the enemies reference lists both.
- [ ] Every wave except 20 is byte-identical to today (wave 10 and 40 still send the Colossus; wave 30 sends the Orb, T0266); the Titan and the Guard never appear in a normal mix.

## Design (architect, desktop)

### Files
- create `src/content/enemies/titan.ts` — the Titan's `EnemyDef`
- create `src/content/enemies/guard.ts` — the Guard's `EnemyDef`
- edit `src/content/enemies/index.ts` — two imports + two registry lines next to the Colossus's line (T0253's)
- edit `src/content/types.ts` — one field on `EnemyDef`, next to `plate` (line 35)
- create `src/core/shield.ts` — the shield multiplier
- edit `src/core/waves.ts` — wave-20 fixed plan + boss declaration; wave 20 out of `isQuietWave`
- create `src/systems/enemyHooks/titanShield.ts` — keeps `Enemy.shielded` current
- edit `src/systems/enemyHooks/index.ts` — one hook line, next to its kin
- edit `src/entities/Enemy.ts` — `shielded` field + reset, the shield line in `hit()`, the Guard's disc image (plate pattern)
- edit `src/art/textures.ts` — `DISC_TEXTURE`, next to `PLATE_TEXTURE` (line 21)
- edit `src/art/entities.ts` — paint the disc (after the plate block, ~line 86)
- edit `src/debug/runChecks.ts` — one invariant, next to the other `enemies.*` lines
- edit `tests/core/waves.test.ts` — wave-20 test; carve wave 20 out of the Mute/Bulwark/quiet expectations
- create `tests/core/shield.test.ts`
- edit `tests/content.test.ts` — allow the Titan's 0.5 size (line 27)
- edit `src/scenes/EnemiesScene.ts` — line 76 label, only if T0253 left "from a Splitter" on every `spawnOnly` enemy
- edit the boss card T0256 added (find its line in `HudScene`'s parts list, likely `src/ui/hud/BossCard.ts`) — boss selection reads the plan's declared boss
- edit the boss death hook T0273 adds (find it in `ENEMY_HOOKS`, likely `src/systems/enemyHooks/bossDeath.ts`) — fires on the declared boss

### Interfaces
```ts
// content/types.ts, on EnemyDef, next to `plate`:
/** Its shield is carried by enemies of this id: until one is killed, every damage it takes lands at half, after every other modifier (core/shield.ts). */
shieldCarrier?: string;

// core/shield.ts:
import type { EnemyDef } from '../content/types';
export const SHIELD_MUL = 0.5;
/** 0.5 only for a shield-carrying enemy whose shield is up; the caller multiplies it last (after the plate, after the mark). */
export function shieldMul(def: EnemyDef, shielded: boolean): number { return def.shieldCarrier !== undefined && shielded ? SHIELD_MUL : 1; }

// entities/Enemy.ts: public field `shielded = false;` (reset in spawn()); hit() becomes:
this.hp -= damage * (1 + this.markPct) * shieldMul(this.def, this.shielded);

// systems/enemyHooks/titanShield.ts:
import type { MakeEnemyHook } from './hook';
export const titanShield: MakeEnemyHook = ({ enemies }) => {
  let guardKilled = false; // a leak leaves the shield up: only a death on the road strips it
  return {
    onKill(kill) { if (kill.enemy.def.id === 'guard') guardKilled = true; },
    update() { for (const e of enemies.all) { if (!e.active || e.def.shieldCarrier === undefined) continue; e.shielded = !guardKilled; } },
  };
};

// content/enemies/titan.ts: id 'titan', name 'Titan', description "A bigger wall of Block: while its Guard lives, every hit on it is halved.",
//   behavior 'walk', hp 720, speed 0.9, gold 20, livesCost 1, threat 95, fromWave 20, spawnOnly: true, shieldCarrier: 'guard',
//   look { shape: 'square', color: 'red', size: 0.5 }.
// content/enemies/guard.ts: id 'guard', name 'Guard', description "Carries the Titan's shield: kill it to make the Titan take full damage.",
//   behavior 'walk', hp 60, speed 0.9, gold 8, livesCost 1, threat 5, fromWave 20, spawnOnly: true, look { shape: 'diamond', color: 'red', size: 0.2 }.
```

### Steps
1. Read the post-dependency state first: `core/waves.ts` (the every-10 Colossus branch, T0266's Orb plan on wave 30, and the tag T0257 gives those plans), T0256's card, T0273's hook. Note the plan's boss-declaration mechanism and the exact tag string. You will copy both, never invent them.
2. Create `titan.ts` and `guard.ts` (values above; comment style like `bulwark.ts`). Register in `index.ts` (imports alphabetical; list lines right after the Colossus's line).
3. Add `shieldCarrier` to `EnemyDef`; create `core/shield.ts`.
4. `Enemy.ts`: add `shielded = false;` (next to `markPct`, ~line 51) and reset it in `spawn()`; change the `hit()` line exactly as above (import `shieldMul`).
5. Create `titanShield.ts` (snippet above); add one line to `ENEMY_HOOKS`.
6. `waves.ts`: `isQuietWave` → `wave > 0 && wave !== 20 && wave % 4 === 0` (comment: wave 20 is the boss's slot, not a breather). At the top of `planWave`, before the `unlocked` line: `if (wave === 20) return { number: wave, spawns: [{ enemy: 'guard', delaySec: 0 }, { enemy: 'titan', delaySec: 1.2 }], hpMul: waveHpMul(wave), tags: <the every-10 tag>, <boss: 'titan' via the step-1 mechanism> };`.
7. Disc art: `DISC_TEXTURE = 'enemy:disc'` in `art/textures.ts`; in `art/entities.ts` paint it after the plate block — flat circle, radius `gR * 0.42`, centered `gR * 0.55` above the token center (front of the face), fill `PALETTE.orange`, no shadow (it rotates), `gR = getEnemy('guard').look.size * CELL`, size `tokenRoom(gR, tokenDepth(gR)) * 2`. In `Enemy.ts` mirror the plate exactly: private `disc?` next to `plate`; create it in `spawn()` when `this.def.id === 'guard'` (import `DISC_TEXTURE`); place it in `advance()` with the plate's line (same `setPosition/setScale(ART_SCALE * pop)/setRotation(Math.atan2(this.dirX, -this.dirY))/setVisible(true)`); hide it in `despawn()`.
8. Align T0256's card and T0273's hook to the plan's declared boss if they still find it by "single spawn" or a def field (T0273's hook reads the plan's boss, so it likely needs nothing). Verify the card's bar fills in the boss's `look.color` (Titan red) and its phase notch only renders for a boss with a timed phase (the Colossus's field) — the Titan has none.
9. `EnemiesScene.ts:76`: end state — "from a Splitter" only when some def's `splitsInto === def.id`, else `wave ${def.fromWave}`; Titan and Guard read "wave 20". Skip if T0253 already did this.
10. `runChecks.ts`, after `enemies.push`: `['enemies.bossSlot', (g) => (g.run.wave === 20 || !g.enemies.all.some((e) => e.active && (e.def.id === 'titan' || e.def.id === 'guard')) ? null : 'a Titan or Guard alive off its wave 20')],`
11. Tests: `waves.test.ts` — new test asserting wave 20's plan is exactly `[{guard,0},{titan,1.2}]`, boss declared as the Titan, tags equal the every-10 plans' tags, `isQuietWave(20)` false (add 20 to the isQuietWave vector), and `[10,40]` still declare the Colossus (wave 30 declares the Orb, T0266) with no Titan/Guard spawn; carve `wave !== 20` into the Mute (~line 99) and Bulwark (~line 108) expectations like the Ward line; drop 20 from the quiet list (line 162). `content.test.ts:27` → `toBeLessThanOrEqual(e.id === 'titan' ? 0.5 : 0.45)`. New `tests/core/shield.test.ts`: `shieldMul` is 0.5 for the Titan when shielded, 1 otherwise, 1 for a Dot.
12. `npm run check`, then `npm run smoke`.

### Pitfalls
- Wave 20 % 4 === 0: without the `isQuietWave` carve-out, kills pay 40/16 (acceptance says 20/8) and the preview wears a "quiet" chip.
- The wave-20 return must be the first statement of `planWave` — later the Bulwark/Mute reservations or the quiet halving would touch the plan.
- A Guard *leak* keeps the Titan halved; only `onKill` (any source, burn and beam included) strips it. Do not react to `onLeak`.
- Pooled slots: reset `shielded` in `spawn()`, hide the disc in `despawn()` (a slot that was a Bulwark must not flash a disc).
- The disc texture must be flat (no shadow/side face) or it breaks when rotated; keep the plate's rotation math verbatim.
- Don't add Titan/Guard to `planWave`'s id-exclusion lists — `spawnOnly` already keeps them out of the mix, and the ten mix-eligible types stay ten.
- The tag string and boss field come from the landed dependencies; a mismatched invented tag is the main way this goes wrong.

### Tests
- `tests/core/waves.test.ts`: wave-20 plan/boss/tags/isQuietWave assertions + Mute/Bulwark carves (guards against a later change silently re-mixing wave 20 or re-quieting it).
- `tests/core/shield.test.ts`: the 0.5 rule and that unshielded enemies are untouched.
- `tests/content.test.ts`: the Titan's 0.5 cap.
