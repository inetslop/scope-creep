import type { Attack } from './attack';

/**
 * Rally is a support: the beacon never fires at enemies (no shots, sound or stats) - it only
 * speeds up the towers near it (systems/RallySystem.ts).
 */
export const rally: Attack = () => false;
