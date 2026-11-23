import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, Texture, TextureLoader } from '../two/vendor/three.module.min.js';
import { createStoryFood, createStoryWorktable, poseStoryFood } from '../two/story-crafts.js';
import { createStoryCollisions } from '../two/story-collisions.js';
import { tablePlan } from '../two/story-table-plan.js';

test('all local servings have finite glazed and dough surfaces at rest and during preparation', t => {
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const vessels=new Set(),workshops=new Set();
  for(let n=1;n<=17;n++){
    const tray=createStoryFood(n), pastry=tray.getObjectByName('取り分ける餅'), table=createStoryWorktable(n);
    assert.ok(pastry && pastry.parent===tray);
    assert.equal(table.userData.worktop,tablePlan(n).top);
    vessels.add(tray.children[0].name);workshops.add(table.name);
    for(const subject of [tray,table])subject.traverse(mesh=>{
      if(!mesh.isMesh)return;
      const geom=mesh.geometry,attrs=[...Object.values(geom.attributes),...(geom.morphAttributes.position||[])];
      for(const attr of attrs)assert.ok(attr.array.every(Number.isFinite),n+' '+mesh.name);
      geom.computeBoundingSphere();assert.ok(Number.isFinite(geom.boundingSphere.radius),mesh.name);
    });
    if([2,6,16].includes(n)){
      const inset=tray.children[0],before=new Box3().setFromObject(inset);
      const hasWrapper=[];pastry.traverse(m=>{if(m.userData.foodMotion)hasWrapper.push(m);});
      assert.ok(hasWrapper.length>0);const action=n===2?'open':'tie';
      poseStoryFood(pastry,action,n===2?1:0);
      assert.ok(hasWrapper.every(m=>m.morphTargetInfluences[0]===1));
      poseStoryFood(pastry,'rest',0);assert.ok(hasWrapper.every(m=>m.morphTargetInfluences[0]===0));
      assert.ok(before.equals(new Box3().setFromObject(inset)));
    }
  }
  assert.equal(vessels.size,17);assert.equal(workshops.size,17);
});

test('small objects can pass under an open table, meet a closed chest, and hit the drying crossbar', () => {
  const hulls=createStoryCollisions();
  const set=n=>hulls.update([{number:n,kind:'table',x:0,y:0,z:0,yaw:0}]);
  set(1);assert.equal(hulls.penetration(0,.19,.11,.04,.015),0);
  set(3);assert.ok(hulls.penetration(0,.19,.11,.04,.015)>0);
  const p=tablePlan(7);set(7);
  assert.ok(hulls.penetration(0,-p.lz,p.top+.95,.02,.015)>0);
  assert.equal(hulls.penetration(0,.29,p.top+.95,.02,.015),0);
  const boat=tablePlan(6);set(6);
  assert.ok(hulls.penetration(1.24,0,boat.top-.023,.03,.016)>0);
  assert.equal(hulls.penetration(1.24,.53,boat.top-.023,.03,.016),0);
});

test('the maple frieze runs around a circular rim', t => {
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const vessel=createStoryFood(8).children[0];
  const position=vessel.children[0].geometry.attributes.position;
  const rim=new Map();
  for(let i=0;i<position.count;i++){
    const x=position.getX(i),z=position.getZ(i),radius=Math.hypot(x,z);
    if(radius<.01)continue;
    const direction=Math.round(Math.atan2(z,x)*1000);
    rim.set(direction,Math.max(rim.get(direction)||0,radius));
  }
  assert.ok(rim.size>=24);
  assert.ok(Math.max(...rim.values())-Math.min(...rim.values())<1e-5);
});

test('the contact of a raised exhibit follows its current pose and leaves open space between its parts', async () => {
  const { Group, Mesh, BoxGeometry, MeshBasicMaterial }=await import('../two/vendor/three.module.min.js');
  const { createModelContacts }=await import('../two/story-model-contacts.js');
  const root=new Group(),rack=new Group(),material=new MeshBasicMaterial();
  root.position.set(2,3,5);
  root.add(rack);
  for (const side of [-1,1]) {
    const post=new Mesh(new BoxGeometry(.08,.60,.08),material);
    post.position.set(side*.50,.30,0);
    rack.add(post);
  }
  const contacts=createStoryCollisions();
  contacts.update([{kind:'person',name:'工人',x:2,y:3,z:5,modelContact:createModelContacts(root)}]);
  assert.ok(contacts.penetration(2.5,5,3.2,.05,.02)>0);
  assert.equal(contacts.penetration(2,5,3.2,.05,.02),0);
  rack.rotation.y=Math.PI/2;
  rack.position.y=2;
  contacts.posed();
  assert.equal(contacts.penetration(2.5,5,3.2,.05,.02),0);
  const notice={};
  assert.ok(contacts.penetration(2,5.5,5.25,.05,.02,notice)>0);
  assert.equal(notice.person,'工人');
});
