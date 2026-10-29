---
id: T0133
title: "A new look for the Beam tower: a tower with a circle on top"
size: M
priority: 2
status: todo
depends_on: []
attempts: 1
created: 2026-10-29T10:40:00Z
epic: E4
---

## Goal
The Beam tower's current barrel, a short flat wide head lying on the plinth, reads as a slab and doesn't say "this tower shoots a continuous line". Replace it with a tower that has a circle on top, an orb the beam comes out of, which shows when the beam is on.

## Details
- **Shape (Beam first):** a tower with a circle on top. A short, thick round post rises from the plinth in Beam's own colour, with the darker side face giving it height the way other bodies get thickness. On top sits a large circle (an orb, about 60% of the plinth's width) in Beam's colour, with a white disc in its centre (about 40% of the orb's diameter). No nozzle and no turning barrel: the beam line leaves from the orb's centre toward the target. Chunky, rounded, a soft shadow like the other barrels, no theme.
- **While the beam is on:** the white centre disc pulses (scale 1.0 to 1.15 and back, 0.4 s, ease in-out). When the beam is off it stays still. Respect the game's reduced-motion setting if there is one.
- **Beam added to the tower:** keep one small flat tick per added Beam, now spaced evenly around the orb's outer edge instead of beside the old head.
- **Beam added to other towers:** unchanged (their barrels keep the ticks).
- Remove the old flat head texture and its key; nothing else uses it.
- Check at 412x915 and 1280x720 that the tower reads as different from every other tower's barrel at a glance.

## Acceptance criteria
- [ ] A Beam-first tower shows a post topped by an orb with a white centre disc. The old flat head is gone.
- [ ] The beam line starts at the orb's centre.
- [ ] The center disc pulses only while a beam is on.
- [ ] Added Beams show as ticks around the orb.
- [ ] The smoke screenshots on desktop and mobile show the new Beam tower.

## Design (architect, desktop)

### Files
- edit `src/art/barrels.ts` — remove the flat-head (`beamHead`) texture and its `barrel:beam:` key; add the orb painter, the disc painter, and the orb geometry constants
- edit `src/entities/Tower.ts` — beam towers build the orb + white disc instead of a barrel; `muzzle(0)` is the orb's centre; new `setBeamOn()` pulse
- edit `src/entities/towerLook.ts` — the beam branch of `barrelLook()` drops `beamHead`; comments in `barrelCount()`
- edit `src/systems/BeamSystem.ts` — drives `tower.setBeamOn(...)`, and no longer turns the head (`aimAt`)

### Interfaces
```ts
// src/art/barrels.ts — new exports
export const BEAM_ORB_R = 0.24 * CELL;   // orb radius: ~60% of the plinth's width (2*0.4*CELL)
export const BEAM_ORB_LIFT = 28;         // orb centre above the gun's pivot, board units
export const BEAM_DISC_TEXTURE = 'barrel:beamDisc';
export function orbTexture(scene: Phaser.Scene, color: Bright | undefined, ticks: number): string; // key `barrel:beamOrb:<color>:<ticks>`, ticks 0..3
export function beamDiscTexture(scene: Phaser.Scene): string; // paints BEAM_DISC_TEXTURE, returns the key
// src/entities/Tower.ts — new public method
setBeamOn(on: boolean): void; // while on: disc tweens ART_SCALE -> ART_SCALE*1.15, 400 ms, 'Sine.easeInOut', yoyo, repeat -1; off: kill tween, setScale(ART_SCALE)
```
`BarrelLook` loses the `beamHead?: boolean` field (only barrels.ts and towerLook.ts:48 used it — verified by grep). No reduced-motion setting exists in the codebase (grep: none), so "respect it if there is one" is satisfied by doing nothing.

