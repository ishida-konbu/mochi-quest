import { SAVE_KEY, LEGACY_KEY, PREVIOUS_KEY } from './journey-transfer.js';

// Hold the writer role across synchronous autosaves, including pagehide.
// The snapshot comparison also protects a restored bfcache page or an import.
export async function claimJourneyWriter() {
  if (!navigator.locks) return true;
  return new Promise(resolve => {
    navigator.locks.request(SAVE_KEY, { ifAvailable: true }, lock => {
      resolve(Boolean(lock));
      if (lock) return new Promise(release => window.addEventListener('pagehide', release, { once: true }));
    }).catch(() => resolve(false));
  });
}

export function openJourneyStorage(storage) {
  let expected = storage.getItem(SAVE_KEY);
  const legacy = expected === null ? storage.getItem(LEGACY_KEY) : null;
  function current() {
    return storage.getItem(SAVE_KEY) === expected &&
      (expected !== null || storage.getItem(LEGACY_KEY) === legacy);
  }
  return {
    original: expected ?? legacy,
    current,
    write(snapshot) {
      if (!current()) throw new Error('conflict');
      const text = JSON.stringify(snapshot);
      if (expected !== null && expected !== text) storage.setItem(PREVIOUS_KEY, expected);
      storage.setItem(SAVE_KEY, text);
      expected = text;
    },
  };
}
