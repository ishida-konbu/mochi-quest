import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../two/game.js';
import {moveWildlife, kirinFlight, dragonVisible} from '../two/bestiary.js';
import {dragonWave, walkingScore} from '../two/animal-motion.js';
import {terrainHeight, groundHeight, WATER_Y, REGIONS} from '../two/terrain.js';

test('flight strata span each district and a distant crane moves on every tick',()=>{
  const game=createGame(), cranes=game.state.npcs.filter(n=>n.type==='bird');
  for(const place of REGIONS) {
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
  const game=createGame(),crane=game.state.npcs.find(n=>n.id==='bird-531'),p=game.state.player;
  // At t=12 the crane is inside the view radius although its perch lies
  // 158 metres from the next cell centre. Crossing x=96 must not drop it.
  game.state.time=12;
  moveWildlife(crane,game.state.time);
  for(const x of [95.95,96.05,97.95]) {
    Object.assign(p,{x,z:crane.z,y:groundHeight(x,crane.z)});
    game.step(1/60);
    assert.ok(Math.abs(crane.x-p.x)<128);
    assert.ok(game.state.nearbyNpcs.includes(crane));
  }
});

test('the dragon flies above ordinary jumps and a full Habutae flight can reach its route',()=>{
  const game=createGame(),d=game.state.npcs.find(n=>n.type==='dragon'),p=game.state.player;
  assert.ok(!dragonVisible(p));
  const heights=[];
  for(let t=0;t<150;t++) {moveWildlife(d,t); heights.push(d.altitude);}
  assert.ok(Math.min(...heights)>79 && Math.max(...heights)<105);
  const ground=groundHeight(-55,290);
  Object.assign(p,{x:-55,z:290,y:ground,h:0,grounded:true});
  game.act('habutae');game.act('jump');
  for(let i=0;i<1300 && p.h<98;i++) {
    if(i%13===0)game.act('jump');
    game.step(1/60,{jump:true});
  }
  assert.ok(p.h>=98 && p.mode==='habutae' && p.mp>0 && dragonVisible(p));
  let sweep=0;
  for(let phase=0;phase<2*Math.PI;phase+=.1){
    const nose=dragonWave(1.42,phase,{}),tail=dragonWave(-2.95,phase,{});
    sweep=Math.max(sweep,Math.hypot(tail.x-nose.x,tail.y-nose.y));
  }
  assert.ok(sweep>.65);
});

test('the kirin wanders through fresh horizontal and vertical waypoints above the local ground',()=>{
  const game=createGame(),n=game.state.npcs.find(n=>n.type==='kirin'),point={};
  let low=20,high=0,up=0,down=0,prev;
  const headings=new Set();
  for(let i=0;i<800;i++){
    kirinFlight(n,i*.2,point);
    const ground=Math.max(WATER_Y,terrainHeight(point.x,point.z));
    const h=point.y-ground;
    assert.ok(h>2 && h<12,`kirin clearance ${h}`);
    low=Math.min(low,h); high=Math.max(high,h);
    headings.add(Math.round(point.heading*2));
    if(prev){
      assert.ok(Math.hypot(point.x-prev.x,point.z-prev.z)<.9);
      assert.ok(Math.abs(point.y-prev.y)<.30,'no vertical jumps at the edge of a rooftop');
      if(point.y>prev.y+.015)up++;
      if(point.y<prev.y-.015)down++;
    }
    prev={...point};
  }
  assert.ok(high-low>2 && up>50 && down>50 && headings.size>10);
  const poses=[];
  for(let i=0;i<100;i++)poses.push({...walkingScore(i,n,{})});
  assert.ok(poses.some(p=>p.gesture>.85 && p.pace===0));
  assert.ok(poses.some(p=>p.gesture===0 && p.pace===1));
});
