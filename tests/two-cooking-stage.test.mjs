import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../two/vendor/three.module.min.js';
import { GLTFLoader } from '../two/vendor/GLTFLoader.min.js';
import { loadRiceModel, makeRiceModel, poseRice } from '../two/mochi-model.js';
import { createCookingPerformer } from '../two/cooking-performer.js';
import { createCookingStage } from '../two/cooking-stage.js';
import { createCookingScore } from '../two/cooking-motion.js';
import { createCookingProps } from '../two/cooking-props.js';
import { BASIC_RECIPE, CRAFT_OPTIONS, STARTER_RECIPES, craftRecipe, evaluateRecipe } from '../two/living-craft.js';
import { createGame } from '../two/game.js';
import { LIVING_SITES, nearLivingSite } from '../two/living-sites.js';
import { marketCookCanopy, worktopPoint } from '../two/living-layout.js';
import { canOccupy, groundHeight } from '../two/terrain.js';

const workshops=LIVING_SITES.filter(site=>site.kind==='workshop');

test('the kagami cook uses its hands for tools while the traveller keeps both gohei',async t=>{
  t.mock.method(THREE.TextureLoader.prototype,'loadAsync',async()=>new THREE.Texture());
  t.mock.method(GLTFLoader.prototype,'loadAsync',async function(url){
    const bytes=await readFile(new URL(url));
    return this.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
  });
  await loadRiceModel();
  const scene=new THREE.Group(),travel=makeRiceModel(scene),player={mode:'kagami',grounded:true,buffs:{}};
  poseRice(travel,player,0,1/60,'curious');
  const actor=createCookingPerformer(scene,player),score=createCookingScore(BASIC_RECIPE);
  t.after(()=>actor.dispose());
  for(const chapter of score.chapters) {
    actor.update(score.sample((chapter.start+chapter.end)/2));
    assert.ok(actor.group.getObjectByName('鏡餅・福重ね').visible);
    for(const name of ['右手の御幣','左手の御幣']) assert.equal(actor.group.getObjectByName(name).visible,false);
  }
  poseRice(travel,player,2,1/60,'curious');
  for(const wand of travel.kagami.wands) {
    assert.ok(wand.group.visible);
    assert.ok(wand.group.position.toArray().every(Number.isFinite));
    assert.ok(Math.abs(wand.group.position.x)>.1);
  }
});

test('a cooking stage replaces only the local parked tools and restores their original visibility',()=>{
  const scene=new THREE.Scene();
  const batches=workshops.map((s,i)=>{
    const material=new THREE.MeshBasicMaterial();
    material.userData.cookingTools=s.id;
    material.visible=i!==2;
    scene.add(new THREE.Mesh(undefined,material));
    return material;
  });
  const stage=createCookingStage(scene,workshops[0]);
  assert.deepEqual(batches.map(m=>m.visible),[false,true,false]);
  const dish=stage.group.localToWorld(new THREE.Vector3(-1.48,.80,.10));
  const counter=worktopPoint(stage.layout,-1.48,.10);
  assert.ok(Math.hypot(counter.x-dish.x,counter.z-dish.z)<1e-7);
  stage.dispose();
  assert.equal(stage.group.parent,null);
  assert.deepEqual(batches.map(m=>m.visible),[true,true,false]);
});

test('both feet of the market cook can stay on the level working deck across the counter',()=>{
  const stage=createCookingStage(new THREE.Scene(),workshops.find(s=>s.id==='market-mortar'));
  for(const x of [-1.24,-.64,0,.62,1.25]) {
    for(const z of [.96,1.20,1.40]) {
      const p=worktopPoint(stage.layout,x,z), feet=stage.layout.floor(x,z);
      assert.ok(Math.abs(feet-.41)<1e-6);
      assert.ok(Math.abs(groundHeight(p.x,p.z,stage.layout.y)-stage.layout.y-feet)<1e-6);
      assert.ok(canOccupy(p.x,p.z,stage.layout.y+feet),JSON.stringify({x,z}));
    }
  }
  stage.dispose();
});

