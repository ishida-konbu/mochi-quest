import test from 'node:test';
import assert from 'node:assert/strict';
import { createLivingWorld, validLivingWorld } from '../two/living-save.js';
import { BASIC_RECIPE, craftRecipe } from '../two/living-craft.js';
import { listMochi, withdrawMochi } from '../two/living-market.js';
import { buildContacts } from '../two/living-build-contacts.js';
import { buyTimber, constructionSite, fellTree, finishConstruction, moveStructure, nearBuildStructure, nearestTimberTree, placeStructure,
  removeStructure, surveySite, timberTree, transferBatchStorage, transferStorage, validBuildLand, withBuildTerrain } from '../two/living-build.js';
import { timberCut } from '../two/homestead-timber-section.js';
import { isTimberFelled, timberId, timberRevision } from '../two/living-build-trees.js';
import { staticVolumeAt, terrainContactHeight, groundHeight, overheadHeight, REGIONS, TREES } from '../two/terrain.js';

const pose=(x,z,yaw=0)=>({x,z,yaw});
const safe=(result)=>{assert.equal(result.ok,true,result.reason);return result.structure};
const owned=()=>({...createLivingWorld(),wood:40});
const campAt=pose(20,87),hutAt=pose(28,96),stallAt=pose(23,88);
const birch='birch:39941:2333:9507';
function footing(x,z) {return {x,z,y:terrainContactHeight(x,z),grounded:true};}

test('land survey is a dry run, protects roads, water, other people, old story sites and hidden regions',()=>{
  const world=owned(),before=structuredClone(world);
  for(const [regionId,site] of [['river',campAt],['terraces',pose(158,131)],['market',pose(31,-54)]]) {
    const verdict=surveySite(world,'stand',site);
    assert.equal(verdict.ok,true,verdict.reason);
    assert.equal(verdict.regionId,regionId);
  }
  assert.equal(surveySite(world,'stand',pose(158,131)).terrain,'slope');
  assert.equal(surveySite(world,'camp',pose(701,-1115)).terrain,'snow');
  for(const p of [pose(0,61),pose(1.4,59.5),pose(30,22),pose(166,84),REGIONS.find(r=>r.id==='peach')]) {
    const result=surveySite(world,'camp',p);
    assert.equal(result.ok,false);assert.ok(result.reason?.length);
  }
  const state={npcs:[{x:5,z:5,homeX:17,homeZ:87,phase:0,radius:2,type:'rabbit'}]};
  assert.match(surveySite(world,'stand',campAt,{state}).reason,/住人/);
  assert.equal(surveySite(world,'camp',campAt,{state:{player:campAt}}).ok,false);
  assert.deepEqual(world,before);
});

test('a construction rehearsal reserves nothing and the last joint must still qualify for placement',()=>{
  const w=owned();
  safe(placeStructure(w,'camp',campAt));
  const before=structuredClone(w);
  const site=constructionSite(w,'hut',hutAt);
  assert.ok(site.ok,site.reason);
  assert.deepEqual(w,before);
  w.wood=9;
  const insufficient=structuredClone(w);
  const state={player:footing(27,100)}, previous=structuredClone(state.player);
  const exit={...footing(30.6,96),heading:-Math.PI/2};
  assert.match(finishConstruction(w,'hut',hutAt,state,exit).reason,/木材10本/);
  assert.deepEqual(w,insufficient);
  assert.deepEqual(state.player,previous);
  w.wood=10;
  assert.equal(finishConstruction(w,'hut',hutAt,state,{...exit,x:NaN}).ok,false);
  assert.equal(w.wood,10);
  safe(finishConstruction(w,'hut',hutAt,state,exit));
  assert.equal(state.player.x,exit.x);assert.equal(state.player.heading,exit.heading);
  assert.equal(w.wood,0);
  const finished=structuredClone(w);
  assert.equal(placeStructure(w,'hut',hutAt).ok,false);
  assert.deepEqual(w,finished);
});

