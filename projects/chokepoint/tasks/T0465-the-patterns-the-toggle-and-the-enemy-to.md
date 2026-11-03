---
id: T0465
title: "The patterns: the toggle and the enemy tokens' marks"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-11-03T02:48:20Z
epic: E26
---

## Goal
A player who can't trust color can still read the board: a "Patterns" toggle beside the pause screen's Sound row (off by default, remembered) paints a small muted-ink mark on every regular enemy token, the mark's shape distinct per type, so the type reads by shape alone.

## Details
- The toggle: a new row on the pause card in the Sound row's own look (T0035's row: one tap target, the label, On/Off flipped in place), stacked under the Sound row (the card grows one row and still fits at 412x915 and 1280x720); stored on the profile beside `sound`; a fresh profile defaults off; with it off the board is byte-identical to today.
- The marks: with the toggle on, each of the 10 regular tokens wears one small muted-ink mark (the same muted ink the wave card's "held · N" chip uses), roughly a quarter of the token's width, painted on the token's face the way the Hauler's coin is (T0098's painter, the closest example): Dot a bar, Block a dot, Dasher a chevron, Sprinter an X, Splitter two bars, Hauler a triangle, Mute a square, Flyer a diamond, Ward a ring, Bulwark an arc. No two types wear the same mark, and a mark never copies its own token's shape (the Ward's ring in its circle reads as a target).
- Placement: the mark sits where the token's face is clear — the Hauler keeps its gold coin and takes its mark to one side of it, and the Bulwark's plate (the taught front, T0399) stays readable over its mark.
- Not a status chip (removed, T0179/T0192): the mark is the type's constant identity on the token itself, shown only while the toggle is on — never a per-effect mark, and nothing new is painted on the cells (Pillar 9).
- One color for every mark: muted ink. The shape is the information, not a new hue.
- Out of scope for this slice: the bosses, the spawnOnly pieces (the Shard, the Splinter) and the towers keep their plain look; the enemies reference and the codex keep their plain tokens until a later slice.

## Acceptance criteria
- [ ] The pause card has a Patterns row in the Sound row's look; tapping it flips On/Off in place, the choice is remembered between sessions, and a fresh profile defaults off.
- [ ] With the toggle off, the board, the menu demo, the game-over and the claim render exactly as before: no mark on any token.
- [ ] With the toggle on, each of the 10 regular enemy tokens wears its own mark (Dot bar, Block dot, Dasher chevron, Sprinter X, Splitter two bars, Hauler triangle, Mute square, Flyer diamond, Ward ring, Bulwark arc) in muted ink, no two types sharing a mark, and the mark still reads at the zoomed-out limit.
- [ ] With the toggle on, the Hauler's coin and the Bulwark's plate are still visible, and the mark stays visible while its token flashes white (a hit, the Dasher's telegraph).
- [ ] The pause card with the new row fits at 412x915 and 1280x720 with the longest labels.
