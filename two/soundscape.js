// The original synthesis and mixer in this module are released under CC0-1.0.
// The field recordings and foley have separate credits in ../audio/CREDITS.txt.
import { FOREST_LAKE, lakeRadius } from './snow-country.js';
import { MARKET_STALLS, REGIONS, bridgeAt, nearRoad, overheadHeight, regionAt, riverHalfWidth, riverZ, seasonAt,
  shoreDistance, wrapCoord, wrapDelta } from './terrain.js';
import { onMountOtowa } from './kiyomizu-layout.js';
import { lightAtMinute } from './world-clock.js';
import { MOUNTAIN_STREAMS } from './mountain-streams.js';
import { POUNDING } from './festival.js';
import { createTempleBell } from './kiyomizu-bell.js';
import { palaceInteriorAt } from './ryugu-layout.js';
import { journeyMusicCue } from './journey-music.js';
import { createJourneyPlayer } from './journey-player.js';
import { isGroundedDango } from './dango-roll.js';

const places = Object.fromEntries(REGIONS.map(place => [place.id, place]));
const loops = { bamboo: 27, river: 24, wind: 23, crickets: 25, shore: 29, paddy: 21,
  'inari-rain-drops': 19, 'inari-rain-curtain': 23 };
// The night insects and surf recordings are substantially louder than the wind.
const fieldGain = { bamboo: .48, river: .48, wind: .78, crickets: .39, shore: .43, paddy: .55,
  'inari-rain-drops': .77, 'inari-rain-curtain': .73 };
const crockeryStalls = [1, 3, 5].map(index => {
  const [x, z] = MARKET_STALLS[index];
  return { x, z };
});
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

export function landscapeMix(p, season = seasonAt(p.x, p.z), weather) {
  const shore = shoreDistance(p.x, p.z);
  const coast = reach(Math.max(0, shore), 78);
  const offshore = reach(Math.max(0, -shore), 90);
  const surface = reach(p.diveDepth || 0, 12);
  const bank = Math.max(0, Math.abs(p.z - riverZ(p.x)) - riverHalfWidth(p.x));
  const river = reach(bank, 64) * (1 - coast);
  const lakeshore = reach(Math.abs(lakeRadius(p.x,p.z)-1)*FOREST_LAKE.rz,26);
  const creek = proximity(p, places.autumn, 44) * reach(Math.abs(p.z + 130 - 3.3 * Math.sin((p.x - 292) / 15)), 23);
  let falls=0;
  for(const {fall} of MOUNTAIN_STREAMS){
    const {x,y,z}=fall.toe;
    const distance=Math.hypot(p.x-x,(p.y??y)-y,p.z-z);
    falls=Math.max(falls,reach(distance,62));
  }
  const paddy = proximity(p, places.terraces, 99);
  const hush = (1 - .95 * season.moon) * (1 - .96 * season.snow);
  const high = reach(Math.max(0, (p.h || 0) - 2), 38);
  const rain = clamp(weather?.rain || 0), downpour = clamp(weather?.downpour || 0);
  const wind = .045 + .32 * season.snow + .16 * season.autumn + .09 * coast + .15 * (1 - high);
  return {
    // Birds recede behind the heavier curtain. Near drops remain distinct
    // on the leaves even with the shrine melody playing underneath.
    'inari-rain-drops': .145 * Math.sqrt(rain),
    'inari-rain-curtain': .115 * downpour ** 1.4,
    bamboo: (1 - .55 * rain) * (.27 + .13 * proximity(p, places.shrine, 95)) * hush * (1 - .75 * coast) * high * offshore * surface,
    river: Math.max(.40 * Math.max(river, creek, .44*lakeshore) * high, .76 * falls) * (.40 + .60 * surface),
    wind: (p.vessel?.exposed ? Math.max(.36, wind) : wind) * surface,
    crickets: (.29 * season.moon + .075 * season.autumn) * high * offshore * surface,
    shore: .53 * coast * (.45 + .55 * high) * (.28 + .72 * offshore) * (.24 + .76 * surface),
    paddy: .27 * paddy * (1 - season.snow) * high * surface,
  };
}

