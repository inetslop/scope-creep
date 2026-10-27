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
- Screen shake on heavy deaths: the camera jolts when a Block, an elite, or a boss dies (T0040) ✅
- Boss sting: a deep low hit + music swell the moment any boss spawns (T0058) ✅
- Card-flip level-ups: the three choices flip in like cards, 150 ms apart, with a flip SFX; input locked until the deal finishes (T0059) ✅
- Crescendo: while the kill streak is 8 or higher, fire rate +10% and the streak tally turns red (T0065) ✅
- The Index: the pause screen lists every upgrade picked this run in a narrow ink column — one line per upgrade, pips in the card color, newest pick first, at most 16 lines, "NOTHING PICKED YET" while empty (T0104) ✅
- Controls card on the pause screen (T0123, inet-racing; next, before any new input): every input listed in the Bauhaus style — WASD / mouse / hold click / Esc / M mute on desktop, sticks and buttons on gamepad, left thumb / right thumb / pause button on touch — and the menu hint matches it
- Weapon SFX timbres: the firing weapons sound like themselves — Point a short high tick, Line a low thud, Arc a sharp snap (T0093) ✅
- Orbit hum: each Orbit contact plays a soft low hum — the deferred half of T0093, so all four weapons are audible (T0107, waiting on T0098 — in progress, asus)
- Platemark: the moment you take a hit, a small red × prints on the paper at your position and fades over 2 s (T0094) ✅
- The Underdrawing: after 8:00, ~1.5 s before a normal enemy spawns, a faint grey pencil outline of its shape is sketched at the spawn point and fades as it lands — the late-run swarm stays legible (T0100, in queue, asus)
- Streak break: the moment your kill streak resets (it was ≥1), the streak tally shatters — 4–6 flat ink specks scatter for 20–40 u and fade over 400 ms, plus one throttled low blip — you see and hear the Crescendo bonus go (T0101) ✅
- Level-up pulse: the moment a level-up card is picked, your circle swells 25% larger for 300 ms — the level-up is felt in your own shape (T0102) ✅
- Gutter slap: the moment a gutter band enters the page, a soft paper slap plays — a short filtered noise, no new tone (T0109, waiting on T0107)
- Platen dust: the Platen's slam (T0091) kicks up three small paper-dust puffs at the impact point (T0110) ✅
- Hare kick: the moment the Hare quickens to a new speed step, a small ink puff pops behind it — the quicken is visible, not just felt (T0113, in progress, yoga)

