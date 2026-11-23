import { hands } from './story-witness-hands.js';
import { fitToSocket, placeWithinReach, turnWorkPage, needsSetDown } from './story-prop-socket.js';
// Run the authored handwork against the resident in the travelling world.
// Performers work on the same floor as the traveller and keep their original rigs.
import { Box3, Group, MathUtils, Matrix4, Quaternion, Vector3 } from './vendor/three.module.min.js';
import { courier, fieldCast } from './mochiyori-field-cast.js';
import { performedScenes } from './mochiyori-scenes.js';
import { SCENES } from './mochiyori-story.js';
import { createStoryFood, createStoryEvidence, poseRicePackets, poseStoryFood, openLunchLeaf, sealCargoNote, readCargoNote, setEvidencePose, drawerTimbers } from './story-crafts.js';
import { createStoryTool, storyGrip, storyTool, poseStoryHands } from './story-models.js';
import { makeSteam, makeAccessories, sipTea, pourTea, steamingBeat, poseStorySteam } from './mochiyori-hand-props.js';
import { dividePastry, servingLiner, levelServing, dishRim } from './mochiyori-cut.js';
import { workDrawer, workingSpace, createPropTransfers, createToolRests } from './story-work-drawer.js';
import { shortRoute } from './mochiyori-blocking.js';
import { worktopHeadroom } from './story-headroom.js';
import { groundHeight, canOccupy } from './terrain.js';
import { tablePlan, counterLeaves } from './story-table-plan.js';
import { createWorkContact, followStoryGrip, bearingHeight, tabletopCarryFloor } from './story-prop-contacts.js';
import { batchActorParts } from './actors.js';

const vec = (x=0,y=0,z=0)=>new Vector3(x,y,z);
const smooth=t=>MathUtils.smoothstep(t,0,1);
const still = new Set(['point','compare','write','tie']);
const duration = b => still.has(b.gesture) ? 1.05 : 1.45;
const shoulderPivots=new WeakMap();
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
  if(beat.wholeDish)return item.model;
  let node=beat.part && item.model.getObjectByName(beat.part);
  if (beat.gesture==='divide' && item.spec.code==='food'){
    const dough=item.model.getObjectByName('取り分ける餅');
    if (dough) {
      item.split ??= dividePastry(dough,item.spec.region);
      return item.split.children[1];
    }
  }
  if(item.split && node?.name==='取り分ける餅')return item.split.children[1];
  if (!node && beat.gesture==='divide') node=item.model.getObjectByName('割餅右');
  if (!node) item.model.traverse(n=>{
    if (!node && n.userData.performPart?.split(' ').includes(beat.gesture)) node=n;
  });
  return node || item.model;
}
const forwardReach = {'亀':1.16,'牛':1.29,'象':1.59,'鹿':1.04,'猪':.99,'狐':.78,'鯛':.76,'海亀':.70,'丹頂':.67};
const girth = who => ({'象':.61,'牛':.53,'亀':.62,'海亀':.54,'蛸':.46,'鯛':.46})[who.person.species] || .34;
function routesFrom(run,who){
  const from=who.actor.getWorldPosition(vec()),r=girth(who);
  const others=run.people.filter(s=>s!==who).map(s=>({at:s.actor.getWorldPosition(vec()),r:girth(s)}));
  if(run.hero)others.push({at:run.hero.getWorldPosition(vec()),r:.70});
  for(const s of others)s.clearance=Math.min(r+s.r-.025,Math.hypot(s.at.x-from.x,s.at.z-from.z)-.001);
  const footprint=(x,y,z)=>{
    const bench=run.bench;
    if(!bench)return 0;
    const p=bench.worldToLocal(vec(x,y,z)),plan=run.useCounter?tablePlan(who.site.number,who.site.place):bench.userData;
    const main=Math.hypot(Math.max(0,Math.abs(p.x)-plan.width*.5),Math.max(0,Math.abs(p.z)-plan.depth*.5));
    let distance=main;
    for(const tray of run.leaves || [])distance=Math.min(distance,Math.hypot(
      Math.max(0,Math.abs(p.x-tray.position.x)-tray.userData.width*.5),
      Math.max(0,Math.abs(p.z-tray.position.z)-tray.userData.depth*.5)));
    return distance;
  };
  const clearance=Math.min(r,footprint(from.x,from.y,from.z)-.001);
  const footing=(x,z,previous)=>{
    const onMap=Number.isFinite(who.site.x);
    const y=onMap?groundHeight(x,z,previous):from.y;
    if(Math.abs(y-from.y)>.60 || onMap && !canOccupy(x,z,y+.035,r,1.42) ||
       footprint(x,y,z)<clearance)return NaN;
    if(others.some(s=>Math.hypot(s.at.x-x,s.at.z-z)<s.clearance))return NaN;
    return y;
  };
  function clear(a,b){
    const steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.16));
    let previous=a.y;
    for(let i=1;i<=steps;i++){
      const u=i/steps,y=footing(a.x+(b.x-a.x)*u,a.z+(b.z-a.z)*u,previous);
      if(!Number.isFinite(y) || Math.abs(y-previous)>.29)return false;
      previous=y;
    }
    return Math.abs(previous-b.y)<.30;
  }
  const spacing=.32,limit=22,stride=2*limit+1,origin=limit*stride+limit;
  let visited;
  function survey(){
    const queue=[{i:0,j:0,key:origin,at:from,parent:null}];
    visited=new Map([[origin,queue[0]]]);
    const tried=new Set();
    for(let n=0;n<queue.length;n++){
      const here=queue[n];
      for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        const i=here.i+di,j=here.j+dj,k=(j+limit)*stride+i+limit;
        if(Math.abs(i)>limit || Math.abs(j)>limit || visited.has(k) || tried.has(k))continue;
        const x=from.x+i*spacing,z=from.z+j*spacing,y=footing(x,z,here.at.y);
        if(!Number.isFinite(y)){tried.add(k);continue;}
        const point=vec(x,y,z);
        if(!clear(here.at,point))continue;
        const next={i,j,key:k,at:point,parent:here};visited.set(k,next);queue.push(next);
      }
    }
  }
  return (goal,detour=false)=>{
    const end=goal.clone();end.y=footing(end.x,end.z,from.y);
    if(!Number.isFinite(end.y))return null;
    let path;
    if(!detour)path=shortRoute(from,end,footing,9);
    else{
      if(!visited)survey();
      const i=Math.round((goal.x-from.x)/spacing),j=Math.round((goal.z-from.z)/spacing);
      for(const [dx,dz] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        let cursor=visited.get((j+dz+limit)*stride+i+dx+limit);
        if(!cursor || !clear(cursor.at,end))continue;
        const corners=[end];
        while(cursor.parent){corners.unshift(cursor.at);cursor=cursor.parent;}
        path=[];let start=from;
        for(let n=0;n<corners.length;){
          let last=corners.length-1;
          while(last>n && !clear(start,corners[last]))last--;
          start=corners[last];path.push(start);n=last+1;
        }
        break;
      }
    }
    if(!path)return null;
    const points=[from,...path.map(p=>vec(p.x,p.y,p.z))];
    const length=points.slice(1).map((p,i)=>p.distanceTo(points[i]));
    return {who,points,length,total:length.reduce((a,b)=>a+b,0)};
  };
}
function walkTo(run,who,goal){return routesFrom(run,who)(goal);}

// Approach the recipient's near side when a handoff spans more than two
// arm lengths. Try both directions round an apron without crossing its top.
function meetPartner(run,who,partner,other,span) {
  if (!partner || who.external) return null;
  const at=partner.getWorldPosition(vec()),from=who.actor.getWorldPosition(vec());
  const isHero=partner===run.hero;
  const palm=isHero ? run.hero?.userData.storyRestPalm || run.heroPalm?.getWorldPosition(vec()) : other && hands(other).right.getWorldPosition(vec());
  const own=hands(who).right.getWorldPosition(vec());
  const spacing=girth(who)+(other?girth(other):.70)+.15+Math.min(.15,span*.18);
  const routeTo=routesFrom(run,who);
  function approach(marks){
    for(const detour of [false,true]){
      let best;
      for(const {goal,yaw} of marks){
        const route=routeTo(goal,detour);
        if(route && (!best || route.total<best.total)){route.facing=yaw;best=route;}
      }
      if(best)return best;
    }
    return null;
  }
  if(palm){
    const radial=palm.clone().sub(at).setY(0).normalize();
    const aim=palm.clone().addScaledVector(radial,.10+Math.min(.12,span*.25));
    const outside=Math.hypot(own.x-at.x,own.z-at.z)>(isHero?.72:girth(other)+.06);
    if(outside && Math.hypot(own.x-aim.x,own.z-aim.z)<.31)return null;
    const grip=who.actor.worldToLocal(own.clone()),facing=Math.atan2(-radial.x,-radial.z);
    const marks=[];
    for(const turn of [0,.40,-.40,.78,-.78,1.20,-1.20,1.70,-1.70,2.18,-2.18]){
      const yaw=facing+turn,co=Math.cos(yaw),si=Math.sin(yaw),reach=grip.z+(storyGrip(who.actor)?.15:.035);
      const goal=vec(aim.x-co*grip.x-si*reach,from.y,aim.z+si*grip.x-co*reach);
      if(Math.hypot(goal.x-at.x,goal.z-at.z)<girth(who)+(isHero?.69:girth(other))-.015)continue;
      marks.push({goal,yaw});
    }
    const best=approach(marks);
    if(best)return best;
  }
  const yaw=Math.atan2(from.x-at.x,from.z-at.z);
  if(Math.hypot(from.x-at.x,from.z-at.z)<spacing+.12)return null;
  const marks=[];
  for(const angle of [0,.34,-.34,.72,-.72,1.1,-1.1,1.65,-1.65,2.3,-2.3,Math.PI]){
    const goal=vec(at.x+spacing*Math.sin(yaw+angle),at.y,at.z+spacing*Math.cos(yaw+angle));
    marks.push({goal});
  }
  return approach(marks);
}
function stepAlong(move,u){
  let d=move.total*u,index=0;
  while(index<move.length.length-1 && d>move.length[index])d-=move.length[index++];
  const start=move.points[index],end=move.points[index+1];
  move.heading=Math.atan2(end.x-start.x,end.z-start.z);
  const position=move.who.actor.position.lerpVectors(start,end,Math.min(1,d/(move.length[index] || 1)));
  if(move.who.actor.parent)move.who.actor.parent.worldToLocal(position);
  return position;
}
const placementTime=.48;
function durationOf(score){
  return score.beats.reduce((n,b,i)=>n+duration(b)+(needsSetDown(b,score.beats[i+1])?placementTime:0),0);
}
const rotationAtRest=new Quaternion();
function homeOf(model){
  return {parent:model.parent,position:model.position.clone(),rotation:model.quaternion.clone()};
}
function jointRest(model) {
  const rest=[];
  model.traverse(child=>{
    if(child!==model)rest.push({child,parent:child.parent,position:child.position.clone(),rotation:child.quaternion.clone(),
      scale:child.scale.clone(),visible:child.visible,morph:child.morphTargetInfluences?.slice()});
  });
  return rest;
}
function restoreJoints(item,returnPart) {
  const changed=[],folds=[];
  for(const rest of item.rest){
    const {child,parent,position,rotation,scale}=rest;
    if(rest.morph && rest.morph.some((v,i)=>v!==child.morphTargetInfluences[i])){
      folds.push({child,from:child.morphTargetInfluences.slice(),to:rest.morph});
    }
    // A loose upper steamer or plank can be metres from its original base.
    // The worker reseats it before measuring or carrying the assembled piece.
    if(item.manipulated?.has(child) && child.visible && child!==item.nested){
      const displaced=child.getWorldPosition(vec()).distanceTo(parent.localToWorld(position.clone()));
      const turned=child.getWorldQuaternion(new Quaternion()).angleTo(parent.getWorldQuaternion(new Quaternion()).multiply(rotation));
      if((displaced>.045 || turned>.16) && returnPart?.(rest))continue;
    }
    if(child.parent!==parent)parent.attach(child);
    if(child.position.distanceToSquared(position)>.00000001 || child.quaternion.angleTo(rotation)>.0001 || child.scale.distanceToSquared(scale)>.00000001)
      changed.push({...rest,from:child.position.clone(),angle:child.quaternion.clone(),oldScale:child.scale.clone()});
  }
  return t=>{
    for(const fold of folds)fold.to.forEach((value,i)=>{fold.child.morphTargetInfluences[i]=MathUtils.lerp(fold.from[i],value,t);});
    for(const j of changed){
      j.child.position.lerpVectors(j.from,j.position,t);j.child.quaternion.slerpQuaternions(j.angle,j.rotation,t);
      j.child.scale.lerpVectors(j.oldScale,j.scale,t);
    }
  };
}

