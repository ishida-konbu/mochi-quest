// Transport every cross-section, its ink normals and the ornaments on its
// spine together. Geometry also deforms in the shadow pass and atlas baker.
import * as T from './vendor/three.module.min.js';
import { dragonWave, dragonPhase, dragonPitch, dragonLengthScale } from './animal-motion.js';

import { dragonRings } from './dragon-anatomy.js';

// Thin high-altitude haze lets the ink silhouette carry across a valley.
// Use the same depth response on the articulated rig and its distant print.
export function dragonSkyHaze(shader, condition='true') {
  shader.vertexShader=shader.vertexShader.replace('#include <fog_vertex>',`#include <fog_vertex>
    #ifdef USE_FOG
      if (${condition}) vFogDepth -= .52 * max(0., vFogDepth - 44.);
    #endif`);
}

const skyMaterials=new WeakMap();
function skyMaterial(source) {
  if(skyMaterials.has(source))return skyMaterials.get(source);
  const material=source.clone();
  material.onBeforeCompile=function(shader,renderer) {
    source.onBeforeCompile.call(this,shader,renderer);
    dragonSkyHaze(shader);
  };
  material.customProgramCacheKey=()=>source.customProgramCacheKey()+'-dragon-sky';
  // A rig can be prepared before its painted coat has finished loading.
  source.addEventListener('pigmentready',()=>{
    material.map=source.map;material.color.copy(source.color);material.needsUpdate=true;
  });
  skyMaterials.set(source,material);
  return material;
}

function dragonSkin(mesh) {
  const source=mesh.geometry;
  const geometry=source.clone();
  const rest=source.attributes.position, normals=source.attributes.normal;
  const pos=geometry.attributes.position, normal=geometry.attributes.normal;
  pos.setUsage(T.DynamicDrawUsage);normal.setUsage(T.DynamicDrawUsage);
  mesh.geometry=geometry;
  const contour=mesh.getObjectByName('墨の輪郭');
  if(contour)contour.geometry=geometry;
  geometry.computeBoundingSphere();geometry.boundingSphere.radius+=1.2;
  return {geometry,rest,normals,pos,normal};
}
const tangent=new T.Vector3(),bent=new T.Vector3(),vector=new T.Vector3(),second=new T.Vector3();
const orientation=new T.Quaternion(), physical=new T.Matrix4().makeScale(1,1,dragonLengthScale);
const local=new T.Matrix4().makeScale(1,1,1/dragonLengthScale);

function nearestSection(p) {
  let closest=0,best=Infinity;
  for(let i=0;i<dragonRings.length;i++) {
    const r=dragonRings[i],s=(r.x-p.x)**2+(r.y-p.y)**2+((r.z-p.z)*dragonLengthScale)**2;
    if(s<best){closest=i;best=s;}
  }
  return closest;
}

// Project each hair vertex on a vertebral interval. The brush has several
// diverging strands, so their roots and tips must follow different sections.
function plumeBinding(p) {
  const r=nearestSection(p);
  let closest=r,weight=0,best=Infinity;
  for(let i=Math.max(0,r-1);i<=Math.min(r,dragonRings.length-2);i++) {
    const a=dragonRings[i],b=dragonRings[i+1];
    tangent.subVectors(b,a);tangent.z*=dragonLengthScale;
    bent.subVectors(p,a);bent.z*=dragonLengthScale;
    const t=Math.max(0,Math.min(1,bent.dot(tangent)/tangent.lengthSq()));
    const d=bent.addScaledVector(tangent,-t).lengthSq();
    if(d<best){closest=i;weight=t;best=d;}
  }
  return {ring:closest,weight};
}

