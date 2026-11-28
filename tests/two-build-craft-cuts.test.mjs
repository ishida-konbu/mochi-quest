import test from 'node:test';
import assert from 'node:assert/strict';
import { createCookingPerformer } from '../two/cooking-performer.js';
import { BUILD_MODULES } from '../two/living-build-state.js';
import { constructionCuts,craftMotion,findWorkBench,BENCH_LEGS,PLANING_BOARD,PLANE_HALF_WIDTH,JOINT,benchHeight,benchPoint } from '../two/build-craft-motion.js';
import {makeCraftBay} from '../two/build-craft-art.js';
import { visibleWorkArea } from '../two/build-craft-scene.js';
import { composeCraftLens,craftShotOrder,craftShotSeed } from '../two/build-craft-lenses.js';
import { makeJoinerySite } from '../two/build-craft-site.js';
import { PerspectiveCamera,Vector3,Euler,Group,Mesh,Scene,SphereGeometry,MeshBasicMaterial,InstancedMesh,Matrix4,Raycaster,Ray } from '../two/vendor/three.module.min.js';
import { terrainContactHeight,groundHeight } from '../two/terrain.js';

const player={x:25,y:0,z:92,heading:Math.PI,buffs:{}};
const detail={x:0,z:0,y:0,yaw:0,detail:true,feet:[0,0],legs:[0,0,0,0]};
const site={x:23,z:88,y:terrainContactHeight(23,88),kind:'hut',terrain:'plain',foundationWood:0};
const near=(a,b)=>Math.abs(a-b)<.0001;
test('each building has one to three short joinery shots; a paid pier is shown at ground level',()=>{
  for(const kind of Object.keys(BUILD_MODULES)){
    for(const wood of [0,4]){
      const s={...site,kind,foundationWood:wood};
      const cuts=constructionCuts(s),plan=craftMotion(s,player,detail);
      assert.ok(cuts.length>=1 && cuts.length<=3);
      assert.ok(plan.duration<=13.5);
      let t=0;
      for(let i=0;i<cuts.length;i++){
        if(i>0){assert.equal(plan.sample(t-.001).cutOpacity,1);assert.equal(plan.sample(t+.001).cutOpacity,1);}
        assert.equal(plan.sample(t+.70).label,cuts[i].label);
        t+=cuts[i].duration;
      }
      if(wood)assert.match(cuts[0].label,/束柱/);
    }
  }
  const indoors=constructionCuts({...site,kind:'camp',parentId:'build-2'});
  assert.deepEqual(indoors.map(c=>c.label),['寝台の横竹を挽く']);
  const p=findWorkBench(site,player);
  assert.equal(p.detail,false);
  assert.ok(p.feet.every(Number.isFinite));
  for(const [i,leg] of BENCH_LEGS.entries()){
    const [x,z]=benchPoint(p,...leg);
    assert.ok(near(p.y+p.legs[i],groundHeight(x,z,terrainContactHeight(x,z)+.20)));
  }
  for(const full of [false,true]){
    const visitor={...player,buffs:{full:Number(full)}},bench=findWorkBench(site,visitor);
    const frame=craftMotion(site,visitor,bench).sample(1);
    for(const [x,y,z] of frame.feet){
      const [wx,wz]=benchPoint(bench,x,z);
      assert.ok(near(bench.y+y,groundHeight(wx,wz,terrainContactHeight(wx,wz)+.20)));
    }
  }
  assert.equal(findWorkBench(site,player,()=>false).detail,true);
});
test('the pull saw reaches the offcut before it drops, the plane lifts on return, and each timber pin sinks on impact',()=>{
  const motion=craftMotion(site,player,detail),[s,p,m]=motion.cuts;
  const at=(start,shot,phase)=>motion.sample(start+shot.duration*(.17+.65*phase));
  const mid=at(0,s,.55);
  assert.ok(mid.hands.every(h=>h[2]>mid.position[2]+.34 && h[2]<mid.position[2]+.49));assert.equal(mid.fall,0);
  assert.ok(mid.position[0]>.318 && mid.position[0]<.322);
  // Measure the depth of the teeth at the cut, including the camber of the blade.
  const sawDepth=phase=>{
    const f=at(0,s,phase);
    const toothOffset=.042+.052*Math.sin(f.position[2]/.91*Math.PI*.69);
    return f.workTop-(f.position[1]-toothOffset);
  };
  for(let stroke=0;stroke<3;stroke++){
    const depth=u=>sawDepth((stroke+u)/3);
    assert.ok(depth(.5)-depth(0)>.047);
    for(const u of [.60,.72,.84,.96,1])assert.ok(near(depth(u),depth(.5)));
  }
  assert.equal(at(0,s,5/6-.001).fall,0);
  const falling=at(0,s,5/6+.015).fall;
  assert.ok(falling>0 && falling<1);
  assert.equal(at(0,s,5/6+.040).fall,1);
  const planeAt=q=>motion.sample(s.duration+p.duration*q);
  assert.equal(planeAt(.85).shed,1);
  for(const [far,set,draw] of [[.305,.35,.43],[.688,.738,.82]]){
    const sent=planeAt(far),level=planeAt(set),pull=planeAt(draw);
    assert.ok(near(sent.position[2],level.position[2]) && sent.position[1]>level.position[1]+.04);
    assert.ok(level.weightShift[1]>sent.weightShift[1]+.02,'weight catches up after the plane reaches the far end');
    assert.ok(sent.rotation[0]<-.15 && near(level.rotation[0],0));
    assert.ok(near(pull.position[1],pull.workTop) && pull.position[2]>level.position[2]);
    assert.ok(sent.palms[0].curl[2]<-.70 && pull.palms[0].curl[2]>.70);
    assert.ok(pull.palms[0].pressure>sent.palms[0].pressure+.30);
    for(const f of [sent,level,pull]){
      assert.ok(f.handWork.every(w=>w===1) && f.socketTurn.every(turn=>turn>.60));
      for(const [i,x] of [PLANE_HALF_WIDTH-.003,.003-PLANE_HALF_WIDTH].entries()){
        const actual=new Vector3(x,.044,i?.156:.152).applyEuler(new Euler(...f.rotation)).add(new Vector3(...f.position));
        assert.ok(actual.distanceTo(new Vector3(...f.hands[i]))<1e-7,'palm left the side of the tilted wooden block');
      }
      assert.ok(f.position[2]-.169>PLANING_BOARD.far && f.position[2]+.012<PLANING_BOARD.near);
    }
  }
  assert.deepEqual(planeAt(.998).palms,[null,null]);
  const resting=motion.sample(s.duration+p.duration+.10*m.duration);
  assert.ok(resting.grasp<1 && near(resting.position[0],JOINT.x+.060));
  for(let i=0;i<3;i++){
    const raised=at(s.duration+p.duration,m,(i+.55)/3);
    const grip=new Vector3(0,.024,.266).applyEuler(new Euler(...raised.rotation)).add(new Vector3(...raised.position));
    assert.ok(grip.distanceTo(new Vector3(...raised.hands[0]))<1e-6);
    assert.ok(raised.position[1]>raised.workTop+.19 && raised.twist<0);
    for(const u of [.821,.84,.86,.88,.899]){
      const press=at(s.duration+p.duration,m,(i+u)/3);
      assert.ok(near(press.position[1]-.066,press.workTop+.082-press.pin));
      assert.equal(press.cue,'knock-'+i);
    }
    const hit=at(s.duration+p.duration,m,(i+.91)/3);
    assert.equal(hit.cue,'knock-'+i);
    assert.ok(near(hit.pin,.027*(i+1)));
    assert.ok(near(hit.position[1]-.066,hit.workTop+.082-hit.pin));
    assert.ok(near(hit.hands[0][2],hit.position[2]+.266*Math.cos(.78)));
    assert.deepEqual(hit.hands[1],raised.hands[1]);
    assert.ok(raised.palms[0].curl[0]>.45 && hit.palms[0].curl[0]<-.4);
    assert.deepEqual(hit.hands[1],[JOINT.braceX,hit.workTop,JOINT.braceZ]);
    assert.ok(hit.palms[1].pressure>=.64 && hit.handWork[1]===1);
  }
  assert.deepEqual(motion.sample(motion.duration).handWork,[0,0]);
});
test('the square mortise through both halves of the rail stays open for the peg',()=>{
  const motion=craftMotion({kind:'posts'},player,detail),cut=motion.cuts[1];
  const bay=makeCraftBay(cut,motion.height,detail.legs),stock=bay.group.getObjectByName('加工中の部材');
  const lower=benchHeight(motion.height,cut),up=new Vector3(0,1,0),ray=new Raycaster();
  bay.group.updateMatrixWorld(true);
  for(const dx of [-.023,0,.023])for(const dz of [-.023,0,.023]){
    ray.set(new Vector3(JOINT.x+dx,lower-.01,JOINT.z+dz),up);
    assert.equal(ray.intersectObject(stock,false).length,0,'timber blocks the wooden peg');
  }
  for(const dx of [-.035,.035]){
    ray.set(new Vector3(JOINT.x+dx,lower-.01,JOINT.z),up);
    assert.ok(ray.intersectObject(stock,false).length>0,'missing material beside the mortise');
  }
  bay.dispose();
});

