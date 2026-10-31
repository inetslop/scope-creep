/**
 * The start screen: your name, the game's own panels (src/menu/: what you wear, the shop...) and
 * Play. The match always has at least rules.bots.fillTo players: bots fill the rest.
 */
import { drawPlayerCritter, type MakeMenuPart, type MenuPart, type MenuView, type Wearing } from '../api.ts';
import type { Registry } from '../registry.ts';
import { wornFrom, type ProfileStore } from './profile.ts';
import './menu.css';

const NAME_KEY = 'draft-arena:name';

function storedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function storeName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    // Private mode or blocked storage: the name just isn't remembered.
  }
}

export class Menu {
  private readonly root: HTMLElement;
  private readonly message: HTMLElement;
  private readonly name: HTMLInputElement;
  private readonly parts: { part: MenuPart; failed: boolean; name: string }[];
  private readonly store: ProfileStore;
  private readonly registry: Registry;

  constructor(root: HTMLElement, onPlay: (name: string) => void, registry: Registry, store: ProfileStore, makers: readonly MakeMenuPart[]) {
    this.root = root;
    this.registry = registry;
    this.store = store;
    root.innerHTML = `
      <div class="menu-card">
        <h1>Draft Arena</h1>
        <p class="menu-tag">Your weapons fire by themselves. Every level gives a talent point: grow your own playstyle. Monsters come in crowds, and the other players are the real threat.</p>
        <input class="menu-name" maxlength="16" placeholder="Your name" autocomplete="off" spellcheck="false" />
        <div class="menu-parts"></div>
        <button class="menu-button primary" data-play>Play</button>
        <p class="menu-message"></p>
        <p class="menu-help">Move: WASD or arrows, or drag on a phone · Talents: T or the button · Leave: Esc</p>
      </div>`;
    this.message = root.querySelector('.menu-message')!;
    this.name = root.querySelector('.menu-name')!;
    this.name.value = storedName();
    const play = (): void => {
      const name = this.name.value.trim();
      storeName(name);
      onPlay(name);
    };
    root.querySelector('[data-play]')!.addEventListener('click', play);
    this.name.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') play();
    });
    const slot = root.querySelector<HTMLElement>('.menu-parts')!;
    this.parts = makers.map((make) => {
      try {
        return { part: make(slot), failed: false, name: make.name };
      } catch (err) {
        console.error(`menu part ${make.name} failed to build: ${err instanceof Error ? err.message : String(err)}`);
        return { part: { update() {} }, failed: true, name: make.name };
      }
    });
    // Once at once, so a broken part shows up even when the start screen is skipped (the smoke test).
    this.refresh();
  }

  /** Every part redraws from the profile as it is now. */
  private refresh(): void {
    const view = this.view();
    for (const p of this.parts) {
      if (p.failed) continue;
      try {
        p.part.update(view);
      } catch (err) {
        p.failed = true;
        console.error(`menu part ${p.name} failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  private view(): MenuView {
    const store = this.store;
    const { content } = this.registry;
    const after = <T>(result: T): T => {
      // After the current update, so a part may call these from inside its own handlers safely.
      queueMicrotask(() => this.refresh());
      return result;
    };
    return {
      profile: store.profile,
      colors: content.rules.playerColors,
      accessories: content.accessories,
      patterns: content.patterns,
      owns: (id) => store.owns(id),
      cantBuy: (id) => store.cantBuy(id),
      buy: (id) => after(store.buy(id)),
      wear: (slot, id) => after(store.wear(slot, id)),
      setColor: (index) => after(store.setColor(index)),
      preview: (canvas, wearing, color) => this.preview(canvas, wearing, color),
    };
  }

  private preview(canvas: HTMLCanvasElement, wearing: Wearing | undefined, color: number | undefined): void {
    const g = canvas.getContext('2d');
    if (!g) return;
    const { content } = this.registry;
    const colors = content.rules.playerColors;
    const w = wearing ?? this.store.profile.wearing;
    const index = (id: string | undefined, list: readonly { id: string }[]): number => (id ? list.findIndex((x) => x.id === id) + 1 : 0);
    const worn = wornFrom(this.registry, {
      head: index(w.head, content.accessories),
      face: index(w.face, content.accessories),
      back: index(w.back, content.accessories),
      pattern: index(w.pattern, content.patterns),
    });
    const r = Math.min(canvas.width, canvas.height) * 0.26;
    g.clearRect(0, 0, canvas.width, canvas.height);
    g.save();
    g.translate(canvas.width / 2, canvas.height / 2 + r * 0.15);
    const view = { x: 0, y: 0, angle: Math.PI / 2, radius: r, hp: 1, slots: [0, 0, 0, 0], flash: false, speed: 0, time: 0, seed: 0, color: '' };
    drawPlayerCritter(g, view, colors[(color ?? this.store.profile.color ?? 0) % colors.length]!, worn, content.rules.ink, (def, err) =>
      console.error(`${(def as { id?: string }).id ?? 'a wearable'} failed to draw: ${err instanceof Error ? err.message : String(err)}`),
    );
    g.restore();
  }

  show(message = ''): void {
    this.message.textContent = message;
    this.root.hidden = false;
    this.refresh();
  }

  hide(): void {
    this.root.hidden = true;
  }
}
