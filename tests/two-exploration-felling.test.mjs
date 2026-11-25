import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from '../two/vendor/three.module.min.js';
import { createGame } from '../two/game.js';
import { createLivingWorld, readLivingWorld, validLivingWorld, JOURNEY_VERSION } from '../two/living-save.js';
import { fellTree, placeStructure, regrowTimber, removeStructure, reachableTimberTree, timberTree, withBuildTerrain } from '../two/living-build.js';
import { terrainContactHeight, staticVolumeAt, timberWood, TREES } from '../two/terrain.js';
import { timberCut } from '../two/homestead-timber-section.js';
import { timberId } from '../two/living-build-trees.js';
import { DAY_MINUTES } from '../two/world-clock.js';
import { fellingMotion } from '../two/exploration-felling.js';
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

test('three complete swings bite the same bark ring, hands remain on the haft and the traveller returns to the initial footprint',()=>{
  const moso=timberTree(timberId(TREES.find(t=>t.kind==='moso'))),bamboo=timberCut(moso);
  for(const tree of [birch,{...moso,stem:bamboo.culms.at(-1)}])for(const full of [0,1]){
    const cut=tree.stem??timberCut(tree),player={...footing(cut.x-1.7,cut.z),buffs:{full}};
    const plan=fellingMotion(tree,player),home=plan.sample(0).hero,last=plan.sample(plan.duration).hero;
    close(home[0],last[0]);close(home[2],last[2]);close(home[2],1.7);
    assert.equal(plan.impactTimes.length,3);
    for(const t of plan.impactTimes){
      const f=plan.sample(t),v=new T.Vector3(0,.51,-.215);
      v.applyEuler(new T.Euler(f.pitch,f.toolYaw,0,'YXZ')).add(new T.Vector3(...f.tool));
      close(v.x,f.at[0]);close(v.y,f.at[1]);close(v.z,f.at[2]);
      close(f.draw,1);
      for(const [i,offset] of [[.024,.095,.012],[-.025,.235,.008]].entries()){
        const hand=new T.Vector3(...offset).applyEuler(new T.Euler(f.pitch,f.toolYaw,0,'YXZ')).add(new T.Vector3(...f.tool));
        close(hand.distanceTo(new T.Vector3(...f.hands[i])),0);
      }
    }
    for(let t=1/60;t<plan.duration;t+=1/60){
      const prev=plan.sample(t-1/60),now=plan.sample(t);
      for(const [a,b] of [[now.hero,prev.hero],...now.feet.map((p,i)=>[p,prev.feet[i]]),...now.hands.map((p,i)=>[p,prev.hands[i]])])
        assert.ok(Math.hypot(...a.map((n,i)=>n-b[i]))<.29,'discontinuous frame at '+t);
    }
  }
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
