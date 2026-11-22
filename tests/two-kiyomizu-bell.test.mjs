import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { KIYOMIZU_ROAD, terrainHeight } from '../two/terrain.js';
import { KIYOMIZU, KIYOMIZU_BELL as bell } from '../two/kiyomizu-layout.js';
import { BELL_FIRST, BELL_INTERVAL, noticeBellDistance } from '../two/kiyomizu-bell.js';

test('a level notice intersects the cast lip but can skim past the narrower shoulder', () => {
  const ray = { x: bell.x + .91, y: bell.bottom + .12, z: bell.z - 3 };
  const near = noticeBellDistance(ray, 0, 1, 4);
  assert.ok(near > 2 && near < 3);
  assert.equal(noticeBellDistance(ray, 0, 1, near - .01), Infinity);
  assert.equal(noticeBellDistance(ray, 0, -1, 4), Infinity);
  assert.equal(noticeBellDistance({ ...ray, y: bell.top - .15 }, 0, 1, 4), Infinity);
  for (const y of [bell.bottom - .06, bell.top + .06])
    assert.equal(noticeBellDistance({ ...ray, x: bell.x, y }, 0, 1, 4), Infinity);
});

test('ordinary throws ring the bronze through an open bay while a foreground column stops the paper', () => {
  for (const [u,v,expectStrike] of [[0,-3.7,true], [-6,0,false]]) {
    const game = createGame(), state = game.state;
    Object.assign(state.player, { x: bell.x + u, z: bell.z + v, y: KIYOMIZU.floor });
    assert.ok(game.act('throw', Math.atan2(-u, -v)));
    for (let i = 0; i < 8; i++) game.step(.1);
    assert.equal(state.shots.length, 0);
    assert.equal(state.bellStrike?.source === 'notice', expectStrike);
    assert.equal(state.score, 0);
    assert.equal(state.delivered.size, 0);
  }
});

test('Kyoto clock schedules one mallet blow on each boundary, including in a restored journey', () => {
  const original = createGame(), offset = 3;
  original.state.time = BELL_FIRST - offset - .04;
  original.state.player.kyoClockOffset = offset;
  const resumed = createGame(original.save()), state = resumed.state;
  assert.equal(state.bellStrike, null);
  resumed.step(.02);
  assert.equal(state.bellStrike, null);
  resumed.step(.09);
  const first = state.bellStrike;
  assert.deepEqual(first, { time: BELL_FIRST - offset, source: 'mallet' });
  resumed.step(.1);
  assert.equal(state.bellStrike, first);
  state.time = BELL_FIRST + BELL_INTERVAL - offset - .03;
  resumed.step(.06);
  assert.deepEqual(state.bellStrike, { time: BELL_FIRST + BELL_INTERVAL - offset, source: 'mallet' });
  assert.equal(createGame(resumed.save()).state.bellStrike, null);
});

test('a white mochi can walk from the eastern ward onto the stage and deliver a notice at the belfry', () => {
  const game = createGame(), { state } = game, p = state.player;
  Object.assign(p, { x: 320, z: -785, y: terrainHeight(320, -785) });
  // Meet the patrolling monk on his return leg at the stage entrance.
  state.time = 20.4;
  function walk(x, z) {
    let stalled = 0;
    for (let frame = 0; frame < 240; frame++) {
      const dx = x - p.x, dz = z - p.z, distance = Math.hypot(dx, dz);
      if (distance < .33) return;
      game.step(1/30, { x: dx/distance, z: dz/distance });
      stalled = Math.hypot(x - p.x, z - p.z) < distance - .002 ? 0 : stalled + 1;
      assert.ok(stalled < 30, 'blocked on the path to ' + [x,z]);
    }
    assert.fail('did not reach ' + [x,z]);
  }
  for (const [x,z] of KIYOMIZU_ROAD.points) walk(x,z);
  for (const [x,z] of [[502,-718],[496,-717],[492.5,-717]]) walk(x,z);
  assert.equal(p.y, KIYOMIZU.floor);
  assert.equal(state.region, KIYOMIZU.name);
  assert.equal(state.regionId, 'kyo');
  assert.equal(createGame(game.save()).state.region, KIYOMIZU.name);
  for (const [x,z] of [[497,-717],[501,-719],[501,-726],[501,-733],[501,-743],[504,-749],[509,-749]]) walk(x,z);
  assert.equal(p.hp, 100);
  const dx = bell.x - p.x, dz = bell.z - p.z, distance = Math.hypot(dx, dz);
  game.step(1/30, { x: .04*dx/distance, z: .04*dz/distance });
  assert.ok(game.act('throw'));
  for (let i = 0; i < 12; i++) game.step(1/30);
  assert.equal(state.bellStrike.source, 'notice');
});
