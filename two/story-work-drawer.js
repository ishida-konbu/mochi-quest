// Furniture and transfers belong to the workshop, independent of dialogue frames.
import { Group, Quaternion, Vector3 } from './vendor/three.module.min.js';
import { bindToolWrist } from './story-hands.js';
import { batchActorParts } from './actors.js';
export { createPropTransfers } from './story-drawer-motion.js';
import { workDrawerSize } from './story-table-plan.js';
import { drawerTimbers } from './story-crafts.js';
const vec=(x=0,y=0,z=0)=>new Vector3(x,y,z);
const drawers=new WeakMap();

export function workDrawer(table,top=table.userData.worktop,width=workDrawerSize.width,depth=1.08) {
  if(drawers.has(table))return drawers.get(table);
  const mount=new Group(),front=new Group(),runner=new Group(),handle=new Group();
  mount.name='道具を納める引き出し';front.name='引き手と底板';
  // The customer stands at +Z. The pull and open tray belong on the
  // artisan's side of this bench.
  mount.position.set(0,top-workDrawerSize.topInset,-depth/2-workDrawerSize.edge);mount.rotation.y=Math.PI;
  mount.add(front,runner);
  const seated=table.userData.seated;
  const w=Math.min(width,1.26),h=Math.min(top-.05,seated?.20:workDrawerSize.height),d=seated?.26:workDrawerSize.depth;
  handle.name='引き出しの取っ手';handle.position.set(0,-h*.51,.057);front.add(handle);
  const halfGrip=.073;
  const hardware=batchActorParts(handle,b=>{
    for(const s of [-1,1]){
      b.ball(s*.10,h*.08,-.030,.018,.023,.016,'#4c4439');
      b.rod([s*.10,h*.08,-.026],[s*halfGrip,0,0],.010,'#594a37');
    }
    b.rod([-halfGrip,0,0],[halfGrip,0,0],.012,'#614f39');
  },'鍛えた引き手と座金');
  const caseBoards=[[0,-h-.01,-d*.5,w+.08,.036,d+.05,'#745539'],
    [0,-h*.49,-d,w+.08,h+.04,.036,'#70533c']];
  const planks=[[0,-h*.50,0,w,h,.035,'#a5815b']];
  // Two floorboards meet along their long edges. The end of each side
  // enters the front board in a darker, exposed tenon.
  for(const s of [-1,1]){
    caseBoards.push([s*(w/2+.021),-h*.5,-d*.49,.037,h+.04,d+.03,'#745539']);
    planks.push([s*(w-.025)*.25,-h+.016,-d*.5,(w-.025)*.5,.026,d,s>0?'#ae906a':'#aa8964'],
      [s*(w*.5-.02),-h+.056,-d*.5,.015,.086,d,'#98744f'],
      [s*(w*.5-.024),-h+.057,.017,.027,.031,.004,'#856345']);
  }
  drawerTimbers(mount,'板囲いと奥板',caseBoards,hardware.material);
  runner.name='引き出しの摺り桟';
  drawerTimbers(runner,'摺り桟の合わせ',[-1,1].map(s=>[s*(w*.5-.025),-h-.010,-d*.46,.030,.021,d*.98,'#72573e']),hardware.material);
  drawerTimbers(front,'前板と引き底',planks,hardware.material);
  mount.userData.storyStorage=true;table.add(mount);
  const thickness=table.children[0]?.userData.worktopThickness || workDrawerSize.topInset;
  const clearHeight=h-.055-Math.max(0,thickness-workDrawerSize.topInset);
  const deferred=new Set();
  const drawer={mount,front,runner,handle,halfGrip,travel:d+.065,w,h,d,clearHeight,contents:new Map(),
    concealWhenShut(article){
      if(front.position.z>.001)deferred.add(article);
      else if(article.parent===front)article.visible=false;
    },
    shut(){
      for(const article of deferred)if(article.parent===front)article.visible=false;
      deferred.clear();
    }
  };
  drawers.set(table,drawer);return drawer;
}

