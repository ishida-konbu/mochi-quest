import test from 'node:test';
import assert from 'node:assert/strict';
import { createLivingWorld, readLivingWorld, validLivingWorld } from '../two/living-save.js';
import { constructionSite, finishConstruction, moveStructure, placeStructure, removeStructure,
  surveySite, validBuildLand } from '../two/living-build.js';
import { foundationPiers, foundationWood } from '../two/living-foundation.js';
import { MAX_WOOD } from '../two/living-build-state.js';
import { canOccupy,groundHeight,terrainContactHeight } from '../two/terrain.js';
import { entryFlight } from '../two/homestead-foundation.js';
import { syncBuildTerrain } from '../two/living-build.js';

const flat={x:23,z:88,yaw:0}, gentle={x:158,z:131,yaw:0};
const hillside={x:122,z:120,yaw:.3}, steep={x:124,z:124,yaw:.3};
const campAt={x:151,z:128,yaw:0}, hutAt={x:140,z:132,yaw:.3};
const ok=r=>{assert.ok(r.ok,r.reason);return r.structure;};

test('real hillside levels all four bearings; a steeper slope needs more timber',()=>{
  const w=createLivingWorld(), before=structuredClone(w);
  const levels=[flat,hillside,steep].map(p=>constructionSite(w,'stand',p));
  assert.ok(levels.every(r=>r.ok));
  assert.deepEqual(levels.map(p=>p.foundationWood),[0,1,2]);
  assert.ok(levels[1].relief>.52 && levels[2].relief>levels[1].relief);
  for(const s of levels) {
    const piers=foundationPiers('stand',s);
    assert.equal(piers.length,4);
    assert.deepEqual(piers.map(p=>p.topY),Array(4).fill(s.y));
    for(const p of piers) {
      const c=Math.cos(s.yaw),sin=Math.sin(s.yaw);
      assert.equal(p.groundY,terrainContactHeight(s.x+c*p.x+sin*p.z,s.z-sin*p.x+c*p.z));
      assert.ok(p.topY>=p.groundY);
    }
  }
  assert.ok(foundationWood('hut',9)>foundationWood('hut',3));
  assert.deepEqual(w,before);
});

test('commit charges the final quote; moves reuse timber and reject a shortfall or a full pack atomically',()=>{
  const w=createLivingWorld(), initial=w.wood;
  const stand=ok(placeStructure(w,'stand',flat));
  const stock=w.wood;
  const moveQuote=p=>surveySite(w,'stand',p,{excludeId:stand.id});
  w.wood=1;
  let previous=structuredClone(w);
  assert.equal(moveQuote(steep).foundationWoodDelta,2);
  assert.equal(moveStructure(w,stand.id,steep).ok,false);
  assert.deepEqual(w,previous);
  w.wood=stock;
  assert.equal(ok(moveStructure(w,stand.id,steep)).foundationWood,2);
  assert.equal(w.wood,stock-2);
  assert.equal(moveQuote(hillside).foundationWoodDelta,-1);
  w.wood=MAX_WOOD;
  previous=structuredClone(w);
  assert.equal(moveStructure(w,stand.id,flat).ok,false);
  assert.equal(removeStructure(w,stand.id).ok,false);
  assert.deepEqual(w,previous);
  w.wood=stock-2;
  ok(moveStructure(w,stand.id,hillside));
  assert.equal(w.wood,stock-1);
  const restored=readLivingWorld(14,JSON.parse(JSON.stringify(w)));
  assert.ok(validBuildLand(restored));
  ok(removeStructure(restored,stand.id));
  assert.equal(restored.wood,initial);
  assert.equal(removeStructure(restored,stand.id).ok,false);
  w.wood=3;
  const state={player:{x:130,z:124,grounded:true}},exit={x:130,z:124,y:terrainContactHeight(130,124),heading:Math.PI+.3};
  previous=structuredClone(w);
  assert.equal(finishConstruction(w,'stand',steep,state,exit).ok,false);
  assert.deepEqual(w,previous);
  w.wood=4;
  assert.equal(ok(finishConstruction(w,'stand',steep,state,exit)).foundationWood,2);
  assert.equal(w.wood,0);
  assert.ok(Math.abs(state.player.heading-(.3-Math.PI))<1e-12);
});

