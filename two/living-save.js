import { createHoldings, validHoldings } from './living-resources.js';
import { craftState, validCraftState } from './living-craft.js';
import { INITIAL_WORLD_MINUTE } from './world-clock.js';

export const JOURNEY_VERSION = 13;
export function createLivingWorld() {
  return { schemaVersion: 1, revision: 0, worldMinute: INITIAL_WORLD_MINUTE, ...createHoldings(), ...craftState() };
}

export function validLivingWorld(world) {
  return world?.schemaVersion === 1 && Number.isSafeInteger(world.revision) && world.revision >= 0 &&
    Number.isFinite(world.worldMinute) && world.worldMinute >= 0 && world.worldMinute < Number.MAX_SAFE_INTEGER / 2 &&
    validHoldings(world) && validCraftState(world);
}
