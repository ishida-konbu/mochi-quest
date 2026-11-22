import test from 'node:test';
import assert from 'node:assert/strict';
import { MOUNTAIN_STREAMS,inMountainStreamClearing,mountainStreamWaterAt } from '../two/mountain-streams.js';
import { WATER_Y,ROADS,riverZ,shoreDistance,terrainHeight,terrainMeshHeight,groundHeight,waterSurfaceAt } from '../two/terrain.js';
import { createGame } from '../two/game.js';

test('three mountain watercourses descend along submerged painted beds to a river or the sea',()=>{
  for(const stream of MOUNTAIN_STREAMS){
    const {stations,lipIndex,toeIndex}=stream;
    // At the first station the cut fades into the natural hillside.
    const head=stations[0];
    assert.ok(Math.abs(terrainHeight(head.x,head.z)-head.y)<.6,stream.name+' source elevation');
    assert.equal(toeIndex,lipIndex+1);
    assert.ok(stations[lipIndex].y-stations[toeIndex].y>7,stream.name);
    for(const [i,p] of stations.entries()){
      if(i>0)assert.ok(p.y<=stations[i-1].y,stream.name+' flows downhill');
      assert.ok(inMountainStreamClearing(p.x,p.z));
      assert.ok(Math.abs(Math.hypot(p.nx,p.nz)-1)<1e-9);
      if(i<2 || p.y<WATER_Y)continue; // The source issues from under its bank.
      assert.ok(Math.abs(waterSurfaceAt(p.x,p.z)-p.y)<1e-6,stream.name+' water level');
      assert.ok(terrainMeshHeight(p.x,p.z)<p.y-.015,stream.name+' visible stream at '+i);
    }
    const mouth=stations.at(-1);
    assert.ok(terrainMeshHeight(mouth.x,mouth.z)<WATER_Y);
    assert.equal(waterSurfaceAt(mouth.x,mouth.z),WATER_Y);
    if(stream.id==='sakura')assert.ok(Math.abs(mouth.z-riverZ(mouth.x))<3);
    if(stream.id==='maple')assert.ok(Math.abs(mouth.z-(-130+3.3*Math.sin((mouth.x-292)/15)))<3);
    if(stream.id==='peach')assert.ok(shoreDistance(mouth.x,mouth.z)<0);
  }
  for(const road of ROADS)for(const [x,z] of road.points)assert.equal(inMountainStreamClearing(x,z),false);
});

test('the lip opens onto air and a mochi can fall into each real plunge pool and resume swimming',()=>{
  const game=createGame(),p=game.state.player;
  for(const stream of MOUNTAIN_STREAMS){
    const {lip,toe}=stream.fall,goal=stream.stations[stream.toeIndex+3];
    const x=lip.x+(toe.x-lip.x)*.48,z=lip.z+(toe.z-lip.z)*.48;
    assert.equal(mountainStreamWaterAt(x,z),-Infinity);
    assert.ok(groundHeight(x,z)<lip.y-(lip.y-toe.y)*.85);
    assert.ok(terrainHeight(toe.x,toe.z)<toe.y-1);
    Object.assign(p,{x:lip.x,z:lip.z,y:groundHeight(lip.x,lip.z),h:0,vx:0,vy:0,vz:0,grounded:true,mount:null});
    let airborne=false;
    for(let i=0;i<280;i++){
      const dx=goal.x-p.x,dz=goal.z-p.z,d=Math.hypot(dx,dz);
      game.step(1/60,d>.12 ? {x:dx/d,z:dz/d} : {});
      airborne ||= !p.grounded && p.vy<-.6;
    }
    assert.ok(airborne,stream.name+' free fall');
    assert.ok(Math.hypot(p.x-goal.x,p.z-goal.z)<.26 && p.inWater && p.grounded,stream.name+' reached pool');
    assert.ok(Math.abs(p.y-waterSurfaceAt(p.x,p.z)+.57)<.01,stream.name+' buoyancy');
    const resumed=createGame(game.save());assert.ok(resumed.restored);
    assert.equal(resumed.state.player.y,p.y);
  }
});
