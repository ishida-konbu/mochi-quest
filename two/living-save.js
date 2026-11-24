import { createHoldings, validHoldings } from './living-resources.js';
import { craftState, validCraftState } from './living-craft.js';
import { buildState, validBuildState } from './living-build-state.js';
import { createMarketState, validMarketState } from './living-market.js';
import { INITIAL_WORLD_MINUTE } from './world-clock.js';

export const JOURNEY_VERSION = 14;

export function createLivingWorld(worldMinute = INITIAL_WORLD_MINUTE) {
  return {schemaVersion:2, revision:0, worldMinute, ...createHoldings(), ...craftState(),
    ...buildState(), ...createMarketState(worldMinute)};
}

function validProvisions(world) {
  return Number.isSafeInteger(world.revision) && world.revision >= 0 &&
    Number.isFinite(world.worldMinute) && world.worldMinute >= 0 && world.worldMinute < Number.MAX_SAFE_INTEGER / 2 &&
    validHoldings(world) && validCraftState(world);
}

export function validLivingWorld(world) {
  return world?.schemaVersion === 2 && validProvisions(world) && validBuildState(world) && validMarketState(world);
}

export function readLivingWorld(version, record) {
  if (version === 13 && record?.schemaVersion === 1 && validProvisions(record)) {
    return {...structuredClone(record), schemaVersion:2, ...buildState(), ...createMarketState(record.worldMinute)};
  }
  return version === JOURNEY_VERSION && validLivingWorld(record) ? structuredClone(record) : null;
}
