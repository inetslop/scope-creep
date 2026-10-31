import './shop.css';
import { ACCESSORY_SLOTS, type AccessorySlot, type MakeMenuPart, type MenuPart, type MenuView, type Wearing } from '../../engine/api.ts';
import { PALETTE } from '../content/palette.ts';
import { coinTick } from '../audio/sfx.ts';

/**
 * The Cosmetics panel: a sticker card over the start screen where every look is bought and worn.
 * Opens when the Cosmetics button is tapped (a 'critter-shop-open' event bubbling to .menu-parts);
 * what a player buys is theirs to wear, kept for the next visit.
 */
export const shop: MakeMenuPart = (root): MenuPart => {
  let view: MenuView;
  let open = false;
  let selectedId: string | null = null;

  // The skeleton, built once. The overlay lives on document.body: it covers the whole viewport,
  // the start card only listens on root (.menu-parts) for the open event.
  const overlay = document.createElement('div');
  overlay.id = 'shop-overlay';
  overlay.hidden = true;
  const card = document.createElement('div');
  card.className = 'shop-card hud-card';
  const head = document.createElement('header');
  head.className = 'shop-head';
  const title = document.createElement('h2');
  title.textContent = 'Cosmetics';
  const balance = document.createElement('span');
  balance.className = 'shop-balance';
  const balanceCoin = document.createElement('span');
  balanceCoin.className = 'coin';
  const balanceCoins = document.createElement('span');
  balanceCoins.className = 'shop-coins';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'menu-button shop-close';
  closeBtn.setAttribute('aria-label', 'Close the shop');
  closeBtn.textContent = '✕';
  balance.append(balanceCoin, balanceCoins);
  head.append(title, balance, closeBtn);
  const previewCanvas = document.createElement('canvas');
  previewCanvas.className = 'shop-preview';
  previewCanvas.width = 200;
  previewCanvas.height = 200;
  const rows = document.createElement('div');
  rows.className = 'shop-rows';
  const foot = document.createElement('footer');
  foot.className = 'shop-foot';
  const nameLine = document.createElement('p');
  nameLine.className = 'shop-name';
  const descLine = document.createElement('p');
  descLine.className = 'shop-desc';
  const stateLine = document.createElement('p');
  stateLine.className = 'shop-state';
  const buyBtn = document.createElement('button');
  buyBtn.type = 'button';
  buyBtn.className = 'menu-button shop-buy';
  foot.append(nameLine, descLine, stateLine, buyBtn);
  card.append(head, previewCanvas, rows, foot);
  overlay.append(card);
  document.body.append(overlay);

  const findDef = (id: string): { id: string; name: string; description: string; price: number; slot?: AccessorySlot } =>
    view.accessories.find((a) => a.id === id) ?? view.patterns.find((p) => p.id === id)!;
  const slotOf = (id: string): AccessorySlot | 'pattern' => findDef(id).slot ?? 'pattern';

  const paintPreview = (): void => {
    // The player's own look, with the selected item tried on in its slot.
    const wearing: Wearing | undefined = selectedId ? { ...view.profile.wearing, [slotOf(selectedId)]: selectedId } : undefined;
    view.preview(previewCanvas, wearing);
  };

  const renderFooter = (): void => {
    if (!selectedId) {
      nameLine.textContent = 'Point at a swatch to try it on.';
      descLine.textContent = '';
      stateLine.textContent = '';
      buyBtn.hidden = true;
      buyBtn.onclick = null;
      return;
    }
    const id = selectedId;
    const def = findDef(id);
    const slot = slotOf(id);
    const owned = view.owns(id);
    const worn = view.profile.wearing[slot] === id;
    nameLine.textContent = def.name;
    descLine.textContent = def.description;
    stateLine.textContent = worn ? 'Wearing it' : owned ? 'Owned' : 'Not owned';
    buyBtn.hidden = false;
    if (worn) {
      buyBtn.disabled = false;
      buyBtn.textContent = 'Wearing';
      buyBtn.onclick = () => view.wear(slot, undefined);
    } else if (owned) {
      buyBtn.disabled = false;
      buyBtn.textContent = 'Wear';
      buyBtn.onclick = () => view.wear(slot, id);
    } else {
      const cant = view.cantBuy(id);
      buyBtn.disabled = cant !== '';
      buyBtn.textContent = cant !== '' ? cant : `Buy · ${def.price}`;
      buyBtn.onclick = () => {
        if (view.buy(id)) { coinTick(); popConfetti(); }
      };
    }
  };

  const select = (id: string): void => {
    selectedId = id;
    // Never rebuild the rows here: a fresh element under the cursor re-triggers pointerenter.
    for (const sw of rows.querySelectorAll<HTMLButtonElement>('.swatch')) sw.classList.toggle('selected', sw.dataset.id === id);
    paintPreview();
    renderFooter();
  };

  const addSection = (label: string, items: readonly { id: string; name: string; price: number }[]): void => {
    if (items.length === 0) return;
    const row = document.createElement('div');
    row.className = 'shop-row';
    const heading = document.createElement('h3');
    heading.textContent = label;
    const swatches = document.createElement('div');
    swatches.className = 'swatches';
    for (const def of items) {
      const slot = slotOf(def.id);
      const owned = view.owns(def.id);
      const swatch = document.createElement('button');
      swatch.type = 'button';
      swatch.className = 'swatch';
      swatch.dataset.id = def.id;
      swatch.setAttribute('aria-label', def.name);
      if (view.profile.wearing[slot] === def.id) swatch.classList.add('worn');
      const c = document.createElement('canvas');
      c.width = 96;
      c.height = 96;
      swatch.append(c);
      if (def.price === 0 || !owned) {
        const price = document.createElement('span');
        price.className = 'price';
        if (def.price === 0) {
          price.textContent = 'Free';
        } else {
          const priceCoin = document.createElement('span');
          priceCoin.className = 'coin';
          const priceValue = document.createElement('span');
          priceValue.textContent = `${def.price}`;
          price.append(priceCoin, priceValue);
        }
        swatch.append(price);
      }
      view.preview(c, { [slot]: def.id });
      // Hover selects on a desktop, a tap on a phone.
      const tryOn = () => select(def.id);
      swatch.addEventListener('pointerenter', tryOn);
      swatch.addEventListener('click', tryOn);
      swatches.append(swatch);
    }
    row.append(heading, swatches);
    rows.append(row);
  };

  const renderAll = (): void => {
    balanceCoins.textContent = `${view.profile.coins}`;
    rows.textContent = '';
    for (const slot of ACCESSORY_SLOTS) {
      const label = slot === 'head' ? 'Head' : slot === 'face' ? 'Face' : 'Back';
      addSection(label, view.accessories.filter((a) => a.slot === slot));
    }
    addSection('Patterns', view.patterns);
    paintPreview();
    renderFooter();
  };

  // A confetti pop on the stable preview canvas, timed from the first frame.
  const popConfetti = (): void => {
    const colors = [PALETTE.yellow, PALETTE.pink, PALETTE.blue, PALETTE.green, PALETTE.orange, PALETTE.purple];
    const bits = Array.from({ length: 24 }, () => ({
      angle: Math.random() * Math.PI * 2,
      speed: 40 + Math.random() * 70,
      size: 4 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)]!,
    }));
    let start = 0;
    const step = (now: number): void => {
      if (start === 0) start = now;
      const p = (now - start) / 700;
      paintPreview(); // the critter under the confetti
      if (p >= 1) return;
      const g = previewCanvas.getContext('2d');
      if (g) {
        g.save();
        g.translate(previewCanvas.width / 2, previewCanvas.height / 2);
        for (const b of bits) {
          g.save();
          g.translate(Math.cos(b.angle) * b.speed * p, Math.sin(b.angle) * b.speed * p + 30 * p * p);
          g.rotate(b.angle + p * 6);
          g.fillStyle = b.color;
          g.fillRect(-b.size / 2, -b.size / 2, b.size, b.size);
          g.restore();
        }
        g.restore();
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  const onKey = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') closeShop();
  };
  const openShop = (): void => {
    open = true;
    selectedId = null;
    renderAll();
    overlay.hidden = false;
    window.addEventListener('keydown', onKey);
  };
  const closeShop = (): void => {
    open = false;
    overlay.hidden = true;
    window.removeEventListener('keydown', onKey);
  };
  root.addEventListener('critter-shop-open', openShop);
  closeBtn.addEventListener('click', closeShop);
  // The panel belongs to the start screen. Play can be reached by keyboard while it is open (the
  // overlay blocks clicks, not Tab), so it goes away with the screen when the match starts.
  const menuRoot = root.closest<HTMLElement>('#menu');
  if (menuRoot) new MutationObserver(() => menuRoot.hidden && closeShop()).observe(menuRoot, { attributes: true, attributeFilter: ['hidden'] });

  return {
    update(v: MenuView): void {
      view = v;
      // The engine re-calls update after every buy/wear/color change: refresh while the shop is open.
      if (open) renderAll();
    },
  };
};
