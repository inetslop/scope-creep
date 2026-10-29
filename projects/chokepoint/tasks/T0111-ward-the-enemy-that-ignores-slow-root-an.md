---
id: T0111
title: "Ward: the enemy that ignores slow, root and push"
size: M
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-29T08:18:07Z
---

## Goal
The enemy queue's next entry (the Bulwark, T0102, is up to land first): a plain slow walker that completely ignores slow, root and push — the first enemy that punishes a control build, so a Frost/Anchor/Push choke needs a real damage line to hold the run.

## Details
- Closest existing enemy: Block (a plain slow walker). What is new: control immunity — it survives by making the board's whole control family useless (Frost's slow, Anchor's root, Push's gusts all pass through it), so a control-heavy build must pair it with damage (Bolt, Splash, Ember, Chain, Beam, Pulse) to stop it. No existing enemy ignores control: the Mute disables towers, the Sprinter speeds up when hit, the Dasher bursts — but nothing shrugs off slow, root or push.
- Look: Block's round — a circle at Block's size — in red (a repeated family color: the warm palette is closed, T0074's lesson), with one thin dark ring around its edge in the token's darker side-face red (armor — still, not pulsing), the usual darker side face and soft shadow. The still ring carries the "immune" meaning, and it is the silhouette no other enemy has.
- Movement: Block's speed, walks (no behavior besides the immunity).
- Survivability: 1.5× Block's hp; wave escalation applies as usual. Threat 1 (Block's). Gold: the normal Block bounty. Leak: 1 life, as usual.
- Immunity rule: while a Ward is on the board, Frost's slow (first and added forms), Anchor's root (the timed full stop, first and added) and Push's gusts and per-hit pushes all pass through it with no effect — it does not slow, stop, stagger or move back (the gust and the Push windup fire normally, they just don't move it). Damage from every source — directed shots, pulse rings, trap springs, the beam, burn ticks — is full and unaffected by the immunity.
- Waves: from wave 15, one Ward on waves 15, 20, 25, 30, … — reserved in the wave plan and kept out of the budget picks (the Hauler/Mute/Bulwark pattern). The wave-20 slot yields to the boss when E5 opens.
- Its death is an ordinary kill: gold, combo, Mint, the kills line and the "stopped" count all fire normally. The name tag (T0085) announces "Ward" on its first spawn; the wave preview, icon and sounds pick it up the way the Hauler's did (T0057).
- It lives in its own content file (the Mute's own-files pattern, T0074 / the Bulwark's, T0102), so it lands beside the shared-augment queue and beside the in-progress Beam (T0073).

## Acceptance criteria
- [ ] From wave 15 on, waves 15, 20, 25, … each contain exactly one Ward (reserved in the plan, not added by the budget picks); waves 1–14 are byte-identical to today.
- [ ] A Frost tower's slow, an Anchor's root and a Push's gust have no effect on a Ward: it walks at Block's speed through a slowed, rooted and pushed group, never stops, and is not moved back.
- [ ] A Ward takes full damage from every source (directed shots, pulse rings, trap springs, the beam, burn ticks) — the immunity reduces nothing.
- [ ] The token is a red circle at Block's size with one thin dark ring around its edge (the armor), the darker side face and soft shadow; the ring is still (not pulsing).
- [ ] A Ward leak costs 1 life like any enemy's; its kill pays the normal gold with the normal pop, and the kills line counts it.
- [ ] The first spawn shows the "Ward" name chip (T0085); the wave preview shows its token and count.
