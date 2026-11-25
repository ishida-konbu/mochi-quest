import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../two/vendor/three.module.min.js';
import { homesteadGeometry } from '../two/homestead-carpentry.js';
import { createHomesteadWorld } from '../two/homestead-world.js';
import { plantedFootprints, prunePlantBatch } from '../two/homestead-groundcover.js';

test('the hut preview contains the same planks, posts, back panel and roof as the placed structure',()=>{
  const parts=['floor','posts','wall','roof'];
  for(const terrain of ['plain','snow']){
    const hut=homesteadGeometry('hut',terrain);
    const modules=parts.map(kind=>homesteadGeometry(kind,terrain));
    assert.equal(hut.index.count,modules.reduce((n,g)=>n+g.index.count,0));
    for(const g of modules){
      assert.ok(g.attributes.uv.array.every(Number.isFinite));
      assert.ok(g.attributes.normal.array.every(Number.isFinite));
    }
    hut.computeBoundingBox();
    const ridge=hut.boundingBox.max.y;
    assert.ok(ridge>(terrain==='snow'?3.39:3.03));
    assert.ok(ridge<(terrain==='snow'?3.52:3.16));
  }
});

test('the placement study shares its local mesh and clears out when its object recedes',()=>{
  const scene=new T.Group(), view=createHomesteadWorld(scene);
  const s={id:'build-1',kind:'stand',x:4,y:1,z:5,yaw:.3,terrain:'plain'};
  const world={structures:[s],felledTrees:[],recipes:[],market:{stands:{}}};
  view.setLivingWorld(world);view.update(0,{x:0,z:0});
  const group=scene.children[0],owned=group.getObjectByName('無人の餅売り棚');
  assert.ok(owned);
  view.setBuildingPreview({...s,ok:false});
  const ghost=group.getObjectByName('仮置き・無人の餅売り棚');
  assert.equal(ghost.geometry,owned.geometry);
  assert.ok(ghost.children[0].isLineSegments);
  view.setBuildingPreview(null);
  assert.equal(ghost.parent,null);
  const builtPlots=scene.userData.homesteadPlots;
  view.setConstructionSite({...s,kind:'hut',x:9});
  view.update(0,{x:0,z:0});
  assert.equal(scene.userData.homesteadPlots.length,2);
  assert.equal(world.structures.length,1);
  view.setConstructionSite(null);
  view.update(0,{x:0,z:0});
  assert.deepEqual(scene.userData.homesteadPlots,builtPlots);
  view.update(1,{x:200,z:5});assert.equal(owned.parent,null);
  view.update(2,{x:0,z:0});assert.equal(group.getObjectByName('無人の餅売り棚').geometry,owned.geometry);
});

test('grass below a rotated floor is trimmed and restores its original height after removal',()=>{
  const attr=new T.InstancedBufferAttribute(new Float32Array([0,1,0,1.8,2,0,-.30,.75,.9]),3);
  const before=attr.array.slice(),removed=new Map();
  const s={kind:'floor',x:100,z:-50,yaw:Math.PI/2};
  prunePlantBatch(attr,0,100,-50,removed,plantedFootprints([s]),.20);
  assert.equal(attr.getY(0),-1000);
  assert.equal(attr.getY(2),-1000);
  assert.equal(attr.getY(1),2);
  prunePlantBatch(attr,0,100,-50,removed,[],.20);
  assert.deepEqual(attr.array,before);assert.equal(removed.size,0);
});
