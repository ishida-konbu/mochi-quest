import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from '../two/vendor/three.module.min.js';
import { GLTFLoader } from '../two/vendor/GLTFLoader.min.js';
import { loadRiceModel, makeRiceModel, poseRice } from '../two/mochi-model.js';
import { createCookingPerformer } from '../two/cooking-performer.js';
import { cookingLayout, createCookingStage } from '../two/cooking-stage.js';
import { createCookingScore } from '../two/cooking-motion.js';
import { createCookingProps } from '../two/cooking-props.js';
import { steamerHandleGeometry } from '../two/cooking-prop-models.js';
import { fitCookingGrip } from '../two/cooking-grip.js';
import { BASIC_RECIPE, CRAFT_OPTIONS, STARTER_RECIPES, craftRecipe, evaluateRecipe } from '../two/living-craft.js';
import { createGame } from '../two/game.js';
import { LIVING_SITES, nearLivingSite } from '../two/living-sites.js';
import { BENCH_YAW, benchPoint, benchLocal, benchFrame, COOKING_BENCH, COOKING_MAT, COOKING_PIVOT, HAND_WATER, MALLET_HANDLE_END, marketCookCanopy, worktopPoint } from '../two/living-layout.js';
import { canOccupy, groundHeight, MARKET_STALLS, terrainHeight, terrainContactHeight } from '../two/terrain.js';
import { MORTAR_PROFILE } from '../two/festival.js';

const workshops=LIVING_SITES.filter(site=>site.kind==='workshop');

function worktopBounds(){
  const {left,right,top,front,back}=COOKING_BENCH;
  return new THREE.Box3().setFromPoints([[left,top-.064,back],[right,top,front]]
    .map(p=>new THREE.Vector3(...benchPoint(p))));
}

async function loadTraveller(t){
  t.mock.method(THREE.TextureLoader.prototype,'loadAsync',async()=>new THREE.Texture());
  t.mock.method(GLTFLoader.prototype,'loadAsync',async function(url){
    const bytes=await readFile(new URL(url));
    return this.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.length),'');
  });
  await loadRiceModel();
}

