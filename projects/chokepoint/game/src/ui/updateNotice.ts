import type Phaser from 'phaser';
import { flags } from '../debug/flags';
import { onResize } from '../scenes/keys';
import { makeButton } from './button';
import { viewSize } from './display';

/** How often a running page asks whether a newer build is live. */
const CHECK_MS = 10 * 60_000;

/** The live build's game version, once one that differs from this build's has been seen. */
let newer: string | undefined;
/** The notices on screen right now: shown the moment a newer build is seen. */
const listeners = new Set<() => void>();

/**
 * Watches for a newer build of the game. Pages and browsers cache the page for up to 10 minutes
 * and a tab can stay open for hours, so a player can run an old build without knowing. On start
 * and every CHECK_MS it fetches version.json past every cache: its `game` (the last commit that
 * changed this game) differs from the one built into this page once a newer build is live. Off in
 * the dev server (there is no version.json) and in the smoke test.
 */
export function startUpdateCheck(): void {
  if (import.meta.env.DEV || flags.smoke) return;
  const check = (): void => {
    fetch(`version.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((r) => (r.ok ? (r.json() as Promise<{ game?: unknown }>) : undefined))
      .then((v) => {
        if (typeof v?.game !== 'string' || v.game === __GAME_SHA__ || v.game === newer) return;
        newer = v.game;
        for (const show of listeners) show();
      })
      .catch(() => undefined);
  };
  check();
  window.setInterval(check, CHECK_MS);
}

/**
 * A small "New version · Reload" card at the top of a screen between runs (the menu, game over),
 * shown once a newer build is live; a tap or click reloads the page. Never during a run: a reload
 * would end it.
 */
export function addUpdateNotice(scene: Phaser.Scene): void {
  const button = makeButton(scene, 0, 0, 'New version · Reload', () => window.location.reload(), { width: 236, height: 44, radius: 22, fontSize: 15 });
  const show = (): void => {
    button.container.setVisible(newer !== undefined);
  };
  button.container.setDepth(1000);
  show();
  const layout = (width: number): void => {
    button.container.setPosition(width / 2, 16 + 22);
  };
  layout(viewSize(scene).width);
  onResize(scene, (width) => layout(width));
  listeners.add(show);
  scene.events.once('shutdown', () => listeners.delete(show));
}