test('reproducible coverage varies across jobs and across cuts, with distinct eye lines',()=>{
  const observed=new Set();
  for(let take=0;take<24;take++){
    const seed=craftShotSeed(site,take),plan=craftShotOrder(seed,3);
    assert.deepEqual(plan,craftShotOrder(seed,3));assert.equal(new Set(plan).size,3);
    for(const shot of plan)observed.add(shot);
    assert.ok(plan[0]!=='face');
  }
  assert.equal(observed.size,5);
  for(const size of [1,1.28]){
    const motion=craftMotion(site,{...player,buffs:{full:size>1?15:0}},detail);
    const siteFrame=makeJoinerySite(new Group(),site);siteFrame.position(detail);siteFrame.advance(1,3);
    const stage=siteFrame.extents();
    for(const [w,h,open] of [[320,640,440],[390,844,668],[844,390,290],[1000,680,500]]){
      for(const style of [...observed,'hands']){
        for(const tool of ['saw','plane','mallet']){
          const lens=composeCraftLens(style,detail,size,w,h,open,1,()=>true,stage,tool);
          const camera=new PerspectiveCamera(lens.fov,w/h,.03,200);
          camera.position.copy(lens.eye);camera.lookAt(lens.focus);camera.setViewOffset(w,h,0,lens.offset,w,h);
          camera.updateMatrixWorld();
          const visible=p=>{
            const s=p.clone().project(camera);
            assert.ok(Math.abs(s.x)<.99 && s.y<.995 && s.y>1-2*open/h,
              style+' at '+w+' point '+p.toArray()+' projected to '+s.toArray());
          };
          if(style==='wide')stage.forEach(visible);
          if(style==='eye')assert.ok(Math.abs(lens.eye.y-size)<.007);
          if(style==='low')assert.ok(lens.eye.y<.70*size && lens.eye.y>.64*size);
          for(let t=0;t<=motion.duration;t+=.15){
            const f=motion.sample(t);
            if(f.tool!==tool)continue;
            if(style==='face'){
              visible(new Vector3(f.hero[0]+.25*size,1.01*size,f.hero[2]-.65*size));
              visible(new Vector3(f.hero[0]-.25*size,.73*size,f.hero[2]-.69*size));
              assert.ok(lens.faceDistance>0);
            }else if(style==='hands'){
              if(f.grasp>.96)for(const p of [...f.hands,f.position,[f.focus[0],f.workTop,f.focus[2]]])visible(new Vector3(...p));
              assert.equal(lens.faceDistance,0);
            }else{
              const points=style==='eye'?[...f.hands,f.position,[0,1.60*size,1.4*size]]:
                [...f.hands,...f.feet,f.position,[0,1.73*size,f.hero[2]]];
              for(const p of points)visible(new Vector3(...p));
              assert.equal(lens.faceDistance,0);
            }
          }
        }
      }
    }
    siteFrame.dispose();
  }
});