## M2 — Variety (consolidated 2026-10-27)
The agents had padded the game: 49 upgrades (35 of them pairs of existing stat bonuses), 18 enemies (11 of them chasers that differed only in numbers, shape or color) and two active abilities with unexplained keys and a bare HUD. All of it was cut by hand; see VISION pillars 6 and 7 and the content bar in the PO prompt. Variety now grows by mechanics, not by count.
- Enemies kept (behavior): Wedge (chase), Dart (weave), Block (charge), Sentry (ranged), Splitter (splits into Splinters), plus the bosses' minions. Platen — a heavy yellow circle that flattens and slams every 5 s, a 160-unit ink shockwave shoving the player and nearby enemies away (the slam deals no damage); the first enemy that pushes instead of chasing (T0091) ✅. The Hare — a small green circle that chases at 40 u/s and quickens to 52 / 67.6 / 87.9 as it loses each quarter of its max HP, so the kill you are chasing gets faster (T0103) ✅. The Wash — a pale blue circle (35 hp, 55 u/s, chase) that drops a 120-unit pale blue puddle every 2.0 s; each puddle lasts 2.0 s and slows the player 20% while inside; the first enemy to leave a persistent effect on the arena (T0111, in queue, desktop). After it, from IDEAS: The Retouch (healer), Type block (first falling enemy), Mine, Ring, Needle, Bracket, Ligature. Long-bar enemies (Tube 120×16, The Rail 160×12) wait on the shape-aspect change (T0098, in progress, asus). Pool: 9/10 now (the Hare landed), 10/10 (at the cap) once the Wash lands — the next enemy must remove or merge an existing one.
- Weapons: Point, Line, Orbit (T0008) ✅, Arc (T0022) ✅, Counterpoint wall-bounce (T0055) ✅, The Plumb — a thin ink line hangs from the top of the page at your aim's X and re-aims instantly; 12 damage per 0.5 s per enemy to anything that crosses it (a small 60-unit horizontal shove) and it eats the enemy bullets that touch it (T0119, in queue, desktop-4070); backlog: Stamp, Hatch, Baseline, Fanfare, negative-space bomb (each is a new level-up card — see the pool note under upgrades)
- Upgrades (16, at the cap): Rhythm, Weight, Repetition, Mass, Gravity, Vector, Balance, Composition, Contrast (crit), Draft (projectile speed), the Line, Orbit, Arc and Counterpoint (T0055) ✅ weapon cards, the Plumb weapon card (T0119, in queue — in for Momentum, which it retires) and the first conditional card, Underexposure (T0105) ✅ — any shape below 50% of its max HP takes double damage from you, measured on the HP before the hit; the threshold widens to 75% at level 2; it applies to elites and bosses and composes ×4 with crits, so the wounded shapes are the kill you end fastest. Next: more conditionals (Full Bleed, Scavenge, Sforzando, Overprint, Margin), weapon evolutions (Point → Bullet), Kerning (projectile size + knockback). Pool: 16/16 (at the cap) — the next new card must remove or merge an existing one in the same task; T0119 retires Momentum (the +12% move-speed card), so after it lands the next candidate is Draft (the +25% projectile-speed card, the most situational of the remaining stat cards)
- Actives: removed 2026-10-27. They may return only as an upgrade card that grants one or as a hero/loadout picked before the run, with the key shown on screen (desktop, gamepad, a touch button) and a designed cooldown element. A UX design task comes first.
- Systems: Crop marks — after 12:00 the arena's safe area shrinks to 70% by 17:00; the cropped margin burns the player for 5 damage/s (T0045) ✅
- Inkwell: firing fills a thin meter under the streak tally; a full meter makes the next volley a burst — 3× projectiles, 2× knockback, a deeper shoot sound and an ink ring (T0090) ✅
- Heavy burst: while any projectile of the last Inkwell burst is still on screen, your volley hits on bosses and elites deal +50% damage — saving the meter for the fight becomes a real decision (T0120, in queue, desktop-4070; the boss-stun half is held until after The Press (T0116) lands)
- Gutter: the first arena hazard — after 14:00 a 40-unit-wide ink band sweeps the crop-safe area horizontally every 20 s (4.0 s to cross, direction alternating); a thin red rule telegraphs it for 1.5 s; standing inside burns 4 damage/s (T0099) ✅
- Gilt shards: 5% of all dropped shards are gilt — same shape, size and motion as a normal shard with a 2 u yellow outline and a small yellow center dot — and worth 3× XP; the shard economy gets a small gamble (T0112) ✅
- Shard glint: the moment a gilt shard is picked up, the pickup pluck plays one semitone higher and the XP actually granted prints as a small yellow "+N" pop at the pickup point — gilt is legible in the hand, not just on the page (T0117, in queue, yoga)

## M3 — Bosses (started)
- The Frame at 5:00: health bar, charge + wedge ring + radial dart burst, +50% HP per respawn (T0006) ✅
- The Grid — second boss: a 400 HP rotating compass that sweeps two 200×12 ink arms (0.5 s red telegraph, 12 dmg) across the arena; boss content file + pure `gridSweep` timing module (unit-tested), reusing The Frame's boss infrastructure and +50% HP-per-respawn scaling (T0044) ✅
- The Palette — third boss: five color swatches (red, orange, yellow, green, blue) fall down the page one at a time, 90 HP each, 6.0 s to fall, ≥120 units apart; each swatch you dodge paints a 2 u ring stripe on the player; rotation becomes Frame → Grid → Palette, extended to four bosses by T0116 (T0097) ✅
- Spectrum: for 8 s after The Palette dies, volleys print in the five swatch colors — red, orange, yellow, green, blue, one per projectile, wrapping — and a small-caps "SPECTRUM" note flashes in the HUD at the death; the boss's palette leaks into your fire (T0121, in queue, cachyos-x8664)
- Boss shatter: the moment any boss dies, every enemy projectile on screen bursts into one normal shard at its position with a small flat ink ring — a boss kill is a breather and a payday (T0122, in queue, cachyos-x8664)
- The Press — the fourth boss: a printing press at the top of the page pushes a solid 70 u wall of ink down the page (1/150 of the safe height per second, plus a 1/20 stamp jump every 5 s behind a 1.0 s red-rule telegraph); you shoot the wall to damage the 520 HP boss, and each row of 4 type blocks (30 HP each) you clear pulls the wall back 1/16 of the safe height — the arena closes in around the fight (T0116, in queue, asus)
- Boss sting: a deep low hit + music swell on any boss spawn (T0058) ✅
- Boss nameplate intro: the first time each boss spawns, its name (from the boss content def, so The Palette gets it for free) is printed in small caps centered below the boss bar, fading over 2 s and freezing under overlays (T0064) ✅
- Boss tick: the boss health bar prints a small flat ink tick (2 u wide, ~6 u tall) at the 25/50/75% points as the boss first drops below each threshold, and the tick stays for that boss's life — a fresh spawn starts with a clean bar; how much of the fight is left is visible without counting (T0118, in queue, yoga)
- Boss warning: 5 s before any boss spawn (Frame or Grid, including respawns) the arena boundary pulses red, "SOMETHING HEAVY APPROACHES" flashes in the HUD, and a low thud plays (T0070) ✅
- Boss music: while a boss is alive the score holds at a slow 64 BPM low pulse with a dissonant second voice (a semitone above the pulse, on alternating beats); it glides down over 1.5 s at the boss spawn event and back to the run tempo over 1.5 s on the boss's death (T0108) ✅
- Tempo change: the run tempo becomes `min(120, base curve + 2 × picks)` — every upgrade picked nudges the score +2 BPM, so a fast-building run reaches the 120 BPM clamp well before the 10:00 ramp; the nudge is suspended during the boss hold (T0108) and restored on boss death (T0115, in design, desktop)
- Later: boss corpse decals, The Grid's second voice (below 50% HP: third arm, 25% faster spin — the fight changes shape at the midpoint)