### Steps
1. `barrels.ts` — delete the `beamHead` field, the `const beamHead` line, and the `beamHead ? … : …` branches in the key and size (keep the plain key/size); update the "beside the head or the barrel" comments to "beside the barrel". Add `paintToken, setShadow` to the `./paint` import. After `barrelTexture` add, exactly:
```ts
const BEAM_DISC_R = 0.4 * BEAM_ORB_R; // the white centre disc, ~40% of the orb's diameter
const BEAM_POST_W = 8;
export function orbTexture(scene: Phaser.Scene, color: Bright | undefined, ticks: number): string {
  const n = Math.max(0, Math.min(3, Math.round(ticks)));
  const key = `barrel:beamOrb:${color ?? 'empty'}:${n}`;
  beamDiscTexture(scene);
  const size = Math.ceil((BEAM_ORB_LIFT + BEAM_ORB_R + 12) * 2);
  paintTexture(scene, key, size, size, (ctx) => {
    const c = size / 2;
    const deep = rgba(color ? deepOf(color) : PALETTE.rockDeep, 1);
    const fill = rgba(color ? PALETTE[color] : PALETTE.faint, 1);
    const top = c - BEAM_ORB_LIFT - 2, h = BEAM_ORB_LIFT + 6; // post: base hidden behind the body, top inside the orb
    ctx.save(); setShadow(ctx);
    roundRectPath(ctx, c - BEAM_POST_W / 2, top + 3, BEAM_POST_W, h, BEAM_POST_W / 2);
    ctx.fillStyle = deep; ctx.fill(); ctx.restore();
    roundRectPath(ctx, c - BEAM_POST_W / 2, top, BEAM_POST_W, h, BEAM_POST_W / 2);
    ctx.fillStyle = fill; ctx.fill();
    paintToken(ctx, 'circle', c, c - BEAM_ORB_LIFT, BEAM_ORB_R, color ? PALETTE[color] : PALETTE.faint, color ? deepOf(color) : PALETTE.rockDeep, { depth: 4 });
    for (let i = 0; i < n; i++) { // one flat tick per Beam added, evenly around the orb's outer edge
      const a = -Math.PI / 2 + (i / n) * Math.PI * 2;
      ctx.save(); ctx.translate(c, c - BEAM_ORB_LIFT); ctx.rotate(a + Math.PI / 2);
      roundRectPath(ctx, -2, -(BEAM_ORB_R + 10), 4, 8, 2);
      ctx.fillStyle = deep; ctx.fill(); ctx.restore();
    }
  });
  return key;
}
export function beamDiscTexture(scene: Phaser.Scene): string {
  const s = Math.ceil((BEAM_DISC_R * 1.2 + 2) * 2);
  paintTexture(scene, BEAM_DISC_TEXTURE, s, s, (ctx) => { shapePath(ctx, 'circle', s / 2, s / 2, BEAM_DISC_R); ctx.fillStyle = '#ffffff'; ctx.fill(); });
  return BEAM_DISC_TEXTURE;
}
```
2. `towerLook.ts` — line 48 becomes `if (spec.kind === 'beam') return { length: 1, width: 1, bulb: false, bands: 0, beamTicks: spec.beamExtras.length };` (comment: "a post with an orb on top, one tick per Beam added"); line 27 comment → "a beam: one orb on a post, the line leaves its centre".
3. `Tower.ts` — extend the barrels import with `BEAM_DISC_TEXTURE, BEAM_ORB_LIFT, beamDiscTexture, orbTexture`; add fields `private disc: Phaser.GameObjects.Image | undefined;` and `private beamOn = false;`. In `buildGun`, right after `this.gun.removeAll(true);` add `if (this.disc) this.scene.tweens.killTweensOf(this.disc); this.disc = undefined; this.beamOn = false;`, and after the `count === 0` return add this branch before `const look = …`:
```ts
if (spec.kind === 'beam') { // never fires: a post with an orb on top, the line leaves the orb's centre
  this.gun.add(artScale(this.scene.add.image(0, 0, orbTexture(this.scene, color, spec.beamExtras.length))));
  this.disc = artScale(this.scene.add.image(0, -BEAM_ORB_LIFT, beamDiscTexture(this.scene)));
  this.barrelLength = 0;
  return;
}
```
In `muzzle()`, first line of the body: `if (this.disc) return { x: this.x, y: this.y - BEAM_ORB_LIFT };`. Add `setBeamOn(on: boolean)` per the interface (guard `if (!this.disc || this.beamOn === on) return;`). In `destroy()`, before `this.gun.destroy()`: `if (this.disc) this.scene.tweens.killTweensOf(this.disc); this.disc = undefined;`.
4. `BeamSystem.ts` — line 39: `if (t.jammed) { t.setBeamOn(false); continue; } // a Mute holds it: no attack, no line`; delete line 54 (`t.aimAt(m.x, m.y)` — the orb does not turn); after `this.held.set(t, now);` add `t.setBeamOn(main !== -1); // the orb's disc pulses only while the beam is on`.

### Pitfalls
- The gun container must NEVER rotate for a beam tower: post and orb have painted shading (side face, shadow) and the art rule forbids rotating such images. The beam branch must not call `setRotation`, and the `aimAt` call is deleted — `muzzle()` is a fixed point.
- `buildGun` runs on every refresh (adding a Beam re-paints with a new tick count): `removeAll(true)` destroys the disc, so kill the pulse tween and reset `disc`/`beamOn` first; BeamSystem re-syncs the pulse on the next frame.
- Kill the disc tween in `destroy()` or a tower sold mid-pulse leaves a tween on a dead object.
- The orb texture size formula (`BEAM_ORB_LIFT + BEAM_ORB_R + 12`, doubled) leaves room for the top tick (orbR+10) and the shadow (offset 4 + blur 10×1.6) — don't shrink the margin or the edge shows as a hard line.
- The disc is flat white with NO shadow (like the body's eye dot and the bolt), and is one shared texture — never one per tower.
- Beam added to other towers is unchanged: don't touch the existing `beamTicks` drawing block in `barrelTexture` or the non-beam `barrelLook` branches.
- The pulse uses Phaser tween time (real seconds), like every other cosmetic tween (kick, drop-in); do not drive it from `dt`.

### Tests
- none (art/look + juice; no rule in src/core changes)

## Attempt 1 released (baby-mama)

The machine was paused for over 60 minutes holding this task, which kept its files locked for the others. Requeued.
