// Resolve a loose utensil against the surface of the posed, skinned hand.
// Fixed supports remain the endpoints of a lift. The pestle turns about its
// head to keep the blow in the mortar and the hand on the shaft.
import {Vector3,Quaternion,Euler} from './vendor/three.module.min.js';
const hand=new Vector3(),origin=new Vector3(),mark=new Vector3(),toward=new Vector3(),delta=new Vector3();
const leftMark=new Vector3(),leftPad=new Vector3(),across=new Vector3(),tip=new Vector3(),handle=new Vector3();
const heldRotation=new Quaternion(),rotation=new Quaternion(),arc=new Quaternion(),blend=new Quaternion(),euler=new Euler();
const up=new Vector3(0,1,0);
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{const f=clamp(x);return f*f*(3-2*f);};
const place=(p,amt)=>p.map((v,k)=>v+delta.getComponent(k)*amt);

function liftFromRest(places,p){
  const d=Math.min(...places.map(({position:q})=>Math.hypot(p[0]-q[0],p[1]-q[1],p[2]-q[2])));
  return smooth(d/.095);
}
function supportHeight(worktops,[x,,z]){
  let nearest=Infinity,height;
  for(const [cx,y,cz] of worktops){
    const distance=(cx-x)**2+(cz-z)**2;
    if(distance<nearest){nearest=distance;height=y;}
  }
  return height;
}

export function fitCookingGrip(frame,actual){
  if(!actual)return frame;
  const [from,to,f]=frame.contact;
  const result={...frame,hands:actual,tools:{...frame.tools}};
  hand.fromArray(actual[0]);
  const names=new Set([from?.tool,to?.tool].filter(Boolean));
  for(const name of names){
    const a=from?.tool===name,b=to?.tool===name;
    const held=(a?1-f:0)+(b?f:0);
    if(held===0)continue;
    const raw=frame.tools[name],weight=smooth(held)*liftFromRest(frame.restingPlaces[name],raw.position);
    if(!weight)continue;
    const offset=a&&b?from.offset.map((v,k)=>v+(to.offset[k]-v)*f):(a?from:to).offset;
    mark.fromArray(offset);
    if(raw.scale)mark.multiply(toward.fromArray(raw.scale));
    rotation.setFromEuler(euler.set(...raw.rotation));mark.applyQuaternion(rotation);
    origin.fromArray(raw.position);
    delta.copy(hand).sub(origin).sub(mark);
    const [first,last]=frame.supportContact;
    const support=first?.tool===name?first:last;
    if(support?.tool===name){
      // Carry from both contact points on the shaft, vessel or cloth. Match the direction between the palms
      // first, then place the midpoint so neither side trails the vessel.
      leftMark.fromArray(support.offset);
      if(raw.scale)leftMark.multiply(toward.fromArray(raw.scale));
      leftMark.applyQuaternion(rotation);
      leftPad.fromArray(actual[1]);
      across.copy(mark).sub(leftMark).normalize();
      toward.copy(hand).sub(leftPad).normalize();
      arc.setFromUnitVectors(across,toward);
      rotation.premultiply(blend.identity().slerp(arc,weight));
      mark.add(leftMark).multiplyScalar(.5).applyQuaternion(blend);
      delta.copy(hand).add(leftPad).multiplyScalar(.5).sub(mark).sub(origin);
      if(name==='mallet' && frame.food.compression>0){
        // The end face seats in the yielding rice. Swivel the shaft about
        // that contact towards the middle of the two painted palms.
        heldRotation.copy(rotation);
        rotation.setFromEuler(euler.set(...raw.rotation));
        tip.set(.165,0,0).applyQuaternion(rotation).add(origin);
        handle.fromArray(offset).add(leftMark.fromArray(support.offset)).multiplyScalar(.5);
        toward.copy(handle).applyQuaternion(rotation).add(origin).sub(tip).normalize();
        across.copy(hand).add(leftPad).multiplyScalar(.5).sub(tip).normalize();
        rotation.premultiply(arc.setFromUnitVectors(toward,across));
        const seat=frame.food.compression;
        heldRotation.slerp(rotation,seat);rotation.copy(heldRotation);
        across.set(.165,0,0).applyQuaternion(rotation);
        delta.lerp(tip.sub(across).sub(origin),seat);
      }
      result.tools[name]={...raw,rotation:euler.setFromQuaternion(rotation).toArray().slice(0,3),
        position:place(raw.position,weight)};
    }else{
      let carry=weight,angles=raw.rotation;
      if(name==='paddle' && ['grill','plate'].includes(frame.phase)){
        // The thin end has to pass under the cake before it leaves the
        // board. Keep the working end on that surface while taking its weight.
        const high=supportHeight(frame.worktops,raw.position);
        carry*=smooth((raw.position[1]-high-.035)/.13);
        // The blade can pivot flat on the grate or board as the wrist turns
        // the handle. Keep its support point fixed while bringing the handle
        // around to the palm, even when there is no room to translate it.
        toward.copy(hand).sub(origin);
        const yaw=Math.atan2(mark.z*toward.x-mark.x*toward.z,mark.x*toward.x+mark.z*toward.z);
        rotation.premultiply(arc.setFromAxisAngle(up,yaw*(weight-carry)));
        angles=euler.setFromQuaternion(rotation).toArray().slice(0,3);
        mark.fromArray(offset).applyQuaternion(rotation);
        delta.copy(toward).sub(mark);
        const p=frame.piece.position;
        if(Math.hypot(p[0]-origin.x,p[2]-origin.z)<.10 && Math.abs(p[1]-origin.y)<.06){
          result.piece={...frame.piece,position:place(p,carry)};
        }
      }
      result.tools[name]={...raw,position:place(raw.position,carry),rotation:angles};
    }
  }
  if(frame.phase==='plate' && (from?.piece || to?.piece)){
    const p=frame.piece.position,amount=(from?.piece?1-f:0)+(to?.piece?f:0);
    delta.copy(hand).sub(mark.fromArray(frame.hands[0]));
    leftPad.fromArray(actual[1]).sub(mark.fromArray(frame.hands[1]));
    delta.add(leftPad).multiplyScalar(.5);
    const lift=smooth((p[1]-supportHeight(frame.worktops,p)-.012)/.12);
    result.piece={...frame.piece,position:place(p,lift*amount)};
  }
  return result;
}
