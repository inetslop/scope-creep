/** Mounts the game's HUD parts (src/hud/) and feeds them a HudView every frame. */
import type { HudPart, HudView, MakeHudPart } from '../api.ts';

export class HudHost {
  private readonly root: HTMLElement;
  private readonly parts: { part: HudPart; failed: boolean; name: string }[];

  constructor(root: HTMLElement, makers: readonly MakeHudPart[]) {
    this.root = root;
    this.parts = makers.map((make) => {
      try {
        return { part: make(root), failed: false, name: make.name };
      } catch (err) {
        console.error(`HUD part ${make.name} failed to build: ${err instanceof Error ? err.message : String(err)}`);
        return { part: { update() {} }, failed: true, name: make.name };
      }
    });
  }

  show(on: boolean): void {
    this.root.hidden = !on;
  }

  update(view: HudView): void {
    for (const p of this.parts) {
      if (p.failed) continue;
      try {
        p.part.update(view);
      } catch (err) {
        p.failed = true;
        console.error(`HUD part ${p.name} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }
}
