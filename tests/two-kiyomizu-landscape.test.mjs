import test from 'node:test';
import assert from 'node:assert/strict';
import { DISTRICTS } from '../two/geography.js';
import { KIYOMIZU, STAGE, STAGE_PILES, KIYOMIZU_BELL, OTOWA_ROOFS, KIYOMIZU_APPROACH } from '../two/kiyomizu-layout.js';
import { KIYOMIZU_ROAD, terrainHeight, terrainMeshHeight, canOccupy, groundHeight, solidHeightAt,
  staticVolumeAt, TREES } from '../two/terrain.js';
import { roofProfile, roofSkinDepth } from '../two/architecture.js';
import { roofShell } from '../two/roof-shell.js';

test('the timber stage spans a real slope and is accessible from the north court',()=>{
  assert.ok(KIYOMIZU.x>DISTRICTS.kyo.x && KIYOMIZU.z>DISTRICTS.kyo.z);
  assert.deepEqual(KIYOMIZU_ROAD.points[0],KIYOMIZU_APPROACH[0]);
  assert.deepEqual(KIYOMIZU_ROAD.points.at(-1),KIYOMIZU_APPROACH.at(-1));
  const y=KIYOMIZU.floor;
  for(const [x,z] of [[503,-739],[503,-731.1],[503,-730.2],[503,-728],[500,-724],[493,-717]]){
    assert.ok(Math.abs(groundHeight(x,z,y)-y)<.015);
    assert.ok(canOccupy(x,z,y,.25,1.5));
  }
  for(const [x,z] of STAGE_PILES.filter(([x])=>x===492.2)){
    const earth=terrainHeight(x,z);
    assert.ok(earth<y-5);
    assert.ok(staticVolumeAt(x,z,earth+.12,.12,.7));
    assert.ok(Math.abs(terrainMeshHeight(x,z)-earth)<.42,'stone and hillside elevations');
  }
  const x=494,z=-715,earth=terrainHeight(x,z);
  assert.ok(canOccupy(x,z,earth,.18,1.4),'under the stage');
  assert.ok(staticVolumeAt(x,z,y-.44,.08,.24),'underside of the planks');
  assert.ok(!canOccupy(STAGE.west+.22,-717,y,.19,1.4),'outer railing');
  assert.ok(!TREES.some(t=>t.x>STAGE.west && t.x<STAGE.east && t.z>STAGE.north && t.z<STAGE.south));
});

test('the bark roof, swept eaves and hollow underside use the same profile as contact',()=>{
  const r=OTOWA_ROOFS[0],shape=roofShell('barkHip');
  for(const attribute of ['position','normal','uv'])assert.ok(shape.attributes[attribute].array.every(Number.isFinite));
  const shell=shape.attributes.position;
  for(let j=0;j<shell.count;j+=7){
    const u=2*shell.getX(j),v=2*shell.getZ(j),top=roofProfile('barkHip',u,v);
    assert.ok(shell.getY(j)<=top+.00001 && shell.getY(j)>=top-roofSkinDepth('barkHip')-.00001);
  }
  for(const [u,v] of [[0,0],[.3,.42],[-.72,.56],[.93,.93]]){
    const x=r.x+v*r.depth/2,z=r.z-u*r.width/2;
    const actual=solidHeightAt(x,z),expected=r.eave+roofProfile('barkHip',u,v)*r.rise;
    assert.ok(Math.abs(actual-expected)<.001);
  }
  assert.ok(canOccupy(508,-717,KIYOMIZU.floor,.25,1.5),'front aisle');
  assert.ok(roofProfile('barkHip',.99,.99)>roofProfile('barkHip',0,.99)+.07);
  assert.ok(KIYOMIZU_BELL.bottom-KIYOMIZU.floor<1);
});
