import { normalizeVolumes } from '../sound.js';
import { atlasDestinations } from './atlas-destinations.js';
import { normalizeMiniMap } from './mini-map.js';
import { sceneryQualityPreference } from './scenery-quality.js';
import { restoreMapGoal, savedMapGoal } from './wayfinding.js';

// Only Mochi Quest 2's two local keys travel. The fragment never becomes
// part of the HTTP request, and the destination URL is fixed in this module.
export const PAGES_ORIGIN = 'https://ishida-konbu.github.io';
export const PAGES_GUIDE = PAGES_ORIGIN + '/mochi-quest/two/#guide';
export const WORKER_ORIGIN = 'https://mochi-quest.mochi-quest.workers.dev';
export const LEGACY_KEY = 'mochi-quest.two.journey.v1';
export const SAVE_KEY = 'mochi-quest.two.journey.v2';
export const PREVIOUS_KEY = SAVE_KEY + '.previous';
export const BACKUP_KEY = SAVE_KEY + '.backup';
export const SETTINGS_KEY = 'mochi-quest.two.settings.v1';
const prefix = '#mochi2=';
const sizeLimit = 24000;

export function travelCameraPreference(settings) {
  if (typeof settings.travelCamera === 'boolean') return settings.travelCamera;
  if (typeof settings.dangoCamera === 'boolean') return settings.dangoCamera;
}

export function transferURL(origin, journey, settings) {
  if (origin !== PAGES_ORIGIN || !journey) return null;
  const hash = prefix + encodeURIComponent(JSON.stringify({ format: 1, journey, settings }));
  return hash.length <= sizeLimit ? WORKER_ORIGIN + '/two/' + hash : null;
}

export function decodeTransfer(origin, hash, createGame) {
  if (origin !== WORKER_ORIGIN || typeof hash !== 'string' || !hash.startsWith(prefix) || hash.length > sizeLimit) return null;
  try {
    const data = JSON.parse(decodeURIComponent(hash.slice(prefix.length)));
    return decodeJourney(data, createGame);
  } catch {
    return null;
  }
}

export function decodeJourney(data, createGame) {
  try {
    if (data?.format !== 1) return null;
    const settings = data.settings;
    if (!settings || typeof settings.sound !== 'boolean' || !Number.isFinite(settings.yaw)) return null;
    const game = createGame(data.journey);
    if (!game.restored) return null;
    const goal = restoreMapGoal(settings.goal, atlasDestinations(game.state));
    if (settings.goal !== null && !goal) return null;
    const travelCamera = travelCameraPreference(settings);
    const sceneryQuality = sceneryQualityPreference(settings.sceneryQuality);
    return { game, settings: {
      sound: settings.sound, volumes: normalizeVolumes(settings.volumes), yaw: settings.yaw, goal: savedMapGoal(goal),
      ...(travelCamera !== undefined ? { travelCamera } : {}),
      ...(sceneryQuality !== undefined ? { sceneryQuality } : {}),
      ...(settings.minimap ? { minimap: normalizeMiniMap(settings.minimap) } : {}),
    } };
  } catch {
    return null;
  }
}

export function replaceJourney(storage, settings, snapshot) {
  const previous = storage.getItem(SETTINGS_KEY);
  const original = storage.getItem(SAVE_KEY) ?? storage.getItem(LEGACY_KEY);
  if (original !== null) storage.setItem(BACKUP_KEY, original);
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  try {
    if (snapshot === null) {
      // A reset must not resurrect the previous edition on the next startup.
      storage.removeItem(LEGACY_KEY);
      storage.removeItem(SAVE_KEY);
    }
    else storage.setItem(SAVE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    if (previous === null) storage.removeItem(SETTINGS_KEY);
    else storage.setItem(SETTINGS_KEY, previous);
    throw error;
  }
}

export function storeTransfer(storage, incoming) {
  replaceJourney(storage, incoming.settings, incoming.game.save());
}
