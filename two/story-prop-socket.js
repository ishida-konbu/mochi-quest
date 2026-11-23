// The handle sits at the displayed part's centre of mass. Its authored joint
// may be at an edge, on a rotated wall or inside another scaled object.
import { Box3, Matrix4, Quaternion, Vector3 } from './vendor/three.module.min.js';

export function fitToSocket(handle,part,receiver,point,unit=1) {
  part.updateWorldMatrix(true,false);receiver.updateWorldMatrix(true,false);
  const offset=new Matrix4().makeScale(unit,unit,unit);
  if(point?.isMatrix4)offset.copy(point);
  else if(point)offset.setPosition(point);
  const partInHandle=handle.matrixWorld.clone().invert().multiply(part.matrixWorld);
  const local=handle.parent.matrixWorld.clone().invert().multiply(receiver.matrixWorld).multiply(offset).multiply(partInHandle.invert());
  const position=new Vector3(),rotation=new Quaternion(),scale=new Vector3();
  local.decompose(position,rotation,scale);
  const angle=handle.quaternion.clone(),fromScale=handle.scale.clone();
  return {position, pose(t){
    handle.quaternion.slerpQuaternions(angle,rotation,t);
    handle.scale.lerpVectors(fromScale,scale,t);
  }};
}

// A ledger opens on the worktop. The spine stays planted while one hand
// steadies it and the other raises the free corner. Loose papers can then
// settle flat again, leaving both hands free for the next exhibit.
export function turnWorkPage(handle,page,code,gesture){
  if(gesture!=='open' || code!=='ledger' || !['書付','開いた控え','見出しの表紙'].includes(page.name))return null;
  page.updateWorldMatrix(true,true);
  const bounds=new Box3(),local=new Matrix4(),inverse=page.matrixWorld.clone().invert();
  page.traverseVisible(mesh=>{
    if(!mesh.isMesh)return;
    if(!mesh.geometry.boundingBox)mesh.geometry.computeBoundingBox();
    bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(local.multiplyMatrices(inverse,mesh.matrixWorld)));
  });
  if(bounds.isEmpty())return null;
  const crease=bounds.getCenter(new Vector3()).setX(bounds.min.x);
  const corner=crease.clone().set(bounds.max.x,crease.y,crease.z+(bounds.max.z-crease.z)*.50);
  const axis=new Vector3(0,0,1).applyQuaternion(page.getWorldQuaternion(new Quaternion()))
    .applyQuaternion(handle.parent.getWorldQuaternion(new Quaternion()).invert());
  const start=handle.position.clone(),angle=handle.quaternion.clone();
  const fixed=handle.parent.worldToLocal(page.localToWorld(crease.clone()));
  return {pose(t){
    const bend=page.name==='見出しの表紙'?Math.PI*.98*t:.77*Math.sin(t*Math.PI);
    handle.position.copy(start);
    handle.quaternion.setFromAxisAngle(axis,bend).multiply(angle);
    const now=handle.parent.worldToLocal(page.localToWorld(crease.clone()));
    handle.position.add(fixed.clone().sub(now));
  },corner:()=>page.localToWorld(corner.clone()),spine:()=>page.localToWorld(crease.clone())};
}

// Find a nearby place for the actual article with the same worktop and
// obstacle solver as the lift. Preserve the point on its surface under the
// fingers while lowering it, including when the next beat has a new pivot.
export function placeWithinReach(handle,part,contact,restAngle,wrist,bareBoard=false){
  const point=()=>part.getWorldPosition(new Vector3()),from=point(),angle=part.getWorldQuaternion(new Quaternion());
  const patch=part.worldToLocal(contact.nearest(wrist.getWorldPosition(new Vector3())));
  const position=handle.position.clone(),rotation=handle.quaternion.clone();
  const parentAngle=handle.parent.getWorldQuaternion(new Quaternion());
  const delta=restAngle.clone().multiply(angle.clone().invert());
  handle.quaternion.premultiply(parentAngle.clone().invert().multiply(delta).multiply(parentAngle));
  if(bareBoard)contact.parkOnWorktop();
  else contact.restOnWorktop(1);
  const to=point();
  handle.position.copy(position);handle.quaternion.copy(rotation);handle.updateWorldMatrix(true,true);
  const span=.46+Math.min(.80,from.distanceTo(to)*.48);
  return {span,pose(t){
    const at=from.clone().lerp(to,t);
    at.y+=.025*Math.sin(Math.PI*t);
    part.position.copy(part.parent.worldToLocal(at));
    part.quaternion.copy(part.parent.getWorldQuaternion(new Quaternion()).invert())
      .multiply(angle.clone().slerp(restAngle,t));
    return part.localToWorld(patch.clone());
  }};
}

// A worker who has to use the same hands for the next article first puts
// down the one just inspected or received.
export function needsSetDown(beat,next) {
  if(!next || next.prop===beat.prop || beat.pose)return false;
  if(beat.gesture==='pass')return next.partner===beat.partner || next.actor===beat.partner;
  return ['lift','turn','present','open','pour'].includes(beat.gesture);
}
