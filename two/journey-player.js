import { JOURNEY_MUSIC } from './journey-music.js';

const directory = new URL('../audio/music/', import.meta.url);
// Four milliseconds of silence let both media elements receive the first user gesture on iOS.
const silence = 'data:audio/wav;base64,UklGRkQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSAAAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';

export function createJourneyPlayer(ctx, master) {
  const bus = ctx.createGain();
  bus.connect(master);
  let files = null, manifestRetry = 0, manifestStarted = 0;
  const retry = new Map();
  let current = null, resumeDeck = null, duckUntil = 0, busLevel = 1;
  let forecast = null, forecastSince = 0, nextWarm = 0;

  // Stream the full-length masters. Even on a long journey at most two streams
  // are in memory, and the outgoing track continues while the next one buffers.
  const decks = Array.from({ length: 2 }, () => {
    const media = new Audio();
    media.preload = 'none';
    const gain = ctx.createGain();
    gain.gain.value = 0;
    ctx.createMediaElementSource(media).connect(gain).connect(bus);
    return { media, gain, file: null, status: 'idle', generation: 0, retireAt: 0, primed: false };
  });

  function unlock() {
    loadManifest(ctx.currentTime);
    for (const deck of decks) {
      if (deck.primed || deck.file) continue;
      deck.primed = true;
      deck.media.src = silence;
      deck.media.play().catch(() => { deck.primed = false; });
    }
  }

  function loadManifest(now) {
    if (now < manifestRetry) return;
    manifestStarted = now;
    manifestRetry = Infinity;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch(new URL('available.json', directory), { cache: 'no-cache', signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Music index unavailable');
        return response.json();
      })
      .then(index => {
        files = Array.isArray(index) ? new Map(index.map(name => [name, ''])) :
          new Map(Object.entries(index).map(([name, details]) => [name, details.sha256.slice(0, 12)]));
      })
      .catch(() => { files = new Map(); manifestRetry = ctx.currentTime + 30; })
      .finally(() => clearTimeout(timeout));
  }

  function pause(deck) {
    ++deck.generation;
    deck.media.pause();
    deck.status = 'idle';
    deck.retireAt = 0;
    deck.gain.gain.cancelScheduledValues(ctx.currentTime);
    deck.gain.gain.setValueAtTime(0, ctx.currentTime);
  }

  function prepare(deck, file, preload) {
    if (deck.file !== file || deck.media.error) {
      pause(deck);
      deck.file = file;
      deck.repeatAfter = 0;
      deck.media.preload = preload;
      const url = new URL(file, directory);
      const version = files.get(file);
      if (version) url.searchParams.set('v', version);
      deck.media.src = url.href;
      deck.media.loop = true;
    }
  }

  function start(deck, now) {
    const generation = ++deck.generation;
    deck.status = 'loading';
    deck.started = now;
    deck.position = deck.media.currentTime;
    deck.progressAt = now;
    deck.media.play().then(() => {
      if (deck.generation === generation) {
        deck.status = 'playing';
        deck.progressAt = ctx.currentTime;
      }
    }).catch(() => {
      if (deck.generation === generation) deck.status = 'failed';
    });
  }

  function switchTo(next, now, gain = .28) {
    if (current === next) return;
    if (current) {
      current.gain.gain.setTargetAtTime(0, now, .49);
      current.retireAt = now + 2.4;
    }
    current = next;
    if (next) {
      next.retireAt = 0;
      // The target gains leave room for nearby instruments, surf, and bike foley.
      next.gain.gain.setTargetAtTime(gain, now, .30);
    }
  }

  function warm(spare, cue, now) {
    if (cue !== forecast) {
      forecast = cue;
      forecastSince = now;
    }
    const file = JOURNEY_MUSIC[cue]?.file;
    const net = globalThis.navigator?.connection;
    if (!files.has(file) || file === current.file || file === spare.file ||
        now < forecastSince + .7 || now < nextWarm || now < (retry.get(file) || 0) ||
        net?.saveData || ['slow-2g', '2g', '3g'].includes(net?.effectiveType)) return;
    // Only the likely next cue gets a metadata request; the browser buffers the
    // actual stream on entry. A flickering boundary must not churn downloads.
    prepare(spare, file, 'metadata');
    nextWarm = now + 4;
  }

  function continueCue(track, upcoming, now) {
    const spare = decks.find(deck => deck !== current);
    if (spare.retireAt) return;
    const remaining = current.media.duration - current.media.currentTime;
    const lead = track.repeatLead;
    if (remaining < lead + 6 && current.media.duration > 2 * (lead + 6) &&
        now >= (current.repeatAfter || 0)) {
      // Use the same two streams for a long stay. The native loop remains
      // enabled on the audible deck if the standby one cannot start in time.
      prepare(spare, current.file, 'auto');
      if (spare.status === 'idle') {
        spare.media.preload = 'auto';
        if (spare.media.currentTime > 0) spare.media.currentTime = 0;
        if (remaining <= lead) start(spare, now);
      }
      if (spare.status === 'playing' && spare.media.currentTime > (track.fadeInAt ?? .15)) switchTo(spare, now, track.gain);
      return;
    }
    if (spare.status !== 'idle') pause(spare);
    warm(spare, upcoming, now);
  }

  // Let normal startup finish without briefly playing the old score. A slow request,
  // unavailable master or failed stream hands the scene back to the local score.
  function update(cue, indoors, upcoming) {
    const now = ctx.currentTime;
    loadManifest(now);
    const level = (indoors ? .86 : 1) * (now < duckUntil ? .49 : 1);
    if (level !== busLevel) {
      bus.gain.setTargetAtTime(level, now, level < busLevel ? .05 : .32);
      busLevel = level;
    }
    const track = JOURNEY_MUSIC[cue];
    const file = track?.file;
    if (!files) return now - manifestStarted < 1.5;
    for (const deck of decks) {
      if (deck.retireAt && now >= deck.retireAt) pause(deck);
      if (deck.status === 'idle') continue;
      if (deck.status === 'playing' && deck.position !== deck.media.currentTime) {
        deck.position = deck.media.currentTime;
        deck.progressAt = now;
      }
      if (deck.status === 'failed' || deck.media.error || now - deck.progressAt > 15) {
        if (current && current !== deck && current.file === deck.file) current.repeatAfter = now + 30;
        else retry.set(deck.file, now + 30);
        if (current === deck) current = null;
        pause(deck);
        deck.file = null; // A later retry must reload a failed resource.
      }
    }
    if (!files.has(file) || now < (retry.get(file) || 0)) {
      switchTo(null, now);
      for (const deck of decks) {
        if (!deck.retireAt && deck.status !== 'idle') pause(deck);
      }
      return false;
    }
    if (current?.file === file) {
      continueCue(track, upcoming, now);
      return now - current.progressAt < 2;
    }
    const next = (!current && resumeDeck?.file === file ? resumeDeck : decks.find(deck => deck.file === file))
      || decks.find(deck => deck !== current);
    // Let the outgoing tail finish before reusing its element for a third destination.
    if (next.file !== file && next.retireAt) return Boolean(current);
    prepare(next, file, 'none');
    if (next.status === 'idle') start(next, now);
    if (next.status === 'playing' && (!current || next.media.currentTime > (track.fadeInAt ?? .15))) switchTo(next, now, track.gain);
    // A rapid return while another cue buffers must never start that abandoned cue.
    for (const deck of decks) {
      if (deck !== next && deck !== current && !deck.retireAt && deck.status !== 'idle') pause(deck);
    }
    return (current && now - current.progressAt < 2) || (next.status === 'loading' && now - next.started < 1.5);
  }

  function duck(duration) {
    duckUntil = Math.max(duckUntil, ctx.currentTime + duration);
    bus.gain.setTargetAtTime(Math.min(busLevel, .45), ctx.currentTime, .035);
    busLevel = .45;
  }

  function stop() {
    resumeDeck = current || resumeDeck;
    for (const deck of decks) pause(deck);
    current = null;
    duckUntil = 0;
  }
  return { bus, unlock, update, duck, stop };
}
