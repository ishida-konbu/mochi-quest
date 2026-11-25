import { BUILD_MODULES, ATTACHMENTS, CAMP_RADIUS, MAX_CAMPS, MAX_STRUCTURES, MAX_WOOD, HEIGHT_STEP, chestOnFloor } from './living-build-state.js';
import { buildDistance, surveySite, stumpCovered, timberTree } from './living-build-land.js';
import { timberCut } from './homestead-timber-section.js';
import { buildContacts } from './living-build-contacts.js';
import { bindFelledTrees } from './living-build-trees.js';
import { clearHandReach } from './living-sites.js';
import { RESOURCES } from './living-resources.js';
import { forgetMarketStand, marketRemovalReason, settleMarket } from './living-market.js';
import { replaceBuildContacts, terrainContactHeight, wrapDelta } from './terrain.js';
export { HEIGHT_STEP, MAX_HEIGHT_STEPS } from './living-build-state.js';
export { BUILD_MODULES, buildState, validBuildState } from './living-build-state.js';
export { surveySite, closestTimberTrees, nearestTimberTree, timberTree } from './living-build-land.js';

let active=null;
export function syncBuildTerrain(world) {
  active=world;
  const cleared=(world?.felledTrees??[]).map(timberTree).filter(Boolean);
  bindFelledTrees(cleared.map(tree=>tree.id));
  const contacts=buildContacts(world?.structures??[]);
  for(const tree of cleared) {
    if(stumpCovered(world,tree))continue;
    const cut=timberCut(tree);
    for(const stem of cut.culms??[cut]) contacts.push({x:stem.x,z:stem.z,yaw:0,w:2*stem.radius,d:2*stem.radius,
      bottom:tree.ground-.15,top:stem.y,kind:'oval',support:true});
  }
  replaceBuildContacts(contacts);
}
export function withBuildTerrain(world,fn) {
  const prev=active;
  if(prev===world)return fn();
  syncBuildTerrain(world);
  try{return fn();}finally{syncBuildTerrain(prev);}
}
// A file can carry well-formed numbers for an impossible plot. Re-survey the
// old land, with this journey's verified trunks cleared, before accepting it.
export function validBuildLand(world,state) {
  if(world.felledTrees.some(id=>!timberTree(id)))return false;
  if(!world.structures.length)return true;
  return withBuildTerrain(world,()=>{
    const surveyState={npcs:state?.npcs,objects:state?.objects,restoringBuild:true};
    return world.structures.every(s=>{
      if(s.parentId)return true;
      const site=surveySite(world,s.kind,s,{excludeId:s.id,state:surveyState});
      if(!site.ok || site.regionId!==s.regionId || site.entryBay!==s.entryBay)return false;
      // Before paid piers existed, every accepted ground plot fit within
      // 52 cm and used the envelope survey alone for its finished level.
      return (site.legacyFoundation ? site.relief<=.52 : s.foundationWood===site.foundationWood) &&
        Math.abs(site.y-s.y)<.025 && site.terrain===s.terrain;
    });
  });
}
function changed(world) {
  if(active===world)syncBuildTerrain(world);
}
const fail=reason=>({ok:false,reason});
const ok=message=>({ok:true,message});
const onFoot=p=>p?.grounded && !p.activity && !p.mount && !p.skiff && !p.vessel && !p.inWater && (p.h??0)<.2;
const hasStock=s=>Object.values(s.inventory).some(n=>n>0) || s.batches.length>0;
const transform=s=>({x:s.x,y:s.y,z:s.z,yaw:s.yaw,terrain:s.terrain,regionId:s.regionId});
const costText=(w,c)=>'木材'+w+'本'+(c?'と'+c+'文':'');
const partsFor = kind => kind==='hut' ? ['floor','posts','wall','roof'] : [kind];

