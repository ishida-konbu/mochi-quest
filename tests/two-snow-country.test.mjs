import test from 'node:test';
import assert from 'node:assert/strict';
import { FOREST_LAKE, lakePoint, lakeRadius } from '../two/snow-country.js';
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
  assert.ok(waterDepth(FOREST_LAKE.x,FOREST_LAKE.z)>6);
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
