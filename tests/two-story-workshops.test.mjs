import assert from 'node:assert/strict';
import test from 'node:test';
import { Box3, Group, Texture, TextureLoader, Vector3 } from '../two/vendor/three.module.min.js';
import { createStoryEvidence, createStoryFood, createStoryWorktable, drawerTimbers, poseRicePackets, poseStoryFood } from '../two/story-crafts.js';
import { servingLiner } from '../two/mochiyori-cut.js';
import { createStoryCollisions } from '../two/story-collisions.js';
import { tablePlan } from '../two/story-table-plan.js';

test('the two rice portions travel folded and open on the same creases at the inn', t => {
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const sample=createStoryEvidence('rice','same-rice'), carried=createStoryEvidence('rice','same-rice');
  const portions=['同じ袋の米・左','同じ袋の米・右'].map(name=>sample.getObjectByName(name));
  assert.equal(portions[1].userData.performPart,'divide');
  const closed=new Box3().setFromObject(sample,true);
  poseRicePackets(sample,'open',1);
  for(const portion of portions){
    assert.equal(portion.children.length,2);
    for(const flap of portion.children){
      assert.equal(flap.rotation.x,flap.userData.riceFold*2.21);
      assert.ok(new Box3().setFromObject(flap,true).min.y>=0,'opened bamboo skin clears the table');
      assert.ok(Math.abs(carried.getObjectByName(portion.name).getObjectByName(flap.name).rotation.x)<1e-8);
    }
  }
  const opened=new Box3().setFromObject(sample,true);
  assert.ok(opened.max.z>closed.max.z+.045 && opened.min.z<closed.min.z-.045);
  poseRicePackets(sample,'fold',1);
  assert.ok(closed.equals(new Box3().setFromObject(sample,true)));
});

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

test('opened bamboo stays on the dish and an edible band keeps its fold across a handoff', t => {
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const dish=createStoryFood(2),cake=dish.getObjectByName('取り分ける餅');
  const liner=cake.getObjectByName('笹結び餅の開き笹'),parts=[];
  liner.traverse(part=>{if(part.userData.foodMotion)parts.push(part);});
  assert.ok(parts.length);
  const release=servingLiner(dish);
  poseStoryFood(cake,'open',1);
  poseStoryFood(cake,'set',.5);
  assert.ok(parts.every(part=>part.morphTargetInfluences[0]===1));
  const centre=liner.getWorldPosition(new Vector3());
  release();
  cake.position.y+=.25;
  poseStoryFood(cake,'pass',1);
  assert.equal(liner.parent,dish);
  assert.ok(liner.getWorldPosition(new Vector3()).distanceTo(centre)<1e-9);
  for(const number of [6,16]){
    const pastry=createStoryFood(number).getObjectByName('取り分ける餅');
    const band=pastry.children.find(part=>part.userData.foodMotion==='tie');
    poseStoryFood(pastry,'lift',1);
    const ready=band.morphTargetInfluences[0];
    poseStoryFood(pastry,'tie',0);
    assert.equal(band.morphTargetInfluences[0],ready);
    poseStoryFood(pastry,'tie',1);
    poseStoryFood(pastry,'pass',.5);
    assert.equal(band.morphTargetInfluences[0],0);
  }
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

test('a traveller restored inside a planked top can walk continuously out across its seams',()=>{
  const hulls=createStoryCollisions();
  hulls.update([{number:1,kind:'table',x:0,y:0,z:0,yaw:0}]);
  let previous=Infinity;
  for(let z=.11;z<1;z+=.012){
    const depth=hulls.penetration(.08,z,.03,1.7,.38);
    assert.ok(depth===0 || depth<previous);
    previous=depth;
  }
  assert.equal(previous,0);
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

test('wood grain follows the sawn length, with growth rings on both ends and paper fibres in the ledger', t => {
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const tile=(uv,i)=>4*(1-Math.floor(uv.getY(i)*2))+Math.floor(uv.getX(i)*4);
  for(let axis=0;axis<3;axis++){
    const size=[.065,.065,.065];size[axis]=.8;
    const rack=new Group();drawerTimbers(rack,'桟',[[0,0,0,...size,'#bc9867']]);
    const {position,normal,uv}=rack.children[0].geometry.attributes;
    let side=0,end=0;
    for(let i=0;i<position.count;i+=3){
      const patch=tile(uv,i);
      assert.ok([0,6].includes(patch));
      assert.ok([1,2].every(j=>tile(uv,i+j)===patch),'one face cannot blend two atlas swatches');
      if(Math.abs(normal.getComponent(i,axis))>.99){assert.equal(patch,6);end++;}
      if(Math.abs(normal.getComponent(i,axis))>.01)continue;
      for(const [a,b] of [[i,i+1],[i,i+2]]){
        const length=position.getComponent(a,axis)-position.getComponent(b,axis);
        if(Math.abs(length)<.7)continue;
        assert.equal(patch,0);
        assert.ok(Math.abs((uv.getX(a)-uv.getX(b))*length)>.1);
        side++;
      }
    }
    assert.ok(side>=4 && end>=4);
  }
  const ledger=createStoryEvidence('ledger').getObjectByName('開いた控え');
  const paper=ledger.geometry.attributes.uv;
  assert.ok(Array.from({length:paper.count},(_,i)=>tile(paper,i)).every(swatch=>swatch===2));
  for(const [n,kind,patch] of [[4,'clay',3],[17,'iron',7]]){
    const table=createStoryWorktable(n),mesh=table.getObjectByName(table.name+'・'+kind);
    const uv=mesh.geometry.attributes.uv;
    assert.ok(mesh.material.map);
    assert.ok(Array.from({length:uv.count},(_,i)=>tile(uv,i)).every(swatch=>swatch===patch));
  }
});

test('the shell dish keeps its nacre color and lighting continuous where the frieze wraps', t => {
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  const {uv,position,normal,color}=createStoryFood(13).children[0].children[0].geometry.attributes;
  const start=new Vector3(),end=new Vector3();
  let first=-1,rings=0;
  for(let i=0;i<uv.count;i++){
    if(uv.getX(i)===0)first=i;
    if(uv.getX(i)!==1)continue;
    assert.ok(first>=0);
    for(const attr of [position,normal,color]){
      assert.ok(start.fromBufferAttribute(attr,first).distanceTo(end.fromBufferAttribute(attr,i))<1e-5);
    }
    first=-1;rings++;
  }
  assert.ok(rings>1);
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
