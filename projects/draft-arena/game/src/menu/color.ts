import './color.css';
import type { MakeMenuPart, MenuView } from '../../engine/api.ts';

class ColorPart {
  private built = false;
  private open = false;
  private view!: MenuView;
  private dot!: HTMLElement;
  private word!: HTMLElement;
  private panel!: HTMLElement;
  private canvas!: HTMLCanvasElement;
  private readonly slot: HTMLElement;
  constructor(slot: HTMLElement) {
    this.slot = slot;
  }
  update(v: MenuView): void {
    this.view = v;
    if (!this.built) {
      this.built = true;
      const card = document.createElement('button');
      card.className = 'color-card';
      this.dot = document.createElement('span');
      this.dot.className = 'color-dot';
      this.word = document.createElement('span');
      this.word.className = 'color-word';
      this.word.textContent = 'Random';
      const name = document.createElement('span');
      name.className = 'color-name';
      name.textContent = 'Color';
      card.append(this.dot, this.word, name);
      card.addEventListener('click', () => {
        this.open = !this.open;
        this.panel.hidden = !this.open;
        if (this.open) this.view.preview(this.canvas);
      });
      this.slot.append(card);
      this.panel = document.createElement('div');
      this.panel.className = 'color-panel hud-card';
      this.panel.hidden = true;
      this.canvas = document.createElement('canvas');
      this.canvas.className = 'color-preview';
      this.canvas.width = 320;
      this.canvas.height = 140;
      const choices = document.createElement('div');
      choices.className = 'color-choices';
      v.colors.forEach((c, i) => {
        const b = document.createElement('button');
        b.className = 'color-choice';
        b.style.background = c;
        b.setAttribute('aria-label', `Color ${i + 1}`);
        b.addEventListener('click', () => this.view.setColor(i));
        choices.append(b);
      });
      const random = document.createElement('button');
      random.className = 'color-choice color-random';
      random.textContent = 'Random';
      random.setAttribute('aria-label', 'Random color');
      random.addEventListener('click', () => this.view.setColor(undefined));
      choices.append(random);
      this.panel.append(this.canvas, choices);
      this.slot.parentElement?.append(this.panel);
    }
    const c = v.profile.color;
    this.dot.style.display = c === undefined ? 'none' : '';
    if (c !== undefined) this.dot.style.background = v.colors[c]!;
    this.word.style.display = c === undefined ? '' : 'none';
    if (this.open) v.preview(this.canvas);
  }
}
export const color: MakeMenuPart = (slot) => new ColorPart(slot);
