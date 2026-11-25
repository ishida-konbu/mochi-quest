import test from 'node:test';
import assert from 'node:assert/strict';
import { createLivingWorld, readLivingWorld, validLivingWorld } from '../two/living-save.js';
import { constructionSite, finishConstruction, getMoveRoots, HEIGHT_STEP, MAX_HEIGHT_STEPS, moveStructureGroup,
  nearBuildStructure, placeStructure, removeStructureGroup, surveyMoveGroup, surveyRemoveGroup,
  surveySite, transferStorage, validBuildLand, withBuildTerrain } from '../two/living-build.js';
import { entryFlight } from '../two/homestead-foundation.js';
import { canOccupy, groundHeight, terrainContactHeight } from '../two/terrain.js';

const purse=()=>({...createLivingWorld(),wood:120,wallet:100});
const pose=(x,z,yaw=0,heightSteps=0)=>({x,z,yaw,heightSteps});
const built=(w,kind,p)=>{const r=placeStructure(w,kind,p);assert.ok(r.ok,r.reason);return r.structure;};
const check=r=>{assert.ok(r.ok,r.reason);return r;};
const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,a+' differs from '+b);
const rotation=Math.PI/12;
const campAt=pose(20,87), hutAt=pose(28,96);
function yard(){
  const w=purse(),camp=built(w,'camp',campAt),floor=built(w,'hut',hutAt),chest=built(w,'chest',hutAt);
  const fence=built(w,'fence',pose(32,99)),stand=built(w,'stand',pose(23,88));
  const posts=w.structures.find(s=>s.kind==='posts'),wall=w.structures.find(s=>s.kind==='wall');
  return {w,camp,floor,chest,fence,stand,posts,wall};
}

test('a raised foundation has one paid level from preview to completion and reloading',()=>{
  const w=purse(),p=pose(28,96,rotation,6),low=check(surveySite(w,'stand',{...p,heightSteps:0}));
  const quote=check(constructionSite(w,'stand',p));
  close(quote.y,low.y+6*HEIGHT_STEP);
  assert.ok(quote.foundationWood>low.foundationWood);
  const state={player:{x:19,z:90,y:terrainContactHeight(19,90),grounded:true}},exit={...state.player,heading:0};
  const balance=w.wood;
  const s=check(finishConstruction(w,'stand',p,state,exit)).structure;
  close(s.y,quote.y);assert.equal(s.heightSteps,6);
  assert.equal(balance-w.wood,2+quote.foundationWood);
  const copy=readLivingWorld(14,JSON.parse(JSON.stringify(w)));
  assert.ok(copy && validBuildLand(copy));
  const lowered=check(moveStructureGroup(copy,[s.id],{heightSteps:-6}));
  assert.ok(lowered.woodDelta<0);close(lowered.structures[0].y,low.y);
  assert.equal(copy.structures[0].heightSteps,undefined);
  for(const invalid of [-1,1.5,MAX_HEIGHT_STEPS+1]){
    const forged=structuredClone(w);forged.structures[0].heightSteps=invalid;
    assert.equal(validLivingWorld(forged),false);
    assert.equal(surveySite(purse(),'stand',{...p,heightSteps:invalid}).ok,false);
  }
  const forged=structuredClone(w);forged.structures[0].heightSteps--;
  assert.equal(validBuildLand(forged),false);
});

test('normal player collision can walk from earth onto the highest floor, camp and service landings',()=>{
  for(const [kind,x,z] of [['floor',29,90],['camp',28,96],['stand',28,96],['chest',28,96]]){
    const w=purse();
    if(['floor','chest'].includes(kind))built(w,'camp',campAt);
    const s=built(w,kind,pose(x,z,rotation,MAX_HEIGHT_STEPS)),flight=entryFlight(kind,s);
    assert.ok(flight.treads.length>=12);
    const high=flight.treads[0],low=flight.treads.at(-1),[nx,nz]=flight.normal;
    const distance=Math.hypot(high.x-low.x,high.z-low.z)+(kind==='floor'?.7:0);
    withBuildTerrain(w,()=>{
      let traveler;
      for(let along=-.48;along<=distance;along+=.04){
        const u=low.x-nx*along,v=low.z-nz*along,c=Math.cos(s.yaw),sin=Math.sin(s.yaw);
        const xx=x+c*u+sin*v,zz=z-sin*u+c*v,feet=traveler?.y??terrainContactHeight(xx,zz);
        const y=groundHeight(xx,zz,feet);
        assert.ok(Math.abs(y-feet)<=.34 && canOccupy(xx,zz,y,.26,1.66),kind+' stair at '+along);
        traveler={x:xx,z:zz,y,grounded:true};
      }
      close(traveler.y,s.y+(kind==='floor'?.18:kind==='camp'?.13:0));
      if(kind!=='floor')assert.equal(nearBuildStructure(w,traveler,kind)?.id,s.id);
      assert.equal(moveStructureGroup(w,[s.id],{dx:.5},{state:{player:traveler}}).ok,false);
      assert.equal(removeStructureGroup(w,[s.id],{state:{player:traveler}}).ok,false);
    });
  }
});

