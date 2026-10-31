/** The start screen: your name and Play. The match always has at least rules.bots.fillTo players: bots fill the rest. */
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

  constructor(root: HTMLElement, onPlay: (name: string) => void) {
    this.root = root;
    root.innerHTML = `
      <div class="menu-card">
        <h1>Draft Arena</h1>
        <p class="menu-tag">Your weapons fire by themselves. Every level gives a talent point: grow your own playstyle. Monsters come in crowds, and the other players are the real threat.</p>
        <input class="menu-name" maxlength="16" placeholder="Your name" autocomplete="off" spellcheck="false" />
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
  }

  show(message = ''): void {
    this.message.textContent = message;
    this.root.hidden = false;
  }

  hide(): void {
    this.root.hidden = true;
  }
}