test('the hands, current task and face stay framed when the cook moves along each bench',()=>{
  const point=new THREE.Vector3();
  for(const site of workshops) {
    const stage=createCookingStage(new THREE.Scene(),site);
    const draft=STARTER_RECIPES.find(r=>r.regionId===site.region).draft;
    const score=createCookingScore(draft,stage.layout);
    for(const aspect of [390/740,896/530]) for(const detail of [false,true]) {
      const camera=new THREE.PerspectiveCamera(60,aspect,.04,200);
      for(let sec=0;sec<score.duration;sec+=1/12) {
        const frame=score.sample(sec);
        stage.positionCamera(camera,frame,{detail,dt:1/12});
        const [x,y,z]=frame.hero;
        const positions=detail ? [frame.focus] : [frame.focus,[x,y+1.45,z],...frame.hands];
        if(frame.piece.visible) {
          const [cx,cy,cz]=frame.piece.position;
          // Include both edges of the cake on the grate and during transport.
          positions.push([cx-.12,cy,cz],[cx+.12,cy+.06,cz]);
        }
        for(const position of positions) {
          stage.group.localToWorld(point.fromArray(position)).project(camera);
          assert.ok(Math.abs(point.x)<1 && Math.abs(point.y)<1 && point.z<1,
            [site.id,frame.phase,sec,aspect,detail,point.toArray()].join(' '));
        }
      }
    }
    stage.dispose();
  }
});

test('the close lens eases into the first mallet stroke',()=>{
  const site=workshops.find(s=>s.region==='market');
  const stage=createCookingStage(new THREE.Scene(),site);
  const score=createCookingScore(STARTER_RECIPES.find(r=>r.regionId===site.region).draft,stage.layout);
  const pound=score.chapters.find(c=>c.id==='pound');
  const previous=new THREE.Vector3();
  for(const aspect of [390/740,896/530]) {
    const camera=new THREE.PerspectiveCamera(60,aspect,.04,200);
    const from=pound.start-1;
    stage.positionCamera(camera,score.sample(from),{detail:true,cut:true});
    for(let t=from+1/60;t<pound.end;t+=1/60) {
      previous.copy(camera.position);
      stage.positionCamera(camera,score.sample(t),{detail:true,dt:1/60});
      assert.ok(camera.position.distanceTo(previous)<.16,'abrupt close-up at '+t);
    }
  }
  stage.dispose();
});

test('reduced motion holds one viewpoint and skipping cuts directly to the finished platter',()=>{
  const camera=new THREE.PerspectiveCamera(56,.53,.03,100);
  const site=workshops[0], stage=createCookingStage(new THREE.Scene(),site);
  const score=createCookingScore(STARTER_RECIPES[0].draft,stage.layout);
  const begin=score.sample(0), end=score.sample(score.duration);
  stage.positionCamera(camera,begin,{reducedMotion:true});
  const eye=camera.position.clone(), rotation=camera.quaternion.clone();
  for(let t=1;t<score.duration;t+=1)stage.positionCamera(camera,score.sample(t),{dt:1,reducedMotion:true});
  assert.ok(camera.position.distanceTo(eye)<1e-8);
  assert.ok(camera.quaternion.angleTo(rotation)<1e-6);
  stage.positionCamera(camera,begin,{dt:0,cut:true});
  stage.positionCamera(camera,end,{dt:0,cut:true});
  const afterCut=camera.position.clone();
  const fresh=createCookingStage(new THREE.Scene(),site);
  fresh.positionCamera(camera,end);
  assert.ok(camera.position.distanceTo(afterCut)<1e-8);
  stage.dispose();fresh.dispose();
});

test('passers-by move during cooking while the cook and recipe inventory stay put',()=>{
  const game=createGame();
  const {player,livingWorld,nearbyNpcs}=game.state;
  const before=nearbyNpcs.map(n=>[n.x,n.z]);
  const footing=[player.x,player.y,player.z];
  const entries=structuredClone(livingWorld);
  for(let i=0;i<30;i++) game.stepCookingScenery(1/30);
  assert.ok(nearbyNpcs.some((n,i)=>Math.hypot(n.x-before[i][0],n.z-before[i][1])>.04));
  assert.deepEqual([player.x,player.y,player.z],footing);
  assert.deepEqual(livingWorld,entries);
  const t=game.state.time;
  game.stepCookingScenery(0);
  assert.equal(game.state.time,t);
});


