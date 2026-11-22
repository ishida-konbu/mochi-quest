import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { terrainHeight,groundHeight,ROCKS,wrapDelta,CONNECTING_ROADS,constrainMove,WATER_Y } from '../two/terrain.js';
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

test('the north road runs through a gentle pass between the new mountains and reaches the harbour street',()=>{
  const route=CONNECTING_ROADS.find(r=>r.destination==='敦賀'),port=SEAPORTS[0];
  let distance=0,peak=0;
  for(let i=1;i<route.points.length;i++){
    const a=route.points[i-1],b=route.points[i],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    const ya=terrainHeight(...a),yb=terrainHeight(...b);
    assert.ok(yb>WATER_Y && Math.abs(yb-ya)<length*.27,'impassable grade near '+b);
    peak=Math.max(peak,yb);distance+=length;
    const moved=constrainMove(...a,...b,0,groundHeight(...a));
    assert.ok(Math.hypot(moved.x-b[0],moved.z-b[1])<.02,'blocked road near '+b);
  }
  assert.ok(distance>590 && peak>30);
  const end=route.points.at(-1);
  assert.deepEqual(end,portPoint(port,0,4.8));
});

test('old harbour yards, mounts and ship passengers resume at the same place aboard the relocated service',()=>{
  const snap=createGame().save(),port=SEAPORTS[0];
  snap.version=8;
  Object.assign(snap.player,{x:263,z:-1040,y:2.25,mount:'turtle',h:0});
  Object.assign(snap.turtle,{x:263,z:-1040,homeX:262,homeZ:-1040});
  const yard=createGame(snap);assert.ok(yard.restored);
  const relocated=yard.save();
  assert.deepEqual([relocated.player.x,relocated.player.z],portPoint(port,0,10));
  assert.deepEqual([relocated.turtle.x,relocated.turtle.z],[relocated.player.x,relocated.player.z]);
  Object.assign(snap.player,{x:0,z:62,mount:null});
  const pastured=createGame(snap).save();
  assert.deepEqual([pastured.turtle.homeX,pastured.turtle.homeZ],portPoint(port,1,10));
  assert.deepEqual([pastured.player.x,pastured.player.z],[0,62]);

  // Surveyed from the previous edition, including a deck that straddled its
  // north/south seam. Neither the passenger's heading nor the lower storey is lost.
  const journeys=[
    [0,4,1,-6.8,HOLD_Y,202.2,-1062.4,.7028712,1.5707963],
    [2,35,-2,4,DECK_Y,287,-1059.4,3.5860147,1.5707963],
    [2,153,0,-6,HOLD_Y,-429.6967794,-1164.0866996,.7552851,-1.5669832],
    [3,178,0,-6.5,HOLD_Y,-880.518713,-1075.898664,.6753096,2.3367305],
    [4,4.58,0,10,DECK_Y,586.577654,-1176.579140,3.60187797,1.22590066],
  ];
  for(const version of [7,8])for(const [ship,t,u,v,deck,x,z,y,oldBow] of journeys){
    snap.version=version;snap.time=t;
    Object.assign(snap.player,{x,z,y,h:0,heading:oldBow-.29,grounded:true});
    const game=createGame(snap);assert.ok(game.restored);
    const p=game.state.player,pose=game.voyage.poses[ship],aim=portPoint(pose,u,v);
    assert.ok(Math.hypot(p.x-aim[0],p.z-aim[1])<1e-5);
    assert.ok(Math.abs(p.y-(deck+pose.y))<1e-5);
    assert.ok(Math.abs(Math.sin(p.heading-(pose.yaw-.29)))<1e-5);
    game.step(1/60);
    assert.equal(game.voyage.sample(p.x,p.z,p.y).pose.ship.index,ship);
    const again=createGame(game.save());
    assert.ok(again.restored);assert.ok(Math.hypot(again.state.player.x-p.x,again.state.player.z-p.z)<1e-5);
  }
});