## M4 — Meta-progression
- Score: kills earn points (normal 1, elite 5, boss 50); HUD shows the running score, game over shows score + persisted best (T0054) ✅
- Kill feed: each kill pops a small ink "+1" / "+5" / "+50" above the corpse, matching the score values — "+1" small, "+5" larger and bolder, "+50" largest with a small ink ring at the boss corpse; pooled (~32 texts), ~0.6 s rise-and-fade like the damage numbers (T0106) ✅
- Warm Start: after any run of 8:00+, the next run starts with 1 random upgrade level already applied — the first concrete step of the studio meta-progression (T0114, in progress, desktop-4070)
- Proof press: after any run of 10:00+ the menu lists a second pre-run pick — a starting weapon (Point, Line or Orbit) for the next run, applied at run start through the normal pick path so it shows in The Index (next, after Warm Start lands; see IDEAS)
- Persistent currency between runs, a studio to unlock starting options
- Settings: volume, screen shake, auto-fire

## Quality
- Seeded RNG determinism tests (T0021) ✅
- Crit chance clamp tests (T0024) ✅
- Spawn unlock timing tests: every enemy absent before its unlockAtSec, present at/after (T0030) ✅
- Upgrade roll tests: a maxed upgrade is never offered; a roll returns 3 distinct choices (T0036) ✅
- Vector math tests: length, normalize, add, scale, distance (T0043) ✅
- Shape-geometry tests: polygon corner order, on-circle radii, star tip/valley alternation, and all eight ShapeKind outlines (square-vs-diamond and the exact 2:1 rect) — a geometry change can no longer silently turn a square into a diamond (T0096) ✅
- Level-up XP curve tests: required XP strictly increasing, exact-XP boundary, finite at level 100 (T0049) ✅
- Stat stacking tests: same-stat upgrades combine consistently (damage, fire rate), untouched stats stay at base (T0053) ✅
- Kill-streak tests: streak grows per kill, resets when hit, bestStreak keeps the longest run (T0057) ✅
- Boss alternation tests: first boss is The Frame, bosses strictly alternate Frame/Grid, deterministic (T0061) ✅ — the rotation becomes Frame → Grid → Palette with T0097; that test is updated in the same task
- Crop schedule tests: no shrink before 12:00, 1.0→0.7 by 17:00, clamped at 0.7 after, non-increasing through the window (T0063) ✅
- Elite schedule tests: first elite at 0:45, then exactly one every 45 s, none in between (T0066) ✅
- Arc chain tests: the bolt targets the first enemy within 260 u of the aim, each hop jumps to the nearest un-hit enemy within the chain radius, and the chain ends at a dead end — shipped with T0022 in `tests/core/arc.test.ts`; T0085 was rejected because the tests already existed and per-hop damage falloff is not in the code ✅
- Music tempo-curve tests: 80 BPM at 0:00, non-decreasing through the ramp, 120 BPM at 10:00, second voice at 100 BPM — all of it already shipped with T0011 except the 15:00 clamp pin; T0092 was rejected (the file already existed), replaced by the one-line pin (T0095) ✅

## Later
- Alternate "paper" palettes (De Stijl, Constructivist), run modifiers, daily seed, achievements, PWA install
- More arena hazards (the Gutter is the first — see M2), "overtime" after 15 minutes, run summary screen
- The Frame's corpse decal, mobile aim snap, pause-screen bestiary
