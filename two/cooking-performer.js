import {Vector3} from './vendor/three.module.min.js';
import {makeHero} from './actors.js';
import {poseRice} from './mochi-model.js';
import {makeCookingArms} from './cooking-arms.js';
import {footfallShapes,leanToWork,workShapes} from './working-torso.js';

const clamp=(value,lo,hi)=>Math.max(lo,Math.min(hi,value));

function soleProbe(body,bone){
  const {position,skinIndex,skinWeight}=body.geometry.attributes;
  const joint=body.skeleton.bones.indexOf(bone),ids=[];
  for(let i=0;i<position.count;i++){
    if(skinIndex.getX(i)===joint && skinWeight.getX(i)>.72)ids.push(i);
  }
  ids.sort((a,b)=>position.getY(a)-position.getY(b));
  const vertices=ids.slice(0,8);
  return {bone,vertices,weight:vertices.reduce((sum,i)=>sum+skinWeight.getX(i),0)/vertices.length};
}

let idleCook;
export function createCookingPerformer(parent,player){
  const hero=idleCook || makeHero();
  idleCook=null;
  const {root,pose,rice}=hero;
  const upper=hero.workingBody??=rice.model.getObjectByName('Body');
  const belly=rice.chest.parent;
  for(const bone of [upper,belly])if(!rice.bones.includes(bone)){
    rice.bones.push(bone);
    rice.samples.push({p:bone.position.clone(),q:bone.quaternion.clone()});
  }
  const arms=hero.cookingArms??=makeCookingArms(hero);
  const soles=hero.cookingSoles??=rice.legs.map(leg=>soleProbe(rice.body,leg));
  const footfalls=footfallShapes.map(axes=>axes.map(name=>rice.body.morphTargetDictionary[name]));
  const pads=arms.map(()=>new Vector3()),rests=arms.map(()=>new Vector3());
  const grips=arms.map(()=>[0,0,0]),handVertices=arms.map(arm=>arm.vertex);
  const point=new Vector3(),mean=new Vector3(),end=new Vector3(),delta=new Vector3(),curl=new Vector3(),contactNormal=new Vector3();
  const skin={mode:player.mode,buffs:player.buffs,grounded:true,gestureSample:{time:0,weight:1}};
  const size=player.buffs?.full>0?1.28:1;
  const previousPlace=new Vector3(),crownRest=new Vector3();
  let previousTime,previousCut,active=true;
  pose.matrixAutoUpdate=false;
  root.name='台所に立つお餅の配達人';
  parent.add(root);

  function plant(probe,where,stepMorphs){
    const {bone,vertices}=probe;
    mean.set(0,0,0);
    for(const i of vertices)mean.add(rice.body.getVertexPosition(i,point));
    mean.divideScalar(vertices.length);
    parent.worldToLocal(rice.body.localToWorld(mean));
    end.fromArray(where);
    if(stepMorphs){
      rice.body.worldToLocal(parent.localToWorld(end));
      rice.body.worldToLocal(parent.localToWorld(mean));
      delta.subVectors(end,mean);
      for(const [axis,id] of stepMorphs.entries())rice.body.morphTargetInfluences[id]=delta.getComponent(axis);
      return;
    }
    // Carpentry marks a stance while the cook rocks onto its heel.
    delta.subVectors(end,mean);
    delta.x=clamp(delta.x,-.013*size,.013*size);
    delta.z=clamp(delta.z,-.018*size,.018*size);
    delta.y=clamp(delta.y,-.030*size,.030*size);
    end.copy(mean).add(delta);
    bone.parent.worldToLocal(parent.localToWorld(end));
    bone.parent.worldToLocal(parent.localToWorld(mean));
    bone.position.addScaledVector(end.sub(mean),1/probe.weight);
    bone.updateWorldMatrix(false,false);
  }
  function update(frame){
    const {time,heading,hero:position}=frame;
    const atWorkstation=Boolean(frame.worktops) || ['saw','plane','mallet'].includes(frame.tool);
    // Uncurl the rolling dango before it takes up a tool on the bench or mat.
    skin.mode=atWorkstation && player.mode==='dango'?'normal':player.mode;
    root.position.fromArray(position);
    root.rotation.y=heading;
    skin.gestureSample.time=time;
    // Each pose uses one painted expression. Holding a partial smile mixes
    // the closed-eye arcs into the open pupils throughout the work loop.
    skin.gestureSample.smile=Number(frame.phase==='finish');
    const elapsed=time-previousTime;
    const seek=previousTime===undefined || elapsed<0 || elapsed>.30 || previousCut!==frame.index;
    const dt=seek?0:elapsed;
    if(seek){
      rice.press=0;rice.velocity=0;rice.pull=0;rice.pullV=0;
      rice.step=time*2.4;skin.speed=0;
    }else if(frame.worktops){
      // The cooking score supplies both footfalls and the bounce of the body.
      skin.speed=0;
    }else if(dt>0){
      skin.speed=clamp(Math.hypot(position[0]-previousPlace.x,position[2]-previousPlace.z)/dt,0,4.5);
    }
    previousTime=time;previousCut=frame.index;previousPlace.copy(root.position);
    for(const hand of rice.hands)hand.matrixAutoUpdate=true;
    rice.body.morphTargetInfluences[rice.body.morphTargetDictionary.kagamiShoulder]=Number(player.mode==='kagami');
    for(const key of workShapes)rice.body.morphTargetInfluences[rice.body.morphTargetDictionary[key]]=0;
    for(const axes of footfalls)for(const id of axes)rice.body.morphTargetInfluences[id]=0;
    const weight=poseRice(rice,skin,time,dt,'curious',null,false);
    belly.rotateY(frame.waistTurn??0);
    // A stirring or pounding twist carries both cheeks and shoulders.
    if(frame.worktops)upper.rotateY(clamp(frame.twist??0,-.075,.075));
    const ready=frame.phase==='approach'?frame.progress:frame.phase==='finish'?1-frame.progress:1;
    for(const [i,arm] of arms.entries()){
      const tuck=frame.worktops?(1-frame.handWork[i])*(.65*ready+.35*frame.handWork[1-i]):0;
      arm.turnSocket(frame.socketTurn?.[i]??0,frame.tool==='plane',frame.gripFace?.[i],tuck);
    }
    pose.position.set(0,0,0);
    pose.rotation.set(0,0,0);
    pose.scale.set(size*weight.width,size*weight.stretch,size*weight.width);
    pose.updateMatrix();
    root.updateWorldMatrix(true,false);
    root.updateMatrixWorld(true);
    for(let i=0;i<2;i++){
      root.worldToLocal(parent.localToWorld(pads[i].fromArray(frame.hands[i])));
      arms[i].preview(root,rests[i],frame.handWork?.[i]??1,size,frame.palms?.[i],heading);
    }
    const crownStack=rice.kagami?.stack.visible ? rice.kagami.stack : null;
    if(crownStack)crownStack.worldToLocal(rice.body.localToWorld(rice.body.getVertexPosition(hero.crown,crownRest)));
    leanToWork(hero,frame,pads,rests,size);
    root.updateMatrixWorld(true);
    if(crownStack){
      crownStack.worldToLocal(rice.body.localToWorld(rice.body.getVertexPosition(hero.crown,point)));
      rice.kagami.citrus.position.add(point.sub(crownRest));
    }
    // The feet on the upper kagami cake rest on its lower tier. The lower
    // cake is the one sitting on the floor.
    if(player.mode!=='kagami')for(let i=0;i<2;i++)plant(soles[i],frame.feet[i],frame.worktops && footfalls[i]);
    const c=Math.cos(heading),s=Math.sin(heading);
    for(let i=0;i<2;i++){
      const palm=frame.palms?.[i],v=palm?.curl;
      if(v)curl.set(v[0]*c-v[2]*s,v[1],v[0]*s+v[2]*c);
      const n=palm?.normal;
      if(n)contactNormal.set(n[0]*c-n[2]*s,n[1],n[0]*s+n[2]*c);
      arms[i].reach(pads[i],frame.handWork?.[i]??1,size,v?curl:null,palm?.wristRoll,n?contactNormal:null);
      handVertices[i]=arms[i].vertex;
      arms[i].read(parent,point).toArray(grips[i]);
    }
    hero.wrap.visible=player.buffs?.wrap>0;
    // Fold the bamboo cuff down around the waist before working in front.
    // On the two-tier cake it sits on the lower tier, below both mitts.
    if(atWorkstation)hero.wrap.scale.set(1.025,.48,.99);
    else hero.wrap.scale.set(1.075,1,1.042);
    hero.wrap.position.y=atWorkstation?-.005:0;
    if(atWorkstation)hero.wrap.position.z=0;
    hero.leaves.visible=player.mode==='kusa';
    if(hero.leaves.visible){
      rice.body.getVertexPosition(hero.crown,hero.leaves.position);
      hero.rolling.worldToLocal(rice.body.localToWorld(hero.leaves.position));
    }
    for(const [i,wing] of hero.wingParts.entries()){
      wing.visible=player.mode==='habutae';
      wing.rotation.z=(i?1:-1)*(.10+.026*Math.sin(time*2.2));
    }
    return grips;
  }
  function dispose(){
    if(!active)return;
    active=false;
    root.removeFromParent();
    idleCook=hero;
  }
  function facePoint(out){
    return rice.body.localToWorld(rice.body.getVertexPosition(rice.lip,out));
  }
  return {group:root,handVertices,update,facePoint,dispose};
}