test('overhanging instanced leaves obstruct the field shot and the working rig is excluded',()=>{
  const scene=new Scene(),rig=new Group(),geometry=new SphereGeometry(.24,8,8),material=new MeshBasicMaterial();
  const target=new Vector3(site.x,site.y+4,site.z),eye=target.clone().add(new Vector3(0,0,4));
  const leaf=new InstancedMesh(geometry,material,2),matrix=new Matrix4();
  leaf.setMatrixAt(0,matrix.makeTranslation(target.x,target.y,target.z+2));
  leaf.setMatrixAt(1,matrix.makeTranslation(-100,30,-100));scene.add(leaf,rig);
  const ownWork=new Mesh(geometry,material);ownWork.position.copy(target).z+=1;rig.add(ownWork);
  assert.equal(visibleWorkArea(scene,rig,site,()=>true)(target,eye),false);
  leaf.visible=false;
  assert.equal(visibleWorkArea(scene,rig,site,()=>true)(target,eye),true);
  assert.equal(rig.visible,true);
  geometry.dispose();material.dispose();
});

async function loadBuilderSkin(t){
  const {GLTFLoader}=await import('../two/vendor/GLTFLoader.min.js');
  const {Texture,TextureLoader}=await import('../two/vendor/three.module.min.js');
  const {readFile}=await import('node:fs/promises');
  const {loadRiceModel}=await import('../two/mochi-model.js');
  t.mock.method(TextureLoader.prototype,'load',()=>new Texture());
  t.mock.method(TextureLoader.prototype,'loadAsync',async()=>new Texture());
  t.mock.method(GLTFLoader.prototype,'loadAsync',async function(url){
    const bytes=await readFile(new URL(url));
    return this.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
  });
  await loadRiceModel();
}

