import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingWorld,readLivingWorld,validLivingWorld} from '../two/living-save.js';
import {placeStructure,moveStructureGroup,removeStructureGroup,surveySite,validBuildLand,withBuildTerrain} from '../two/living-build.js';
import {bedOnFloor} from '../two/living-build-state.js';
import {setBeddingGrade} from '../two/camp-bedding.js';
import {campCover,drapeCover} from '../two/camp-cover.js';
import {bedPoint,sleepApproach,sleepMotion} from '../two/camp-sleep-motion.js';
import {groundHeight} from '../two/terrain.js';

function campRoom(){
  const w={...createLivingWorld(),wood:90,wallet:40};
  const c=placeStructure(w,'camp',{x:20,z:87,yaw:0}).structure;
  const deck=placeStructure(w,'hut',{x:28,z:96,yaw:.15,heightSteps:2}).structure;
  assert.ok(c&&deck);
  return {w,c,deck};
}
test('the founding bed moves inside its own hut, travels with the deck and retains its bedding through a reload',()=>{
  const {w,c,deck}=campRoom();
  const snap=surveySite(w,'camp',deck,{excludeId:c.id});
  assert.deepEqual(snap,{ok:true,...bedOnFloor(deck),relief:0,foundationWood:0,foundationWoodDelta:0});
  assert.ok(moveStructureGroup(w,[c.id],{dx:deck.x-c.x,dz:deck.z-c.z}).ok);
  assert.ok(setBeddingGrade(w,c.id,3).ok);
  assert.ok(!setBeddingGrade(w,c.id,5).ok);
  assert.ok(!surveySite(w,'camp',deck).ok);
  assert.ok(moveStructureGroup(w,[deck.id],{dx:.5,dz:.1,heightSteps:-1,yaw:.08}).ok);
  const restored=readLivingWorld(14,structuredClone(w));
  assert.ok(restored && validBuildLand(restored));
  const indoors=restored.structures.find(s=>s.id===c.id),base=restored.structures.find(s=>s.id===deck.id);
  assert.equal(indoors.parentId,deck.id);assert.equal(indoors.beddingGrade,3);
  assert.equal(indoors.campId,undefined);assert.equal(indoors.y,base.y+.18);
  const forged=structuredClone(restored);forged.structures.find(s=>s.id===c.id).z+=.64;
  assert.equal(validLivingWorld(forged),false);
  assert.equal(removeStructureGroup(restored,[c.id]).ok,false);
  assert.ok(removeStructureGroup(restored,[deck.id]).ok);assert.equal(restored.structures.length,0);
  assert.equal(restored.wood,90);assert.equal(restored.wallet,40);
  assert.ok(moveStructureGroup(w,[c.id],{dx:-7,dz:-8}).ok);assert.equal(w.structures.find(s=>s.id===c.id).parentId,undefined);
});
test('hut doors, graded covers and the night clock preserve the walk up, lie down, tuck and wake sequence',()=>{
  const {w,c,deck}=campRoom();moveStructureGroup(w,[c.id],{dx:deck.x-c.x,dz:deck.z-c.z});
  const bed=w.structures.find(s=>s.id===c.id);
  withBuildTerrain(w,()=>{
    const p=bedPoint(bed,.21,1.05);p.y=groundHeight(p.x,p.z,bed.y);p.heading=.5;
    const route=sleepApproach(bed,p);assert.ok(route?.length>1);
    const motion=sleepMotion(route,p.heading,bed.yaw),first=motion.sample(0),last=motion.sample(motion.duration);
    assert.deepEqual(first.position,last.position);assert.equal(first.clock,0);assert.equal(last.clock,1);
    let previous=0,hasYawn=false,hasSleep=false;
    for(let t=0;t<motion.duration;t+=.047){
      const f=motion.sample(t);assert.ok(f.clock>=previous);
      if(f.clock>0 && f.clock<1)assert.ok(f.recline>.99 && f.cover>.99);
      previous=f.clock;hasYawn ||=f.yawn>.8;hasSleep ||=f.doze>.98;
    }
    assert.ok(hasYawn && hasSleep);
  });
  const maps=new Set();
  for(let grade=0;grade<4;grade++){
    const cover=campCover(grade,true);maps.add(cover.material.map);
    const z=cover.geometry.boundingBox.min.z;
    drapeCover(cover.geometry,grade,1,0,()=>.45);
    assert.ok(cover.geometry.boundingBox.min.z<z-.40);
    assert.ok(cover.geometry.attributes.normal.array.every(Number.isFinite));
    cover.geometry.dispose();
  }
  assert.equal(maps.size,4);
});
test('a sleeper turns through doorway corners and faces the return path before taking a step',()=>{
  const route=[[1.1,0,1.5],[.5,.13,1.5],[0,.13,1],[0,.13,.3]].map(([x,y,z])=>({x,y,z}));
  const motion=sleepMotion(route,0,0);
  let previous=motion.sample(0);
  for(let tick=1;tick<=Math.ceil(motion.duration*120);tick++){
    const f=motion.sample(Math.min(motion.duration,tick/120));
    const delta=Math.atan2(Math.sin(f.heading-previous.heading),Math.cos(f.heading-previous.heading));
    assert.ok(Math.abs(delta)<.06,'body snapped around at '+f.time);
    assert.ok(f.speed>=0 && f.speed<1.4);
    previous=f;
  }
  assert.ok(Math.abs(Math.sin(previous.heading))<1e-8 && Math.cos(previous.heading)>.999);
  assert.deepEqual(previous.position,[1.1,0,1.5]);
  assert.equal(previous.speed,0);
});
