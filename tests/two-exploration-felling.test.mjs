import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../two/vendor/three.module.min.js';
import { createGame } from '../two/game.js';
import { createLivingWorld, readLivingWorld, validLivingWorld, JOURNEY_VERSION } from '../two/living-save.js';
import { fellTree, placeStructure, regrowTimber, removeStructure, reachableTimberTree, timberTree, withBuildTerrain } from '../two/living-build.js';
import { terrainContactHeight, groundHeight, staticVolumeAt, timberWood, TREES } from '../two/terrain.js';
import { timberCut } from '../two/homestead-timber-section.js';
import { timberId } from '../two/living-build-trees.js';
import { DAY_MINUTES } from '../two/world-clock.js';
import { createExplorationFelling,fellingMotion,poseFellingAxe } from '../two/exploration-felling.js';
import { forestGeometry } from '../two/forest-mesh.js';
import { isTimberHidden,isTimberFelled } from '../two/living-build-trees.js';
import {fallingTimber,rootedTimber} from '../two/falling-timber.js';

const birch=timberTree('birch:39941:2333:9507');
function footing(x,z){
  return {x,z,y:terrainContactHeight(x,z),heading:1.06,grounded:true};
}
const close=(a,b,margin=1e-6)=>assert.ok(Math.abs(a-b)<margin,a+' vs '+b);

test('ordinary interaction reaches the live trunk and does not award timber before the third bite',()=>{
  const game=createGame(),{player,livingWorld,events}=game.state,wood=livingWorld.wood;
  Object.assign(player,footing(birch.x-1.7,birch.z));
  const near=game.nearest();
  assert.equal(near.target.timberTree.id,birch.id);
  assert.equal(near.label,'手斧で木を伐る');assert.equal(game.act(near.action),true);
  assert.equal(events.at(-1).type,'chop');assert.equal(livingWorld.wood,wood);
  assert.equal(reachableTimberTree(livingWorld,player,{penetration:()=>.1}),null);
  assert.equal(reachableTimberTree(livingWorld,{...player,y:player.y+4}),null);
  for(const support of [{grounded:false,h:.2},{mount:'bike'},{mount:'turtle'},{skiff:'merchant'},{inWater:true}]){
    assert.equal(reachableTimberTree(livingWorld,{...player,...support}).id,birch.id);
  }
  player.mount='turtle';assert.equal(game.nearest().action,'interact');
  assert.equal(game.act('interact'),true);assert.equal(player.mount,'turtle');assert.equal(events.at(-1).type,'chop');player.mount=null;
  assert.equal(reachableTimberTree(livingWorld,{...player,activity:'bath'}),null);
  assert.equal(fellTree(livingWorld,birch.id).ok,true);
  assert.notEqual(game.nearest()?.target.timberTree?.id,birch.id);
});

test('a matured tree waits for its occupied plot, then restores the same trunk with no inventory change',()=>{
  const w=createLivingWorld(480.25),cut=timberCut(birch),solid=()=>staticVolumeAt(cut.x,cut.z,cut.y+.05,.06,.3);
  withBuildTerrain(w,()=>{
    assert.ok(solid());assert.ok(fellTree(w,birch.id).ok);assert.equal(solid(),false);
    const when=w.treeReadyAt[birch.id];
    assert.equal(when,481+DAY_MINUTES);
    w.worldMinute=when-.1;assert.equal(regrowTimber(w),0);
    const built=placeStructure(w,'camp',birch);assert.ok(built.ok,built.reason);
    w.worldMinute=when+10;assert.equal(regrowTimber(w),0);
    assert.ok(removeStructure(w,built.structure.id).ok);
    assert.equal(regrowTimber(w,footing(cut.x+.62,cut.z)),0);
    w.worldMinute++;const wood=w.wood;
    assert.equal(regrowTimber(w,footing(0,62)),1);
    assert.ok(solid());assert.deepEqual(w.felledTrees,[]);assert.deepEqual(w.treeReadyAt,{});
    assert.equal(w.wood,wood);assert.equal(regrowTimber(w),0);
    assert.ok(fellTree(w,birch.id).ok);assert.equal(w.wood,wood+6);
    assert.equal(fellTree(w,birch.id).ok,false);
  });
});