export function createFieldwork(scene,{parcelFor,parcelObject,claimParcel,releaseParcel,courierMark}={}){
  const transfers=createPropTransfers(scene), stands=new WeakMap(),counterExhibits=new WeakMap();
  const toolRests=createToolRests(transfers), sideTrays=new WeakMap();
  const residentBenches=new WeakMap(),standSites=new Map();
  function dress(table,site){
    const plan=tablePlan(site?.number,site?.place);
    return workDrawer(table,table.userData.worktop,1.16,plan.depth);
  }
  function exhibits(table){
    // Keep the original furniture registry even while a worker has a tool in hand.
    if(!counterExhibits.has(table))counterExhibits.set(table,table.children.slice(1).filter(o=>!o.userData.storyStorage && !o.userData.parcelId && (o.userData.storyEvidence || o.isMesh)).map(model=>({model,home:homeOf(model)})));
    return counterExhibits.get(table);
  }
  function buildStand(surface,width,depth,seated=false){
    const stand=new Group(),wood=foldingStand();
    stand.name='旅の折敷台';wood.scale.set(width,surface,depth/.53);stand.add(wood);
    Object.assign(stand.userData,{worktop:surface,width,depth,seated});
    workDrawer(stand,surface,Math.min(1.18,width),depth);
    return stand;
  }
  function placeStand(stand,point,yaw,parent){
    parent.add(stand);stand.position.copy(parent.worldToLocal(point.clone()));
    stand.quaternion.copy(parent.getWorldQuaternion(new Quaternion()).invert())
      .multiply(new Quaternion().setFromAxisAngle(vec(0,1,0),yaw));
    stand.scale.set(1,1,1).divide(parent.getWorldScale(vec()));
  }
  function nearbyStand(host,palm,feet,surface,yaw) {
    const prepared=residentBenches.get(host.actor);
    if(prepared?.stand)return prepared.stand;
    let stand=stands.get(host.actor);
    if(!stand){stand=buildStand(surface,1.34,.53);stands.set(host.actor,stand);}
    const parent=host.actor.parent || scene;
    if(stand.parent!==parent)placeStand(stand,vec(palm.x,feet.y,palm.z),yaw,parent);
    return stand;
  }
  function seatLegsOnGround(stand,point,yaw){
    const {width,depth,worktop}=stand.userData,sn=Math.sin(yaw),cs=Math.cos(yaw);
    stand.children[0].traverse(mesh=>{
      if(!mesh.isMesh || !mesh.geometry.attributes.position)return;
      const geometry=mesh.geometry.clone(),pos=geometry.attributes.position;
      for(let i=0;i<pos.count;i++){
        const y=pos.getY(i);
        if(y>=.98)continue;
        const x=pos.getX(i)*width,z=pos.getZ(i)*depth/.53;
        const ground=groundHeight(point.x+x*cs+z*sn,point.z-x*sn+z*cs,point.y);
        pos.setY(i,y+(ground-point.y+.004)/worktop*(1-Math.max(0,y)/.98));
      }
      pos.needsUpdate=true;geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
      mesh.geometry=geometry;
    });
  }
  function dressSideTrays(table,site){
    if(sideTrays.has(table))return;
    const leaves=counterLeaves(tablePlan(site.number,site.place)).map(plan=>{
      const tray=new Group();tray.name='引き出し脇の折敷';
      const {x,z,width,depth,worktop}=plan;
      tray.position.set(x,0,z);Object.assign(tray.userData,{width,depth,worktop,storyStorage:true});
      const hardware=batchActorParts(tray,b=>{
        for(const end of [-1,1]){
          const u=end*width*.36;
          b.rod([u,worktop-.24,depth*.57],[u,worktop-.044,-depth*.30],.019,'#806746',.025);
        }
      },'折敷を支える腕木');
      const boards=[-.25,.25].map((w,i)=>[w*width,worktop-.023,0,width*.50-.002,.046,depth,i?'#b89970':'#bea07a']);
      drawerTimbers(tray,'縁を落とした二枚板',boards,hardware.material);
      table.add(tray);return tray;
    });
    sideTrays.set(table,leaves);
  }
  function dressResident(host,table,people,group){
    if(table){dressSideTrays(table,host.site);residentBenches.set(host.actor,{table});return null;}
    let station=standSites.get(host.site.key);
    const parent=group || host.actor.parent || scene;
    if(!station && host.external){
      // A gate or bell keeper stays at their post. Beside their dominant hand,
      // a shallow writing tray opens sideways so the runner clears their knees.
      const {actor}=host,feet=actor.getWorldPosition(vec()),palm=hands(host).right.getWorldPosition(vec());
      const reach=actor.worldToLocal(palm.clone()),unit=actor.getWorldScale(vec());
      const side=reach.x<-.06?-1:1;
      const point=actor.localToWorld(vec(side*Math.max(.56,Math.abs(reach.x)+.10),0,Math.max(.44,reach.z)));
      point.y=groundHeight(point.x,point.z,feet.y);
      const height=MathUtils.clamp(palm.y-point.y-.05,.40,1.03);
      const yaw=Math.atan2(actor.getWorldDirection(vec()).x,actor.getWorldDirection(vec()).z)+side*Math.PI/2;
      station={point,yaw,stand:buildStand(height,.80*unit.x,.38,true)};
      seatLegsOnGround(station.stand,point,yaw);standSites.set(host.site.key,station);
    }
    if(!station){
      const feet=host.actor.getWorldPosition(vec()),facing=host.actor.getWorldDirection(vec());
      const yaw=Math.atan2(facing.x,facing.z),palm=hands(host).right.getWorldPosition(vec());
      const locals=(people || [host]).filter(p=>p.site.key===host.site.key)
        .map(who=>({p:who.actor.getWorldPosition(vec()),r:girth(who)}));
      const surface=MathUtils.clamp(palm.y-feet.y-.16,.38,.90);
      let winner;
      // Survey the floor under all four legs, leaving a lane for the resident
      // and traveller. In a narrow gate use the shorter tray.
      for(const width of [1.34,.98]){
        for(const ahead of [1.05,1.37,1.73]){
          for(const side of [0,.42,-.42,.83,-.83,1.35,-1.35,2.14,-2.14,Math.PI]){
            const angle=yaw+side,sn=Math.sin(angle),cs=Math.cos(angle);
            const x=feet.x+sn*ahead,z=feet.z+cs*ahead,y=groundHeight(x,z,feet.y);
            let faults=0,minFloor=y,maxFloor=y;
            if(Math.abs(y-feet.y)>.40)faults+=10;
            for(const u of [-width*.46,0,width*.46])for(const v of [-.24,.24]){
              const px=x+u*cs+v*sn,pz=z-u*sn+v*cs,ground=groundHeight(px,pz,y);
              minFloor=Math.min(minFloor,ground);maxFloor=Math.max(maxFloor,ground);
              if(Math.abs(ground-y)>.17 || !canOccupy(px,pz,y+.028,.10,surface))faults++;
            }
            for(const local of locals){
              const dx=local.p.x-x,dz=local.p.z-z;
              const distance=Math.hypot(Math.max(0,Math.abs(dx*cs-dz*sn)-width*.5),
                Math.max(0,Math.abs(dx*sn+dz*cs)-.265));
              if(distance<local.r+.09)faults+=4;
            }
            const cost=faults*30+Math.abs(side)*.36+ahead+(1.34-width)+(maxFloor-minFloor)*6;
            if(!winner || cost<winner.cost)winner={width,point:vec(x,y,z),yaw:angle,cost};
          }
        }
      }
      station={...winner,stand:buildStand(surface,winner.width,.53)};
      seatLegsOnGround(station.stand,winner.point,winner.yaw);
      standSites.set(host.site.key,station);
    }
    if(station.stand.parent!==parent)placeStand(station.stand,station.point,station.yaw,parent);
    residentBenches.set(host.actor,{stand:station.stand});return station.stand;
  }
  function storedAt(drawer,x,model) {
    const bounds=localBounds(model,model),natural=archiveScale(model);
    const mid=bounds.getCenter(vec()).multiply(natural);
    const half=bounds.getSize(vec()).x*natural.x*.5,limit=Math.max(0,drawer.w*.5-half-.026);
    return vec(MathUtils.clamp(x,-limit,limit)-mid.x,
      -drawer.h+.045-bounds.min.y*natural.y,-drawer.d*.47-mid.z);
  }
  function drawerLanding(item,items){
    const {drawer,bounds,extent,scale,model}=item,centre=bounds.getCenter(vec()).multiply(scale);
    const width=drawer.w*.5-extent.x*.5-.02;
    const front=-extent.z*.5-.019,back=-drawer.d+extent.z*.5+.021;
    const tried=[];
    // A box can be set down anywhere on the real bottom that still has room
    // for it. Keep the rest of the tray free for exhibits still on the desk.
    function choose(end,redirect){
      const others=items.filter(i=>i!==item && !i.home && i.drawer===drawer);
      const occupied=others.filter(i=>i.model.parent===drawer.front).map(i=>({
        at:i.bounds.getCenter(vec()).multiply(i.scale).add(i.model.position),size:i.extent
      }));
      const next=others.filter(i=>i.model.parent!==drawer.front);
      const here=drawer.front.worldToLocal(model.localToWorld(bounds.getCenter(vec())));
      const original=end.clone().add(centre);
      const xs=[original.x,MathUtils.clamp(here.x,-width,width),-width,width,0,-width*.5,width*.5];
      for(const b of occupied)xs.push(b.at.x+(b.size.x+extent.x)*.5+.012,b.at.x-(b.size.x+extent.x)*.5-.012);
      const zs=[original.z,MathUtils.clamp(here.z,back,front),front,back,(back+front)*.5];
      let best;
      for(const x of xs)for(const z of zs){
        if(Math.abs(x)>width+.0001 || z<back-.0001 || z>front+.0001)continue;
        if(tried.some(p=>Math.hypot(x-p.x,z-p.z)<.07))continue;
        if(occupied.some(b=>Math.abs(b.at.x-x)<(b.size.x+extent.x)*.5+.004 &&
          Math.abs(b.at.z-z)<(b.size.z+extent.z)*.5+.004))continue;
        const to=redirect?here:original;
        const left=x-extent.x*.5+drawer.w*.5-.024,right=drawer.w*.5-.024-x-extent.x*.5;
        const room=next.every(i=>i.extent.x+.005<=Math.max(left,right));
        const cost=Math.hypot(x-to.x,z-to.z)+(room?0:3);
        if(!best || cost<best.cost)best={x,z,cost};
      }
      if(!best)return false;
      end.x=best.x-centre.x;end.z=best.z-centre.z;
      tried.push(best);return true;
    }
    return {locate:end=>choose(end,false),alternate:end=>choose(end,true)};
  }
  function archiveScale(model){return model.getWorldScale(vec());}

  const returning=new Map();
  let run=null, lastTime=null;
  function atHome(actor,seat){
    const home=returning.get(actor)?.home || run?.moved.get(actor) || [...retired].map(state=>state.moved.get(actor)).find(Boolean);
    if(!home)return true;
    if(seat && Math.hypot(home.position.x-seat.x,home.position.z-seat.z)>.35){
      // A chapter has relocated this resident to a different village.
      returning.delete(actor);delete actor.userData.storyAway;
      return true;
    }
    return false;
  }
  function updateReturns(dt){
    for(const [actor,entry] of returning){
      const {home,who,people,hero}=entry,at=actor.position;
      let budget=dt*1.3;
      while(budget>0 && home.path.length) {
        const next=home.path.at(-1),dist=at.distanceTo(next);
        if(dist<.0001){home.path.pop();continue;}
        const step=Math.min(budget,dist),to=at.clone().lerp(next,step/dist);
        // A traveller can walk into this aisle after the original handoff.
        // Wait rather than crossing a resident or pushing the traveller aside.
        const here=at.clone(),there=to.clone();
        actor.parent?.localToWorld(here);actor.parent?.localToWorld(there);
        const obstruction=(other,r)=>{
          const feet=other.getWorldPosition(vec()),gap=Math.hypot(there.x-feet.x,there.z-feet.z);
          return Math.abs(feet.y-here.y)<1 && gap<r+girth(who)-.035 &&
            gap<Math.hypot(here.x-feet.x,here.z-feet.z)-.00001;
        };
        if(hero && obstruction(hero,.63) || people.some(p=>p!==who && p.actor.parent && obstruction(p.actor,girth(p))))break;
        const yaw=Math.atan2(next.x-at.x,next.z-at.z),oldYaw=actor.rotation.y;
        const turn=Math.atan2(Math.sin(yaw-oldYaw),Math.cos(yaw-oldYaw))*(1-Math.exp(-8*step/1.3));
        at.copy(to);actor.rotation.y=oldYaw+turn;
        if(entry.headDepth()>.006){
          // A long muzzle can sweep into the joinery as the traveller turns
          // to go home. Sidestep the edge before turning onto the aisle.
          actor.rotation.y=oldYaw;
        }
        budget-=step;
        if(step>=dist)home.path.pop();
      }
      if(!home.path.length){
        actor.quaternion.rotateTowards(home.rotation,dt*3.8);
        if(actor.quaternion.angleTo(home.rotation)<.0001){returning.delete(actor);delete actor.userData.storyAway;}
      }
    }
  }
  const focus=vec(),effects=new Group();
  const retired=new Set(),relaxing=new Map();
  let pending=null,steam,tools;
  function remember(state,who){
    const actor=who.actor;
    if(actor.userData.storyCanStep)actor.userData.storyAway=true;
    if(!state.moved.has(actor)){
      const home=returning.get(actor)?.home || {position:actor.position.clone(),rotation:actor.quaternion.clone(),path:[actor.position.clone()]};
      state.moved.set(actor,home);returning.delete(actor);
    }
    return state.moved.get(actor);
  }
  function headroom(state,who){
    const heads=state.heads ??= new Map();
    if(!heads.has(who.actor)){
      const plan=state.useCounter?tablePlan(who.site.number,who.site.place):state.bench.userData;
      const face=worktopHeadroom(who.actor,state.bench,plan,state.leaves,false);
      heads.set(who.actor,face);hands(who).face=face;
    }
    return heads.get(who.actor);
  }
  function operatorFor(state,who=state.host,side='right'){
    let sides=state.operators.get(who.actor);
    if(!sides){sides={};state.operators.set(who.actor,sides);}
    if(sides[side])return sides[side];
    const actor=who.actor,limb=hands(who),grip=limb[side] || limb.right;
    const rest=actor.worldToLocal(grip.getWorldPosition(vec()));
    const face=headroom(state,who),headDepth=face.depth;
    const legScale=actor.scale.y,order=actor.rotation.order;
    let last=null,route=null,travel=0,planned=null,retry=0,pitch=0,bend=0,compression=1;
    function approach(target){
      const at=actor.getWorldPosition(vec()),origin=actor.position.clone(),rotation=actor.quaternion.clone(),scaleY=actor.scale.y;
      const direction=actor.parent?.getWorldDirection(vec()) || vec(0,0,1);
      const parentYaw=Math.atan2(direction.x,direction.z);
      const currentYaw=actor.rotation.y+parentYaw,dy=target.y-at.y,unit=actor.getWorldScale(vec());
      const preferred=Math.atan2(target.x-at.x,target.z-at.z);
      const forward=Math.max(.29,rest.z*unit.z),lateral=rest.x*unit.x;
      const options=[],turns=[0,.50,-.50,1,-1,1.54,-1.54,2.05,-2.05,2.58,-2.58,Math.PI];
      // The same shoulder pose, rotated around a target, works on either
      // side of it. Measure the arm once per height and bend before testing
      // the travel lanes, keeping the cloth/skin solver off the path search.
      const fixed=who.external && !actor.userData.storyCanStep;
      const crouch=1-Math.min(.34,Math.max(0,rest.y*unit.y-dy)*.42);
      const leans=[MathUtils.clamp((rest.y*unit.y-dy)*.82,-.16,.77),.08,.49,.82,-.25];
      if(!storyGrip(actor))leans.push(-.43);
      for(const reach of fixed?[forward]:[forward,forward+.24,forward+.48,forward+.72,forward+.98]){
        for(const lean of leans){
          for(const initial of fixed?turns:[0]){
            const sampleYaw=fixed?preferred+initial:0;
            actor.rotation.set(lean,sampleYaw-parentYaw,0,'YXZ');actor.scale.y=legScale*crouch;
            const mark=fixed?at.clone():vec(target.x-lateral,at.y,target.z-reach);
            for(let i=0;i<3;i++){
              actor.position.copy(actor.parent?actor.parent.worldToLocal(mark.clone()):mark);
              const error=target.clone().sub(pose(target));
              for(const turn of fixed?[initial]:turns){
                const yaw=preferred+turn,c=Math.cos(yaw),sn=Math.sin(yaw);
                const dx=mark.x-target.x,dz=mark.z-target.z;
                const goal=fixed?at:vec(target.x+dx*c+dz*sn,at.y,target.z-dx*sn+dz*c);
                const cost=goal.distanceTo(at)+Math.abs(Math.atan2(Math.sin(yaw-currentYaw),Math.cos(yaw-currentYaw)))*.14+Math.abs(lean)*.08;
                options.push({goal,yaw,bend:lean,compression:crouch,error:error.length(),cost});
              }
              if(error.length()<.019 || fixed)break;
              mark.x+=error.x;mark.z+=error.z;
            }
          }
        }
      }
      if(!fixed){
        actor.position.copy(origin);
        for(const turn of [0,-.5,.5,-1,1]){
          const yaw=preferred+turn;
          for(const lean of leans){
            actor.rotation.set(lean,yaw-parentYaw,0,'YXZ');
            const error=pose(target).distanceTo(target);
            options.push({goal:at,yaw,bend:lean,compression:crouch,error,cost:Math.abs(turn)*.13+Math.abs(lean)*.12});
          }
        }
      }
      actor.position.copy(origin);actor.quaternion.copy(rotation);actor.scale.y=scaleY;
      const routeTo=routesFrom(state,who);
      const direct=choice=>fixed || choice.goal===at?{points:[at,at],length:[0],total:0,who}:null;
      const ordered=(a,b)=>(Math.max(0,a.error-.035)*32+a.cost)-(Math.max(0,b.error-.035)*32+b.cost);
      let closest=null,closestGap=Infinity,miss=null;
      function usable(tolerance,detour){
        for(const choice of options){
          if(choice.error>tolerance || choice.tried)continue;
          const path=direct(choice) || routeTo(choice.goal,detour);
          if(!path)continue;
          choice.tried=true;
          const mark=path.points.at(-1);
          actor.position.copy(actor.parent?actor.parent.worldToLocal(mark.clone()):mark);
          actor.rotation.set(choice.bend,choice.yaw-parentYaw,0,'YXZ');actor.scale.y=legScale*choice.compression;
          let palm=extendShoulder(target,pose(target));
          choice.blocked=headDepth()>.005;
          if(choice.blocked){
            // At the bench edge an upright neck and a sideways wrist can
            // reach a low pull even when a deep bow puts the face in wood.
            for(const [lean,height] of [[choice.bend*.55,choice.compression],[.04,Math.max(.86,choice.compression)],[-.13,1]]){
              unloadShoulder();actor.rotation.x=lean;actor.scale.y=legScale*height;
              palm=extendShoulder(target,pose(target));
              if(palm.distanceTo(target)>.042 || headDepth()>.005)continue;
              choice.bend=lean;choice.compression=height;choice.blocked=false;break;
            }
          }
          unloadShoulder();actor.position.copy(origin);actor.quaternion.copy(rotation);actor.scale.y=scaleY;
          if(!choice.blocked){
            const reachGap=palm.distanceTo(target);
            const route={...path,facing:choice.yaw-parentYaw,bend:choice.bend,compression:choice.compression};
            if(reachGap<.034)return route;
            if(reachGap<closestGap){closestGap=reachGap;closest=route;miss=target.clone().sub(palm);}
          }
        }
        return null;
      }
      options.sort(ordered);
      const easy=usable(.075,false);
      if(easy)return easy;
      if(!fixed && state.bench){
        actor.scale.y=legScale*crouch;
        // On a crowded worktop the circular candidates can all land under
        // the planks. Plant a foot at the actual outer edge and reach across.
        for(const surface of [state.bench,...(state.leaves || [])]){
          const plan=surface===state.bench && state.useCounter?tablePlan(who.site.number,who.site.place):surface.userData;
          const local=surface.worldToLocal(target.clone()),r=girth(who);
          const x=MathUtils.clamp(local.x,-plan.width/2,plan.width/2),z=MathUtils.clamp(local.z,-plan.depth/2,plan.depth/2);
          for(const sign of [1,-1])for(const lateral of [0,.33,-.33]){
            for(const foot of [vec(x+lateral,0,sign*(plan.depth/2+r+.012)),vec(sign*(plan.width/2+r+.012),0,z+lateral)]){
              const goal=surface.localToWorld(foot);
              goal.y=Number.isFinite(who.site.x)?groundHeight(goal.x,goal.z,at.y):at.y;
              if(Math.hypot(target.x-goal.x,target.z-goal.z)>2.0)continue;
              const facing=Math.atan2(target.x-goal.x,target.z-goal.z);
              actor.position.copy(actor.parent?actor.parent.worldToLocal(goal.clone()):goal);
              for(const turn of [0,-.65,.65])for(const lean of [.10,.50,.83]){
                const yaw=facing+turn;actor.rotation.set(lean,yaw-parentYaw,0,'YXZ');
                const error=pose(target).distanceTo(target);
                options.push({goal,yaw,bend:lean,compression:crouch,error,cost:goal.distanceTo(at)+Math.abs(turn)*.085+Math.abs(lean)*.095});
              }
            }
          }
        }
      }
      actor.position.copy(origin);actor.quaternion.copy(rotation);actor.scale.y=scaleY;
      options.sort(ordered);
      for(const [tolerance,detour] of [[.15,false],[.15,true],[Infinity,false],[Infinity,true]]){
        const plan=usable(tolerance,detour);if(plan)return plan;
      }
      // Near a shelf corner the standable strip between a guest and the
      // work surface can be narrower than an angular sample. Advance the
      // foot by the remaining wrist error, testing that same swept route.
      if(closest && !fixed){
        for(let pass=0;pass<3 && closestGap>.033;pass++){
          const anchor=closest.points.at(-1),previousGap=closestGap,angle=Math.atan2(miss.x,miss.z);
          const stride=MathUtils.clamp(Math.hypot(miss.x,miss.z),.065,.44),yaw=closest.facing+parentYaw;
          options.length=0;
          for(const offset of [0,.40,-.40,.85,-.85,1.4,-1.4,Math.PI]){
            const goal=vec(anchor.x+Math.sin(angle+offset)*stride,anchor.y,anchor.z+Math.cos(angle+offset)*stride);
            for(const turn of [0,.22,-.22])for(const bend of [closest.bend,closest.bend+.16,closest.bend-.16]){
              options.push({goal,yaw:yaw+turn,bend:MathUtils.clamp(bend,-.50,.84),compression:closest.compression,error:0});
            }
          }
          const exact=usable(Infinity,false);if(exact)return exact;
          if(closestGap>=previousGap-.003)break;
        }
      }
      return closest;
    }
    // The shoulder blade glides under the sleeve on the last part of a
    // reach. Keep this offset on the proximal bone, where both the skin
    // and the knuckles follow, then ease it back when the load is released.
    const chest=actor.getObjectByName('torso') || actor.getObjectByName('trunk') || actor.getObjectByName('身頃');
    let shoulder=null,waist=null;
    function pivotFor(joint){
      let pivot=shoulderPivots.get(joint);
      if(!pivot){
        pivot=new Group();pivot.name='作業の体重移動';
        joint.parent.add(pivot);pivot.add(joint);shoulderPivots.set(joint,pivot);
      }
      return pivot;
    }
    function unloadShoulder(){
      if(shoulder)shoulder.position.set(0,0,0);
      if(waist)waist.position.set(0,0,0);
    }
    function shift(pivot,palm,offset){
      const space=pivot.parent;
      pivot.position.copy(space.worldToLocal(palm.clone().add(offset))).sub(space.worldToLocal(palm.clone()));
      return grip.getWorldPosition(vec());
    }
    function extendShoulder(target,palm){
      if(!shoulder){
        let joint=grip.parent;
        while(joint?.parent?.isBone)joint=joint.parent;
        if(!joint?.parent || joint===actor)return palm;
        shoulder=pivotFor(joint);
        if(chest && chest!==joint && chest!==actor && chest.getObjectById(grip.id))waist=pivotFor(chest);
      }
      // The weight moves over the planted leading leg before the scapula
      // advances. Carry the entire jacket, head and other shoulder with it.
      if(waist)palm=shift(waist,palm,target.clone().sub(palm).clampLength(0,.23));
      return shift(shoulder,palm,target.clone().sub(palm).clampLength(0,waist?.155:.24));
    }
    function pose(target){
      const left=side==='left' && limb.left;
      const other=state.handLoads?.get(left?limb.right:limb.left);
      const support=other && other.node.parent===other.grip?other.owner.actor.localToWorld(other.at.clone()):null;
      limb.pose(left?support:target,left?target:support);
      return grip.getWorldPosition(vec());
    }
    function supportedPose(wanted,palm,canStraighten=true){
      face.lastWorkingFrame=lastTime;
      palm=extendShoulder(wanted,palm);
      if(headDepth()>.003){
        face.clearNeck();palm=grip.getWorldPosition(vec());
      }
      if(canStraighten && headDepth()>.004){
        const pitchNow=actor.rotation.x,startPitch=pitch,startHeight=actor.scale.y;
        let depth=headDepth(),best=1;
        // The resting shoulders differ from the working pose, and the
        // handle moves while the artisan draws it. Ease out of the bow
        // before sliding the wrist to the target on this frame.
        for(const fraction of [.75,.5,.25,0]){
          unloadShoulder();actor.rotation.x=pitchNow-startPitch*(1-fraction);
          actor.scale.y=MathUtils.lerp(legScale,startHeight,fraction);
          palm=extendShoulder(wanted,pose(wanted));
          const remaining=headDepth();
          if(remaining<depth){best=fraction;depth=remaining;}
          if(depth<.004)break;
        }
        unloadShoulder();pitch=startPitch*best;actor.rotation.x=pitchNow-startPitch+pitch;
        actor.scale.y=MathUtils.lerp(legScale,startHeight,best);palm=extendShoulder(wanted,pose(wanted));
      }
      if(headDepth()>.003){face.clearNeck();palm=grip.getWorldPosition(vec());}
      return palm;
    }
    let settling=null;
    function neutral(){
      unloadShoulder();limb.restore();poseStoryHands(actor);
      actor.rotation.x-=pitch;actor.scale.y=legScale;actor.rotation.reorder(order);
    }
    function settle(t){
      if(!settling){
        const nodes=[];
        actor.traverse(joint=>{if(joint.isGroup || joint.isBone)nodes.push({joint,p:joint.position.clone(),q:joint.quaternion.clone(),s:joint.scale.clone()});});
        neutral();pitch=bend=0;compression=1;
        settling=nodes.filter(({joint,p,q,s})=>p.distanceToSquared(joint.position)>1e-12 ||
          q.angleTo(joint.quaternion)>1e-6 || s.distanceToSquared(joint.scale)>1e-12).map(entry=>({...entry,
          end:entry.joint.position.clone(),rotation:entry.joint.quaternion.clone(),scale:entry.joint.scale.clone()}));
      }
      for(const {joint,p,q,s,end,rotation,scale} of settling){
        joint.position.lerpVectors(p,end,t);joint.quaternion.slerpQuaternions(q,rotation,t);joint.scale.lerpVectors(s,scale,t);
      }
      actor.userData.storyPerforming=true;
      return grip.getWorldPosition(vec());
    }
    function release(){
      // The one hand that let go in a relay can relax while the other
      // resident is still carrying. Both wrists keep their actual owners.
      if(!settling){
        settle(0);const joints=settling;
        if(joints.length)relaxing.set(actor,{joints,time:0});
      }
      settling=null;planned=last=route=null;travel=retry=0;
      state.workingFocus=null;
      if(!relaxing.has(actor))delete actor.userData.storyPerforming;
      if(state.hero)delete state.hero.userData.storyReach;
    }
    sides[side]={actor,grip,station:state,release,settle,steady(target){
      unloadShoulder();
      const palm=supportedPose(target,pose(target));last=palm.clone();return palm;
    },get walking(){
      return !!route && travel<route.total-.025;
    },resumeAt(point){
      last=point.clone();planned=route=null;travel=retry=0;
      settling=null;relaxing.delete(actor);
    },reach(target,context){
      if(relaxing.delete(actor)){last=grip.getWorldPosition(vec());planned=route=null;}
      settling=null;
      const {dt,object}=context;unloadShoulder();
      state.workingFocus=context.drawer && /[hH]andle|pull|push/.test(context.phase)?context.drawer.handle:grip;
      actor.userData.storyPerforming=true;actor.rotation.reorder('YXZ');
      const home=remember(state,who);
      if(!last)last=grip.getWorldPosition(vec());
      let wanted=target.clone().sub(last).clampLength(0,Math.max(0,dt)*2.25).add(last);
      const ownerBound=object && (storyTool(actor,side)===object);
      // A tool going into its own keeper follows the elbow. Its owner keeps
      // both feet planted throughout the turn to their hip.
      let palm=pose(wanted);
      retry-=dt;
      if(!ownerBound && (palm.distanceTo(target)>.19 || headDepth()>.012 ||
          !route && retry<=0 && last.distanceTo(target)>.040) &&
          (!planned || planned.distanceTo(target)>.11 || !route && retry<=0)){
        route=approach(target);planned=target.clone();travel=0;retry=.55;
        if(route){bend=route.bend;compression=route.compression;}
      }
      if(route && context.phase==='carry' && route.total-travel>.65){
        const carrying=actor.localToWorld(rest.clone());
        carrying.y=Math.max(carrying.y,last.y-.055);
        wanted=carrying.sub(last).clampLength(0,dt*1.7).add(last);
      }
      if(route && !ownerBound){
        travel=Math.min(route.total,travel+dt*1.55);
        if(route.total>.003){
          const pos=stepAlong(route,travel/route.total);
          if(!home.path.length || home.path.at(-1).distanceToSquared(pos)>.105**2)home.path.push(pos.clone());
        }
        const parentForward=actor.parent?.getWorldDirection(vec());
        const road=route.heading-(parentForward?Math.atan2(parentForward.x,parentForward.z):0);
        const facing=route.total-travel>.65 && Number.isFinite(road)?road:route.facing;
        const offset=Math.atan2(Math.sin(facing-actor.rotation.y),Math.cos(facing-actor.rotation.y));
        actor.rotation.y+=MathUtils.clamp(offset,-dt*4.7,dt*4.7);
        if(travel>=route.total && Math.abs(offset)<.02)route=null;
        palm=pose(wanted);
      }
      if(!ownerBound){
        // Bend at the hips to reach a low floor or the bottom of the drawer.
        // Feet keep their contact with the floor as the knees yield.
        // A bend belongs at the work mark. Hold the head upright on the
        // approach, including where a corner goes past the end of a bench.
        const settled=route?MathUtils.smoothstep(.50-route.total+travel,0,.50):1;
        const next=MathUtils.damp(pitch,bend*settled,10,dt);
        actor.rotation.x+=next-pitch;pitch=next;
        actor.scale.y=MathUtils.damp(actor.scale.y,legScale*MathUtils.lerp(1,compression,settled),10,dt);
        palm=pose(wanted);
      }
      palm=supportedPose(wanted,palm,!ownerBound);
      last.copy(palm);
      return palm;
    }};
    return sides[side];
  }
  function workshopCrew(state){
    if(state.crew)return state.crew;
    const lead=operatorFor(state);
    let worker=lead,helper=null,changing=null,goal=null,least=Infinity,waiting=0,failed=new Set(),priorPhase=null;
    function occupied(op){const held=state.handLoads?.get(op.grip);return held && held.node.parent===op.grip;}
    function nextWorker(target,allowOwn=false){
      const choices=[];
      for(const who of state.people){
        if(!allowOwn && (who.actor===worker.actor || failed.has(who.actor)))continue;
        const limb=hands(who);
        for(const side of ['right','left']){
          if(!limb[side])continue;
          const tool=storyTool(who.actor,side);
          if(tool?.visible && (tool.isMesh || tool.children.length) && !state.tools.has(tool))continue;
          const op=operatorFor(state,who,side);
          if(occupied(op))continue;
          const cost=limb[side].getWorldPosition(vec()).distanceTo(target)+(side==='left'?.06:0)+
            (storyGrip(who.actor,side)?0:1.35)+(who===state.host?0:.24);
          choices.push({op,cost});
        }
      }
      choices.sort((a,b)=>a.cost-b.cost);
      return choices[0]?.op;
    }
    state.crew={actor:lead.actor,station:state,walkWithLoad:true,get grip(){return worker.grip;},settle(t){if(helper)helper.settle(t);return worker.settle(t);},release(){
      worker.release();if(helper)helper.release();
      worker=lead;helper=changing=goal=priorPhase=null;least=Infinity;waiting=0;failed.clear();
    },reach(target,context){
      if(context.phase==='reachItem' && context.object && state.handLoads){
        const load=[...state.handLoads.values()].find(hold=>hold.node===context.object && hold.node.parent===hold.grip);
        if(load?.owner){
          // After the free hand opens a drawer, the hand already under the
          // basket keeps it. Trying to catch one's own moving wrist makes
          // the tray circle the body instead of settling on the runners.
          const side=hands(load.owner).left===load.grip?'left':'right';
          worker=operatorFor(state,load.owner,side);helper=changing=null;priorPhase=context.phase;
          const palm=load.grip.getWorldPosition(vec());worker.resumeAt(palm);
          context.supportingGrip=load.grip;
          return palm;
        }
      }
      if(!priorPhase && (context.phase==='approachHandle' || context.phase==='reachItem')){
        worker=nextWorker(context.destination || target,true) || worker;
      }
      if(context.phase!==priorPhase){
        if(occupied(worker)){
          const free=nextWorker(target,true);
          if(free){worker=free;helper=changing=null;}
        }
        failed.clear();goal=null;waiting=0;least=Infinity;priorPhase=context.phase;
      }
      if(changing){
        // A resident on the far side offers a free hand. The first pair of
        // fingers keeps the load until the second touches that very spot.
        const held=worker.reach(changing,context),other=helper.reach(held,context);
        if(other.distanceTo(held)<.031){
          worker.release();worker=helper;helper=changing=null;waiting=0;goal=null;
          worker.resumeAt(other);return other;
        }
        waiting+=context.dt;
        if(waiting>2.5 && !helper.walking){failed.add(helper.actor);helper.release();helper=changing=null;waiting=0;}
        return held;
      }
      const palm=worker.reach(target,context),distance=palm.distanceTo(target);
      if(!goal || target.distanceTo(goal)>.055 || distance<least-.04){
        goal=target.clone();least=distance;waiting=0;
      }else waiting+=context.dt;
      // A longer path around a witness first goes away from the parcel's
      // final mark. Finish that walk before asking someone else to take it.
      if(distance>.035 && waiting>1 && !worker.walking){
        failed.add(worker.actor);
        helper=nextWorker(target);waiting=0;
        if(helper){
          if(['lift','carry','set','pull','push'].includes(context.phase)){
            changing=palm.clone();
          }else{
            worker.release();worker=helper;helper=null;goal=null;
          }
        }
      }
      return palm;
    }};
    return state.crew;
  }
  function park(){
    if (!run?.motion) return;
    const {pivot,node,parent}=run.motion;
    if(run.motion.beat.gesture==='taste' && !pivot.visible)node.visible=false;
    parent.attach(node);pivot.removeFromParent();run.motion=null;
  }
  function handsAtClose(state){
    const held=new Map([...state.held].filter(([,binding])=>binding.grip));
    const lowering=state.landing;
    if(lowering && lowering.elapsed<lowering.placement.span){
      const grip=lowering.courier || lowering.limb.right;
      const at=lowering.patch;
      if(grip.getWorldPosition(vec()).distanceTo(at)<.12)
        held.set(lowering.node,{grip,owner:lowering.courier?null:lowering.owner});
    }
    const m=state.motion;
    if(m?.pass && !m.pass.onWorktop){
      const hand=m.pass.owner,palm=hand.grip.getWorldPosition(vec());
      if(palm.distanceTo(m.contact.nearest(palm))<.09)held.set(m.node,{grip:hand.grip,owner:hand.who || null});
    }
    if(m && !m.pass && !m.beat.wholeDish && !held.has(m.node) && ['lift','turn','present','pass','pour'].includes(m.beat.gesture)){
      const owner=m.beat.gesture==='pass' && m.recipient?m.recipient:m.worker;
      const grip=m.heroActor || m.heroRecipient?state.heroPalm:hands(owner).right;
      if(grip){
        const palm=grip.getWorldPosition(vec()),bounds=localBounds(state.root,m.node);
        if(bounds.min.y>state.surface+.024 && palm.distanceTo(m.contact.nearest(palm))<.12)
          held.set(m.node,{grip,owner:grip===state.heroPalm?null:owner});
      }
    }
    return held;
  }
  function supportWaitingHands(state){
    for(const [grip,hold] of state.handLoads || []){
      if(hold.node.parent!==grip){state.handLoads.delete(grip);continue;}
      if(hold.owner){
        const limb=hands(hold.owner),point=hold.owner.actor.localToWorld(hold.at.clone());
        limb.pose(grip===limb.right?point:null,grip===limb.left?point:null);
        hold.owner.actor.userData.storyPerforming=true;
      }else if(state.hero){
        state.hero.userData.storyReach={point:state.hero.localToWorld(hold.at.clone()),strength:1};
      }
    }
  }
  function retireScenes(){
    if(transfers.busy())return;
    for(const state of retired){
      for(const [actor,home] of state.moved){
        const who=state.people.find(person=>person.actor===actor);
        if(who){
          returning.set(actor,{who,home,people:state.people,hero:state.hero,headDepth:headroom(state,who).depth});
        }
      }
      for(const hold of state.handLoads?.values() || [])if(hold.owner)delete hold.owner.actor.userData.storyPerforming;
      if(state.hero)delete state.hero.userData.storyReach;
      state.root.removeFromParent();retired.delete(state);
    }
  }
  function stop(){
    pending=null;
    if(!run)return;
    const state=run,operator=workshopCrew(state);state.paused=false;
    if(state.hero)delete state.hero.userData.storyReach;
    const held=handsAtClose(state);
    park();state.handLoads=new Map();
    for(const [node,{grip,owner}] of held){
      const item=state.items.find(item=>item.model===node || item.manipulated?.has(node));
      if(!item || !grip || item.nested===node)continue;
      const hand=grip.getWorldPosition(vec()),body=owner?.actor || state.hero;
      if(!body)continue;
      grip.attach(node);
      // A bent, compressed torso gives the wrist a non-uniform transform.
      // Measure the binding after reparenting to that actual wrist.
      const contact=node.worldToLocal(hand.clone());
      if(item.model===node)item.palmContact=contact;
      else (item.partContacts ??= new Map()).set(node,contact);
      state.handLoads.set(grip,{node,grip,owner,at:body.worldToLocal(hand)});
    }
    for(const who of state.people){
      if(![...state.handLoads.values()].some(h=>h.owner===who) && !transfers.busy({actor:who.actor}) && who.actor.userData.storyPerforming){
        poseStoryHands(who.actor);hands(who).restore();delete who.actor.userData.storyPerforming;
      }
    }
    const ordered=state.items.map(item=>({item,priority:item.palmContact?Infinity:localBounds(state.root,item.model).min.y}))
      .sort((a,b)=>b.priority-a.priority);
    for(const {item} of ordered){
      const {model,home,parcel,drawer,rest,palmContact:grip}=item;
      transfers.take(model);
      const adjust=restoreJoints(item,({child,parent,position,rotation,scale})=>{
        transfers.move(child,parent,position,rotation,{operator,grip:item.partContacts?.get(child),scale,lift:.075});
        return true;
      });
      if(parcel && releaseParcel?.(parcel,model,adjust,({model,parent,position,rotation,scale,finish,adjust})=>{
        transfers.move(model,parent,position,rotation,{operator,grip,scale,finish,adjust});
      }))continue;
      if(home){
        const at=home.parent.localToWorld(home.position.clone());
        if(model.getWorldPosition(vec()).distanceTo(at)<.001 &&
           model.getWorldQuaternion(new Quaternion()).angleTo(home.parent.getWorldQuaternion(new Quaternion()).multiply(home.rotation))<.001){
          home.parent.attach(model);adjust(1);
        }else{
          const elevated=home.parent===state.bench && model.getWorldPosition(vec()).y>at.y+.18;
          const neighbors=elevated?new Set([...state.items,...exhibits(state.bench)].map(entry=>entry.model)):null;
          const carryFloor=elevated?tabletopCarryFloor(state.bench,model,[...neighbors]):null;
          transfers.move(model,home.parent,home.position,home.rotation,{operator,grip,adjust,carryFloor});
        }
      }else{
        const position=item.archivePosition || storedAt(drawer,item.slot.position.x,model);
        transfers.move(model,drawer.front,position,rotationAtRest,{operator,grip,drawer,mode:'in',adjust,
          ...drawerLanding(item,state.items),finish(){
          drawer.concealWhenShut(model);
          if(item.split){item.nested?.removeFromParent();item.split.removeFromParent();}
          for(const state of rest)state.child.visible=state.visible;
        }});
      }
    }
    for(const [object,entry] of state.covered){
      const stored=object.parent===entry.drawer.front;
      object.visible=true;
      transfers.move(object,entry.home.parent,entry.home.position,entry.home.rotation,
        {operator,drawer:stored?entry.drawer:null,mode:stored?'out':null});
    }
    for(const tool of state.tools)toolRests.return(tool);
    effects.removeFromParent();
    if(steam)steam.visible=false;
    if(tools)for(const obj of Object.values(tools))obj.visible=false;
    retired.add(state);run=null;retireScenes();
  }
  function start(key,host,people,table,hero){
    stop();
    if(!performedScenes.has(key))return 0;
    if(transfers.busy()){
      pending={key,host,people,table,hero};
      return durationOf(performedScenes.get(key));
    }
    return prepare(key,host,people,table,hero);
  }
  function prepare(key,host,people,table,hero){
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
    const covered=new Map(),specs=score.props,plan=tablePlan(host.site.number,host.site.place);
    let workWidth=specs.length===1?.94:specs.length===2?1.13:1.34;
    const at=table?.worldToLocal(palm.clone());
    const edge=at && Math.hypot(Math.max(0,Math.abs(at.x)-plan.width/2),Math.max(0,Math.abs(at.z)-plan.depth/2));
    const useCounter=table && (residentBenches.get(host.actor)?.table===table || edge<Math.hypot(workWidth*.5,.29)+.10);
    const bench=useCounter?table:nearbyStand(host,palm,feet,surface,root.rotation.y);
    const drawer=useCounter?dress(table,host.site):workDrawer(bench);
    const locals=people.filter(s=>s.site.key===host.site.key);
    const state={score,cast:fieldCast(score,host.person.name),host,root,people:locals,hero,leaves:sideTrays.get(bench),
      heroPalm:hero?.getObjectByName('配達人の受け手'),heroMouth:hero?.getObjectByName('配達人の口元'),
      bench,table,useCounter,width:workWidth,tools:new Set(),operators:new Map(),covered,moved:new Map(),
      held:new Map(),supports:new Map(),motion:null,index:0,elapsed:0,finished:false};
    run=state;
    const operator=workshopCrew(state);
    const pull=drawer.handle.getWorldPosition(vec());
    const assistants=locals.filter(who=>who!==host && storyGrip(who.actor) && storyGrip(who.actor,'left'))
      .sort((a,b)=>hands(a).right.getWorldPosition(vec()).distanceTo(pull)-hands(b).right.getWorldPosition(vec()).distanceTo(pull));
    const assistant=(!storyGrip(host.actor) || locals.length>3 || right.distanceTo(pull)>1.75)?assistants[0]:null;
    for(const who of locals){
      const entry=returning.get(who.actor);
      if(entry){state.moved.set(who.actor,entry.home);returning.delete(who.actor);}
      if(who===host || who===assistant || score.beats.some(beat=>state.cast[beat.actor]===who.person.name))hideTools(who);
    }
    const registry=useCounter?exhibits(table):[],used=new Set(),occurrences=new Map();
    const items=specs.map((spec,i)=>{
      const parcel=parcelFor?.(key,spec,i,host.site),registered=parcel && parcelObject?.(parcel);
      const code=spec.code==='food'?'food/'+(SCENES.findIndex(s=>s.region===spec.region)+1):spec.code;
      const permanent=!registered && registry.find(({model})=>{
        if(used.has(model) || model.userData.parcelId || model.userData.storyEvidence!==code)return false;
        const variant=model.userData.storyVariant;
        if(spec.code==='food')return model.children.some(n=>n.name==='取り分ける餅' && n.visible);
        return variant===spec.variant || code==='basket' && !variant && ['joined-cake','leaf-marks'].includes(spec.variant);
      });
      const identity=[code,spec.variant || spec.role || '',spec.index || 0].join('/');
      const nth=occurrences.get(identity) || 0;occurrences.set(identity,nth+1);
      const storageKey=identity+'/'+nth;
      let model=registered || permanent?.model || drawer.contents.get(storageKey);
      const fresh=!model;
      if(fresh){
        model=buildProp(spec);
        if(spec.variant==='steam-repair')setEvidencePose(model,'single');
        drawer.contents.set(storageKey,model);
      }
      used.add(model);transfers.take(model);
      const home=permanent?.home || (registered && homeOf(model)),fromBag=Boolean(registered && !model.visible);
      if(registered)claimParcel?.(parcel,model);
      model.visible=true;
      const slot=new Group();root.add(slot);
      const bounds=localBounds(model,model),size=bounds.getSize(vec());
      if(fresh){
        const scale=Math.min(1.28,(Math.min(workWidth,drawer.w-.06)/specs.length-.025)/Math.max(.05,size.x),(drawer.d-.045)/Math.max(.05,size.z),drawer.clearHeight/Math.max(.05,size.y));
        model.scale.setScalar(scale);drawer.front.add(model);
        model.position.copy(storedAt(drawer,(i+.5-specs.length*.5)*(drawer.w-.06)/specs.length,model));
      }
      const scale=archiveScale(model),rest=jointRest(model);
      if(spec.sealed)sealCargoNote(model);
      if(score.beats.some(b=>b.tea && b.target===i))model.getObjectByName('湯呑みの茶面').position.y=.04;
      if(fromBag)model.visible=false;
      return {spec,model,slot,bounds,extent:size.multiply(scale),scale,rest,parcel:registered?parcel:null,home,fromBag,
        drawer,archivePosition:!home && model.position.clone(),stored:!home && model.parent===drawer.front};
    });
    // Shared imprints and the corresponding freight have the same unit.
    const liner=items.find(i=>['plate-liner','board-liner'].includes(i.spec.variant));
    const freight=items.find(i=>['sakai-boards','tsuruga-plates'].includes(i.spec.variant));
    if(liner && freight && !liner.home && !freight.home){
      const unit=Math.min(liner.scale.x,freight.scale.x);
      for(const item of [liner,freight]){
        item.model.scale.multiplyScalar(unit/item.scale.x);item.extent.multiplyScalar(unit/item.scale.x);item.scale.setScalar(unit);
      }
    }
    const body=items.find(i=>i.spec.variant==='repair-body'),bars=items.find(i=>i.spec.variant==='packing-bars');
    if(body && bars && !body.home){
      body.model.scale.multiplyScalar(bars.scale.x/body.scale.x);body.extent.multiplyScalar(bars.scale.x/body.scale.x);
      body.scale.copy(bars.scale);
    }
    workWidth=Math.max(workWidth,items.reduce((n,item)=>n+item.extent.x+.02,0));
    if(useCounter || residentBenches.get(host.actor)?.stand){
      const benchPlan=useCounter?plan:bench.userData,top=bench.userData.worktop;
      const remaining=registry.filter(e=>!used.has(e.model) && e.model.visible && e.model.parent===bench);
      const leaves=[...(sideTrays.get(bench) || [])].sort((a,b)=>a.getWorldPosition(vec()).distanceToSquared(palm)-b.getWorldPosition(vec()).distanceToSquared(palm));
      const occupiedLeaves=new Map(leaves.map(tray=>[tray,tray.children.filter(o=>o.userData.storyWorkObstacle)
        .map(o=>[o,localBounds(tray,o),true])]));
      const occupants=remaining.map(e=>{
        const box=localBounds(bench,e.model),size=box.getSize(vec());
        const tooLarge=size.x>drawer.w-.05 || size.y>drawer.clearHeight-.02 || size.z>drawer.d-.04;
        return [e.model,box,tooLarge && leaves.length>0];
      });
      for(const socket of bench.children.slice(1)){
        const parcel=socket.children.find(o=>o.userData.parcelId && o.visible && !used.has(o));
        if(parcel)occupants.push([parcel,localBounds(bench,parcel)]);
      }
      const nearest=useCounter ? vec(MathUtils.clamp(at.x,-plan.width*.4,plan.width*.4),top,
        MathUtils.clamp(at.z,-plan.depth*.38,plan.depth*.38)) : vec(0,top,0);
      const point=bench.localToWorld(nearest.clone());
      root.position.x=point.x;root.position.z=point.z;surface=point.y-feet.y;root.quaternion.copy(bench.getWorldQuaternion(new Quaternion()));
      const receivingPalm=hero?.userData.storyRestPalm?.clone() || state.heroPalm?.getWorldPosition(vec());
      function guestPalm(item){
        const name=item.spec.showFor;
        if(!name)return null;
        if(name===courier)return receivingPalm;
        const resident=locals.find(who=>who.person.name===name);
        return resident && hands(resident).right.getWorldPosition(vec());
      }
      // Keep installed implements in place. Set a collection parcel at the
      // guest's edge while the workshop crew are still preparing the counter.
      for(const item of items){
        if(!item.home || item.fromBag || !bench.getObjectById(item.model.id))continue;
        const box=localBounds(bench,item.model);
        if(Math.abs(box.min.y-top)>.16)continue;
        const palm=guestPalm(item);
        if(palm && bench.localToWorld(box.getCenter(vec())).distanceTo(palm)>.65)continue;
        item.inPlace=true;
        occupants.push([item.model,box,true]);
      }
      const patches=[{support:bench,plan:benchPlan,occupied:occupants},
        ...leaves.map(tray=>({support:tray,plan:tray.userData,occupied:occupiedLeaves.get(tray)}))];
      for(const item of items){
        if(item.inPlace)continue;
        const tried=[];
        let previous;
        function chooseLanding(from,redirect=false){
          let best;
          const guest=guestPalm(item);
          for(const patch of patches){
            const {support,plan,occupied}=patch;
            if(item.extent.x>plan.width-.02 || item.extent.z>plan.depth-.015)continue;
            const at=support.worldToLocal((guest || from).clone());
            const edges=guest?[at,vec(-plan.width,0,at.z),vec(plan.width,0,at.z),
              vec(at.x,0,-plan.depth),vec(at.x,0,plan.depth)]:[at];
            const seen=[];
            for(const edge of edges){
              const free=workingSpace(support,plan,edge,item.extent.x+.022,
                occupied.filter(([o])=>o!==item.model),item.extent.z*.5+.012,
                (x,z)=>!tried.some(p=>p.support===support && Math.hypot(x-p.x,z-p.z)<.16));
              if(!free || free.blocked.some(o=>o.userData.storyWorkObstacle) || redirect && free.blocked.length || seen.some(p=>Math.hypot(free.x-p.x,free.z-p.z)<.04))continue;
              seen.push(free);
              const point=support.localToWorld(vec(free.x,support.userData.worktop+.013,free.z));
              const rim=guest && point.clone().setY(point.y+item.extent.y*.55);
              const path=item.spec.showFor===courier && guest && courierMark?.(rim);
              const reachCost=item.spec.showFor===courier && guest && !path && rim.distanceTo(guest)>.35?12:0;
              const cost=(guest?guest.distanceTo(point)+from.distanceTo(point)*.12+reachCost:from.distanceTo(point))+
                free.cost*4+(support===bench?0:.08);
              if(!best || cost<best.cost)best={patch,point,free,cost};
            }
          }
          if(!best)return false;
          if(previous){
            const i=previous.findIndex(([model])=>model===item.model);
            if(i>=0)previous.splice(i,1);
          }
          const {patch,point,free}=best;
          for(const model of free.blocked){
            const entry=remaining.find(e=>e.model===model);
            if(!entry || model.userData.parcelId || covered.has(model))continue;
            covered.set(model,{drawer,home:entry.home});
            transfers.move(model,drawer.front,storedAt(drawer,entry.home.position.x,model),rotationAtRest,
              {operator,drawer,mode:'in',finish(){drawer.concealWhenShut(model);}});
            const i=occupants.findIndex(([o])=>o===model);
            if(i>=0)occupants.splice(i,1);
          }
          const mid=vec(free.x,patch.support.userData.worktop+.013+item.extent.y/2,free.z);
          previous=patch.occupied;
          previous.push([item.model,new Box3().setFromCenterAndSize(mid,item.extent),true]);
          tried.push({support:patch.support,x:free.x,z:free.z});
          item.landing=root.worldToLocal(point);
          if(redirect)item.slot.position.copy(item.landing);
          return true;
        }
        // Select a free patch from the actual source. A full counter needn't
        // send its worker to the opposite side of both the desk and the load.
        const source=item.stored?drawer.handle.getWorldPosition(vec()):item.model.getWorldPosition(vec());
        chooseLanding(source);
        item.alternate=()=>chooseLanding(item.model.localToWorld(item.bounds.getCenter(vec())),true);
      }
    }else{
      root.position.copy(bench.getWorldPosition(vec()));surface=bench.userData.worktop;
      root.quaternion.copy(bench.getWorldQuaternion(new Quaternion()));
    }
    const width=items.reduce((n,item)=>n+item.extent.x,0),gap=(workWidth-width)/items.length;
    let x=-workWidth*.5,preparing=0;
    for(const item of items){
      const {model,slot,bounds,scale,extent}=item;
      item.liner=item.spec.code==='food' && servingLiner(model);
      if(item.inPlace){slot.attach(model);continue;}
      slot.position.set(x+(extent.x+gap)*.5,surface+.013,0);x+=extent.x+gap;
      if(item.landing)slot.position.copy(item.landing);
      const at=bounds.getCenter(vec()).multiply(scale).negate();at.y=-bounds.min.y*scale.y;
      transfers.move(model,slot,at,rotationAtRest,{operator,drawer:item.stored?drawer:null,mode:item.stored?'out':null,
        alternate:item.alternate,lift:Math.max(.10,extent.y*.42+.045)});
      preparing++;
    }
    root.add(effects);
    if (score.beats.some(b=>steamingBeat(items[b.prop].spec,b))){
      steam ??= makeSteam();effects.add(steam);steam.visible=false;
    }
    root.updateWorldMatrix(true,true);
    Object.assign(state,{items,surface,width:workWidth,preparing:transfers.busy()});
    if(!state.preparing)beginBeat();
    return durationOf(score)+preparing*3;
  }
  function hideTools(who){
    const actor=who.actor;
    for(const side of ['right','left']){
      const tool=storyTool(actor,side),grip=storyGrip(actor,side);
      if(!tool || !grip || !tool.visible || tool.userData.unborrowable || (!tool.isMesh && !tool.children.length) || run.tools.has(tool))continue;
      run.tools.add(tool);
      toolRests.park(actor,tool,operatorFor(run,who,side),grip);
    }
  }
  // Handwork at a real station has no fixed duration. The platter leaves its
  // support when the paw reaches it, and the second paw takes the weight
  // only after both have rested on the same article for a moment.
  function fieldPass(m){
    const hero=run.hero,receiver=m.heroRecipient?hero:m.recipient?.actor;
    const sender=m.heroActor?hero:m.worker.actor;
    if(!sender || !receiver || sender===receiver)return null;
    const {pivot,contact}=m;
    function performer(who,body,side='right'){
      if(body!==hero){
        const op=operatorFor(run,who,side);
        op.resumeAt(op.grip.getWorldPosition(vec()));
        return {who,body,grip:op.grip,resume:p=>op.resumeAt(p),aim(point,phase,dt){
          return op.reach(point,{dt,phase,object:m.node});
        },get walking(){return op.walking;},steady:p=>op.steady(p),settle:t=>op.settle(t),release:()=>op.release()};
      }
      const grip=run.heroPalm;
      if(!grip)return null;
      function aim(point){
        hero.userData.storyReach={point:point.clone(),strength:1,handoff:true};
        return grip.userData.storyAim?.(hero.userData.storyReach) || grip.getWorldPosition(vec());
      }
      return {body,grip,aim,steady:aim,settle(){return grip.getWorldPosition(vec());},release(){}};
    }
    const giver=performer(m.worker,sender),taker=performer(m.recipient,receiver);
    if(!giver || !taker)return null;
    const palm=hand=>hand.grip.getWorldPosition(vec());
    const rest=hand=>hand.body===hero && hero.userData.storyRestPalm ? hero.userData.storyRestPalm.clone() : palm(hand);
    const landing=taker.body.worldToLocal(rest(taker));
    let meeting=null,offered=null,walk=null,slide=null,uncaught=0;
    let holder=giver,waiting=taker;
    // A delivered parcel may initially be exhibited far across the worktop.
    // The resident brings that exhibit back to the courier's hand first.
    let phase='pick',time=0,pad,firstPalm,receiverPad,gripAtCatch,available=0;
    const bodies=[...new Set([sender,receiver,...run.people.map(w=>w.actor)])];
    const targetOnItem=hand=>contact.nearest(palm(hand));
    let source=targetOnItem(holder);
    function centreOn(point,local){
      const offset=point.clone().sub(pivot.localToWorld(local.clone()));
      pivot.position.copy(run.root.worldToLocal(pivot.getWorldPosition(vec()).add(offset)));
    }
    let support;
    function saveSupport(){
      if(support?.holder!==holder){
        const joints=[];
        for(let joint=holder.grip;joint && joint!==holder.body.parent;joint=joint.parent){
          if(joint===hero)break;
          joints.push({joint,at:vec(),angle:new Quaternion(),scale:vec()});
        }
        support={holder,joints,at:vec(),angle:new Quaternion(),palm:vec()};
      }
      for(const j of support.joints){j.at.copy(j.joint.position);j.angle.copy(j.joint.quaternion);j.scale.copy(j.joint.scale);}
      support.at.copy(pivot.position);support.angle.copy(pivot.quaternion);support.palm.copy(palm(holder));
    }
    function carry(point,dt){
      const from=pivot.position.clone();
      centreOn(point,pad);
      contact.clearBodies(bodies);contact.lift();
      if(point.distanceTo(contact.nearest(point))>.043)contact.handoff(point,holder.body,bodies,.024,1);
      pivot.position.sub(from).clampLength(0,dt*2.1).add(from);
      const hand=holder.steady?.(contact.nearest(point)) || point;
      const patch=contact.nearest(hand);
      if(hand.distanceTo(patch)>.032 && support){
        // Neither the load nor the hand advances alone when a shoulder turns
        // into a neighbour. Keep the last supported pose; the other performer
        // can step up, or the parcel can go by way of the counter.
        for(const j of support.joints){j.joint.position.copy(j.at);j.joint.quaternion.copy(j.angle);j.joint.scale.copy(j.scale);}
        pivot.position.copy(support.at);pivot.quaternion.copy(support.angle);
        if(holder.body===hero)holder.aim(support.palm);
        return palm(holder);
      }
      pad=pivot.worldToLocal(patch);saveSupport();contact.rememberSupport();
      return hand;
    }
    function enter(which){
      phase=which;time=0;
      // Walking a long way with a load does not spend the time its recipient
      // needs to turn towards it, extend a hand and take the weight.
      if(which==='offer')uncaught=0;
    }
    function walkWithGift(){
      const walker=holder.body===hero?waiting:holder,other=walker===holder?waiting:holder;
      const path=walker.who && meetPartner(run,walker.who,other.body,other.who,m.size.x);
      if(!path || path.total<.09){enter('offer');return;}
      if(m.carriedBy===holder.body && path.total>2.4){
        // A turtle turning a hinge at the board need not carry it all the
        // way around a crowded bench if the same hand can set it down here.
        const at=pivot.position.clone();contact.restOnWorktop(1,bodies);
        const lowering=pivot.position.distanceTo(at);pivot.position.copy(at);
        if(lowering<.48){tableExchange();return;}
      }
      const yaw=walker.body.rotation.y,from=path.points.at(-1),to=palm(other);
      const targetYaw=path.facing ?? Math.atan2(to.x-from.x,to.z-from.z);
      const turn=Math.atan2(Math.sin(targetYaw-yaw),Math.cos(targetYaw-yaw));
      const arm=palm(walker).distanceTo(walker.body.getWorldPosition(vec()));
      // Turning the feet sweeps the outstretched paw through a larger arc.
      // Pace that outer arc as well as the distance travelled by the feet.
      walk={walker,path,yaw,turn,span:Math.max(.42,(path.total+Math.abs(turn)*arm)/1.16),
        at:holder.body.worldToLocal(palm(holder)),home:remember(run,walker.who)};
      enter('walk');
    }
    function callCourier(target,dt){
      if(!hero?.userData.storyRestPalm)return;
      const threshold=meeting?.route?.length ? .42 : .12;
      if(!meeting || meeting.point.distanceTo(target)>threshold)meeting={point:target.clone()};
      run.passMark=meeting;
    }
    function nearSideOfArticle(){
      if(waiting.body!==hero || !courierMark)return null;
      const center=pivot.getWorldPosition(vec()),radius=m.size.length()+.12,from=rest(waiting);
      const facing=Math.atan2(from.x-center.x,from.z-center.z),edges=[contact.nearest(from)];
      // A shell, bowl and tied bundle can be collected at either side, or
      // underneath the lip. A near-looking corner may face an occupied aisle.
      for(const turn of [0,.79,-.79,1.57,-1.57,2.36,-2.36,Math.PI]){
        const x=center.x+Math.sin(facing+turn)*radius,z=center.z+Math.cos(facing+turn)*radius;
        for(const y of [center.y-m.size.y*.50,center.y+m.size.y*.15]){
          const point=contact.nearest(vec(x,y,z));
          if(edges.every(e=>e.distanceToSquared(point)>.055**2))edges.push(point);
        }
      }
      for(const point of edges){
        const mark=courierMark(point,true);
        if(mark)return {...mark,point,precise:true};
      }
      return null;
    }
    function offerTo(hand){
      const anchor=hand===taker ? taker.body.localToWorld(landing.clone()) : rest(hand);
      const outward=anchor.clone().sub(hand.body.getWorldPosition(vec())).setY(0).normalize();
      return anchor.addScaledVector(outward,hand.body===hero?.13:.08);
    }
    // A clerk at a fixed gate and a visitor across a full bench can have
    // disjoint reach. Rest the article on the wood, slide it across under
    // the two palms, and lift it from the near edge.
    const attempted=[],relayed=new Set();
    function tableLanding(worker=waiting){
      const bench=run.bench,plan=run.useCounter?tablePlan(run.host.site.number,run.host.site.place):bench.userData;
      const wrist=rest(worker),options=[];
      const preferred=bench.worldToLocal(wrist.clone());
      const lipX=Math.max(0,plan.width*.50-Math.min(.09,m.size.x*.12)),lipZ=Math.max(0,plan.depth*.50-Math.min(.065,m.size.z*.12));
      const spots=[[MathUtils.clamp(preferred.x,-lipX,lipX),MathUtils.clamp(preferred.z,-lipZ,lipZ)]];
      for(const along of [0,-.55,.55,-1,1])for(const side of [-1,1])spots.push([along*lipX,side*lipZ],[side*lipX,along*lipZ]);
      for(const [x,z] of spots){
        pivot.position.copy(run.root.worldToLocal(bench.localToWorld(vec(x,plan.top??plan.worktop,z))));
        contact.restOnWorktop(1,bodies);
        const patch=contact.nearest(wrist),cost=patch.distanceTo(wrist);
        options.push({position:pivot.position.clone(),patch,cost});
      }
      options.sort((a,b)=>a.cost-b.cost);
      const fresh=options.filter(q=>attempted.every(p=>p.distanceTo(q.position)>.15));
      if(!fresh.length)attempted.length=0;
      const candidates=fresh.length?fresh:options;
      let chosen=candidates[0];
      if(worker.body===hero && courierMark){
        for(const option of candidates){
          const mark=courierMark(option.patch);
          if(mark){chosen=option;meeting={...mark,point:option.patch};run.passMark=meeting;break;}
        }
      }
      attempted.push(chosen.position);
      return chosen.position;
    }
    function tableExchange(){
      const at=pivot.position.clone();
      contact.restOnWorktop(1,bodies);
      const start=pivot.position.clone();
      const seated=!pad || start.distanceTo(at)<.025;
      pivot.position.copy(at);
      slide={at,start,seated,first:0,across:0};enter('counter');
    }
    function onTable(dt){
      if(!slide.seated){
        const origin=pivot.getWorldPosition(vec()),target=run.root.localToWorld(slide.start.clone());
        const desired=target.add(pivot.localToWorld(pad.clone()).sub(origin));
        if(holder.body===hero)callCourier(desired,dt);
        const wrist=holder.aim(desired,'set',dt);
        carry(wrist,dt);
        const here=pivot.position.clone();
        contact.restOnWorktop(1,bodies);
        const gap=here.distanceTo(pivot.position);pivot.position.copy(here);
        if(gap>.025){
          if(time>2.8){
            slide.start=tableLanding(holder);pivot.position.copy(here);time=0;
          }
          return;
        }
        slide.seated=true;slide.start.copy(here);run.passMark=meeting=null;
      }
      if(!slide.end){
        const here=pivot.position.clone(),edge=targetOnItem(waiting);
        const mark=waiting.body===hero && (nearSideOfArticle() || courierMark?.(edge));
        if(mark){meeting={...mark,point:mark.point || edge};run.passMark=meeting;}
        // First let the guest collect the stationary piece. A desk does
        // not need a sliding exchange when its near rim is already in reach.
        slide.end=here;slide.start.copy(here);time=0;
      }
      const {end}=slide;
      const previous=pivot.position.clone(),difference=end.clone().sub(previous).setY(0);
      const length=difference.length(),patch=meeting?.precise && waiting.body===hero?contact.nearest(meeting.point):targetOnItem(waiting);
      // The recipient can take a paper from anywhere along the slide.
      // Keeping them at an arbitrary end mark would send a paper past a
      // paw that is already resting on it.
      let take=palm(waiting);
      if(!slide.push || slide.push.body!==waiting.body || length<=.012)take=waiting.aim(patch,'reachItem',dt);
      if(waiting.body===hero && !meeting)callCourier(patch,dt);
      if(length>.012 && take.distanceTo(contact.nearest(take))>.032){
        if(!slide.push){
          const team=[holder,waiting];
          for(const who of run.people){
            if(team.some(h=>h.body===who.actor) || !storyGrip(who.actor))continue;
            team.push({who,body:who.actor,grip:hands(who).right});
          }
          const available=team.filter(hand=>!(slide.tried || []).includes(hand.body));
          if(!available.length)slide.tried=[];
          const choice=(available.length?available:team).sort((a,b)=>{
            const gap=h=>palm(h).distanceTo(targetOnItem(h))+(h.body===hero?.16:0);
            return gap(a)-gap(b);
          })[0];
          slide.push=choice.aim?choice:performer(choice.who,choice.body);
          slide.tried??=[];slide.pushWait=0;
        }
        const hand=slide.push;
        let before=palm(hand);
        if(slide.pushPad){
          const hold=pivot.localToWorld(slide.pushPad.clone());
          before=hand.steady?.(hold) || before;
        }
        const edge=contact.nearest(before);
        const touching=before.distanceTo(edge)<.032;
        if(!touching)slide.pushPad=null;
        else if(!slide.pushPad)slide.pushPad=pivot.worldToLocal(edge.clone());
        const advance=difference.multiplyScalar(Math.min(1,.72*dt/length));
        const step=run.root.localToWorld(previous.clone().add(advance)).sub(run.root.localToWorld(previous.clone()));
        const anchor=slide.pushPad?pivot.localToWorld(slide.pushPad.clone()):edge;
        // Reach the article itself before aiming beyond its edge. The world's
        // gait samples an idle shoulder at the start of each frame, so restore
        // the actual contact before measuring a pushing stroke.
        const desired=touching?anchor.clone().add(step):anchor;
        const wrist=hand.aim(desired,touching?'carry':'reachItem',dt);
        if(hand.body===waiting.body && wrist.distanceTo(contact.nearest(wrist))<=.032){
          // A recipient reaching an edge to slide it closer has already
          // caught the load. Use the solved joint on this frame, before
          // the idle gait is sampled again.
          waiting=hand;receiverPad=pivot.worldToLocal(contact.nearest(wrist));
          gripAtCatch=waiting.body.worldToLocal(wrist.clone());
          run.passMark=meeting=null;enter('received');return;
        }
        if(!touching && wrist.distanceTo(contact.nearest(wrist))<.032)slide.pushPad=pivot.worldToLocal(contact.nearest(wrist));
        if(hand.body===hero && before.distanceTo(edge)>.34)callCourier(edge,dt);
        // When a pile of exhibits blocks the slide, the next artisan can
        // lift the article at their own contact and take it around the pile.
        // No change of wrist is implied by a timeout alone.
        if(hand.body!==waiting.body && hand.body!==hero && touching && wrist.distanceTo(contact.nearest(wrist))<.032 &&
            !relayed.has(hand.body) && (attempted.length>=2 || previous.y>end.y+.065)){
          relayed.add(hand.body);
          if(holder.body!==hand.body)holder.release();
          holder=hand;pad=pivot.worldToLocal(contact.nearest(wrist));firstPalm=wrist;
          slide=null;offered=null;uncaught=0;run.passMark=meeting=null;
          saveSupport();enter('raise');return;
        }
        // Do not move a resting object while the pusher is walking into
        // position. Project the displacement of the solved hand along the
        // board, and validate the contact again at the new item position.
        let driven=0;
        if(touching && wrist.distanceTo(anchor)<step.length()+.035 && step.lengthSq()>0){
          driven=MathUtils.clamp(wrist.clone().sub(anchor).dot(step)/step.lengthSq(),0,1);
          pivot.position.addScaledVector(advance,driven);contact.restOnWorktop(1,bodies);
          if(wrist.distanceTo(contact.nearest(wrist))>.032 || previous.distanceTo(pivot.position)>dt*.95){
            pivot.position.copy(previous);driven=0;
          }
        }
        if(driven>.01){slide.pushWait=0;slide.tried=[];}
        else slide.pushWait+=dt;
        if(slide.pushWait>1.45){
          slide.tried.push(hand.body);slide.push=null;slide.pushPad=null;
        }
        if(time<8)return;
      }
      const gap=take.distanceTo(contact.nearest(take));

      if(gap>.032){
        const feet=waiting.body.getWorldPosition(vec());
        if(!slide.feet || feet.distanceTo(slide.feet)>.13 || gap<(slide.gap??Infinity)-.035){
          slide.feet=feet;slide.gap=gap;slide.wait=0;
        }
        slide.wait+=dt;
        if(slide.wait>1.65 || time>9){
          const at=pivot.position.clone();
          if(waiting.body===hero && !slide.surveyed && !meeting?.precise){
            slide.surveyed=true;
            const near=nearSideOfArticle();
            if(near){meeting=run.passMark=near;slide.end=at;slide.wait=time=0;return;}
          }
          if(waiting.who && hands(waiting.who).left && !slide.otherHand){
            const side=waiting.grip===hands(waiting.who).left?'right':'left';
            waiting.release();waiting=performer(waiting.who,waiting.body,side);slide.otherHand=true;
          }
          run.passMark=meeting=null;
          const next=tableLanding();pivot.position.copy(at);
          slide={at,start:at,end:next,seated:true,first:0,across:Math.max(.48,at.distanceTo(next)/.72),otherHand:slide.otherHand};
          time=0;
        }
        return;
      }
      receiverPad=pivot.worldToLocal(contact.nearest(take));gripAtCatch=waiting.body.worldToLocal(take.clone());
      run.passMark=meeting=null;enter('received');
    }
    // The fish offers the dish from the dry lip of the pool. Leave it on
    // its support until the guest reaches its real rim and takes its weight.
    if(m.beat.fromWorktop)tableExchange();
    else if(m.carriedBy===sender){
      const wrist=palm(giver),patch=contact.nearest(wrist);
      if(patch.distanceTo(wrist)<=.032){
        // The artisan just turned this very part in the same hand. Keep
        // its edge under the fingers while the feet turn to the visitor.
        pad=pivot.worldToLocal(patch);firstPalm=wrist;saveSupport();enter('raise');
      }
    }
    return {get phase(){return phase;},get onWorktop(){return phase==='pick' || phase==='counter' && slide.seated;},
      get owner(){return phase==='received'?waiting:holder;},
      hold(){
        if(phase!=='received')return;
        const goal=waiting.body.localToWorld(gripAtCatch.clone());
        if(waiting.steady)waiting.steady(goal);else waiting.aim(goal);
      },
      frame(dt){
        time+=dt;uncaught+=dt;
        if(uncaught>9 && (phase==='offer' || phase==='pick'))tableExchange();
        if(phase==='counter'){onTable(dt);return false;}
        if(phase==='pick'){
          const wrist=holder.aim(source,'reachItem',dt);
          const rim=contact.nearest(wrist);
          if(wrist.distanceTo(rim)>.032){
            source=rim;
            if(holder.body===hero && time>.20)callCourier(rim,dt);
            if(holder===giver && sender===hero && time>3.8 && !meeting?.route?.length){
              holder=taker;waiting=giver;source=targetOnItem(holder);time=0;
              run.passMark=meeting=null;
            }
            if(holder.body!==hero && time>3.4 && !holder.grip.parent?.isBone){
              const helper=run.people.filter(who=>who.actor!==holder.body && who.actor!==waiting.body && storyGrip(who.actor))
                .sort((a,b)=>hands(a).right.getWorldPosition(vec()).distanceTo(rim)-hands(b).right.getWorldPosition(vec()).distanceTo(rim))[0];
              if(helper){holder.release();holder=performer(helper,helper.actor);time=0;}
            }
            return false;
          }
          run.passMark=meeting=null;
          pad=pivot.worldToLocal(rim);firstPalm=wrist;saveSupport();enter('raise');
        }else if(phase==='raise'){
          const rise=smooth(time/.36);
          if(m.level)pivot.quaternion.identity().slerp(m.level,rise);
          const point=firstPalm.clone();point.y+=.10*rise;
          carry(holder.aim(point,'lift',dt),dt);
          if(time>=.36)walkWithGift();
        }else if(phase==='walk'){
          const {walker,path,yaw,turn,at,home,span:travel}=walk;
          const u=smooth(time/travel);
          const feet=stepAlong(path,u);
          if(!home.path.length || home.path.at(-1).distanceToSquared(feet)>.10**2)home.path.push(feet.clone());
          walker.body.rotation.y=yaw+turn*u;
          const target=holder.body.localToWorld(at.clone());
          carry(holder.steady?.(target) || holder.aim(target,'hold',dt),dt);
          if(time>=travel){
            walker.resume(palm(walker));walk=null;enter('offer');
          }
        }else if(phase==='offer'){
          const destination=offerTo(waiting);
          const target=pivot.localToWorld(pad.clone()).add(destination.clone().sub(contact.nearest(destination)));
          // Once the gift is offered, hold it still. The arriving courier
          // must be able to close the last handspan without chasing a rim
          // that moves away each time they turn their body toward it.
          if(!offered && time>3.2 && !holder.walking && destination.distanceTo(contact.nearest(destination))<.38)offered=holder.body.worldToLocal(palm(holder));
          const desired=offered?holder.body.localToWorld(offered.clone()):holder.body===hero?rest(holder).lerp(target,.48):target;
          if(offered){
            const correction=destination.clone().sub(contact.nearest(destination));
            desired.add(correction.clampLength(0,.26));
          }
          const pursuing=!offered || holder.body===hero || desired.distanceTo(palm(holder))>.17;
          const start=pursuing?holder.aim(desired,'carry',dt):holder.steady(desired);
          const wrist=carry(start,dt);
          if(!holder.walking && wrist.distanceTo(contact.nearest(wrist))<.035)pad=pivot.worldToLocal(contact.nearest(wrist));
          const other=waiting.aim(targetOnItem(waiting),'reachItem',dt);
          // A held article is never interpolated between disjoint hands.
          const near=contact.nearest(other);
          if(time>1.8 && !holder.walking && waiting.body===hero && other.distanceTo(near)>.05)callCourier(near,dt);
          const touch=other.distanceTo(near)<.032 && wrist.distanceTo(contact.nearest(wrist))<.045;
          available=touch?available+dt:0;
          if(available>=.15){
            receiverPad=pivot.worldToLocal(near);gripAtCatch=waiting.body.worldToLocal(other.clone());
            available=0;run.passMark=meeting=null;enter('received');
          }
        }else if(phase==='received'){
          const goal=waiting.body.localToWorld(gripAtCatch.clone());
          if(slide?.seated)goal.y+=.075*smooth(time/.38);
          let wrist=waiting.steady?.(goal) || waiting.aim(goal,'hold',dt);
          centreOn(wrist,receiverPad);contact.lift();
          if(waiting.steady)wrist=waiting.steady(contact.nearest(wrist));
          if(holder.body!==hero)holder.settle(smooth(time/.38));
          else if(waiting.body!==hero)delete hero.userData.storyReach;
          if(time>=.38){
            holder.release();
            if(waiting.body===hero)waiting.aim(wrist);
            if(waiting.body===giver.body){
              holder=giver;waiting=taker;pad=receiverPad;firstPalm=wrist;offered=null;slide=null;uncaught=0;attempted.length=0;
              saveSupport();enter('raise');
            }else{gripAtCatch=waiting.body.worldToLocal(wrist.clone());return true;}
          }
        }
        return false;
      }};
  }
  function beginBeat(){
    const previous=run.motion;
    park();
    const {score,index,items,root,host,people,surface}=run;
    const beat=score.beats[index],g=beat.gesture,item=items[beat.prop];
    const name=run.cast[beat.actor],partnerName=run.cast[beat.partner];
    const worker=name===courier?host:people.find(s=>s.person.name===name);
    const recipient=beat.partner!=null && people.find(s=>s.person.name===partnerName);
    const limb=hands(worker);
    worker.actor.userData.storyPerforming=true;
    const node=actionPart(item,beat),parent=node.parent;
    if(node!==item.model)(item.manipulated ??= new Set()).add(node);
    // A previously received prop now has a new hand or a new support.
    // It has followed the old wrist up to this exact frame.
    for(const part of run.held.keys()) {
      if(part===node || part.getObjectById(node.id) || node.getObjectById(part.id))run.held.delete(part);
    }
    const serving=g==='pass' && score.key.startsWith('food/');
    if(serving)item.liner?.();
    const level=serving && levelServing(root,node);
    const bounds=localBounds(root,node),start=bounds.getCenter(vec()),size=bounds.getSize(vec());
    if(!run.supports.has(node))run.supports.set(node,node.getWorldQuaternion(new Quaternion()));
    const pivot=new Group();pivot.position.copy(start);root.add(pivot);pivot.attach(node);
    const bench = run.useCounter ? run.table : root;
    const plan = run.useCounter ? tablePlan(host.site.number,host.site.place) : {width:run.width,depth:.53,top:surface};
    const obstacles = [];
    for (const [i,other] of items.entries()) {
      if (other===item || ((g==='fit' || beat.surface) && i===beat.target)) continue;
      obstacles.push(other.model);
    }
    if (run.useCounter) for (const exhibit of bench.children) {
      if (exhibit.visible && exhibit.userData.storyEvidence && !items.some(entry=>entry.model===exhibit)) obstacles.push(exhibit);
    }
    const contact = createWorkContact(pivot,node,bench,plan,obstacles);
    let carriedBy=null;
    if(g==='pass' && previous?.node===node && (previous.heroActor?name===courier:name!==courier && previous.worker===worker) &&
       ['lift','turn','present'].includes(previous.beat.gesture)){
      const hand=previous.heroActor?run.heroPalm:previous.limb.right;
      if(hand){
        const wrist=hand.getWorldPosition(vec());
        if(contact.nearest(wrist).distanceTo(wrist)<=.032)carriedBy=previous.heroActor?run.hero:previous.worker.actor;
      }
    }
    const dest=start.clone(),focus=beat.target==null?null:items[beat.target];
    const board=beat.surface && focus?.model.getObjectByName(beat.surface);
    const target=focus && localBounds(root,board || focus.model);
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
      if(target) {dest.copy(goal);dest.y=(board?bearingHeight(root,board,goal,size):target.max.y)+size.y/2+.002;}
      else dest.y=surface+size.y/2+.009;
      if(beat.offset){dest.x+=size.x*beat.offset[0];dest.z+=size.z*beat.offset[1];}
    }
    if(beat.beside){dest.x+=size.x*1.5;dest.y=surface+size.y*.5+.005;}
    if (g==='divide') {dest.x+=Math.max(.095,size.x*.46);dest.y+=.025;}
    // Align detachable geometry at the sockets cut in the original object.
    let socket;
    if (beat.part==='蒸し箱の上段') socket=beat.pose==='single'?vec(-.48,0,0):vec(0,beat.pose==='spaced'?.212:.171,0);
    if (beat.part?.startsWith('取り外し桟') && g==='fit') socket=vec((Number(beat.part.at(-1))-1)*.213,.169,0);
    if (beat.part==='欠けた蝶番' && g==='fit')socket=item.model.getObjectByName('欠けの破片')?.position.clone();
    if(beat.part==='水鉢の合い蓋' && g==='fit')socket=vec();
    if (socket){
      const receiver=g==='fit' && beat.part?.startsWith('取り外し桟') && focus ? focus.model : item.model;
      const delta=receiver.localToWorld(socket).sub(node.getWorldPosition(vec()));
      dest.copy(start).add(delta.applyQuaternion(root.getWorldQuaternion(new Quaternion()).invert()));
    }
    let fitting;
    const railFit=g==='fit' && beat.part?.startsWith('取り外し桟') && (focus || item);
    const metalFit=g==='fit' && beat.part==='欠けた蝶番' && focus?.model.getObjectByName('欠けの破片');
    const nest=beat.nest && focus?.model.getObjectByName(beat.nest);
    const lid=beat.part==='水鉢の合い蓋' && (g==='fit'?item.model:beat.socket && item.model.getObjectByName(beat.socket));
    if(railFit || metalFit || nest || lid){
      fitting=fitToSocket(pivot,node,metalFit || nest || lid || railFit.model,railFit ? vec((Number(beat.part.at(-1))-1)*.213,.169,0) : null,nest ? .78 : 1);
      dest.copy(fitting.position);
    }
    if(node.name==='継ぎ目から離す餅'){
      fitting=fitToSocket(pivot,node,parent,vec(.044,0,0));
      dest.copy(fitting.position);
    }
    if(beat.reseat){
      const rest=item.rest.find(part=>part.child===node);
      fitting=fitToSocket(pivot,node,rest.parent,new Matrix4().compose(rest.position,rest.rotation,rest.scale));
      dest.copy(fitting.position);
    }
    const liner=focus?.model.getObjectByName('中敷き');
    let angleY=g==='divide'?(node.name==='割餅左'?1.12:-1.12):0;
    if(g==='fit' && liner){
      const inner=localBounds(root,liner);dest.copy(inner.getCenter(vec()));dest.y=inner.max.y+size.y/2+.003;
      if(focus.spec.variant==='board-liner')angleY=Math.PI/2;
    }
    const right=limb.right.getWorldPosition(vec()), left=limb.left?.getWorldPosition(vec());
    const sign=!left || root.worldToLocal(right.clone()).x>=root.worldToLocal(left.clone()).x?1:-1;
    const physicalPass=g==='pass' && (name===courier?run.hero:worker) && (partnerName===courier?run.hero:recipient);
    const travel=[];
    // Keep each actor on their own side. Other workers may already be at the
    // bench from the preceding beat. Include them and the folding legs in
    // each swept route and keep the host at the apron for a courier handoff.
    for(const [who,side] of [[worker,sign],[g==='pass' && recipient,-sign]]){
      if(physicalPass || beat.wholeDish || !who || who.external || travel.some(m=>m.who===who))continue;
      const travellerGives = name===courier;
      const partner = g==='pass' && (who===recipient ? (travellerGives ? run.hero : worker.actor) : partnerName===courier ? run.hero : null);
      let move=partner && meetPartner(run,who,partner,partner===run.hero?null:worker,size.x);
      if(who===host && !move && !residentBenches.has(host.actor))continue;
      const home=who.actor.getWorldPosition(vec());
      const target=root.localToWorld(start.clone());
      if(!move && Math.hypot(home.x-target.x,home.z-target.z)<1.18)continue;
      for(const lane of [side,-side]){
        if(move)break;
        move=walkTo(run,who,root.localToWorld(vec(lane*(run.width*.5+(forwardReach[who.person.species] || girth(who))+.09),0,-.08)));
        if(move)break;
      }
      if(!move)continue;
      const a=who.actor,end=move.points.at(-1);
      if(!run.moved.has(a))run.moved.set(a,{position:a.position.clone(),rotation:a.quaternion.clone(),path:[a.position.clone()]});
      const toward=partner ? partner.getWorldPosition(vec()) : target;
      const yaw=move.facing ?? Math.atan2(toward.x-end.x,toward.z-end.z);
      move.yaw=a.rotation.y;move.turn=Math.atan2(Math.sin(yaw-move.yaw),Math.cos(yaw-move.yaw));
      travel.push(move);
    }
    if(run.hero && carriedBy!==run.hero)delete run.hero.userData.storyReach;
    const prior=score.beats[index-1];
    const page=readCargoNote(pivot,node,item.model,beat.archive) ||
      !(prior?.gesture==='pass' && prior.prop===beat.prop) && turnWorkPage(pivot,node,item.spec.code,g);
    const tea=g==='sip'?sipTea(pivot,node,worker.actor):beat.tea?pourTea(pivot,node,focus.model.getObjectByName('湯呑み'),tools.stream):null;
    run.motion={beat,pivot,parent,node,start,dest,page,tea,fitting,nest,fitAnchor:metalFit || (railFit && railFit.model),contact,size,goal,angleY,level,worker,recipient,limb,sign,travel,carriedBy,
      heroActor:name===courier,heroRecipient:partnerName===courier,approach:travel.reduce((n,m)=>Math.max(n,m.total/1.3),0)};
    if(physicalPass)run.motion.pass=fieldPass(run.motion);
    if(beat.wholeDish){
      pivot.updateWorldMatrix(true,true);
      const rim=dishRim(node,pivot);
      if(rim){
        const hand=operatorFor(run,worker),patch=rim.nearest(hand.grip.getWorldPosition(vec()));
        run.motion.dish={hand,pad:pivot.worldToLocal(patch),angle:0,contactTime:0};
      }
    }
    run.elapsed=0;
  }
  function pose(t,travelProgress=1){
    if(run.motion.dish)return;
    if(run.motion.pass){
      if(run.finished)run.motion.pass.hold();
      for(const binding of run.held.values())binding.follow();
      return;
    }
    const stampBeat=run.motion.beat;
    if(stampBeat.stamp)run.items[stampBeat.target].model.getObjectByName(stampBeat.stamp).visible=t>=.81;
    const {root,items,hero}=run;
    const {beat,pivot,node,start,dest,contact,size,goal,angleY,limb,sign,worker,recipient,travel,heroActor,heroRecipient}=run.motion;
    const g=beat.gesture,r=smooth((t-.19)/.72),reach=smooth(t/.26),arc=Math.sin(r*Math.PI);
    for(const move of travel){
      if(run.motion.retreat?.who===move.who)continue;
      const u=travelProgress;
      stepAlong(move,u);
      const route=run.moved.get(move.who.actor).path;
      if(!route.length || route.at(-1).distanceToSquared(move.who.actor.position)>.12**2)route.push(move.who.actor.position.clone());
      move.who.actor.position.y+=.024*Math.sin(Math.PI*u)*Math.abs(Math.sin(u*move.total*Math.PI/.34));
      move.who.actor.rotation.y=move.yaw+move.turn*u;
    }
    if(g==='pass' && recipient && !heroActor && !worker.external && size.x>.40 && r>.33){
      if(run.motion.retreat===undefined){
        const at=worker.actor.getWorldPosition(vec()),other=hands(recipient).right.getWorldPosition(vec());
        const away=Math.atan2(at.x-other.x,at.z-other.z),step=Math.min(.67,.16+size.x*.53);
        run.motion.retreat=null;
        for(const turn of [0,.46,-.46,.93,-.93,1.45,-1.45]){
          const goal=at.clone().add(vec(Math.sin(away+turn)*step,0,Math.cos(away+turn)*step));
          const path=walkTo(run,worker,goal);
          if(!path)continue;
          run.motion.retreat=path;
          if(!run.moved.has(worker.actor))run.moved.set(worker.actor,{position:at.clone(),rotation:worker.actor.quaternion.clone(),path:[at.clone()]});
          break;
        }
      }
      if(run.motion.retreat){
        const u=smooth((r-.33)/.64),a=worker.actor;
        stepAlong(run.motion.retreat,u);
        const path=run.moved.get(a).path;
        if(!path.length || path.at(-1).distanceToSquared(a.position)>.12**2)path.push(a.position.clone());
      }
    }
    // Put the item's edge against the palm. If its centre followed the palm,
    // wide boats and bowls would disappear halfway through the rice body.
    const heroHand=run.heroPalm && (run.hero.userData.storyRestPalm?.clone() || run.heroPalm.getWorldPosition(vec()));
    function presentedTo(actor,palm) {
      const forward=actor.getWorldDirection(vec()).setY(0).normalize();
      return root.worldToLocal(palm.clone().addScaledVector(forward,.05+Math.min(.30,size.z*.45))
        .add(vec(0,Math.min(.15,size.y*.44),0)));
    }
    let target=dest;
    if(g==='pass'){
      if(recipient)target=presentedTo(recipient.actor,hands(recipient).right.getWorldPosition(vec()));
      else if(heroRecipient && heroHand)target=presentedTo(hero,heroHand);
    }
    pivot.position.lerpVectors(start,target,r);
    if(g==='taste' && run.heroMouth){
      const forward=hero.getWorldDirection(vec());
      const lip=run.heroMouth.getWorldPosition(vec()).addScaledVector(forward,.025+size.z*.46);
      const bite=smooth((t-.16)/.52);
      pivot.position.lerpVectors(start,root.worldToLocal(lip),bite);
      pivot.position.y+=Math.sin(bite*Math.PI)*.08;
      // The bite vanishes at the lips, then the empty hand lowers.
      pivot.scale.setScalar(1-smooth((t-.69)/.23)*.995);
      pivot.visible=t<.92;
    }
    if(['turn','lift','set','pass','stack','fit','divide','open'].includes(g))pivot.position.y+=.077*arc;
    const angle=g==='turn'?-2.76:g==='open'?-1.03:g==='present'?-.34:g==='pour'?.95:0;
    pivot.rotation.set(angle*r,angleY*r,(g==='divide'?-.34:g==='pour'?-.22:0)*r);
    if(run.motion.level)pivot.quaternion.identity().slerp(run.motion.level,smooth(t/.57));
    if(run.motion.fitting)run.motion.fitting.pose(r);
    if(items[beat.prop].spec.code==='food')poseStoryFood(node,g,r);
    if(beat.ricePacket)poseRicePackets(items[beat.target??beat.prop].model,beat.ricePacket,r);
    if(beat.wholeDish){pivot.position.copy(start);pivot.quaternion.identity();}
    const free=['lift','turn','present','pass'].includes(g) && !beat.pose && !beat.archive && !beat.wholeDish;
    const bodies=run.motion.bodies ??= [...new Set([worker.actor,recipient?.actor,hero].filter(Boolean))];
    if(free && r>0)contact.clearBodies(bodies);
    if(run.motion.page)run.motion.page.pose(r);
    else if(beat.unfold){pivot.position.copy(start);pivot.quaternion.identity();}
    else contact.lift();
    if(run.motion.fitting)pivot.position.lerp(run.motion.fitting.position,smooth((r-.74)/.26));
    if(beat.surface && g==='set')pivot.position.lerp(dest,smooth((r-.75)/.25));
    const edge=contact.edge;
    // A wide tray may be received underneath, and a rice parcel by its knot.
    // Use the reachable surface facing this recipient even if they approach
    // from the same side as the giver.
    const taking=g==='pass' && recipient && (heroActor || recipient!==worker) ? hands(recipient) : null;
    const receivingEdge=()=>{
      const palm=taking?.right.getWorldPosition(vec()) || heroHand;
      return palm ? contact.nearest(palm) : edge(-sign);
    };

    if(run.motion.tea)run.motion.tea(t);
    if(!beat.tea && tools?.stream.visible){
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
    if(run.motion.page){right=run.motion.page.corner();if(left)left=run.motion.page.spine();}
    if(beat.unfold){right=openLunchLeaf(node,r).getWorldPosition(vec());left=null;}
    if(g==='divide' && left){
      const item=items[beat.prop];
      const other=item.split?.children[0] || (node.name==='継ぎ目から離す餅' && item.model.getObjectByName('敷き葉に残す餅'));
      if(other)left.copy(root.localToWorld(localBounds(root,other).getCenter(vec())));
    }
    right.lerp(limb.right.getWorldPosition(vec()),1-reach);
    if(left)left.lerp(limb.left.getWorldPosition(vec()),1-reach);
    // For an action selected by the courier, the resident steadies the
    // exhibit while the visible traveller reaches toward it. During an
    // outgoing delivery the recipient takes it from the traveller directly.
    if(g!=='taste' && !(g==='pass' && heroActor && recipient)){
      if(g==='pass' && !heroActor && (heroRecipient || recipient)){
        const release=1-smooth((r-.58)/.35);
        right.lerp(limb.right.getWorldPosition(vec()),1-release);
        if(left)left.lerp(limb.left.getWorldPosition(vec()),1-release);
      }
      limb.pose(right,left,contact.penetration);
    }
    if(taking){
      recipient.actor.userData.storyPerforming=true;
      taking.pose(taking.right.getWorldPosition(vec()).lerp(receivingEdge(),smooth((r-.04)/.32)),null,contact.penetration);
    }
    // Once fingers close on a loose article, it follows the solved joint.
    // For a pass, transfer control only as the recipient reaches the rim.
    if(free && reach>0){
      const senderEdge=edge(sign),receiverEdge=receivingEdge();
      const wristDelta=(limb,from)=>limb.right.getWorldPosition(vec()).sub(from);
      const riceDelta=(from)=>heroHand ? heroHand.clone().add(from.clone().sub(heroHand).clampLength(0,.30)).sub(from) : vec();
      let delta=heroActor?riceDelta(senderEdge):wristDelta(limb,senderEdge);
      if(g==='pass'){
        const transfer=smooth((r-.32)/.36);
        if(taking)delta.lerp(wristDelta(taking,receiverEdge),transfer);
        else if(heroRecipient && heroHand)delta.lerp(riceDelta(receiverEdge),transfer);
      }
      // Match the working wrist within the limits of the furniture. A part
      // still bolted to its parent has its own authored socket and stays put.
      delta.multiplyScalar(smooth((t-.17)/.30));
      const at=pivot.getWorldPosition(vec()).add(delta);
      pivot.position.copy(root.worldToLocal(at));
      if(r>0)contact.clearBodies(bodies);
      contact.lift();
      if(!heroActor && g!=='pass')limb.pose(edge(sign),limb.left?edge(-sign):null,contact.penetration);
      if(heroActor && g!=='pass' && heroHand)contact.handoff(heroHand,hero,bodies,.245,smooth((t-.21)/.36));
      if(g==='pass' && r>.18){
        if(heroRecipient && heroHand)contact.handoff(heroHand,hero,bodies,.245,smooth((r-.18)/.43));
        if(taking){
          const palm=taking.right.getWorldPosition(vec());
          contact.handoff(palm,recipient.actor,bodies,.025,smooth((r-.18)/.43));
          taking.pose(receivingEdge(),null,contact.penetration);
        }
      }
    }
    if(free && r>0){
      const donor=heroActor ? run.heroPalm : limb.right;
      const taker=g==='pass' && (heroRecipient ? run.heroPalm : taking?.right);
      const gapAt=hand=>{
        if(!hand)return Infinity;
        const palm=hand.getWorldPosition(vec());return palm.distanceTo(contact.nearest(palm));
      };
      const gap=Math.min(gapAt(donor),gapAt(taker));
      if(gap>.035){
        const pads=(g==='pass' && r>.80?[taker]:g==='pass' && r>.30?[donor,taker]:[donor])
          .filter(Boolean).map(hand=>hand.getWorldPosition(vec()));
        contact.restOnWorktop(smooth((gap-.035)/.06)*smooth((t-.16)/.24),bodies,pads);
        if(!heroActor && g==='pass' && r<.68)limb.pose(contact.nearest(limb.right.getWorldPosition(vec())),null,contact.penetration);
        if(taking)taking.pose(receivingEdge(),null,contact.penetration);
      }
    }
    if(g==='pass' && recipient && !heroActor){
      // Keep a continuous swept trajectory as the basket rounds two bodies.
      // The accepting fingers meet the rim at its actual rendered position.
      const m=run.motion;
      if(m.previous){
        const distance=Math.max(0,lastTime-m.sampled)*2.4;
        pivot.position.sub(m.previous).clampLength(0,distance).add(m.previous);
        if(taking)taking.pose(receivingEdge(),null,contact.penetration);
        if(r<.58)limb.pose(edge(sign),limb.left?edge(-sign):null,contact.penetration);
      }
      contact.rememberSupport();m.previous=pivot.position.clone();m.sampled=lastTime;
    }
    if(hero && (heroActor || g==='pass' && heroRecipient)){
      const point=g==='pass'?(heroRecipient?receivingEdge():edge(sign)):g==='taste'?pivot.getWorldPosition(vec()):free && heroActor && heroHand?contact.nearest(heroHand):right;
      if(g==='taste' && heroHand){
        // Support the near rim of the bite while the far edge meets the lip.
        point.addScaledVector(heroHand.clone().sub(point).normalize(),Math.min(size.x*.43,.15));
      }
      hero.userData.storyReach={point,taste:g==='taste',strength:g==='taste'?reach*(1-smooth((t-.85)/.15)):heroActor?reach:smooth((r-.04)/.27)};
    }
    for(const [held,binding] of run.held)if(held!==node){
      if(binding.courierPoint && !heroActor && !(g==='pass' && heroRecipient) && heroHand){
        hero.userData.storyReach={point:binding.courierPoint.clone().lerp(heroHand,smooth(t/.40)),strength:1};
      }
      binding.follow();
    }
    if(steam)poseStorySteam(steam,root,beat,items[beat.prop],node,pivot,size,lastTime,r);
  }
  function setDown() {
    const {node,pivot,contact,beat,recipient,heroRecipient,heroActor,limb:sender,worker}=run.motion;
    const receiver=beat.gesture==='pass' && recipient;
    const courier=(beat.gesture==='pass'?heroRecipient:heroActor) && run.heroPalm;
    const limb=receiver?hands(receiver):sender;
    const grip=courier || limb.right;
    const placement=placeWithinReach(pivot,node,contact,run.supports.get(node),grip);
    run.held.delete(node);park();
    run.landing={node,limb,courier,owner:receiver?recipient:worker,placement,patch:placement.pose(0),elapsed:0};
  }
  function lower(dt) {
    const m=run.landing,remaining=m.placement.span-m.elapsed,step=Math.min(dt,remaining);
    m.elapsed+=step;
    const grip=m.patch=m.placement.pose(smooth(m.elapsed/m.placement.span));
    if(m.courier)run.hero.userData.storyReach={point:grip,strength:1};
    else m.limb.pose(grip,null);
    if(m.elapsed>=m.placement.span-1e-8){run.landing=null;++run.index;beginBeat();}
    return dt-step;
  }
  function update(time){
    const dt=lastTime===null?0:Math.max(0,time-lastTime);lastTime=time;
    for(const [actor,job] of relaxing){
      job.time+=dt;const t=smooth(Math.min(1,job.time/.34));
      for(const {joint,p,q,s,end,rotation,scale} of job.joints){
        joint.position.lerpVectors(p,end,t);joint.quaternion.slerpQuaternions(q,rotation,t);joint.scale.lerpVectors(s,scale,t);
      }
      if(t>=1){relaxing.delete(actor);delete actor.userData.storyPerforming;}
    }
    updateReturns(dt);
    for(const state of retired)supportWaitingHands(state);
    transfers.update(dt);retireScenes();
    if(pending && !transfers.busy()){
      const {key,host,people,table,hero}=pending;pending=null;prepare(key,host,people,table,hero);
    }
    if(!run)return;
    if(run.finished){
      if(!run.paused)pose(1);
      else for(const binding of run.held.values())binding.follow();
      return;
    }
    let remaining=dt;
    if(run.preparing){
      if(transfers.busy())return;
      run.preparing=false;beginBeat();remaining=0;
    }
    while(run && !run.finished){
      if(run.landing){
        remaining=lower(remaining);
        if(run.landing || remaining<=0)return;
      }
      const {beat,approach}=run.motion;
      if(run.motion.dish){
        const {dish,pivot,node}=run.motion;
        const turning=beat.gesture==='turn';
        const angle=turning?Math.min(.44,dish.angle+remaining*.48):0;
        pivot.rotation.y=angle;
        const point=pivot.localToWorld(dish.pad.clone());
        const palm=dish.hand.reach(point,{dt:remaining,phase:'dishRim',object:node});
        if(point.distanceTo(palm)<=.028){
          dish.angle=angle;dish.contactTime+=remaining;
        }else pivot.rotation.y=dish.angle;
        remaining=0;
        if(turning?dish.angle<.44:dish.contactTime<.45)return;
        if(turning)dish.hand.release();
      }else if(run.motion.pass){
        const finished=run.motion.pass.frame(remaining);
        remaining=0;
        pose(finished?1:0);
        if(!finished)return;
      }else{
        const actionSpan=duration(beat),span=actionSpan+approach,advance=Math.min(remaining,span-run.elapsed);
        run.elapsed+=advance;remaining-=advance;
        pose(Math.max(0,run.elapsed-approach)/actionSpan,approach?smooth(run.elapsed/approach):1);
        if(run.elapsed<span-1e-8)return;
      }
      if(run.motion.nest){
        const {node,nest}=run.motion;
        nest.attach(node);node.position.set(0,0,0);node.quaternion.identity();node.scale.setScalar(.78);
        run.motion.parent=nest;run.items[beat.prop].nested=node;
      }
      if(run.motion.fitAnchor){
        const {node,fitAnchor}=run.motion;
        run.held.set(node,{follow:followStoryGrip(node,fitAnchor)});
      }
      if(beat.gesture==='pass'){
        const {recipient,heroRecipient,node}=run.motion;
        const grip=run.motion.pass?.owner.grip || (heroRecipient?run.heroPalm:recipient && hands(recipient).right);
        if(grip)run.held.set(node,{grip,owner:heroRecipient?null:recipient,follow:followStoryGrip(node,grip)});
      }
      const next=run.score.beats[run.index+1];
      const keep=run.motion.heroActor && run.heroPalm && next && next.prop!==beat.prop &&
        run.cast[next.actor]!==courier && !(next.gesture==='pass' && run.cast[next.partner]===courier) &&
        ['lift','turn','present'].includes(beat.gesture);
      if(keep){
        const {node}=run.motion;
        run.held.set(node,{grip:run.heroPalm,owner:null,follow:followStoryGrip(node,run.heroPalm),courierPoint:run.hero.userData.storyReach?.point?.clone()});
      }else if(!run.motion.page && needsSetDown(beat,next)){setDown();continue;}
      if(++run.index<run.score.beats.length){beginBeat();continue;}
      // Let the player read and walk around the result before the exhibit
      // is put away. The next exchange or walking away restores the table.
      run.finished=true;
    }
  }
  function updatePerformance(time){
    update(time);
    const states=run?[run,...retired]:retired;
    for(const state of states)for(const who of state.people){
      const face=headroom(state,who);
      // The beak is the working hand for some species. Its contact has
      // already been solved together with the item on this frame.
      if(face.head && (face.lastWorkingFrame!==lastTime || !face.head.getObjectById(hands(who).right.id)))face.clearNeck();
    }
  }
  return {start,stop,update:updatePerformance,dress,dressResident,atHome,pause(){if(run?.finished)run.paused=true;},
    clear(){
      stop();transfers.finish();retireScenes();
      for(const [actor,job] of relaxing){
        for(const {joint,end,rotation,scale} of job.joints){joint.position.copy(end);joint.quaternion.copy(rotation);joint.scale.copy(scale);}
        delete actor.userData.storyPerforming;
      }
      relaxing.clear();
      for(const [actor,{home}] of returning){actor.position.copy(home.position);actor.quaternion.copy(home.rotation);delete actor.userData.storyAway;}
      returning.clear();
    },get tidyingSite(){return retired.values().next().value?.host.site || null;},
    controls(actor){return transfers.busy({actor}) || !!run?.moved.has(actor);},
    get passMark(){return run?.passMark;},get playing(){return !!pending || !!run && !run.finished;},get beat(){return run?.index;},get gesture(){return run?.motion?.beat.gesture;},get focus(){const state=run || retired.values().next().value;return state && !state.paused ? (state.workingFocus || state.motion?.pivot || state.landing?.node)?.getWorldPosition(focus) || null : null;}};
}
