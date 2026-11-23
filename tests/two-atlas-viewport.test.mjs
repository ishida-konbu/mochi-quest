import test from 'node:test';
import assert from 'node:assert/strict';
import { anchorAtlas, atlasView, atlasWorldAt, maxAtlasZoom } from '../two/atlas-viewport.js';
import { atlasHit } from '../two/atlas-marks.js';
import { WORLD_BOUND } from '../two/geography.js';

test('wheel and two-finger gestures keep the surveyed point under the pointer', () => {
  const initial = atlasView(38,-63,4), start = {u:.34,v:.75};
  const anchor = atlasWorldAt(initial,start);
  for (const pointer of [start,{u:.6,v:.24}]) {
    const next = anchorAtlas(anchor,pointer,9);
    const after = atlasWorldAt(next,pointer);
    assert.ok(Math.hypot(anchor.x-after.x,anchor.z-after.z) < 1e-8);
  }
});

test('pans and extreme zoom values stay on a single complete world sheet', () => {
  const fit = atlasView(999,-77,.001);
  assert.equal(fit.zoom,1);
  assert.equal(Math.hypot(fit.centerX,fit.centerZ),0);
  const far = atlasView(10000,-10000,1000);
  assert.equal(far.zoom,maxAtlasZoom);
  assert.equal(atlasWorldAt(far,{u:1,v:0}).x,WORLD_BOUND);
  assert.equal(atlasWorldAt(far,{u:1,v:0}).z,-WORLD_BOUND);
});

test('an atlas symbol or its inked caption picks the same facility and blank space stays free', () => {
  const place = {id:'port'}, marks = [{place,x:44,y:51,radius:8,label:{left:58,right:137,top:42,bottom:60}}];
  assert.equal(atlasHit(marks,44,51),place);
  assert.equal(atlasHit(marks,97,48),place);
  assert.equal(atlasHit(marks,30,30),undefined);
});