test('pre-regrowth save files start a single day at load and retain that deadline on subsequent loads',()=>{
  const old=createLivingWorld(1611.2);old.felledTrees=[birch.id];delete old.treeReadyAt;
  const w=readLivingWorld(JOURNEY_VERSION,old);
  assert.equal(w.treeReadyAt[birch.id],1612+DAY_MINUTES);assert.equal(old.treeReadyAt,undefined);
  w.worldMinute+=88;const next=readLivingWorld(JOURNEY_VERSION,JSON.parse(JSON.stringify(w)));
  assert.deepEqual(next.treeReadyAt,w.treeReadyAt);
  for(const invalid of [null,[],{[birch.id]:-2},{other:100}])assert.equal(validLivingWorld({...w,treeReadyAt:invalid}),false);
});

test('three right-handed side swings meet the notch, with the free hand clear and the traveller back at the initial footprint',()=>{
  const moso=timberTree(timberId(TREES.find(t=>t.kind==='moso'))),bamboo=timberCut(moso);
  const toolPoint=(f,x,y,z)=>new T.Vector3(x,y,z)
    .applyEuler(new T.Euler(f.pitch,f.toolYaw,f.roll,'YXZ')).add(new T.Vector3(...f.tool));
  for(const tree of [birch,{...moso,stem:bamboo.culms.at(-1)}])for(const full of [0,1]){
    const cut=tree.stem??timberCut(tree),player={...footing(cut.x-1.7,cut.z),buffs:{full}};
    const plan=fellingMotion(tree,player),home=plan.sample(0).hero,last=plan.sample(plan.duration).hero;
    close(home[0],last[0]);close(home[2],last[2]);close(Math.hypot(home[0],home[2]),1.7);
    assert.equal(plan.impactTimes.length,3);
    for(const t of plan.impactTimes){
      const f=plan.sample(t),v=toolPoint(f,0,.51,-.215);
      close(v.x,f.at[0]);close(v.y,f.at[1]);close(v.z,f.at[2]);
      close(f.draw,1);
      const wind=plan.sample(t-.34),raised=toolPoint(wind,0,.51,-.215);
      assert.ok(raised.x-v.x>.42 && wind.toolYaw<f.toolYaw-1.8,'right-side backswing');
      assert.ok(raised.x-v.x>raised.y-v.y,'broader sweep than lift');
      assert.ok(wind.twist<0 && f.twist>0);
      assert.ok(f.palms[0].pressure>wind.palms[0].pressure+.32);
      assert.ok(wind.weightShift[0]<0 && f.weightShift[0]>0);
      assert.equal(f.palms[1],null);
      let depth=plan.sample(t-.34).biteDepth;
      for(let dt=-.34;dt<=.08;dt+=.008){
        const p=plan.sample(t+dt),tip=toolPoint(p,0,.51,-.215);
        close(toolPoint(p,.014,.064,.024).distanceTo(new T.Vector3(...p.hands[0])),0);
        assert.deepEqual(p.handWork,[1,0]);assert.deepEqual(p.hands[1],p.restHands[1]);
        assert.ok(tip.distanceTo(new T.Vector3(...p.hands[1]))>.54);
        assert.ok(p.biteDepth>=depth-1e-6,'cut reopened during a stroke');depth=p.biteDepth;
        if(tip.x>.45)close(p.biteDepth,plan.impactTimes.indexOf(t));
      }
    }
    for(let t=1/60;t<plan.duration;t+=1/60){
      const prev=plan.sample(t-1/60),now=plan.sample(t);
      for(const [a,b] of [[now.hero,prev.hero],...now.feet.map((p,i)=>[p,prev.feet[i]]),...now.hands.map((p,i)=>[p,prev.hands[i]])])
        assert.ok(Math.hypot(...a.map((n,i)=>n-b[i]))<.29,'discontinuous frame at '+t);
    }
  }
});

