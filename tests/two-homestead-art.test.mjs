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

test('a hillside house uses the same cut timbers in the survey, performance and permanent world',async()=>{
  const {createLivingWorld}=await import('../two/living-save.js');
  const {placeStructure,surveySite,syncBuildTerrain,moveStructure}=await import('../two/living-build.js');
  const {foundationMembers}=await import('../two/homestead-foundation.js');
  const {assemblyParts}=await import('../two/homestead-assembly-parts.js');
  const {terrainContactHeight,groundHeight,canOccupy}=await import('../two/terrain.js');
  const world={...createLivingWorld(),wood:80,wallet:50};
  assert.ok(placeStructure(world,'camp',{x:151,z:128,yaw:0}).ok);
  const pose={x:140,z:132,yaw:.3},quote=surveySite(world,'hut',pose);
  assert.ok(quote.ok && quote.relief>2);
  const scene=new T.Group(),view=createHomesteadWorld(scene);
  view.setLivingWorld(world);view.setBuildingPreview({...quote,kind:'hut'});
  const ghost=scene.getObjectByName('仮置き・板張りの小屋').userData.foundation;
  const parts=assemblyParts('hut',quote.terrain,quote).filter(s=>s.siteGeometry);
  assert.ok(parts.length>4);
  const counts=parts.reduce((sum,p)=>sum+p.geometry.index.count,0);
  assert.equal(ghost.geometry.index.count,counts);
  const positions=g=>Array.from({length:g.attributes.position.count},(_,i)=>
    [g.attributes.position.getX(i),g.attributes.position.getY(i),g.attributes.position.getZ(i)].join(','));
  assert.deepEqual(parts.flatMap(p=>positions(p.geometry)).sort(),positions(ghost.geometry).sort());
  const floor=placeStructure(world,'hut',pose).structure;
  view.update(0,pose);
  const permanent=scene.getObjectByName('板床'),base=permanent.userData.foundation;
  assert.deepEqual(base.geometry.attributes.position.array,ghost.geometry.attributes.position.array);
  const members=foundationMembers('floor',floor),piers=members.filter(m=>m.type==='pier');
  const lengths=piers.map(p=>-p.h);
  assert.ok(Math.max(...lengths)-Math.min(...lengths)>1.4);
  for(const p of piers){
    const stage=parts.find(s=>s.id==='foundation.'+p.id);
    assert.ok(Math.abs(stage.bounds.min[1]-p.bottom)<1e-6);
  }
  // Walk from the actual approach onto the highest edge. The contact solver
  // must find each visible tread and then the real floor, at ordinary stride.
  syncBuildTerrain(world);
  try{
    const stair=members.find(m=>m.type==='stairs'),t=stair.treads[0];
    const [nx,nz]=stair.normal,c=Math.cos(floor.yaw),s=Math.sin(floor.yaw);
    let y,usedTread=false;
    for(let i=10;i>=-9;i--){
      const u=t.x+nx*i/10,v=t.z+nz*i/10,x=floor.x+c*u+s*v,z=floor.z-s*u+c*v;
      const old=y??terrainContactHeight(x,z);
      y=groundHeight(x,z,old);
      assert.ok(Math.abs(y-old)<.24 && canOccupy(x,z,y,.26,1.43));
      usedTread ||= Math.abs(y-floor.y-t.top)<.0001;
    }
    assert.ok(usedTread && Math.abs(y-floor.y-.18)<1e-6);
    let disposed=false;base.geometry.addEventListener('dispose',()=>{disposed=true;});
    const move=moveStructure(world,floor.id,{x:130,z:118,yaw:.3});
    assert.ok(move.ok,move.reason);
    view.update(1,pose);
    assert.ok(disposed);
    assert.notDeepEqual(permanent.userData.foundation.geometry.attributes.position.array,base.geometry.attributes.position.array);
    const restored=JSON.parse(JSON.stringify(world));
    view.setLivingWorld(restored);view.update(2,pose);
    const reloaded=scene.getObjectByName('板床').userData.foundation;
    assert.ok(reloaded);
    const expected=assemblyParts('floor',move.structure.terrain,move.structure).filter(s=>s.siteGeometry);
    assert.deepEqual(expected.flatMap(p=>positions(p.geometry)).sort(),positions(reloaded.geometry).sort());
    for(const p of expected)p.geometry.dispose();
  }finally{
    syncBuildTerrain(null);for(const p of parts)p.geometry.dispose();view.setLivingWorld(null);
  }
});

