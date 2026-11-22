// The original synthesis and mixer in this module are released under CC0-1.0.
// The field recordings and foley have separate credits in ../audio/CREDITS.txt.
import { REGIONS, bridgeAt, nearRoad, overheadHeight, riverHalfWidth, riverZ, seasonAt,
  shoreDistance, wrapDelta } from './terrain.js';
import { kyoNight, kyoInfluence } from './kyo-layout.js';
import { POUNDING } from './festival.js';

const places = Object.fromEntries(REGIONS.map(place => [place.id, place]));
const loops = { bamboo: 27, river: 24, wind: 23, crickets: 25, shore: 29, paddy: 21 };
const clamp = value => Math.min(1, Math.max(0, value));

function reach(distance, radius) {
  const t = clamp(1 - distance / radius);
  return t * t * (3 - 2 * t);
}

function proximity(player, place, radius) {
  return reach(Math.hypot(wrapDelta(place.x - player.x), wrapDelta(place.z - player.z)), radius);
}

// Stereo sources retain their original microphone image. Only localized instruments are panned.
function panTo(p, source, yaw) {
  const dx = wrapDelta(source.x - p.x), dz = wrapDelta(source.z - p.z);
  return .87 * (dx * Math.cos(yaw) - dz * Math.sin(yaw)) / Math.max(3, Math.hypot(dx, dz));
}

export function landscapeMix(p, season = seasonAt(p.x, p.z)) {
  const coast = reach(Math.max(0, shoreDistance(p.x, p.z)), 78);
  const bank = Math.max(0, Math.abs(p.z - riverZ(p.x)) - riverHalfWidth(p.x));
  const river = reach(bank, 64) * (1 - coast);
  const creek = proximity(p, places.autumn, 44) * reach(Math.abs(p.z + 130 - 3.3 * Math.sin((p.x - 292) / 15)), 23);
  const paddy = proximity(p, places.terraces, 99);
  const hush = (1 - .95 * season.moon) * (1 - .96 * season.snow);
  const high = reach(Math.max(0, p.h - 2), 38);
  return {
    bamboo: (.27 + .13 * proximity(p, places.shrine, 95)) * hush * (1 - .75 * coast) * high,
    river: .40 * Math.max(river, creek) * high,
    wind: .045 + .32 * season.snow + .16 * season.autumn + .09 * coast + .15 * (1 - high),
    crickets: (.29 * season.moon + .075 * season.autumn) * high,
    shore: .53 * coast * (.45 + .55 * high),
    paddy: .27 * paddy * (1 - season.snow) * high,
  };
}

const steps = {
  grass: [0, 1], autumn: [1, 2], wood: [3, 4, 5], gravel: [6, 7], sand: [0, 6], snow: [8, 9, 10],
};

export function footSurface(p) {
  if (p.inWater) return 'water';
  if (bridgeAt(p.x, p.z) || Number.isFinite(overheadHeight(p.x, p.z, p.y))) return 'wood';
  const climate = seasonAt(p.x, p.z);
  if (climate.snow > .44) return 'snow';
  if (shoreDistance(p.x, p.z) < 8) return 'sand';
  if (nearRoad(p.x, p.z)) return 'gravel';
  return climate.autumn > .44 ? 'autumn' : 'grass';
}