test('both drawn palms hold the saw and plane, and the free mallet hand braces the rail',async t=>{
  await loadBuilderSkin(t);
  const scene=new Group(),actual=new Vector3(),target=new Vector3(),origin=new Vector3(),up=new Vector3(),ray=new Raycaster();
  for(const mode of ['normal','kagami'])for(const full of [0,1]){
    const builder={mode,buffs:{full},grounded:true},performer=createCookingPerformer(scene,builder);
    const body=performer.group.getObjectByName('Nikkori');
    const g=body.geometry,ids=new Set(g.index.array.subarray(g.userData.torsoIndexCount));
    const pads=[[],[]];
    for(const id of ids){
      const joint=body.skeleton.bones[g.attributes.skinIndex.getX(id)].name;
      pads[joint==='Hand_R'?0:1].push(id);
    }
    for(const kind of ['hut','fence']){
      const motion=craftMotion({kind,foundationWood:0},builder,detail);
      const bays=motion.cuts.map(c=>makeCraftBay(c,motion.height,detail.legs));
      for(let time=0;time<motion.duration;time+=1/30){
        const f=motion.sample(time),grips=performer.update(f),bay=bays[f.index];
        bay.update(f);bay.group.updateMatrixWorld(true);
        function contact(i,object,normal){
          origin.fromArray(grips[i]).addScaledVector(normal,.045);
          ray.set(origin,up.copy(normal).negate());ray.far=.09;
          const hit=ray.intersectObject(object,false)[0];
          assert.ok(hit && Math.abs(hit.distance-.045)<.006,mode+'/'+full+' '+f.tool+' pad '+i+' does not meet the visible prop at '+f.t);
        }
        for(const [i,mark] of performer.handVertices.entries()){
          body.getVertexPosition(mark,actual).applyMatrix4(body.matrixWorld);
          assert.ok(actual.distanceTo(target.fromArray(grips[i]))<1e-6);
          if(f.handWork[i]>.999)assert.ok(actual.distanceTo(target.fromArray(f.hands[i]))<.008,
            mode+'/'+full+' '+f.tool+' pad '+i+' lost contact at '+f.t.toFixed(2));
        }
        // The operator faces down the bench. A clear vertical plane between
        // the innermost drawn vertices separates every pair of pad triangles,
        // including the larger mitts of a well-fed builder during release.
        let right=Infinity,left=-Infinity;
        for(const id of pads[0])right=Math.min(right,body.getVertexPosition(id,actual).applyMatrix4(body.matrixWorld).x);
        for(const id of pads[1])left=Math.max(left,body.getVertexPosition(id,actual).applyMatrix4(body.matrixWorld).x);
        assert.ok(right-left>.002,mode+'/'+full+' overlapping palm envelopes during '+f.tool+' at '+f.t);
        if(f.grasp<.999)continue;
        if(f.tool==='saw'){
          assert.ok(grips[0][0]>f.position[0] && grips[1][0]<f.position[0]);
          assert.ok(grips[0][2]-grips[1][2]>.055,'two grips must be staggered on the rattan');
          const saw=bay.group.getObjectByName('籐巻き柄の枝挽き鋸');
          contact(0,saw,new Vector3(1,0,0));contact(1,saw,new Vector3(-1,0,0));
        }else if(f.tool==='plane'){
          assert.ok(grips[0][0]>f.position[0] && grips[1][0]<f.position[0]);
        }else{
          assert.ok(target.fromArray(grips[1]).distanceTo(actual.set(JOINT.braceX,f.workTop,JOINT.braceZ))<.008);
          assert.ok(Math.hypot(grips[1][0]-JOINT.x,grips[1][2]-JOINT.z)>.34,'brace too close to the peg');
          const mallet=bay.group.getObjectByName('楔留めの木槌');
          contact(0,mallet,new Vector3(0,1,0).applyQuaternion(mallet.quaternion));
          contact(1,bay.group.getObjectByName('加工中の部材'),new Vector3(0,1,0));
        }
      }
      bays.forEach(b=>b.dispose());
    }
    performer.dispose();
  }
});

