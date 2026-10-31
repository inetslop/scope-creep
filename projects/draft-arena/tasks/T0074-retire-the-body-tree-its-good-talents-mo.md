---
id: T0074
title: "Retire the Body tree: its good talents move into playstyle trees"
size: L
priority: 2
status: design
depends_on: []
attempts: 0
created: 2026-10-31T12:51:01Z
---

## Goal
The owner doesn't want a generic tree of plain stats: every tree is a playstyle, and Body is just "faster, tougher, stronger". Some of its talents are good and should live on where they serve a playstyle.

## Details
- Remove the Body tree (src/content/talents/body.ts and its line in TREES).
- Its eight talents: Swift, Vigor, Might, Magnet (plain stats), Chill (slowing hits), Hide (less damage taken), Chomp (heal on kill), Maw (a bite in front).
- Each one that serves a playstyle moves into the tree whose playstyle it serves (one of the trees that exist when this is designed), as one line in that tree's file, hung where it fits that tree's shape. At most two of them into one tree, and no tree past 10 talents.
- A plain stat talent only moves where its stat is what that tree is about; otherwise it goes.
- An upgrade that ends up in no tree is deleted (its file and its line in UPGRADES): the tests require every upgrade to be in a tree.
- The design says, for each of the eight, where it goes (tree and exact line) or that it is deleted, and why.

## Acceptance criteria
- [ ] There is no Body tab in the talents panel.
- [ ] Every kept talent sits in a playstyle tree, at most two per tree.
- [ ] `npm run check` passes (every upgrade in a tree, every talent reachable).
