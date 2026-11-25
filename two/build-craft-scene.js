import { Group,Scene,Mesh,Color,Vector3,PlaneGeometry,MeshLambertMaterial,HemisphereLight,DirectionalLight,FogExp2,Raycaster,Sphere,Matrix4 } from './vendor/three.module.min.js';
import { staticVolumeAt,terrainContactHeight } from './terrain.js';
import { createCookingPerformer } from './cooking-performer.js';
import { findWorkBench,craftMotion } from './build-craft-motion.js';
import { makeCraftBay } from './build-craft-art.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { homesteadFinish } from './homestead-pigment.js';

import {composeCraftLens,craftShotSeed,craftShotOrder} from './build-craft-lenses.js';
import {makeJoinerySite} from './build-craft-site.js';

function clearSight(a,b){
  const n=Math.ceil(a.distanceTo(b)/.19);
  for(let i=1;i<=n;i++){
    const u=i/n,x=a.x+(b.x-a.x)*u,y=a.y+(b.y-a.y)*u,z=a.z+(b.z-a.z)*u;
    if(y<terrainContactHeight(x,z)+.06 || staticVolumeAt(x,z,y-.022,.06,.11))return false;
  }
  return true;
}
// Colliders describe trunks and walls; the actual paint includes overhanging
// crowns, grass, awnings and people. Ray-test those visible surfaces as well.
// Limit instanced batches to individual objects inside the tripod's reach.
export function visibleWorkArea(scene,rig,bench,canStand=()=>true,reach=12){
  const middle=new Vector3(bench.x,bench.y+.75,bench.z),sphere=new Sphere();
  const matrix=new Matrix4(),instance=new Matrix4(),meshes=[],ray=new Raycaster(),hits=[];
  const near=s=>s.center.distanceToSquared(middle)<(reach+s.radius)**2;
  scene.updateMatrixWorld(true);
  const previous=rig.visible;rig.visible=false;
  try{
    scene.traverseVisible(m=>{
      if(!m.isMesh || !m.geometry.attributes.position)return;
      if(!m.geometry.boundingSphere)m.geometry.computeBoundingSphere();
      if(m.isInstancedMesh || m.isSkinnedMesh){
        if(!m.boundingSphere)m.computeBoundingSphere();
        sphere.copy(m.boundingSphere);
      }else sphere.copy(m.geometry.boundingSphere);
      if(!near(sphere.applyMatrix4(m.matrixWorld)))return;
      if(!m.isInstancedMesh){meshes.push(m);return;}
      for(let i=0;i<m.count;i++){
        m.getMatrixAt(i,instance);matrix.multiplyMatrices(m.matrixWorld,instance);
        if(!near(sphere.copy(m.geometry.boundingSphere).applyMatrix4(matrix)))continue;
        const surface=new Mesh(m.geometry,m.material);
        surface.matrixAutoUpdate=false;surface.matrixWorld.copy(matrix);meshes.push(surface);
      }
    });
  }finally{rig.visible=previous;}
  return (target,eye)=>{
    if(!clearSight(target,eye))return false;
    const range=eye.distanceTo(target);
    ray.set(eye,target.clone().sub(eye).normalize());ray.near=.035;ray.far=range-.025;
    // Leave the audience side of the lens clear of passing villagers too.
    for(let d=.4;d<range;d+=.45){
      const p=ray.ray.at(d,new Vector3());
      if(!canStand(p.x,p.z,p.y,.24,.28))return false;
    }
    for(const mesh of meshes){
      hits.length=0;ray.intersectObject(mesh,false,hits);
      if(hits.length)return false;
    }
    return true;
  };
}
function closeWorkroom(field){
  const scene=new Scene();
  const sky=field.fog?.color??(field.background?.isColor?field.background:new Color('#c7d9db'));
  scene.background=sky.clone();scene.fog=new FogExp2(sky,.070);
  scene.add(new HemisphereLight('#fff6db','#a69a78',2));
  const sun=new DirectionalLight('#ffefd2',2.1);sun.position.set(-3,5,4);scene.add(sun);
  const floor=new Mesh(new PlaneGeometry(64,64),new MeshLambertMaterial({color:'#d8cbbb'}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);
  const b=hokoraCarpentry();
  for(let i=0;i<3;i++)b.box('rush','#d0bf92',[0,-.010,.12+i*.52],[2.60,.018,.519],{grain:'x',bevel:.001,seed:i});
  const mat=new Mesh(b.finish(),homesteadFinish());scene.add(mat);
  return {scene,dispose(){floor.geometry.dispose();floor.material.dispose();mat.geometry.dispose();}};
}
export function makeCraftScene(scene,camera,player,site,canStand=()=>true,take=0) {
  const original={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov,
    view:camera.view?.enabled?{...camera.view}:null,nearFocus:camera.userData.joineryFaceDistance};
  const field=findWorkBench(site,player,canStand),size=player.buffs?.full>0?1.28:1;
  const group=new Group();group.name='配達人の普請場';
  const siteFrame=makeJoinerySite(group,site),seed=craftShotSeed(site,take);
  let bench,motion,bays=[],performer,detail,closed=false,lenses=[],activeIndex=-1;
  function applyLens(index){
    if(!lenses[index])return;
    const lens=lenses[index];
    siteFrame.advance(index,motion.cuts.length);
    camera.position.copy(lens.eye);camera.lookAt(lens.focus);camera.fov=lens.fov;
    camera.userData.joineryFaceDistance=lens.faceDistance;
    camera.setViewOffset(lens.width,lens.height,0,lens.offset,lens.width,lens.height);
    camera.updateMatrixWorld();activeIndex=index;
  }
  function planLenses(w,h,available){
    const order=craftShotOrder(seed,motion.cuts.length),choices=[];
    const check=bench.detail?()=>true:visibleWorkArea(scene,group,bench,canStand,27);
    const sight=(target,eye)=>siteFrame.clear(target,eye) && check(target,eye);
    const side=seed&32?1:-1;
    for(const [i,desired] of order.entries()){
      siteFrame.advance(i,order.length);
      const stage=siteFrame.extents(),previous=choices.at(-1)?.style;
      const alternatives=[desired,'eye','master','low','wide','face'].filter(k=>k!==previous);
      let lens=null;
      for(const style of new Set([...alternatives,previous].filter(Boolean))){
        // Look past the bracing palm for the low/eye hammer shots; the
        // working sleeve and raised mallet otherwise pass across both eyes.
        const gripSide=motion.cuts[i].tool==='mallet' && (style==='low' || style==='eye')?-1:side;
        lens=composeCraftLens(style,bench,size,w,h,available,gripSide,sight,stage);
        if(lens)break;
      }
      if(!lens)return null;
      choices.push(lens);
    }
    return choices;
  }
  function prepare(useDetail){
    bench=useDetail?{x:0,y:0,z:0,yaw:0,detail:true,feet:[0,0],legs:[0,0,0,0]}:field;
    group.position.set(bench.x,bench.y,bench.z);group.rotation.y=bench.yaw;
    if(useDetail)detail??=closeWorkroom(scene);
    (useDetail?detail.scene:scene).add(group);
    for(const b of bays){b.group.removeFromParent();b.dispose();}
    motion=craftMotion(site,player,bench);
    bays=motion.cuts.map(cut=>makeCraftBay(cut,motion.height,bench.legs));
    for(const b of bays)group.add(b.group);
    group.updateMatrixWorld(true);siteFrame.position(bench);
  }
  function dispose(){
    if(closed)return;closed=true;
    siteFrame.dispose();performer?.dispose();group.removeFromParent();for(const b of bays)b.dispose();detail?.dispose();
    camera.position.copy(original.position);camera.quaternion.copy(original.quaternion);camera.fov=original.fov;
    if(original.view){const v=original.view;camera.setViewOffset(v.fullWidth,v.fullHeight,v.offsetX,v.offsetY,v.width,v.height);}
    else camera.clearViewOffset();
    if(original.nearFocus===undefined)delete camera.userData.joineryFaceDistance;
    else camera.userData.joineryFaceDistance=original.nearFocus;
    camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  try{
    prepare(field.detail);performer=createCookingPerformer(group,player);
    performer.group.name='普請をするお餅の配達人';
  }catch(e){dispose();throw e;}
  return {
    get duration(){return motion.duration;},
    get detail(){return bench.detail?detail.scene:null;},
    endPose:{x:player.x,y:player.y,z:player.z,heading:player.heading},
    layout(w,h,available){
      lenses=planLenses(w,h,available);
      if(!lenses){
        prepare(true);lenses=planLenses(w,h,available);
      }
      if(!lenses)throw new Error('普請を見渡せる撮影位置を選べません。');
      applyLens(Math.max(0,activeIndex));
    },
    update(t){
      const f=motion.sample(t);
      if(f.index!==activeIndex)applyLens(f.index);
      for(let i=0;i<bays.length;i++)bays[i].group.visible=i===f.index;
      bays[f.index].update(f);performer.update(f);
      return {...f,shotStyle:lenses[f.index]?.style};
    },dispose,
  };
}