test('the market fringe and canopy posts clear the sightline to the lifted pestle and working palms',()=>{
  const stage=createCookingStage(new THREE.Scene(),workshops.find(s=>s.region==='market'));
  const score=createCookingScore(STARTER_RECIPES.find(r=>r.regionId==='market').draft,stage.layout);
  const {lift,postX}=marketCookCanopy;
  // In worktop coordinates the hanging fringe is .74 m beyond the work surface.
  const box=(x,y,z,rx,ry,rz)=>new THREE.Box3(new THREE.Vector3(x-rx,y-ry,z-rz),new THREE.Vector3(x+rx,y+ry,z+rz));
  const screens=[box(0,2.3+lift-.18,.74,1.63,.18,.0185)];
  for(const x of [-postX,postX]) for(const z of [-1.21,.65]) screens.push(box(x,1.5,z,.059,1.5,.059));
  const ray=new THREE.Ray(),end=new THREE.Vector3(),hit=new THREE.Vector3();
  for(const aspect of [390/740,896/530]) for(const detail of [false,true]) {
    const camera=new THREE.PerspectiveCamera(60,aspect,.04,200);
    for(let sec=0;sec<score.duration;sec+=.125){
      const frame=score.sample(sec);
      stage.positionCamera(camera,frame,{detail,dt:.125});
      ray.origin.copy(camera.position);stage.group.worldToLocal(ray.origin);
      const points=[frame.focus,...frame.hands];
      if(frame.phase==='pound')points.push(frame.tools.mallet.position);
      for(const p of points){
        end.fromArray(p);ray.direction.subVectors(end,ray.origin).normalize();
        for(const screen of screens){
          assert.ok(!ray.intersectBox(screen,hit)||ray.origin.distanceTo(hit)>=ray.origin.distanceTo(end),
            [frame.phase,sec,aspect,detail,p].join(' '));
        }
      }
    }
  }
  stage.dispose();
});


test('the cook starts on the visitor side and keeps both soles on a narrow standing tread',()=>{
  for(const site of workshops) {
    const stage=createCookingStage(new THREE.Scene(),site);
    const {layout}=stage, recipe=STARTER_RECIPES.find(r=>r.regionId===site.region).draft;
    const top=worktopPoint(layout,-.68,0);
    assert.equal(nearLivingSite({...top,y:layout.y+1.30,grounded:true},site),false);
    const u=-1.52,v=1.22,foot=layout.floor(u,v);
    assert.equal(nearLivingSite({...worktopPoint(layout,u,v),y:layout.y+foot,grounded:true},site),true);
    const score=createCookingScore(recipe,layout,{start:[u,foot,v],heading:Math.PI});
    const first=score.sample(0);
    assert.ok(first.feet.every(p=>Math.abs(p[1]-foot)<.03));
    for(let t=0;t<score.chapters[0].end;t+=1/30) {
      const [x,y,z]=score.sample(t).hero, world=worktopPoint(layout,x,z);
      assert.ok(canOccupy(world.x,world.z,layout.y+y,.36,1.47),site.id);
    }
    stage.dispose();
  }
});

test('the cook plates one blossom mochi and the recipe yields a full batch', t=>{
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const {livingWorld}=createGame().state;
  const draft={...BASIC_RECIPE,shape:'flat',fillings:[{id:'sakura',amount:4,placement:'top'}]};
  const preview=evaluateRecipe(livingWorld,draft,'river');
  assert.ok(preview.ok);
  const before={...livingWorld.inventory};
  const props=createCookingProps(preview.recipe);
  t.after(()=>props.dispose());
  const score=createCookingScore(preview.recipe);
  const serving=props.group.getObjectByName('仕立てる餅');
  assert.ok(serving);
  for(const phase of ['shape','garnish','plate','finish']){
    const chapter=score.chapters.find(c=>c.id===phase);
    const frame=score.sample(chapter.end);
    props.update(frame);
    assert.equal(serving.visible,true,phase);
    assert.deepEqual(serving.position.toArray(),frame.piece.position,phase);
  }
  assert.equal(score.cues.filter(cue=>cue.name==='plate').length,1);
  assert.deepEqual(livingWorld.inventory,before);
  const result=craftRecipe(livingWorld,draft,{regionId:'river'});
  assert.ok(result.ok);
  assert.equal(result.batch.quantity,4);
  assert.equal(livingWorld.inventory.rice,before.rice-100);
  assert.equal(livingWorld.inventory.sakura,before.sakura-4);
});

