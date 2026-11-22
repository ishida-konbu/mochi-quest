import * as T from './vendor/three.module.min.js';
import { PEACH_TREES } from './pilgrimage-layout.js';
import { terrainMeshHeight, seeded, wrapDelta } from './terrain.js';
import { sculpture } from './pilgrimage-pigment.js';
import { brushWash } from './scroll-sculpt.js';
import { peachSprig } from './peach-blossom.js';
const {sin,cos,PI}=Math;
export const CROWN_SPAN=10,CROWN_MID=3.3;
// Each model has four azimuths at each elevation. Upper and lower slopes
// show opposite sides of the lifted boughs; a single horizon view loses them.
export const CROWN_ELEVATIONS=[-.56,-.08,.40,.94];
export const peachBark=brushWash(new T.MeshLambertMaterial({vertexColors:true}),.29);
export const peachPetals=new T.MeshLambertMaterial({vertexColors:true,side:T.DoubleSide});
peachPetals.onBeforeCompile=shader=>{
  // Daylight comes through the thin corollas. Reflect their own pigment
  // into the shaded face while leaving the ink-brown twigs deep in tone.
  shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
    float petal=smoothstep(.19,.52,diffuseColor.r);
    float rose=smoothstep(.14,.46,diffuseColor.r-diffuseColor.g);
    outgoingLight+=diffuseColor.rgb*(.035+(.33+.16*rose)*petal);
    #include <opaque_fragment>`);
};
function peachTree(seed){
  const rng=seeded(seed), s=sculpture(), sprays=[];
  const drift=(rng()-.46)*.91, tilt=(rng()-.5)*.49;
  const trunk=[[.03,-.34,0],[-.10,.34,.064],[drift+.13,.98,tilt],[drift*.38,1.69,.105],[drift*.4+.16,2.34,-.11]];
  s.stroke('#554f47',trunk,[.39,.35,.25,.223,.066],18);
  s.stroke('#938c79',trunk.map(([x,y,z],i)=>[x-.075,y,z+[.23,.28,.23,.16,.05][i]]),
    [.014,.038,.053,.026,.002],16);
  for(let i=0;i<4;i++){
    const a=i*1.57+rng()*.63;
    const c=cos(a),d=sin(a);
    s.stroke('#69604f',[[.04,.41,0],[.28*c,.16,.28*d],[.64*c,-.09,.64*d],
      [.76*c,-.32,.76*d],[.67*c,-.76,.67*d],[.72*c,-1.36,.72*d]],
      [.17,.19,.09,.061,.035,.008],10);
  }
  for(let i=0;i<6;i++){
    const a=i*2.39+rng()*.93, bend=(rng()-.5)*1.12, reach=1.1+rng()*1.32;
    const root=trunk[2+(i%3)], h=root[1]+.65+rng()*.73;
    const elbow=[root[0]+(.45+rng()*.40)*cos(a+bend),h,root[2]+.49*sin(a+bend)];
    const tip=[root[0]+reach*cos(a),h+.52+rng()*.62,root[2]+reach*sin(a)];
    const wood=[root,elbow,[.66*tip[0]+.34*elbow[0],elbow[1]-.15+.4*rng(),.66*tip[2]+.34*elbow[2]],tip];
    s.stroke(i%2?'#655d52':'#6d6259',wood,[.145,.123,.076,.018],11);
    const midway=wood[2];
    const spur=[midway[0]+.57*cos(a+bend+.87),midway[1]+.58,midway[2]+.57*sin(a+bend+.87)];
    s.stroke('#736659',[elbow,midway,spur],[.064,.059,.019],6);
    sprays.push({q:tip,a,length:1.22+rng()*.67,pitch:.18+rng()*.53},
      {q:spur,a:a+.91,length:1.16+rng()*.49,pitch:.39+rng()*.27},
      {q:tip,a:a-.85,length:.98+rng()*.67,pitch:-.29+rng()*.39});
  }
  return {geo:s.finish(),sprays};
}
const forms=[];
export function peachModel(i,detailed=true){
  const form=forms[i]??=peachTree(76231+i*3504),key=detailed?'near':'middle';
  if(!form[key]){
    const crown=sculpture();
    form.sprays.forEach(({q,a,length,pitch},j)=>{
      const w=length*(j%3===0?1.13:1.49);
      crown.add(peachSprig(i,j%3,detailed),'#ffffff',...q,w,w*.90,w,pitch,-a,.08*sin(i+j));
    });
    form[key]=crown.finish();
  }
  return [[form.geo,peachBark],[form[key],peachPetals]];
}
export function createPeachOrchard(scene) {
  const N=PEACH_TREES.length;
  const stands=new Map();
  const size=48, formCounts=new Array(5).fill(0);
  for(const tree of PEACH_TREES){
    const key=Math.floor(tree.x/size)*128+Math.floor(tree.z/size);
    if(!stands.has(key))stands.set(key,{trees:[],box:new T.Box3()});
    const stand=stands.get(key),y=terrainMeshHeight(tree.x,tree.z),extent=tree.size*CROWN_SPAN*.55;
    const at=new T.Vector3(tree.x,y,tree.z);
    stand.box.expandByPoint(at.clone().add(new T.Vector3(-extent,-1,-extent)));
    stand.box.expandByPoint(at.clone().add(new T.Vector3(extent,extent*1.7,extent)));
    const form=tree.form??tree.seed%5;
    stand.trees.push({...tree,form,y});
    formCounts[form]++;
  }
  for(const stand of stands.values())stand.sphere=stand.box.getBoundingSphere(new T.Sphere());
  const root=new T.Group();root.name='桃源郷の桃の林';scene.add(root);
  function batch(geo,mat,size,shadow){
    const mesh=new T.InstancedMesh(geo,mat,size);
    mesh.count=0;mesh.frustumCulled=false;mesh.receiveShadow=true;mesh.castShadow=shadow;
    mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);root.add(mesh);return mesh;
  }
  const crowns=Array.from({length:5},(_,i)=>{
    const [[wood,bark],[close,petals]]=peachModel(i),capacity=formCounts[i];
    return {trunk:batch(wood,bark,capacity,true),close:batch(close,petals,capacity,false),
      middle:batch(peachModel(i,false)[1][0],petals,capacity,false)};
  });
  const map=new T.TextureLoader().load(new URL('./assets/world/peach-crowns.webp?v=orchard-wash-2',import.meta.url).href);
  map.colorSpace=T.SRGBColorSpace;map.anisotropy=4;
  // The crown impressions already contain directional light and twig shadows.
  const mat=new T.MeshBasicMaterial({map,alphaTest:.29});
  // Four bearings at four elevations preserve each leaning crown above the gorge.
  const plane=new T.PlaneGeometry(1,1),cells=new T.InstancedBufferAttribute(new Float32Array(2*N),2);
  plane.setAttribute('crownCell',cells.setUsage(T.DynamicDrawUsage));
  mat.onBeforeCompile=shader=>{
    shader.vertexShader='attribute vec2 crownCell;\n'+shader.vertexShader.replace('#include <uv_vertex>',`
      #include <uv_vertex>
      vMapUv=(crownCell+clamp(uv,.004,.996))/vec2(8.,10.);
    `);
  };
  const distant=batch(plane,mat,N,false),dummy=new T.Object3D(),colour=new T.Color(),up=new T.Vector3();
  const tints=['#ffffff','#fcf9f5','#f8f5f4','#fff8ee','#f6f2f1','#fffcf5'];
  const frustum=new T.Frustum(),projection=new T.Matrix4(),lastProjection=new T.Matrix4(),lastRotation=new T.Quaternion(),bounds=new T.Sphere();
  let lastX=Infinity,lastZ=Infinity,lastY=Infinity;
  return camera=>{
    if(!camera)return;
    const {x,y,z}=camera.position;
    if(Math.hypot(x-lastX,y-lastY,z-lastZ)<.38 && Math.abs(lastRotation.dot(camera.quaternion))>.99995 &&
      lastProjection.equals(camera.projectionMatrix))return;
    lastX=x;lastY=y;lastZ=z;lastRotation.copy(camera.quaternion);lastProjection.copy(camera.projectionMatrix);
    camera.updateWorldMatrix(true,false);
    frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
    for(const m of root.children)m.count=0;
    for(const stand of stands.values()){
      bounds.copy(stand.sphere);
      const sx=wrapDelta(bounds.center.x-x),sz=wrapDelta(bounds.center.z-z);
      if(sx*sx+sz*sz>(630+bounds.radius)**2)continue;
      bounds.center.x=x+sx;bounds.center.z=z+sz;
      if(!frustum.intersectsSphere(bounds))continue;
      for(const tree of stand.trees){
        const dx=wrapDelta(tree.x-x),dz=wrapDelta(tree.z-z),dist=Math.hypot(dx,dz,y-tree.y-CROWN_MID*tree.size);
        if(dist>630)continue;
        colour.set(tints[tree.seed%tints.length]);
        if(dist<(29+tree.size*7)){
          bounds.center.set(x+dx,tree.y+CROWN_MID*tree.size,z+dz);bounds.radius=CROWN_SPAN*.58*tree.size;
          if(!frustum.intersectsSphere(bounds))continue;
          const {trunk,close,middle}=crowns[tree.form];
          const flowers=dist<4.5+tree.size*4.5?close:middle;
          dummy.position.set(x+dx,tree.y,z+dz);dummy.rotation.set(0,tree.turn,0);dummy.scale.setScalar(tree.size);dummy.updateMatrix();
          trunk.setMatrixAt(trunk.count++,dummy.matrix);
          const index=flowers.count++;flowers.setMatrixAt(index,dummy.matrix);flowers.setColorAt(index,colour);
        }else{
          const face=Math.atan2(-dx,-dz),index=distant.count++;
          const view=((Math.round((face-tree.turn)/(PI*.5))%4)+4)%4;
          const elevation=Math.atan2(y-tree.y-CROWN_MID*tree.size,Math.hypot(dx,dz));
          let band=0;
          while(band+1<CROWN_ELEVATIONS.length && elevation>(CROWN_ELEVATIONS[band]+CROWN_ELEVATIONS[band+1])*.5)band++;
          // Pin the image of the root to the same contact as its 3-D trunk.
          // Keep the card upright on a slope; gradually tilt for an aerial view.
          const tilt=Math.sign(elevation)*Math.max(0,Math.abs(elevation)-.49);
          const vertical=tree.size/Math.cos(elevation-tilt);
          dummy.rotation.set(-tilt,face,0,'YXZ');
          up.set(0,CROWN_MID*Math.cos(CROWN_ELEVATIONS[band])*vertical,0).applyQuaternion(dummy.quaternion);
          dummy.position.set(x+dx,tree.y,z+dz).add(up);
          dummy.scale.set(CROWN_SPAN*tree.size,CROWN_SPAN*vertical,1);dummy.updateMatrix();
          distant.setMatrixAt(index,dummy.matrix);distant.setColorAt(index,colour);
          cells.setXY(index,view+4*(band%2),9-tree.form*2-Math.floor(band/2));
        }
      }
    }
    for(const m of root.children)if(m.count){
      m.instanceMatrix.needsUpdate=true;
      if(m.instanceColor)m.instanceColor.needsUpdate=true;
    }
    root.visible=distant.count>0 || crowns.some(form=>form.trunk.count>0);
    cells.needsUpdate=true;
  };
}
