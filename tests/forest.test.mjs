import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { BUILDINGS, LANDMARK_TREES, TREES, REGIONS, regionAt, hasAutumnLeaves, nearRoad, riverZ, riverHalfWidth, shoreDistance } from '../two/terrain.js';
import { TREE_FORM_COUNT } from '../two/forest-forms.js';

test('the thinned woodland preserves bamboo groves and crown forms and leaves room for roads, entrances and swimming ashore', () => {
  const bamboo=TREES.filter(t=>t.kind==='bamboo'||t.kind==='moso');
  assert.equal(bamboo.length,139);
  assert.equal(createHash('sha256').update(JSON.stringify(bamboo)).digest('hex'),'bf8b76abb9076a6bb02bf41f75ffd02fd14a7cbc0d8e526d8afee3c014eff6ae');
  const autumn = TREES.filter(t => REGIONS[regionAt(t.x,t.z)].id === 'autumn' && hasAutumnLeaves(t));
  assert.equal(autumn.length, 400); // The previous route passed 200 trees in autumn colour.
  assert.equal(TREES.length-bamboo.length-autumn.length,1198);
  assert.deepEqual(TREES.slice(0,LANDMARK_TREES.length), LANDMARK_TREES);
  const groves = TREES.filter(tree => tree.form !== undefined);
  assert.equal(new Set(groves.map(tree => tree.form)).size, TREE_FORM_COUNT);
  for (const tree of groves) {
    assert.ok(!nearRoad(tree.x,tree.z,2.7));
    assert.ok(Math.abs(tree.z-riverZ(tree.x))-riverHalfWidth(tree.x)>=10.5);
    assert.ok(shoreDistance(tree.x,tree.z)>=9);
    assert.ok(BUILDINGS.every(b=>Math.hypot(tree.x-b.x,tree.z-b.z)>=Math.hypot(b.w,b.d)*.52+4));
  }
});