export function constructionSite(world,kind,pose,options={}) {
  const site=surveySite(world,kind,pose,{...options,excludeId:undefined});
  if(!site.ok)return site;
  const def=BUILD_MODULES[kind], count=partsFor(kind).length;
  if(world.structures.length+count>MAX_STRUCTURES || world.nextStructureId>Number.MAX_SAFE_INTEGER-count)
    return fail('建てられる部材は全部で'+MAX_STRUCTURES+'点です。使わない部材を片付けてください。');
  if(kind==='camp' && world.structures.filter(s=>s.kind==='camp').length>=MAX_CAMPS)return fail('野営地は三か所までです。使わない野営地を片付けてください。');
  const wood=def.wood+site.foundationWood;
  if(world.wood<wood || world.wallet<def.coins)
    return fail(def.name+'には'+costText(wood,def.coins)+'が要ります。'+(site.foundationWood?'うち基礎に木材'+site.foundationWood+'本を使います。':''));
  return site;
}

export function placeStructure(world,kind,pose,options={}) {
  const site=constructionSite(world,kind,pose,options);
  if(!site.ok)return site;
  const def=BUILD_MODULES[kind],parts=partsFor(kind);
  const floorId='build-'+world.nextStructureId;
  const structures=parts.map((part,i)=>({
    id:'build-'+(world.nextStructureId+i),kind:part,...transform(site),
    ...(!site.parentId && !ATTACHMENTS.includes(part)?foundationRecord(site):{}),
    ...(i===0 && site.entryBay!==undefined?{entryBay:site.entryBay}:{}),
    ...(site.campId?{campId:site.campId}:{}),
    ...(site.parentId || ATTACHMENTS.includes(part)?{parentId:site.parentId??floorId}:{}),
    ...(part==='chest'?{inventory:{},costs:{},batches:[]}:{}),
  }));
  world.wood-=def.wood+site.foundationWood;world.wallet-=def.coins;
  world.nextStructureId+=parts.length;
  world.structures=[...world.structures,...structures];
  changed(world);
  return {...ok(def.name+'を設けました。'),structure:structures[0]};
}

// The performance is transient. Publish its final footing and the paid-for
// structure together before the caller writes the next journey snapshot.
export function finishConstruction(world,kind,pose,state,exit) {
  if (!onFoot(state?.player) || !exit || ![exit.x,exit.y,exit.z,exit.heading].every(Number.isFinite))
    return fail('作業を終える足場を確かめて、もう一度建ててください。');
  const arrival={x:exit.x,y:exit.y,z:exit.z,heading:Math.atan2(Math.sin(exit.heading),Math.cos(exit.heading)),h:0,
    vx:0,vy:0,vz:0,speed:0,grounded:true,idleTime:0};
  const result=placeStructure(world,kind,pose,{state:{...state,player:{...state.player,...arrival}}});
  if (result.ok) Object.assign(state.player,arrival);
  return result;
}

function foundationRecord(site){
  return {foundationWood:site.foundationWood,...(site.heightSteps?{heightSteps:site.heightSteps}:{})};
}

function movedStructure(source,site){
  if(site.legacyFoundation)return source;
  const {parentId,foundationWood,heightSteps,entryBay,campId,...record}=source;
  return {...record,...transform(site),...(site.parentId?{parentId:site.parentId}:foundationRecord(site)),
    ...(site.campId?{campId:site.campId}:{}),...(site.entryBay!==undefined?{entryBay:site.entryBay}:{})};
}

// A wall or post moves with its supporting deck. An attached chest can also
// be picked up separately. Only roots count toward the centre of rotation.
export function getMoveRoots(world,ids){
  const selected=new Set(ids);
  for(const s of world.structures)if(selected.has(s.id) && ATTACHMENTS.includes(s.kind))selected.add(s.parentId);
  return world.structures.filter(s=>selected.has(s.id) && !selected.has(s.parentId));
}

function onSelectedSupport(structures,player){
  if(!player?.grounded || !Number.isFinite(player.y))return false;
  const nearby=structures.filter(s=>buildDistance(s,player)<(s.heightSteps?14:4));
  return buildContacts(nearby).some(part=>{
    const dx=wrapDelta(player.x-part.x),dz=wrapDelta(player.z-part.z),c=Math.cos(part.yaw),sn=Math.sin(part.yaw);
    const u=Math.abs(dx*c-dz*sn),v=Math.abs(dx*sn+dz*c);
    const top=part.kind==='roof'?part.top+part.rise*Math.max(0,1-v/(part.d/2)):part.top;
    return u<=part.w/2+.08 && v<=part.d/2+.08 && Math.abs(player.y-top)<.055 &&
      player.y>terrainContactHeight(player.x,player.z)+.06;
  });
}