async function loadTravellerModel(t){
  const {readFile}=await import('node:fs/promises');
  const {GLTFLoader}=await import('../two/vendor/GLTFLoader.min.js');
  const {loadRiceModel}=await import('../two/mochi-model.js');
  t.mock.method(T.TextureLoader.prototype,'loadAsync',async()=>new T.Texture());
  t.mock.method(GLTFLoader.prototype,'loadAsync',async function(url){
    const bytes=await readFile(new URL(url));
    return this.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  });
  await loadRiceModel();
}

test('the actual steel meets the notch from the painted GLB palm, including a rider who steps down and returns',async t=>{
  const {createCookingPerformer}=await import('../two/cooking-performer.js');
  await loadTravellerModel(t);
  const scene=new T.Group(),prop=new T.Object3D();
  for(const tree of [birch,timberTree('cedar:201118:22991:-141917'),timberTree('black-pine:49192680:-71693:-5195')]){
    const cut=timberCut(tree);
    for(const mode of ['normal','kagami'])for(const mount of [null,'turtle']){
      const p={...footing(cut.x,cut.z+1.7),mode,mount,buffs:{}};
      const plan=fellingMotion(tree,p),performer=createCookingPerformer(scene,p);
      assert.ok(Number.isFinite(plan.footingError),'must find a clear side of the trunk');
      const home=plan.sample(0).hero;
      if(mount)close(home[1]+cut.y,p.y+1.04);
      for(const time of plan.impactTimes){
        const wind=plan.sample(time-.34),raised=performer.update(wind);
        const woundHands=raised.map(hand=>new T.Vector3(...hand));
        const shoulder=performer.group.getObjectByName('Hand_R');
        const woundShoulder=shoulder.getWorldPosition(new T.Vector3());
        poseFellingAxe(prop,wind,raised[0]);
        const woundGrip=prop.worldToLocal(new T.Vector3(...raised[0]));
        close(woundGrip.y,.064);
        const bevel=performer.group.worldToLocal(prop.localToWorld(new T.Vector3(0,.51,-.215)));
        const ownSide=performer.group.worldToLocal(woundHands[0].clone());
        assert.ok(bevel.x<ownSide.x-.10,'backswing entered the belly on sloping footing');
        const f=plan.sample(time),actual=performer.update(f);
        const forward=new T.Vector3(Math.sin(f.heading),0,Math.cos(f.heading));
        const struckShoulder=shoulder.getWorldPosition(new T.Vector3());
        assert.ok(struckShoulder.sub(woundShoulder).dot(forward)>.13,'right shoulder must unwind around the planted sole');
        assert.ok(new T.Vector3(...actual[0]).sub(woundHands[0]).dot(forward)>.18,'right palm must sweep from the flank with the axe');
        assert.ok(woundHands[1].sub(new T.Vector3(...actual[1])).dot(forward)>.12,'left hand must balance from the opposite cheek');
        assert.ok(new T.Vector3(...wind.feet[0]).distanceTo(new T.Vector3(...f.feet[0]))<.001);
        poseFellingAxe(prop,f,actual[0]);
        const grip=prop.worldToLocal(new T.Vector3(...actual[0]));
        assert.ok(grip.y>=-.074 && grip.y<=.331);
        close(grip.x,.014);close(grip.z,.024);
        close(prop.localToWorld(new T.Vector3(0,.51,-.215)).distanceTo(new T.Vector3(...f.at)),0,.008);
        if(mount){
          const c=Math.cos(plan.bearing),s=Math.sin(plan.bearing);
          for(const [x,y,z] of f.feet)close(cut.y+y,groundHeight(cut.x+x*c+z*s,cut.z-x*s+z*c,p.y));
        }
      }
      const last=plan.sample(plan.duration).hero;
      assert.ok(new T.Vector3(...last).distanceTo(new T.Vector3(...home))<1e-6);
      performer.dispose();
    }
  }
});

