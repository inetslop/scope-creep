---
id: T0062
title: "Trap: the bomb that springs on the road"
size: M
priority: 3
status: todo
depends_on: [T0039, T0054, T0055]
attempts: 0
created: 2026-10-28T13:29:40Z
epic: E4
---

## Goal
A new pool augment with a new kind of attack: a trap that waits on the road and springs when an enemy steps on it — the game's first triggered attack, and the first augment whose added form leaves something on the board.

## Details
- Closest existing augment: **Splash** (a burst around a point). New: the burst is not fired by the tower — it is triggered by an enemy arriving at a fixed point on the road, so a trap's value is a placement decision (where the road passes the tower, where it bunches); and added, kills leave traps at their spots, which no added form does.
- Card lines (the draft card, both forms):
  - First: "Lays a trap on the road ahead: when an enemy comes within 0.6 cells, it springs — 14 damage to everything within 1.2 cells."
  - Added: "Kills by this tower leave a trap at the kill spot."
- **First form (its own attack):** a small red trap disc (flat, ~0.5 cell across, dark red ring) sits on the road on the nearest road cell to the tower. The tower re-lays the disc every 3.0 s (Common) / 2.5 s (Rare) / 2.0 s (Epic) whenever its home trap is missing (the timer runs continuously). When any enemy's center comes within 0.6 cells of the disc's center it springs: 14 (Common) / 18 (Rare) / 24 (Epic) damage to every enemy within 1.2 (1.3 / 1.4) cells of the disc — a white ring pulse, and the usual chips for the kills it causes — and the disc is consumed.
- **Added form:** on every kill the tower makes (whatever its attack), if the tower has fewer than 2 active traps, a trap disc appears at the kill spot with the same tier values. A kill-laid disc fades after 6 s if untriggered. A tower keeps at most 2 active traps: its home trap plus the newest kill-lay (a new kill-lay replaces an old one; the home trap is never replaced).
- The disc is an object on the board, not a projectile: it is not targeted, blocks nothing, and is unaffected by slows or roots — a rooted or slowed enemy standing on it still triggers the spring.
- On the tower: a trap-first tower is a low round red token with a small dark red disc on its face (the trap's shape); slots show their tier pips as usual (T0010); an added Trap in any tower shows as one small red tick on the token, the same tick language as the other added forms.
- Draft: Trap joins the pool at all three tiers, offered from the opening draft (like Lead, Ember, Push, Beam and Ricochet), rolling at the normal tier odds (T0002/T0011); the card's frame, gems and tier word are as usual.
- Closest example to model: Anchor (T0023) — a pool augment with a cadence and an added form on the host's attack; here the cadence pulse is a triggered spring and the added form is a kill-lay.

## Acceptance criteria
- [ ] A new tower with Trap first is red, shows the trap-disc shape, and lays a red disc on the nearest road cell; the disc springs (white ring pulse + chips) when an enemy comes within 0.6 cells, dealing 14/18/24 damage to everything within 1.2/1.3/1.4 cells by tier, and re-lays on the 3.0/2.5/2.0 s cadence.
- [ ] Any tower with an added Trap lays a disc at the kill spot when it makes kills (max 2 active per tower: home + newest kill-lay); a kill-laid disc fades after 6 s if untriggered and springs with the same values.
- [ ] A rooted or slowed enemy on a disc triggers the spring; the disc is not a projectile, is not targeted and blocks nothing.
- [ ] The draft offers Trap at normal tier odds from the opening draft; the card shows both lines; the tower shows one red tick per added copy; works at 412x915 and 1280x720.

## Design (architect, desktop)

### Files
- create `src/content/augments/trap.ts` — the Trap augment (content as data).
- create `src/systems/TrapSystem.ts` — owns every trap disc: the home disc's cadence, the kill-lays, the trigger check and the spring.
- create `src/systems/attacks/trap.ts` — the `'trap'` attack kind, a no-op (the disc is driven by TrapSystem; TowerSystem skips trap-home towers).
- create `tests/core/trap.test.ts` — guards the new `towerSpec` trap fields and the panel line.
- edit `src/content/types.ts` — add `'trap'` to `AttackKind`; `FirstForm.trap?: { spring; radius; reLay }`; `AddedForm.trap?: boolean`; `TierValues.trapSpring?/trapRadius?/trapRelay?`.
- edit `src/content/augments/index.ts` — `import { trap } from './trap';` + `trap,` in `AUGMENTS` (next to `anchor`).
- edit `src/core/tiers.ts` — `tierFirst`: copy/scale the `trap` field via the three new replace-fields.
- edit `src/core/augments.ts` — 6 new `TowerSpec` fields + `EMPTY` defaults + the trap loop in `towerSpec` + a `describeSpec` case/append.
- edit `src/systems/attacks/index.ts` — `import { trap } from './trap';` + `trap,` in `ATTACKS`.
- edit `src/systems/TowerSystem.ts` — skip gate: `if (t.spec.trapHome || (...)) continue;`.
- edit `src/systems/EnemySystem.ts` — a `traps: () => TrapSystem | undefined` field + one `onKill` call in `kill()`.
- edit `src/entities/towerLook.ts` — 2 `DECORATIONS` entries (face disc + red tick).
- edit `src/art/textures.ts` — `TRAP_DISC` key. edit `src/art/entities.ts` — paint the disc.
- edit `src/audio/Sfx.ts` — `trapSpring()`.
- edit `src/scenes/GameScene.ts` — construct/wire/update the system.
- edit `src/debug/runChecks.ts` — `['traps.valid', (g) => g.traps.brokenTrap()]` next to the `towers.*` lines.
- edit `tests/content.test.ts` — line 51: append `|| a.first.trap` (trap's `first.damage` is 0).

### Interfaces
```ts
// content/types.ts
export type AttackKind = /* ...existing... */ | 'trap';
// FirstForm:
trap?: { spring: number; radius: number; reLay: number }; // spring damage, spring radius (cells), re-lay cadence (s)
// AddedForm:
trap?: boolean; // kills by this tower leave a disc at the kill spot
// TierValues:
trapSpring?: number; trapRadius?: number; trapRelay?: number;

// core/augments.ts — TowerSpec gains (and EMPTY defaults them to false/0):
trapHome: boolean;   // first augment is a trap → keeps a home disc on the road
trapLays: boolean;   // has a trap in an added slot → lays a kill-lay on each kill
trapSpring: number;  // disc spring damage (strongest trap in the tower, at its tier)
trapRadius: number;  // disc spring radius, cells (strongest trap, at its tier)
trapRelay: number;   // home-disc re-lay cadence, seconds (the first trap, at its tier)
trapTicks: number;   // traps in added slots → one red tick each

// systems/TrapSystem.ts
export class TrapSystem {
  constructor(scene: Phaser.Scene, board: Board, enemies: EnemySystem, towers: TowerSystem, fx: FxSystem, sfx: Sfx | undefined);
  update(dt: number): void;                 // re-lay homes on cadence, fade kill-lays, check triggers, spring
  onKill(tower: Tower, x: number, y: number): void; // lay/replace the tower's kill-lay (no-op unless spec.trapLays)
  brokenTrap(): string | undefined;
}
```
Trap content (`src/content/augments/trap.ts`): `id:'trap'`, `look:{shape:'circle',color:'red',size:0.24}`, `opening:true` (needed because `first.damage` is 0), `first:{ kind:'trap', damage:0, range:1.2, rate:1/3, trap:{ spring:14, radius:1.2, reLay:3 } }`, `added:{ trap:true }`, `tiers.rare:{ trapSpring:18, trapRadius:1.3, trapRelay:2.5, asTower:'Road trap: springs at 0.6 — 18 damage over 1.3 cells.', asAdded:'Kills by this tower leave a trap at the kill spot.' }`, `tiers.epic:{ trapSpring:24, trapRadius:1.4, trapRelay:2, asTower:'Road trap: springs at 0.6 — 24 damage over 1.4 cells.', asAdded:'Kills by this tower leave a trap at the kill spot.' }`. `asTower:'Road trap: springs on an enemy within 0.6, 14 damage over 1.2 cells.'` (68 chars ≤70); `asAdded:'Kills by this tower leave a trap at the kill spot.'` (50); tier `asTower` ≤56.

### Steps
1. `content/types.ts`: add the union member, the `FirstForm.trap`/`AddedForm.trap`/`TierValues` fields (each one line, next to the related field, with a short comment).
2. `content/augments/trap.ts`: write the content above; register it in `content/augments/index.ts`.
3. `core/tiers.ts` `tierFirst`: common branch add `trap: f.trap ? { ...f.trap } : undefined`; tier branch add `trap: f.trap ? { ...f.trap, spring: t.trapSpring ?? f.trap.spring, radius: t.trapRadius ?? f.trap.radius, reLay: t.trapRelay ?? f.trap.reLay } : undefined`.
4. `core/augments.ts`: add the 6 fields to `TowerSpec` + `EMPTY`; in `towerSpec` after the base spec add `trapHome: f.kind === 'trap'` and a loop: for each `i`, if `getAugment(augments[i]!.id).id==='trap'`, read `tierFirst(...).trap` → `if (t.spring > spec.trapSpring) { spec.trapSpring=t.spring; spec.trapRadius=t.radius; }`; `if (i===0) spec.trapRelay=t.reLay; else { spec.trapTicks+=1; spec.trapLays=true; }`. In `describeSpec` add `else if (spec.kind==='trap') { line = \`Lays a trap on the road: ${spec.trapSpring} damage when an enemy steps on it\`; }` after the `'burn'` case, and in the appends add `if (spec.trapLays) line += ', and its kills leave traps';`.
5. `systems/attacks/trap.ts`: `export const trap: Attack = () => false;` + register in `ATTACKS`.
6. `systems/TowerSystem.ts`: change the `update` skip line to `if (t.spec.trapHome || (t.spec.damage <= 0 && !t.spec.slow && !t.spec.root && t.spec.gust === 0 && !t.spec.burn && t.spec.bolts === 0 && t.spec.markPct === 0)) continue;`.
7. `systems/TrapSystem.ts`: implement per the API. Constants `TRIGGER_CELLS=0.6`, `KILL_LAY_FADE_SEC=6`, cap 2. Disc = `{x,y,spring,radius,tower,home,image,age,dead}`; image `artScale(scene.add.image(x,y,TRAP_DISC)).setDepth(DEPTH.board+1)`. Home spot = center of the nearest cell in `board.map.path` to the tower. Home re-lay: `let timer=(this.homeTimer.get(t) ?? t.spec.trapRelay)+dt; if(timer>=t.spec.trapRelay){timer=0; if(!this.hasHome(t)) this.layHome(t);} this.homeTimer.set(t,timer);`. Per disc: if `!home` age it, `remove` at 6 s, fade alpha over the last 1 s; if `inRange(d.x,d.y,TRIGGER_CELLS*CELL,enemies.all).length>0` spring. `spring`: `strike` every `inRange(d.x,d.y,d.radius*CELL,all)` with `{damage:d.spring,splash:0,slow:undefined,root:undefined,pierce:0,push:0,mark:undefined,burn:undefined,color:PALETTE.road... use towerColor,d.source}`, `fx.ring(d.x,d.y,d.radius*CELL,PALETTE.road)`, `sfx?.trapSpring()`, `remove(d)`. `onKill`: `if(!tower.spec.trapLays)return;` remove the tower's existing `!home` disc, `addDisc(x,y,tower,false)`. `remove` guards `dead`.
8. `systems/EnemySystem.ts`: add the `traps` field; in `kill()` add `const traps=this.traps(); if(source && traps) traps.onKill(source, e.x, e.y);` after `this.sfx?.kill();`.
9. `entities/towerLook.ts`: add the two `DECORATIONS` entries (face disc `g.fillCircle(0,0,TOWER_BODY*CELL*0.5)` in `PALETTE.redDeep` when `spec.trapHome`; a red tick `fillRing(g,0,0,BODY*1.95,3,a-0.12,a+0.12,PALETTE.red)` per `spec.trapTicks`), after the Push entry.
10. `art/textures.ts` `TRAP_DISC='fx:trapDisc'`; `art/entities.ts` paint a flat red disc (radius `CELL*0.25`) with a `redDeep` rim + soft shadow, in `paintEntityTextures`.
11. `audio/Sfx.ts` `trapSpring(){ this.tone(190,0.12,'square',0.22,90); }` after `gust()`.
12. `scenes/GameScene.ts`: import + `traps!: TrapSystem;`; after the towers wiring add `this.traps=new TrapSystem(this,this.board,this.enemies,this.towers,this.fx,sfx); this.enemies.traps=()=>this.traps;`; in `update` add `this.traps.update(dt);` right after `this.flow.update(dt);`.
13. `debug/runChecks.ts` invariant; `tests/content.test.ts` line 51; `tests/core/trap.test.ts`.

### Pitfalls
- **Content test dps rule**: `tests/core/augments.test.ts` requires every `first.damage>0` augment to have dps in [12,24]. The trap must have `first.damage:0` (spring damage lives in `first.trap.spring`) or it fails — hence the `|| a.first.trap` edit.
- **Card line lengths**: base `asTower` ≤70, tier `asTower`/`asAdded` ≤56 (see `content.test.ts`). Use the exact strings above; do not use the task's 120-char line.
- **Max-2 model**: a tower keeps at most 1 home + 1 kill-lay; `onKill` replaces the existing kill-lay (the "newest kill-lay"), never the home. A spring that kills only lays a kill-lay if the springing tower has `trapLays` (via `source`).
- **Re-entrancy**: `spring`/`onKill` mutate `this.discs` while `update` iterates a copy — always iterate `[...this.discs]` and guard `if (d.dead) continue;` / make `remove` idempotent.
- **No `Math.random`** in gameplay; the spring/trigger are deterministic. dt-driven timers only.
- **Parallel edits**: `content/types.ts`, `core/augments.ts`, `TowerSystem.update`, `EnemySystem.kill`, `runChecks`, `Sfx` are also touched by open tasks — place each line next to related code (not at list ends) and rebase if a same-line conflict appears.
- **Corner (accepted)**: added damage modifiers (Ember/Anchor/Frost/Mark) on a trap-first tower don't apply (TowerSystem skips it); Mint still works (spring passes `source`). Multi-trap towers use the strongest copy's values for both home and kill-lays.

### Tests
- `tests/core/trap.test.ts`: `spec('trap')` → `trapHome:true, trapLays:false, trapSpring:14, trapRadius:1.2, trapRelay:3, trapTicks:0`; rare/epic → `trapSpring` 18/24, `trapRadius` 1.3/1.4, `trapRelay` ~2.5/~2; `spec('bolt','trap')` → `trapHome:false, trapLays:true, trapTicks:1`; `describeSpec(spec('trap'))` matches `/Lays a trap/` and `describeSpec(spec('bolt','trap'))` matches `/kills leave traps/`.
