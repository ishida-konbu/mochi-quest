import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDINGS, BRIDGES, GATES, bridgeHeight, canOccupy, constrainMove,
  groundHeight, overheadHeight, solidHeightAt, staticVolumeAt, terrainHeight } from '../two/terrain.js';
import { roofProfile } from '../two/architecture.js';
import { RYUGU, GATE_V, PALACE_BED, palacePoint, palaceSolid } from '../two/ryugu-layout.js';
import { PALACE_SCREENS, PALACE_TABLES, PEARL_LAMPS, screenLeaves, tidePorchHeight } from '../two/ryugu-palace-fittings.js';
import { DAIBUTSU } from '../two/pilgrimage-layout.js';

test('a rotated shop eave stops ascent outside the room and supports descent on the same pitch',()=>{
  const b=BUILDINGS.find(b=>b.x===-34 && b.z===49);
  const u=.40*b.w,v=.62*b.d;
  const x=b.x+b.cos*u+b.sin*v,z=b.z-b.sin*u+b.cos*v;
  const top=b.y+b.wall+.29+b.roof*roofProfile('gable',u/(b.w*.62),v/(b.d*.64));
  assert.ok(Math.abs(overheadHeight(x,z,b.y)-(top-.10))<.001);
  assert.ok(staticVolumeAt(x,z,top-.07,.03,.10));
  assert.ok(!staticVolumeAt(x,z,top-.50,.03,.15));
  assert.ok(!staticVolumeAt(x,z,top+.01,.03,.15));
  assert.ok(Math.abs(groundHeight(x,z,top+.30)-top)<.001);
  assert.equal(canOccupy(x,z,top-2,.08,1.50),true);
  assert.equal(canOccupy(x,z,top-2,.08,2.15),false);
});

test('the bridge rail stops a fast lateral stride and the passage under the torii stays open',()=>{
  const bridge=BRIDGES[1],z=bridge.z,deck=bridgeHeight(bridge,z);
  const stopped=constrainMove(bridge.x,z,bridge.x+8,z,0,deck);
  assert.ok(stopped.x>bridge.x+bridge.halfWidth-1 && stopped.x<bridge.x+bridge.halfWidth);
  assert.ok(staticVolumeAt(bridge.x+bridge.halfWidth-.13,z,deck+.4,.05,.40));
  const g=GATES[0],y=terrainHeight(g.x,g.z);
  assert.ok(!staticVolumeAt(g.x,g.z,y+.02,.16,1.66));
  assert.ok(staticVolumeAt(g.x,g.z,y+.725*g.h,.05,.08));
  assert.ok(staticVolumeAt(g.x,g.z,y+.93*g.h,.04,.10));
});

test('the upper Todaiji roof has its own high ridge and the submerged palace sill opens below the air pocket',()=>{
  const {x,z}=DAIBUTSU,base=terrainHeight(x,z);
  assert.ok(solidHeightAt(x,z-.7)>base+32);
  const bed=terrainHeight(RYUGU.x,RYUGU.z);
  const solid=(u,v,y,body=.25)=>palaceSolid(RYUGU.x+v,RYUGU.z-u,bed+y,bed,body,.10);
  assert.ok(!solid(0,GATE_V,.3,1.66));
  assert.ok(solid(0,GATE_V,4.66));
  assert.ok(solid(0,GATE_V,9.99));
  assert.ok(!solid(0,-8,1.4,1.25));
  assert.ok(solid(0,-8,3.3));
  assert.ok(solid(10.3,-11.2,3.9));
  assert.ok(!solid(10.3,-11.2,4.1,1.66));
});

test('the palace alcoves stop both a camera and a walker on the correct floor',()=>{
  const screens=PALACE_SCREENS.map(screen=>{
    const leaf=screenLeaves(screen)[2];
    return [leaf.u,leaf.v,screen.h];
  });
  for(const [u,v,h] of [...PEARL_LAMPS,...PALACE_TABLES,...screens]){
    const {x,z}=palacePoint(u,v),feet=PALACE_BED+h;
    assert.ok(!canOccupy(x,z,feet,.26,1.66));
    assert.ok(staticVolumeAt(x,z,feet+.40,.10,.22));
    if(h>4)assert.ok(canOccupy(x,z,feet-5,.26,1.66));
  }
  const v=-4.8,{x,z}=palacePoint(0,v),roof=PALACE_BED+tidePorchHeight(0,v);
  assert.ok(staticVolumeAt(x,z,roof-.18,.10,.12));
  assert.ok(!staticVolumeAt(x,z,PALACE_BED+2,.20,1.25));
});

test('a stride can clear an initial corner overlap while the back wall stays solid',()=>{
  const b=BUILDINGS.find(b=>b.x===210 && b.z===-815);
  const x=b.x,z=b.z-b.d/2-2.5,y=groundHeight(x,z);
  let at={x,z};
  for(let n=0;n<150;n++) at=constrainMove(at.x,at.z,at.x,at.z+.02,0,y,.26,1.66);
  assert.ok(at.z>z+2.90);
  const wall=b.z+b.d/2;
  const stopped=constrainMove(b.x,b.z,b.x,wall+1,0,b.y+.48);
  assert.ok(stopped.z<wall && stopped.z>wall-1);
});

test('mountain footing and low clearance probes meet the same painted triangle in every region', async () => {
  const { REGIONS, terrainMeshHeight, landscapeFloor, swimSurfaceAt }=await import('../two/terrain.js');
  for (const region of REGIONS) {
    for (const [u,v] of [[.27,.79],[5.17,-8.37],[-25.75,-38.65],[31.85,34.75]]) {
      const x=region.x+u,z=region.z+v;
      const bed=terrainMeshHeight(x,z);
      assert.ok(Math.abs(landscapeFloor(x,z)-Math.max(bed,swimSurfaceAt(x,z)-.57))<1e-6,region.name);
    }
  }
  for (const [x,z] of [[718.19,-1164.48],[-735.75,-225.65],[449.25,-610.95]]) {
    const bed=terrainMeshHeight(x,z);
    assert.ok(staticVolumeAt(x,z,bed-.02,.01,.01));
    assert.equal(staticVolumeAt(x,z,bed+.02,.01,.01),false);
  }
});