test('the thin bevel enters the bark before any corner of the square poll on all three swings',async t=>{
  await loadTravellerModel(t);
  t.mock.method(T.TextureLoader.prototype,'load',()=>new T.Texture());
  const cut=timberCut(birch);
  for(const mode of ['normal','kagami']){
    const scene=new T.Scene(),player={...footing(cut.x,cut.z+1.7),mode,buffs:{}};
    const action=createExplorationFelling({scene,player,hero:()=>new T.Group(),commit:()=>({ok:true})});
    assert.ok(action.start(birch));
    const axe=scene.getObjectByName('楔を打った手斧'),positions=axe.geometry.attributes.position;
    const edge=new T.Box3(),corners=[];
    for(let i=0;i<positions.count;i++){
      const p=new T.Vector3().fromBufferAttribute(positions,i);
      if(p.z<-.20 && p.y>.44 && p.y<.55)edge.expandByPoint(p);
      if(p.z>.07 && p.y>.46 && p.y<.60)corners.push(p);
    }
    assert.ok(!edge.isEmpty() && corners.length>0);
    const bevel=edge.getCenter(new T.Vector3()),plan=fellingMotion(birch,player),radius=cut.radius;
    // In the axe parent's frame the trunk axis is (0, y, 0).
    const inTrunk=p=>Math.hypot(p.x,p.z)<=radius;
    let time=0;
    for(const impact of plan.impactTimes){
      let previous,entered=false;
      while(time<impact){
        const dt=Math.min(1/120,impact-time);
        action.update(dt);time+=dt;
        if(time<impact-.30)continue;
        axe.updateMatrix();
        const bit=bevel.clone().applyMatrix4(axe.matrix);
        const poll=corners.map(p=>p.clone().applyMatrix4(axe.matrix));
        if(!entered){
          assert.ok(poll.every(p=>!inTrunk(p)),'the blunt back met the bark first');
          entered=inTrunk(bit);
        }
        if(previous && time<impact-.008){
          const direction=bit.clone().sub(previous).normalize();
          assert.ok(poll.every(p=>bit.clone().sub(p).dot(direction)>.10),'the poll led the moving bevel');
        }
        previous=bit;
      }
      assert.ok(entered,'bevel missed the trunk');
    }
    action.close();
  }
});

test('a fully occupied worksite explains the footing and leaves the tree and inventory in place',()=>{
  const cut=timberCut(birch),player=footing(cut.x,cut.z+1.7),scene=new T.Scene();
  let result,commits=0;
  const action=createExplorationFelling({scene,player,canStand:()=>false,commit:()=>{commits++;},done:r=>result=r});
  assert.equal(action.start(birch),false);assert.equal(action.active,false);assert.equal(commits,0);
  assert.equal(result.ok,false);assert.match(result.reason,/足/);assert.equal(scene.children.length,0);
});

test('a falling tree reuses the standing model and the original shader and clears its own transient objects',()=>{
  const tree=birch,cut=timberCut(tree),scene=new T.Scene(),mat=new T.MeshLambertMaterial(),model=new T.BoxGeometry(.3,4,.3);
  mat.onBeforeCompile=shader=>{shader.uniforms.standingWash={value:.72};};
  const trunk=new T.Mesh(model,mat);trunk.position.set(tree.x,tree.ground+2,tree.z);trunk.userData.timberSource=tree.source;scene.add(trunk);
  const w=createLivingWorld();
  withBuildTerrain(w,()=>{
    const worldTree=fallingTimber(scene,tree,footing(tree.x-1.7,tree.z));
    assert.equal(worldTree.group.visible,false);
    const [part,face]=worldTree.group.children;
    assert.equal(part.geometry,model);assert.notEqual(mat,part.material);assert.ok(face.geometry.index.count>=72);
    const shader={uniforms:{},vertexShader:'#include <project_vertex>',fragmentShader:'#include <alphatest_fragment>'};
    part.material.onBeforeCompile(shader);
    assert.equal(shader.uniforms.standingWash.value,.72);assert.match(shader.vertexShader,/timberPlane/);
    close(worldTree.group.position.y,cut.y);
    assert.ok(fellTree(w,tree.id).ok);worldTree.update(0);assert.equal(worldTree.group.visible,true);
    close(worldTree.group.quaternion.angleTo(new T.Quaternion()),0);worldTree.update(.6);
    const tilt=worldTree.group.quaternion.angleTo(new T.Quaternion());assert.ok(tilt>.15 && tilt<1.53);
    assert.ok(shader.uniforms.timberPresence.value>0 && shader.uniforms.timberPresence.value<1);
    worldTree.update(1);assert.equal(shader.uniforms.timberPresence.value,0);
    assert.equal(face.visible,false);worldTree.dispose();assert.deepEqual(scene.children,[trunk]);assert.equal(trunk.material,mat);
  });
  mat.dispose();model.dispose();
});