function checkedSelection(world,ids){
  return Array.isArray(ids) && ids.length && ids.every(id=>world.structures.some(s=>s.id===id));
}
function familyPose(source,floor){
  return {...source,...(source.kind==='chest'?chestOnFloor(floor):transform(floor)),campId:floor.campId};
}
function groupTargets(world,roots,delta){
  const {dx=0,dz=0,yaw=0,heightSteps=0,pivot}=delta;
  if(![dx,dz,yaw].every(Number.isFinite) || !Number.isSafeInteger(heightSteps) ||
      pivot && ![pivot.x,pivot.z].every(Number.isFinite))return null;
  const cx=pivot?.x??roots.reduce((n,s)=>n+s.x,0)/roots.length;
  const cz=pivot?.z??roots.reduce((n,s)=>n+s.z,0)/roots.length;
  const c=Math.cos(yaw),sn=Math.sin(yaw);
  const targets=new Map();
  for(const s of roots){
    const u=s.x-cx,v=s.z-cz,x=cx+dx+u*c+v*sn,z=cz+dz-u*sn+v*c;
    const y=s.y+terrainContactHeight(x,z)-terrainContactHeight(s.x,s.z)+heightSteps*HEIGHT_STEP;
    const heading=s.yaw+yaw;
    targets.set(s.id,{...s,x,y,z,yaw:Math.atan2(Math.sin(heading),Math.cos(heading)),heightSteps:(s.heightSteps??0)+heightSteps});
  }
  for(const s of world.structures)if(targets.has(s.parentId))targets.set(s.id,familyPose(s,targets.get(s.parentId)));
  return targets;
}
function moveRank(s){return s.kind==='camp'?0:s.kind==='floor'?1:2;}

export function surveyMoveGroup(world,ids,delta={},options={}){
  if(!checkedSelection(world,ids))return fail('移す建物を選んでください。');
  const roots=getMoveRoots(world,ids),targets=groupTargets(world,roots,delta);
  if(!targets)return fail('場所と高さを確かめてください。');
  const proposed=()=>world.structures.filter(s=>targets.has(s.id)).map(s=>targets.get(s.id));
  const blocked=reason=>({...fail(reason),structures:proposed(),woodDelta:0,coinsDelta:0});
  const before=world.structures.filter(s=>targets.has(s.id));
  if(onSelectedSupport(before,options.state?.player))return blocked('建物から地面に降りてから移してください。');
  const draft={...world,structures:world.structures.filter(s=>!targets.has(s.id))};
  let woodDelta=0;
  const ordered=roots.slice().sort((a,b)=>moveRank(a)-moveRank(b));
  for(const [i,s] of ordered.entries()){
    const pose=targets.get(s.id);
    const future=ordered.slice(i+1).map(r=>targets.get(r.id));
    const snapChest=roots.length===1 || (s.kind==='chest' && draft.structures.some(f=>
      f.kind==='floor' && buildDistance(chestOnFloor(f),pose)<1e-6 && Math.abs(Math.sin((f.yaw-pose.yaw)/2))<1e-7));
    const site=surveySite(draft,s.kind,pose,{state:options.state,sourceRecord:s,reservedRoots:future,snapChest});
    if(!site.ok)return {...blocked(site.reason),...(site.treeId?{treeId:site.treeId}:{})};
    const moved=movedStructure(s,site);
    woodDelta+=site.foundationWoodDelta;
    draft.structures.push(moved);targets.set(s.id,moved);
    for(const child of before.filter(v=>v.parentId===s.id)){
      const linked=familyPose(child,moved);
      draft.structures.push(linked);targets.set(child.id,linked);
    }
  }
  for(const s of draft.structures){
    if(!s.campId || s.parentId)continue;
    const camp=draft.structures.find(c=>c.id===s.campId);
    if(!camp || buildDistance(camp,s)>CAMP_RADIUS)return blocked('野営地と設備が離れすぎます。設備も一緒に選ぶか、近くに移してください。');
  }
  const result={structures:proposed(),woodDelta,coinsDelta:0};
  if(world.wood<woodDelta)return {...fail('移設先の基礎には、追加で木材'+woodDelta+'本が要ります。'),...result};
  if(!Number.isSafeInteger(world.wood-woodDelta))return {...fail('戻る木材を受け取る空きが足りません。'),...result};
  return {ok:true,...result};
}

