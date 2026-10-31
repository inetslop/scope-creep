/**
 * The player's profile, kept in this browser (localStorage) between visits: coins, what they bought,
 * what they wear, their color and their prestiges over every match. Nothing is kept on the server:
 * clearing the browser's data starts a new profile.
 */
import { ACCESSORY_SLOTS, type AccessoryDef, type AccessorySlot, type PatternDef, type Profile, type Worn } from '../api.ts';
import type { Registry } from '../registry.ts';
import type { WireWear } from '../shared/protocol.ts';

const KEY = 'draft-arena:profile';

const whole = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? Math.floor(v) : 0);

function load(): Profile {
  let raw: unknown;
  try {
    raw = JSON.parse(localStorage.getItem(KEY) ?? 'null');
  } catch {
    raw = null;
  }
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const wearing = o.wearing && typeof o.wearing === 'object' ? (o.wearing as Record<string, unknown>) : {};
  return {
    coins: whole(o.coins),
    owned: Array.isArray(o.owned) ? o.owned.filter((id): id is string => typeof id === 'string') : [],
    wearing: Object.fromEntries(Object.entries(wearing).filter(([k, v]) => (k === 'pattern' || (ACCESSORY_SLOTS as readonly string[]).includes(k)) && typeof v === 'string')),
    color: typeof o.color === 'number' && Number.isInteger(o.color) && o.color >= 0 ? o.color : undefined,
    prestiges: whole(o.prestiges),
  };
}

export class ProfileStore {
  profile: Profile;
  private readonly registry: Registry;

  constructor(registry: Registry) {
    this.registry = registry;
    this.profile = load();
    if (this.profile.color !== undefined && this.profile.color >= registry.content.rules.playerColors.length) this.profile.color = undefined;
  }

  private save(): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.profile));
    } catch {
      // Private mode or blocked storage: the profile lasts until the page closes.
    }
  }

  item(id: string): AccessoryDef | PatternDef | undefined {
    return this.registry.accessories.get(id) ?? this.registry.patterns.get(id);
  }

  owns(id: string): boolean {
    const item = this.item(id);
    if (!item || this.profile.prestiges < (item.prestige ?? 0)) return false;
    return item.price <= 0 || this.profile.owned.includes(id);
  }

  cantBuy(id: string): string {
    const item = this.item(id);
    if (!item) return 'Not in the game';
    if (this.owns(id)) return 'Owned';
    const need = item.prestige ?? 0;
    if (this.profile.prestiges < need) return `Needs ${need} prestige${need === 1 ? '' : 's'}`;
    if (this.profile.coins < item.price) return `Costs ${item.price} coins`;
    return '';
  }

  buy(id: string): boolean {
    const item = this.item(id);
    if (!item || this.cantBuy(id)) return false;
    this.profile = { ...this.profile, coins: this.profile.coins - item.price, owned: [...this.profile.owned, id] };
    this.save();
    return true;
  }

  wear(slot: AccessorySlot | 'pattern', id: string | undefined): void {
    const wearing = { ...this.profile.wearing };
    if (id === undefined) delete wearing[slot];
    else {
      const item = this.item(id);
      const fits = slot === 'pattern' ? this.registry.patterns.has(id) : (item as AccessoryDef | undefined)?.slot === slot;
      if (!item || !fits || !this.owns(id)) return;
      wearing[slot] = id;
    }
    this.profile = { ...this.profile, wearing };
    this.save();
  }

  setColor(index: number | undefined): void {
    const ok = index === undefined || (Number.isInteger(index) && index >= 0 && index < this.registry.content.rules.playerColors.length);
    if (!ok) return;
    this.profile = { ...this.profile, color: index };
    this.save();
  }

  addEarnings(e: { coins: number; prestiges: number }): void {
    if (!(e.coins > 0) && !(e.prestiges > 0)) return;
    this.profile = { ...this.profile, coins: this.profile.coins + whole(e.coins), prestiges: this.profile.prestiges + whole(e.prestiges) };
    this.save();
  }

  /** What to send when joining: only what exists, fits its slot and is owned. */
  wire(): WireWear {
    const { accessories, patterns } = this.registry.content;
    const index = (slot: AccessorySlot | 'pattern'): number => {
      const id = this.profile.wearing[slot];
      if (!id || !this.owns(id)) return 0;
      const i = slot === 'pattern' ? patterns.findIndex((p) => p.id === id) : accessories.findIndex((a) => a.id === id && a.slot === slot);
      return i + 1;
    };
    return { head: index('head'), face: index('face'), back: index('back'), pattern: index('pattern') };
  }
}

/** Indexes from the wire (or a profile) as the defs to draw. */
export function wornFrom(registry: Registry, w: WireWear | undefined): Worn {
  if (!w) return {};
  const { accessories, patterns } = registry.content;
  return { head: accessories[w.head - 1], face: accessories[w.face - 1], back: accessories[w.back - 1], pattern: patterns[w.pattern - 1] };
}
