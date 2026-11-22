import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../two/game.js';
import { MATSUHAMA_LIFT,villagePools,villageStations } from '../two/village-bath-courses.js';
import { RETREATS,sitePoint } from '../two/retreat-layout.js';
import { groundHeight,WATER_Y,waterSurfaceAt,springLevel,shoreDistance } from '../two/terrain.js';

const site=RETREATS.find(s=>s.id==='coast-kaigara'),level=springLevel(site);
function stand(game,u,v){
  const [x,z]=sitePoint(site,u,v),p=game.state.player;
  Object.assign(p,{x,z,y:groundHeight(x,z),h:0,vx:0,vy:0,vz:0,speed:0,grounded:true});game.step(1/60);
}
function walk(game,u,v){
  const [x,z]=sitePoint(site,u,v),p=game.state.player;
  for(let i=0;i<420;i++){
    const dx=x-p.x,dz=z-p.z,l=Math.hypot(dx,dz);
    if(l<.11)return;
    game.step(1/60,{x:dx/l,z:dz/l});
  }
  assert.fail('Harbor path blocked on the way to '+u+', '+v+' at '+[p.x,p.z]);
}
test('the shore intake is submerged and each bathing craft has its own usable waterline and posture',()=>{
  const {head,tail}=MATSUHAMA_LIFT;
  assert.ok(shoreDistance(...sitePoint(site,tail[0],tail[2]))<0);
  assert.ok(level+tail[1]<WATER_Y && level+head[1]>WATER_Y);
  const pools=villagePools(site);
  assert.ok(pools[0].y>pools[1].y);
  for(const [i,p] of pools.entries()){
    assert.equal(waterSurfaceAt(...sitePoint(site,p.u,p.v)),level+p.y);
    const g=createGame();stand(g,p.u,p.v);
    assert.ok(g.act('interact'));g.step(.1);
    const pose=g.state.player.bathPose;
    assert.equal(pose.id,p.id);
    assert.equal(pose.action,i?'recline':'cascade');
    const [x,z]=sitePoint(site,p.berthU,p.berthV);
    for(let k=0;k<12;k++)g.step(.1);
    assert.ok(Math.hypot(g.state.player.bathPose.x-x,g.state.player.bathPose.z-z)<.02);
  }
  const dry=sitePoint(site,.61,.32);
  assert.ok(waterSurfaceAt(...dry)<groundHeight(...dry));
});
test('a bather walks from the cool vat to the separate freshwater room, uses the dipper and returns outside',()=>{
  const g=createGame(),p=g.state.player,rinse=villageStations(site).find(q=>q.action==='rinse');
  stand(g,2.58,.14);
  const path=[[2.58,-1.14],[2.58,-2.63],[2.58,-3.92],[1.10,-4.28],[rinse.u,rinse.v]];
  for(const [u,v] of path)walk(g,u,v);
  for(let j=0;j<15;j++)g.step(1/60);
  assert.equal(g.nearest().place.id,'abalone-rinse');
  p.hp=42;p.mp=44;assert.ok(g.act('interact'));assert.equal(p.bathPose.wet,false);
  for(let j=0;j<34;j++)g.step(.1);
  assert.equal(p.hp,42);assert.ok(p.mp<100);assert.equal(p.buffs.warm,0);
  for(const [u,v] of path.slice(0,-1).reverse())walk(g,u,v);
  walk(g,2.58,.14);walk(g,2.58,3.89);walk(g,0,4.70);
  assert.equal(p.inWater,false);
});
test('a resting traveller saved at the former shell bed over the new dry centre aisle keeps the named bath',()=>{
  const g=createGame(),p=villagePools(site)[1];stand(g,p.u,p.v);
  assert.ok(g.act('interact'));g.step(.1);
  const saved=g.save(),[x,z]=sitePoint(site,.28,.15);
  Object.assign(saved.player,{x,z,y:level-.40});
  const resumed=createGame(saved),hero=resumed.state.player;
  assert.ok(resumed.restored);
  assert.equal(hero.activity,'bath');assert.equal(hero.bathPose.id,p.id);
  assert.equal(hero.bathWaterY,level+p.y);
  const [tx,tz]=sitePoint(site,p.u,p.v);
  assert.ok(Math.hypot(tx-hero.x,tz-hero.z)<.05);
});