export function moveStructureGroup(world,ids,delta,options){
  const result=surveyMoveGroup(world,ids,delta,options);
  if(!result.ok)return result;
  if(result.structures.some(s=>s.kind==='stand'))settleMarket(world);
  const moved=new Map(result.structures.map(s=>[s.id,s]));
  world.structures=world.structures.map(s=>moved.get(s.id)??s);
  world.wood-=result.woodDelta;
  changed(world);
  return {...result,message:'選んだ建物を移しました。'};
}

export function moveStructure(world,id,pose,options={}){
  const s=world.structures.find(s=>s.id===id);
  if(!s || !pose)return fail('移す設備を選んでください。');
  if(ATTACHMENTS.includes(s.kind))return fail('取り付けた部材は板床と一緒に移せます。');
  const result=moveStructureGroup(world,[id],{dx:pose.x-s.x,dz:pose.z-s.z,yaw:(pose.yaw??0)-s.yaw,
    heightSteps:(pose.heightSteps??s.heightSteps??0)-(s.heightSteps??0)},options);
  return result.ok?{...result,structure:result.structures.find(v=>v.id===id)}:result;
}

export function surveyRemoveGroup(world,ids,options={}){
  if(!checkedSelection(world,ids))return fail('片付ける建物を選んでください。');
  const chosen=new Set(ids);
  const structures=world.structures.filter(s=>chosen.has(s.id) || chosen.has(s.parentId));
  const removed=new Set(structures.map(s=>s.id));
  const remaining=world.structures.filter(s=>!removed.has(s.id));
  const wood=structures.reduce((n,s)=>n+BUILD_MODULES[s.kind].wood+(s.foundationWood??0),0);
  const coins=structures.reduce((n,s)=>n+BUILD_MODULES[s.kind].coins,0);
  const receipt={structures,woodDelta:-wood,coinsDelta:-coins};
  const blocked=reason=>({...fail(reason),...receipt});
  if(onSelectedSupport(structures,options.state?.player))return blocked('建物から地面に降りてから片付けてください。');
  for(const s of structures){
    if(s.kind==='camp' && remaining.some(v=>v.campId===s.id))return blocked('この野営地に設備が残っています。一緒に選ぶか、先に移してください。');
    if(s.kind==='posts' && remaining.some(v=>v.parentId===s.parentId && ['wall','roof'].includes(v.kind)))return blocked('柱が支えている壁と屋根も選んでください。');
    if(s.kind==='chest' && hasStock(s))return blocked('道具櫃の品をすべて取り出してから片付けてください。');
    if(s.kind==='stand'){
      const reason=marketRemovalReason(world,s.id);
      if(reason)return blocked(reason);
    }
  }
  if(!Number.isSafeInteger(world.wood+wood) || !Number.isSafeInteger(world.wallet+coins))return blocked('木材か銭を受け取る空きが足りません。');
  return {ok:true,...receipt};
}

export function removeStructureGroup(world,ids,options={}){
  const result=surveyRemoveGroup(world,ids,options);
  if(!result.ok)return result;
  const gone=new Set(result.structures.map(s=>s.id));
  for(const s of result.structures)if(s.kind==='stand')forgetMarketStand(world,s.id);
  world.structures=world.structures.filter(s=>!gone.has(s.id));
  world.wood-=result.woodDelta;world.wallet-=result.coinsDelta;
  changed(world);
  return {...result,message:'選んだ建物を片付け、'+costText(-result.woodDelta,-result.coinsDelta)+'を回収しました。'};
}

