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
- Elite enemies: marked, tougher, high-value variants every 45 s (T0005) ✅
- Generative background music: a slow pulse that speeds up as the run goes on (T0011) ✅
- Kill-streak tally in the HUD: consecutive kills without being hit, "RHYTHM" flash at 8, best streak on game over (T0014) ✅
- Marginalia: first-encounter annotations — a small dry ink note fades in beside a new enemy type for 2 s (T0027) ✅
- Crit sting: higher-pitched hit sound + small ink ring when a crit lands (T0019) ✅
- Screen shake on heavy deaths: the camera jolts when a Block, an elite, or a boss dies (T0040, todo, desktop)
- Next: boss sting (low hit + music swell on The Frame spawn), card-flip level-ups

## M2 — Variety (in progress)
- Enemies: Hex (T0001) ✅, Mote swarm (T0010) ✅, Sentry ranged (T0007) ✅, Splitter (T0009) ✅, Boulder heavy chaser (T0017) ✅, Tile mid chaser (T0023) ✅, Slab slow wall (T0025) ✅, Spike small fast punisher (T0028) ✅, Turret stationary fast shooter (T0032) ✅, Pinwheel spinning chaser (T0039) ✅, The Eraser upgrade-deleting white rectangle (T0047, todo, desktop-4070)
- Enemy projectiles now exist (Sentry) — boss dart-burst patterns unblocked
- Weapons: Orbit (T0008) ✅, Arc chain beam (T0022) ✅; backlog: stamp, counterpoint, negative-space bomb
- Upgrades: Tempo (T0002) ✅, Draft (T0012) ✅, Contrast crit (T0013) ✅, Plate armor (T0016) ✅, Staccato speed combo (T0018) ✅, Emphasis damage ramp (T0020) ✅, Allegro fire-rate-for-speed trade-off (T0026) ✅, Ostinato pierce + fire-rate build card (T0029) ✅, Dynamics damage-for-mobility trade-off (T0031) ✅, Fugue damage + projectile-speed combo (T0033) ✅, Pressure damage + fire-rate DPS build (T0034) ✅, Gather pickup-radius + shard-XP economy build (T0035) ✅, Accent crit + damage build (T0037) ✅, Presto projectile-speed + move-speed build (T0038) ✅, Pulse fire-rate + crit crit-shred build (T0041) ✅, Sweep move-speed + pickup-radius mobility build (T0042) ✅, Trill rare repeat-fire build (T0046) ✅, Tessitura max-HP survival ramp (T0048) ✅, Glissando shard-XP + fire-rate economy-DPS build (T0051, design, yoga), Adagio max-HP + regen sustain build (T0052, design, yoga); backlog: weapon-specific lines, evolutions, Kerning (projectile size + knockback)
- Actives: Understudy decoy — drop a blue decoy that taunts enemies for 3 s, 8 s cooldown (T0015) ✅; Still Life — a 5 s bubble that slows nearby enemies to 50% speed, 12 s cooldown (T0050, design, desktop)
- Systems: Crop marks — after 12:00 the arena's safe area shrinks to 70% by 17:00; the cropped margin burns the player for 5 damage/s (T0045, todo, desktop-4070)

## M3 — Bosses (started)
- The Frame at 5:00: health bar, charge + wedge ring + radial dart burst, +50% HP per respawn (T0006) ✅
- The Grid — second boss: a rotating compass that sweeps damaging ink arms across the arena (T0044, in progress, desktop-4070)
- Later: boss sting (low hit + music swell on spawn), a third boss

## M4 — Meta-progression
- Persistent currency between runs, a studio to unlock starting options
- Settings: volume, screen shake, auto-fire

## Quality
- Seeded RNG determinism tests (T0021) ✅
- Crit chance clamp tests (T0024) ✅
- Spawn unlock timing tests: every enemy absent before its unlockAtSec, present at/after (T0030) ✅
- Upgrade roll tests: a maxed upgrade is never offered; a roll returns 3 distinct choices (T0036) ✅
- Vector math tests: length, normalize, add, scale, distance (T0043) ✅
- Level-up XP curve tests: required XP strictly increasing, exact-XP boundary, finite at level 100 (T0049) ✅
- Stat stacking tests: same-stat upgrades combine consistently (damage, fire rate), untouched stats stay at base (T0053, design, yoga)

## Later
- Alternate "paper" palettes (De Stijl, Constructivist), run modifiers, daily seed, achievements, PWA install
- Arena hazards, "overtime" after 15 minutes, run summary screen
- The Frame's corpse decal, card-flip level-ups, mobile aim snap, pause-screen bestiary
