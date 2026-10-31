import type { MakeMenuPart } from '../../engine/api.ts';
import './coins.css';

/** The Cosmetics button in the start card: your coin balance, kept between visits. It opens the panel. */
export const coins: MakeMenuPart = (root) => {
  const line = document.createElement('button');
  line.type = 'button';
  line.className = 'menu-button coins-line';
  const coin = document.createElement('span');
  coin.className = 'coins-coin';
  const label = document.createElement('span');
  line.append(coin, label);
  // Opens the cosmetics panel: the listener is in src/menu/shop.ts.
  line.addEventListener('click', () => line.dispatchEvent(new CustomEvent('critter-shop-open', { bubbles: true })));
  root.append(line);
  let shown = -1;
  return {
    update(view) {
      const n = view.profile.coins;
      if (n === shown) return;
      shown = n;
      label.textContent = `Cosmetics · ${n}`;
    },
  };
};
