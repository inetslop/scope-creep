---
id: T0266
title: "The third boss: wave 30 sends the Orb, and the Orb splits in two at half health"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-30T07:33:51Z
epic: E5
---

## Goal
The run's deepest wave — wave 30, the run's final shape once the level rule (T0260) lands — sends the third boss: the Orb, a big cracked shape that, unless it dies to a single hit first, splits into two faster Shards at half health. E5's promised "one splits at half hp" later boss.

## Details
**The enemies** (two new content files, like the others in src/content/enemies/; both spawnOnly in the Colossus's sense — never in a normal mix, the regular 10-cap untouched):

- **The Orb** (the wave's boss):
  - Description: "The whole wave in one cracked shape: at half health it splits into two Shards that keep walking."
  - Behavior walk, steady on the road. No timed phase — the Colossus's outOfReach is its mechanic; the Orb swaps it for the split.
  - Numbers: hp 720 (the boss 6× Block, wave-scaled like everything), speed 0.9 (Block's), gold 20 (the boss bounty), livesCost 1, threat at the boss level the Colossus's 50 and the Titan's 95 set (≈ its own wave's budget), fromWave 30, size 0.5.
  - Look: a purple hexagon at 0.5 with a thin muted-ink crack line down the middle of its face, painted into its own texture (the Hauler's coin language, T0098) — the standing telegraph that this one splits. No other marks.
  - The split: the moment the Orb's hp first drops to 50% of its max or below after a hit and it is still alive, it splits on the same tick — the Orb is gone with no kill (no gold, no combo, no "stopped" count, no Mint, no by-tower count, no name tag, no leak echo, no Toll), a soft white ring at its spot (T0229's look, 300 ms), and two Shards spawn through the split's own machinery (the Splitter's, core/split.ts) at its exact road position, so the two get the same spacing the Splinters do. Each Shard inherits half of the Orb's hp after the triggering hit (minimum 1 hp each). A single hit that kills the Orb whole — crossing 50% in one hit — is an ordinary boss kill (20 gold, the boss death moment T0258 if it has landed): no Shards.
- **The Shard** (the split's product, the Splinter's pattern T0068 — spawnOnly, no mechanic of its own; it exists to be the piece):
  - Description: "A small, fast piece of a split Orb."
  - Behavior walk. Numbers: hp 180 (a quarter of the Orb's base — the inheritance rule above decides the live value), speed 1.3 (faster than the Orb — the split is a pressure spike), gold 12 (two Shards pay more than the boss bounty they replace), livesCost 1, threat 2, fromWave 30, size 0.2.
  - Look: a purple hexagon at 0.2, no crack. No further split; an ordinary kill. Shards spawn fresh — no slow, root, push, mark or burn carries over from the Orb.

**The wave rule (core/waves.ts):** wave 30's plan is exactly one Orb (delaySec 0), declared the wave's boss by whatever mechanism the boss branch uses today (the plan's declared-boss field if T0256/T0259 have landed), with the every-10 "boss" tag (T0257) — so the preview token row, the preview chip, the banner chip and the one-time teach line all come straight from the plan with no change to those files. Wave 30 is a boss wave, so the quiet/tight treatment never touches it (the boss branch's early return). The second boss (T0259) may land before or after this: add wave 30 as its own case in the boss branch and leave every other wave's plan byte-identical.

**Everything else is automatic:** the name tags say "Orb" on its first spawn in a run and "Shard" on the first split (T0085); an Orb leak and a Shard leak are ordinary 1-life leaks (the warning, the jolt scaled to their size, the combo break, the Toll pay); a Shard kill is an ordinary kill (12 gold, chips, combo, Mint, by-tower count, the last-stand doubling); a wave-30 boss wave held clean counts clean; the save writes at the start of the wave, before spawns, so a mid-fight Orb or Shard is never in a save (a resumed wave 30 re-derives the Orb plan); the enemies reference (T0252) lists the Orb ("wave 30") and the Shard ("from the Orb", the Splinter's "from a Splitter" pattern — the label's parent check must recognize the Orb's split field the way it recognizes splitsInto); the boss card (T0256, if it has landed) shows the Orb's hp while it is alive and hides after the split — the Shard is not the boss — with no phase notch (the Orb has none). No new HUD, no new sound, no new input.

**What it punishes:** the one-big-single-target focus — the moment the Orb splits, two Shards stand where one boss was, 44% faster, and a build tuned to one target has to pick between them. **What it rewards:** the burst — a hit that can carry the Orb from over 50% to zero in one shot (a Reach's heavy shot behind a Mark, a Chain cascade, a Momentum bonus) kills it whole and skips the split. **What counters it:** the area and the line — a Splash burst, a beam corridor, a Spray cone, a Lance line through both Shards — and the Shard's 1.3 is still slower than a Dart, so raw late-wave damage holds.

## Compared with what exists — the Orb
One row for every `walk` enemy; if T0259 has landed by design time, add rows for the Titan (its resistance is carried by its Guard's life — the Orb's split is its own, and it always takes full damage) and the Guard (an escort with a role — the Orb has no escort).

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Dot | `walk` | the steady basic walker; no mechanic at all |
| Dart | `walk` | speed and fragility only; its death ends it |
| Block | `walk`, slow and heavy, the purple family | soaks damage to the end; one shape to the end |
| Sprinter | `walk` | gets faster when hit; never divides |
| Splitter | `walk`, "makes pieces" | its pieces come from its death — two small splinters, the fight continues as it was; the Orb divides mid-life, at half health, while it is still the wave's main threat, into two pieces that keep walking |
| Hauler | `walk`, big and slow | a bigger bank of gold on the road; one shape to the end |
| Mute | `walk` | silences the towers around it — a debuff on the run, not its own survival |
| Ward | `walk`, "do not touch it" | ignores control for its whole life; one shape to the end |
| Bulwark | `walk`, the tough front | halves shots into its face — a direction, not a division |
| Splinter | `walk` | a fast fragment; no mechanic of its own |
| Colossus | `walk`, the boss wave's shape, the purple family | goes out of reach in timed beats — one shape to the end, on a clock; the Orb stays targetable and fully controllable the whole time, and at half health becomes two walking threats instead of one |

## Compared with what exists — the Shard
The Shard's newness is its parent's: the Orb's mid-life split. The Shard itself is a spawnOnly product with no mechanic of its own, exactly as the Splinter is the Splitter's (T0068) — the rows say that plainly instead of inventing a false difference. Add Titan/Guard rows if they have landed (the Shard is a piece of its parent; the Guard is an escort for another enemy's defense).

| Existing | What it shares | What the new one does that it can't |
| --- | --- | --- |
| Dot | `walk` | walks alone; its death is its own |
| Dart | `walk` | speed and fragility only; no parent |
| Block | `walk` | soaks damage; no parent |
| Sprinter | `walk` | ramps when hit; no parent |
| Splitter | `walk` | makes pieces on its own death; the Shard is a piece of a mid-life split, not a killer |
| Hauler | `walk`, the gold on the road | carries a fortune; no parent |
| Mute | `walk` | silences towers; no parent |
| Ward | `walk` | ignores control; no parent |
| Bulwark | `walk` | wears a plate; no parent |
| Splinter | `walk`, the small fast spawnOnly piece of a bigger shape | a piece of a killed walker; the Shard is a piece of a boss that split mid-life — boss scale of threat, boss gold, and its parent is still the wave's main event |
| Colossus | `walk`, the purple family | is the boss itself; the Shard is what the Orb leaves when it divides |

## Acceptance criteria
- [ ] The wave-30 build-phase preview shows exactly one token — the Orb's — plus the every-10 "boss" chip, and nothing else; the wave sends exactly one Orb at 0 s.
- [ ] The Orb is a purple hexagon (size 0.5) with the crack line, walking at 0.9 with wave-30 scaled hp; the first Orb spawn in a run pops its name tag, later spawns do not.
- [ ] The moment the Orb's hp first drops to 50% or below after a hit and it survives: it splits on the same tick — the Orb is gone with no kill (no gold, no combo bump, no "stopped" count, no Mint, no by-tower count, no name tag, no Toll), a soft white ring at its spot, and two Shards at its road position.
- [ ] Each Shard's hp is half the Orb's hp after the triggering hit (minimum 1 each) — pinned by a unit test (e.g. an Orb hit from 60% down to 44% leaves two Shards at 22% each).
- [ ] A single hit that takes the Orb from over 50% to zero is an ordinary boss kill (20 gold, the boss death moment if it has landed) — no Shards.
- [ ] The Shard is a purple hexagon (size 0.2) without the crack, walking at 1.3; a Shard kill pays 12 with the ordinary kill (chips, combo, Mint, by-tower count, the last-stand doubling); the first Shard in a run pops its name tag once.
- [ ] An Orb leak and a Shard leak each cost exactly 1 life with the ordinary leak (warning, size-scaled jolt, combo break, Toll pay); a wave 30 held clean counts clean.
- [ ] The enemies reference lists the Orb ("wave 30") and the Shard ("from the Orb"); the boss card (if it has landed) shows the Orb's hp while it is alive, hides after the split, and wears no phase notch.
- [ ] Wave 30 is the only wave that sends the Orb or a Shard (both stay out of every normal mix); every other wave is byte-identical to today (wave 10 and 40 keep sending the Colossus; wave 20 sends whatever T0259 has landed, or the Colossus).
- [ ] No new HUD, no new sound, no new input.
