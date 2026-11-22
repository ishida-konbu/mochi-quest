import test from 'node:test';
import assert from 'node:assert/strict';
import { BOUND, ROADS, terrainHeight, bridgeAt, bridgeHeight, waterSurfaceAt } from '../two/terrain.js';
import { INARI_ROUTE } from '../two/pilgrimage-layout.js';

test('occasional rock faces punctuate a world of mostly gentler slopes',()=>{
  let land=0,steep=0,cliffs=0;
  for(let x=-BOUND+8;x<BOUND;x+=16)for(let z=-BOUND+8;z<BOUND;z+=16){
    if(terrainHeight(x,z)<=waterSurfaceAt(x,z))continue;
    const east=(terrainHeight(x+2.5,z)-terrainHeight(x-2.5,z))/5;
    const south=(terrainHeight(x,z+2.5)-terrainHeight(x,z-2.5))/5;
    const grade=Math.hypot(east,south);
    land++;
    if(grade>1)steep++;
    if(grade>Math.sqrt(3))cliffs++;
  }
  assert.ok(land>8000);
  assert.ok(steep/land<.085,'share of dry land over 45 degrees: '+steep/land);
  assert.ok(cliffs/land<.01,'share of dry land over 60 degrees: '+cliffs/land);
});

test('roads climb passes and round switchbacks without short pitches hidden between waypoints',()=>{
  const walkingLevel=(x,z)=>{
    const bridge=bridgeAt(x,z);
    return bridge ? bridgeHeight(bridge,z) : terrainHeight(x,z);
  };
  for(const road of ROADS){
    const limit=road.points===INARI_ROUTE ? .36 : road.destination ? .55 : .68;
    for(let i=1;i<road.points.length;i++){
      const [ax,az]=road.points[i-1],[x,z]=road.points[i];
      const run=Math.hypot(x-ax,z-az);
      if(!run)continue;
      const grade=Math.abs(walkingLevel(x,z)-walkingLevel(ax,az))/run;
      assert.ok(grade<limit,'road grade at '+[x,z]+': '+grade);
    }
  }
});