// Select the nearest clear rectangle on the worktop. Only articles that
// actually obstruct this group of tools are put away in the drawer.
export function workingSpace(table,plan,at,width,occupants,depth=.30,available){
  const half=width/2,limitX=Math.max(.01,plan.width/2-half-.02);
  const limitZ=Math.max(.01,plan.depth/2-depth-.015);
  const clamp=(v,limit)=>Math.max(-limit,Math.min(limit,v));
  const x0=clamp(at.x,limitX),z0=clamp(at.z,limitZ);
  // A narrow gap beside a tray can fall between every regular grid sample.
  // Rectangle edges are the points where the set of overlaps changes.
  const xs=new Set([x0,-limitX,limitX,0]),zs=new Set([z0,-limitZ,limitZ,0]);
  for(const [,box] of occupants){
    if(box.max.y<table.userData.worktop-.04 || box.isEmpty())continue;
    for(const x of [box.min.x-half-.012,box.max.x+half+.012])xs.add(clamp(x,limitX));
    for(const z of [box.min.z-depth-.012,box.max.z+depth+.012])zs.add(clamp(z,limitZ));
  }
  let best;
  for(const x of xs){
    for(const z of zs){
      if(available && !available(x,z))continue;
      const blocked=[];let cost=Math.hypot(x-x0,z-z0)*.08;
      for(const [object,box,reserved] of occupants){
        const dx=Math.min(x+half,box.max.x)-Math.max(x-half,box.min.x);
        const dz=Math.min(z+depth,box.max.z)-Math.max(z-depth,box.min.z);
        if(dx<.01 || dz<.01 || box.max.y<table.userData.worktop-.04)continue;
        blocked.push(object);
        cost+=(reserved || object.userData.parcelId ? 500 : 2)+dx*dz*4;
      }
      if(!best || cost<best.cost)best={x,z,blocked,cost};
    }
  }
  return best;
}

// The everyday implement stays with its owner while both hands are busy.
// The socket is on the outside of the working coat, clear of the belly.
export function createToolRests(transfers){
  const records=new WeakMap();
  function portable(tool){
    return tool?.visible && !tool.userData.unborrowable && (tool.isMesh || tool.children.length>0);
  }
  function fitting(actor,tool,palm){
    let entry=records.get(tool);
    if(entry)return entry;
    bindToolWrist(actor,tool);
    const world=tool.getWorldPosition(vec()),local=actor.worldToLocal(world.clone());
    const palmWorld=palm?palm.getWorldPosition(vec()):world.clone();
    const at=actor.worldToLocal(palmWorld.clone()),side=at.x<0?-1:1;
    const rotation=actor.getWorldQuaternion(new Quaternion()).invert().multiply(tool.getWorldQuaternion(new Quaternion()));
    const slot=new Group();slot.name='腰の道具差し';
    // Fit to the fingers. Some implements are modeled in the wearer's
    // frame, with their origin a full arm's length from the handle.
    const towardHip=Math.min(.22,Math.max(.085,Math.abs(at.z)*.40));
    slot.position.set(at.x+side*.055,Math.max(.07,at.y-.115),at.z-towardHip);
    slot.quaternion.copy(rotation);actor.add(slot);
    batchActorParts(slot,b=>{for(const s of [-1,1])b.rod([s*.033,-.014,0],[s*.027,.024,.013],.005,'#7c634b');b.rod([-.026,.024,.013],[.026,.024,.013],.006,'#a48762');});
    const grip=tool.worldToLocal(palmWorld.clone());
    const keep=slot.worldToLocal(world.clone()).sub(slot.worldToLocal(palmWorld.clone()));
    const keepScale=tool.getWorldScale(vec()).divide(slot.getWorldScale(vec()));
    entry={actor,slot,grip,keep,keepScale,parent:tool.parent,position:tool.position.clone(),rotation:tool.quaternion.clone(),scale:tool.scale.clone(),
      neutral:local,orientation:rotation,parked:false};
    records.set(tool,entry);return entry;
  }
  function put(tool,parent,position,rotation,scale){
    parent.add(tool);tool.position.copy(position);tool.quaternion.copy(rotation);tool.scale.copy(scale);
  }
  return {
    // The notebook opens on an already dressed cast and worktop. Costume
    // tools stay in these loops through cuts and rewinds of the same scene.
    dress(actor,tool,palm){
      if(!portable(tool))return;
      const e=fitting(actor,tool,palm);e.parked=true;put(tool,e.slot,e.keep,new Quaternion(),e.keepScale);
    },
    undress(tool){
      const e=records.get(tool);if(!e?.parked)return;
      e.parked=false;put(tool,e.parent,e.position,e.rotation,e.scale);
    },
    park(actor,tool,operator,palm){
      if(!portable(tool))return;
      const e=fitting(actor,tool,palm);
      if(e.parked)return;
      e.parked=true;e.operator=operator;
      transfers.move(tool,e.slot,e.keep,new Quaternion(),{operator,grip:e.grip,scale:e.keepScale,lift:.045,duration:.46});
    },
    return(tool,operator){
      const e=records.get(tool);
      if(!e?.parked)return;
      e.parked=false;
      // Reach back to the resting wrist in the actor frame. A destination
      // attached to the reaching wrist would recede on every IK update.
      transfers.move(tool,e.actor,e.neutral,e.orientation,{operator:operator || e.operator,
        grip:e.grip,lift:.05,duration:.5,wrist:{parent:e.parent,position:e.position,rotation:e.rotation,scale:e.scale}});
    }
  };
}
