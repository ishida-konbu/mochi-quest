// Transport every cross-section, its ink normals and the ornaments on its
// spine together. Geometry also deforms in the shadow pass and atlas baker.
import * as T from './vendor/three.module.min.js';
import { dragonWave, dragonPhase, dragonPitch } from './animal-motion.js';

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
  const hide=dragonSkin(mesh.getObjectByName('龍の胴'));
  joints.flight=hide;
  for(let i=0;i<19;i++) {
    const piece=i<18?joints['spine'+i]:joints.mask;
    const bind=piece.position.clone();
    let closest=0;
    for(let j=1;j<hide.rings.length;j++)
      if(bind.distanceToSquared(hide.rings[j])<bind.distanceToSquared(hide.rings[closest]))closest=j;
    piece.userData.flightBind=bind;piece.userData.ring=closest;
  }
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
  for(let i=0;i<19;i++) {
    const part=i<18?j['spine'+i]:j.mask, bind=part.userData.flightBind,r=part.userData.ring,center=rings[r];
    const q=rotation(rings[Math.min(last,r+1)],rings[Math.max(0,r-1)],phase);
    dragonWave(center.z,phase,offset);
    part.quaternion.copy(q);
    part.position.copy(bind).sub(center).applyQuaternion(q).add(center);
    part.position.x+=offset.x;part.position.y+=offset.y;
  }
}
