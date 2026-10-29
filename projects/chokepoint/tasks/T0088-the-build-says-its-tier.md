---
id: T0088
title: The build says its tier
size: S
priority: 3
status: todo
depends_on: []
attempts: 0
created: 2026-10-29T00:22:08Z
epic: E4
---

## Goal
Rarity is heard where it is spent: the moment an augment lands in a tower, the tier chime says which tier it is — the draft's ear (T0032) extended to the build.

## Details
- The moment an augment is committed to a tower — a new tower's first card, as the drop-in bounce lands, or an added copy filling a free slot — the tier chime (T0032's `tierChime`) plays once at its existing volume: one low note Common, two a third higher Rare, three the highest Epic.
- The chime starts on the commit, at the same instant the drop-in bounce / slot fill happens. It never plays on a failed placement (gold short, no free slot, a cell not beside the road), never on the draft reveal (T0032's reveal chime is untouched), and there is no sell or remove to chime yet.
- No new sound: T0032's chime is reused as-is. No visual change, no input, no new HUD element.
- Closest example: the tier chime (T0032) for the sound and its volume; the build commit in the building system (where the drop-in bounce is triggered) for the timing.

## Acceptance criteria
- [ ] Building a Common tower plays one soft note as it lands; adding a Rare augment to an existing tower plays the two-note chime as the slot fills; an Epic placement plays the three-note chime.
- [ ] An unaffordable or invalid placement plays nothing, and the button's dimmed states are unchanged.
- [ ] The draft reveal chime (T0032) is unchanged; desktop 1280x720 and mobile 412x915 smoke pass.

## Design (architect, desktop)

### Files
- edit `src/systems/TowerSystem.ts` — one line in `place()` (lines 71-77): play T0032's `tierChime` when a copy successfully lands.

### Interfaces
None. Reuses existing `Sfx.tierChime(tier: Tier)` and `AugmentCopy.tier`.

### Steps
1. In `src/systems/TowerSystem.ts`, method `place()`, insert exactly one line after `hook.stats.augmentsPlaced += 1;` (line 73) and before `const color = ...`:
   ```ts
   this.sfx?.tierChime(copy.tier);
   ```
   Method becomes:
   ```ts
   place(tower: Tower, copy: AugmentCopy): true | Refusal {
     if (!tower.addAugment(copy)) return 'full';
     hook.stats.augmentsPlaced += 1;
     this.sfx?.tierChime(copy.tier);
     const color = towerColor(tower.augments);
     this.fx.ring(tower.x, tower.y, CELL * 0.55, color ? PALETTE[color] : PALETTE.faint);
     return true;
   }
   ```
   Nothing else changes. No new files, no Sfx change, no Building change.

### Pitfalls
- Do not add a chime anywhere else: `build()` already plays `sfx.build()` and then calls `place()` — the single insert covers new-tower builds, slot fills, `unlockSlot()`-then-place, and the smoke `autoBuild()`, all at the same instant the Tower's drop-in bounce or the pip pop starts (same tick).
- Failed placements are structurally silent: `build()` returns `'gold'`/`'blocked'` and `place()` returns `'full'` before the sfx line; `Building.tap()`/`hint()` already play `deny()` there — don't touch those.
- Use `this.sfx?.` (optional chain) exactly like the neighbouring `this.sfx?.build()` lines; `sfx` is `Sfx | undefined`.
- Leave `DraftScene.ts:140` (T0032's reveal chime) and `Sfx.tierChime` untouched.
- `TowerSystem.ts` is also listed by open task T0073 — the runner serializes same-file edits; do not touch any other part of the file.

### Tests
none (audio polish, no core rule).