const steps = {
  grass: [0, 1], autumn: [1, 2], wood: [3, 4, 5], gravel: [6, 7], sand: [0, 6], snow: [8, 9, 10],
};

export function footSurface(p) {
  if (p.vessel) return 'wood';
  if (p.inWater) return 'water';
  if (palaceInteriorAt(p.x,p.z,p.y) || bridgeAt(p.x, p.z) || Number.isFinite(overheadHeight(p.x, p.z, p.y))) return 'wood';
  const climate = seasonAt(p.x, p.z);
  if (climate.snow > .44) return 'snow';
  if (shoreDistance(p.x, p.z) < 8) return 'sand';
  if (nearRoad(p.x, p.z)) return 'gravel';
  return climate.autumn > .44 ? 'autumn' : 'grass';
}

// Look a few seconds down the current route. Interactions can change the score
// without horizontal motion, so a nearby bike port and the offshore dive take priority.
export function upcomingMusicCue(state, cue, ports) {
  const p = state.player;
  if (cue === 'boat') return p.vessel?.docked ? state.regionId : null;
  if (p.grounded && !p.activity && p.mount !== 'turtle' && ports.some(port =>
    port.active && (port.bikes > 0 || cue === 'bike') && Math.abs(p.y - port.y) < 3 &&
    Math.hypot(wrapDelta(port.x - p.x), wrapDelta(port.z - p.z)) < 9)) {
    return cue === 'bike' ? state.regionId : 'bike';
  }
  if (cue === 'bike') return null;
  if (state.regionId === 'ryugu' && cue === 'coast' && p.inWater) return 'ryugu';

  const speed = Math.hypot(p.vx, p.vz);
  if (speed < .5 || !Number.isFinite(speed)) return null;
  const seconds = Math.min(3, 45 / speed);
  const x = wrapCoord(p.x + p.vx * seconds), z = wrapCoord(p.z + p.vz * seconds);
  const region = onMountOtowa(x, z) ? 'kyo' : REGIONS[regionAt(x, z)].id;
  let next = region;
  if (region === 'ryugu') {
    next = palaceInteriorAt(x, z, p.y) ? 'palace' : p.diveDepth > 0 ? 'ryugu' : 'coast';
  }
  return next === cue ? null : next;
}

