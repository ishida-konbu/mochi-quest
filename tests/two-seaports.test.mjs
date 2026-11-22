import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { terrainHeight,groundHeight,ROCKS,wrapDelta,CONNECTING_ROADS,constrainMove,WATER_Y } from '../two/terrain.js';
import { SEAPORTS,portPoint,localPoint,DECK_Y,HOLD_Y,FIXED_BERTH,QUAY_CENTER,QUAY_LENGTH } from '../two/seaport-layout.js';
import { createVoyage,FLEET,SEAWAYS,CROSSINGS,crossingTimes,vesselPose,hullWidth,oceanPeriod } from '../two/ocean-voyage.js';

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


test('each offshore merchant circumnavigates the island and opens the gangboard at both ports',()=>{
  const ocean=FLEET.filter(ship=>ship.route);
  assert.deepEqual(ocean.map(s=>s.route.direction).sort(),['clockwise','clockwise','counterclockwise']);
  for(const ship of ocean){
    const start=oceanPeriod-ship.offset,home=vesselPose(ship,start);
    const voyage=createVoyage(start),[x,z]=portPoint(home,0,-6.7);
    const passenger={x,z,y:HOLD_Y+home.y,h:0,heading:home.yaw,mode:'normal',diveDepth:0};
    let winding=0,last=home;
    // A full revolution in map space distinguishes a circuit from a ferry
    // retracing its outward course. A passenger remains in the same hold.
    for(let step=1;step<=1500;step++){
      voyage.update(start+oceanPeriod*step/1500,passenger);
      const p=voyage.poses[ship.index],[u,v]=localPoint(p,passenger.x,passenger.z);
      assert.ok(Math.hypot(u,v+6.7)<1e-5);
      assert.ok(Math.hypot(p.x-last.x,p.z-last.z)<9,'continuous passage');
      winding+=Math.atan2(last.x*p.z-last.z*p.x,last.x*p.x+last.z*p.z);
      last={...p};
    }
    const sense=ship.route.direction==='clockwise'?1:-1;
    assert.ok(Math.abs(winding-sense*2*Math.PI)<1e-7);
    assert.ok(Math.hypot(last.x-home.x,last.z-home.z)<1e-6);
    for(const [i,port] of SEAPORTS.entries()){
      const t=start+(i?ship.route.times[0]:0)+.25,p=vesselPose(ship,t);
      const berth=portPoint(port,-20,31.4);
      assert.ok(p.docked && Math.hypot(p.x-berth[0],p.z-berth[1])<1e-7);
      assert.ok(vesselPose(ship,t+19.5).docked && !vesselPose(ship,t+20).docked);
      const saved=createGame().save(),[x,z]=portPoint(port,-20,23.7);
      Object.assign(saved.player,{x,z,y:DECK_Y,h:0,grounded:true});saved.time=t;
      const game=createGame(saved);
      walk(game,...portPoint(p,-2,0));
      const rider=game.state.player;
      assert.equal(game.voyage.sample(rider.x,rider.z,rider.y).pose.ship.id,ship.id);
      walk(game,x,z);
      assert.ok(Math.abs(rider.y-DECK_Y)<.06);
    }
  }
});

// A conservative full-length hull rectangle tests the bows and sterns of
// crossing ships as well as the beam between ships berthed side by side.
function hullClearance(a,b){
  const dx=wrapDelta(b.x-a.x),dz=wrapDelta(b.z-a.z);
  const sin=Math.abs(Math.sin(b.yaw-a.yaw)),cos=Math.abs(Math.cos(b.yaw-a.yaw));
  const length=16*(1+cos)+4.22*sin,width=4.22*(1+cos)+16*sin;
  return Math.max(...[a.yaw,b.yaw].flatMap(yaw=>[
    Math.abs(dx*Math.sin(yaw)+dz*Math.cos(yaw))-length,
    Math.abs(dx*Math.cos(yaw)-dz*Math.sin(yaw))-width,
  ]));
}
test('outward and homeward sailings clear every other hull, both quays and the deepwater channel',()=>{
  for(let t=0;t<oceanPeriod;t+=.5){
    const poses=FLEET.map(ship=>vesselPose(ship,t));
    for(const p of poses.filter(p=>p.ship.route)){
      for(const q of poses.slice(0,p.ship.index)){
        if(Math.hypot(wrapDelta(p.x-q.x),wrapDelta(p.z-q.z))<60)
          assert.ok(hullClearance(p,q)>2,`${p.ship.id} met ${q.ship.id} at ${t}`);
      }
      const port=SEAPORTS.find(port=>Math.hypot(p.x-port.x,p.z-port.z)<107);
      for(const v of [-15.6,-10,-5,0,5,10,16])for(const side of [-1,1]){
        const [x,z]=portPoint(p,side*hullWidth(v),v);
        assert.ok(terrainHeight(x,z)<-1.4,`shoal at ${x}, ${z}`);
        if(port){
          const [u,w]=localPoint(port,x,z);
          if(Math.abs(u-QUAY_CENTER)<QUAY_LENGTH/2)assert.ok(w>25.8,'hull grazed jetty');
        }
      }
    }
  }
});

test('passengers saved on the previous offshore circuit resume aboard the same vessel and storey',()=>{
  // Surveyed from the single clockwise circuit used in editions nine and ten.
  const journeys=[
    [4,128.3,-2,3.5,DECK_Y,983.5592502,-621.0390868,3.61354587,-.03400484],
    [5,943.5,0,-6,HOLD_Y,-127.6292013,988.2246775,.71083050,-1.93580603],
    [6,53.4,1,-6.8,HOLD_Y,-993.3511196,-1176.0957214,.77473082,3.12886003],
  ];
  const snap=createGame().save();
  for(const version of [9,10])for(const [ship,time,u,v,deck,x,z,y,bow] of journeys){
    snap.version=version;snap.time=time;
    Object.assign(snap.player,{x,z,y,h:0,heading:bow-.29,grounded:true});
    const game=createGame(snap);assert.ok(game.restored);
    const p=game.state.player,pose=game.voyage.poses[ship],spot=portPoint(pose,u,v);
    assert.ok(Math.hypot(p.x-spot[0],p.z-spot[1])<1e-5);
    assert.ok(Math.abs(p.y-deck-pose.y)<1e-5);
    assert.ok(Math.abs(Math.sin(p.heading-pose.yaw+.29))<1e-5);
    const again=createGame(game.save());assert.ok(again.restored);
    assert.ok(Math.hypot(again.state.player.x-p.x,again.state.player.z-p.z)<1e-6);
  }
});