export function createSoundscape(ctx, master) {
  const outdoor = ctx.createBiquadFilter();
  outdoor.type = 'lowpass';
  outdoor.frequency.value = 14000;
  outdoor.Q.value = .52;
  outdoor.connect(master);
  const layers = Object.keys(loops).map(name => ({ name, source: null, amp: null, level: 0, lastHeard: 0 }));
  const scores = REGIONS.map(({id}) => ({ name: 'score-'+id, id, source:null, amp:null, level:0, lastHeard:0 }));
  const samples = new Map();
  const pending = new Set(), retries = new Map(), oneShots = new Set();
  const noise = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .7), ctx.sampleRate);
  const values = noise.getChannelData(0);
  for (let i = 0; i < values.length; i++) values[i] = 2 * Math.random() - 1;

  // Defer fetching and decoding to the first gesture and the first visit within earshot.
  // Requests which finish during a pause only populate the cache.
  function load(name, now) {
    if (samples.has(name) || pending.has(name) || now < (retries.get(name) || 0)) return;
    pending.add(name);
    const file = new URL('../audio/journey/' + name + '.mp3', import.meta.url);
    fetch(file).then(response => {
      if (!response.ok) throw new Error(String(response.status));
      return response.arrayBuffer();
    }).then(data => ctx.decodeAudioData(data)).then(buffer => {
      samples.set(name, buffer);
    }).catch(() => retries.set(name, ctx.currentTime + 20)).finally(() => pending.delete(name));
  }

  function stopLayer(layer) {
    if (!layer.source) return;
    layer.source.stop();
    layer.source.disconnect(); layer.amp.disconnect();
    layer.source = layer.amp = null;
    layer.level = 0;
  }

  function mixBed(layer, volume, now) {
    if (volume > .003) {
      layer.lastHeard = now;
      load(layer.name, now);
      const buffer = samples.get(layer.name);
      if (!layer.source && buffer) {
        layer.source = ctx.createBufferSource(); layer.amp = ctx.createGain();
        layer.source.buffer = buffer;
        layer.source.loop = true;
        // Both ends carry a quarter-second continuation of the loop. This keeps MP3
        // priming and padding outside the seam even on decoders that retain them.
        layer.source.loopStart = layer.id ? 0 : .25;
        layer.source.loopEnd = layer.id ? buffer.duration : .25 + loops[layer.name];
        layer.amp.gain.value = 0;
        layer.source.connect(layer.amp).connect(outdoor);
        layer.source.start(0, layer.id ? 0 : .25 + now % loops[layer.name]);
      }
    } else {
      if (now - layer.lastHeard > (layer.id ? 6 : 2.8)) stopLayer(layer);
      if (now - layer.lastHeard > 36) samples.delete(layer.name);
      volume = 0;
    }
    if (layer.source && Math.abs(layer.level - volume) > .001) {
      layer.amp.gain.setTargetAtTime(volume, now, layer.id ? 1.05 : .36);
      layer.level = volume;
    }
  }

  function envelope(source, destination, start, duration, strength, pan, filter) {
    const amp = ctx.createGain(), position = ctx.createStereoPanner();
    const end = start + duration;
    amp.gain.setValueAtTime(.00001, start);
    amp.gain.exponentialRampToValueAtTime(Math.max(.00002, strength), start + .007);
    amp.gain.exponentialRampToValueAtTime(.00001, end);
    position.pan.value = pan;
    if (filter) source.connect(filter).connect(amp);
    else source.connect(amp);
    amp.connect(position).connect(destination);
    oneShots.add(source);
    source.onended = () => {
      oneShots.delete(source);
      source.disconnect(); filter?.disconnect(); amp.disconnect(); position.disconnect();
    };
    return end;
  }

  function note(start, hz, to, duration, level, pan = 0, type = 'sine', dest = master) {
    if (level < .001) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    const end = envelope(osc, dest, start, duration, level, pan);
    osc.start(start); osc.stop(end + .005);
  }

  function brush(start, from, to, duration, level, pan = 0, dest = master) {
    if (level < .001) return;
    const src = ctx.createBufferSource(), filter = ctx.createBiquadFilter();
    src.buffer = noise; src.loop = true;
    filter.type = 'bandpass'; filter.Q.value = .64;
    filter.frequency.setValueAtTime(from, start);
    filter.frequency.exponentialRampToValueAtTime(to, start + duration);
    const end = envelope(src, dest, start, duration, level, pan, filter);
    src.start(start, Math.random() * .35); src.stop(end + .005);
  }

  function splash(now, level, pan) {
    brush(now, 2600, 460, .20, level * .70, pan);
    for (let i = 0; i < 3; i++) {
      const hz = 460 + Math.random() * 620;
      note(now + i * .032, hz, hz * 1.65, .066, level * .12, pan);
    }
  }

  let stepIndex = 0;
  function footfall(p, level) {
    const now = ctx.currentTime + .002, pan = ++stepIndex % 2 ? -.1 : .1;
    const material = footSurface(p);
    if (material === 'water') return splash(now, level * .83, pan);
    const bank = samples.get('footfalls');
    if (!bank) return;
    const choices = steps[material];
    const slot = choices[stepIndex % choices.length];
    // Each recorded impact has a padded 750 ms cell. Preserve the envelope of the recording.
    const src = ctx.createBufferSource(), amp = ctx.createGain(), stereo = ctx.createStereoPanner();
    src.buffer = bank;
    src.playbackRate.value = (material === 'grass' ? .82 : 1) * (.92 + Math.random() * .15);
    amp.gain.value = level; stereo.pan.value = pan;
    src.connect(amp).connect(stereo).connect(master);
    oneShots.add(src);
    src.onended = () => { oneShots.delete(src); src.disconnect(); amp.disconnect(); stereo.disconnect(); };
    src.start(now, slot * .75, .69);
  }

  let lastTime = null, lastX = 0, lastZ = 0, onGround = true, wasWet = false;
  let travelled = 0, lastStep = 0, nextMix = 0, nextActivity = 0, nextBell = 0;
  let lastBeat = null, objectList, baths = [], nearestBath, bathGain = 0, inside = false;

  function updateEnvironment(state, now) {
    const p = state.player;
    const climate=seasonAt(p.x,p.z);
    climate.moon=Math.max(climate.moon,kyoNight(state.time,p)*kyoInfluence(p.x,p.z));
    const weights = landscapeMix(p,climate);
    const roof = Number.isFinite(overheadHeight(p.x, p.z, p.y));
    inside=roof;
    const submerged=clamp((p.diveDepth||0)/4);
    outdoor.frequency.setTargetAtTime((roof?1250:14000)*(1-submerged)+690*submerged,now,.22);
    for (const layer of layers) mixBed(layer, weights[layer.name] * (roof ? .4 : 1), now);
    const scoreId=state.regionId==='ryugu' && !p.diveDepth ? 'coast' : state.regionId;
    for (const score of scores) mixBed(score, score.id === scoreId ? (roof ? .087 : .105) : 0, now);
    if (objectList !== state.objects) {
      objectList = state.objects;
      baths = objectList.filter(obj => obj.type === 'onsen');
    }
    bathGain = 0;
    for (const bath of baths) {
      const volume = proximity(p, bath, 13);
      if (volume > bathGain) { nearestBath = bath; bathGain = volume; }
    }
    load('footfalls', now);
  }


  function landmarks(state, time, yaw, now) {
    const p = state.player;
    const beat = Math.floor(time / POUNDING.period - POUNDING.strike);
    if (lastBeat !== null && beat > lastBeat && beat === lastBeat + 1) {
      const gain = proximity(p, POUNDING, 47) * (inside ? .42 : 1);
      if (gain > .01) {
        const pan = panTo(p, POUNDING, yaw);
        // Mallet hits the sticky rice before the hollow wooden shell rings.
        brush(now, 1380, 280, .08, gain * .39, pan, outdoor);
        note(now, 137, 77, .21, gain * .31, pan, 'sine', outdoor);
        note(now + .009, 327, 292, .115, gain * .083, pan, 'triangle', outdoor);
      }
    }
    lastBeat = beat;
    if (now < nextBell) return;
    nextBell = now + 6.5 + Math.random() * 9;
    const shrine = proximity(p, places.shrine, 46), market = proximity(p, places.market, 45);
    if (Math.max(shrine, market) < .03) return;
    const isShrine = shrine > market, gain = Math.max(shrine, market) * (inside ? .6 : 1);
    const pan = panTo(p, isShrine ? places.shrine : places.market, yaw);
    const hz = isShrine ? 1073 : 681;
    for (const [ratio, volume, duration] of [[1, .07, 1.55], [2.64, .031, .87], [4.01, .021, .29]]) {
      note(now, hz * ratio, hz * ratio * .995, duration * (isShrine ? 1 : .36), gain * volume, pan, 'sine', outdoor);
    }
  }

  function activity(p, yaw, now, photo) {
    if (now < nextActivity) return;
    nextActivity = now + .55 + Math.random() * .37;
    if (bathGain > .04) {
      const pan = panTo(p, nearestBath, yaw);
      for (let i = 0; i < 3; i++) {
        const hz = 240 + Math.random() * 390;
        note(now + .065 * i, hz, hz * 1.56, .09, .057 * bathGain, pan, 'sine', outdoor);
      }
    }
    if (photo) return;
    if (p.activity === 'read') brush(now, 2300, 5200, .21, .085, -.12);
    if (p.activity === 'drink') note(now, 330, 545, .095, .07);
    if (p.activity === 'eat') brush(now, 1350, 260, .17, .083);
    if (p.mode === 'habutae' && !p.grounded) brush(now, 980, 320, .45, .12 * clamp(.28 + p.speed / 18));
  }

  function update(state, time, yaw, photo) {
    const p = state.player, now = ctx.currentTime;
    if (now >= nextMix) {
      updateEnvironment(state, now);
      nextMix = now + .14;
    }
    const moving = lastTime !== null && time > lastTime && time - lastTime < .4;
    if (!moving) lastBeat = null;
    landmarks(state, time, yaw, now);
    activity(p, yaw, now, photo);
    const enteredWater = !photo && lastTime !== null && p.inWater && !wasWet;
    if (enteredWater) enterWater(p.impact || 0);
    if (!photo && moving) {
      const distance = Math.hypot(wrapDelta(p.x - lastX), wrapDelta(p.z - lastZ));
      if (distance < 6 && p.grounded && !p.activity) {
        travelled += distance;
        const landing = !onGround && p.landing > 0;
        if (enteredWater) { travelled = 0; lastStep = now; }
        else if (landing) {
          footfall(p, landing ? .28 + .37 * p.impact : .33);
          if (landing && !p.inWater) note(now + .003, 143, 70, .13, .075 * p.impact);
          travelled = 0; lastStep = now;
        } else if (travelled > (p.mount || p.mode === 'dango' ? 2.25 : 1.33) && now - lastStep > .19) {
          travelled = 0; lastStep = now;
          if (p.mount === 'bike') {
            brush(now, 1300, 2800, .06, .085);
            note(now + .021, 495, 260, .06, .035, .08, 'triangle');
          } else if (p.mode === 'dango' && !p.inWater) {
            brush(now, 450, 175, .25, .13);
          } else footfall(p, p.mount === 'turtle' ? .32 : .23);
        }
      } else travelled = 0;
    } else travelled = 0;
    lastTime = time; lastX = p.x; lastZ = p.z; onGround = p.grounded; wasWet = p.inWater;
  }

  function enterWater(impact = 0) {
    const now = ctx.currentTime + .003, level = .53 + .28 * impact;
    // A low slap, spreading spray, then separate drops, above the looping river.
    brush(now, 1250, 190, .32, level, -.08);
    note(now, 144, 58, .19, level*.32);
    splash(now+.025, level*.86, .12);
    for (let i=0; i<4; i++) {
      const pitch = 370 + i*107;
      note(now+.115+i*.061,pitch,pitch*1.55,.085,level*(.18-i*.03),i%2 ? .24 : -.22);
    }
  }
  function stop() {
    for (const layer of [...layers, ...scores]) stopLayer(layer);
    for (const source of oneShots) source.stop();
    lastTime = lastBeat = null;
    travelled = nextMix = 0;
  }

  return { update, stop, enterWater };
}
