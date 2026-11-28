import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import { createGame } from '../two/game.js';
import { BUILDINGS, ORIGINAL_REGIONS as REGIONS, regionAt, groundHeight, nearRoad, waterDepth, solidHeightAt } from '../two/terrain.js';
import { animalRadius, openGround, walkCircuit } from '../two/village-paths.js';
import { roomPlan } from '../two/architecture.js';
import { DYES, TRADES } from '../two/procession.js';
import { LIVING_SITES } from '../two/living-sites.js';
import { STARTER_RECIPES } from '../two/living-craft.js';
import { cookingLayout } from '../two/cooking-stage.js';
import { createCookingScore } from '../two/cooking-motion.js';
import { worktopPoint } from '../two/living-layout.js';

test('restored journeys keep the village cast when local fixtures and ground move',()=>{
  const workers=createGame().state.npcs.filter(n=>n.area);
  const cast=workers.map(n=>[n.id,n.role,n.phase,n.stature,n.build,n.dye]);
  // Published cast before the maple turnout and the dawn port were repaired.
  assert.equal(createHash('sha256').update(JSON.stringify(cast)).digest('hex'),
    'f692b8a3100964e5a659270e7de4cbe833e5e36c1b274992dd17ea2b4d6ab4a0');
  for(const [id,x,z] of [['frog-341',296.433807457209,-102.82211438380389],
    ['rabbit-411',257.0213819625716,133.44051278125917],
    ['frog-433',263.56874440819973,118.038205001877]]){
    const worker=workers.find(n=>n.id===id);
    assert.ok(Math.hypot(worker.homeX-x,worker.homeZ-z)<.001);
  }
});

test('the ten villages support ten times the original hares and frogs, with varied trades and clear roads',()=>{
  const game=createGame(), {npcs,objects}=game.state;
  for(const [species,count] of [['rabbit',190],['frog',250]]) {
    const residents=npcs.slice(0,675).filter(n=>n.type===species);
    assert.equal(residents.length,count);
    const workers=residents.filter(n=>n.area);
    assert.deepEqual(new Set(workers.map(n=>n.role)),new Set(TRADES));
    assert.equal(new Set(workers.map(n=>n.dye)).size,DYES.length);
    assert.equal(new Set(workers.map(n=>n.dye+'-'+n.role)).size,TRADES.length*DYES.length);
  }
  for(const region of REGIONS) {
    const workers=npcs.filter(n=>n.area===region.id);
    assert.ok(workers.length>=39);
    for(const n of workers) {
      if(n.room!==undefined) {
        const b=BUILDINGS[n.room], dx=n.x-b.x,dz=n.z-b.z;
        assert.ok(Math.abs(dx*b.cos-dz*b.sin)<b.w/2-1);
        assert.ok(Math.abs(dx*b.sin+dz*b.cos)<b.d/2-1);
        assert.ok(Math.abs(n.y-groundHeight(n.x,n.z))<.01);
        const bench=roomPlan(b).workbench, u=dx*b.cos-dz*b.sin, v=dx*b.sin+dz*b.cos;
        const gap=bench.u-bench.width/2-u;
        assert.ok(gap>.29 && gap<.46 && Math.abs(v-bench.v)<bench.depth/2+.25);
        assert.ok(Math.sin(n.heading-b.yaw)>.98);
        assert.ok(solidHeightAt(n.x,n.z,.25,n.y)<=n.y+.2);
        assert.ok(n.craft);
        continue;
      }
      assert.ok(!nearRoad(n.x,n.z,1.9) && waterDepth(n.x,n.z)<=.06);
      assert.ok(solidHeightAt(n.x,n.z,1.15)<=n.y+.2);
      assert.ok(objects.every(o=>Math.hypot(o.x-n.x,o.z-n.z)>=5.6));
    }
  }
  const rooms=npcs.filter(n=>n.room!==undefined).map(n=>BUILDINGS[n.room]);
  assert.deepEqual(new Set(rooms),new Set(BUILDINGS.filter(b=>b.kind!=='pagoda' && regionAt(b.x,b.z)<REGIONS.length)));
  assert.equal(npcs.filter(n=>n.type==='turtle').length,1);
});

test('a returning traveller can stand beside the local artisans and deliver a notice',()=>{
  const original=createGame();
  const shop=original.state.npcs.find(n=>n.area==='snow' && n.role==='scribe');
  const snap=original.save();
  Object.assign(snap.player,{x:shop.x,z:shop.z,y:shop.y,heading:0});
  const game=createGame(snap),p=game.state.player;
  const nearby=game.state.nearbyNpcs;
  assert.ok(nearby.some(n=>n.id===shop.id));
  assert.ok(nearby.length<game.state.npcs.length/2);
  game.step(1/60);
  assert.equal(p.hp,100);
  assert.equal(p.activity,null);
  assert.equal(game.act('throw'),true);
  for(let i=0;i<6;i++) game.step(1/60);
  assert.equal(game.state.score,10);
});

test('whole wildlife and porter circuits keep their turning clearance even after a camera cut',()=>{
  const {state}=createGame(), point={};
  const walkers=state.npcs.filter(n=>n.radius && !n.ridesDeer && !['bird','dragon','kirin'].includes(n.type));
  for(const n of walkers) {
    for(let i=0;i<120;i++) {
      walkCircuit(n,i*Math.PI/60,point);
      assert.ok(openGround(point.x,point.z,animalRadius(n)),n.id+' at turn '+i);
    }
  }
});

test('a passer-by on any part of its circuit clears the cook approaching and turning between the appliances',()=>{
  const {npcs}=createGame().state;
  for(const site of LIVING_SITES.filter(s=>s.matEntrance)){
    const layout=cookingLayout(site),recipe=STARTER_RECIPES.find(r=>r.regionId===site.region);
    const walkers=npcs.filter(n=>n.radius && !n.ridesDeer && !['bird','dragon','kirin'].includes(n.type) &&
      Math.hypot(n.homeX-site.x,n.homeZ-site.z)<2*n.radius+12);
    const marks=[];
    for(const entry of [site,site.matEntrance]){
      const dx=entry.x-layout.x,dz=entry.z-layout.z,c=Math.cos(layout.yaw),s=Math.sin(layout.yaw);
      const start=[dx*c-dz*s,entry.y-layout.y,dx*s+dz*c];
      const score=createCookingScore(recipe.draft,layout,{start,full:true});
      for(let t=0;t<score.duration;t+=.12){
        const {hero,bodyRadius}=score.sample(t);
        marks.push({...worktopPoint(layout,hero[0],hero[2]),radius:bodyRadius});
      }
    }
    const point={};
    for(const n of walkers){
      const radius=animalRadius(n);
      for(let i=0;i<144;i++){
        walkCircuit(n,i*Math.PI/72,point);
        const hit=marks.some(mark=>(mark.x-point.x)**2+(mark.z-point.z)**2<(radius+mark.radius+.04)**2);
        assert.ok(!hit,site.id+' and '+n.id+' at turn '+i);
      }
    }
  }
});
