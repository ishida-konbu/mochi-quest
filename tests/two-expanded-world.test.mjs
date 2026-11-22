import {DISTRICTS, FIFTH_EDITION_CENTRES, relocateLegacyPosition} from '../two/geography.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {BOUND, CONNECTING_ROADS, REGIONS, ORIGINAL_REGIONS, terrainHeight, roadSurfaceHeight, groundHeight, waterDepth, solidHeightAt, bridgeAt, bridgeHeight} from '../two/terrain.js';
import {RETREATS,bathRadius,sitePoint} from '../two/retreat-layout.js';
import {INARI_GATES, INARI_ROUTE, PEACH_TREES, nearPeachTrunk, MOON_GATE} from '../two/pilgrimage-layout.js';
import {PALACE_APPROACH} from '../two/ryugu-layout.js';
import {HIGASHIYAMA} from '../two/higashiyama.js';
import {kyoInfluence, kyoNight, kyoClock, KYO_DAY_SECONDS} from '../two/kyo-layout.js';
import { CARRIAGES, OX_HITCH, RIVER_SKIFFS, carriageHorizontalPose, carriagePose, merchantPosition } from '../two/traveller-positions.js';
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

test('the 426-tree orchard flowers around the moon gate and leaves its paths and lookout open',()=>{
  const centre=DISTRICTS.peach,spring=RETREATS.find(s=>s.kind==='peach');
  const basin=PEACH_TREES.filter(t=>!t.cliff),slopes=PEACH_TREES.filter(t=>t.cliff);
  assert.equal(basin.length,263);
  assert.equal(slopes.length,162); // The moon-gate sculpture adds the 426th peach.
  assert.ok(slopes.some(t=>t.upland && terrainHeight(t.x,t.z)>85));
  for(const side of [-1,1]){
    assert.ok(basin.filter(t=>Math.sign(t.z-MOON_GATE.z)===side &&
      Math.hypot(t.x-MOON_GATE.x,t.z-MOON_GATE.z)<22).length>=5,'flowering bank beside the gate');
  }
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
  for(const t of PEACH_TREES){
    assert.ok(Math.hypot(t.x-MOON_GATE.x,t.z-MOON_GATE.z)>8.9);
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

test('four ox carriages take their passengers to town, over the deck and clear of scenery, while the five small traders stay afloat',()=>{
  assert.deepEqual(CARRIAGES.map(j=>j.id),['snow-kyoto','susuki-todaiji','kyoto-sakai','kyoto-todaiji']);
  let deckSamples=0;
  for(const journey of CARRIAGES){
    const {route,speed,offset}=journey, travel=route.length/speed,half=travel+7;
    const start=carriagePose(journey,-offset),end=carriagePose(journey,travel+3-offset);
    const back=carriagePose(journey,2*half-offset);
    assert.equal(end.moving,false);
    assert.ok(Math.hypot(end.x-start.x,end.z-start.z)>160);
    assert.ok(Math.hypot(back.x-start.x,back.z-start.z)<.01);
    for(let t=0;t<2*half;t+=.65){
      const q=carriagePose(journey,t),s=Math.sin(q.yaw),c=Math.cos(q.yaw);
      for(const [u,v] of [[-1.08,-1.65],[1.08,-1.65],[-1.08,.55],[1.08,.55],
        [-.44,OX_HITCH],[.44,OX_HITCH],[0,OX_HITCH+1.35]]){
        const x=q.x+c*u+s*v,z=q.z-s*u+c*v,bridge=bridgeAt(x,z);
        const floor=bridge?bridgeHeight(bridge,z):roadSurfaceHeight(x,z);
        const where=journey.id+' at '+[x,z].map(n=>n.toFixed(1));
        if(bridge){deckSamples++;assert.ok(Math.abs(x-bridge.x)+.12<bridge.halfWidth,where);}
        assert.ok(bridge || waterDepth(x,z)<.15,where+' water');
        assert.ok(solidHeightAt(x,z,.08,floor)<floor+.45,where+' obstruction');
      }
    }
  }
  assert.ok(deckSamples>100);
  for(let i=0;i<2+RIVER_SKIFFS.length;i++) for(let t=0;t<310;t+=.5){
    const p=merchantPosition(i,t);
    assert.ok(waterDepth(p.x,p.z)>1);
  }
});

test('the long-distance and local temple passengers pass with room for both carriages and their oxen',()=>{
  const local=CARRIAGES[1],through=CARRIAGES[3],cycle=4*(through.route.length/through.speed+7);
  const parts=[[-1.65,1.22],[-.55,1.22],[.65,1.22],[1.70,.86],[2.75,.66],[3.90,.61],[4.95,.44]];
  let passing=0;
  for(let t=0;t<cycle;t+=.42){
    const a=carriageHorizontalPose(local,t),b=carriageHorizontalPose(through,t);
    if(Math.hypot(a.x-b.x,a.z-b.z)>13)continue;
    passing++;
    assert.ok(a.moving && b.moving);
    assert.ok(a.passing>0 && b.passing<0);
    for(const [av,ar] of parts)for(const [bv,br] of parts){
      const dx=a.x+av*Math.sin(a.yaw)-b.x-bv*Math.sin(b.yaw);
      const dz=a.z+av*Math.cos(a.yaw)-b.z-bv*Math.cos(b.yaw);
      assert.ok(Math.hypot(dx,dz)>ar+br,'carriages overlap at '+[a.x,a.z].map(Math.round));
    }
  }
  assert.ok(passing>20);
});
