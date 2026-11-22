import {DISTRICTS, FIFTH_EDITION_CENTRES, relocateLegacyPosition} from '../two/geography.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {BOUND, CONNECTING_ROADS, REGIONS, ORIGINAL_REGIONS, terrainHeight, waterDepth, solidHeightAt} from '../two/terrain.js';
import {RETREATS,sitePoint} from '../two/retreat-layout.js';
import {INARI_GATES, INARI_ROUTE, PEACH_TREES, MOON_GATE} from '../two/pilgrimage-layout.js';
import {PALACE_APPROACH} from '../two/ryugu-layout.js';
import {kyoInfluence, kyoNight} from '../two/kyo-layout.js';
import {measureRoute, cartPosition} from '../two/trade-routes.js';
import {merchantPosition} from '../two/travelling-merchants.js';
import {createGame} from '../two/game.js';

test('the expanded island doubles each horizontal dimension and joins at an even ocean floor',()=>{
  assert.ok(Math.abs((2*BOUND)**2-8*832**2)<1e-8);
  assert.deepEqual(REGIONS.slice(0,10),ORIGINAL_REGIONS);
  for(const a of REGIONS.slice(10,14)) for(const b of REGIONS.slice(10,14)) {
    const oldA=FIFTH_EDITION_CENTRES[a.id],oldB=FIFTH_EDITION_CENTRES[b.id];
    assert.equal(Math.hypot(a.x-b.x,a.z-b.z),2*Math.hypot(oldA.x-oldB.x,oldA.z-oldB.z));
    assert.deepEqual(relocateLegacyPosition(oldA.x,oldA.z),[a.x,a.z]);
  }
  assert.ok(DISTRICTS.inari.z > DISTRICTS.kyo.z+150);
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

test('the Fushimi watershed has broad wooded spurs above and beyond the torii road',()=>{
  const {x,z}=DISTRICTS.inari;
  for(const [u,v] of [[-260,71],[-210,169],[-180,211],[58,84]]) {
    assert.ok(terrainHeight(x+u,z+v)>28,'natural spur at '+[u,v]);
  }
  assert.ok(terrainHeight(x-185,z+147)>terrainHeight(x+5,z+147)+35);
  for(const r of CONNECTING_ROADS) {
    for(const point of r.points)assert.ok(waterDepth(...point)<.2,r.destination);
  }
  for(const point of PALACE_APPROACH.slice(1))assert.ok(waterDepth(...point)>1);
});

test('the peach orchard lies inside a mountain range with a low eastern pass',()=>{
  const {x,z}=DISTRICTS.peach;
  assert.ok(terrainHeight(x,z)<10);
  for(const [u,v] of [[-171,0],[-145,-48],[-92,-106],[-33,-122]]) {
    assert.ok(terrainHeight(x+u,z+v)>55,'western massif at '+[u,v]);
  }
  const path=CONNECTING_ROADS.find(r=>r.destination==='桃源郷').points;
  for(let i=1;i<path.length;i++){
    const [a,b]=path[i-1],[c,d]=path[i];
    const gradient=Math.abs(terrainHeight(a,b)-terrainHeight(c,d))/Math.hypot(a-c,b-d);
    assert.ok(gradient<.43,'road grade at '+[a,b]);
  }
});

test('the original peach valley and its surrounding bluffs support three times the flowering trees',()=>{
  assert.equal(PEACH_TREES.length+1,3*142); // The moon gate's ancient peach is separately modeled.
  const cliffs=PEACH_TREES.filter(t=>t.cliff);
  assert.equal(cliffs.length,162);
  const heights=cliffs.map(t=>terrainHeight(t.x,t.z));
  assert.ok(Math.max(...heights)-Math.min(...heights)>35);
  for(const t of PEACH_TREES){
    assert.ok(Math.hypot(t.x-MOON_GATE.x,t.z-MOON_GATE.z)>8.9);
    assert.ok(terrainHeight(t.x,t.z)>0);
  }
});

test('sixth-edition journeys follow the relocated Fushimi shrine and the two roadside baths',()=>{
  const game=createGame(),save=game.save();
  save.version=6;save.items.length=62;save.bikes.length=14;
  const old=[-306,-1070],inari=DISTRICTS.inari;
  Object.assign(save.player,{x:old[0]-9,z:old[1]+4});
  Object.assign(save.turtle,{x:old[0]+1,z:old[1]+6,homeX:old[0],homeZ:old[1]});
  save.visited=['inari','river'];save.delivered=[game.state.npcs[0].id];
  const resumed=createGame(save);
  assert.equal(resumed.restored,true);
  const next=resumed.save();
  assert.deepEqual([next.player.x,next.player.z],[inari.x-9,inari.z+4]);
  assert.deepEqual([next.turtle.homeX,next.turtle.homeZ],[inari.x,inari.z]);
  assert.deepEqual(next.delivered,save.delivered);
  assert.ok(next.visited.includes('inari'));
  assert.deepEqual(next.bikes,[...save.bikes,2,2]);
  for(const [kind,x,z,yaw] of [['cedar',70.6414975,-547.0094339,1.0957856],['slate',-126.0135841,-869.3986739,-.6536359]]){
    [save.player.x,save.player.z]=sitePoint({x,z,yaw},1.3,-.7);
    const [expectedX,expectedZ]=sitePoint(RETREATS.find(s=>s.kind===kind),1.3,-.7);
    const bath=createGame(save).save().player;
    assert.ok(Math.hypot(bath.x-expectedX,bath.z-expectedZ)<1e-6);
  }
});

test('a fifth-edition save follows its district, including underwater depth and turtle position',()=>{
  const game=createGame(), snap=game.save();
  snap.version=5;snap.items.length=56;snap.bikes.length=14;
  for(const [id,at] of Object.entries(FIFTH_EDITION_CENTRES)){
    const underwater=id==='ryugu';
    Object.assign(snap.player,{x:at.x,z:at.z,y:underwater?-15:6,diveDepth:underwater?15:0});
    Object.assign(snap.turtle,{x:at.x+3,z:at.z+2,homeX:at.x+3,homeZ:at.z+2});
    const resumed=createGame(snap);
    assert.equal(resumed.restored,true);
    const next=resumed.save();
    assert.deepEqual([next.player.x,next.player.z],[DISTRICTS[id].x,DISTRICTS[id].z]);
    assert.deepEqual([next.turtle.x,next.turtle.z],[DISTRICTS[id].x+3,DISTRICTS[id].z+2]);
    assert.equal(next.player.diveDepth,underwater?15:0);
  }
});

test('city lights follow a local day and night cycle',()=>{
  assert.equal(kyoInfluence(DISTRICTS.kyo.x,DISTRICTS.kyo.z),1);assert.equal(kyoInfluence(0,62),0);
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
