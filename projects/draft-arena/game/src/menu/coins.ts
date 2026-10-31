import type { MakeMenuPart } from '../../engine/api.ts';
import './coins.css';

/** A thin line in the start card: your coin balance, kept between visits. */
export const coins: MakeMenuPart = (root) => {
  const line = document.createElement('button');
  line.type = 'button';
  line.className = 'coins-line';
  const coin = document.createElement('span');
  coin.className = 'coins-coin';
  const label = document.createElement('span');
  line.append(coin, label);
  // Opens the shop: the listener is in src/menu/shop.ts.
  line.addEventListener('click', () => line.dispatchEvent(new CustomEvent('critter-shop-open', { bubbles: true })));
  root.append(line);
  let shown = -1;
  return {
    update(view) {
      const n = view.profile.coins;
      if (n === shown) return;
      shown = n;
      label.textContent = n === 1 ? '1 coin' : `${n} coins`;
    },
  };
};
