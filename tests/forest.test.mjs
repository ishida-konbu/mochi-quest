import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { BUILDINGS, LANDMARK_TREES, TREES, REGIONS, regionAt, hasAutumnLeaves, nearRoad, riverZ, riverHalfWidth, shoreDistance, treeGround } from '../two/terrain.js';
import { TREE_FORM_COUNT } from '../two/forest-forms.js';
import { isNishiyamaTree } from '../two/mountain-woodland.js';
import * as T from '../two/vendor/three.module.min.js';
import { prepareForest } from '../two/forest.js';
import { SCENERY_PROFILES } from '../two/scenery-quality.js';

test('the thinned woodland preserves bamboo groves and crown forms and leaves room for roads, entrances and swimming ashore', () => {
  const bamboo=TREES.filter(t=>t.kind==='bamboo'||t.kind==='moso');
  const oldGroves=bamboo.filter(t=>!isNishiyamaTree(t));
  assert.equal(oldGroves.length,139);
  assert.equal(createHash('sha256').update(JSON.stringify(oldGroves)).digest('hex'),'bf8b76abb9076a6bb02bf41f75ffd02fd14a7cbc0d8e526d8afee3c014eff6ae');
  const autumn = TREES.filter(t => REGIONS[regionAt(t.x,t.z)].id === 'autumn' && hasAutumnLeaves(t));
  assert.ok(autumn.length >= 400); // Mountain woods now extend the established stands above the valley.
  // The new approach roads and the fire mountain carry additional stands.
  assert.ok(TREES.length-bamboo.length-autumn.length >= 1198);
  assert.ok(TREES.filter(t=>t.z < -416 || t.z > 416).length > 75);
  assert.deepEqual(TREES.slice(0,LANDMARK_TREES.length), LANDMARK_TREES);
  const groves = TREES.filter(tree => tree.form !== undefined);
  assert.equal(new Set(groves.map(tree => tree.form)).size, TREE_FORM_COUNT);
  for (const tree of groves) {
    assert.ok(!nearRoad(tree.x,tree.z,2.7));
    assert.ok(Math.abs(tree.z-riverZ(tree.x))-riverHalfWidth(tree.x)>=10.5);
    assert.ok(shoreDistance(tree.x,tree.z)>=9);
    assert.ok(BUILDINGS.every(b=>Math.hypot(tree.x-b.x,tree.z-b.z)>=Math.hypot(b.w,b.d)*.52+4));
  }
});

test('a stationary view gains painted crowns at each scenery setting with the same close trees and bamboo shafts', t => {
  t.mock.method(T.TextureLoader.prototype,'load',()=>new T.Texture());
  const scene=new T.Scene(), preparation=prepareForest(scene,{value:0});
  let step;
  do { step=preparation.next(); } while(!step.done);
  const update=step.value;
  const tree=TREES.find(tree=>tree.kind==='moso' && isNishiyamaTree(tree));
  const y=treeGround(tree), camera=new T.PerspectiveCamera(57,1.6,.09,1500);
  camera.position.set(tree.x+1,y+4,tree.z+5);
  camera.lookAt(tree.x,y+3,tree.z);camera.updateMatrixWorld();
  const player={x:tree.x,y,z:tree.z,buffs:{}};
  const near=scene.children.filter(mesh=>mesh.name.startsWith('Grove •'));
  const stems=scene.children.filter(mesh=>mesh.name.startsWith('Distant bamboo culms'));
  const crowns=scene.getObjectByName('Distant tree crowns').geometry;
  function counts(profile){
    update(camera,player,profile);
    return {near:near.reduce((n,m)=>n+m.count,0),stems:stems.reduce((n,m)=>n+m.geometry.instanceCount,0),far:crowns.instanceCount};
  }
  const light=counts(SCENERY_PROFILES.light), normal=counts(SCENERY_PROFILES.normal), beautiful=counts(SCENERY_PROFILES.beautiful);
  assert.ok(light.near>0 && light.stems>0);
  assert.ok(light.far<normal.far && normal.far<beautiful.far);
  for(const setting of [normal,beautiful]){
    assert.equal(setting.near,light.near);assert.equal(setting.stems,light.stems);
  }
  assert.deepEqual(counts(SCENERY_PROFILES.light),light);

  // From an ordinary lowland road, the same individual crown must survive
  // to the Kyoto viewing distances, including a setting change at rest.
  const lowland=TREES.find(t=>t.form!==undefined && Math.abs(t.x)<150 && Math.abs(t.z)<150);
  const ground=treeGround(lowland), roots=crowns.getAttribute('rootHeight');
  for(const [range,expected] of [[620,[true,true,true]],[690,[false,true,true]],
    [780,[false,false,true]],[860,[false,false,false]]]){
    camera.position.set(lowland.x,ground,lowland.z+range);
    camera.lookAt(lowland.x,ground+lowland.h*.5,lowland.z);
    camera.updateMatrixWorld();
    const visible=[SCENERY_PROFILES.light,SCENERY_PROFILES.normal,SCENERY_PROFILES.beautiful].map(profile=>{
      update(camera,player,profile);
      for(let i=0;i<crowns.instanceCount;i++){
        if(Math.abs(roots.getX(i)-lowland.x)<.01 && Math.abs(roots.getZ(i)-lowland.z)<.01)return true;
      }
      return false;
    });
    assert.deepEqual(visible,expected,'lowland crown at '+range+' m');
  }
});