test('a low hanging birch branch clears an eave outside the falling bole',()=>{
  const tree=birch,cut=timberCut(tree),solid=timberWood(tree.source),scene=new T.Scene();
  const hinge=new T.Vector3(cut.x,cut.y,cut.z),player=footing(cut.x-1.7,cut.z);
  const tips=solid.wood.map(part=>{
    const u=(part.x+part.dx)*solid.scale,v=(part.z+part.dz)*solid.scale;
    return new T.Vector3(solid.x+u*solid.c+v*solid.s,
      solid.base+(part.y+part.dy)*solid.scale,solid.z-u*solid.s+v*solid.c).sub(hinge);
  });
  const world=createLivingWorld();
  withBuildTerrain(world,()=>{
    const open=fallingTimber(scene,tree,player);fellTree(world,tree.id);open.update(1);
    const trajectory=open.group.quaternion.clone();open.dispose();
    const eavePose=new T.Quaternion().slerp(trajectory,.60);
    const tipsAtEave=tips.filter(tip=>tip.y>1 && tip.y<6.2).map(tip=>{
      const at=tip.clone().applyQuaternion(eavePose).add(hinge);
      return {tip,at,height:at.y-terrainContactHeight(at.x,at.z)};
    }).filter(point=>point.height>.3 && point.height<3.65);
    const {tip,at}=tipsAtEave.sort((a,b)=>Math.abs(b.at.z-cut.z)-Math.abs(a.at.z-cut.z))[0];
    assert.ok(Math.abs(at.z-cut.z)>1.5);
    const clear=(x,z,y,r,h)=>Math.abs(x-at.x)>.23+r || Math.abs(z-at.z)>.23+r ||
      y>at.y+.23 || y+h<at.y-.23;
    const guarded=fallingTimber(scene,tree,player,clear);
    for(let i=0;i<=100;i++){
      guarded.update(i/100);
      const p=tip.clone().applyQuaternion(guarded.group.quaternion).add(hinge);
      assert.ok(clear(p.x,p.z,p.y-.04,.04,.08));
    }
    assert.ok(guarded.group.quaternion.angleTo(trajectory)>.10);
    guarded.dispose();
  });
});

