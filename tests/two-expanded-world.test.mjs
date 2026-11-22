import {DISTRICTS, FIFTH_EDITION_CENTRES, relocateLegacyPosition} from '../two/geography.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {BOUND, CONNECTING_ROADS, REGIONS, ORIGINAL_REGIONS, ROCKS, TREES, terrainHeight, roadSurfaceHeight, groundHeight, waterDepth, solidHeightAt} from '../two/terrain.js';
import {RETREATS,bathRadius,sitePoint} from '../two/retreat-layout.js';
import {CLIFF_PINES, INARI_GATES, INARI_ROUTE, PEACH_TREES, MOON_GATE, PEACH_BOUT, nearPeachTrunk} from '../two/pilgrimage-layout.js';
import {PALACE_APPROACH} from '../two/ryugu-layout.js';
import {HIGASHIYAMA} from '../two/higashiyama.js';
import {kyoInfluence, kyoNight, kyoClock, KYO_DAY_SECONDS} from '../two/kyo-layout.js';
import {measureRoute, cartPosition} from '../two/trade-routes.js';
import {merchantPosition} from '../two/travelling-merchants.js';
import {createGame} from '../two/game.js';
import {FLEET,vesselPose} from '../two/ocean-voyage.js';

test('the enlarged sea surrounds the distant ports and wraps at an even ocean floor',()=>{
  const north=REGIONS.find(r=>r.id==='tsuruga');
  assert.ok(north.z<DISTRICTS.kyo.z-580 && BOUND+north.z>120);
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

test('small peach groves frame the moon gate and leave the western outlook and rock shoulders open',()=>{
  const centre=DISTRICTS.peach,spring=RETREATS.find(s=>s.kind==='peach');
  const basin=PEACH_TREES.filter(t=>!t.cliff),mountain=PEACH_TREES.filter(t=>t.upland);
  assert.ok(PEACH_TREES.length>=180 && PEACH_TREES.length<=280);
  assert.ok(basin.length>=35 && basin.length<=70);
  assert.ok(mountain.some(t=>terrainHeight(t.x,t.z)>85));
  assert.ok(PEACH_TREES.some(t=>t.wayside && t.x>centre.x+170),'flowers on the outer bends');
  // Follow the line of sight from the west bluff to the roof, then check
  // separate open shelves against the north and south flowering stands.
  for(let u=-104;u<=-25;u+=4){
    assert.equal(nearPeachTrunk(centre.x+u,centre.z+(-u-14)*.065,7.2),false,'west outlook at '+u);
  }
  assert.ok(nearPeachTrunk(centre.x-103,centre.z+20,4),'flowering branch on the near bluff');
  assert.ok(nearPeachTrunk(centre.x-50,centre.z-52,10),'a stand on the opposite bank');
  for(const [u,v] of [[31,63],[61,-75],[-100,90]]){
    assert.equal(nearPeachTrunk(centre.x+u,centre.z+v,17),false,'open rock at '+[u,v]);
  }
  for(const t of [...TREES,...PEACH_TREES,...CLIFF_PINES]){
    assert.ok(Math.hypot(t.x-MOON_GATE.x,t.z-MOON_GATE.z)>8.9);
    assert.ok(Math.hypot(t.x-PEACH_BOUT.x,t.z-PEACH_BOUT.z)>6.2);
    // Test the camera as well as the ring. Standing on the south bank and
    // looking north used to put the lens inside both a plum and a peach.
    const reach=t.h ? .6*t.h : t.size ? 3.8*t.size : 2*t.scale;
    const dx=t.x-PEACH_BOUT.x;
    const dz=Math.max(0,PEACH_BOUT.z-t.z,t.z-PEACH_BOUT.z-15);
    assert.ok(Math.hypot(dx,dz)>4.5+reach);
  }
  for(const rock of ROCKS){
    assert.ok(!nearPeachTrunk(rock.x,rock.z,Math.max(rock.rx,rock.rz)+.4));
  }
  for(const t of PEACH_TREES){
    assert.ok(bathRadius(spring,t.x,t.z)>=1.38);
    assert.equal(waterDepth(t.x,t.z),0);
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
  for(let x=DISTRICTS.kyo.x;x<=HIGASHIYAMA.x;x+=5)assert.equal(kyoInfluence(x,DISTRICTS.kyo.z),1);
  for(const place of REGIONS.filter(r=>['tsuruga','sakai','inari'].includes(r.id)))assert.equal(kyoInfluence(place.x,place.z),0);
  assert.equal(KYO_DAY_SECONDS,288);
  assert.equal(kyoNight(0),0);assert.equal(kyoNight(144),1);assert.equal(kyoNight(288),0);
  // Dusk and dawn remain gradual and mirror one another on either side of midnight.
  assert.equal(kyoNight(54),0);
  assert.ok(kyoNight(72)>0 && kyoNight(72)<kyoNight(84) && kyoNight(84)<1);
  assert.equal(kyoNight(102),1);
  for(const t of [0,54,72,84,102,144]){
    assert.ok(Math.abs(kyoNight(t)-kyoNight(288-t))<1e-12);
    assert.ok(Math.abs(kyoNight(t)-kyoNight(288+t))<1e-12);
  }
});

test('the longer Kyoto cycle preserves the light of an older journey without rescheduling its ships',()=>{
  const fresh=createGame(),p=fresh.state.player;
  Object.assign(p,{x:DISTRICTS.kyo.x,z:DISTRICTS.kyo.z});
  fresh.state.time=144;fresh.step(.01);
  assert.ok(p.night);
  for(const [version,time] of [[5,72],[6,175.75],[7,144],[7,1000072]]){
    const oldSave=fresh.save();oldSave.time=time;oldSave.version=version;
    delete oldSave.player.kyoClockOffset;
    if(version===5)Object.assign(oldSave.player,FIFTH_EDITION_CENTRES.kyo);
    if(version<=6){oldSave.items.length=version===5?56:62;oldSave.bikes.length=14;}
    const resumed=createGame(oldSave),hero=resumed.state.player;
    assert.ok(resumed.restored);assert.equal(resumed.state.time,time);
    assert.equal(hero.night,kyoNight(time*2)>.48);
    assert.equal(kyoClock(time,hero)%288,(2*time)%288);
    const ship=resumed.voyage.poses[2],scheduled=vesselPose(FLEET[2],time);
    assert.deepEqual([ship.x,ship.z],[scheduled.x,scheduled.z]);
    resumed.step(.05);
    const again=createGame(resumed.save());
    assert.ok(again.restored);
    assert.equal(kyoClock(again.state.time,again.state.player),kyoClock(resumed.state.time,hero));
    assert.equal(again.state.player.night,hero.night);
  }
  const bad=fresh.save();bad.player.kyoClockOffset='bad';
  assert.equal(createGame(bad).state.player.kyoClockOffset,0);
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
        const y=roadSurfaceHeight(x,z), clearance=offset>2?.47:1;
        assert.ok(Math.abs(y-groundHeight(x,z,y))<.03,'cart leaves its road surface at '+[x,z]);
        assert.ok(solidHeightAt(x,z,clearance,y)<y+.45,'cart clips scenery at '+[x,z]);
      }
    }
  });
  for(let i=0;i<3;i++) for(let t=0;t<310;t+=.5){
    const p=merchantPosition(i,t);
    assert.ok(waterDepth(p.x,p.z)>1);
  }
});
