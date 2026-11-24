import test from 'node:test';
import assert from 'node:assert/strict';
import { HemisphereLight, DirectionalLight } from '../two/vendor/three.module.min.js';
import { createGame } from '../two/game.js';
import { groundHeight, REGIONS, seasonAt, waterDepth } from '../two/terrain.js';
import { REST_SITES, nearbyRestSite } from '../two/rest-sites.js';
import { applyClimateLights } from '../two/atmosphere.js';
import { DAY_MINUTES, INITIAL_WORLD_MINUTE, legacyWorldMinute, lightAtMinute, waitTargetMinute, worldClockLabel } from '../two/world-clock.js';

test('T-TIME-01 each of the seventeen landscapes follows the clock or retains its own sky', () => {
  const hemi = new HemisphereLight(), sun = new DirectionalLight(), fill = new DirectionalLight();
  for (const region of REGIONS) {
    const tones = [0, 360, 720, 1080].map(worldMinute => {
      const climate = lightAtMinute(seasonAt(region.x, region.z), worldMinute);
      applyClimateLights(hemi, sun, fill, {...region, y: 0, worldMinute});
      assert.ok(sun.intensity > 0 && fill.intensity > 0 && hemi.intensity > 0, region.name);
      return [climate.moon, climate.dawn, sun.intensity];
    });
    if (region.id === 'moon' || region.id === 'dawn') {
      for (const tone of tones) assert.deepEqual(tone, tones[0], region.name);
      assert.deepEqual(tones[0].slice(0, 2), region.id === 'moon' ? [1, 0] : [0, 1]);
    } else {
      assert.ok(tones[0][0] > .9 && tones[2][0] < .1, region.name);
      assert.ok(tones[0][2] < tones[2][2] && tones[3][1] > .25, region.name);
    }
  }
  for (const id of ['dawn', 'moon']) {
    const r = REGIONS.find(region => region.id === id);
    for (const minute of [390, 720, 1260]) {
      let last = lightAtMinute(seasonAt(r.x, r.z), minute);
      for (let x = r.x + .5; x < r.x + 200; x += .5) {
        const sample = lightAtMinute(seasonAt(x, r.z), minute);
        for (const channel of ['moon', 'dawn', 'sunWest']) assert.ok(Math.abs(sample[channel] - last[channel]) < .025);
        last = sample;
      }
    }
  }
});

test('T-TIME-02 the common clock counts active real seconds including slow frames and pauses for conversation', () => {
  const game = createGame();
  assert.equal(game.state.player.worldMinute, INITIAL_WORLD_MINUTE);
  game.step(2);
  assert.equal(game.state.player.worldMinute, 481);
  game.step(.016, {clockSeconds: 30, pauseClock: true});
  game.step(.016, {clockSeconds: 0});
  assert.equal(game.state.player.worldMinute, 481);
  assert.equal(createGame(game.save()).state.player.worldMinute, 481);
  game.step(.016, {clockSeconds: 119.5});
  assert.equal(game.state.player.worldMinute, 540.75);
  assert.equal(worldClockLabel(540.75), '1日目　朝 9:00');
});

test('T-TIME-03 resting at public stops crosses clock boundaries without changing the body, ship time or story', () => {
  const game = createGame(), p = game.state.player;
  assert.equal(game.waitUntil(6).ok, false);
  for (const s of REST_SITES) {
    const y = groundHeight(s.x, s.z);
    assert.equal(waterDepth(s.x, s.z, 0, y), 0);
    Object.assign(p, {x:s.x, z:s.z, y});
    assert.equal(nearbyRestSite(p).id, s.id);
    assert.equal(game.restSite(), s.name);
  }
  const before = [p.x, p.y, p.z, game.state.time], story = game.notebook.save();
  for (const [hour, expected] of [[18,1080], [21,1260], [6,1800], [6,3240]]) {
    assert.deepEqual(game.waitUntil(hour), {ok:true});
    assert.equal(p.worldMinute, expected);
    assert.deepEqual([p.x, p.y, p.z, game.state.time], before);
  }
  assert.deepEqual(game.notebook.save(), story);
  assert.equal(game.waitUntil(20).ok, false);
  assert.equal(game.waitUntil(12, true).ok, false);
  for (const [key,value] of Object.entries({inWater:true, diveDepth:1, skiff:'ferry', mount:'bike', grounded:false, h:3, activity:'sleep'})) {
    const prior = p[key];
    p[key] = value;
    assert.equal(game.waitUntil(6).ok, false, key);
    assert.equal(p.worldMinute, 3240);
    p[key] = prior;
  }
});

test('T-TIME-04 legacy noon and night and exact-day wait targets do not accumulate past days', () => {
  assert.equal(legacyWorldMinute(0),720);
  assert.equal(legacyWorldMinute(144),0);
  assert.equal(legacyWorldMinute(1e8,72),legacyWorldMinute(1e8%288,72));
  assert.equal(waitTargetMinute(3*DAY_MINUTES+360,6),4*DAY_MINUTES+360);
});
