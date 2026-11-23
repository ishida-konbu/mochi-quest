import test from 'node:test';
import assert from 'node:assert/strict';
import {circuitTime} from '../two/legend-flight.js';
import {createGame} from '../two/game.js';
import {moveWildlife, legendFlight} from '../two/bestiary.js';
import {canopyHeight} from '../two/village-paths.js';
import {dragonLengthScale, dragonTailZ, dragonPhase, dragonPitch, dragonWave, walkingScore} from '../two/animal-motion.js';
import {terrainHeight, groundHeight, WATER_Y, REGIONS, ORIGINAL_REGIONS, BOUND, wrapDelta, regionAt, waterDepth, solidHeightAt} from '../two/terrain.js';

test('flight strata span each district and a distant crane moves on every tick',()=>{
  const game=createGame(), cranes=game.state.npcs.filter(n=>n.type==='bird');
  for(const place of ORIGINAL_REGIONS) {
    const heights=cranes.filter(n=>n.habitat===place.id).map(n=>n.altitude);
    assert.equal(heights.length,4);
    assert.ok(Math.max(...heights)-Math.min(...heights)>45,place.id);
  }
  const crane=cranes[0],p=game.state.player;
  Object.assign(p,{x:crane.homeX+70,z:crane.homeZ,y:groundHeight(crane.homeX+70,crane.homeZ)});
  for(let i=0;i<120;i++) {
    const {x,y,z}=crane;game.step(1/60);
    const d=Math.hypot(x-crane.x,y-crane.y,z-crane.z);
    assert.ok(d>.004 && d<.18,`flight discontinuity of ${d} m`);
  }
});

test('a crane at the outer turn of its ellipse streams across the player cell boundary',()=>{
  const game=createGame(),crane=game.state.npcs.find(n=>n.type==='bird'),p=game.state.player;
  // At t=12 the crane is inside the view radius although its perch lies
  // 158 metres from the next cell centre. Crossing x=96 must not drop it.
  Object.assign(crane,{homeX:-46,radius:14,phase:-Math.PI/2,cruise:Math.PI/12});
  game.state.time=12;
  moveWildlife(crane,game.state.time);
  for(const x of [95.95,96.05,97.95]) {
    Object.assign(p,{x,z:crane.z,y:groundHeight(x,crane.z)});
    game.step(1/60);
    assert.ok(Math.abs(crane.x-p.x)<128);
    assert.ok(game.state.nearbyNpcs.includes(crane));
  }
});

test('each legend traverses all 25 sectors, changing altitude above sea, ridges and village roofs',()=>{
  const journey={...createGame().save(),flightSeed:32495}, game=createGame(journey);
  for(const type of ['dragon','kirin']) {
    const n=game.state.npcs.find(n=>n.type===type), period=circuitTime(n);
    if(type==='dragon') {
      const {player}=game.state;
      assert.ok(Math.abs(n.x-player.x)<35 && n.z<player.z-90 && n.z>player.z-160);
      assert.ok(n.altitude>18 && n.altitude<50 && Math.abs(Math.sin(n.heading))>.8,
        'the first dragon crosses the skyline in front of the ferry');
    }
    const samples=period*4*2, cells=new Set(), districts=new Set(), previous={};
    let low=Infinity,high=-Infinity,sea=0,mountain=0,ascending=0,descending=0;
    const section=delta=>(Math.round(wrapDelta(delta)/(2*BOUND/5))+5)%5;
    for(let i=0;i<samples;i++) {
      const p=legendFlight(n,i/4,{});
      assert.ok(p.x>=-BOUND && p.x<BOUND && p.z>=-BOUND && p.z<BOUND);
      cells.add(section(p.x-n.homeX)+','+section(p.z-n.homeZ));
      districts.add(regionAt(p.x,p.z));
      const ground=Math.max(WATER_Y,terrainHeight(p.x,p.z));
      assert.ok(p.y>Math.max(ground,solidHeightAt(p.x,p.z,2),canopyHeight(p.x,p.z,2)));
      if(type==='kirin' && i%8===0) {
        for(const side of [-1,1])for(const forward of [-.64,.60]) {
          const x=wrapDelta(p.x+n.stature*(forward*Math.sin(p.heading)+side*.24*Math.cos(p.heading)));
          const z=wrapDelta(p.z+n.stature*(forward*Math.cos(p.heading)-side*.24*Math.sin(p.heading)));
          assert.ok(p.y>Math.max(terrainHeight(x,z),solidHeightAt(x,z,.65),canopyHeight(x,z,.65)),'room under the walking hooves');
        }
      }
      if(waterDepth(p.x,p.z)>.25) sea++;
      if(ground>23) mountain++;
      low=Math.min(low,p.altitude);high=Math.max(high,p.altitude);
      if(i) {
        assert.ok(Math.hypot(wrapDelta(p.x-previous.x),wrapDelta(p.z-previous.z))<8,'continuous across map seams');
        assert.ok(Math.abs(p.y-previous.y)<3.5,'continuous climb');
        if(type==='dragon') {
          const turn=p.heading-previous.heading;
          assert.ok(Math.abs(Math.atan2(Math.sin(turn),Math.cos(turn)))<.5,'the tail sweeps around a turn');
        }
        if(p.y>previous.y+.08) ascending++;
        if(p.y<previous.y-.08) descending++;
      }
      Object.assign(previous,p);
    }
    assert.equal(cells.size,25);assert.equal(districts.size,REGIONS.length);
    if(type==='dragon') assert.ok(low>18 && low<26 && high>130);
    else assert.ok(low<11 && high>52);
    assert.ok(sea>0 && mountain>0 && ascending>40 && descending>40);
    const next=legendFlight(n,period,{}), first=legendFlight(n,0,{});
    assert.ok(Math.hypot(wrapDelta(next.x-first.x),wrapDelta(next.z-first.z))>5,'next circuit has fresh stops');
  }
});

