/** Plain 2D vector helpers. Immutable style: functions return new objects. */
export interface Vec2 {
  x: number;
  y: number;
}

export const vec = (x = 0, y = 0): Vec2 => ({ x, y });

export const add = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x + b.x, y: a.y + b.y });
export const sub = (a: Vec2, b: Vec2): Vec2 => ({ x: a.x - b.x, y: a.y - b.y });
export const scale = (a: Vec2, s: number): Vec2 => ({ x: a.x * s, y: a.y * s });
export const length = (a: Vec2): number => Math.hypot(a.x, a.y);
export const distance = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
export const angleOf = (a: Vec2): number => Math.atan2(a.y, a.x);
export const fromAngle = (radians: number, len = 1): Vec2 => ({ x: Math.cos(radians) * len, y: Math.sin(radians) * len });

/** Unit vector in the same direction, or (0,0) for a zero vector. */
export function normalize(a: Vec2): Vec2 {
  const len = length(a);
  return len > 1e-9 ? { x: a.x / len, y: a.y / len } : { x: 0, y: 0 };
}

/** Scales the vector down so its length is at most `max`. */
export function clampLength(a: Vec2, max: number): Vec2 {
  const len = length(a);
  return len > max && len > 0 ? scale(a, max / len) : { x: a.x, y: a.y };
}

/**
 * Applies a radial dead zone to an analog stick value (length 0..1) and rescales
 * the remaining range back to 0..1. Returns (0,0) inside the dead zone.
 */
export function applyDeadZone(a: Vec2, deadZone: number): Vec2 {
  const len = length(a);
  if (len <= deadZone) return { x: 0, y: 0 };
  const t = Math.min(1, (len - deadZone) / (1 - deadZone));
  return scale(a, t / len);
}

export const isFiniteVec = (a: Vec2): boolean => Number.isFinite(a.x) && Number.isFinite(a.y);
