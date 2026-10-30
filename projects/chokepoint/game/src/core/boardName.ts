/** The player's name on the leaderboards: four capital letters, kept on the device. */

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export const NAME_LENGTH = 4;
export const BOARD_NAME_KEY = 'chokepoint:board-name';
const NAME_RE = /^[A-Z]{4}$/;

export const isBoardName = (name: string): boolean => NAME_RE.test(name);

/** The saved name, or '' before the player has picked one. */
export function loadBoardName(store: KeyValueStore | undefined): string {
  try {
    const name = (store?.getItem(BOARD_NAME_KEY) ?? '').toUpperCase();
    return isBoardName(name) ? name : '';
  } catch {
    return '';
  }
}

export function saveBoardName(store: KeyValueStore | undefined, name: string): void {
  if (!isBoardName(name)) return;
  try {
    store?.setItem(BOARD_NAME_KEY, name);
  } catch {
    /* private mode or full storage: asked again next time */
  }
}

/** Steps one letter of a name up or down the alphabet, wrapping (A down is Z). */
export function stepLetter(letter: string, by: number): string {
  const i = Math.max(0, letter.charCodeAt(0) - 65);
  return String.fromCharCode(65 + ((((i + by) % 26) + 26) % 26));
}
