/** A canvas context that accepts every call: runs content draw functions without a browser. */
export const stubContext = new Proxy(
  {},
  {
    get: (_t, key) => (key === 'canvas' ? { width: 100, height: 100 } : key === 'measureText' ? () => ({ width: 10 }) : () => undefined),
    set: () => true,
  },
) as unknown as CanvasRenderingContext2D;
