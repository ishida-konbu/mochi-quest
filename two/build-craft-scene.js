import { Group,Scene,Mesh,Color,Vector3,PlaneGeometry,MeshLambertMaterial,HemisphereLight,DirectionalLight,FogExp2,Raycaster,Sphere,Matrix4 } from './vendor/three.module.min.js';
import { staticVolumeAt,terrainContactHeight } from './terrain.js';
import { createCookingPerformer } from './cooking-performer.js';
import { benchPoint,findWorkBench,craftMotion } from './build-craft-motion.js';
import { makeCraftBay } from './build-craft-art.js';
import { hokoraCarpentry } from './kaede-hokora-mesh.js';
import { homesteadFinish } from './homestead-pigment.js';

const up=new Vector3(0,1,0), fov=39,tan=Math.tan(fov*Math.PI/360);
function worldPoint(frame,v){
  const [x,z]=benchPoint(frame,v.x,v.z);return new Vector3(x,v.y+frame.y,z);
}
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
// A locked, slightly elevated tripod keeps the face, tool edge and work in
// the same composition. The bottom strip is reserved before fitting portrait.
export function craftLens(bench,size,width,height,available,sight=clearSight){
  const open=Math.max(.24,Math.min(1,available/height)),aspect=width/height;
  const target=new Vector3(0,.82*size,.65*size);
  const points=[];
  for(const x of [-.92*size,.92*size])for(const y of [-.035,1.75*size])
    for(const z of [.85*size,2.50*size])points.push(new Vector3(x,y,z));
  for(const x of [-.88,.88])for(const z of [-.72,.70])points.push(new Vector3(x,.53*size,z));
  const targets=[new Vector3(0,.82*size,.83*size),new Vector3(-.24*size,1.04*size,.93*size),new Vector3(.24*size,1.04*size,.93*size),new Vector3(.31,.55*size,.03),new Vector3(-.24,.61*size,.02),
    new Vector3(0,.54*size+.10,-.39),new Vector3(0,.54*size+.11,.34),new Vector3(.32,.54*size+.23,.65)];
  for(const y of [.76,1.02])for(const angle of [.47,-.47,.18,-.18]){
    const dir=new Vector3(Math.sin(angle),y,-Math.cos(angle)).normalize(),right=up.clone().cross(dir).normalize(),vertical=dir.clone().cross(right);
    let distance=2.67*size;
    for(const p of points){
      const v=p.clone().sub(target),front=v.dot(dir);
      distance=Math.max(distance,front+(Math.abs(v.dot(right))+.04)/(tan*aspect*.92),
        front+(Math.abs(v.dot(vertical))+.04)/(tan*open*.92));
    }
    const eye=worldPoint(bench,target.clone().addScaledVector(dir,distance)),focus=worldPoint(bench,target);
    if(bench.detail || targets.every(p=>sight(worldPoint(bench,p),eye)))return {eye,focus,offset:(height-available)/2,width,height};
  }
  return null;
}
function closeWorkroom(){
  const scene=new Scene();scene.background=new Color('#e3dec9');scene.fog=new FogExp2('#e3dec9',.055);
  scene.add(new HemisphereLight('#fff6db','#a69a78',2));
  const sun=new DirectionalLight('#ffefd2',2.1);sun.position.set(-3,5,4);scene.add(sun);
  const floor=new Mesh(new PlaneGeometry(64,64),new MeshLambertMaterial({color:'#d8cbbb'}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.02;scene.add(floor);
  const b=hokoraCarpentry();
  for(let i=0;i<3;i++)b.box('rush','#d0bf92',[0,-.010,.12+i*.52],[2.60,.018,.519],{grain:'x',bevel:.001,seed:i});
  const mat=new Mesh(b.finish(),homesteadFinish());scene.add(mat);
  return {scene,dispose(){floor.geometry.dispose();floor.material.dispose();mat.geometry.dispose();}};
}
export function makeCraftScene(scene,camera,player,site,canStand=()=>true) {
  const original={position:camera.position.clone(),quaternion:camera.quaternion.clone(),fov:camera.fov,
    view:camera.view?.enabled?{...camera.view}:null};
  const field=findWorkBench(site,player,canStand),size=player.buffs?.full>0?1.28:1;
  const group=new Group();group.name='配達人の普請場';
  let bench,motion,bays=[],performer,detail,closed=false;
  function prepare(useDetail){
    bench=useDetail?{x:0,y:0,z:0,yaw:0,detail:true,feet:[0,0],legs:[0,0,0,0]}:field;
    group.position.set(bench.x,bench.y,bench.z);group.rotation.y=bench.yaw;
    if(useDetail)detail??=closeWorkroom();
    (useDetail?detail.scene:scene).add(group);
    for(const b of bays){b.group.removeFromParent();b.dispose();}
    motion=craftMotion(site,player,bench);
    bays=motion.cuts.map(cut=>makeCraftBay(cut,motion.height,bench.legs));
    for(const b of bays)group.add(b.group);
    group.updateMatrixWorld(true);
  }
  function dispose(){
    if(closed)return;closed=true;
    performer?.dispose();group.removeFromParent();for(const b of bays)b.dispose();detail?.dispose();
    camera.position.copy(original.position);camera.quaternion.copy(original.quaternion);camera.fov=original.fov;
    if(original.view){const v=original.view;camera.setViewOffset(v.fullWidth,v.fullHeight,v.offsetX,v.offsetY,v.width,v.height);}
    else camera.clearViewOffset();
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
      const first=craftLens(bench,size,w,h,available,()=>true);
      const check=bench.detail?clearSight:visibleWorkArea(scene,group,bench,canStand,first.eye.distanceTo(first.focus)+2.5);
      let lens=craftLens(bench,size,w,h,available,check);
      if(!lens){prepare(true);lens=craftLens(bench,size,w,h,available);}
      camera.position.copy(lens.eye);camera.lookAt(lens.focus);camera.fov=fov;
      camera.setViewOffset(w,h,0,lens.offset,w,h);camera.updateMatrixWorld();
    },
    update(t){
      const f=motion.sample(t);
      for(let i=0;i<bays.length;i++)bays[i].group.visible=i===f.index;
      bays[f.index].update(f);performer.update(f);
      return f;
    },dispose,
  };
}