test('each severed moso culm rolls about the lip of its own stump without pushing its bottom into the earth',()=>{
  const tree=timberTree(timberId(TREES.find(t=>t.kind==='moso'))),cut=timberCut(tree);
  const frame=timberWood(tree.source),scene=new T.Scene(),geometry=forestGeometry(tree.source.form);
  const mat=new T.MeshLambertMaterial(),grove=new T.InstancedMesh(geometry,mat,1);
  grove.userData.timberForm=tree.source.form;
  grove.userData.timberRecord=()=>({ground:frame.base,rotation:Math.atan2(frame.s,frame.c),
    wash:0,bambooWash:-1,reach:48,dye:0,tint:1});
  scene.add(grove);
  const w=createLivingWorld();
  withBuildTerrain(w,()=>{
    const top=fallingTimber(scene,tree,footing(tree.x-1.7,tree.z));fellTree(w,tree.id);
    assert.ok(cut.culms.length>=5);assert.equal(top.group.children.length,cut.culms.length);
    for(let t=0;t<=1;t+=.05){
      top.update(t);top.group.updateMatrixWorld(true);
      for(const [i,stem] of cut.culms.entries()){
        const stalk=top.group.children[i],part=stalk.children.find(m=>m.isInstancedMesh);
        const source=geometry.userData.culms[stem.culm];
        assert.equal(part.geometry.index.count,source.endIndex-source.firstIndex);
        assert.ok(stalk.children.some(m=>!m.isInstancedMesh && m.geometry.index.count>=96));
        const center=new T.Vector3(stem.x-cut.x,0,stem.z-cut.z),levels=[];
        for(let k=0;k<180;k++){
          const a=k*Math.PI/90;
          levels.push(center.clone().add(new T.Vector3(Math.sin(a)*stem.radius,0,Math.cos(a)*stem.radius)).applyMatrix4(stalk.matrixWorld).y);
        }
        assert.ok(Math.min(...levels)>=stem.y-1e-7);
        assert.ok(Math.min(...levels)<stem.y+.00002);
        if(t>.4)assert.ok(center.applyMatrix4(stalk.matrixWorld).y>stem.y+.004);
      }
    }
    assert.ok(top.group.quaternion.angleTo(new T.Quaternion())>.2);top.dispose();
  });
  grove.dispose();geometry.dispose();mat.dispose();
});

test('the axe opens a measurable V at both strikes while the planted trunk remains solid, then releases the sloping upper cut',()=>{
  const cut=timberCut(birch),w=createLivingWorld(),scene=new T.Scene();
  const g=new T.CylinderGeometry(cut.radius,cut.radius,3,32),m=new T.MeshStandardMaterial(),stem=new T.Mesh(g,m);
  stem.position.set(cut.x,cut.y+.95,cut.z);stem.userData.timberSource=birch.source;scene.add(stem);
  withBuildTerrain(w,()=>{
    const player=footing(cut.x,cut.z+1.7);
    const falling=fallingTimber(scene,birch,player),mouth=falling.beginCut();
    const cutMesh=falling.group.getObjectByName('斧が割り開いた木口'),plan=fellingMotion(birch,player,()=>true,mouth);
    assert.ok(isTimberHidden(birch.source));assert.equal(isTimberFelled(birch.source),false);
    const native=stem.geometry.attributes.position.array.slice();
    let last=0;
    for(const [i,t] of plan.impactTimes.entries()){
      const f=plan.sample(t);close(f.at[2],mouth.edges[i]);close(f.biteDepth,i+1);
      assert.ok(mouth.front-mouth.edges[i]>last);last=mouth.front-mouth.edges[i];
      falling.bite(f.biteDepth);
      const a=cutMesh.geometry.attributes.position;
      let low=Infinity,high=-Infinity;
      for(let j=0;j<a.count;j++){low=Math.min(low,a.getZ(j));high=Math.max(high,a.getY(j));}
      close(low,mouth.edges[i],1e-6);
      assert.ok(high>.13*cut.radius);
    }
    assert.ok(fellTree(w,birch.id).ok);falling.update(.56);
    const a=cutMesh.geometry.attributes.position;
    cutMesh.geometry.computeBoundingBox();
    assert.ok(cutMesh.geometry.boundingBox.min.z<-.9*cut.radius);
    const point=new T.Vector3();cutMesh.updateWorldMatrix(true,false);
    for(let i=0;i<a.count;i++)assert.ok(point.fromBufferAttribute(a,i).applyMatrix4(cutMesh.matrixWorld).y>=cut.y-.0001);
    const stump=rootedTimber(scene,{...birch,cut});
    assert.ok(stump?.children.length>=2);
    stump.children.at(-1).geometry.computeBoundingBox();
    assert.ok(stump.children.at(-1).geometry.boundingBox.min.z<-.9*cut.radius);
    stump.userData.releaseStump();falling.dispose();
    assert.deepEqual(stem.geometry.attributes.position.array,native);
  });g.dispose();m.dispose();
});
