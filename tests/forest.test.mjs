import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, LANDMARK_TREES, TREES, nearRoad, riverZ, riverHalfWidth, shoreDistance } from '../two/terrain.js';
import { TREE_FORM_COUNT } from '../two/forest-forms.js';

test('the tenfold woodland contains all crown forms and leaves room for roads, entrances and swimming ashore', () => {
  assert.equal(LANDMARK_TREES.length, 587);
  assert.equal(TREES.length, 10*LANDMARK_TREES.length);
  const groves = TREES.filter(tree => tree.form !== undefined);
  assert.equal(new Set(groves.map(tree => tree.form)).size, TREE_FORM_COUNT);
  for (const tree of groves) {
    assert.ok(!nearRoad(tree.x,tree.z,2.7));
    assert.ok(Math.abs(tree.z-riverZ(tree.x))-riverHalfWidth(tree.x)>=10.5);
    assert.ok(shoreDistance(tree.x,tree.z)>=9);
    assert.ok(BUILDINGS.every(b=>Math.hypot(tree.x-b.x,tree.z-b.z)>=Math.hypot(b.w,b.d)*.52+4));
  }
});