test('the wrist rolls the round palm onto each pull while both painted grips stay on the block',async t=>{
  await loadBuilderSkin(t);
  for(const mode of ['normal','kagami'])for(const full of [0,1]){
    const player={mode,buffs:{full}},actor=createCookingPerformer(new Group(),player);
    const plan=craftMotion({kind:'floor'},player,detail),body=actor.group.getObjectByName('Nikkori');
    actor.update(plan.sample(0));
    const {position,skinIndex,skinWeight}=body.geometry.attributes;
    const nativeCount=body.geometry.userData.travellingSkin.attributes.position.count;
    // A second painted point behind each contact reveals the actual rotation
    // and the diameter of the pad. Tool rotation alone cannot pass this check.
    const heels=['Hand_R','Hand_L'].map(name=>{
      const joint=body.skeleton.bones.findIndex(b=>b.name===name);
      let best=Infinity,heel;
      for(let i=0;i<nativeCount;i++){
        if(skinIndex.getX(i)!==joint || skinWeight.getX(i)<.9)continue;
        const d=(Math.abs(position.getX(i))-1.10)**2+(position.getY(i)-.89)**2+(position.getZ(i)-.65)**2;
        if(d<best){best=d;heel=i;}
      }
      return heel;
    });
    function measure(q){
      const frame=plan.sample(q*plan.duration),grips=actor.update(frame);
      const at=id=>actor.group.worldToLocal(body.localToWorld(body.getVertexPosition(id,new Vector3())));
      return heels.map((heel,i)=>{
        assert.ok(new Vector3(...grips[i]).distanceTo(new Vector3(...frame.hands[i]))<.018);
        const tip=at(actor.handVertices[i]),v=at(heel).sub(tip);
        const collar=body.geometry.userData.wristCollars[i];
        const root=collar.reduce((sum,id)=>sum.add(at(id)),new Vector3()).divideScalar(collar.length);
        return {angle:Math.atan2(v.z,v.y),span:v.length(),root,armLength:root.distanceTo(tip)};
      });
    }
    // Compare the same cocked wrist at the start of the send and at the far end.
    const near=measure(.184),far=measure(.35),stroke=PLANING_BOARD.end-PLANING_BOARD.start;
    for(const [i,hand] of far.entries()){
      assert.ok(hand.root.z-near[i].root.z>.75*stroke,'the shoulder must travel with the plane');
      assert.ok(Math.abs(hand.armLength/near[i].armLength-1)<.0005,'the arm length changed for the far reach');
    }
    for(const [cock,pull] of [[.335,.395],[.707,.774]]){
      const before=measure(cock),after=measure(pull);
      for(const [i,pad] of after.entries()){
        assert.ok(pad.angle-before[i].angle>(i?.29:.45),'wrist did not roll onto the pull');
        assert.ok(Math.abs(pad.span/before[i].span-1)<.0005,'palm stretched on the draw');
      }
    }
    actor.dispose();
  }
});