test('the kagami cook uses its hands for tools while the traveller keeps both gohei',async t=>{
  await loadTraveller(t);
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

test('holding and releasing a tool keeps the actor at its travelling scale',async t=>{
  await loadTraveller(t);
  const actor=createCookingPerformer(new THREE.Group(),{mode:'normal',grounded:true,buffs:{}});
  t.after(()=>actor.dispose());
  const score=createCookingScore(BASIC_RECIPE),stroke=score.sample(score.chapters.find(c=>c.id==='pound').start);
  const pose=actor.group.getObjectByName('mochi');
  for(let tick=0;tick<=40;tick++){
    const time=tick/60,effort=tick<20?1:0;
    actor.update({...stroke,time,effort});
    const breath=1+.006*Math.sin(time*2.24);
    assert.ok(Math.abs(pose.scale.y-breath)<1e-6);
    assert.ok(Math.abs(pose.scale.x*pose.scale.y*pose.scale.z-1)<1e-6);
  }
});

test('the working face uses a single painted expression through a stroke, a blink and the finishing smile',async t=>{
  await loadTraveller(t);
  const actor=createCookingPerformer(new THREE.Group(),{mode:'normal',buffs:{}});
  t.after(()=>actor.dispose());
  const body=actor.group.getObjectByName('Nikkori');
  const shader={uniforms:{},vertexShader:'',fragmentShader:''};
  body.material.onBeforeCompile(shader);
  const score=createCookingScore(BASIC_RECIPE);
  const work=score.chapters.find(c=>c.id==='pound');
  const cells=new Set();
  for(let sec=work.start;sec<work.end;sec+=1/30){
    actor.update(score.sample(sec));
    assert.equal(body.morphTargetInfluences[0],0);
    assert.equal(shader.uniforms.riceSmile.value,0,'open pupils must not mix with the smiling arcs');
    cells.add(shader.uniforms.riceCell.value);
  }
  assert.ok(cells.size>1,'the working face retains its authored blinks');
  actor.update(score.sample(score.duration));
  assert.equal(body.morphTargetInfluences[0],1);
  assert.equal(shader.uniforms.riceSmile.value,1);
});

test('both painted palms meet the opposite rims of the bowl and the gathered cloth while pouring',async t=>{
  await loadTraveller(t);
  for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const actor=createCookingPerformer(new THREE.Group(),{mode,buffs:{full:Number(full)}});
    const layout=cookingLayout(workshops.find(w=>w.id==='river-mortar'));
    const score=createCookingScore(BASIC_RECIPE,layout,{mode,full}),seen=new Set();
    let bowlStance;
    for(const id of ['steam','transfer']){
      const chapter=score.chapters.find(ch=>ch.id===id);
      for(let t=chapter.start;t<chapter.end;t+=1/18){
        const pose=score.sample(t),hands=actor.update(pose),frame=fitCookingGrip(pose,hands);
        if(pose.contact[0]?.tool==='bowl' && pose.contact[1]?.tool==='bowl'){
          const [x,,z]=pose.hero;
          bowlStance??=[x,z];
          assert.ok(Math.hypot(x-bowlStance[0],z-bowlStance[1])<.001,'walked while pouring and returning the rice bowl');
        }
        const name=frame.food.pourRice>.06?'bowl':frame.food.tipRice>.06?'cloth':null;
        if(!name || pose.handWork[0]!==1)continue;
        const tool=frame.tools[name];
        for(const [side,track] of [pose.contact,pose.supportContact].entries()){
          const point=new THREE.Vector3(...track[1].offset);
          if(tool.scale)point.multiply(new THREE.Vector3(...tool.scale));
          point.applyEuler(new THREE.Euler(...tool.rotation)).add(new THREE.Vector3(...tool.position));
          assert.ok(point.distanceTo(new THREE.Vector3(...hands[side]))<.015,mode+' '+name+' rim '+side);
          const local=actor.group.worldToLocal(new THREE.Vector3(...hands[side]));
          assert.ok(local.z>2*Math.abs(local.x),'both palms work in front when pouring');
        }
        seen.add(name);
      }
    }
    assert.equal(seen.size,2);actor.dispose();
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
  const dish=stage.group.localToWorld(new THREE.Vector3(...benchPoint([-.55,.80,.10])));
  const counter=worktopPoint(benchFrame(stage.layout),-.55,.10);
  assert.ok(Math.hypot(counter.x-dish.x,counter.z-dish.z)<1e-7);
  stage.dispose();
  assert.equal(stage.group.parent,null);
  assert.deepEqual(batches.map(m=>m.visible),[true,true,false]);
});

test('the standing spot and its turning circle rest on the woven mat in every kitchen',()=>{
  for(const site of workshops){
    const layout=cookingLayout(site);
    for(const r of [0,.38])for(let n=0;n<12;n++){
      const x=COOKING_PIVOT[0]+r*Math.sin(n*Math.PI/6),z=COOKING_PIVOT[1]+r*Math.cos(n*Math.PI/6);
      const p=worktopPoint(layout,x,z), feet=layout.y+layout.floor(x,z);
      const wovenSurface=terrainContactHeight(p.x,p.z)+COOKING_MAT.thickness;
      assert.ok(Math.abs(feet-wovenSurface)<1e-5,`${site.id}: standing surface at ${x},${z} must be the woven surface`);
      assert.ok(Math.abs(groundHeight(p.x,p.z,feet)-wovenSurface)<1e-5);
      assert.ok(canOccupy(p.x,p.z,feet),site.id);
    }
  }
});

test('each workshop can be entered at the work spot or from the open side of the kitchen',()=>{
  const game=createGame(),player=game.state.player;
  for(const site of workshops){
    const layout=cookingLayout(site);
    for(const point of [site,site.matEntrance]){
      Object.assign(player,{x:point.x,y:point.y,z:point.z});
      assert.ok(canOccupy(player.x,player.z,player.y),site.id);
      assert.equal(game.nearest()?.target.livingSite?.id,site.id);
      assert.ok(game.act('interact'));
      assert.equal(game.state.events.at(-1).siteId,site.id);
    }
    const [u,,v]=benchPoint([0,0,COOKING_BENCH.front-.02]),atCounter=worktopPoint(layout,u,v);
    const tabletop=groundHeight(atCounter.x,atCounter.z,layout.y+COOKING_BENCH.top);
    assert.equal(nearLivingSite({...atCounter,y:tabletop,grounded:true},site),false);
    assert.ok(Math.abs(layout.floor(u,v))<.001,'the turning cook keeps its footing on the mat by the counter');
    const [x,y,z]=layout.groundCookware.mortar;
    const rim={...worktopPoint(layout,x,z),y:layout.y+y+.54,grounded:true};
    assert.equal(nearLivingSite(rim,site),false);
  }
});

test('a traveller saved on a former kitchen tread settles onto the present footing and enters the same workshop',()=>{
  const saved=createGame().save();
  // Standing heights in saves from before the timber steps were removed.
  const oldDecks=[
    ['river-mortar',5.8,64.08,5.123285],
    ['terraces-mortar',150.546049,96.711227,12.068992],
    ['market-mortar',7.600186,-77.840829,5.324062],
  ];
  saved.player.buffs.full=8;
  for(const [id,x,z,y] of oldDecks){
    Object.assign(saved.player,{x,y,z,grounded:true});
    const game=createGame(saved),p=game.state.player;
    assert.ok(game.restored);
    for(let i=0;i<90;i++)game.step(1/60);
    const surface=terrainContactHeight(p.x,p.z)+(id==='market-mortar'?COOKING_MAT.thickness:0);
    assert.ok(p.grounded && Math.abs(p.y-surface)<.005,id);
    // Walk around the short end of the bench, approaching the same
    // standing spot as a new traveller without crossing the fire or the table.
    const kitchen=cookingLayout(workshops.find(site=>site.id===id));
    const outside=[id==='market-mortar'?-1.34:0,3.32];
    for(const [u,v] of [outside,[COOKING_PIVOT[0],outside[1]],COOKING_PIVOT]){
      const mark=worktopPoint(kitchen,u,v);
      for(let n=0;n<130;n++){
        const dx=mark.x-p.x,dz=mark.z-p.z,length=Math.hypot(dx,dz);
        if(length<.10)break;
        game.step(1/60,{x:dx/length,z:dz/length});
      }
      assert.ok(Math.hypot(p.x-mark.x,p.z-mark.z)<.11,id+' open route from the saved spot');
    }
    assert.equal(game.nearest()?.target.livingSite?.id,id);
    assert.ok(game.act('interact'));
    assert.equal(game.state.events.at(-1).siteId,id);
  }
});

test('the hands, current task and face stay framed as the cook turns to each work surface',()=>{
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
        if(frame.phase==='pound' && frame.handWork[0]===1){
          // Both faces of the head and the butt must fit in portrait as well.
          const mallet=frame.tools.mallet,rotation=new THREE.Euler(...mallet.rotation);
          const origin=new THREE.Vector3(...mallet.position);
          for(const p of [[-.167,0,0],[.165,0,0],[0,-.013,MALLET_HANDLE_END]]){
            positions.push(new THREE.Vector3(...p).applyEuler(rotation).add(origin).toArray());
          }
        }
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

test('turning on the open workshop aisle keeps the same side of the camera',()=>{
  for(const site of workshops.filter(site=>site.region!=='market')){
    const stage=createCookingStage(new THREE.Scene(),site);
    const camera=new THREE.PerspectiveCamera(42,1.5,.04,200);
    const score=createCookingScore(BASIC_RECIPE,stage.layout);
    const frame=score.sample(0);
    for(const detail of [false,true]){
      const direction=heading=>{
        stage.positionCamera(camera,{...frame,heading},{detail,cut:true});
        return camera.getWorldDirection(new THREE.Vector3());
      };
      assert.ok(direction(-Math.PI/2).dot(direction(Math.PI/2))>.999);
    }
    stage.dispose();
  }
});

test('the wide view keeps the work spot still when the cook turns between stations',()=>{
  for(const site of workshops){
    const stage=createCookingStage(new THREE.Scene(),site);
    const draft=STARTER_RECIPES.find(recipe=>recipe.regionId===site.region).draft;
    const score=createCookingScore(draft,stage.layout);
    for(const aspect of [390/740,896/530]){
      const camera=new THREE.PerspectiveCamera(42,aspect,.04,200);
      const work=score.chapters.filter(chapter=>chapter.id!=='approach');
      stage.positionCamera(camera,score.sample(work[0].start+.01),{cut:true});
      const eye=camera.position.clone(),direction=camera.getWorldDirection(new THREE.Vector3());
      for(const chapter of work){
        stage.positionCamera(camera,score.sample((chapter.start+chapter.end)/2),{cut:true});
        assert.ok(camera.position.distanceTo(eye)<1e-6,site.id+' '+chapter.id);
        assert.ok(camera.getWorldDirection(new THREE.Vector3()).dot(direction)>.999999);
      }
      const {stove,mortar,bowlRest}=stage.layout.groundCookware;
      const surfaces=[stove,mortar,bowlRest];
      const {left,right,back,front,top}=COOKING_BENCH;
      for(const u of [left,right])for(const v of [back,front])surfaces.push(benchPoint([u,top,v]));
      if(stage.layout.market)surfaces.push(score.sample(score.duration).worktops[1]);
      for(const p of surfaces){
        const point=stage.group.localToWorld(new THREE.Vector3(...p)).project(camera);
        assert.ok(Math.abs(point.x)<1 && Math.abs(point.y)<1 && point.z<1,site.id+' work surface');
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

test('the market close lens follows the carried cake past the posts without jumping to another angle',()=>{
  const site=workshops.find(s=>s.region==='market');
  const stage=createCookingStage(new THREE.Scene(),site);
  const score=createCookingScore(STARTER_RECIPES.find(r=>r.regionId==='market').draft,stage.layout);
  const camera=new THREE.PerspectiveCamera(60,390/740,.04,200);
  const eye=new THREE.Vector3(),rotation=new THREE.Quaternion();
  const from=score.chapters.find(c=>c.id==='grill').start;
  const to=score.chapters.find(c=>c.id==='plate').end;
  stage.positionCamera(camera,score.sample(from),{detail:true,cut:true});
  for(let sec=from+1/60;sec<=to;sec+=1/60){
    eye.copy(camera.position);rotation.copy(camera.quaternion);
    stage.positionCamera(camera,score.sample(sec),{detail:true,dt:1/60});
    assert.ok(rotation.angleTo(camera.quaternion)<.032,'lens jumped around a post at '+sec);
    assert.ok(camera.position.distanceTo(eye)<.21,'lens jumped away from the carried cake at '+sec);
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


test('the market cook faces the lens at each station and the canopy clears the hands and lifted pestle',()=>{
  const stage=createCookingStage(new THREE.Scene(),workshops.find(s=>s.region==='market'));
  const score=createCookingScore(STARTER_RECIPES.find(r=>r.regionId==='market').draft,stage.layout);
  const {lift,postX,frontPostZ,backPostZ}=marketCookCanopy;
  const workingShots=score.chapters.filter(c=>['steam','pound','grill','plate','shape'].includes(c.id))
    .map(c=>c.start+(c.end-c.start)*.56);
  // Trace in the awning's own frame. At this shop the cook faces the
  // street and the bench turns back toward the displays.
  const [sx,sz,syaw]=MARKET_STALLS[4];
  const stall=new THREE.Matrix4().makeRotationY(syaw).setPosition(sx,terrainHeight(sx,sz),sz);
  const kitchenToStall=stall.invert().multiply(stage.group.matrixWorld);
  const box=(x,y,z,rx,ry,rz)=>new THREE.Box3(new THREE.Vector3(x-rx,y-ry,z-rz),new THREE.Vector3(x+rx,y+ry,z+rz));
  const screens=[box(0,2.3+lift,1.16,1.63,.18,.0185),
    box(postX-.065,1.89+lift,1.28,.18,.24,.025)];
  for(const x of [-postX,postX]) for(const z of [backPostZ,frontPostZ]){
    const height=lift+(z===backPostZ?3.28:2.86);
    screens.push(box(x,height/2,z,.059,height/2,.059));
  }
  const ray=new THREE.Ray(),end=new THREE.Vector3(),hit=new THREE.Vector3();
  for(const aspect of [390/740,896/530]) for(const [detail,reducedMotion] of [[false,false],[true,false],[false,true]]) {
    const camera=new THREE.PerspectiveCamera(60,aspect,.04,200);
    for(let sec=0;sec<score.duration;sec+=.125){
      const frame=score.sample(sec);
      stage.positionCamera(camera,frame,{detail,reducedMotion,dt:.125});
      ray.origin.copy(camera.position);stage.group.worldToLocal(ray.origin);
      const working=workingShots.some(time=>Math.abs(sec-time)<=.0625);
      if(reducedMotion && !working)continue;
      if(working){
        const [x,,z]=frame.hero;
        const front=(ray.origin.x-x)*Math.sin(frame.heading)+(ray.origin.z-z)*Math.cos(frame.heading);
        assert.ok(front>0,`the cook's back hides the ${frame.phase} work in the ${detail?'close':'wide'} view`);
      }
      const points=[frame.focus,...frame.hands];
      if(frame.phase==='pound')points.push(frame.tools.mallet.position);
      if(frame.phase==='shape'){
        const [x,y,z]=frame.hero,theta=frame.heading,radius=frame.bodyRadius;
        for(const side of [-.25,0,.25]){
          points.push([x+radius*(.65*Math.sin(theta)+side*Math.cos(theta)),y+frame.bodyHeight*.57,
            z+radius*(.65*Math.cos(theta)-side*Math.sin(theta))]);
        }
      }
      ray.origin.applyMatrix4(kitchenToStall);
      for(const p of points){
        end.fromArray(p).applyMatrix4(kitchenToStall);ray.direction.subVectors(end,ray.origin).normalize();
        for(const screen of screens){
          assert.ok(!ray.intersectBox(screen,hit)||ray.origin.distanceTo(hit)>=ray.origin.distanceTo(end),
            [frame.phase,sec,aspect,detail,p].join(' '));
        }
      }
    }
  }
  stage.dispose();
});


test('the cook approaches the turning spot over open ground from the kitchen entrances and their outer edges',()=>{
  for(const site of workshops) {
    const stage=createCookingStage(new THREE.Scene(),site);
    const {layout}=stage, recipe=STARTER_RECIPES.find(r=>r.regionId===site.region).draft;
    const top=worktopPoint(benchFrame(layout),-.59,0);
    assert.equal(nearLivingSite({...top,y:layout.y+1.30,grounded:true},site),false);
    // The outer left edge approaches the rice tub. At the market the
    // visitor can also start near the street end of the charcoal hearth.
    const edges=[[-4.50,1.32],[-3.06,1.00],[-2.58,3.24]].map(([u,v])=>{
      const p=worktopPoint(layout,u,v);
      return {...p,y:terrainContactHeight(p.x,p.z)};
    });
    for(const entry of [site,site.matEntrance,...edges])for(const full of [false,true]){
      const dx=entry.x-layout.x,dz=entry.z-layout.z,c=Math.cos(layout.yaw),s=Math.sin(layout.yaw);
      const u=dx*c-dz*s,v=dx*s+dz*c,foot=layout.floor(u,v);
      assert.equal(nearLivingSite({...entry,grounded:true},site),true);
      const score=createCookingScore(recipe,layout,{start:[u,foot,v],heading:Math.PI,full});
      const first=score.sample(0);
      assert.ok(Math.hypot(first.hero[0]-u,first.hero[2]-v)<1e-6,site.id+' start at the actual visitor');
      assert.ok(first.feet.every(p=>Math.abs(p[1]-foot)<.03));
      for(let t=0;t<=score.chapters[0].end;t+=1/30){
        const [x,y,z]=score.sample(t).hero,world=worktopPoint(layout,x,z);
        assert.ok(canOccupy(world.x,world.z,layout.y+y,.36,1.47),site.id);
      }
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

test('the vessel rests directly on the worktop where the two palms release the serving',async t=>{
  await loadTraveller(t);
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  for(const site of workshops)for(const mode of ['normal','kagami'])for(const full of [0,1]){
    const layout=cookingLayout(site), score=createCookingScore(BASIC_RECIPE,layout,{mode,full});
    const props=createCookingProps(BASIC_RECIPE,score.cookware);
    const actor=createCookingPerformer(new THREE.Group(),{mode,buffs:{full}});
    const tray=props.group.children.find(part=>part.userData.floor);
    const dish=new THREE.Box3().setFromObject(tray,true);
    const location=worktopPoint(layout,tray.position.x,tray.position.z);
    const surface=groundHeight(location.x,location.z,layout.y+dish.min.y+.03)-layout.y;
    assert.ok(Math.abs(surface-dish.min.y)<.004,'the foot of the vessel must meet the actual wooden counter');
    assert.equal(props.group.getObjectByName('盛り付けの脚付き膳'),undefined);
    const plate=score.chapters.find(ch=>ch.id==='plate'),finish=score.sample(plate.end);
    assert.ok(Math.hypot(finish.piece.position[0]-tray.position.x,finish.piece.position[2]-tray.position.z)<.008,
      'the hands release over the centre of the actual receiving dish');
    let release;
    for(let t=plate.start-.60;t<plate.end;t+=1/60){
      const frame=score.sample(t),hands=actor.update(frame);
      if(frame.phase!=='plate' || !frame.contact[0]?.piece || !frame.contact[1]?.piece)continue;
      const carried=fitCookingGrip(frame,hands),cake=new THREE.Vector3(...carried.piece.position);
      for(const [i,pad] of hands.entries()){
        const mark=new THREE.Vector3(i?-.072:.072,.033,.015).applyEuler(new THREE.Euler(...carried.piece.rotation)).add(cake);
        assert.ok(mark.distanceTo(new THREE.Vector3(...pad))<.035,'cake separated from a carrying palm at '+[site.id,mode,full,t,i,mark.distanceTo(new THREE.Vector3(...pad))]);
      }
      release=cake;
    }
    assert.ok(release.distanceTo(new THREE.Vector3(...finish.piece.position))<.006,'palms released the cake above the dish');
    props.dispose();actor.dispose();
  }
});

test('the rendered soles follow the entry footfalls and turn within one footprint at every kitchen surface',async t=>{
  await loadTraveller(t);
  const group=new THREE.Group(),point=new THREE.Vector3(),sole=new THREE.Vector3(),mark=new THREE.Vector3();
  for(const full of [false,true]){
    const actor=createCookingPerformer(group,{mode:'normal',buffs:{full:Number(full)}});
    const site=workshops.find(w=>w.region==='market');
    const draft=STARTER_RECIPES.find(r=>r.regionId==='market').draft;
    const score=createCookingScore(draft,cookingLayout(site),{full});
    const arrived=score.chapters.find(ch=>ch.id==='steam').start;
    const [cx,,cz]=score.sample(arrived).hero;
    const radius=.31*(full?1.28:1);
    const body=actor.group.getObjectByName('Nikkori');
    const {skinIndex,skinWeight,position}=body.geometry.attributes;
    const soles=['Foot_R','Foot_L'].map(name=>{
      const joint=body.skeleton.bones.findIndex(b=>b.name===name);
      const pad=Array.from({length:position.count},(_,i)=>i)
        .filter(i=>skinIndex.getX(i)===joint && skinWeight.getX(i)>.72);
      return pad.sort((a,b)=>position.getY(a)-position.getY(b)).slice(0,8);
    });
    for(let sec=0;sec<=score.duration;sec+=1/24){
      const f=score.sample(sec);
      actor.update(f);
      for(const [i,pad] of soles.entries()){
        sole.set(0,0,0);
        for(const id of pad)sole.add(body.localToWorld(body.getVertexPosition(id,point)));
        assert.ok(sole.divideScalar(pad.length).distanceTo(mark.fromArray(f.feet[i]))<.004,
          'foot slid away from its mark at '+sec);
        if(sec>=arrived){
          assert.ok(Math.hypot(sole.x-cx,sole.z-cz)<radius,
            'left the pivot footprint at '+f.phase+' '+sec.toFixed(2));
        }
      }
    }
    actor.dispose();
  }
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
      if(benchLocal(sample.piece.position)[0]>.50){
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

test('both mitts hold the grounded mortar’s pestle clear of the face and the mortar rim',async t=>{
  await loadTraveller(t);
  const v=new THREE.Vector3(),rotation=new THREE.Euler(),line=new THREE.Raycaster();
  const timber=worktopBounds().expandByScalar(-.003);
  for(const [site,full] of [['market-mortar',false],['river-mortar',true]]){
    const root=new THREE.Group(),actor=createCookingPerformer(root,{mode:'normal',grounded:true,buffs:{full:Number(full)}});
    const layout=cookingLayout(workshops.find(w=>w.id===site));
    const score=createCookingScore(BASIC_RECIPE,layout,{full});
    const [mx,my,mz]=layout.groundCookware.mortar;
    const outer=MORTAR_PROFILE.slice(0,MORTAR_PROFILE.findIndex((p,i,arr)=>i && p[1]<arr[i-1][1]));
    function mortarRadius(y){
      const h=(y-my)/.72;
      const i=outer.findIndex(p=>p[1]>=h);
      if(i<1)return 0;
      const [r0,h0]=outer[i-1],[r1,h1]=outer[i];
      return .72*THREE.MathUtils.lerp(r0,r1,(h-h0)/(h1-h0));
    }
    const pound=score.chapters.find(c=>c.id==='pound');
    const body=actor.group.getObjectByName('Nikkori');
    const {skinIndex,skinWeight}=body.geometry.attributes;
    const handBones=['Hand_R','Hand_L'].map(name=>body.skeleton.bones.findIndex(b=>b.name===name));
    assert.ok(handBones.every(id=>id>=0));
    const palms=handBones.map(()=>new Set());
    for(let i=0;i<skinIndex.count;i++){
      // Test the travelling mitts, including the edges shared with the cheeks.
      for(let slot=0;slot<4;slot++){
        const side=handBones.indexOf(skinIndex.getComponent(i,slot));
        if(side>=0 && skinWeight.getComponent(i,slot)>.25)palms[side].add(i);
      }
    }
    assert.ok(palms.every(palm=>palm.size>0));
    for(let t=pound.start;t<pound.end;t+=1/20){
      const pose=score.sample(t),frame=fitCookingGrip(pose,actor.update(pose));
      root.updateMatrixWorld(true);
      for(const palm of palms)for(const i of palm){
        body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld);
        assert.ok(Math.hypot(v.x-mx,v.z-mz)>=mortarRadius(v.y)-.002,'hand inside the mortar at '+[site,full,t.toFixed(2),v.x-mx,v.y-my,v.z-mz]);
        assert.ok(!timber.containsPoint(v),'hand through the counter at '+t);
      }
      const tool=frame.tools.mallet;rotation.set(...tool.rotation);
      line.ray.direction.set(0,0,1).applyEuler(rotation);
      line.far=MALLET_HANDLE_END;line.near=.01;
      for(const offset of [-.024,.024]){
        line.ray.origin.set(offset,-.013,0).applyEuler(rotation).add(v.fromArray(tool.position));
        // The two short mitts surround the shaft. Their cheeks stay clear.
        for(const hit of line.intersectObject(body,false)){
          assert.ok(hit.faceIndex*3>=body.geometry.userData.torsoIndexCount,'shaft through the face or chest at '+[site,t,hit.point.toArray()]);
        }
      }
    }
    actor.dispose();
  }
});

test('the two drawn palms lift the pestle together and its end meets the deformed rice in all three kitchens',async t=>{
  await loadTraveller(t);
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const fromAbove=new THREE.Raycaster();fromAbove.ray.direction.set(0,-1,0);
  for(const site of workshops)for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const actor=createCookingPerformer(new THREE.Group(),{mode,buffs:{full:Number(full)}});
    const score=createCookingScore(BASIC_RECIPE,cookingLayout(site),{mode,full});
    const props=createCookingProps(BASIC_RECIPE,score.cookware);
    const rice=props.group.getObjectByName('臼の餅生地');
    for(const cue of score.cues.filter(c=>c.name==='pound')){
      let high=-Infinity;
      for(let step=0;step<=30;step++){
        const f=score.sample(cue.time-(30-step)/60),hands=actor.update(f);
        const drawn=fitCookingGrip(f,hands),rotation=new THREE.Euler(...drawn.tools.mallet.rotation);
        const onMallet=local=>new THREE.Vector3(...local).applyEuler(rotation).add(new THREE.Vector3(...drawn.tools.mallet.position));
        for(const [i,grip] of [f.contact[1],f.supportContact[1]].entries()){
          assert.equal(grip.tool,'mallet');
          const gap=onMallet(grip.offset).distanceTo(new THREE.Vector3(...hands[i]));
          assert.ok(gap<.055,site.id+' '+mode+' hand '+i+' missed its grip by '+gap);
        }
        const end=onMallet([.165,0,0]);high=Math.max(high,end.y);
        if(step<30)continue;
        props.update(drawn);props.group.updateMatrixWorld(true);
        fromAbove.ray.origin.copy(end);fromAbove.ray.origin.y+=.20;
        const [surface]=fromAbove.intersectObject(rice,false);
        assert.ok(surface && Math.abs(surface.point.y-end.y)<.008,'striking face must meet the visible rice');
        assert.ok(high-end.y>.24,'the lifted end must clear the rim before the next stroke');
      }
    }
    props.dispose();actor.dispose();
  }
});

test('both round mitts cup and fold the cake in front of the cook in all three workshops',async t=>{
  await loadTraveller(t);
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  for(const site of workshops)for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const root=new THREE.Group(),actor=createCookingPerformer(root,{mode,buffs:{full:Number(full)}});
    const layout=cookingLayout(site),score=createCookingScore(BASIC_RECIPE,layout,{mode,full});
    const props=createCookingProps(BASIC_RECIPE,score.cookware),board=props.group.getObjectByName('俎板');
    const body=actor.group.getObjectByName('Nikkori'),g=body.geometry,p=new THREE.Vector3();
    const torsoVertices=new Set(g.index.array.subarray(0,g.userData.torsoIndexCount));
    const timber=worktopBounds().expandByScalar(-.004);
    const chapter=score.chapters.find(c=>c.id==='shape');
    for(let time=chapter.start;time<chapter.end;time+=.04){
      const pose=score.sample(time),actual=actor.update(pose);
      for(const i of torsoVertices){
        body.getVertexPosition(i,p).applyMatrix4(body.matrixWorld);
        assert.ok(!timber.containsPoint(p),site.id+' '+mode+' belly passed through the worktop');
      }
      if(!pose.contact[0]?.piece || !pose.contact[1]?.piece)continue;
      const distance=new THREE.Vector3(...actual[0]).distanceTo(new THREE.Vector3(...pose.hands[0]));
      assert.ok(distance<.060,site.id+' '+mode+' full='+full+' shaping gap '+distance);
      assert.ok(Math.cos(pose.heading-(Math.PI+BENCH_YAW))>.99,'cook turned away from the front of the board');
      if(pose.handWork[1]>.99){
        const left=new THREE.Vector3(...actual[1]);
        assert.ok(left.distanceTo(new THREE.Vector3(...pose.hands[1]))<.04,'supporting hand lost the cake');
        for(const point of actual){
          const pad=actor.group.worldToLocal(new THREE.Vector3(...point));
          assert.ok(pad.z>Math.abs(pad.x)*2,'the actual mitt must be in front of the belly');
        }
      }
    }
    const settled=score.sample(chapter.end-.01);
    const wood=new THREE.Box3().setFromObject(board,true);
    const cake=new THREE.Vector3(...settled.piece.position);
    const press=new THREE.Raycaster(cake.clone().add(new THREE.Vector3(0,.20,0)),new THREE.Vector3(0,-1,0));
    const face=press.intersectObject(board,false)[0];
    assert.ok(face && Math.abs(cake.y-face.point.y)<.004,'the cake sits on the painted top');
    assert.ok(wood.max.y-wood.min.y<.045,'the chopping board is a single flat plank for every body size');
    for(const x of [wood.min.x+.015,wood.max.x-.015])for(const z of [wood.min.z+.015,wood.max.z-.015]){
      const p=worktopPoint(layout,x,z);
      const surface=groundHeight(p.x,p.z,layout.y+wood.min.y+.04)-layout.y;
      assert.ok(Math.abs(surface-wood.min.y)<.004,'all four corners must rest directly on the worktop');
    }
    actor.dispose();props.dispose();
  }
});

test('the cook reaches to the filling dish and folds back over the board from the same footprints',async t=>{
  await loadTraveller(t);
  const recipe=STARTER_RECIPES.find(recipe=>recipe.regionId==='river').draft;
  for(const site of workshops)for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const actor=createCookingPerformer(new THREE.Group(),{mode,buffs:{full:Number(full)}});
    const score=createCookingScore(recipe,cookingLayout(site),{mode,full});
    const chapter=score.chapters.find(ch=>ch.id==='shape');
    const body=actor.group.getObjectByName('Nikkori'),collars=body.geometry.userData.wristCollars;
    const p=new THREE.Vector3();
    let far,fold;
    for(let t=chapter.start;t<chapter.end;t+=1/60){
      const frame=score.sample(t),hands=actor.update(frame);
      if(!frame.handWork.every(w=>w===1))continue;
      const z=benchLocal(frame.hands[0])[2],isFarthest=!far || z<far.z;
      if(!isFarthest && frame.piece.shape<=.8)continue;
      const pose={z,feet:frame.feet,face:benchLocal(actor.facePoint(p).toArray())[2],
        shoulders:collars.map(ids=>ids.reduce((sum,id)=>
          sum+benchLocal(body.getVertexPosition(id,p).applyMatrix4(body.matrixWorld).toArray())[2],0)/ids.length),
        gaps:hands.map((p,i)=>new THREE.Vector3(...p).distanceTo(new THREE.Vector3(...frame.hands[i])))};
      if(isFarthest)far=pose;
      else fold=pose;
    }
    assert.ok(far && fold);
    const reach=fold.z-far.z;
    assert.ok(reach>.19 && fold.face-far.face>reach*.80,'face follows the ingredient reach');
    assert.ok(fold.shoulders.every((z,i)=>z-far.shoulders[i]>reach*.65),'both shoulders go to the dish');
    assert.deepEqual(far.feet,fold.feet);
    assert.ok([...far.gaps,...fold.gaps].every(d=>d<.035),'both inner pads reach their marks');
    actor.dispose();
  }
});

test('feet, dough and both mitts clear the counter, vessels and parked lid throughout the kitchen route',async t=>{
  await loadTraveller(t);
  const B=COOKING_BENCH,p=new THREE.Vector3(),timber=worktopBounds().expandByScalar(-.003);
  const lidCenter=new THREE.Vector3(),lidPoint=new THREE.Vector3(),lidRotation=new THREE.Euler(),toLid=new THREE.Quaternion();
  // A point inside the hollow of the mortar can touch food. The wood itself
  // is the annulus between the outside and inside of its turned profile.
  function inMortar(point,origin){
    const y=(point.y-origin[1])/.72,r=Math.hypot(point.x-origin[0],point.z-origin[2])/.72;
    if(y<=.015 || y>=.754 || r>=.504)return false;
    const edges=[];
    for(let i=1;i<MORTAR_PROFILE.length;i++){
      const [ra,ya]=MORTAR_PROFILE[i-1],[rb,yb]=MORTAR_PROFILE[i];
      if((y<ya)!==(y<yb))edges.push(ra+(rb-ra)*(y-ya)/(yb-ya));
    }
    const outer=Math.max(...edges),inside=edges.length===1?0:Math.min(...edges);
    return r>inside+.004 && r<outer-.004;
  }
  for(const site of workshops)for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const layout=cookingLayout(site),regional=STARTER_RECIPES.find(r=>r.regionId===site.region).draft;
    const draft=site.region==='market'?{...regional,technique:'wrap',fillings:[
      {id:'azuki',placement:'inside',amount:14},{id:'sakura',placement:'mixed',amount:4}]}:
      site.region==='terraces' && full?BASIC_RECIPE:regional;
    const score=createCookingScore(draft,layout,{mode,full});
    const actor=createCookingPerformer(new THREE.Group(),{mode,buffs:{full:Number(full)}});
    actor.update(score.sample(0));
    const skin=actor.group.getObjectByName('Nikkori');
    const meshes=[skin];
    if(mode==='kagami')meshes.push(actor.group.getObjectByName('鏡餅・福重ね').children[0]);
    const surfaces=meshes.map(mesh=>[mesh,new Set(mesh.geometry.index.array)]);
    const {mortar,stove,bowlRest:pot}=score.cookware,water=benchPoint(HAND_WATER);
    for(let sec=0;sec<=score.duration;sec+=.18){
      const f=score.sample(sec);
      actor.update(f);
      const lid=f.tools.lid;
      lidCenter.fromArray(lid.position);
      toLid.setFromEuler(lidRotation.set(...lid.rotation)).invert();
      const resting=!f.contact.some(grip=>grip?.tool==='lid');
      const label=site.id+' '+mode+'/'+full+' '+f.phase+' '+sec.toFixed(2);
      for(const [mesh,ids] of surfaces)for(const id of ids){
        mesh.getVertexPosition(id,p).applyMatrix4(mesh.matrixWorld);
        const {x,y,z}=p;
        if(resting && p.distanceToSquared(lidCenter)<.272**2){
          lidPoint.copy(p).sub(lidCenter).applyQuaternion(toLid);
          assert.ok(lidPoint.y<=-.013 || lidPoint.y>=.015 || Math.hypot(lidPoint.x,lidPoint.z)>=.271,
            'through the resting steamer lid at '+label);
        }
        if(mesh!==skin && y>stove[1]+.26 && y<stove[1]+.39){
          assert.ok(Math.hypot(x-stove[0],z-stove[2])>.250,'lower tier through steamer at '+label);
        }
        if(y>water[1]+.128 && y<water[1]+.136){
          const radius=Math.hypot(x-water[0],z-water[2]);
          assert.ok(radius<.160 || radius>.169,'through the rim of the water pot at '+label);
        }
        if(y>B.top+.03 && y>mortar[1]+.55 && y>pot[1])continue;
        assert.ok(!timber.containsPoint(p),'through the worktop at '+label);
        assert.ok(y>=pot[1]-.003 || y<=pot[1]-.417 || Math.hypot(x-pot[0],z-pot[2])>=.166,
          'through the wooden rice tub at '+label);
        assert.ok(!inMortar(p,mortar),'through the mortar wall at '+label);
      }
    }
    actor.dispose();
  }
});

test('the cook lifts, parks and replaces the lid by the middle of its original slim wooden grip with planted feet',async t=>{
  await loadTraveller(t);
  t.mock.method(THREE.TextureLoader.prototype,'load',()=>new THREE.Texture());
  const props=createCookingProps(BASIC_RECIPE);
  t.after(()=>props.dispose());
  const lid=props.group.getObjectByName('蒸籠の板蓋'),cloth=props.group.getObjectByName('濡らした蒸し布');
  const clothVertices=new Set(cloth.geometry.index.array);
  const handle=steamerHandleGeometry(),profile=handle.parameters.points;
  handle.computeBoundingBox();
  const box=handle.boundingBox,handleY=(box.max.y+box.min.y)/2;
  assert.ok(Math.abs(box.max.z-.090)<.001 && Math.abs(box.min.z+.090)<.001);
  assert.ok(box.max.x-box.min.x<.043 && box.max.x-box.min.x>.039 && box.max.y<.052);
  const middle=profile.find(p=>p.y===0);
  function woodDepth(point){
    if(point.z<=profile[0].y || point.z>=profile.at(-1).y)return -Infinity;
    const hi=profile.findIndex(p=>p.y>=point.z),a=profile[hi-1],b=profile[hi];
    const radius=a.x+(b.x-a.x)*(point.z-a.y)/(b.y-a.y);
    return radius-Math.hypot(point.x,point.y-handleY);
  }
  handle.dispose();
  const vertices=lid.geometry.attributes.position;
  for(let i=0;i<vertices.count;i++)if(vertices.getY(i)>.020){
    assert.ok(Math.abs(vertices.getX(i))<.022 && Math.abs(vertices.getZ(i))<.092,
      'the joinery fits along the centre plank');
  }
  const turn=new THREE.Euler(),inverse=new THREE.Quaternion(),point=new THREE.Vector3(),hand=new THREE.Vector3();
  const disc=[];
  for(const radius of [0,.065,.13,.195,.248,.27])for(let i=0;i<(radius===0?1:36);i++){
    const a=2*Math.PI*i/36;
    disc.push(new THREE.Vector3(radius*Math.cos(a),-.012,radius*Math.sin(a)));
  }
  for(const site of workshops)for(const mode of ['normal','kagami'])for(const full of [false,true]){
    const actor=createCookingPerformer(new THREE.Group(),{mode,buffs:{full:Number(full)}});
    const score=createCookingScore(BASIC_RECIPE,cookingLayout(site),{mode,full});
    const body=actor.group.getObjectByName('Nikkori'),g=body.geometry;
    const leftJoint=body.skeleton.bones.findIndex(b=>b.name==='Hand_L');
    const mitts=[...new Set(g.index.array.subarray(g.userData.torsoIndexCount))];
    const [sx,sy,sz]=score.cookware.stove;
    const turns=score.cues.filter(c=>c.name==='lid');
    assert.equal(turns.length,3);
    const upright=[false,false,false],flat=[false,false,false],footmarks=[];
    for(const ch of score.chapters.filter(c=>c.id==='steam'||c.id==='transfer')){
      for(let sec=ch.start;sec<ch.end;sec+=1/25){
        const f=score.sample(sec),pads=actor.update(f),pose=fitCookingGrip(f,pads).tools.lid;
        const center=new THREE.Vector3(...pose.position);
        turn.set(...pose.rotation);
        for(const p of disc){
          point.copy(p).applyEuler(turn).add(center);
          assert.ok(point.y>sy+.398 || Math.hypot(point.x-sx,point.z-sz)>.258,
            mode+' lid inside the steamer at '+sec.toFixed(2));
        }
        const [from,to]=f.contact;
        inverse.setFromEuler(turn).invert();
        if(from?.tool==='cloth' || to?.tool==='cloth'){
          // The cook reaches past the upright lid to lift the wet linen.
          // Both its folded corner and the full mitts must clear the disk.
          const clear=()=>point.y<=-.013 || point.y>=.015 || Math.hypot(point.x,point.z)>=.271;
          props.update(fitCookingGrip(f,pads));
          cloth.updateMatrixWorld(true);
          for(const id of clothVertices){
            cloth.getVertexPosition(id,point).applyMatrix4(cloth.matrixWorld).sub(center).applyQuaternion(inverse);
            assert.ok(clear(),'linen passes through the parked lid');
          }
          for(const id of mitts){
            body.getVertexPosition(id,point).applyMatrix4(body.matrixWorld).sub(center).applyQuaternion(inverse);
            assert.ok(clear(),site.region+' '+mode+' '+full+' palm reaches through parked lid for the linen');
          }
        }
        if(from?.tool!=='lid' && to?.tool!=='lid')continue;
        // Both full mitts clear the disc, including reaching and letting go.
        for(const id of mitts){
          body.getVertexPosition(id,point).applyMatrix4(body.matrixWorld).sub(center).applyQuaternion(inverse);
          assert.ok(point.y>=.015 || point.y<=-.013 || Math.hypot(point.x,point.z)>=.271,
            site.region+' '+mode+' '+full+' palm cuts the lid at '+sec.toFixed(2));
          const allowance=g.attributes.skinIndex.getX(id)===leftJoint?0:.0025;
          const depth=woodDepth(point);
          assert.ok(depth<=allowance,site.region+' '+mode+' '+full+' palm inside centre grip at '+sec.toFixed(2)+' by '+depth);
        }
        if(from?.tool!=='lid' || to?.tool!=='lid')continue;
        const pass=ch.id==='transfer'?2:sec<turns[0].time?0:1;
        assert.equal(f.handWork[1],0);
        point.set(0,1,0).applyEuler(turn);
        upright[pass] ||= point.y<.16 && point.z>.80;
        flat[pass] ||= point.y>.999;
        footmarks[pass]??=f.feet;
        assert.deepEqual(f.feet,footmarks[pass],'both feet stay put for the whole lift');
        hand.fromArray(pads[0]).sub(center).applyQuaternion(inverse);
        assert.ok(Math.abs(hand.z)<.004 && Math.abs(Math.hypot(hand.x,hand.y-handleY)-middle.x)<.0025,
          site.region+' '+mode+' '+full+' palm missed the middle of the narrow timber at '+sec.toFixed(2));
        if(point.y<.16)assert.ok(Math.abs(point.set(0,0,1).applyEuler(turn).y)>.98,'the parked grip runs vertically');
      }
    }
    assert.deepEqual(upright,[true,true,true]);
    assert.deepEqual(flat,[true,true,true]);
    actor.dispose();
  }
});
