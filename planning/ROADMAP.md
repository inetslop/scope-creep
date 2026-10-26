# Roadmap

The PO keeps this file current. Milestones are loose; scope creep is expected.

## M0 — Baseline ✅
- Playable loop: move, aim, shoot, enemies, shards, level-ups, game over, restart
- Twin-stick controls for keyboard+mouse, touch and gamepad
- 3 enemies, 2 weapons, 10 upgrades, procedural Bauhaus art
- Smoke-tested on desktop and mobile on every change

## M1 — Feel (in progress)
- Procedural sound effects ✅ (T0003)
- Floating damage numbers ✅ (T0004)
- Elite enemies: marked, tougher, high-value variants every 45 s (T0005, in progress)
- Generative background music: a slow pulse that speeds up as the run goes on (T0011) ✅
- Kill-streak tally in the HUD: consecutive kills without being hit, "RHYTHM" flash at 8, best streak on game over (T0014, todo)
- Marginalia: first-encounter annotations — a small dry ink note fades in beside a new enemy type for 2 s (T0027, todo, desktop)
- Crit sting: higher-pitched hit sound + small ink ring when a crit lands (T0019) ✅
- Next: screen shake on heavy deaths (wait for T0006 to land so the boss shares the same shake)

## M2 — Variety (in progress)
- Enemies: Hex (T0001) ✅, Mote swarm (T0010) ✅, Sentry ranged (T0007) ✅, Splitter (T0009) ✅, Boulder heavy chaser (T0017) ✅, Tile mid chaser (T0023) ✅, Slab slow wall (T0025) ✅, Spike small fast punisher (T0028, todo, yoga)
- Enemy projectiles now exist (Sentry) — boss dart-burst patterns unblocked
- Weapons: Orbit (T0008) ✅, Arc chain beam (T0022) ✅; backlog: stamp, counterpoint, negative-space bomb
- Upgrades: Tempo (T0002) ✅, Draft (T0012) ✅, Contrast crit (T0013) ✅, Plate armor (T0016) ✅, Staccato speed combo (T0018) ✅, Emphasis damage ramp (T0020) ✅, Allegro fire-rate-for-speed trade-off (T0026) ✅, Ostinato pierce + fire-rate build card (T0029, todo, yoga); backlog: weapon-specific lines, evolutions, Kerning (projectile size + knockback)
- Actives: Understudy decoy — drop a blue decoy that taunts enemies for 3 s, 8 s cooldown (T0015, todo, asus)

## M3 — Bosses (started)
- The Frame at 5:00: health bar, charge + wedge ring + radial dart burst, +50% HP per respawn (T0006, todo, after T0005)
- Later: second boss "The Grid" (rotating compass, sweeping ink arms), boss sting (low hit + music swell on spawn)

## M4 — Meta-progression
- Persistent currency between runs, a studio to unlock starting options
- Settings: volume, screen shake, auto-fire

## Quality
- Seeded RNG determinism tests (T0021) ✅
- Crit chance clamp tests (T0024, todo, yoga)
- Spawn unlock timing tests: every enemy absent before its unlockAtSec, present at/after (T0030, todo, yoga)

## Later
- Alternate "paper" palettes (De Stijl, Constructivist), run modifiers, daily seed, achievements, PWA install
- Arena hazards, "overtime" after 15 minutes, run summary screen
- The Frame's corpse decal, card-flip level-ups, mobile aim snap, pause-screen bestiary