export function removeStructure(world,id){
  if(world.structures.some(s=>s.parentId===id))return fail('この部材がほかの部材を支えています。屋根、壁、柱、板床の順で外してください。');
  return removeStructureGroup(world,[id]);
}
// Check sight up to the near side of the object. Probing its centre would test
// the closed lid or the counter itself as a wall between the visitor and it.
function visibleEdge(p,s,edge) {
  const d=buildDistance(p,s), u=Math.min(1,edge/Math.max(d,.001));
  return clearHandReach(p,{x:s.x+u*wrapDelta(p.x-s.x),z:s.z+u*wrapDelta(p.z-s.z),y:s.y});
}
export function nearBuildStructure(world,p,kind) {
  if(!onFoot(p))return null;
  let best=null, distance=Infinity;
  for(const s of world.structures) {
    if((kind ? s.kind!==kind : !['camp','chest','stand'].includes(s.kind)) || Math.abs(p.y-s.y)>1.05)continue;
    const d=buildDistance(p,s),def=BUILD_MODULES[s.kind];
    if(d>=distance || d>Math.hypot(def.width,def.depth)*.5+1.6)continue;
    const c=Math.cos(s.yaw),sn=Math.sin(s.yaw),dx=wrapDelta(p.x-s.x),dz=wrapDelta(p.z-s.z);
    const u=Math.abs(dx*c-dz*sn),v=Math.abs(dx*sn+dz*c);
    // Stop just before the actual edge along the line to the traveller. A
    // circumscribed circle can skip the cabin's rear wall on the narrow side.
    const edge=d ? .09+d/Math.max(2*u/def.width,2*v/def.depth) : 0;
    if(d<=edge+1.6 && visibleEdge(p,s,edge)) {best=s;distance=d;}
  }
  return best;
}
export function buyTimber(world,site) {
  if(!['market-grocer','terraces-farmer'].includes(site?.id))return fail('棚田の米売り場か蔵町の菜の露店で買えます。');
  if(world.wallet<6 || world.wood+4>MAX_WOOD)return fail('木材四本を受け取る空きと六文を用意してください。');
  world.wood+=4;world.wallet-=6;
  return ok('木材四本を六文で買いました。');
}
export function fellTree(world,id) {
  if(!timberTree(id) || world.felledTrees.includes(id))return fail('この木はすでに伐り終えています。');
  if(!Number.isSafeInteger(world.wood+6))return fail('これ以上の木材は記録できません。');
  world.felledTrees=[...world.felledTrees,id];world.wood+=6;
  changed(world);
  return ok('木を伐り、木材を六本取りました。');
}
export function transferStorage(world,chestId,id,grams,deposit) {
  const chest=world.structures.find(s=>s.id===chestId && s.kind==='chest');
  if(!chest || !Object.hasOwn(RESOURCES,id) || !Number.isSafeInteger(grams) || grams<=0 || typeof deposit!=='boolean')return fail('食材と分量を確かめてください。');
  const src=deposit?world:chest,dest=deposit?chest:world;
  const have=src.inventory[id]??0,to=dest.inventory[id]??0;
  if(have<grams || to+grams>RESOURCES[id].limit)return fail('分量が足りないか、受け取り先がいっぱいです。');
  const paid=src.costs[id]??0,cost=Math.floor(paid*grams/have);
  src.inventory[id]=have-grams;src.costs[id]=paid-cost;
  dest.inventory[id]=to+grams;dest.costs[id]=(dest.costs[id]??0)+cost;
  return ok(RESOURCES[id].name+grams+' gを'+(deposit?'預けました。':'取り出しました。'));
}
export function transferBatchStorage(world,chestId,id,quantity,deposit) {
  const chest=world.structures.find(s=>s.id===chestId && s.kind==='chest');
  if(!chest || !Number.isSafeInteger(quantity) || quantity<=0 || typeof deposit!=='boolean')return fail('餅と個数を確かめてください。');
  const src=deposit?world:chest,dest=deposit?chest:world;
  const b=src.batches.find(b=>b.id===id),existing=dest.batches.find(b=>b.id===id);
  if(!b || quantity>b.quantity || (existing?.quantity??0)+quantity>4)return fail('仕込みの残りの個数を確かめてください。');
  if(existing)existing.quantity+=quantity;
  else dest.batches.push({...b,quantity});
  b.quantity-=quantity;
  if(!b.quantity)src.batches.splice(src.batches.indexOf(b),1);
  return ok('餅'+quantity+'個を'+(deposit?'預けました。':'取り出しました。'));
}