test('rice beds and seedlings follow the walkable hillside and clear only the occupied patch',async()=>{
  const {dressRiceBeds}=await import('../two/rice-field-beds.js');
  const {terrainContactHeight}=await import('../two/terrain.js');
  const p={solid:new T.MeshLambertMaterial(),shapes:{leaf:new T.BoxGeometry()},scene:new T.Scene(),
    closeDetails:[],stems:new T.MeshLambertMaterial()};
  const prune=dressRiceBeds(p),bed=p.scene.getObjectByName('月見の棚田の畦と田面');
  const shoots=p.scene.getObjectByName('棚田の稲苗'),pos=bed.geometry.attributes.position,ix=bed.geometry.index.array;
  for(let j=0;j<ix.length;j+=3){
    const tri=[ix[j],ix[j+1],ix[j+2]];
    const centre=key=>tri.reduce((sum,k)=>sum+pos[key](k),0)/3;
    const rise=centre('getY')-terrainContactHeight(centre('getX'),centre('getZ'));
    assert.ok(rise>=.013 && rise<=.059);
  }
  const before=shoots.instanceMatrix.array.slice();
  const placed=plantedFootprints([{kind:'floor',x:140,z:132,yaw:.3}]);
  prune(placed);
  let hidden=0;
  for(let i=0;i<shoots.count;i++){
    const [x,y,z]=before.subarray(16*i+12,16*i+15),plot=placed[0],dx=x-plot.x,dz=z-plot.z;
    assert.ok(Math.abs(y-terrainContactHeight(x,z)-.012)<.00004);
    const inside=Math.abs(dx*plot.c-dz*plot.s)<=plot.w+.30 && Math.abs(dx*plot.s+dz*plot.c)<=plot.d+.30;
    assert.equal(shoots.instanceMatrix.array[16*i+13],inside?-1000:y);
    if(inside)hidden++;
  }
  assert.ok(hidden>0 && hidden<shoots.count);
  prune([]);
  assert.deepEqual(shoots.instanceMatrix.array,before);
});

test('solid pier ends are buried across a cliff edge and all four workbench legs touch the slope',async()=>{
  const {surveySite,placeStructure}=await import('../two/living-build.js');
  const {foundationMembers,addFoundationContacts}=await import('../two/homestead-foundation.js');
  const {terrainContactHeight}=await import('../two/terrain.js');
  const {createLivingWorld}=await import('../two/living-save.js');
  const {assemblyParts}=await import('../two/homestead-assembly-parts.js');
  const {planAssembly}=await import('../two/homestead-assembly-motion.js');
  const {makeWorkTrestle}=await import('../two/homestead-work-trestle.js');
  const world={...createLivingWorld(),wood:100};
  assert.ok(placeStructure(world,'camp',{x:-191,z:-56,yaw:0}).ok);
  const hut=surveySite(world,'hut',{x:-179,z:-44,yaw:.3});
  assert.ok(hut.ok && hut.relief>5);
  const stages=assemblyParts('hut',hut.terrain,hut);
  for(const pier of foundationMembers('hut',hut).filter(p=>p.type==='pier')){
    const bearing=stages.find(s=>s.id==='foundation.'+pier.id);
    let bottom;
    addFoundationContacts((x,z,w,d,lo)=>{bottom=lo;},pier);
    assert.ok(Math.abs(bearing.bounds.min[1]-bottom)<1e-6);
    for(const i of [-1,-.5,0,.5,1])for(const j of [-1,-.5,0,.5,1]){
      const u=pier.x+i*pier.width/2,v=pier.z+j*pier.width/2;
      const y=terrainContactHeight(hut.x+u*Math.cos(hut.yaw)+v*Math.sin(hut.yaw),
        hut.z-u*Math.sin(hut.yaw)+v*Math.cos(hut.yaw));
      assert.ok(hut.y+bottom<=y-.149);
    }
  }
  const s=surveySite(world,'stand',{x:138,z:136,yaw:0});
  const player={x:s.x,y:terrainContactHeight(s.x,s.z+3.7),z:s.z+3.7,heading:Math.PI,grounded:true};
  const kit=assemblyParts('stand',s.terrain,s),plan=planAssembly(player,{...s,kind:'stand'},kit);
  assert.ok(plan && !plan.compact && plan.platforms.length);
  for(const platform of plan.platforms){
    const mesh=makeWorkTrestle(platform),vertices=mesh.geometry.attributes.position;
    mesh.updateMatrixWorld(true);
    const pt=new T.Vector3(),feet=[];
    for(let i=0;i<vertices.count;i++){
      pt.fromBufferAttribute(vertices,i).applyMatrix4(mesh.matrixWorld);
      if(pt.y+s.y<=terrainContactHeight(pt.x+s.x,pt.z+s.z)+.003)feet.push(pt.clone());
    }
    for(const i of [-1,1])for(const j of [-1,1]){
      const x=i*(platform.width/2-.10)*1.08,z=j*(platform.depth/2-.07)*1.10;
      const toe=new T.Vector3(x,0,z).applyMatrix4(mesh.matrixWorld);
      assert.ok(feet.some(p=>Math.hypot(p.x-toe.x,p.z-toe.z)<.12));
    }
    mesh.geometry.dispose();
  }
});
