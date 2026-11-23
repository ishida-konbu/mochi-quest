import { Group, MathUtils, Quaternion, Vector3 } from './vendor/three.module.min.js';
import { storyGrip, poseStoryHands } from './story-models.js';

const vec=()=>new Vector3();
const nose = {
  '狐':['mask',0,-.017,.398], '鹿':['mask',0,.672,.816], '猪':['mask',0,-.163,.653],
  '牛':['head',-.045,-.107,.742], '亀':['turtleNeck',0,.398,.778], '丹頂':['襟首',0,.54,.42],
  '鶏':['head',0,.344,.269], '鯛':['bream-fin',.478,.107,-.16],
  '老婆餅':[null,.43,.52,.49], '僧侶餅':[null,.48,.75,.39]
};
const fieldHands=new WeakMap();
export function hands(speaker){
  const {actor,person}=speaker;
  if(fieldHands.has(actor))return fieldHands.get(actor);
  const right=storyGrip(actor),left=storyGrip(actor,'left');
  if(right){
    const torso=actor.getObjectByName('torso'),rest=new Quaternion(),last=new Quaternion();
    let leaned=false;
    const limb={right,left,restore(){
      if(leaned && torso.quaternion.angleTo(last)<.00001)torso.quaternion.copy(rest);
      leaned=false;
    },pose(r,l,support){
      this.restore();
      poseStoryHands(actor,{right:r,left:l,support});
      if(!torso || !r)return;
      // With the feet planted, let the shoulder follow a hand that has just
      // reached its limit. The bend comes from the waist of the actual coat.
      const goal=torso.parent.worldToLocal(r.clone());
      const error=goal.sub(torso.parent.worldToLocal(right.getWorldPosition(vec())));
      if(error.lengthSq()<.0004)return;
      rest.copy(torso.quaternion);
      torso.rotation.x+=MathUtils.clamp(error.z,-.12,.27);
      torso.rotation.z-=MathUtils.clamp(error.x,-.22,.22);
      last.copy(torso.quaternion);leaned=true;
      poseStoryHands(actor,{right:r,left:l,support});
    }};
    fieldHands.set(actor,limb);return limb;
  }
  const [name,x,y,z]=nose[person.species] || [null,0,.65,.38];
  const joint=(name && actor.getObjectByName(name)) || actor;
  const grip=new Group();grip.position.set(x,y,z);joint.add(grip);
  // Hoofed witnesses demonstrate with the muzzle, birds with a bill or fin.
  // Their existing neck joint remains attached to the original body.
  const rest=new Quaternion(),posed=new Quaternion();let applied=false;
  const limb={right:grip,left:null,restore(){
    this.face?.restoreNeck();
    if(applied && joint.quaternion.angleTo(posed)<.00001)joint.quaternion.copy(rest);
    applied=false;
  },pose(r,l,support,reachAngle=.46){
    this.restore();
    if (!r || joint===actor) return;
    const local=joint.worldToLocal(r.clone());
    const bind=grip.position.clone().normalize();
    if (local.lengthSq()<.001) return;
    const turn=new Quaternion().setFromUnitVectors(bind,local.normalize());
    rest.copy(joint.quaternion);
    joint.quaternion.multiply(new Quaternion().slerp(turn,Math.min(1,reachAngle/(turn.angleTo(new Quaternion()) || 1))));
    posed.copy(joint.quaternion);applied=true;
  }};
  fieldHands.set(actor,limb);return limb;
}
