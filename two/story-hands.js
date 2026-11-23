import * as T from './vendor/three.module.min.js';

// The old residents carry their sleeves, fingers and tools in one upper-arm
// group. Bind the sleeve and paw to the measured elbow only for an actor that
// takes part in a close study. Geometry on other copies stays untouched.
const bindings=new WeakMap(),sceneHands=new WeakMap();
export function connectSceneHands(actor,rig){sceneHands.set(actor,rig);}
const vec=a=>new T.Vector3(...a);
const sides=['right','left'];
const origin=new T.Vector3(), upper=new T.Vector3(), lower=new T.Vector3(), point=new T.Vector3();
function segmentDistance(p,a,b){
  upper.subVectors(b,a);
  const t=T.MathUtils.clamp(lower.subVectors(p,a).dot(upper)/upper.lengthSq(),0,1);
  return point.copy(a).addScaledVector(upper,t).distanceTo(p);
}
function bindArm(hand){
  const {joint,elbow,grip,tool}=hand;
  const base=new T.Bone(),hinge=new T.Bone();hinge.position.copy(elbow);base.add(hinge);
  const boneRig=new T.Skeleton([base,hinge]);
  // Skeleton inverse binds live in arm-local space, independently of the
  // character's placement in the travelling world.
  base.updateMatrixWorld(true);boneRig.calculateInverses();
  const p=new T.Vector3(),fore=new T.Vector3().subVectors(grip.position,elbow).normalize();
  for(const original of [...joint.children].filter(o=>o.isMesh && !o.isSkinnedMesh)){
    const g=original.geometry.clone(),position=g.attributes.position,indices=[],weights=[];
    for(let i=0;i<position.count;i++){
      p.fromBufferAttribute(position,i);
      const d0=segmentDistance(p,origin,elbow),d1=segmentDistance(p,elbow,grip.position);
      const transition=T.MathUtils.smoothstep(d0-d1,-.05,.06);
      const along=point.copy(p).sub(elbow).dot(fore);
      const w=along>.13?1:along<-.065?0:transition;
      indices.push(0,1,0,0);weights.push(1-w,w,0,0);
    }
    g.setAttribute('skinIndex',new T.Uint16BufferAttribute(indices,4));
    g.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
    const mesh=new T.SkinnedMesh(g,original.material);
    mesh.name=original.name;mesh.castShadow=original.castShadow;mesh.receiveShadow=original.receiveShadow;mesh.frustumCulled=false;
    mesh.bind(boneRig,new T.Matrix4());joint.remove(original);joint.add(mesh);
  }
  joint.add(base);joint.updateWorldMatrix(true,true);
  hinge.attach(grip);
  if(tool)hinge.attach(tool);
  hand.hinge=hinge;
}
export function connectStoryHands(root,type,limbs){
  const hands={};
  for(const [i,side] of sides.entries()){
    const s=i?-1:1,monkey=type==='monkey',joint=limbs['arm'+s];
    const paw=monkey?(s===1?[.148,-.091,.373]:[-.060,-.194,.368]):(s===1?[.24,-.105,.262]:[-.045,-.15,.19]);
    const elbow=vec(monkey?(s===1?[.171,-.275,.069]:[-.113,-.31,.067]):[s*(s===1?.16:.105),-.205,-.03]);
    const held=joint.children.find(o=>o.isGroup && o.visible);
    const grip=new T.Group();grip.name=side==='right'?'作業右掌':'作業左掌';grip.position.fromArray(paw);joint.add(grip);
    hands[side]={joint,grip,elbow,tool:held,rest:vec(paw),l1:elbow.length(),l2:elbow.distanceTo(vec(paw))};
  }
  bindings.set(root,hands);
}
export function storyGrip(root,side='right'){return bindings.get(root)?.[side]?.grip??flexBindings.get(root)?.[side]?.grip??sceneHands.get(root)?.[side]?.grip??null;}
export function storyTool(root,side='right'){return bindings.get(root)?.[side]?.tool??flexBindings.get(root)?.[side]?.tool??sceneHands.get(root)?.[side]?.tool??null;}
const want=new T.Vector3(),direction=new T.Vector3(),normal=new T.Vector3(),elbowNew=new T.Vector3(),aim=new T.Vector3(),foreBind=new T.Vector3();
const rotation=new T.Quaternion();
export function poseStoryHands(root,targets={}){
  const sceneRig=sceneHands.get(root);
  if(sceneRig){sceneRig.pose(targets);return true;}
  const hands=bindings.get(root);
  if(!hands){
    const limbs=flexBindings.get(root);if(!limbs)return false;
    for(const side of sides)if(limbs[side]){
      const first=targets?.[side] && !limbs[side].bones;
      placeAppendage(limbs[side],targets?.[side]);
      if(first)root.userData.rigRevision=(root.userData.rigRevision || 0)+1;
    }
    return true;
  }
  for(const side of sides){
    const hand=hands[side],target=targets?.[side];
    if(!target){hand.hinge?.quaternion.identity();continue;}
    if(!hand.hinge){
      bindArm(hand);root.userData.rigRevision=(root.userData.rigRevision || 0)+1;
    }
    const {joint,hinge,elbow,grip,rest,l1,l2}=hand;
    joint.parent.updateWorldMatrix(true,false);
    want.copy(target);joint.parent.worldToLocal(want).sub(joint.position);
    const distance=want.length();if(distance<.0001)continue;
    direction.copy(want).divideScalar(distance);
    const reach=T.MathUtils.clamp(distance,Math.abs(l1-l2)+.001,l1+l2-.002);
    // Transport the resting bend plane with the requested reach: fingers stay
    // forwards and the elbow stays outside the chest for a cross-body grasp.
    aim.copy(rest).normalize();
    normal.copy(elbow).addScaledVector(aim,-elbow.dot(aim)).normalize();
    rotation.setFromUnitVectors(aim,direction);normal.applyQuaternion(rotation);
    const along=(l1*l1-l2*l2+reach*reach)/(2*reach);
    elbowNew.copy(direction).multiplyScalar(along).addScaledVector(normal,Math.sqrt(Math.max(0,l1*l1-along*along)));
    joint.quaternion.setFromUnitVectors(aim.copy(elbow).normalize(),foreBind.copy(elbowNew).normalize());
    const lowerDirection=aim.copy(direction).multiplyScalar(reach).sub(elbowNew).normalize()
      .applyQuaternion(rotation.copy(joint.quaternion).invert());
    hinge.quaternion.setFromUnitVectors(foreBind.subVectors(rest,elbow).normalize(),lowerDirection);
    grip.updateWorldMatrix(true,false);
  }
  return true;
}