test('both floor contacts keep their footing during the send, settling and pull of the kanna',async t=>{
  await loadBuilderSkin(t);
  const scene=new Group(),vertex=new Vector3();
  for(const mode of ['normal','kagami'])for(const full of [0,1]){
    const player={mode,buffs:{full}},size=full?1.28:1,actor=createCookingPerformer(scene,player);
    const plan=craftMotion({kind:'floor'},player,detail);
    actor.update(plan.sample(0));
    const body=actor.group.getObjectByName('Nikkori'),pads=[];
    if(mode==='kagami'){
      // A stacked cake bears on the low tier. Its upper feet are a third
      // of a metre above the ground, so they cannot establish floor contact.
      const base=actor.group.getObjectByName('鏡餅・福重ね').children[0],p=base.geometry.attributes.position;
      for(const x of [-.34,.34]){
        let id=0,best=Infinity;
        for(let i=0;i<p.count;i++){
          const d=(p.getX(i)-x)**2+p.getZ(i)**2+24*(p.getY(i)-.02)**2;
          if(d<best){best=d;id=i;}
        }
        pads.push(()=>base.localToWorld(new Vector3().fromBufferAttribute(p,id)));
      }
    }else{
      const {position,skinIndex,skinWeight}=body.geometry.attributes;
      for(const name of ['Foot_R','Foot_L']){
        const joint=body.skeleton.bones.findIndex(b=>b.name===name),ids=[];
        for(let i=0;i<position.count;i++)if(skinIndex.getX(i)===joint && skinWeight.getX(i)>.72)ids.push(i);
        ids.sort((a,b)=>position.getY(a)-position.getY(b));
        const sole=ids.slice(0,8);
        pads.push(()=>sole.reduce((sum,id)=>sum.add(body.localToWorld(body.getVertexPosition(id,vertex))),new Vector3()).divideScalar(sole.length));
      }
    }
    const rest=pads.map(p=>p());
    for(let i=1;i<=120;i++){
      actor.update(plan.sample(plan.duration*i/120));
      const now=pads.map(p=>p());
      for(const [side,heel] of now.entries()){
        const from=rest[side];
        assert.ok(Math.hypot(heel.x-from.x,heel.z-from.z)<.022*size,'ground contact slid on '+mode+' at '+i);
      }
      assert.ok(Math.min(...now.map((p,j)=>p.y-rest[j].y))<.016*size,'both sides lifted without a step');
    }
    actor.dispose();
  }
});

