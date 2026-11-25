import { Vector3 } from './vendor/three.module.min.js';
import { makeHero } from './actors.js';
import { poseRice } from './mochi-model.js';
import { makeCookingArms } from './cooking-arms.js';

const clamp = (value,lo,hi) => Math.max(lo,Math.min(hi,value));

// Each probe belongs to the actual painted surface. A wrist joint is inside
// the cheek and a foot joint is above the sole, especially on the kagami rig.
function soleContact(body,bone) {
  const {position,skinIndex,skinWeight}=body.geometry.attributes;
  const joint=body.skeleton.bones.indexOf(bone),candidates=[];
  for(let i=0;i<position.count;i++){
    if(skinIndex.getX(i)===joint && skinWeight.getX(i)>.72)candidates.push(i);
  }
  candidates.sort((a,b)=>position.getY(a)-position.getY(b));
  const vertices=candidates.slice(0,8);
  return {bone,vertices,weight:vertices.reduce((sum,i)=>sum+skinWeight.getX(i),0)/vertices.length};
}

// Creating a second full skinned character is relatively expensive on a
// phone. Only one cook can be on screen; reuse that instance between meals.
let idleCook;
export function createCookingPerformer(parent,player) {
  const hero=idleCook || makeHero();
  idleCook=null;
  const {root,pose,rice}=hero;
  const arms=hero.cookingArms ??= makeCookingArms(hero);
  const sole=hero.cookingSoles ??= rice.legs.map(leg=>soleContact(rice.body,leg));
  const pad=new Vector3(),restPad=new Vector3();
  root.name='台所に立つお餅の配達人';
  parent.add(root);
  const goal=new Vector3(),point=new Vector3(),mean=new Vector3(),aim=new Vector3();
  const skin={mode:player.mode,buffs:player.buffs,grounded:true,gestureSample:{time:0,weight:1}};
  const giant=player.buffs?.full>0?1.28:1;
  let active=true,previousTime,previousCut;
  const previousPlace=new Vector3();
  function solve(probe,where) {
    mean.set(0,0,0);
    for(const i of probe.vertices)mean.add(rice.body.getVertexPosition(i,point));
    mean.multiplyScalar(1/probe.vertices.length);
    const base=probe.bone.parent;
    base.worldToLocal(rice.body.localToWorld(mean));
    goal.fromArray(where);
    base.worldToLocal(parent.localToWorld(goal));
    probe.bone.position.addScaledVector(goal.sub(mean),1/probe.weight);
    probe.bone.updateWorldMatrix(false,false);
  }
  function update(frame) {
    const {time,heading,lean,lift,effort,hero:position}=frame;
    root.position.fromArray(position);
    root.rotation.y=heading;
    skin.gestureSample.time=time;
    skin.gestureSample.smile=frame.phase==='finish'?1:.25;
    // A planted stroke loads the same damped squash as a landing. The tool
    // can stop at the board while the weight behind it is still settling.
    skin.workStrain=clamp(.60*lift-.083*effort,-.15,.09);
    const elapsed=time-previousTime;
    const seek=previousTime===undefined || elapsed<0 || elapsed>.30 || previousCut!==frame.index;
    const dt=seek?0:elapsed;
    if(seek){
      rice.press=skin.workStrain;rice.velocity=0;rice.pull=0;rice.pullV=0;
      rice.step=time*2.4;skin.speed=0;
    }else if(dt>0){
      skin.speed=clamp(Math.hypot(position[0]-previousPlace.x,position[2]-previousPlace.z)/dt,0,4.5);
    }
    previousTime=time;previousCut=frame.index;previousPlace.copy(root.position);
    const weight=poseRice(rice,skin,time,dt,'curious',null,false);
    pose.scale.set(giant*weight.width,giant*weight.stretch,giant*weight.width);
    // Shift weight towards the working hands; the soles remain independently
    // planted and the head turns to follow the bowl, mallet or serving dish.
    const dx=frame.focus[0]-position[0],dz=frame.focus[2]-position[2];
    const localX=dx*Math.cos(heading)-dz*Math.sin(heading);
    const work=clamp(lean*5,0,1);
    pose.position.set(clamp(localX,-.52,.52)*work*.23,lift*.40,.07*work);
    pose.rotation.set(lean*.79,0,-.075*clamp(localX,-.8,.8)*work);
    rice.chest.rotateX(.16*lean);
    rice.head.rotateY(clamp(localX*.40,-.26,.26));
    aim.fromArray(frame.focus);
    rice.head.rotateX(clamp((position[1]+giant*1.20-aim.y)*.20,-.13,.17)+lean*.18);
    root.updateWorldMatrix(true,false);
    root.updateMatrixWorld(true);
    const c=Math.cos(heading),s=Math.sin(heading);
    const surface=frame.supportHeight?(x,z)=>frame.supportHeight(position[0]+x*c+z*s,position[2]-x*s+z*c)-position[1]:null;
    for(let i=0;i<2;i++){
      solve(sole[i],frame.feet[i]);
      pad.fromArray(frame.hands[i]);
      root.worldToLocal(parent.localToWorld(pad));
      if(frame.restHands)root.worldToLocal(parent.localToWorld(restPad.fromArray(frame.restHands[i])));
      arms[i].update(pad,giant,time,frame.index??frame.phase,surface,restPad,frame.handWork?.[i]);
    }
    hero.wrap.visible=player.buffs?.wrap>0;
    hero.wrap.scale.set(1.075,1,1.042);
    hero.leaves.visible=player.mode==='kusa';
    if(hero.leaves.visible){
      rice.body.getVertexPosition(hero.crown,hero.leaves.position);
      hero.rolling.worldToLocal(rice.body.localToWorld(hero.leaves.position));
    }
    for(const [i,wing] of hero.wingParts.entries()){
      wing.visible=player.mode==='habutae';
      wing.rotation.z=(i?1:-1)*(.10+.026*Math.sin(time*2.2));
    }
  }
  function dispose(){
    if(!active)return;
    active=false;
    root.removeFromParent();
    idleCook=hero;
  }
  return {group:root,update,dispose};
}