export function createSoundscape(ctx, master, channels = {}) {
  const effects = channels.effects ?? master;
  const music = createJourneyPlayer(ctx, channels.music ?? master);
  function outdoorFilter(destination) {
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 14000;
    filter.Q.value = .52;
    filter.connect(destination);
    return filter;
  }
  const outdoor = outdoorFilter(channels.ambient ?? master);
  const outdoorEffects = outdoorFilter(effects);
  const templeBell = createTempleBell(ctx, outdoorEffects);
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
        layer.source.connect(layer.amp).connect(layer.id ? music.bus : outdoor);
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

  function note(start, hz, to, duration, level, pan = 0, type = 'sine', dest = effects) {
    if (level < .001) return;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(hz, start);
    osc.frequency.exponentialRampToValueAtTime(to, start + duration);
    const end = envelope(osc, dest, start, duration, level, pan);
    osc.start(start); osc.stop(end + .005);
  }

  function brush(start, from, to, duration, level, pan = 0, dest = effects) {
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
    src.connect(amp).connect(stereo).connect(effects);
    oneShots.add(src);
    src.onended = () => { oneShots.delete(src); src.disconnect(); amp.disconnect(); stereo.disconnect(); };
    src.start(now, slot * .75, .69);
  }

  let lastTime = null, lastSurface = null, lastX = 0, lastZ = 0, lastDepth = 0, onGround = true, wasWet = false;
  let travelled = 0, lastStep = 0, nextMix = 0, nextActivity = 0, nextBell = 0;
  let lastBeat = null, objectList, baths = [], ports = [], nearestBath, bathGain = 0, inside = false;
  let drummer = null, drumBeat = null, drumGain = 0;

  function updateEnvironment(state, now) {
    const p = state.player;
    const climate=lightAtMinute(seasonAt(p.x,p.z),p.worldMinute);
    const weights = landscapeMix(p,climate,state.inariWeather);
    // A narrow torii lintel catches drops but admits sound from both sides.
    // A roof, the ship's hold or a bridge deck muffles the outdoor mix.
    const inPalace=palaceInteriorAt(p.x,p.z,p.y);
    const roof = inPalace || p.vessel?.exposed === false || Number.isFinite(overheadHeight(p.x, p.z, p.y, 0, state.regionId === 'inari'));
    inside=roof;
    const submerged=clamp((p.diveDepth||0)/4);
    const cutoff = (roof ? 1250 : 14000) * (1 - submerged) + 690 * submerged;
    outdoor.frequency.setTargetAtTime(cutoff, now, .22);
    outdoorEffects.frequency.setTargetAtTime(cutoff, now, .22);
    for (const layer of layers) mixBed(layer, weights[layer.name] * fieldGain[layer.name] * (roof ? .4 : 1), now);
    if (objectList !== state.objects) {
      objectList = state.objects;
      baths = objectList.filter(obj => obj.type === 'onsen');
      ports = objectList.filter(obj => obj.type === 'port');
    }
    const cue = journeyMusicCue(state, inPalace);
    const hasMaster = music.update(cue, roof, upcomingMusicCue(state, cue, ports));
    const fallbackId = state.regionId === 'ryugu' && !inPalace && !p.diveDepth ? 'coast' : state.regionId;
    for (const score of scores) mixBed(score, !hasMaster && score.id === fallbackId ? .18 : 0, now);
    bathGain = 0;
    for (const bath of baths) {
      const volume = reach(Math.hypot(wrapDelta(bath.x-p.x),wrapDelta(bath.z-p.z),(bath.y??p.y)-p.y),13);
      if (volume > bathGain) { nearestBath = bath; bathGain = volume; }
    }
    let nearestDrummer = null;
    drumGain = 0;
    if (state.regionId === 'ryugu' && (p.diveDepth > 0 || inPalace)) {
      for (const npc of state.nearbyNpcs || []) {
        if (npc.type !== 'seaTurtle') continue;
        const gain = reach(Math.hypot(npc.x-p.x, npc.y-p.y, npc.z-p.z), 12);
        if (gain > drumGain) { drumGain = gain; nearestDrummer = npc; }
      }
    }
    if (nearestDrummer !== drummer) drumBeat = null;
    drummer = nearestDrummer;
    load('footfalls', now);
    if (state.regionId === 'inari') load('inari-thunder', now);
  }


  let thunderVoice = null, lastThunderId = -1, nextThunder = 0;
  function distantThunder(state, time, yaw, now, moving) {
    const weather = state.inariWeather;
    if (state.regionId !== 'inari') {
      if (thunderVoice) { thunderVoice.stop(); thunderVoice = null; }
      return;
    }
    // Play only when the travel clock crosses this thunderfront. A reopened
    // menu, save, or camera cannot collect strikes that occurred in its absence.
    if (!moving || !weather || weather.thunder <= .006 || weather.thunderId === lastThunderId ||
        now < nextThunder || !(lastTime < weather.thunderAt && weather.thunderAt <= time)) return;
    const buffer = samples.get('inari-thunder');
    if (!buffer) return;
    const source = ctx.createBufferSource(), amp = ctx.createGain(), pan = ctx.createStereoPanner();
    const origin = {x: weather.thunderX, z: weather.thunderZ};
    source.buffer = buffer;
    source.playbackRate.value = .88 + .22 * ((weather.thunderId >>> 8) % 101) / 100;
    amp.gain.value = .145 * weather.thunder * (inside ? .48 : 1);
    pan.pan.value = .56 * panTo(state.player, origin, yaw);
    source.connect(amp).connect(pan).connect(outdoor);
    oneShots.add(source);
    source.onended = () => {
      oneShots.delete(source); source.disconnect(); amp.disconnect(); pan.disconnect();
      if (thunderVoice === source) thunderVoice = null;
    };
    thunderVoice = source;
    lastThunderId = weather.thunderId;
    nextThunder = now + 14;
    source.start(now);
  }

  function landmarks(state, time, yaw, now) {
    const p = state.player;
    if (drummer) {
      // The two mallets reach the drumhead at opposite extrema of the same pose.
      const beat = Math.floor((drummer.beat - Math.PI / 2) / Math.PI);
      if (drumBeat !== null && beat === drumBeat + 1 && drummer.gesture > .88) {
        const pan = panTo(p, drummer, yaw), gain = drumGain * (inside ? .4 : 1);
        note(now, 156, 86, .24, .17 * gain, pan, 'sine', outdoorEffects);
        brush(now, 820, 340, .065, .12 * gain, pan, outdoorEffects);
      }
      drumBeat = beat;
    }
    const beat = Math.floor(time / POUNDING.period - POUNDING.strike);
    if (lastBeat !== null && beat > lastBeat && beat === lastBeat + 1) {
      const gain = proximity(p, POUNDING, 47) * (inside ? .42 : 1);
      if (gain > .01) {
        const pan = panTo(p, POUNDING, yaw);
        // Mallet hits the sticky rice before the hollow wooden shell rings.
        brush(now, 1380, 280, .08, gain * .39, pan, outdoorEffects);
        note(now, 137, 77, .21, gain * .31, pan, 'sine', outdoorEffects);
        note(now + .009, 327, 292, .115, gain * .083, pan, 'triangle', outdoorEffects);
      }
    }
    lastBeat = beat;
    if (now < nextBell) return;
    let source = places.shrine, nearest = proximity(p, source, 38);
    for (const stall of crockeryStalls) {
      const gain = proximity(p, stall, 22);
      if (gain > nearest) { source = stall; nearest = gain; }
    }
    const gain = nearest * reach(p.h || 0, 27) * (inside ? .6 : 1);
    if (gain < .03) { nextBell = now + 1; return; }
    nextBell = now + 6.5 + Math.random() * 9;
    const isShrine = source === places.shrine, pan = panTo(p, source, yaw);
    const hz = isShrine ? 1073 : 681;
    for (const [ratio, volume, duration] of [[1, .07, 1.55], [2.64, .031, .87], [4.01, .021, .29]]) {
      note(now, hz * ratio, hz * ratio * .995, duration * (isShrine ? 1 : .36), gain * volume, pan, 'sine', outdoorEffects);
    }
  }

  let lastRinseTime=0;
  function activity(p, yaw, now, photo) {
    const rinse=p.bathPose?.action==='rinse' ? p.activityTime : 0;
    if(!photo && rinse>0 && lastRinseTime>1.20 && rinse<=1.20){
      // Tip the dipper when its lip actually reaches the shoulder.
      brush(now,2050,670,.45,.18,.15);
      splash(now+.26,.095,-.06);
    }
    lastRinseTime=rinse;
    if (now < nextActivity) return;
    nextActivity = now + .55 + Math.random() * .37;
    if (bathGain > .04) {
      const pan = panTo(p, nearestBath, yaw);
      const kind=nearestBath.retreat?.kind;
      if(kind==='sakai' && nearestBath.rank==='main'){
        brush(now,2750,1160,.64,bathGain*(inside?.10:.045),pan,outdoor);
      }else{
        const shower=nearestBath.rank==='main' && ['inari','maple','bamboo'].includes(kind);
        if(shower)brush(now,1690,970,.67,.093*bathGain,pan,outdoor);
        for (let i=0;i<(shower?2:3);i++){
          const hz=kind==='earthen'?245+Math.random()*130:240+Math.random()*390;
          note(now+.065*i,hz,hz*1.56,kind==='earthen'?.18:.09,.057*bathGain,pan,'sine',outdoor);
        }
      }
    }
    if (photo) return;
    if (p.activity === 'read') brush(now, 2300, 5200, .21, .085, -.12);
    if (['drink', 'tea', 'chaya'].includes(p.activity)) note(now, 330, 545, .095, .07);
    if (['eat', 'mitarashi', 'tsukimi'].includes(p.activity)) brush(now, 1350, 260, .17, .083);
    if (p.mode === 'habutae' && !p.grounded && !p.diveDepth) brush(now, 980, 320, .45, .12 * clamp(.28 + p.speed / 18));
  }

  function update(state, time, yaw, photo) {
    const p = state.player, now = ctx.currentTime;
    if (now >= nextMix) {
      updateEnvironment(state, now);
      nextMix = now + .14;
    }
    const moving = lastTime !== null && time > lastTime && time - lastTime < .4;
    distantThunder(state, time, yaw, now, moving);
    const bellLevel = templeBell.update(state.bellStrike, p, yaw, state.time, inside);
    if (bellLevel * (channels.effects?.gain.value ?? 1) > .75) music.duck(1.25);
    if (!moving) lastBeat = drumBeat = null;
    landmarks(state, time, yaw, now);
    activity(p, yaw, now, photo);
    const enteredWater = !photo && lastTime !== null && p.inWater && !wasWet;
    if (enteredWater) enterWater(p.impact || 0);
    const depth = p.diveDepth || 0;
    // Use the hull's own coordinates: a passenger standing on a turning deck
    // travels through the world without covering any distance on its planks.
    const vessel = p.vessel, surface = vessel?.id ?? p.skiff ?? null;
    const x = vessel?.u ?? p.x, z = vessel?.v ?? p.z;
    if (!photo && moving) {
      const distance = surface === lastSurface ? Math.hypot(wrapDelta(x - lastX), wrapDelta(z - lastZ), depth - lastDepth) : 0;
      if (surface !== lastSurface) travelled = 0;
      if (distance < 6 && (p.grounded || depth > 0) && !p.activity && !p.skiff) {
        travelled += distance;
        const landing = p.grounded && !onGround && p.landing > 0;
        if (enteredWater) { travelled = 0; lastStep = now; }
        else if (landing) {
          if (!vessel || distance > .0001) footfall(p, .28 + .37 * p.impact);
          if (!p.inWater) note(now + .003, 143, 70, .13, .075 * p.impact);
          travelled = 0; lastStep = now;
        } else if (distance > .0001 && travelled > (p.mount || p.mode === 'dango' ? 2.25 : 1.33) && now - lastStep > (depth ? .55 : .19)) {
          travelled = 0; lastStep = now;
          if (depth > 0) {
            const pan = ++stepIndex % 2 ? -.14 : .14;
            brush(now, 570, 205, .34, .17, pan);
            note(now + .10, 285, 405, .085, .045, pan);
          } else if (p.mount === 'bike') {
            const speed = clamp(p.speed / 46);
            brush(now, 640 + 560 * speed, 310, .23, .10 + .07 * speed);
            note(now + .021, 610, 315, .048, .033, .08, 'triangle');
          } else if (isGroundedDango(p)) {
            const speed = clamp(p.speed / 23.6);
            const ground = footSurface(p);
            // The rice brushes softly across turf; grit brightens as the roll gathers speed.
            const grain = ground === 'gravel' ? 780 : ground === 'wood' ? 510 : 340;
            brush(now, grain * (.76 + .74 * speed), 155 + 105 * speed, .19 + .13 * speed, .055 + .085 * speed);
          } else footfall(p, p.mount === 'turtle' ? .32 : .23);
        }
      } else travelled = 0;
    } else travelled = 0;
    lastTime = time; lastSurface = surface; lastX = x; lastZ = z; lastDepth = depth; onGround = p.grounded; wasWet = p.inWater;
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
    music.stop();
    templeBell.stop();
    for (const layer of [...layers, ...scores]) stopLayer(layer);
    for (const source of oneShots) source.stop();
    thunderVoice = null;
    lastTime = lastBeat = null;
    travelled = nextMix = 0;
  }

  return { update, stop, enterWater, unlock: music.unlock, duckMusic: music.duck };
}
