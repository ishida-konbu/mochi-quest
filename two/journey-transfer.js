// Only Mochi Quest 2's two local keys travel. The fragment never becomes
// part of the HTTP request, and the destination URL is fixed in this module.
export const PAGES_ORIGIN = 'https://ishida-konbu.github.io';
export const PAGES_GUIDE = PAGES_ORIGIN + '/mochi-quest/two/#guide';
export const WORKER_ORIGIN = 'https://mochi-quest.mochi-quest.workers.dev';
export const SAVE_KEY = 'mochi-quest.two.journey.v1';
export const SETTINGS_KEY = 'mochi-quest.two.settings.v1';
const prefix = '#mochi2=';
const sizeLimit = 24000;

export function transferURL(origin, journey, settings) {
  if (origin !== PAGES_ORIGIN || !journey) return null;
  const hash = prefix + encodeURIComponent(JSON.stringify({ format: 1, journey, settings }));
  return hash.length <= sizeLimit ? WORKER_ORIGIN + '/two/' + hash : null;
}

export function decodeTransfer(origin, hash, createGame, regions) {
  if (origin !== WORKER_ORIGIN || typeof hash !== 'string' || !hash.startsWith(prefix) || hash.length > sizeLimit) return null;
  try {
    const data = JSON.parse(decodeURIComponent(hash.slice(prefix.length)));
    if (data?.format !== 1) return null;
    const settings = data.settings;
    if (!settings || typeof settings.sound !== 'boolean' || !Number.isFinite(settings.yaw) ||
        (settings.goal !== null && !regions.some(r => r.id === settings.goal))) return null;
    // The game accepts both historical save formats and normalizes the old
    // item/port layouts. It also strips fields that aren't part of the save.
    const game = createGame(data.journey);
    if (!game.restored) return null;
    const normalized = { sound: settings.sound, yaw: settings.yaw, goal: settings.goal };
    if (game.mysteryWorld?.locate(settings.storyGoal)) normalized.storyGoal = settings.storyGoal;
    return { game, settings: normalized };
  } catch {
    return null;
  }
}

export function storeTransfer(storage, incoming) {
  const previous = storage.getItem(SETTINGS_KEY);
  storage.setItem(SETTINGS_KEY, JSON.stringify(incoming.settings));
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(incoming.game.save()));
  } catch (error) {
    if (previous === null) storage.removeItem(SETTINGS_KEY);
    else storage.setItem(SETTINGS_KEY, previous);
    throw error;
  }
}
