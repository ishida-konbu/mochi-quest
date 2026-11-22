// Transport every cross-section, its ink normals and the ornaments on its
// spine together. Geometry also deforms in the shadow pass and atlas baker.
import * as T from './vendor/three.module.min.js';
import { dragonWave, dragonPhase, dragonPitch } from './animal-motion.js';

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
  const rings=[], width=33;
  for(let k=0;k<rest.count;k+=width){
    const center=new T.Vector3();
    // All but the seam copy are evenly spaced on this ring.
    for(let j=k;j<k+width-1;j++) center.add(new T.Vector3().fromBufferAttribute(rest,j));
    center.divideScalar(width-1);
    rings.push(center);
  }
  return {geometry,rest,normals,pos,normal,rings,width};
}
const left={}, right={}, offset={}, tangent=new T.Vector3(), bent=new T.Vector3();
const orientation=new T.Quaternion(), vector=new T.Vector3();
function rotation(next, previous, phase) {
  tangent.subVectors(next,previous);
  dragonWave(previous.z,phase,left);dragonWave(next.z,phase,right);
  bent.copy(tangent);bent.x+=right.x-left.x;bent.y+=right.y-left.y;
  return orientation.setFromUnitVectors(tangent.normalize(),bent.normalize());
}
export function prepareDragon(mesh,joints) {
  mesh.traverse(part=>{if(part.isMesh)part.material=skyMaterial(part.material);});
  const hide=dragonSkin(mesh.getObjectByName('龍の胴'));
  joints.flight=hide;
  // Bind every spine ornament, including the brush at the tail tip, to
  // its transverse section. Keep the sculptor's local frame on the curve.
  hide.ornaments=joints.trunk.children.filter(piece=>piece.isGroup).map(piece=>{
    const bind=piece.position.clone();
    let closest=0;
    for(let j=1;j<hide.rings.length;j++)
      if(bind.distanceToSquared(hide.rings[j])<bind.distanceToSquared(hide.rings[closest]))closest=j;
    return {piece,bind,rotation:piece.quaternion.clone(),ring:closest};
  });
}
export function poseDragon(j,n,time) {
  j.trunk.rotation.x = dragonPitch(n);
  const phase=dragonPhase(time,n), {rings,width,rest,normals,pos,normal}=j.flight;
  const last=rings.length-1;
  for(let r=0;r<=last;r++){
    const center=rings[r];
    const q=rotation(rings[Math.min(last,r+1)],rings[Math.max(0,r-1)],phase);
    dragonWave(center.z,phase,offset);
    for(let k=r*width;k<(r+1)*width;k++){
      vector.fromBufferAttribute(rest,k).sub(center).applyQuaternion(q).add(center);
      pos.setXYZ(k,vector.x+offset.x,vector.y+offset.y,vector.z);
      vector.fromBufferAttribute(normals,k).applyQuaternion(q);
      normal.setXYZ(k,vector.x,vector.y,vector.z);
    }
  }
  pos.needsUpdate=true;normal.needsUpdate=true;
  for(const {piece:part,bind,rotation:restRotation,ring:r} of j.flight.ornaments) {
    const center=rings[r];
    const q=rotation(rings[Math.min(last,r+1)],rings[Math.max(0,r-1)],phase);
    dragonWave(center.z,phase,offset);
    part.quaternion.copy(q).multiply(restRotation);
    part.position.copy(bind).sub(center).applyQuaternion(q).add(center);
    part.position.x+=offset.x;part.position.y+=offset.y;
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
