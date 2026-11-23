import * as T from './vendor/three.module.min.js';

// The old residents carry their sleeves, fingers and tools in one upper-arm
// group. Bind the sleeve and paw to the measured elbow only for an actor that
// takes part in a close study. Geometry on other copies stays untouched.
const bindings=new WeakMap(),sceneHands=new WeakMap();
export function connectSceneHands(actor,rig){sceneHands.set(actor,rig);}

// Gate and temple residents use the same distance-driven shuffle both when
// coming to the desk and when carrying a tool back to their usual post.
export function workshopStride(actor,time){
  const {x,z}=actor.position;
  const gait=actor.userData.workshopGait ??= {x,z,time,phase:0,amount:0};
  const d=Math.hypot(x-gait.x,z-gait.z),dt=time-gait.time;
  if(dt>0 && dt<.25 && d<.55 && actor.userData.storyAway){
    gait.phase+=d*Math.PI/.24;
    gait.amount=T.MathUtils.damp(gait.amount,Math.min(1,d/(dt*.85)),14,dt);
  }else gait.amount=0;
  gait.x=x;gait.z=z;gait.time=time;
  return Math.sin(gait.phase)*gait.amount;
}
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
    const grip=new T.Group();grip.name=side==='right'?'作業右掌':'作業左掌';grip.position.fromArray(paw);
    // Grip at the base of the visible fingers, clear of the solid palm.
    grip.position.z+=monkey?.037:type==='frog'?.061:.049;
    joint.add(grip);
    hands[side]={joint,grip,elbow,tool:held,rest:grip.position.clone(),l1:elbow.length(),l2:elbow.distanceTo(grip.position)};
  }
  bindings.set(root,hands);
}
export function storyGrip(root,side='right'){return bindings.get(root)?.[side]?.grip??flexBindings.get(root)?.[side]?.grip??sceneHands.get(root)?.[side]?.grip??null;}
export function storyTool(root,side='right'){return bindings.get(root)?.[side]?.tool??flexBindings.get(root)?.[side]?.tool??sceneHands.get(root)?.[side]?.tool??null;}
// Bind the tool's wrist before a worker frees that hand. Lazy binding later
// in the score must not take a holstered implement back from its belt loop.
export function bindToolWrist(actor,tool){
  const hand=Object.values(bindings.get(actor) || {}).find(h=>h.tool===tool);
  if(hand && !hand.hinge){bindArm(hand);actor.userData.rigRevision=(actor.userData.rigRevision || 0)+1;}
}
const want=new T.Vector3(),direction=new T.Vector3(),normal=new T.Vector3(),elbowNew=new T.Vector3(),aim=new T.Vector3(),foreBind=new T.Vector3();
const rotation=new T.Quaternion();
const elbowPlane=new T.Vector3(), candidate=new T.Vector3(), sleeve=new T.Vector3();
const bendAngles=[0,.45,-.45,.88,-.88,1.38,-1.38,1.92,-1.92,2.52,-2.52,Math.PI];
function bendElbow(hand,along,height,support){
  const {joint}=hand;
  let least=Infinity;
  for(const turn of bendAngles){
    elbowPlane.copy(normal).applyAxisAngle(direction,turn);
    candidate.copy(direction).multiplyScalar(along).addScaledVector(elbowPlane,height);
    // Keep the elbow on the outside of the ribcage for a cross-body reach.
    // Test in the shoulder's local axes, even on a mirrored artisan.
    const lateral=(joint.position.x+candidate.x)*Math.sign(joint.position.x);
    const chest=candidate.z<.13 ? Math.max(0,Math.abs(joint.position.x)*.8-lateral) : 0;
    let depth=0;
    if(support){
      // A sleeve is thicker at the elbow. Sample both elbow and forearm
      // before choosing a pole on the anatomically valid bend circle.
      sleeve.copy(candidate).add(joint.position).applyMatrix4(joint.parent.matrixWorld);
      depth=support(sleeve,.073);
      sleeve.copy(want).lerp(candidate,.54).add(joint.position).applyMatrix4(joint.parent.matrixWorld);
      depth=Math.max(depth,support(sleeve,.05));
    }
    const cost=depth*5+chest*2+Math.abs(turn)*.002;
    if(cost<least){elbowNew.copy(candidate);least=cost;}
    if(cost===0)break;
  }
}

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
    want.copy(direction).multiplyScalar(reach);
    bendElbow(hand,along,Math.sqrt(Math.max(0,l1*l1-along*along)),targets?.support);
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