test('the belly clears the apron and both palms touch the wood on either side of the iron',async t=>{
  await loadBuilderSkin(t);
  const scene=new Group(),v=new Vector3(),local=new Vector3(),origin=new Vector3();
  for(const mode of ['normal','kagami'])for(const full of [0,1]){
    const builder={mode,buffs:{full}},performer=createCookingPerformer(scene,builder);
    const body=performer.group.getObjectByName('Nikkori'),motion=craftMotion(site,builder,detail);
    for(let time=.36;time<motion.duration;time+=.32){
      const f=motion.sample(time);
      performer.update(f);scene.updateMatrixWorld(true);
      const h=benchHeight(motion.height,motion.cuts[f.index]);
      const inside=(lx,hx,ly,hy,lz,hz)=>Math.min(v.x-lx,hx-v.x,v.y-ly,hy-v.y,v.z-lz,hz-v.z);
      let touch=[Infinity,Infinity],overlap=0;
      const inverse=new Euler(-f.rotation[0],0,0);
      origin.fromArray(f.position);
      for(const i of new Set(body.geometry.index.array)){
        body.getVertexPosition(i,v).applyMatrix4(body.matrixWorld);
        overlap=Math.max(overlap,inside(-.88,.88,h-.086,h,-.602,.30),
          inside(.382,.88,h-.086,h,.30,.602));
        if(f.tool==='mallet'){
          overlap=Math.max(overlap,inside(-.178,.382,h-.086,h,.332,.602),
            inside(JOINT.x-.64,JOINT.x+.52,h,h+.20,JOINT.z-.095,JOINT.z+.095));
        }
        if(f.tool==='plane'){
          overlap=Math.max(overlap,inside(PLANING_BOARD.x-PLANING_BOARD.width/2,PLANING_BOARD.x+PLANING_BOARD.width/2,
            h,h+.080,PLANING_BOARD.far,PLANING_BOARD.near));
          local.copy(v).sub(origin).applyEuler(inverse);
          // The wood on the near side of the iron forms the actual grip.
          const joint=body.skeleton.bones[body.geometry.attributes.skinIndex.getX(i)].name;
          const hand=joint==='Hand_R'?0:joint==='Hand_L'?1:-1;
          if(hand>=0)touch[hand]=Math.min(touch[hand],Math.hypot(Math.max(0,Math.abs(local.x)-PLANE_HALF_WIDTH),
            Math.max(0,-local.y,local.y-.080),Math.max(0,.021-local.z,local.z-.165)));
        }
      }
      assert.ok(overlap<.008,'bench or board through the body at '+time);
      if(f.tool==='plane' && f.grasp>.99)assert.ok(touch.every(d=>d<.008),'visible space between palm and kanna at '+time);
    }
    performer.dispose();
  }
});

test('stock, stops and the front edge of the bench clear the planted lower cake in every job',async t=>{
  await loadBuilderSkin(t);
  const up=new Vector3(.011,1,.005).normalize(),v=new Vector3(),local=new Vector3(),ray=new Raycaster();
  for(const full of [0,1]){
    const builder={mode:'kagami',buffs:{full}},scene=new Group();
    const actor=createCookingPerformer(scene,builder),motion=craftMotion({kind:'hut'},builder,detail);
    const bays=motion.cuts.map(c=>makeCraftBay(c,motion.height,detail.legs));
    const solids=bays.map(bay=>{
      const objects=['加工中の部材','楔締めの作業台'].map(name=>bay.group.getObjectByName(name));
      objects.forEach(mesh=>mesh.geometry.computeBoundingBox());return objects;
    });
    actor.update(motion.sample(0));
    const lower=actor.group.getObjectByName('鏡餅・福重ね').children[0],pos=lower.geometry.attributes.position;
    for(let time=0;time<motion.duration;time+=.10){
      const frame=motion.sample(time);actor.update(frame);scene.updateMatrixWorld(true);
      bays[frame.index].group.updateMatrixWorld(true);
      for(let i=0;i<pos.count;i++){
        v.fromBufferAttribute(pos,i).applyMatrix4(lower.matrixWorld);
        for(const mesh of solids[frame.index]){
          if(!mesh.geometry.boundingBox.containsPoint(mesh.worldToLocal(local.copy(v))))continue;
          // From solid wood the first hit is an exit. Clear air may lie
          // inside the combined bounds of a trestle or a set of clamps.
          ray.set(v,up);
          const hit=ray.intersectObject(mesh,false)[0];
          assert.ok(!hit || hit.face.normal.dot(up)<=0 || hit.distance<.001,
            'lower cake entered '+mesh.name+' during '+frame.tool+' at '+frame.t+' full='+full);
        }
      }
    }
    bays.forEach(b=>b.dispose());actor.dispose();
  }
});

