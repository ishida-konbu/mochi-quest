import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { HOKORA_BASE } from '../two/lake-hokora-layout.js';
import { FOREST_LAKE, LAKE_ISLET, LAKE_HOKORA, isletPoint, lakePoint, lakeRadius } from '../two/snow-country.js';
import {
  BUILDINGS, CONNECTING_ROADS, GATES, REGIONS, ROADS, SNOW_SPRING, TREES, WATER_Y,
  seasonAt, shoreDistance, terrainHeight, terrainMeshHeight, waterDepth,
} from '../two/terrain.js';

test('the snowy pagoda overlooks open winter water across a pass from Kyoto',()=>{
  const city=REGIONS.find(r=>r.id==='kyo'), snow=REGIONS.find(r=>r.id==='snow');
  assert.equal(snow.name,'雪灯りの街');
  assert.ok(snow.x>city.x && snow.z<city.z);
  const route=CONNECTING_ROADS.find(r=>r.origin===snow.name && r.destination===city.name);
  assert.ok(Math.hypot(route.points[0][0]-snow.x,route.points[0][1]-snow.z)<5);
  assert.ok(Math.hypot(route.points.at(-1)[0]-city.x,route.points.at(-1)[1]-city.z)<5);
  const crest=Math.max(...route.points.map(([x,z])=>terrainHeight(x,z)));
  assert.ok(crest>Math.max(terrainHeight(city.x,city.z),terrainHeight(snow.x,snow.z))+40);
  for(let i=1;i<route.points.length;i++){
    const [x,z]=route.points[i], [u,v]=route.points[i-1];
    assert.ok(Math.abs(terrainHeight(x,z)-terrainHeight(u,v))<.40*Math.hypot(x-u,z-v));
  }
  const tower=BUILDINGS.find(b=>b.snow && b.kind==='pagoda');
  assert.ok(tower.z<snow.z && Math.abs(snow.x-tower.x)<5);
  assert.ok(seasonAt(tower.x,tower.z).snow>.95);
  // From the street, a broad aperture opens beyond the finial. The nearby
  // headland and its low flanking reefs leave the central horizon unbroken.
  for(const yaw of [-.35,0,.35])for(let d=28;d<240;d+=8) {
    const x=tower.x+d*Math.sin(yaw),z=tower.z-d*Math.cos(yaw);
    assert.ok(shoreDistance(x,z)<0 && terrainMeshHeight(x,z)<WATER_Y);
  }
});

test('the old town is an enclosed, swimmable basin with a continuous unlabelled shore',()=>{
  assert.equal(waterDepth(FOREST_LAKE.x,FOREST_LAKE.z),0);
  assert.equal(seasonAt(FOREST_LAKE.x,FOREST_LAKE.z).snow,0);
  for(let i=0;i<72;i++){
    const angle=i*Math.PI/36,wet=lakePoint(angle,.85),bank=lakePoint(angle,1.10);
    assert.ok(waterDepth(...wet)>.3);
    assert.ok(Math.abs(terrainMeshHeight(...lakePoint(angle))-WATER_Y)<.25);
    assert.ok(terrainMeshHeight(...bank)>WATER_Y+.5);
  }
  for(const thing of [...REGIONS,...BUILDINGS,...GATES,SNOW_SPRING,...TREES])
    assert.ok(lakeRadius(thing.x,thing.z)>1);
  for(const r of ROADS)for(const [x,z] of r.points)assert.ok(lakeRadius(x,z)>1.03);
});

test('the island has a firm shrine parcel, a walkable strand and deep water on every side',()=>{
  const {x,z,y,yaw}=LAKE_HOKORA;
  for(const u of [-2.05,0,2.05])for(const v of [-1.55,0,1.55]){
    const p=[x+u*Math.cos(yaw)+v*Math.sin(yaw),z-u*Math.sin(yaw)+v*Math.cos(yaw)];
    assert.equal(terrainHeight(...p),y);
    assert.ok(Math.abs(terrainMeshHeight(...p)-y)<.01);
  }
  for(let i=0;i<72;i++){
    const a=i*Math.PI/36;
    assert.ok(Math.abs(terrainMeshHeight(...isletPoint(a))-WATER_Y)<.04);
    assert.ok(waterDepth(...isletPoint(a,2))>5.9);
    let previous=LAKE_ISLET.top;
    for(let step=1;step<=28;step++){
      const h=terrainHeight(...isletPoint(a,step/20));
      assert.ok(h<=previous+1e-9,'no lip blocking the shore');
      previous=h;
    }
  }
});

test('a swimmer can leave the water and climb the shrine steps to the open porch',()=>{
  const {x,z,yaw, y:top}=LAKE_HOKORA,dx=Math.sin(yaw),dz=Math.cos(yaw);
  const journal=createGame().save();
  Object.assign(journal.player,{x:x+24*dx,z:z+24*dz,y:WATER_Y-.57,h:0,grounded:true});
  const game=createGame(journal),p=game.state.player;
  assert.ok(game.restored && p.inWater);
  const target=[x+.90*dx,z+.90*dz];
  for(let i=0;i<600;i++){
    const u=target[0]-p.x,v=target[1]-p.z,d=Math.hypot(u,v);
    if(d<.08)break;
    game.step(1/60,{x:.58*u/d,z:.58*v/d});
  }
  assert.ok(Math.hypot(p.x-target[0],p.z-target[1])<.08);
  assert.ok(!p.inWater && p.grounded && Math.abs(p.y-top-HOKORA_BASE.top)<.02);
  assert.ok(game.state.onLake);
  assert.deepEqual(game.state.visited,journal.visited);
});
