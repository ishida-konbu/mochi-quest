import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILD_MODULES } from '../two/living-build-state.js';
import { constructionCuts,craftMotion,findWorkBench,BENCH_LEGS,benchPoint } from '../two/build-craft-motion.js';
import { visibleWorkArea } from '../two/build-craft-scene.js';
import { composeCraftLens,craftShotOrder,craftShotSeed } from '../two/build-craft-lenses.js';
import { makeJoinerySite } from '../two/build-craft-site.js';
import { PerspectiveCamera,Vector3,Group,Mesh,Scene,SphereGeometry,MeshBasicMaterial,InstancedMesh,Matrix4 } from '../two/vendor/three.module.min.js';
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
  const p=findWorkBench(site,player);
  assert.equal(p.detail,false);
  assert.ok(p.feet.every(Number.isFinite));
  for(const [i,leg] of BENCH_LEGS.entries()){
    const [x,z]=benchPoint(p,...leg);
    assert.ok(near(p.y+p.legs[i],groundHeight(x,z,terrainContactHeight(x,z)+.20)));
  }
  assert.equal(findWorkBench(site,player,()=>false).detail,true);
});
test('the pull saw reaches the offcut before it drops, the plane lifts on return, and each timber pin sinks on impact',()=>{
  const motion=craftMotion(site,player,detail),[s,p,m]=motion.cuts;
  const at=(start,shot,phase)=>motion.sample(start+shot.duration*(.17+.65*phase));
  const mid=at(0,s,.55);
  assert.ok(near(mid.hands[0][2],mid.position[2]+.22));assert.equal(mid.fall,0);
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
  assert.equal(at(s.duration,p,.90).shed,1);
  const pull=at(s.duration,p,.27),lead=at(s.duration,p,.05),returning=at(s.duration,p,.50);
  assert.ok(near(pull.position[1],pull.workTop) && pull.position[2]>lead.position[2]);
  assert.ok(returning.position[1]>returning.workTop+.06);
  assert.ok(near(pull.hands[0][2],pull.position[2]+.118) && near(pull.hands[1][2],pull.position[2]-.055));
  const resting=motion.sample(s.duration+p.duration+.10*m.duration);
  assert.ok(resting.grasp<1 && near(resting.position[0],.51));
  for(let i=0;i<3;i++){
    for(const u of [.821,.84,.86,.88,.899]){
      const press=at(s.duration+p.duration,m,(i+u)/3);
      assert.ok(near(press.position[1]-.066,press.workTop+.109-press.pin));
      assert.equal(press.cue,'knock-'+i);
    }
    const hit=at(s.duration+p.duration,m,(i+.91)/3);
    assert.equal(hit.cue,'knock-'+i);
    assert.ok(near(hit.pin,.036*(i+1)));
    assert.ok(near(hit.position[1]-.066,hit.workTop+.109-hit.pin));
    assert.ok(near(hit.hands[0][2],hit.position[2]+.223));
  }
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
      for(const style of observed){
        const lens=composeCraftLens(style,detail,size,w,h,open,1,()=>true,stage);
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
          if(style==='face'){
            visible(new Vector3(.25*size,1.01*size,.86*size));
            visible(new Vector3(-.25*size,.73*size,.90*size));
            assert.ok(lens.faceDistance>0);
          }else{
            const points=style==='eye'?[...f.hands,f.position,[0,1.60*size,1.4*size]]:
              [...f.hands,...f.feet,f.position,[0,1.73*size,f.hero[2]]];
            for(const p of points)visible(new Vector3(...p));
            assert.equal(lens.faceDistance,0);
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