test('a surveyed tree is felled once; near and far render state and contact share the same ID across a reload',()=>{
  const world=owned(),tree=timberTree(birch),standing=footing(tree.x-1.7,tree.z);
  const living=TREES.find(t=>timberId(t)===birch),cut=timberCut(tree);
  assert.equal(nearestTimberTree(world,standing)?.id,birch);
  assert.equal(fellTree(world,'oak:123:123:123').ok,false);
  const blocked=()=>staticVolumeAt(cut.x,cut.z,cut.y+.04,.22,.85);
  assert.equal(blocked(),true);
  withBuildTerrain(world,()=>{
    const revision=timberRevision();
    safe(fellTree(world,birch,{...footing(0,62),mount:'bike',inWater:true,grounded:false}));
    assert.equal(world.wood,46);assert.equal(isTimberFelled(living),true);assert.ok(timberRevision()>revision);
    assert.equal(blocked(),false);
    assert.equal(groundHeight(cut.x,cut.z,cut.y+.1),cut.y);
    assert.equal(fellTree(world,birch,standing).ok,false);
    assert.notEqual(nearestTimberTree(world,standing)?.id,birch);
  });
  assert.equal(blocked(),true);
  const restored=JSON.parse(JSON.stringify(world));
  assert.equal(validLivingWorld(restored),true);assert.equal(validBuildLand(restored),true);
  withBuildTerrain(restored,()=>assert.equal(blocked(),false));
  restored.felledTrees=[timberId(TREES[0])];
  assert.equal(validBuildLand(restored),true);
  restored.felledTrees=['oak:123:123:123'];
  assert.equal(validBuildLand(restored),false);
});

test('modular hut snaps to the floor, roof has headroom, moves with attachments and repays actual costs once',()=>{
  const w=owned(),coins=w.wallet,wood=w.wood;
  assert.equal(placeStructure(w,'floor',hutAt).ok,false);
  const camp=safe(placeStructure(w,'camp',campAt));
  const floor=safe(placeStructure(w,'floor',hutAt));
  assert.equal(placeStructure(w,'roof',hutAt).ok,false);
  const posts=safe(placeStructure(w,'posts',pose(27,96,.4)));
  const wall=safe(placeStructure(w,'wall',hutAt));
  const roof=safe(placeStructure(w,'roof',hutAt));
  assert.equal(roof.y,floor.y);assert.equal(posts.x,floor.x);assert.equal(posts.yaw,floor.yaw);
  assert.equal(placeStructure(w,'roof',hutAt).ok,false);
  assert.equal(removeStructure(w,floor.id).ok,false);assert.equal(removeStructure(w,posts.id).ok,false);
  assert.equal(removeStructure(w,camp.id).ok,false);
  withBuildTerrain(w,()=>{
    assert.equal(groundHeight(floor.x,floor.z,floor.y+.25),floor.y+.18);
    assert.equal(staticVolumeAt(floor.x,floor.z,floor.y+.19,.2,1.62),false);
    assert.ok(overheadHeight(floor.x,floor.z,floor.y+.18,.1,true)>floor.y+2.2);
    assert.equal(staticVolumeAt(floor.x,floor.z-1.23,floor.y+.19,.18,1.61),true);
    assert.equal(staticVolumeAt(floor.x+1.44,floor.z+1.23,floor.y+.19,.12,1.61),true);
    const moved=safe(moveStructure(w,floor.id,pose(29,90,.1)));
    assert.ok(w.structures.filter(s=>s.parentId===floor.id).every(s=>s.x===moved.x && s.yaw===moved.yaw));
    assert.ok(Math.abs(groundHeight(floor.x,floor.z, floor.y+.25)-floor.y-.18)>.05);
    assert.equal(validBuildLand(w),true);
  });
  for(const s of [wall,roof,posts,floor,camp])safe(removeStructure(w,s.id));
  assert.equal(removeStructure(w,camp.id).ok,false);assert.equal(w.wallet,coins);assert.equal(w.wood,wood);
  assert.equal(validLivingWorld(w),true);
});