test('the spent steaming cloth settles against the inside of the empty rice bowl', t=>{
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const props=createCookingProps(BASIC_RECIPE);
  t.after(()=>props.dispose());
  const score=createCookingScore(BASIC_RECIPE);
  const transfer=score.chapters.find(chapter=>chapter.id==='transfer');
  props.update(score.sample(transfer.end));
  props.group.updateMatrixWorld(true);
  const cloth=props.group.getObjectByName('濡らした蒸し布');
  const bowl=props.group.getObjectByName('洗い米の片口鉢');
  const point=new THREE.Vector3(), ray=new THREE.Raycaster();
  ray.ray.direction.set(0,-1,0);
  let smallestGap=Infinity;
  // Sample points from the centre to the pleated hem against the ceramic mesh.
  for(let i=0;i<cloth.geometry.attributes.position.count;i+=7){
    cloth.getVertexPosition(i,point).applyMatrix4(cloth.matrixWorld);
    // The axial vertices coincide at the centre of the lathed foot.
    if(Math.hypot(point.x-bowl.position.x,point.z-bowl.position.z)<.001) continue;
    ray.ray.origin.copy(point);
    ray.ray.origin.y+=.20;
    const [surface]=ray.intersectObject(bowl,false);
    assert.ok(surface,'cloth extends beyond the bowl');
    const gap=point.y-surface.point.y;
    assert.ok(gap>=-.0005,'cloth passes through the ceramic wall');
    smallestGap=Math.min(smallestGap,gap);
  }
  assert.ok(smallestGap<.004,'cloth floats above the bowl');
});

test('regional servings keep their footprint when the cook finishes shaping, garnishing or turning them', t=>{
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  function visibleSize(serving) {
    serving.updateWorldMatrix(true,true);
    const bounds=new THREE.Box3(), point=new THREE.Vector3();
    serving.traverseVisible(part=>{
      if(!part.isMesh) return;
      for(let i=0;i<part.geometry.attributes.position.count;i++){
        part.getVertexPosition(i,point).applyMatrix4(part.matrixWorld);
        bounds.expandByPoint(point);
      }
    });
    return bounds.getSize(new THREE.Vector3());
  }
  for(const {draft,regionId} of STARTER_RECIPES){
    const props=createCookingProps(draft);
    t.after(()=>props.dispose());
    const score=createCookingScore(draft), frame=score.sample(score.duration);
    const serving=props.group.getObjectByName('仕立てる餅');
    const lastTouch=regionId==='market'?{flip:2*Math.PI-.0002}:regionId==='river'?{top:.989}:{shape:.998};
    props.update({...frame,piece:{...frame.piece,...lastTouch}});
    const before=visibleSize(serving);
    props.update(frame);
    const after=visibleSize(serving);
    assert.ok(Math.abs(before.x-after.x)<.002 && Math.abs(before.z-after.z)<.002,regionId);
  }
});

test('the underside of each grilled shape rests against the wooden blade in transit', t=>{
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const down=new THREE.Raycaster(),up=new THREE.Raycaster();
  down.ray.direction.set(0,-1,0);
  up.ray.direction.set(0,1,0);
  for(const shape of Object.keys(CRAFT_OPTIONS.shape)){
    const draft={...BASIC_RECIPE,shape,finish:'grill'};
    const props=createCookingProps(draft),score=createCookingScore(draft);
    t.after(()=>props.dispose());
    const grill=score.chapters.find(c=>c.id==='grill');
    let frame;
    for(let sec=grill.start;sec<grill.end;sec+=1/30){
      const sample=score.sample(sec);
      if(sample.piece.position[0]>.50){
        frame=sample;
        break;
      }
    }
    assert.ok(frame,shape);
    props.update(frame);
    props.group.updateMatrixWorld(true);
    const blade=props.group.getObjectByName('桜材のしゃもじ');
    const cakeMeshes=[];
    props.group.getObjectByName('仕立てる餅').traverseVisible(part=>{
      if(part.isMesh) cakeMeshes.push(part);
    });
    let closest=Infinity;
    for(let ix=-3;ix<=3;ix++)for(let iz=-5;iz<=5;iz++){
      down.ray.origin.set(blade.position.x+ix*.013,blade.position.y+.20,blade.position.z+iz*.013);
      up.ray.origin.set(down.ray.origin.x,blade.position.y-.10,down.ray.origin.z);
      const [wood]=down.intersectObject(blade,false);
      const [rice]=up.intersectObjects(cakeMeshes,false);
      if(wood && rice) closest=Math.min(closest,rice.point.y-wood.point.y);
    }
    assert.ok(Math.abs(closest)<.002,shape+' blade contact gap '+closest);
  }
});
