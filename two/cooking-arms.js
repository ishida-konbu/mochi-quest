import {Euler,MathUtils,Matrix4,Object3D,Quaternion,Vector3} from './vendor/three.module.min.js';
import {workingHandSkin} from './working-hand-skin.js';

// The contact is an actual painted vertex on the front of the artist's mitt.
// Keep it on the original skin for the normal cake and the short kagami tier.
function palmVertex(body,hand,plane=false){
  const {position,skinIndex,skinWeight}=body.geometry.attributes;
  const joint=body.skeleton.bones.indexOf(hand),side=hand.name==='Hand_R'?-1:1;
  const mark=plane?new Vector3(side*1.010,.594,.739):new Vector3(side*1.09,.72,.73);
  const p=new Vector3();
  let best=Infinity,vertex;
  for(let i=0;i<position.count;i++){
    if(skinIndex.getX(i)!==joint || skinWeight.getX(i)<.72)continue;
    const d=p.fromBufferAttribute(position,i).distanceToSquared(mark);
    if(d<best){best=d;vertex=i;}
  }
  return vertex;
}

export function makeCookingArms({root,pose,rice}){
  const {body}=rice;
  const working=workingHandSkin(body);
  const result=rice.hands.map((hand,i)=>{
    const travelVertex=palmVertex(body,hand),planeVertex=palmVertex(body,hand,true);
    const sign=i?1:-1;
    // Mark the inside of the painted pad as well as the ordinary forward
    // contact. When cupping a piece, these points meet across the food.
    const {position,normal,skinIndex,skinWeight}=working.attributes;
    const p=new Vector3(),n=new Vector3();
    const joint=body.skeleton.bones.indexOf(hand);
    const socket=new Object3D();socket.name=hand.name.replace('Hand','Shoulder');
    const collar=working.userData.wristCollars[i];
    const socketRest=new Vector3(),socketArch=new Vector3();
    const arch=working.morphAttributes.position.find(shape=>shape.name==='kagamiShoulder');
    for(const id of collar){
      socketRest.add(p.fromBufferAttribute(position,id));
      socketArch.add(p.fromBufferAttribute(arch,id));
    }
    socketRest.divideScalar(collar.length);socketArch.divideScalar(collar.length);
    hand.add(socket);
    let inside=travelVertex,bottom=travelVertex,underside=travelVertex,score=-Infinity,underScore=-Infinity;
    const padVertices=new Set();
    const tangent=new Vector3(-sign*Math.cos(1.065),0,Math.sin(1.065));
    for(const id of working.index.array.subarray(working.userData.torsoIndexCount)){
      if(id>=body.geometry.attributes.position.count || skinIndex.getX(id)!==joint || skinWeight.getX(id)!==1)continue;
      padVertices.add(id);
      p.fromBufferAttribute(position,id);n.fromBufferAttribute(normal,id);
      const d=p.dot(tangent)+.10*n.dot(tangent)-1.2*(p.y-.73)**2;
      if(d>score){score=d;inside=id;}
      if(p.y<position.getY(bottom))bottom=id;
      const under=.65*p.dot(tangent)-p.y;
      if(under>underScore){underScore=under;underside=id;}
    }
    let vertex=travelVertex;
    const marks={inside,bottom,underside};
    let faced=false,hooked=false;
    const actual=new Vector3(),delta=new Vector3(),origin=new Vector3(),end=new Vector3(),angles=new Euler();
    const toActor=new Matrix4(),unlean=new Matrix4(),turn=new Matrix4(),local=new Matrix4();
    const bindToHand=new Matrix4().multiplyMatrices(body.skeleton.boneInverses[joint],body.bindMatrix);
    const handToBind=bindToHand.clone().invert(),orthogonal=new Quaternion(),scale=new Vector3();
    const bind=new Vector3().setFromMatrixPosition(body.skeleton.boneInverses[joint].clone().invert());
    function turnSocket(angle,planing,face,tuck=0){
      socket.position.copy(socketRest).addScaledVector(socketArch,Number(rice.kagami?.stack.visible===true)).applyMatrix4(bindToHand);
      hooked=face==='tangent';
      faced=face==='bottom' || face==='underside' || hooked;
      vertex=planing?planeVertex:marks[face]??travelVertex;
      // The travelling cake is slightly wider across than from front to
      // back. Slide the intact patch along that ellipse, including its root.
      const a=-sign*MathUtils.clamp(angle,0,.95),c=Math.cos(a),s=Math.sin(a);
      const x=bind.x*c+bind.z*s,z=bind.z*c-bind.x*s;
      const moved=Math.atan2(sign*x,z),home=Math.atan2(sign*bind.x,bind.z);
      const dr=.13*(Math.sin(moved)**2-Math.sin(home)**2);
      const f=1+dr/Math.hypot(x,z);
      hand.position.x+=x*f-bind.x;hand.position.z+=z*f-bind.z;
      hand.rotateY(a);
      // Rest the spare mitt against the upper flank while the other hand
      // reaches across hot cookware. The whole shoulder carries the mitt.
      hand.position.y+=.34*tuck;
      hand.position.x-=sign*.07*tuck;
      hand.position.z-=.21*tuck;
    }
    function read(space,out){
      return space.worldToLocal(body.localToWorld(body.getVertexPosition(vertex,out)));
    }
    function orient(amount,size,curl,wristRoll,contactNormal){
      // Roll the intact pad around its contact point in actor space. This
      // keeps even a flattened kagami mitt rigid as it turns on the handle.
      const space=hand.parent;
      toActor.copy(root.matrixWorld).invert().multiply(space.matrixWorld);
      const pitch=(faced?0:MathUtils.clamp(curl?.z??0,-1,1)*.14)+(wristRoll??0);
      const cant=faced?0:MathUtils.clamp(-(curl?.x??0),-1,1)*.10;
      turn.makeRotationFromEuler(angles.set(pitch*amount,0,cant*amount));
      if(faced || wristRoll!==undefined){
        unlean.makeRotationFromQuaternion(pose.quaternion).transpose();
        turn.multiply(unlean);
      }
      // Remove any incidental shear from breathing, or from a wrist
      // turning under the anisotropic scale of the upper kagami cake.
      // Reapply that costume's fixed dimensions in the mitt's own frame.
      local.copy(toActor).multiply(hand.matrix).multiply(bindToHand);
      orthogonal.setFromRotationMatrix(unlean.extractRotation(local)).normalize();
      local.makeRotationFromQuaternion(orthogonal).scale(scale.copy(rice.model.scale).multiplyScalar(size));
      turn.multiply(local).multiply(handToBind);
      hand.matrixAutoUpdate=false;
      hand.matrix.copy(local.copy(toActor).invert().multiply(turn)).setPosition(hand.position);
      hand.updateWorldMatrix(false,false);
      if(hooked && contactNormal){
        // Find the tangent point on the painted mitt as the wrist rolls
        // around the grip. The whole pad stays on its side of the wood.
        const plane=n.copy(contactNormal).negate().transformDirection(
          local.copy(toActor).multiply(hand.matrix).multiply(bindToHand).transpose());
        let highest=-Infinity;
        for(const id of padVertices){
          const height=p.fromBufferAttribute(position,id).dot(plane);
          if(height>highest){highest=height;vertex=id;}
        }
        read(root,actual);
      }
    }
    const beforeGrip=new Matrix4();
    function preview(root,out,work,size,palm,yaw){
      if(!hooked || !palm)return read(root,out);
      // Aim the shoulder at the same point on the turned mitt that will
      // take the weight. Restore the bone before applying the torso bend.
      const [x,y,z]=palm.normal,c=Math.cos(yaw),s=Math.sin(yaw);
      beforeGrip.copy(hand.matrix);hand.matrixAutoUpdate=false;
      orient(work,size,null,palm.wristRoll,n.set(x*c-z*s,y,x*s+z*c));
      read(root,out);
      hand.matrix.copy(beforeGrip);hand.matrixAutoUpdate=true;hand.updateWorldMatrix(false,false);
      return out;
    }
    function reach(target,work,size,curl,wristRoll,contactNormal){
      const amount=Math.max(0,Math.min(1,work));
      read(root,actual);
      orient(amount,size,curl,wristRoll,contactNormal);
      // Translate the socket, not its tip. A loose prop can follow a
      // modest residual reach; fixed work must be staged at arm's length.
      delta.subVectors(target,actual).clampLength(0,.185*size*rice.model.scale.x/.708).multiplyScalar(amount);
      read(root,origin);
      end.copy(actual).add(delta);
      hand.parent.worldToLocal(root.localToWorld(end));
      hand.parent.worldToLocal(root.localToWorld(origin));
      hand.matrix.setPosition(end.sub(origin).add(hand.position));
      hand.updateWorldMatrix(false,false);
    }
    return {get vertex(){return vertex;},turnSocket,read,preview,reach};
  });
  body.geometry=working;
  const first=body.morphTargetInfluences.length;
  for(let i=first;i<working.morphAttributes.position.length;i++){
    body.morphTargetDictionary[working.morphAttributes.position[i].name]=i;
    body.morphTargetInfluences.push(0);
  }
  return result;
}
