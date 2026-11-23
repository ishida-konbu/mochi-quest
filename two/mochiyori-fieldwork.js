// Run the authored handwork against the resident in the travelling world.
// All transforms are sampled from the game clock; the travelling camera and
// input loop keep ownership of the view and of the courier.
import { Box3, Group, MathUtils, Matrix4, Quaternion, Vector3 } from './vendor/three.module.min.js';
import { courier, fieldCast } from './mochiyori-field-cast.js';
import { performedScenes } from './mochiyori-scenes.js';
import { SCENES } from './mochiyori-story.js';
import { createStoryFood, createStoryEvidence, poseStoryFood, releaseStoryEvidence, setEvidencePose } from './story-crafts.js';
import { createStoryTool, storyGrip, storyTool, poseStoryHands } from './story-models.js';
import { makeSteam, makeAccessories, steamingBeat, poseStorySteam } from './mochiyori-hand-props.js';
import { dividePastry } from './mochiyori-cut.js';
import { batchActorParts } from './actors.js';

const vec = (x=0,y=0,z=0)=>new Vector3(x,y,z);
const smooth=t=>MathUtils.smoothstep(t,0,1);
const still = new Set(['point','compare','write','tie']);
const duration = b => still.has(b.gesture) ? 1.05 : 1.45;
const nose = {
  '狐':['mask',0,.02,.36], '鹿':['mask',0,-.025,.34], '猪':['mask',0,-.07,.39],
  '牛':['head',0,-.22,.43], '亀':['turtleNeck',0,.32,.67], '丹頂':['襟首',0,.54,.42],
  '鶏':['head',0,.13,.16], '鯛':['bream-fin',.22,.14,.10],
  '老婆餅':[null,.43,.52,.49], '僧侶餅':[null,.48,.75,.39]
};
const looseGrips=new WeakMap();
function hands(speaker){
  const {actor,person}=speaker;
  const right=storyGrip(actor),left=storyGrip(actor,'left');
  if (right) return {right,left,pose:(r,l)=>poseStoryHands(actor,{right:r,left:l})};
  if (looseGrips.has(actor)) return looseGrips.get(actor);
  const [name,x,y,z]=nose[person.species] || [null,0,.65,.38];
  const joint=(name && actor.getObjectByName(name)) || actor;
  const grip=new Group();grip.position.set(x,y,z);joint.add(grip);
  // Hoofed witnesses demonstrate with the muzzle, birds with a bill or fin.
  // Their existing neck joint remains attached to the original body.
  const limb={right:grip,left:null,pose(r){
    if (!r || joint===actor) return;
    const local=joint.worldToLocal(r.clone());
    const bind=grip.position.clone().normalize();
    if (local.lengthSq()<.001) return;
    const turn=new Quaternion().setFromUnitVectors(bind,local.normalize());
    joint.quaternion.multiply(new Quaternion().slerp(turn,Math.min(1,.46/(turn.angleTo(new Quaternion()) || 1))));
  }};
  looseGrips.set(actor,limb);return limb;
}
function buildProp(s){
  if (s.code==='food') return createStoryFood(SCENES.findIndex(scene=>scene.region===s.region)+1);
  if (s.code==='tool') return createStoryTool(s.role,s.index);
  return createStoryEvidence(s.code,s.variant);
}
let standTemplate;
function foldingStand(){
  if (!standTemplate){
    standTemplate=new Group();standTemplate.name='旅の折敷台';
    batchActorParts(standTemplate,b=>{
      b.box(0,.98,0,1,.04,.53,'#ad916c');
      for (let i=0;i<4;i++) b.box(0,1.002,(i-1.5)*.126,.96,.012,.122,i%2?'#d1b98d':'#d8c29c');
      for(const s of [-1,1]){
        b.rod([s*.45,.02,-.22],[s*.41,.97,.20],.026,'#836944');
        b.rod([s*.45,.02,.22],[s*.41,.97,-.20],.026,'#927653');
        b.ball(s*.442,.47,0,.032,.027,.027,'#574633');
      }
      b.rod([-.44,.48,0],[.44,.48,0],.018,'#8d7650');
    });
  }
  return standTemplate.clone();
}
function localBounds(root,subject) {
  const bounds=new Box3(),box=new Box3(),m=new Matrix4();
  root.updateWorldMatrix(true,false);
  const inverse=root.matrixWorld.clone().invert();
  subject.updateWorldMatrix(true,true);
  subject.traverseVisible(n=>{
    if(!n.isMesh || n.material?.visible===false)return;
    if(!n.geometry.boundingBox)n.geometry.computeBoundingBox();
    bounds.union(box.copy(n.geometry.boundingBox).applyMatrix4(m.multiplyMatrices(inverse,n.matrixWorld)));
  });
  return bounds;
}
function actionPart(item,beat){
  let node=beat.part && item.model.getObjectByName(beat.part);
  if (beat.gesture==='divide' && item.spec.code==='food'){
    const dough=item.model.getObjectByName('取り分ける餅');
    if (dough) {
      item.split ??= dividePastry(dough,item.spec.region);
      return item.split.children[1];
    }
  }
  if (!node && beat.gesture==='divide') node=item.model.getObjectByName('割餅右');
  if (!node) item.model.traverse(n=>{
    if (!node && n.userData.performPart?.split(' ').includes(beat.gesture)) node=n;
  });
  return node || item.model;
}
function useCounterBetween(a,b) {
  return a.z*b.z<0 && Math.min(Math.abs(a.x),Math.abs(b.x))<1;
}
function durationOf(score){
  return score.beats.reduce((n,b)=>n+duration(b),0);
}
export function createFieldwork(scene){
  let run=null, lastTime=null;
  const focus=vec(),effects=new Group();
  let steam,tools;
  function park(){
    if (!run?.motion) return;
    const {pivot,node,parent}=run.motion;
    parent.attach(node);pivot.removeFromParent();run.motion=null;
  }
  function stop(){
    if(!run)return;
    if(run.hero)delete run.hero.userData.storyReach;
    park();
    for(const [tool,visible] of run.tools)tool.visible=visible;
    for(const who of run.people){
      if(who.actor.userData.storyPerforming)poseStoryHands(who.actor);
      delete who.actor.userData.storyPerforming;
    }
    for(const item of run.items)releaseStoryEvidence(item.model);
    for(const [object,visible] of run.covered)object.visible=visible;
    for(const [actor,home] of run.moved){
      actor.position.copy(home.position);actor.quaternion.copy(home.rotation);
    }
    effects.removeFromParent();
    if(steam)steam.visible=false;
    if(tools)for(const obj of Object.values(tools))obj.visible=false;
    run.root.removeFromParent();run=null;
  }
  function start(key,host,people,table,hero){
    stop();
    const score=performedScenes.get(key);
    if (!score) return 0;
    const actor=host.actor, root=new Group(), feet=actor.getWorldPosition(vec());
    const limb=hands(host),right=limb.right.getWorldPosition(vec());
    const palm=limb.left?right.clone().lerp(limb.left.getWorldPosition(vec()),.5):right.clone();
    const localPalm = actor.worldToLocal(palm.clone());
    if (limb.left) {localPalm.z=Math.max(.45,localPalm.z);palm.copy(actor.localToWorld(localPalm));}
    root.name=score.title;
    root.position.copy(palm);root.position.y=feet.y;
    actor.getWorldQuaternion(root.quaternion);root.rotation.x=root.rotation.z=0;
    scene.add(root);root.updateWorldMatrix(true,false);
    let surface=Math.max(.28,palm.y-feet.y-.20);
    const covered=new Map();
    // Work at the permanent counter whenever the resident is within reach.
    // At a gate or roadside stop a folding stand gives evidence a real support.
    let useCounter=false;
    if (table){
      const at=table.worldToLocal(palm.clone());
      const nearest=vec(MathUtils.clamp(at.x,-.91,.91),table.userData.worktop,MathUtils.clamp(at.z,-.34,.34));
      const point=table.localToWorld(nearest);
      if (Math.hypot(point.x-palm.x,point.z-palm.z)<.47 && Math.abs(point.y-palm.y)<.36){
        root.position.x=point.x;root.position.z=point.z;surface=point.y-feet.y;useCounter=true;
      }
    }
    const specs=score.props;
    if (table){
      const staged=new Set(specs.map(s=>s.code==='food'?'food/'+(SCENES.findIndex(scene=>scene.region===s.region)+1):s.code));
      for(const exhibit of table.children.slice(1)){
        if(!useCounter && !staged.has(exhibit.userData.storyEvidence))continue;
        covered.set(exhibit,exhibit.visible);exhibit.visible=false;
      }
    }
    const workWidth=specs.length===1?.94:specs.length===2?1.13:1.34;
    if (!useCounter){
      const stand=foldingStand();stand.scale.set(workWidth,surface,1);root.add(stand);
    }
    const items=specs.map((spec,i)=>{
      const model=buildProp(spec),slot=new Group();
      if(spec.variant==='steam-repair')setEvidencePose(model,'single');
      const bounds=new Box3().setFromObject(model),size=bounds.getSize(vec()),center=bounds.getCenter(vec());
      const span=workWidth/specs.length;
      const scale=Math.min(1.65,(span-.018)/Math.max(.05,size.x),.60/Math.max(.05,size.z),.55/Math.max(.05,size.y));
      model.scale.multiplyScalar(scale);model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
      slot.position.set((i-(specs.length-1)/2)*span,surface+.013,0);
      slot.add(model);root.add(slot);
      return {model,slot,spec};
    });
    const liner=items.find(i=>['plate-liner','board-liner'].includes(i.spec.variant));
    const freight=items.find(i=>['sakai-boards','tsuruga-plates'].includes(i.spec.variant));
    if(liner && freight){
      const unit=Math.min(liner.model.scale.x,freight.model.scale.x);
      for(const {model} of [liner,freight]){model.position.multiplyScalar(unit/model.scale.x);model.scale.setScalar(unit);}
    }
    root.add(effects);
    if (score.beats.some(b=>steamingBeat(items[b.prop].spec,b))){
      steam ??= makeSteam();effects.add(steam);steam.visible=false;
    }
    root.updateWorldMatrix(true,true);
    const heroPalm=hero?.getObjectByName('配達人の受け手');
    run={score,cast:fieldCast(score,host.person.name),host,root,people:people.filter(s=>s.site.key===host.site.key),items,surface,hero,heroPalm,
      tools:new Map(),covered,moved:new Map(),motion:null,index:0,elapsed:0,finished:false};
    beginBeat();
    return durationOf(score);
  }
  function hideTools(actor){
    for(const side of ['right','left']){
      const tool=storyTool(actor,side);
      if(tool && !run.tools.has(tool)){run.tools.set(tool,tool.visible);tool.visible=false;}
    }
  }
  function beginBeat(){
    park();
    const {score,index,items,root,host,people,surface}=run;
    const beat=score.beats[index],g=beat.gesture,item=items[beat.prop];
    const name=run.cast[beat.actor],partnerName=run.cast[beat.partner];
    const worker=name===courier?host:people.find(s=>s.person.name===name);
    const recipient=beat.partner!=null && people.find(s=>s.person.name===partnerName);
    const limb=hands(worker);hideTools(worker.actor);
    worker.actor.userData.storyPerforming=true;
    const node=actionPart(item,beat),parent=node.parent;
    const bounds=localBounds(root,node),start=bounds.getCenter(vec()),size=bounds.getSize(vec());
    const pivot=new Group();pivot.position.copy(start);root.add(pivot);pivot.attach(node);
    const dest=start.clone(),focus=beat.target==null?null:items[beat.target];
    const target=focus && localBounds(root,focus.model);
    const goal=target?.getCenter(vec());
    if(['pour','tie','write'].includes(g) && !tools)tools=makeAccessories(effects);
    if(tools){
      tools.brush.visible=g==='write' && item.spec.code!=='tool';
      tools.inkMark.visible=g==='write';
      tools.stream.visible=g==='pour';tools.cord.visible=g==='tie' && item.spec.code!=='food';
    }
    const lift=Math.max(surface+.21,run.surface+Math.min(.29,size.y*.55+.16));
    if (['lift','present','turn','open','pour','pass'].includes(g)){
      dest.y=lift;dest.z+=.045;
    }
    if (g==='turn' && beat.part==='合わせ餅'){dest.y=surface+.29;dest.z=Math.max(dest.z,.14);}
    if (['set','stack','fit'].includes(g)) {
      if(target) {dest.copy(goal);dest.y=target.max.y+size.y/2+.005;}
      else dest.y=surface+size.y/2+.009;
    }
    if (g==='divide') {dest.x+=Math.max(.095,size.x*.46);dest.y+=.025;}
    // Align detachable geometry at the sockets cut in the original object.
    let socket;
    if (beat.part==='蒸し箱の上段') socket=beat.pose==='single'?vec(-.48,0,0):vec(0,beat.pose==='spaced'?.212:.171,0);
    if (beat.part?.startsWith('取り外し桟') && g==='fit') socket=vec((Number(beat.part.at(-1))-1)*.213,.169,0);
    if (beat.part==='欠けた蝶番' && g==='fit')socket=item.model.getObjectByName('欠けの破片')?.position.clone();
    if (beat.part==='水鉢の合い蓋' && g==='fit')socket=vec();
    if (socket){
      const delta=item.model.localToWorld(socket).sub(node.getWorldPosition(vec()));
      dest.copy(start).add(delta.applyQuaternion(root.getWorldQuaternion(new Quaternion()).invert()));
    }
    const rails=[];
    if (g==='fit' && beat.part?.startsWith('取り外し桟'))
      for(let j=0;j<3;j++){
        const rail=item.model.getObjectByName('取り外し桟'+j);
        if(rail && rail!==node)rails.push([rail,rail.position.clone(),vec((j-1)*.213,.169,0)]);
      }
    const liner=focus?.model.getObjectByName('中敷き');
    let angleY=g==='divide'?(node.name==='割餅左'?1.12:-1.12):0;
    if(g==='fit' && liner){
      const inner=localBounds(root,liner);dest.copy(inner.getCenter(vec()));dest.y=inner.max.y+size.y/2+.003;
      if(focus.spec.variant==='board-liner')angleY=Math.PI/2;
    }
    const right=limb.right.getWorldPosition(vec()), left=limb.left?.getWorldPosition(vec());
    const sign=!left || root.worldToLocal(right.clone()).x>=root.worldToLocal(left.clone()).x?1:-1;
    // A second resident steps up to the host's tray before touching anything.
    const travel=[];
    for (const [who,side] of [[worker,sign],[g==='pass' && recipient,-sign]]){
      if (!who || who===host || who.external || travel.some(v=>v.who===who))continue;
      const a=who.actor;
      if(!run.moved.has(a))run.moved.set(a,{position:a.position.clone(),rotation:a.quaternion.clone()});
      const from=a.position.clone(),to=root.localToWorld(vec(side*.68,0,-.31));
      to.y=from.y;
      const look=Math.atan2(root.position.x-to.x,root.position.z-to.z);
      travel.push({who,from,to,yaw:a.rotation.y,turn:Math.atan2(Math.sin(look-a.rotation.y),Math.cos(look-a.rotation.y))});
    }
    // When the courier actually gives or receives an object, the resident
    // walks round the counter to the real palm. The travelling player is
    // never moved, including when they keep walking during the exchange.
    const handoff=g==='pass' && run.heroPalm && (name===courier || partnerName===courier);
    if (handoff){
      const walker=name===courier ? recipient : worker;
      if(walker && !walker.external){
        const a=walker.actor,home=a.getWorldPosition(vec()),hand=run.heroPalm.getWorldPosition(vec());
        const toward=hand.clone().sub(home).setY(0),length=toward.length();
        toward.normalize();
        const to=home.clone().addScaledVector(toward,Math.max(0,length-.56));
        const curve=root.worldToLocal(home.clone()),final=root.worldToLocal(to.clone());
        const midpoint=home.clone().lerp(to,.5);
        // Skirt the near end of a worktable if it lies between giver and
        // receiver. The arch is travelled by both body and held evidence.
        if(useCounterBetween(curve,final)){
          const side=curve.x+final.x<0?-1:1;
          midpoint.copy(root.localToWorld(vec(side*1.50,0,0)));
          midpoint.y=home.y;
        }
        const route=travel.findIndex(m=>m.who===walker);
        if(route>=0)travel.splice(route,1);
        if(!run.moved.has(a))run.moved.set(a,{position:a.position.clone(),rotation:a.quaternion.clone()});
        const yaw=Math.atan2(toward.x,toward.z);
        travel.push({who:walker,from:home,to,midpoint,yaw:a.rotation.y,turn:Math.atan2(Math.sin(yaw-a.rotation.y),Math.cos(yaw-a.rotation.y))});
      }
    }
    run.motion={beat,pivot,parent,node,start,dest,size,goal,angleY,worker,recipient,limb,sign,rails,travel,
      heroActor:name===courier,heroRecipient:partnerName===courier};
    run.elapsed=0;
  }
  function pose(t){
    const {root,items,hero}=run;
    const {beat,pivot,node,start,dest,size,goal,angleY,limb,sign,rails,worker,recipient,travel,heroActor,heroRecipient}=run.motion;
    const g=beat.gesture,r=smooth((t-.19)/.72),reach=smooth(t/.26),arc=Math.sin(r*Math.PI);
    for(const move of travel){
      const u=move.midpoint?smooth((t-.14)/.65):smooth(t/.42);
      move.who.actor.position.lerpVectors(move.from,move.to,u);
      if(move.midpoint){
        const bend=move.midpoint.clone().sub(move.from.clone().lerp(move.to,.5));
        move.who.actor.position.addScaledVector(bend,4*u*(1-u));
      }
      move.who.actor.position.y+=.025*Math.abs(Math.sin(u*Math.PI*3));
      move.who.actor.rotation.y=move.yaw+move.turn*u;
    }
    let target=dest;
    if(g==='pass'){
      const end=recipient?hands(recipient).right.getWorldPosition(vec()):heroRecipient && run.heroPalm?.getWorldPosition(vec());
      if(end)target=root.worldToLocal(end);
    }
    pivot.position.lerpVectors(start,target,r);
    if(g==='pass' && run.heroPalm){
      if(heroActor && recipient){
        // The receipt or invitation comes out of the courier's own hands.
        const offered=root.worldToLocal(run.heroPalm.getWorldPosition(vec()));
        pivot.position.lerpVectors(offered,target,smooth((t-.72)/.23));
      }else if(heroRecipient){
        const palm=root.worldToLocal(limb.right.getWorldPosition(vec()));
        pivot.position.lerpVectors(start,palm,smooth(t/.32)).lerp(target,smooth((t-.65)/.29));
      }
    }
    if(['turn','lift','set','pass','stack','fit','divide','open'].includes(g))pivot.position.y+=.077*arc;
    const angle=g==='turn'?-2.76:g==='open'?-1.03:g==='present'?-.34:g==='pour'?.95:0;
    pivot.rotation.set(angle*r,angleY*r,(g==='divide'?-.34:g==='pour'?-.22:0)*r);
    for(const [rail,from,to] of rails)rail.position.lerpVectors(from,to,r);
    if(items[beat.prop].spec.code==='food')poseStoryFood(node,g,r);
    const radius=Math.min(.19,Math.max(.024,size.x*.39));
    const edge=s=>pivot.localToWorld(vec(s*radius,0,-size.z*.24));
    if(steam)poseStorySteam(steam,root,beat,items[beat.prop],node,pivot,size,lastTime,r);
    if(tools?.stream.visible){
      tools.stream.position.copy(root.worldToLocal(edge(-sign)));tools.stream.scale.y=.01+.81*arc;
    }
    if(tools?.cord.visible){
      tools.cord.position.copy(pivot.position);
      tools.cord.scale.set(Math.max(.03,size.x*(.54-.11*r)),Math.max(.009,size.y*.39),Math.max(.024,size.z*.44));
      tools.cord.rotation.y=r*.65;
    }
    let right=edge(sign),left=limb.left?edge(-sign):null;
    if(still.has(g)){
      const trace=g==='write'?Math.sin(r*16)*.033:g==='tie'?Math.cos(r*12)*.028:0;
      right=pivot.localToWorld(vec((r-.5)*size.x*.66,size.y*.51+.009,trace));
      if(g==='compare' && goal)right.lerp(root.localToWorld(goal.clone().add(vec(0,.04,0))),r);
    }
    if(g==='write'){
      const mark=tools.inkMark;
      const paper=goal || start,top=goal ? paper.y+.025 : start.y+size.y*.51;
      const length=goal ? .13 : Math.max(.046,size.x*.47);
      mark.position.set(paper.x-length*(1-r)*.5,top+.003,paper.z+.006);mark.scale.set(Math.max(.001,r*length),1,.006);
      const tip=vec(paper.x+length*(r-.5),top+.005,paper.z+.015*Math.sin(r*12));
      if(tools.brush.visible){
        tools.brush.position.copy(tip);tools.brush.rotation.set(-.16,0,-.19);
        right=tools.brush.localToWorld(vec(0,.105,0));
      }else if(goal){
        pivot.position.lerpVectors(start,tip.clone().add(vec(0,size.y*.42,0)),reach);
        right=edge(sign);
      }
    }
    right.lerp(limb.right.getWorldPosition(vec()),1-reach);
    if(left)left.lerp(limb.left.getWorldPosition(vec()),1-reach);
    // For an action selected by the courier, the resident steadies the
    // exhibit while the visible traveller reaches toward it. During an
    // outgoing delivery the recipient takes it from the traveller directly.
    if(!(g==='pass' && heroActor && recipient))limb.pose(right,left);
    if(g==='pass' && recipient && recipient!==worker){
      recipient.actor.userData.storyPerforming=true;
      const receiver=hands(recipient);
      receiver.pose(receiver.right.getWorldPosition(vec()).lerp(edge(-sign),smooth((r-.42)/.56)),null);
    }
    if(hero && (heroActor || heroRecipient)){
      hero.userData.storyReach={point:heroRecipient || g==='pass'?pivot.getWorldPosition(vec()):right,strength:heroActor?reach:smooth((r-.55)/.42)};
    }
  }
  function update(time){
    const dt=lastTime===null?0:Math.max(0,time-lastTime);lastTime=time;
    if(!run)return;
    if(run.finished){pose(1);return;}
    let remaining=dt;
    while(run && !run.finished){
      const span=duration(run.motion.beat),advance=Math.min(remaining,span-run.elapsed);
      run.elapsed+=advance;remaining-=advance;pose(run.elapsed/span);
      if(run.elapsed<span-1e-8)return;
      if(++run.index<run.score.beats.length){beginBeat();continue;}
      // Let the player read and walk around the result before the exhibit
      // is put away. The next exchange or walking away restores the table.
      run.finished=true;
    }
  }
  return {start,stop,update,get playing(){return !!run && !run.finished;},get focus(){return run?.motion?.pivot.getWorldPosition(focus) || null;}};
}
