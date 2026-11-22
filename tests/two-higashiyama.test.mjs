import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTRICTS } from '../two/geography.js';
import { HIGASHIYAMA, eastRidgeHeight, fukuFirebeds } from '../two/higashiyama.js';
import { CONNECTING_ROADS, TREES, shoreDistance, solidHeightAt, terrainHeight } from '../two/terrain.js';
import { canopyHeight } from '../two/village-paths.js';

test('the eastern ridge carries wooded spurs and tapers off before the roads to both ports and the shrine',()=>{
  const {x,z}=HIGASHIYAMA;
  assert.ok(x>DISTRICTS.kyo.x+150);
  assert.ok(terrainHeight(x,z)>95);
  for(const v of [-76,73])assert.ok(terrainHeight(x,z+v)>50);
  assert.ok(terrainHeight(x-75,z)<15);
  assert.ok(TREES.filter(t=>eastRidgeHeight(t.x,t.z)>18).length>100);
  assert.ok(shoreDistance(x,z)>45);
  for(const road of CONNECTING_ROADS.slice(3))
    for(const [x,z] of road.points)assert.ok(eastRidgeHeight(x,z)<.05,road.destination);
});

test('the west-facing 福 is laid on solid ground and visible above buildings and treetops from the avenue',()=>{
  const eye=DISTRICTS.kyo;
  const hearths=fukuFirebeds(terrainHeight);
  assert.ok(hearths.length>130);
  for(const [x,y,z] of hearths)assert.ok(Math.abs(terrainHeight(x,z)+.38-y)<1e-8);
  const eyeY=terrainHeight(eye.x,eye.z)+1.85;
  // The separated dot of 礻, stacked horizontal strokes and four enclosed
  // openings below the mouth distinguish 福 from a flipped or crushed field.
  const chart=hearths.map(([x,y,z])=>[(z-eye.z)/(x-eye.x)/.357+.5,
    ((y-.38-eyeY)/(x-eye.x)-.211)/.320]);
  function nearest(u,v){return Math.min(...chart.map(([a,b])=>Math.hypot(u-a,v-b)));}
  for(const [u,v] of [[.095,.961],[.16,.56],[.17,.08],[.65,.931],[.65,.811],[.65,.64],[.65,.32],[.65,.10]])
    assert.ok(nearest(u,v)<.030,'missing brush at '+[u,v]);
  for(const [u,v] of [[.61,.72],[.50,.42],[.78,.42],[.50,.20],[.79,.21],[.32,.72]])
    assert.ok(nearest(u,v)>.058,'blocked opening at '+[u,v]);
  for(const ex of [eye.x-40,eye.x,eye.x+66]){
    const ey=terrainHeight(ex,eye.z)+1.85;
    for(const [x,y,z] of hearths)for(let xx=ex+1;xx<x-.8;xx+=.9){
      const f=(xx-ex)/(x-ex),zz=eye.z+f*(z-eye.z),alt=ey+f*(y+.6-ey);
      assert.ok(alt>Math.max(terrainHeight(xx,zz),canopyHeight(xx,zz,.03),solidHeightAt(xx,zz,.03)),
        'blocked view from '+ex+' to '+[x,z]);
    }
  }
});