export function prepareDragon(mesh,joints) {
  mesh.traverse(part=>{if(part.isMesh)part.material=skyMaterial(part.material);});
  const skin=dragonSkin(mesh.getObjectByName('龍の胴'));
  const plume=dragonSkin(mesh.getObjectByName('尾先の筆毛'));
  const hair=Array.from({length:plume.rest.count},(_,i)=>plumeBinding(vector.fromBufferAttribute(plume.rest,i)));
  const ornaments=joints.trunk.children.filter(piece=>piece.isGroup).map(piece=>{
    piece.updateMatrix();
    piece.matrixAutoUpdate=false;
    return {piece,bind:piece.matrix.clone(),ring:nearestSection(piece.position)};
  });
  const frames=dragonRings.map(()=>({matrix:new T.Matrix4(),normal:new T.Matrix3(),offset:{}}));
  joints.flight={skin,plume,hair,ornaments,frames,dispose() {
    // These two deformed buffers belong to this rig. Its contour shares the
    // skin buffer, while the rest shape and all paint are shared by other rigs.
    skin.geometry.dispose();
    plume.geometry.dispose();
  }};
}

function updateFrames(frames,phase) {
  const last=frames.length-1;
  for(let i=0;i<=last;i++)dragonWave(dragonRings[i].waveZ,phase,frames[i].offset);
  for(let i=0;i<=last;i++) {
    const prev=Math.max(0,i-1),next=Math.min(last,i+1),r=dragonRings[i];
    const {matrix,normal,offset}=frames[i],a=frames[prev].offset,b=frames[next].offset;
    tangent.subVectors(dragonRings[next],dragonRings[prev]);tangent.z*=dragonLengthScale;
    bent.copy(tangent);bent.x+=b.x-a.x;bent.y+=b.y-a.y;
    orientation.setFromUnitVectors(tangent.normalize(),bent.normalize());
    // S⁻¹ R S rotates a section in real space inside the pitched, elongated trunk.
    matrix.makeRotationFromQuaternion(orientation).premultiply(local).multiply(physical);
    vector.copy(r).applyMatrix4(matrix);
    matrix.setPosition(r.x+offset.x-vector.x,r.y+offset.y-vector.y,r.z-vector.z);
    normal.getNormalMatrix(matrix);
  }
}

function poseSurface(surface,frames,hair) {
  const {rest,normals,pos,normal}=surface;
  for(let i=0;i<rest.count;i++) {
    const binding=hair?.[i], index=binding?binding.ring:Math.floor(i/33), frame=frames[index];
    vector.fromBufferAttribute(rest,i).applyMatrix4(frame.matrix);
    if(binding)vector.lerp(second.fromBufferAttribute(rest,i).applyMatrix4(frames[index+1].matrix),binding.weight);
    pos.setXYZ(i,vector.x,vector.y,vector.z);
    vector.fromBufferAttribute(normals,i).applyMatrix3(frame.normal);
    if(binding)vector.lerp(second.fromBufferAttribute(normals,i).applyMatrix3(frames[index+1].normal),binding.weight);
    vector.normalize();
    normal.setXYZ(i,vector.x,vector.y,vector.z);
  }
  pos.needsUpdate=true;normal.needsUpdate=true;
}

export function poseDragon(j,n,time) {
  j.trunk.rotation.x=dragonPitch(n);
  const phase=dragonPhase(time,n),{skin,plume,hair,ornaments,frames}=j.flight;
  updateFrames(frames,phase);
  poseSurface(skin,frames);
  poseSurface(plume,frames,hair);
  for(const {piece,bind,ring} of ornaments) {
    piece.matrix.multiplyMatrices(frames[ring].matrix,bind);
    piece.matrixWorldNeedsUpdate=true;
  }
  // Retain the root of each fine stroke as the wind lifts its tip. The
  // dragon occasionally draws a breath, separating the lower tusks in profile.
  j.lowerJaw.rotation.x=.018+.080*(.5+.5*Math.sin(phase*.63))**4;
  for(const side of [-1,1]) {
    const whisker=j['barbel'+side];
    whisker.rotation.z=side*(.045*Math.sin(phase*1.6+side*.37)+.022*Math.sin(phase*.78));
    whisker.rotation.y=side*.052*Math.sin(phase*1.17+side*.61);
    const fore=j['foreClaw'+side],hind=j['hindClaw'+side],stroke=phase+side*1.27;
    fore.rotation.x=.12*Math.sin(stroke);
    fore.rotation.z=side*(.035+.088*Math.cos(stroke));
    hind.rotation.x=.11*Math.sin(stroke-2.1);
    hind.rotation.z=side*.068*Math.cos(stroke-2.1);
  }
}