test('the sky seed restores a remote flight before the first frame and through old journeys',()=>{
  const first=createGame(), snapshot=first.save();
  assert.equal(snapshot.flightSeed,first.state.flightSeed);
  const sample=(game,type)=>game.state.npcs.find(n=>n.type===type);
  const savedTime=90234.56;
  const game=createGame({...snapshot,time:savedTime});
  for(const type of ['dragon','kirin']) {
    const traveller=sample(game,type), expected=legendFlight(sample(first,type),savedTime,{});
    for(const key of ['x','y','z','heading']) assert.equal(traveller[key],expected[key]);
    assert.ok(game.state.nearbyNpcs.includes(traveller),'both world travellers update outside their home district');
  }
  game.step(1/60);
  for(const type of ['dragon','kirin']) {
    const current=sample(game,type), expected=legendFlight(sample(first,type),game.state.time,{});
    assert.equal(current.x,expected.x);assert.equal(current.y,expected.y);
  }
  const second=createGame({...snapshot,flightSeed:(snapshot.flightSeed+1234567)>>>0});
  for(const type of ['dragon','kirin']) {
    const a=sample(first,type),b=sample(second,type);
    assert.notDeepEqual([a.x,a.y,a.z],[b.x,b.y,b.z]);
  }
  delete snapshot.flightSeed;
  assert.equal(createGame(snapshot).save().flightSeed,createGame(snapshot).save().flightSeed);
});

test('the flight velocity follows the drawn curve across route and altitude sample boundaries',()=>{
  const game=createGame({...createGame().save(),flightSeed:7}), dt=.001;
  for(const type of ['dragon','kirin']) {
    const n=game.state.npcs.find(n=>n.type===type), period=circuitTime(n);
    const vx=p=>p.speed*Math.sin(p.heading), vz=p=>p.speed*Math.cos(p.heading);
    for(const t of [0,.22,35.23,56.10,196.68,period,period+.22,2*period]) {
      const a=legendFlight(n,t-dt,{}), b=legendFlight(n,t,{}), c=legendFlight(n,t+dt,{});
      assert.ok(Math.abs(wrapDelta(c.x-a.x)/(2*dt)-vx(b))<.01);
      assert.ok(Math.abs(wrapDelta(c.z-a.z)/(2*dt)-vz(b))<.01);
      assert.ok(Math.abs((c.y-a.y)/(2*dt)-b.verticalSpeed)<.04);
      assert.ok(Math.hypot(vx(a)-vx(c),vz(a)-vz(c))<.025);
    }
  }
  // Follow the pitch and wave at both ends of the enlarged body. Its tail
  // may still be crossing a canopy when the head is already in the clear.
  const dragon=game.state.npcs.find(n=>n.type==='dragon');
  const sections=[[-.65,.50,-3.16],[-.35,.03,-2.92],[.42,-.12,-.35],[-.45,.42,.70],[-.13,1.50,1.60]];
  let crossings=0;
  for(let time=0;time<circuitTime(dragon);time+=.25) {
    const p=legendFlight(dragon,time,{}), pitch=dragonPitch(p), scale=dragon.stature;
    for(const [x,y,z] of sections) {
      const tailZ=dragonTailZ(z), sway=dragonWave(tailZ,dragonPhase(time,dragon),{});
      const along=tailZ*scale*dragonLengthScale, across=(x+sway.x)*scale, up=(y+sway.y)*scale;
      const forward=along*Math.cos(pitch)+up*Math.sin(pitch);
      const px=wrapDelta(p.x+Math.sin(p.heading)*forward+Math.cos(p.heading)*across);
      const pz=wrapDelta(p.z+Math.cos(p.heading)*forward-Math.sin(p.heading)*across);
      const crown=canopyHeight(px,pz,2), top=Math.max(crown,solidHeightAt(px,pz,2),terrainHeight(px,pz));
      const belly=p.y+up*Math.cos(pitch)-along*Math.sin(pitch);
      if(pitch<-.3 && z< -2 && Number.isFinite(crown))crossings++;
      assert.ok(belly>top+.5,'pitched body clears the terrain, roofs and crowns at '+time);
    }
  }
  assert.ok(crossings>15);
});

test('wing flight can reach the high route and the dragon’s tail sweeps with its body',()=>{
  const game=createGame(),p=game.state.player, ground=groundHeight(-55,290);
  Object.assign(p,{x:-55,z:290,y:ground,h:0,grounded:true});
  game.act('habutae');game.act('jump');
  for(let i=0;i<1300 && p.h<98;i++) {
    if(i%13===0)game.act('jump');
    game.step(1/60,{jump:true});
  }
  assert.ok(p.h>=98 && p.mode==='habutae' && p.mp>0);
  let sweep=0;
  for(let phase=0;phase<2*Math.PI;phase+=.1){
    const nose=dragonWave(1.42,phase,{}),tail=dragonWave(dragonTailZ(-2.95),phase,{});
    sweep=Math.max(sweep,Math.hypot(tail.x-nose.x,tail.y-nose.y));
  }
  assert.ok(sweep>.65);
  const poses=Array.from({length:100},(_,t)=>walkingScore(t,{phase:2},{}));
  assert.ok(poses.some(p=>p.gesture>.85 && p.pace===0));
  assert.ok(poses.some(p=>p.gesture===0 && p.pace===1));
});