test('the saw shaft, mallet shaft and poll never pass through the closed torso',async t=>{
  await loadBuilderSkin(t);
  const up=new Vector3(.011,1,.005).normalize(),ray=new Ray(),probe=new Vector3(),hit=new Vector3();
  for(const mode of ['normal','kagami'])for(const full of [0,1]){
    const builder={mode,buffs:{full}},actor=createCookingPerformer(new Group(),builder);
    const motion=craftMotion({kind:'posts'},builder,detail),bays=motion.cuts.map(c=>makeCraftBay(c,motion.height,detail.legs));
    const body=actor.group.getObjectByName('Nikkori'),g=body.geometry,indices=g.index.array;
    const torso=indices.subarray(0,g.userData.torsoIndexCount),vertices=[...new Set(torso)];
    const world=Array.from({length:g.attributes.position.count},()=>new Vector3());
    for(let time=0;time<motion.duration;time+=.10){
      const f=motion.sample(time),bay=bays[f.index];actor.update(f);bay.update(f);
      const tool=bay.group.getObjectByName(f.tool==='saw'?'籐巻き柄の枝挽き鋸':'楔留めの木槌');
      for(const i of vertices)body.getVertexPosition(i,world[i]).applyMatrix4(body.matrixWorld);
      const length=f.tool==='saw'?.49:.305;
      for(let z=0;z<=length;z+=.025){
        tool.localToWorld(probe.set(0,0,z));ray.set(probe,up);
        let exits=0;
        for(let j=0;j<torso.length;j+=3){
          if(ray.intersectTriangle(world[torso[j]],world[torso[j+1]],world[torso[j+2]],false,hit))exits++;
        }
        assert.equal(exits%2,0,'tool inside '+mode+'/'+full+' at '+f.tool+'/'+f.t);
      }
    }
    bays.forEach(b=>b.dispose());actor.dispose();
  }
});

test('the working palm stays clear of the eyes and mouth in the plane insert',async t=>{
  await loadBuilderSkin(t);
  const scene=new Group(),dir=new Vector3(),point=new Vector3(),ray=new Raycaster();
  for(const mode of ['normal','kagami'])for(const full of [0,1]){
    const size=full?1.28:1,builder={mode,buffs:{full},grounded:true};
    const actor=createCookingPerformer(scene,builder),motion=craftMotion({kind:'floor'},builder,detail);
    const body=actor.group.getObjectByName('Nikkori'),skin=body.geometry.attributes.position;
    const joints=body.skeleton.bones.map(b=>b.name);
    const lens=composeCraftLens('hands',detail,size,1000,680,555,1,()=>true,[],'plane',mode==='kagami');
    // Positions of the eyes and mouth in the portrait atlas projected onto
    // the original GLB. Use their actual deformed surface on every stroke.
    const landmarks=[[-.35,1.38],[.35,1.38],[.012,1.165]].map(([x,y])=>{
      let best=Infinity,id=-1;
      for(let i=0;i<skin.count;i++){
        if(skin.getZ(i)<.60)continue;
        const d=(skin.getX(i)-x)**2+(skin.getY(i)-y)**2;
        if(d<best){best=d;id=i;}
      }
      return id;
    });
    for(let time=.12;time<motion.duration;time+=.13){
      actor.update(motion.sample(time));scene.updateMatrixWorld(true);
      body.computeBoundingSphere();
      const {skinWeight:weights,skinIndex:indices}=body.geometry.attributes;
      for(const id of landmarks){
        body.getVertexPosition(id,point).applyMatrix4(body.matrixWorld);
        dir.subVectors(point,lens.eye);ray.far=dir.length()-.012;ray.set(lens.eye,dir.normalize());
        const hits=ray.intersectObject(body,false);
        for(const {face} of hits)assert.ok([face.a,face.b,face.c].every(i=>
          !joints[indices.getX(i)].startsWith('Hand_') || weights.getX(i)<.45),mode+'/'+full+' hand covers face vertex '+id+' at '+time);
      }
    }
    actor.dispose();
  }
});