test('the house and its snapped chest share one foundation, including when moved and dismantled',()=>{
  const w={...createLivingWorld(),wood:80,wallet:50}, initial=w.wood;
  const camp=ok(placeStructure(w,'camp',campAt));
  const before=w.wood, floor=ok(placeStructure(w,'hut',hutAt));
  assert.equal(floor.foundationWood,4);
  assert.equal(before-w.wood,10+4);
  const chest=ok(placeStructure(w,'chest',floor));
  assert.equal(chest.parentId,floor.id);
  assert.deepEqual(foundationPiers('chest',chest),[]);
  assert.ok(w.structures.filter(s=>s.parentId===floor.id).every(s=>s.foundationWood===undefined));
  const restored=readLivingWorld(14,JSON.parse(JSON.stringify(w)));
  assert.ok(validBuildLand(restored));
  const dest={x:130,z:118,yaw:.3};
  const moved=ok(moveStructure(restored,floor.id,dest));
  assert.equal(moved.foundationWood,3);
  assert.equal(restored.wood,w.wood+1);
  assert.equal(restored.structures.find(s=>s.id===chest.id).y,moved.y+.18);
  for(const id of [chest.id,...['roof','wall','posts'].map(kind=>restored.structures.find(s=>s.kind===kind).id),floor.id,camp.id])
    ok(removeStructure(restored,id));
  assert.equal(restored.wood,initial);
  const inflated=structuredClone(w);
  inflated.structures.find(s=>s.id===floor.id).foundationWood++;
  assert.equal(validBuildLand(inflated),false);
  inflated.structures.find(s=>s.id===chest.id).foundationWood=1;
  assert.equal(validLivingWorld(inflated),false);
});

test('legacy hillside plots retain their old level and cannot refund timber never paid',()=>{
  const w=createLivingWorld(), old=ok(placeStructure(w,'stand',gentle));
  assert.equal(old.foundationWood,1);
  // Reconstruct an actual journey v14 root from before the new receipt.
  delete old.foundationWood;
  w.wood++;
  const credit=w.wood;
  const saved=readLivingWorld(14,JSON.parse(JSON.stringify(w)));
  assert.ok(validBuildLand(saved));
  assert.equal(surveySite(saved,'stand',gentle,{excludeId:old.id}).foundationWoodDelta,0);
  ok(moveStructure(saved,old.id,{...gentle,x:gentle.x+1e-12}));
  assert.equal(saved.wood,credit);
  assert.ok(validBuildLand(saved));
  ok(removeStructure(saved,old.id));
  assert.equal(saved.wood,credit+2);
  const elsewhere=ok(moveStructure(w,old.id,steep));
  assert.equal(elsewhere.foundationWood,2);
  const forged=structuredClone(w);
  delete forged.structures[0].foundationWood;
  assert.equal(validBuildLand(forged),false);
  assert.equal(w.wood,credit-2);
  ok(removeStructure(w,old.id));
  assert.equal(w.wood,credit+2);
});

test('the traveller can ascend a steep outside flight with clearance from the floor rim and posts',()=>{
  for(const [x,z,cx,cz] of [[-179,-44,-191,-56],[244,-200,232,-212]]){
    const world={...createLivingWorld(),wood:80};
    syncBuildTerrain(world);
    try{
      ok(placeStructure(world,'camp',{x:cx,z:cz,yaw:0}));
      const floor=ok(placeStructure(world,'hut',{x,z,yaw:.3}));
      const {normal:[nx,nz],treads}=entryFlight('floor',floor);
      const high=treads[0],low=treads.at(-1),path=[];
      for(let k=14;k>=0;k--)path.push([low.x-nz*k*.05,low.z+nx*k*.05]);
      for(let j=treads.length-1;j>0;j--)for(let k=1;k<=8;k++){
        const a=treads[j],b=treads[j-1];path.push([a.x+(b.x-a.x)*k/8,a.z+(b.z-a.z)*k/8]);
      }
      for(let k=1;k<=40;k++)path.push([high.x-nx*k*.035,high.z-nz*k*.035]);
      const c=Math.cos(floor.yaw),s=Math.sin(floor.yaw);
      let y;
      for(const [u,v] of path){
        const xx=x+c*u+s*v,zz=z-s*u+c*v,from=y??terrainContactHeight(xx,zz);
        y=groundHeight(xx,zz,from);
        assert.ok(Math.abs(y-from)<=.34 && canOccupy(xx,zz,y,.26,1.66));
      }
      assert.ok(Math.abs(y-floor.y-.18)<1e-6);
    }finally{syncBuildTerrain(null);}
  }
});

test('a fence reserves its occupied ground and a steep hut keeps its alternative stair after reloading',()=>{
  const p={x:244,z:-200,yaw:.3}, c=Math.cos(p.yaw),s=Math.sin(p.yaw);
  const fence={x:p.x+c*2.24+s*.84,z:p.z-s*2.24+c*.84,yaw:p.yaw+Math.PI/2};
  const world={...createLivingWorld(),wood:100};
  ok(placeStructure(world,'camp',{x:232,z:-212,yaw:0}));
  const empty=structuredClone(world),standard=ok(placeStructure(empty,'hut',p));
  assert.equal(standard.entryBay,undefined);
  assert.equal(placeStructure(empty,'fence',fence).ok,false);
  const neighbour=ok(placeStructure(world,'fence',fence)), floor=ok(placeStructure(world,'hut',p));
  assert.ok(Number.isInteger(floor.entryBay));
  ok(removeStructure(world,neighbour.id));
  const copy=readLivingWorld(14,JSON.parse(JSON.stringify(world)));
  assert.equal(validBuildLand(copy),true);
  assert.equal(entryFlight('floor',copy.structures.find(s=>s.id===floor.id)).bay,floor.entryBay);
  copy.structures.find(s=>s.id===floor.id).entryBay=100;
  assert.equal(validLivingWorld(copy),false);
});