test('box-selected parts move rigidly about their common centre, charged once, with contents and sockets intact',()=>{
  const {w,floor,chest,fence,wall}=yard();
  check(transferStorage(w,chest.id,'rice',20,true));
  const ids=[wall.id,chest.id,fence.id,floor.id,wall.id];
  const roots=getMoveRoots(w,ids);
  assert.deepEqual(roots.map(s=>s.id),[floor.id,fence.id]);
  assert.deepEqual(getMoveRoots(w,[chest.id]).map(s=>s.id),[chest.id]);
  const before=structuredClone(w),delta={dx:1,dz:1,yaw:rotation,heightSteps:1},quote=check(surveyMoveGroup(w,ids,delta));
  assert.deepEqual(w,before);
  assert.equal(new Set(quote.structures.map(s=>s.id)).size,6);
  assert.ok(quote.woodDelta>0);
  check(moveStructureGroup(w,ids,delta));
  assert.equal(w.wood,before.wood-quote.woodDelta);assert.equal(w.wallet,before.wallet);
  for(const s of roots){
    const a=(floor.x+fence.x)/2,b=(floor.z+fence.z)/2,m=w.structures.find(v=>v.id===s.id);
    close(m.x,a+1+(s.x-a)*Math.cos(rotation)+(s.z-b)*Math.sin(rotation));
    close(m.z,b+1-(s.x-a)*Math.sin(rotation)+(s.z-b)*Math.cos(rotation));close(m.yaw,rotation);
    assert.equal(m.heightSteps,1);
  }
  const box=w.structures.find(s=>s.id===chest.id),base=w.structures.find(s=>s.id===floor.id);
  assert.equal(box.parentId,floor.id);close(box.y,base.y+.18);assert.equal(box.inventory.rice,20);
  assert.equal(box.heightSteps,undefined);
  assert.ok(validLivingWorld(w) && validBuildLand(w));
  const detached=check(moveStructureGroup(w,[box.id],{dx:20-box.x,dz:93-box.z,heightSteps:2})).structures[0];
  assert.equal(detached.parentId,undefined);assert.equal(detached.heightSteps,2);assert.equal(detached.inventory.rice,20);
  assert.ok(validLivingWorld(w) && validBuildLand(w));
});

test('group edits abort atomically on land, capacity, dependencies, stocked shelves or chests',()=>{
  const {w,camp,floor,chest,fence,stand,posts}=yard(),ids=[floor.id,fence.id],original=structuredClone(w);
  for(const delta of [{dx:-28,dz:-35},{dx:-1,dz:-2,yaw:rotation,heightSteps:2},{heightSteps:-1}]){
    const r=moveStructureGroup(w,ids,delta);
    assert.equal(r.ok,false);assert.ok(r.structures.some(s=>s.id===floor.id));
    assert.deepEqual(w,original);
  }
  w.wood=0;
  const empty=structuredClone(w),short=moveStructureGroup(w,ids,{dx:1,dz:1,yaw:rotation,heightSteps:1});
  assert.equal(short.ok,false);assert.ok(short.woodDelta>0);assert.deepEqual(w,empty);
  w.wood=original.wood;
  for(const selection of [[camp.id,stand.id],[posts.id,stand.id]]){
    assert.equal(removeStructureGroup(w,selection).ok,false);assert.deepEqual(w,original);
  }
  check(transferStorage(w,chest.id,'rice',3,true));
  let before=structuredClone(w);
  assert.equal(removeStructureGroup(w,[floor.id,fence.id]).ok,false);assert.deepEqual(w,before);
  check(transferStorage(w,chest.id,'rice',3,false));
  w.market.stands[stand.id]={stock:[],cashbox:7};
  before=structuredClone(w);
  assert.equal(removeStructureGroup(w,[stand.id,fence.id]).ok,false);assert.deepEqual(w,before);
  w.market.stands[stand.id].cashbox=0;
  const all=[floor.id,camp.id,chest.id,fence.id,stand.id],quote=check(surveyRemoveGroup(w,all));
  assert.equal(quote.structures.length,w.structures.length);
  const wood=w.wood,coins=w.wallet;
  check(removeStructureGroup(w,all));
  assert.equal(w.wood,wood-quote.woodDelta);assert.equal(w.wallet,coins-quote.coinsDelta);
  assert.equal(w.structures.length,0);assert.equal(w.market.stands[stand.id],undefined);
  assert.equal(w.wood,purse().wood);assert.equal(w.wallet,purse().wallet);
  assert.equal(removeStructureGroup(w,all).ok,false);assert.ok(validLivingWorld(w));
});

test('an occupied stair is rerouted before construction, and the paid flight is fixed for the final cut and later visits',()=>{
  const w=purse(),draft=pose(28,96,rotation,MAX_HEIGHT_STEPS),ordinary=check(surveySite(w,'stand',draft));
  const tread=entryFlight('stand',ordinary).treads[6],c=Math.cos(rotation),s=Math.sin(rotation);
  const x=draft.x+tread.x*c+tread.z*s,z=draft.z-tread.x*s+tread.z*c;
  const player={x,z,y:terrainContactHeight(x,z),grounded:true};
  const alternative=check(surveySite(w,'stand',draft,{state:{player}}));
  assert.notEqual(alternative.entryBay,ordinary.entryBay);
  const recorded=check(finishConstruction(w,'stand',{...draft,entryBay:alternative.entryBay},{player},
    {x:20,z:90,y:terrainContactHeight(20,90),heading:0})).structure;
  assert.equal(recorded.entryBay,alternative.entryBay);
  assert.ok(validBuildLand(readLivingWorld(14,JSON.parse(JSON.stringify(w)))));
  const lid={x:recorded.x,z:recorded.z,y:recorded.y+.88,grounded:true};
  assert.equal(removeStructureGroup(w,[recorded.id],{state:{player:lid}}).ok,false);
});
