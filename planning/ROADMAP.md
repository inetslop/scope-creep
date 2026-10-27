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
- Controls card on the pause screen (next, before any new input): every input listed in the Bauhaus style — WASD / mouse / hold click / Esc / M mute on desktop, sticks and buttons on gamepad, left thumb / right thumb / pause button on touch — and the menu hint matches it
- Weapon SFX timbres: the firing weapons sound like themselves — Point a short high tick, Line a low thud, Arc a sharp snap (T0093, in queue, yoga)
- Platemark: the moment you take a hit, a small red × prints on the paper at your position and fades over 2 s (T0094, in queue, yoga)

## M2 — Variety (consolidated 2026-10-27)
The agents had padded the game: 49 upgrades (35 of them pairs of existing stat bonuses), 18 enemies (11 of them chasers that differed only in numbers, shape or color) and two active abilities with unexplained keys and a bare HUD. All of it was cut by hand; see VISION pillars 6 and 7 and the content bar in the PO prompt. Variety now grows by mechanics, not by count.
- Enemies kept (behavior): Wedge (chase), Dart (weave), Block (charge), Sentry (ranged), Splitter (splits into Splinters), plus the bosses' minions. Next: the Platen — a heavy yellow circle that flattens and slams every 5 s, a 160-unit ink shockwave shoving the player and nearby enemies away (the slam deals no damage); the first enemy that pushes instead of chasing (T0091, in queue, desktop). After it, from IDEAS: Mine, Ring, Hare, Needle, Bracket, Ligature, Wash
- Weapons: Point, Line, Orbit (T0008) ✅, Arc (T0022) ✅, Counterpoint wall-bounce (T0055, in queue, desktop-4070); backlog: Stamp, Plumb, Hatch, Baseline, Fanfare, negative-space bomb
- Upgrades kept (14): Rhythm, Weight, Repetition, Momentum, Mass, Gravity, Vector, Balance, Composition, Contrast (crit), Draft (projectile speed), and the Line, Orbit and Arc weapon cards. Next: upgrades that change play, not numbers: weapon evolutions (Point → Bullet), conditional cards (Full Bleed, Scavenge, Sforzando, Overprint), Kerning (projectile size + knockback)
- Actives: removed 2026-10-27. They may return only as an upgrade card that grants one or as a hero/loadout picked before the run, with the key shown on screen (desktop, gamepad, a touch button) and a designed cooldown element. A UX design task comes first.
- Systems: Crop marks — after 12:00 the arena's safe area shrinks to 70% by 17:00; the cropped margin burns the player for 5 damage/s (T0045) ✅
- Inkwell: firing fills a thin meter under the streak tally; a full meter makes the next volley a burst — 3× projectiles, 2× knockback, a deeper shoot sound and an ink ring (T0090, in queue, desktop)

## M3 — Bosses (started)
- The Frame at 5:00: health bar, charge + wedge ring + radial dart burst, +50% HP per respawn (T0006) ✅
- The Grid — second boss: a 400 HP rotating compass that sweeps two 200×12 ink arms (0.5 s red telegraph, 12 dmg) across the arena; boss content file + pure `gridSweep` timing module (unit-tested), reusing The Frame's boss infrastructure and +50% HP-per-respawn scaling (T0044) ✅
- Boss sting: a deep low hit + music swell on any boss spawn (T0058) ✅
- Boss nameplate intro: the first time each boss spawns, its name is printed in small caps at the top of the page, fading over 2 s (T0064, in queue, desktop)
- Boss warning: 5 s before any boss spawn (Frame or Grid, including respawns) the arena boundary pulses red, "SOMETHING HEAVY APPROACHES" flashes in the HUD, and a low thud plays (T0070, in queue, desktop)
- Later: boss music (64 BPM low pulse + dissonant second voice while a boss is alive), boss corpse decals, The Palette — third boss (five sliding color bars, same pattern: content data file + pure timing module + unit tests), The Press — fourth boss (descending ink wall from the top of the page, see IDEAS)

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
- Arc chain tests: the bolt targets the first enemy within 260 u of the aim, each hop jumps to the nearest un-hit enemy within the chain radius, and the chain ends at a dead end — shipped with T0022 in `tests/core/arc.test.ts`; T0085 was rejected because the tests already existed and per-hop damage falloff is not in the code ✅
- Music tempo-curve tests: 80 BPM at 0:00, non-decreasing through the ramp, 120 BPM at 10:00, second voice at 100 BPM — all of it already shipped with T0011 except the 15:00 clamp pin; T0092 was rejected (the file already existed), replaced by the one-line pin (T0095, in queue, yoga)

## Later
- Alternate "paper" palettes (De Stijl, Constructivist), run modifiers, daily seed, achievements, PWA install
- Arena hazards, "overtime" after 15 minutes, run summary screen
- The Frame's corpse decal, mobile aim snap, pause-screen bestiary
