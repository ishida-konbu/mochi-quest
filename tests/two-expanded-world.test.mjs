import test from 'node:test';
import assert from 'node:assert/strict';
import {BOUND, CONNECTING_ROADS, REGIONS, ORIGINAL_REGIONS, terrainHeight, waterDepth, solidHeightAt} from '../two/terrain.js';
import {INARI_GATES, INARI_ROUTE} from '../two/pilgrimage-layout.js';
import {kyoInfluence, kyoNight} from '../two/kyo-layout.js';
import {measureRoute, cartPosition} from '../two/trade-routes.js';
import {merchantPosition} from '../two/travelling-merchants.js';
import {createGame} from '../two/game.js';

test('the expanded island doubles the playable area and joins at an even ocean floor',()=>{
  assert.ok(Math.abs((2*BOUND)**2-2*832**2)<1e-8);
  assert.deepEqual(REGIONS.slice(0,10),ORIGINAL_REGIONS);
  for(let v=-BOUND+1;v<BOUND;v+=5.1){
    assert.ok(Math.abs(terrainHeight(v,-BOUND+.01)-terrainHeight(v,BOUND-.01))<.015);
    assert.ok(Math.abs(terrainHeight(-BOUND+.01,v)-terrainHeight(BOUND-.01,v))<.015);
  }
});

test('the Inari route leads through a thousand open gates up to the summit seal',()=>{
  assert.equal(INARI_GATES.length,1000);
  for(const {x,z} of INARI_GATES){
    const y=terrainHeight(x,z);
    assert.ok(solidHeightAt(x,z,.38,y)<y+.36);
  }
  const [first,last]=[INARI_ROUTE[0],INARI_ROUTE.at(-1)];
  const shrine=REGIONS.find(r=>r.id==='inari');
  assert.ok(terrainHeight(...last)-terrainHeight(...first)>65);
  assert.ok(Math.hypot(shrine.x-last[0],shrine.z-last[1]) < 6);
  const game=createGame(), p=game.state.player;
  Object.assign(p,{x:last[0],z:last[1],y:terrainHeight(...last)+120,h:120,grounded:false});
  assert.ok(game.save().player.y>200);
  assert.equal(createGame(game.save()).restored,true);
});

test('city lights follow a local day and night cycle',()=>{
  assert.equal(kyoInfluence(120,-424),1);assert.equal(kyoInfluence(0,62),0);
  assert.equal(kyoNight(0),0);assert.equal(kyoNight(72),1);assert.equal(kyoNight(144),0);
});

test('both ox teams reach each town on dry roads and all three merchants keep to water',()=>{
  CONNECTING_ROADS.slice(0,2).forEach((road,i)=>{
    const route=measureRoute(road.points), speed=i===0?1.85:1.63;
    assert.ok(route.length>240);
    const start=cartPosition(route,0,speed);
    const end=cartPosition(route,route.length/speed+3,speed);
    const back=cartPosition(route,2*(route.length/speed+7),speed);
    assert.equal(end.moving,false);
    assert.ok(Math.hypot(end.x-start.x,end.z-start.z)>160);
    assert.ok(Math.hypot(back.x-start.x,back.z-start.z)<.01);
    for(let t=0;t<2*(route.length/speed+7);t+=.5){
      const q=cartPosition(route,t,speed);
      for(const offset of [-1.6,0,3.2]){
        const x=q.x+Math.sin(q.yaw)*offset,z=q.z+Math.cos(q.yaw)*offset;
        assert.ok(waterDepth(x,z)<.15,'cart enters water at '+[x,z]);
        const y=terrainHeight(x,z), clearance=offset>2?.47:1;
        assert.ok(solidHeightAt(x,z,clearance,y)<y+.45,'cart clips scenery at '+[x,z]);
      }
    }
  });
  for(let i=0;i<3;i++) for(let t=0;t<310;t+=.5){
    const p=merchantPosition(i,t);
    assert.ok(waterDepth(p.x,p.z)>1);
  }
});
