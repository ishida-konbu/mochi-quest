import test from 'node:test';
import assert from 'node:assert/strict';
import { landscapeMix, upcomingMusicCue } from '../two/soundscape.js';
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
});

test('music lookahead prepares the dive at the surface and the palace at its water gate', () => {
  const p = { ...palacePoint(0, -5), y: 0, vx: 0, vz: 0, inWater: true };
  const state = { regionId: 'ryugu', player: p };
  assert.equal(upcomingMusicCue(state, 'coast', []), 'ryugu');
  Object.assign(p, { vx: -3, y: PALACE_BED + 1, diveDepth: 39 });
  assert.equal(upcomingMusicCue(state, 'ryugu', []), 'palace');
});
