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
- Screen shake on heavy deaths: the camera jolts when a Block, an elite, or a boss dies (T0040, in queue, desktop-4070)
- Boss sting: a deep low hit + music swell the moment any boss spawns (T0058) ✅
- Card-flip level-ups: the three choices flip in like cards, 150 ms apart, with a flip SFX; input locked until the deal finishes (T0059) ✅
- Crescendo: while the kill streak is 8 or higher, fire rate +10% and the streak tally turns red (T0065) ✅

## M2 — Variety (in progress)
- Enemies: Hex (T0001) ✅, Mote swarm (T0010) ✅, Sentry ranged (T0007) ✅, Splitter (T0009) ✅, Boulder heavy chaser (T0017) ✅, Tile mid chaser (T0023) ✅, Slab slow wall (T0025) ✅, Spike small fast punisher (T0028) ✅, Turret stationary fast shooter (T0032) ✅, Pinwheel spinning chaser (T0039) ✅, The Eraser upgrade-deleting white rectangle (T0047) ✅, Counterweight heavy shooter (T0082, in queue, yoga), Tube splitting bar — first regular rect silhouette (T0083, in queue, yoga)
- Enemy projectiles now exist (Sentry) — boss dart-burst patterns unblocked
- Weapons: Orbit (T0008) ✅, Arc chain beam (T0022) ✅, Counterpoint wall-bounce (T0055, in queue, desktop-4070); backlog: stamp, plumb line, negative-space bomb
- Upgrades: Tempo (T0002) ✅, Draft (T0012) ✅, Contrast crit (T0013) ✅, Plate armor (T0016) ✅, Staccato speed combo (T0018) ✅, Emphasis damage ramp (T0020) ✅, Allegro fire-rate-for-speed trade-off (T0026) ✅, Ostinato pierce + fire-rate build card (T0029) ✅, Dynamics damage-for-mobility trade-off (T0031) ✅, Fugue damage + projectile-speed combo (T0033) ✅, Pressure damage + fire-rate DPS build (T0034) ✅, Gather pickup-radius + shard-XP economy build (T0035) ✅, Accent crit + damage build (T0037) ✅, Presto projectile-speed + move-speed build (T0038) ✅, Pulse fire-rate + crit crit-shred build (T0041) ✅, Sweep move-speed + pickup-radius mobility build (T0042) ✅, Trill rare repeat-fire build (T0046) ✅, Tessitura max-HP survival ramp (T0048) ✅, Glissando shard-XP + fire-rate economy-DPS build (T0051) ✅, Adagio max-HP + regen sustain build (T0052) ✅, Pizzicato fast-pierce build (T0056) ✅, Pedal armor + regen tortoise build (T0060) ✅, Impasto rare heavy-volley card (T0062) ✅, Vivace rare fast-swarm card (T0067) ✅, Arpeggio rare crit-projectile card (T0069) ✅, Legato fast-hands speed card (T0072) ✅, Tenuto armored-hammer card (T0073) ✅, Sotto Voce shard-XP + regen sustain-economy card (T0074) ✅, Vellum armor + shard-XP tank-collector card (T0076) ✅, Stretto armor + fire-rate armored-tempos card (T0077) ✅, Marcato crit-chance + projectile-speed precision-velocity card (T0078) ✅, Andante regen + move-speed walking-sustain card (T0079) ✅, Gravure pierce + damage rare card (T0080) ✅, Incision pierce + crit precision-pierce card (T0081, in progress, yoga); backlog: weapon-specific lines, evolutions, Kerning (projectile size + knockback), Full Bleed (damage at full HP), Scavenge (double shard XP below 25% HP)
- Actives: Understudy decoy — drop a blue decoy that taunts enemies for 3 s, 8 s cooldown (T0015) ✅; Still Life — a 5 s bubble that slows nearby enemies to 50% speed, 12 s cooldown (T0050) ✅; backlog: Trio — a third active, three slow ink lines in a fan, 10 s cooldown (reuses the active system)
- Systems: Crop marks — after 12:00 the arena's safe area shrinks to 70% by 17:00; the cropped margin burns the player for 5 damage/s (T0045) ✅

## M3 — Bosses (started)
- The Frame at 5:00: health bar, charge + wedge ring + radial dart burst, +50% HP per respawn (T0006) ✅
- The Grid — second boss: a 400 HP rotating compass that sweeps two 200×12 ink arms (0.5 s red telegraph, 12 dmg) across the arena; boss content file + pure `gridSweep` timing module (unit-tested), reusing The Frame's boss infrastructure and +50% HP-per-respawn scaling (T0044) ✅
- Boss sting: a deep low hit + music swell on any boss spawn (T0058) ✅
- Boss nameplate intro: the first time each boss spawns, its name is printed in small caps at the top of the page, fading over 2 s (T0064, in queue, desktop)
- Boss warning: 5 s before any boss spawn (Frame or Grid, including respawns) the arena boundary pulses red, "SOMETHING HEAVY APPROACHES" flashes in the HUD, and a low thud plays (T0070, in queue, desktop)
- Later: boss music (64 BPM low pulse + dissonant second voice while a boss is alive), boss corpse decals, The Palette — third boss (five sliding color bars, same pattern: content data file + pure timing module + unit tests)

## M4 — Meta-progression
- Score: kills earn points (normal 1, elite 5, boss 50); HUD shows the running score, game over shows score + persisted best (T0054, in queue, desktop-4070)
- Kill feed: each kill pops a small ink "+1" / "+5" / "+50" above the corpse, matching the score values (next, after T0054)
- Persistent currency between runs, a studio to unlock starting options
- Settings: volume, screen shake, auto-fire

## Quality
- Seeded RNG determinism tests (T0021) ✅
- Crit chance clamp tests (T0024) ✅
- Spawn unlock timing tests: every enemy absent before its unlockAtSec, present at/after (T0030) ✅
- Upgrade roll tests: a maxed upgrade is never offered; a roll returns 3 distinct choices (T0036) ✅
- Vector math tests: length, normalize, add, scale, distance (T0043) ✅
- Level-up XP curve tests: required XP strictly increasing, exact-XP boundary, finite at level 100 (T0049) ✅
- Stat stacking tests: same-stat upgrades combine consistently (damage, fire rate), untouched stats stay at base (T0053) ✅
- Kill-streak tests: streak grows per kill, resets when hit, bestStreak keeps the longest run (T0057) ✅
- Boss alternation tests: first boss is The Frame, bosses strictly alternate Frame/Grid, deterministic (T0061) ✅
- Crop schedule tests: no shrink before 12:00, 1.0→0.7 by 17:00, clamped at 0.7 after, non-increasing through the window (T0063) ✅
- Elite schedule tests: first elite at 0:45, then exactly one every 45 s, none in between (T0066) ✅
- Eraser removal tests: the most recently picked upgrade level is removed, the first-picked survives, no-op on an empty run (T0068) ✅
- Still Life bubble tests: 5 s duration, 12 s cooldown, restart rejected during the cooldown, fresh run can start immediately (T0075, in queue, yoga)
- Understudy decoy tests: 3 s active duration, 8 s cooldown, drop rejected during cooldown, fresh run can drop immediately (shipped with T0015) ✅

## Later
- Alternate "paper" palettes (De Stijl, Constructivist), run modifiers, daily seed, achievements, PWA install
- Arena hazards, "overtime" after 15 minutes, run summary screen
- The Frame's corpse decal, mobile aim snap, pause-screen bestiary
