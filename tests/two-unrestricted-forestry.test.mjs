import test from 'node:test';
import assert from 'node:assert/strict';
import { BufferAttribute } from '../two/vendor/three.module.min.js';
import { TIMBER_TREES,REGIONS,regionAt,TREES,staticVolumeAt } from '../two/terrain.js';
import { GATE_PEACH } from '../two/pilgrimage-layout.js';
import { timberCut } from '../two/homestead-timber-section.js';
import { timberId,bindFelledTrees } from '../two/living-build-trees.js';
import { closestTimberTrees, fellTree,timberTree,validBuildLand,withBuildTerrain } from '../two/living-build.js';
import { createLivingWorld,validLivingWorld } from '../two/living-save.js';
import { planSawing } from '../two/homestead-sawing.js';
import { timberBatchMask,recordTreeSpan } from '../two/timber-batches.js';
import { makeScrollFauna,moveScrollFauna } from '../two/scroll-fauna.js';

test('every planted species in all districts and the gate peach survive a mass harvest and reload',()=>{
  const ids=TIMBER_TREES.map(timberId), regions=new Set(), kinds=new Set();
  assert.equal(new Set(ids).size,ids.length);
  for(const source of TIMBER_TREES){
    const tree=timberTree(timberId(source));
    assert.equal(tree.source,source);
    regions.add(REGIONS[regionAt(tree.x,tree.z)].id);kinds.add(tree.kind);
    const cut=timberCut(tree);
    assert.ok([cut.x,cut.y,cut.z,cut.radius].every(Number.isFinite) && cut.radius>0);
    for(const stem of cut.culms??[])assert.ok(stem.radius>0 && stem.radius<.25);
  }
  assert.equal(regions.size,REGIONS.length);assert.equal(kinds.size,21);
  assert.equal(TIMBER_TREES.filter(t=>t.kind==='peach').length,426);
  const opening=createLivingWorld(),origin={x:0,z:0};
  const first=closestTimberTrees(opening,origin,8);
  const second=closestTimberTrees(opening,origin,8,Infinity,8);
  assert.ok(second[0].distance>=first.at(-1).distance);
  assert.equal(new Set([...first,...second].map(t=>t.id)).size,16);
  assert.equal(closestTimberTrees(opening,origin,8,Infinity,ids.length-1).length,1);
  const world={...createLivingWorld(),wood:1000,felledTrees:ids.filter(id=>id!==timberId(GATE_PEACH))};
  const [last]=closestTimberTrees(world,{x:0,z:0});assert.equal(last.id,timberId(GATE_PEACH));
  assert.equal(fellTree(world,last.id).ok,true);assert.equal(world.wood,1006);
  assert.equal(fellTree(world,last.id).ok,false);assert.deepEqual(closestTimberTrees(world,last),[]);
  const restored=JSON.parse(JSON.stringify(world));
  assert.equal(validLivingWorld(restored),true);assert.equal(validBuildLand(restored),true);
});

test('classic pines and gate peach lose the real trunk in the cell index but keep a stump',()=>{
  for(const source of [TREES[0],GATE_PEACH]) {
    const tree=timberTree(timberId(source)),cut=timberCut(tree);
    const body=()=>staticVolumeAt(cut.x,cut.z,cut.y+.11,.08,.51);
    assert.equal(body(),true);
    const world=createLivingWorld();
    withBuildTerrain(world,()=>{assert.equal(fellTree(world,tree.id).ok,true);assert.equal(body(),false);});
    assert.equal(body(),true);
  }
});

test('distant, airborne and obstructed work always has a grounded, steady detail in both orientations',()=>{
  const player={x:0,z:0,y:-40,mount:'bike',inWater:true,grounded:false,heading:0};
  for(const source of [TREES[0],GATE_PEACH,TIMBER_TREES.find(t=>t.kind==='moso'),TIMBER_TREES.find(t=>t.kind==='cliff-pine')]){
    const tree=timberTree(timberId(source));
    for(const ratio of [390/844,16/9]){
      assert.equal(planSawing(player,tree,ratio,()=>false),null);
      const detail=planSawing(player,tree,ratio,()=>false,true);
      assert.ok(detail);
      for(let i=0;i<=30;i++){
        const f=detail.sample(detail.duration*i/30);
        for(const vector of [f.hero,...f.feet,...f.hands,f.tool])assert.ok(vector.every(Number.isFinite));
        assert.ok(f.feet.every(foot=>foot[1]>=0));
      }
    }
  }
});

test('batched bark and bamboo indices hide only the removed owner and restore byte for byte',()=>{
  const [a,b]=TREES,v=new BufferAttribute(Uint16Array.from([1,2,3,7,8,9,6,5,4,8,7,4]),1);
  const spans=new Map(),original=[...v.array];
  recordTreeSpan(spans,a,0,3);recordTreeSpan(spans,b,3,6);recordTreeSpan(spans,a,6,9);
  const update=timberBatchMask(v,spans,(array,start,end)=>array.fill(0,start,end));
  try {
    bindFelledTrees([timberId(a)]);update();assert.deepEqual([...v.array],[0,0,0,7,8,9,0,0,0,8,7,4]);
    bindFelledTrees([timberId(b)]);update();assert.deepEqual([...v.array],[1,2,3,0,0,0,6,5,4,8,7,4]);
  } finally {bindFelledTrees([]);update();}
  assert.deepEqual([...v.array],original);
});

test('a hawk leaves a cut perch from its current feet and no longer rests on that bough',()=>{
  const hawk=makeScrollFauna().find(n=>n.type==='hawk');
  const leg=hawk.route[0],t=leg.rest*.5;
  moveScrollFauna(hawk,t);assert.equal(hawk.perched,true);const from=[hawk.x,hawk.y,hawk.z];
  try{
    bindFelledTrees([timberId(leg.a.tree)]);
    moveScrollFauna(hawk,t+.01);assert.equal(hawk.perched,false);
    assert.ok(Math.hypot(hawk.x-from[0],hawk.y-from[1],hawk.z-from[2])<.02);
    moveScrollFauna(hawk,t+1.5);
    assert.ok(Math.hypot(hawk.x-from[0],hawk.y-from[1],hawk.z-from[2])>.1);
    moveScrollFauna(hawk,hawk.cycle+t);assert.equal(hawk.perched,false);
    moveScrollFauna(hawk,leg.rest+leg.flight+.1);assert.equal(hawk.perched,true);
  } finally {bindFelledTrees([]);}
});