// A prehensile arm or trunk carries its own moving skin, including the original
// wrinkles, fins or both rows of suckers. Only pieces used in an enactment
// acquire a skeleton. A curled final segment holds its shape around the grip.
const flexBindings=new WeakMap(),hiddenSurface=new T.MeshBasicMaterial({visible:false});
const va=new T.Vector3(),vb=new T.Vector3(),vc=new T.Vector3(),targetLocal=new T.Vector3();
const dq=new T.Quaternion(),worldRotation=new T.Quaternion();
export function connectStoryAppendage(root,side,surface,path,graspIndex,tool=null){
  const nodes=path.slice(0,graspIndex+1).map(vec),grip=new T.Group();
  grip.name=side==='right'?'作業の主把持点':'作業の副把持点';grip.position.copy(nodes.at(-1));surface.add(grip);
  let set=flexBindings.get(root);if(!set){set={};flexBindings.set(root,set);}
  set[side]={surface,nodes,grip,tool};return grip;
}
function bindFlexible(hand){
  const {nodes,surface,grip}=hand,bones=[];
  for(let i=0;i<nodes.length;i++){
    const b=new T.Bone();b.position.copy(nodes[i]);if(i){b.position.sub(nodes[i-1]);bones[i-1].add(b);}bones.push(b);
  }
  bones[0].updateMatrixWorld(true);
  const skeleton=new T.Skeleton(bones);skeleton.calculateInverses();
  const geo=surface.geometry.clone(),pos=geo.attributes.position,ids=[],weights=[];
  for(let i=0;i<pos.count;i++){
    va.fromBufferAttribute(pos,i);
    let nearest=Infinity,start=0,t=0;
    for(let j=0;j<nodes.length-1;j++){
      const d=vb.subVectors(nodes[j+1],nodes[j]);
      const u=T.MathUtils.clamp(vc.subVectors(va,nodes[j]).dot(d)/d.lengthSq(),0,1);
      const distance=vc.copy(nodes[j]).addScaledVector(d,u).distanceToSquared(va);
      if(distance<nearest){nearest=distance;start=j;t=u;}
    }
    ids.push(start,start+1,0,0);weights.push(1-t,t,0,0);
  }
  geo.setAttribute('skinIndex',new T.Uint16BufferAttribute(ids,4));geo.setAttribute('skinWeight',new T.Float32BufferAttribute(weights,4));
  const skin=new T.SkinnedMesh(geo,surface.material);skin.frustumCulled=false;skin.castShadow=skin.receiveShadow=true;
  skin.bind(skeleton,new T.Matrix4());surface.material=hiddenSurface;surface.add(skin,bones[0]);
  bones.at(-1).add(grip);grip.position.set(0,0,0);
  hand.bones=bones;hand.reach=nodes.slice(1).reduce((n,p,i)=>n+p.distanceTo(nodes[i]),0);
}
function placeAppendage(hand,target){
  const {surface,grip}=hand;
  if(!target){hand.bones?.forEach(b=>b.quaternion.identity());return;}
  if(!hand.bones)bindFlexible(hand);
  const {bones,nodes}=hand;
  surface.updateWorldMatrix(true,false);
  // Clamp in local anatomical units, including small celebration guests.
  surface.worldToLocal(targetLocal.copy(target));
  va.subVectors(targetLocal,nodes[0]).clampLength(.001,hand.reach*.985);targetLocal.copy(nodes[0]).add(va);surface.localToWorld(targetLocal);
  for(const b of bones)b.quaternion.identity();
  for(let pass=0;pass<16;pass++){
    if(grip.getWorldPosition(vc).distanceToSquared(targetLocal)<.000002)break;
    for(let i=bones.length-2;i>=0;i--){
      const bone=bones[i],parent=bone.parent;
      bone.getWorldPosition(va);grip.getWorldPosition(vb).sub(va);vc.subVectors(targetLocal,va);
      if(vb.lengthSq()<.000001||vc.lengthSq()<.000001)continue;
      parent.getWorldQuaternion(worldRotation).invert();
      vb.applyQuaternion(worldRotation).normalize();vc.applyQuaternion(worldRotation).normalize();
      dq.setFromUnitVectors(vb,vc);bone.quaternion.premultiply(dq);
    }
  }
}
