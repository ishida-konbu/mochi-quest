import test from 'node:test';
import assert from 'node:assert/strict';
import { createSoundscape, landscapeMix, upcomingMusicCue } from '../two/soundscape.js';
import { palacePoint, PALACE_BED } from '../two/ryugu-layout.js';
import { REGIONS, coastX } from '../two/terrain.js';

test('surf peaks at the beach and breaks more quietly offshore', () => {
  const coast = REGIONS.find(r => r.id === 'coast');
  const beach = { x: coastX(coast.z), z: coast.z, y: 0, h: 0 };
  const offshore = { x: -900, z: 400, y: 0, h: 0 };
  const near = landscapeMix(beach), far = landscapeMix(offshore);
  assert.ok(near.shore > 3 * far.shore && far.shore > 0);
  assert.ok(near.bamboo > 0);
  assert.equal(far.bamboo, 0);
});

test('submerging gradually removes airborne sounds while a low surf bed remains', () => {
  const sea = REGIONS.find(r => r.id === 'ryugu');
  const atDepth = diveDepth => landscapeMix({ ...sea, h: 0, y: -diveDepth, diveDepth });
  const surface = atDepth(0), shallow = atDepth(5), deep = atDepth(22);
  assert.ok(surface.shore > shallow.shore && shallow.shore > deep.shore && deep.shore > 0);
  assert.ok(surface.wind > shallow.wind && shallow.wind > 0);
  assert.equal(deep.wind, 0);
  assert.equal(deep.bamboo, 0);
});

test('a moving deck carries its own breeze and only footsteps taken across its planks', async t => {
  const originalAudio = globalThis.Audio;
  globalThis.Audio = class { pause() {} };
  t.after(() => { if (originalAudio) globalThis.Audio = originalAudio; else delete globalThis.Audio; });
  t.mock.method(globalThis, 'fetch', async url => ({
    ok: true, json: async () => ({}), arrayBuffer: async () => url.pathname.split('/').pop(),
  }));
  const started = [];
  const parameter = () => ({ value: 1, setTargetAtTime(value) { this.value = value; },
    setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect(target) { this.output = target; return target; }, disconnect() {} });
  const ctx = {
    currentTime: 0, sampleRate: 100,
    createGain: () => ({ ...node(), gain: parameter() }),
    createDelay: () => ({ ...node(), delayTime: parameter() }),
    createOscillator: () => ({ ...node(), frequency: parameter(), start() {}, stop() {} }),
    createBiquadFilter: () => ({ ...node(), frequency: parameter(), Q: parameter() }),
    createStereoPanner: () => ({ ...node(), pan: parameter() }),
    createMediaElementSource: node, createBuffer: () => ({ getChannelData: () => [] }),
    decodeAudioData: async name => ({ name, duration: 25 }),
    createBufferSource: () => ({ ...node(), playbackRate: parameter(), stop() {},
      start(when, offset) { started.push({ source: this, offset }); } }),
  };
  const ambient = node(), effects = { ...node(), gain: parameter() };
  const sound = createSoundscape(ctx, node(), { ambient, effects });
  const vessel = { id: 'merchant', u: .3, v: 4, exposed: true, docked: false };
  const p = { x: -850, z: 610, y: 3.6, h: 0, grounded: true, vessel };
  const state = { regionId: 'tsuruga', objects: [], player: p, time: 0 };
  const frames = (count, stride = 0) => {
    for (let i = 0; i < count; i++) {
      p.x += .9;
      if (p.vessel) p.vessel.v += stride;
      ctx.currentTime = state.time += .1;
      sound.update(state, state.time, 0, false);
    }
  };
  const footsteps = () => started.filter(({ source }) => source.buffer.name === 'footfalls.mp3');
  frames(1);
  await new Promise(resolve => setImmediate(resolve));
  frames(24);
  assert.equal(footsteps().length, 0);
  const wind = started.find(({ source }) => source.buffer.name === 'wind.mp3').source;
  assert.equal(wind.output.output.output, ambient);
  const deckWind = wind.output.gain.value;
  frames(15, .3);
  assert.ok(footsteps().length >= 2);
  for (const { source, offset } of footsteps()) {
    assert.ok([3, 4, 5].includes(offset / .75));
    assert.equal(source.output.output.output, effects);
  }
  const walkingCount = footsteps().length;
  frames(25);
  assert.equal(footsteps().length, walkingCount);
  p.grounded = false;
  frames(3);
  Object.assign(p, { grounded: true, landing: .25, impact: .5 });
  frames(1);
  assert.equal(footsteps().length, walkingCount);
  vessel.exposed = false;
  frames(3);
  assert.ok(wind.output.gain.value < deckWind / 2);
  p.vessel = null; p.skiff = 'river-boat';
  frames(25);
  assert.equal(footsteps().length, walkingCount);
  p.skiff = null;
  frames(8);
  assert.ok(footsteps().length > walkingCount);
});

test('music lookahead follows the actual travel direction and available bike ports', () => {
  const p = { x: 0, z: 0, y: 1, vx: 0, vz: -3, grounded: true };
  const state = { regionId: 'river', player: p };
  assert.equal(upcomingMusicCue(state, 'river', []), 'market');
  p.vz = 3;
  assert.equal(upcomingMusicCue(state, 'river', []), null);
  const port = { x: 0, z: 2, y: 1, bikes: 1, active: true };
  assert.equal(upcomingMusicCue(state, 'river', [port]), 'bike');
  port.bikes = 0;
  assert.equal(upcomingMusicCue(state, 'river', [port]), null);
  p.mount = 'bike';
  assert.equal(upcomingMusicCue(state, 'bike', [port]), 'river');
  assert.equal(upcomingMusicCue(state, 'bike', []), null);
  p.mount = null;
  p.vessel = { docked: false };
  assert.equal(upcomingMusicCue(state, 'boat', [port]), null);
  p.vessel.docked = true;
  assert.equal(upcomingMusicCue(state, 'boat', [port]), 'river');
});

test('music lookahead prepares the dive at the surface and the palace at its water gate', () => {
  const p = { ...palacePoint(0, -5), y: 0, vx: 0, vz: 0, inWater: true };
  const state = { regionId: 'ryugu', player: p };
  assert.equal(upcomingMusicCue(state, 'coast', []), 'ryugu');
  Object.assign(p, { vx: -3, y: PALACE_BED + 1, diveDepth: 39 });
  assert.equal(upcomingMusicCue(state, 'ryugu', []), 'palace');
});
