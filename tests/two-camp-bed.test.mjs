import test from 'node:test';
import assert from 'node:assert/strict';
import {createLivingWorld,readLivingWorld,validLivingWorld} from '../two/living-save.js';
import {placeStructure,moveStructureGroup,removeStructureGroup,surveySite,validBuildLand,withBuildTerrain} from '../two/living-build.js';
import {bedOnFloor} from '../two/living-build-state.js';
import {setBeddingGrade} from '../two/camp-bedding.js';
import {campCover,drapeCover} from '../two/camp-cover.js';
import {bedPoint,sleepApproach,sleepMotion,sleepSeat} from '../two/camp-sleep-motion.js';
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
test('imported furniture accepts engine rounding on a turned floor and rejects a displaced anchor',()=>{
  const {w,c,deck}=campRoom();
  assert.ok(moveStructureGroup(w,[c.id],{dx:deck.x-c.x,dz:deck.z-c.z}).ok);
  assert.ok(placeStructure(w,'chest',deck).ok);
  for(const kind of ['camp','chest']){
    const exported=structuredClone(w),part=exported.structures.find(s=>s.kind===kind);
    part.x+=4*Number.EPSILON*Math.abs(part.x);
    assert.ok(readLivingWorld(14,exported));
    part.x+=.00001;
    assert.equal(readLivingWorld(14,exported),null);
  }
});
test('hut doors, graded covers and the night clock preserve the walk up, lie down, tuck and wake sequence',()=>{
  const {w,c,deck}=campRoom();moveStructureGroup(w,[c.id],{dx:deck.x-c.x,dz:deck.z-c.z});
  const bed=w.structures.find(s=>s.id===c.id);
  withBuildTerrain(w,()=>{
    const p=bedPoint(bed,.21,1.05);p.y=groundHeight(p.x,p.z,bed.y);p.heading=.5;
    const route=sleepApproach(bed,p);assert.ok(route?.length>1);
    const broad=sleepApproach(bed,{...p,buffs:{full:28}});
    assert.ok(broad?.some(waypoint=>waypoint.duck>.40),'the traveller can tuck under the lintel');
    assert.ok(broad.at(-1).duck<.01,'room to straighten up at the mattress');
    const motion=sleepMotion(route,p.heading,bed.yaw),first=motion.sample(0),last=motion.sample(motion.duration);
    assert.deepEqual(first.position,last.position);assert.equal(first.clock,0);assert.equal(last.clock,1);
    assert.equal(first.label,'寝床に上がる');assert.equal(last.label,'寝床を下りる');
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

test('the actual travelling skin keeps its volume through the tuck, sleep and rise, including a full and two-tier mochi',async t=>{
  const T=await import('../two/vendor/three.module.min.js');
  const {GLTFLoader}=await import('../two/vendor/GLTFLoader.min.js');
  const {readFile}=await import('node:fs/promises');
  const {loadRiceModel}=await import('../two/mochi-model.js');
  const {createSleeper}=await import('../two/camp-sleep-body.js');
  const {campMattress,campStaff,campPennon}=await import('../two/camp-bedding.js');
  // The drawing surface is unnecessary for measuring the exported skin.
  // Substitute just the network transport and leave the real rig, pose
  // sampling, morph weights, full-size buff and mattress contacts in use.
  t.mock.method(T.TextureLoader.prototype,'loadAsync',async()=>new T.Texture());
  t.mock.method(GLTFLoader.prototype,'loadAsync',async function(url){
    const bytes=await readFile(new URL(url.split('?')[0]));
    return this.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
  });
  await loadRiceModel();
  const staff=campStaff.map(([a,b,r])=>[new T.Line3(new T.Vector3(...a),new T.Vector3(...b)),r]);
  const contact=new T.Vector3();
  function clearHardware(p,layout){
    if(layout===true){
      // The bed anchor is 64 cm left and 5 cm forwards on its hut floor.
      return !(p.x>.77 && p.x<1.89 && p.z>-.97 && p.z<-.27 && p.y<.80) &&
        !(Math.abs(p.x+.80)<.065 && Math.abs(Math.abs(p.z+.05)-1.23)<.065 && p.y<2.12) &&
        !(Math.abs(p.z+1.28)<.065 && p.x>-.735 && p.x<2.015 && p.y<2.05);
    }
    for(const [line,r] of staff){
      if(p.distanceToSquared(line.closestPointToPoint(p,true,contact))<r*r)return false;
    }
    const u=(p.x+.920)/.453;
    if(u<0 || u>1 || p.y<1.50 || p.y>1.88)return true;
    const top=campPennon(u,0),bottom=campPennon(u,1),v=(top[1]-p.y)/(top[1]-bottom[1]);
    return v<0 || v>1 || Math.abs(p.z-campPennon(u,v)[2])>.008;
  }
  function skinVolume(mesh,layout,reclined){
    const a=Array.from({length:mesh.geometry.attributes.position.count},(_,i)=>
      mesh.getVertexPosition(i,new T.Vector3()).applyMatrix4(mesh.matrixWorld));
    if(reclined){
      const hit=a.find(p=>!clearHardware(p,layout));
      assert.ok(!hit,'skin touches furniture or staff at '+layout+' on '+mesh.name+' '+hit?.toArray());
    }
    const indices=mesh.geometry.index.array,cross=new T.Vector3();let sum=0;
    for(let i=0;i<indices.length;i+=3)sum+=a[indices[i]].dot(cross.crossVectors(a[indices[i+1]],a[indices[i+2]]));
    return Math.abs(sum/6);
  }
  const restVolume={};
  for(const layout of [true,false,'right-step','left-step'])for(const mode of ['normal','kagami'])for(const full of [0,1]){
    const seat={...sleepSeat(layout===true,full),y:.13},motion=sleepMotion([seat,seat],0,0);
    const root=new T.Group(),mat=campMattress(layout),actor=createSleeper(root,{mode,buffs:{full}},mat);
    const quilt=campCover(3,true,mat),tip=new T.Vector3();let standing=0,held=0;
    for(const time of [0,1.42,1.95,2.25,2.55,2.86,3.12,3.40,3.75,4.33,6.05,8.65,9.68,10.4,10.66,11.38,13.2]){
      const f=motion.sample(time),surf=actor.update(f,.06);root.updateMatrixWorld(true);
      const body=root.getObjectByName('Nikkori');
      const reclined=f.recline>.98;
      const onMat=reclined || layout===true;
      const volume=skinVolume(body,layout,onMat)+(mode==='kagami'?skinVolume(root.getObjectByName('鏡餅・福重ね').children[0],layout,onMat):0);
      if(time===0)standing=volume;
      assert.ok(volume/standing>.95 && volume/standing<1.07,mode+' lost its mass at '+time);
      drapeCover(quilt.geometry,3,f.cover,0,surf.height,surf.edge,surf.grips);
      const {position,uv}=quilt.geometry.attributes;
      if(onMat){
        for(let i=0;i<position.count;i++)
          assert.ok(clearHardware(tip.fromBufferAttribute(position,i),layout),'cloth touches hardware on '+layout);
        if(mode==='kagami'){
          const fruit=root.getObjectByName('鏡餅・福重ね').children[1];
          fruit.traverse(part=>{
            const pos=part.geometry?.attributes.position;
            for(let i=0;i<(pos?.count??0);i++)
              assert.ok(clearHardware(tip.fromBufferAttribute(pos,i).applyMatrix4(part.matrixWorld),layout),'daidai touches hardware on '+layout+' '+tip.toArray());
          });
        }
      }
      if(!surf.grips || f.grip<.999)continue;
      for(const palm of surf.grips){
        let gap=Infinity;
        for(let i=0;i<uv.count/2;i++)if(uv.getY(i)===1)
          gap=Math.min(gap,palm.distanceTo(tip.fromBufferAttribute(position,i)));
        assert.ok(gap<.04,'unheld selvedge at '+time+': '+gap);held++;
      }
    }
    assert.ok(held>=10);
    if(!full)restVolume[mode]=standing;
    else assert.ok(standing/restVolume[mode]>2.05,'the larger traveller keeps the full buff');
    if(layout===true && full && mode==='normal'){
      // A slow breath carries the shoulder across the sampling grid. The
      // quilt should follow it by millimetres without a whole cell's jump.
      let previous;
      for(let tick=393;tick<=444;tick++){
        const f=motion.sample(tick/60),profile=actor.update(f,1/60);
        drapeCover(quilt.geometry,3,f.cover,0,profile.height,profile.edge,profile.grips);
        const points=quilt.geometry.attributes.position.array;
        if(previous)for(let i=1;i<points.length;i+=3)
          assert.ok(Math.abs(points[i]-previous[i])<.01,'the duvet shivered during a quiet breath');
        else previous=new Float32Array(points.length);
        previous.set(points);
      }
    }
    actor.dispose();quilt.geometry.dispose();
  }
});
