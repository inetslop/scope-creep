/**
 * window.__SC__: what the fleet's browser smoke test (loop/smoke/) reads. ready/scene/frame tell it
 * the game is running, stats prove the core loop works, invariants() lists what must never happen.
 */
export interface TestHook {
  ready: boolean;
  scene: string;
  frame: number;
  errors: string[];
  stats: Record<string, number | boolean>;
  invariants: () => string[];
  /** Screen centres of the talents that can be taken now (for touch play). */
  cardSpots: () => { x: number; y: number }[];
}

declare global {
  interface Window {
    __SC__?: TestHook;
  }
}

export function installTestHook(): TestHook {
  const hook: TestHook = {
    ready: false,
    scene: 'Menu',
    frame: 0,
    errors: [],
    stats: {},
    invariants: () => [],
    cardSpots: () =>
      [...document.querySelectorAll<HTMLElement>('[data-card]')].map((el) => {
        const r = el.getBoundingClientRect();
        return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }),
  };
  window.addEventListener('error', (e) => hook.errors.push(String(e.message)));
  window.addEventListener('unhandledrejection', (e) => hook.errors.push(`unhandled rejection: ${String(e.reason)}`));
  window.__SC__ = hook;
  return hook;
}
