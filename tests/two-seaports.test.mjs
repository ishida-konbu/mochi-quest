import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { terrainHeight,groundHeight,ROCKS,wrapDelta } from '../two/terrain.js';
import { SEAPORTS,portPoint,localPoint,DECK_Y,HOLD_Y,FIXED_BERTH } from '../two/seaport-layout.js';
import { createVoyage,FLEET,SEAWAYS,CROSSINGS,crossingTimes,vesselPose } from '../two/ocean-voyage.js';

function walk(game,x,z){
  const p=game.state.player;
  for(let n=0;n<800;n++){
    const dx=wrapDelta(x-p.x),dz=wrapDelta(z-p.z),len=Math.hypot(dx,dz);
    if(len<.16)return;
    game.step(1/60,{x:dx/len,z:dz/len});
  }
  assert.fail('obstructed at '+[p.x,p.y,p.z].map(v=>v.toFixed(2))+' on the way to '+[x,z]);
}
test('both ports have uninterrupted approaches from the market into the hull, up its companionway and back ashore',()=>{
  for(const [i,port] of SEAPORTS.entries()){
    const game=createGame(),p=game.state.player;
    const [x,z]=portPoint(port,0,3.7);
    Object.assign(p,{x,z,y:groundHeight(x,z),grounded:true,h:0,vx:0,vz:0});
    const fixed=game.voyage.poses[i];
    for(const q of [[0,23.7],[FIXED_BERTH,23.7],[FIXED_BERTH,28.9]])walk(game,...portPoint(port,...q));
    assert.ok(Math.abs(p.y-DECK_Y)<.08);
    walk(game,...portPoint(fixed,-2,3.5));
    walk(game,...portPoint(fixed,0,3.5));
    walk(game,...portPoint(fixed,0,-6.9));
    assert.ok(Math.abs(p.y-HOLD_Y)<.08);
    const loaded=createGame(game.save());assert.ok(loaded.restored);
    assert.ok(Math.abs(loaded.state.player.y-p.y)<.015);
    walk(game,...portPoint(fixed,0,3.5));
    walk(game,...portPoint(fixed,-2,3.5));
    walk(game,...portPoint(fixed,-2,0));
    walk(game,...portPoint(port,FIXED_BERTH,23.7));
    walk(game,...portPoint(port,0,23.7));
    walk(game,...portPoint(port,0,5.3));
    assert.ok(Math.abs(p.y-groundHeight(p.x,p.z))<.03);
  }
});
test('both merchant passages carry a traveller below deck across the open sea to the opposite landing',()=>{
  for(const [i,ship] of FLEET.slice(2,4).entries()){
    const voyage=createVoyage(),start=vesselPose(ship,0);
    const [x,z]=portPoint(start,0,-6.7);
    const passenger={x,z,y:HOLD_Y+start.y,h:0,heading:0,grounded:true,mode:'normal',diveDepth:0};
    const arrival=crossingTimes[i];
    for(let sec=1;sec<arrival;sec++){
      voyage.update(sec,passenger);
      const [u,v]=localPoint(voyage.poses[ship.index],passenger.x,passenger.z);
      assert.ok(Math.hypot(u,v+6.7)<.0002,ship.id);
    }
    voyage.update(arrival+.4,passenger);
    const dock=voyage.poses[ship.index],dest=SEAPORTS[1-i],berth=portPoint(dest,-20,31.4);
    assert.ok(dock.docked);assert.ok(Math.hypot(dock.x-berth[0],dock.z-berth[1])<.01);
    const snap=createGame().save();
    snap.time=arrival-.7;const past=vesselPose(ship,snap.time),at=portPoint(past,0,-6.7);
    Object.assign(snap.player,{x:at[0],z:at[1],y:HOLD_Y+past.y,h:0,grounded:true});
    const restored=createGame(snap);assert.ok(restored.restored);
    for(let n=0;n<80;n++)restored.step(1/60);
    walk(restored,...portPoint(dock,0,3.5));
    walk(restored,...portPoint(dock,-2,3.5));walk(restored,...portPoint(dock,-2,0));
    walk(restored,...portPoint(dest,-20,23.7));
    assert.ok(Math.abs(restored.state.player.y-DECK_Y)<.06);
  }
});
test('the surveyed sea lanes clear the seabed and offshore reefs along both sides of each hull',()=>{
  assert.ok(ROCKS.filter(r=>r.reef).length>140);
  for(const route of SEAWAYS){
    for(const [x,z] of route.points){
      for(const [dx,dz] of [[0,0],[5,0],[-5,0],[0,5],[0,-5]])
        assert.ok(terrainHeight(wrapDelta(x+dx),wrapDelta(z+dz))<-1.4,route.id+' ran aground');
    }
  }
  assert.ok(CROSSINGS.every(route=>route.length>2000));
});
