import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../two/vendor/three.module.min.js';
import { createGame } from '../two/game.js';
import { SPECIES, recipientContact } from '../two/bestiary.js';
import { SCROLL_FAUNA } from '../two/scroll-fauna.js';
import { otsuParts } from '../two/otsu-beasts.js';
import { buildScrollBeast } from '../two/handscroll-beasts.js';
import { batchActorParts } from '../two/actors.js';

function lionHeight(variant){
  const root=new T.Group(),coat=new T.MeshStandardMaterial();
  function group(parent,name,x=0,y=0,z=0){
    const joint=new T.Group();joint.name=name;joint.position.set(x,y,z);parent.add(joint);return joint;
  }
  buildScrollBeast(root,'shishi',{group,batch:batchActorParts},variant,()=>coat);
  return new T.Box3().setFromObject(root,true).getSize(new T.Vector3()).y;
}
function statureOfSculpt(type){
  const box=new T.Box3();
  for(const {geometry,pivot} of otsuParts(type)){
    geometry.computeBoundingBox();box.union(geometry.boundingBox.clone().translate(new T.Vector3(...pivot)));
  }
  return box.max.y-box.min.y;
}

test('the full elephant sculptures stand about one fifth taller than the two lions in the world',()=>{
  const animals=createGame().state.npcs;
  const elephants=animals.filter(n=>n.type==='elephant'),lions=animals.filter(n=>n.type==='shishi');
  const mean=(list,height)=>list.reduce((sum,n)=>sum+height(n)*n.stature,0)/list.length;
  const ratio=mean(elephants,()=>statureOfSculpt('elephant'))/mean(lions,n=>lionHeight(n.variant));
  assert.ok(Math.abs(ratio-1.2)<.035,`elephant/lion height ratio ${ratio}`);
  assert.equal(SPECIES.tiger.stature,2*1.22);
});

test('grazing oxen are two thirds of their former size and keep their individual proportions',()=>{
  const oxen=createGame().state.npcs.filter(n=>n.type==='ox');
  assert.equal(oxen.length,10);
  for(const ox of oxen){
    const previous=2.08*(.93+.12*(.5+.5*Math.sin(ox.variant*2.73)));
    assert.ok(Math.abs(ox.stature/previous-2/3)<1e-12,ox.id);
  }
  assert.ok(Math.abs(statureOfSculpt('ox')-2.27)<.025);
});

test('notices thrown at ground level can reach the enlarged animals through a foreleg',()=>{
  for(const [type,x,z] of [['elephant',.36,.56],['ox',.28,.44]]){
    const stature=SCROLL_FAUNA[type].stature,n={type,x:0,y:0,z:0,heading:0,stature};
    const shot={x:x*stature,y:.93,z:z*stature+2};
    assert.ok(Number.isFinite(recipientContact(n,shot,0,-1,3)),type);
  }
});
