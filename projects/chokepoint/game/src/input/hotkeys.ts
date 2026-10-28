import type { GameScene } from '../scenes/GameScene';
import { onKey } from '../scenes/keys';

/**
 * The run's keyboard shortcuts, one line each: which keys, and what they do. A new shortcut is a
 * new line here (and its hint on screen where the action is, e.g. on the button).
 */
const HOTKEYS: readonly { keys: readonly string[]; run: (game: GameScene, key: string) => void }[] = [
  { keys: ['Escape'], run: (g) => (g.building.selectedTower ? g.building.closePanel() : g.openPause()) },
  { keys: ['p', 'P'], run: (g) => g.openPause() },
  { keys: [' ', 'Enter'], run: (g) => g.flow.startWaveNow() },
  { keys: ['f', 'F'], run: (g) => g.speed.toggle(g.scene.isActive() && g.run.phase === 'wave') },
  { keys: ['+', '='], run: (g) => g.board.zoomIn() },
  { keys: ['-', '_'], run: (g) => g.board.zoomOut() },
  { keys: ['0'], run: (g) => g.board.resetZoom() },
  { keys: ['1', '2', '3', '4', '5', '6', '7', '8', '9'], run: (g, key) => g.building.pickCard(Number(key) - 1) },
];

/** Listens for the hotkeys until the scene shuts down. */
export function bindHotkeys(game: GameScene): void {
  onKey(game, (e) => {
    const binding = HOTKEYS.find((h) => h.keys.includes(e.key));
    binding?.run(game, e.key);
  });
}
