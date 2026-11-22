import assert from 'node:assert/strict';
import test from 'node:test';
import { MARKET_HIGHWAYS, THROUGH_MARKET_HIGHWAY } from '../two/market-highways.js';
import { REGIONS, terrainHeight } from '../two/terrain.js';

test('the Kyoto carriage visits the pass, warehouse market and Great Buddha in order on a continuous road', () => {
  const { points } = THROUGH_MARKET_HIGHWAY;
  let cursor = 0;
  for (const id of ['kyo', 'spring', 'market', 'todaiji']) {
    const town = REGIONS.find(region => region.id === id);
    const next = points.findIndex(([x, z], index) =>
      index >= cursor && Math.hypot(x - town.x, z - town.z) < 36);
    assert.ok(next >= cursor, id);
    cursor = next + 1;
  }
  for (const road of MARKET_HIGHWAYS) {
    for (let i = 1; i < road.points.length; i++) {
      const [x, z] = road.points[i], [lastX, lastZ] = road.points[i-1];
      const gap = Math.hypot(x-lastX, z-lastZ);
      assert.ok(gap > 0 && gap < 5, road.id + ' has a gap near ' + [x, z]);
    }
  }
});

test('the pass road climbs through a narrow cut and the cliff continues on both sides', () => {
  const ledge = x => terrainHeight(x, -305.1) - terrainHeight(x, -304.9);
  assert.ok(ledge(85) > 9);
  assert.ok(ledge(179) > 18);
  assert.ok(Math.abs(ledge(132)) < .2);
});