test('template and attached chest keep their stock and book cost when moved; empty shelving is recoverable',()=>{
  const w=owned(), camp=safe(placeStructure(w,'camp',campAt));
  const floor=safe(placeStructure(w,'hut',hutAt));assert.equal(w.structures.length,5);
  assert.equal(buildContacts(w.structures).filter(q=>q.kind==='roof').length,1);
  const chest=safe(placeStructure(w,'chest',hutAt)),stand=safe(placeStructure(w,'stand',stallAt));
  assert.equal(chest.parentId,floor.id);
  w.costs.rice=13;
  safe(transferStorage(w,chest.id,'rice',37,true));
  assert.equal(w.costs.rice+chest.costs.rice,13);
  assert.equal(transferStorage(w,chest.id,'rice',38,false).ok,false);
  assert.equal(removeStructure(w,chest.id).ok,false);
  safe(transferStorage(w,chest.id,'rice',37,false));
  assert.equal(w.inventory.rice,200);assert.equal(w.costs.rice,13);
  const {batch}=craftRecipe(w,BASIC_RECIPE,{regionId:'river'});
  safe(transferBatchStorage(w,chest.id,batch.id,2,true));safe(listMochi(w,stand.id,batch.id,1,4));
  assert.equal(removeStructure(w,chest.id).ok,false);assert.equal(removeStructure(w,stand.id).ok,false);
  withBuildTerrain(w,()=>{
    const moved=safe(moveStructure(w,floor.id,pose(29,90,.1)));
    const box=w.structures.find(s=>s.id===chest.id);
    assert.equal(box.y,moved.y+.18);assert.equal(box.batches[0].quantity,2);
    const visitor={...footing(box.x,box.z+1.42),y:moved.y+.18};
    assert.equal(nearBuildStructure(w,visitor)?.id,chest.id);
    const detached=safe(moveStructure(w,chest.id,pose(20,93)));
    assert.equal(detached.parentId,undefined);assert.equal(detached.batches[0].quantity,2);
    assert.equal(safe(moveStructure(w,chest.id,moved)).parentId,moved.id);
  });
  const restored=JSON.parse(JSON.stringify(w));assert.equal(validLivingWorld(restored),true);assert.equal(validBuildLand(restored),true);
  for(const [id,f] of [[chest.id,()=>transferBatchStorage(restored,chest.id,batch.id,2,false)],
      [stand.id,()=>withdrawMochi(restored,stand.id,batch.id)]]){safe(f());safe(removeStructure(restored,id));}
  assert.equal(restored.batches[0].quantity,4);assert.equal(restored.batches[0].cost,batch.cost);
  assert.equal(removeStructure(restored,camp.id).ok,false);
  assert.equal(buyTimber(restored,{id:'river-mortar'}).ok,false);
  const balance=restored.wallet;
  safe(buyTimber(restored,{id:'market-grocer'}));assert.equal(restored.wallet,balance-6);
});

test('import rejects floating foundations, orphan beams, fake transforms and a structure on a story table',()=>{
  const w=owned();safe(placeStructure(w,'camp',campAt));safe(placeStructure(w,'hut',hutAt));
  const shifted=structuredClone(w);shifted.structures[0].y+=2;assert.equal(validBuildLand(shifted),false);
  const orphan=structuredClone(w);orphan.structures.pop();orphan.structures[2].parentId='build-999';
  assert.equal(validLivingWorld(orphan),false);
  const story=structuredClone(w);story.structures[0].x=1.4;story.structures[0].z=59.5;assert.equal(validBuildLand(story),false);
});

test('low bamboo fencing follows its yaw, blocks across the rails and leaves the end open',()=>{
  const w=owned();
  safe(placeStructure(w,'camp',campAt));
  const fence=safe(placeStructure(w,'fence',pose(23,88,Math.PI/2)));
  withBuildTerrain(w,()=>{
    assert.equal(staticVolumeAt(fence.x,fence.z+.66,fence.y+.20,.18,1.0),true);
    assert.equal(staticVolumeAt(fence.x+.72,fence.z,fence.y+.20,.18,1.0),false);
    assert.equal(staticVolumeAt(fence.x,fence.z,fence.y+1.13,.18,.33),false);
  });
  const wood=w.wood;safe(removeStructure(w,fence.id));assert.equal(w.wood,wood+1);
});

test('carpentry keeps the standing builder clear of each new joint and the chest cannot be used through its back wall',()=>{
  const w=owned();safe(placeStructure(w,'camp',campAt));
  const floor=safe(placeStructure(w,'floor',hutAt));
  const p={...footing(floor.x,floor.z),y:floor.y+.18,buffs:{full:0}};
  const state={player:p};
  withBuildTerrain(w,()=>{
    p.x=floor.x+1.44;p.z=floor.z+1.23;
    assert.equal(placeStructure(w,'posts',floor,{state}).ok,false,'cannot erect a post around the builder');
    p.x=floor.x;p.z=floor.z;
    safe(placeStructure(w,'posts',floor,{state}));
    p.z=floor.z-1.23;
    assert.equal(placeStructure(w,'wall',floor,{state}).ok,false,'wall cannot cross body');
    p.z=floor.z;p.buffs.full=1;
    assert.equal(placeStructure(w,'roof',floor,{state}).ok,false,'new tie beam intersects a full traveller');
    p.buffs.full=0;
    safe(placeStructure(w,'wall',floor,{state}));
    safe(placeStructure(w,'roof',floor,{state}));
    const chest=safe(placeStructure(w,'chest',floor));
    p.x=chest.x;p.z=floor.z-1.75;p.y=terrainContactHeight(p.x,p.z);
    assert.equal(nearBuildStructure(w,p,'chest'),null,'cannot reach through closed rear wall');
    p.z=floor.z+.40;p.y=floor.y+.18;
    assert.equal(nearBuildStructure(w,p,'chest')?.id,chest.id,'reachable through open front');
  });
});
